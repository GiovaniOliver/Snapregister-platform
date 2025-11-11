import { uploadFile } from './api';
import { API_ENDPOINTS, API_URL } from '../config/api';
import { AIExtractedData, ProductAnalysisResult, MultiImageCapture } from '../types';
import * as SecureStore from 'expo-secure-store';

export const aiService = {
  // Analyze image and extract device information
  analyzeImage: async (imageUri: string): Promise<AIExtractedData> => {
    const fileName = `scan_${Date.now()}.jpg`;
    const response = await uploadFile(
      API_ENDPOINTS.AI_ANALYZE_IMAGE,
      imageUri,
      fileName
    );
    return response.data.data;
  },

  // Extract text from warranty document
  extractWarrantyInfo: async (imageUri: string): Promise<AIExtractedData> => {
    const fileName = `warranty_${Date.now()}.jpg`;
    const response = await uploadFile(
      API_ENDPOINTS.AI_EXTRACT,
      imageUri,
      fileName,
      { type: 'warranty' }
    );
    return response.data.data;
  },

  // Extract serial number from image
  extractSerialNumber: async (imageUri: string): Promise<string | null> => {
    const fileName = `serial_${Date.now()}.jpg`;
    const response = await uploadFile(
      API_ENDPOINTS.AI_EXTRACT,
      imageUri,
      fileName,
      { type: 'serial' }
    );
    return response.data.data.serialNumber || null;
  },

  // Get product suggestions based on image
  getSuggestedProducts: async (imageUri: string): Promise<any[]> => {
    const fileName = `suggestion_${Date.now()}.jpg`;
    const response = await uploadFile(
      API_ENDPOINTS.AI_ANALYZE_IMAGE,
      imageUri,
      fileName,
      { getSuggestions: true }
    );
    return response.data.data.suggestions || [];
  },

  /**
   * Analyze multiple product images to extract comprehensive product information
   *
   * @param images - Object containing URIs for up to 4 different image types
   * @returns Extracted product information including brand, model, serial number, warranty details, etc.
   */
  analyzeMultipleImages: async (
    images: MultiImageCapture
  ): Promise<ProductAnalysisResult> => {
    // Get stored token
    const token = await SecureStore.getItemAsync('authToken');

    // Create form data
    const formData = new FormData();

    // Helper function to add image to form data
    const addImageToForm = (fieldName: string, imageUri?: string) => {
      if (imageUri) {
        // Extract file extension
        const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        formData.append(fieldName, {
          uri: imageUri,
          name: `${fieldName}_${Date.now()}.${fileExtension}`,
          type: mimeType,
        } as any);
      }
    };

    // Add all provided images to form data
    addImageToForm('serialNumberImage', images.serialNumberImage);
    addImageToForm('warrantyCardImage', images.warrantyCardImage);
    addImageToForm('receiptImage', images.receiptImage);
    addImageToForm('productImage', images.productImage);

    // Build full URL
    const fullUrl = `${API_URL}${API_ENDPOINTS.AI_ANALYZE_PRODUCT}`;

    // Log the request in development
    if (__DEV__) {
      const imageCount = Object.values(images).filter(Boolean).length;
      console.log(`[AI Service] Analyzing ${imageCount} images`);
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      // Parse response
      const data = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        // Handle 401 unauthorized
        if (response.status === 401) {
          await SecureStore.deleteItemAsync('authToken');
          throw new Error('Authentication required. Please log in again.');
        }

        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze images');
      }

      return data.data as ProductAnalysisResult;
    } catch (error) {
      if (__DEV__) {
        console.error('[AI Service] Error analyzing multiple images:', error);
      }
      throw error;
    }
  },
};
