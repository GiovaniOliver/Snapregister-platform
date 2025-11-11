/**
 * Image Upload Service for SnapRegister Mobile App
 * Handles image compression, upload with progress tracking, and retry logic
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { getAuthToken, clearAuthToken, ApiError } from './api';
import { API_URL } from '../config/api';
import { MultiImageCapture, ProductAnalysisResult } from '../types';

// Configuration constants
const IMAGE_CONFIG = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
  QUALITY: 0.8,
  COMPRESS_FORMAT: ImageManipulator.SaveFormat.JPEG,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for progress tracking
};

const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
};

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Upload result interface
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Analysis result with upload tracking
export interface AnalysisResult {
  success: boolean;
  data?: ProductAnalysisResult;
  error?: string;
  uploadedImages?: {
    serialNumber?: boolean;
    warrantyCard?: boolean;
    receipt?: boolean;
    product?: boolean;
  };
}

/**
 * Get file size from URI
 */
const getFileSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Image Service] Error getting file size:', error);
    }
    return 0;
  }
};

/**
 * Compress image to reduce file size and optimize for upload
 */
export const compressImage = async (
  imageUri: string,
  quality: number = IMAGE_CONFIG.QUALITY
): Promise<string> => {
  try {
    if (__DEV__) {
      console.log('[Image Service] Compressing image:', imageUri);
    }

    // Get original file size
    const originalSize = await getFileSize(imageUri);

    // Manipulate image - resize and compress
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: IMAGE_CONFIG.MAX_WIDTH,
            height: IMAGE_CONFIG.MAX_HEIGHT,
          },
        },
      ],
      {
        compress: quality,
        format: IMAGE_CONFIG.COMPRESS_FORMAT,
      }
    );

    // Get compressed file size
    const compressedSize = await getFileSize(manipulatedImage.uri);

    if (__DEV__) {
      const reduction = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : 0;
      console.log('[Image Service] Compression complete:', {
        original: `${(originalSize / 1024).toFixed(0)}KB`,
        compressed: `${(compressedSize / 1024).toFixed(0)}KB`,
        reduction: `${reduction}%`,
      });
    }

    return manipulatedImage.uri;
  } catch (error) {
    if (__DEV__) {
      console.error('[Image Service] Compression error:', error);
    }
    // If compression fails, return original URI
    return imageUri;
  }
};

/**
 * Validate image before upload
 */
const validateImage = async (uri: string): Promise<void> => {
  const fileSize = await getFileSize(uri);

  if (fileSize === 0) {
    throw new Error('Image file not found or is empty');
  }

  if (fileSize > IMAGE_CONFIG.MAX_FILE_SIZE) {
    throw new Error(
      `Image file too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${IMAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Check if file is accessible
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('Image file does not exist');
  }
};

/**
 * Extract file extension and MIME type from URI
 */
const getFileInfo = (uri: string): { extension: string; mimeType: string } => {
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
  return { extension, mimeType };
};

/**
 * Upload single image with retry logic
 */
export const uploadSingleImage = async (
  imageUri: string,
  fieldName: string,
  onProgress?: UploadProgressCallback
): Promise<ImageUploadResult> => {
  try {
    // Validate image
    await validateImage(imageUri);

    // Compress image
    onProgress?.(10);
    const compressedUri = await compressImage(imageUri);
    onProgress?.(20);

    const { extension, mimeType } = getFileInfo(compressedUri);
    const fileName = `${fieldName}_${Date.now()}.${extension}`;

    // Create form data
    const formData = new FormData();
    formData.append(fieldName, {
      uri: compressedUri,
      name: fileName,
      type: mimeType,
    } as any);

    onProgress?.(30);

    // Get auth token
    const token = await getAuthToken();

    // Upload with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        onProgress?.(90);

        const data = await response.json();

        if (!response.ok) {
          throw new ApiError(
            data.error || `Upload failed: ${response.statusText}`,
            response.status,
            data
          );
        }

        onProgress?.(100);

        return {
          success: true,
          url: data.url,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          break;
        }

        // Retry with exponential backoff
        if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
          const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
          if (__DEV__) {
            console.log(`[Image Service] Retrying upload (${attempt + 1}/${RETRY_CONFIG.MAX_ATTEMPTS}) after ${delay}ms`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Upload failed after multiple attempts');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    if (__DEV__) {
      console.error('[Image Service] Upload error:', errorMessage);
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Upload multiple images and analyze with warranty API
 */
export const uploadAndAnalyzeImages = async (
  images: MultiImageCapture,
  onProgress?: UploadProgressCallback
): Promise<AnalysisResult> => {
  try {
    if (__DEV__) {
      const imageCount = Object.values(images).filter(Boolean).length;
      console.log(`[Image Service] Uploading and analyzing ${imageCount} images`);
    }

    // Validate at least one image is provided
    const imageCount = Object.values(images).filter(Boolean).length;
    if (imageCount === 0) {
      throw new Error('At least one image is required for analysis');
    }

    // Track progress
    let currentProgress = 0;
    const progressPerImage = 80 / imageCount; // Reserve 20% for API call

    // Compress all images first
    const compressedImages: MultiImageCapture = {};
    const imageKeys: (keyof MultiImageCapture)[] = [
      'serialNumberImage',
      'warrantyCardImage',
      'receiptImage',
      'productImage',
    ];

    for (const key of imageKeys) {
      if (images[key]) {
        try {
          await validateImage(images[key]!);
          compressedImages[key] = await compressImage(images[key]!);
          currentProgress += progressPerImage * 0.5;
          onProgress?.(Math.min(currentProgress, 40));
        } catch (error) {
          if (__DEV__) {
            console.error(`[Image Service] Error processing ${key}:`, error);
          }
          throw new Error(`Failed to process ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Create form data with all images
    const formData = new FormData();
    const uploadedImages = {
      serialNumber: false,
      warrantyCard: false,
      receipt: false,
      product: false,
    };

    const addImageToForm = (fieldName: string, imageUri?: string) => {
      if (imageUri) {
        const { extension, mimeType } = getFileInfo(imageUri);
        formData.append(fieldName, {
          uri: imageUri,
          name: `${fieldName}_${Date.now()}.${extension}`,
          type: mimeType,
        } as any);

        // Mark as uploaded
        const key = fieldName.replace('Image', '') as keyof typeof uploadedImages;
        if (key in uploadedImages) {
          uploadedImages[key] = true;
        }
      }
    };

    addImageToForm('serialNumberImage', compressedImages.serialNumberImage);
    addImageToForm('warrantyCardImage', compressedImages.warrantyCardImage);
    addImageToForm('receiptImage', compressedImages.receiptImage);
    addImageToForm('productImage', compressedImages.productImage);

    currentProgress = 50;
    onProgress?.(currentProgress);

    // Get auth token
    const token = await getAuthToken();

    // Upload and analyze with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
      try {
        if (__DEV__) {
          console.log(`[Image Service] Analyzing images (attempt ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS})`);
        }

        const fullUrl = `${API_URL}/warranty/analyze`;

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        currentProgress = 90;
        onProgress?.(currentProgress);

        // Parse response
        const data = await response.json();

        // Handle authentication errors
        if (response.status === 401) {
          await clearAuthToken();
          throw new ApiError('Authentication required. Please log in again.', 401, data);
        }

        // Handle other HTTP errors
        if (!response.ok) {
          throw new ApiError(
            data.error || `Analysis failed: ${response.statusText}`,
            response.status,
            data
          );
        }

        // Validate response structure
        if (!data.success || !data.data) {
          throw new Error(data.error || 'Invalid response from server');
        }

        onProgress?.(100);

        if (__DEV__) {
          console.log('[Image Service] Analysis successful:', {
            brand: data.data.brand,
            model: data.data.model,
            confidence: data.data.confidence,
          });
        }

        return {
          success: true,
          data: data.data as ProductAnalysisResult,
          uploadedImages,
        };

      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except timeout
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408) {
          break;
        }

        // Retry with exponential backoff
        if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
          const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
          if (__DEV__) {
            console.log(`[Image Service] Retrying analysis (${attempt + 1}/${RETRY_CONFIG.MAX_ATTEMPTS}) after ${delay}ms`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Analysis failed after multiple attempts');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
    if (__DEV__) {
      console.error('[Image Service] Analysis error:', errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Batch compress multiple images
 */
export const compressMultipleImages = async (
  images: MultiImageCapture,
  onProgress?: UploadProgressCallback
): Promise<MultiImageCapture> => {
  const compressed: MultiImageCapture = {};
  const imageEntries = Object.entries(images).filter(([_, uri]) => uri);
  const totalImages = imageEntries.length;

  for (let i = 0; i < imageEntries.length; i++) {
    const [key, uri] = imageEntries[i];
    if (uri) {
      compressed[key as keyof MultiImageCapture] = await compressImage(uri);
      const progress = ((i + 1) / totalImages) * 100;
      onProgress?.(progress);
    }
  }

  return compressed;
};

/**
 * Export the image service
 */
export const imageService = {
  compressImage,
  uploadSingleImage,
  uploadAndAnalyzeImages,
  compressMultipleImages,
  validateImage,
  getFileSize,
};

export default imageService;
