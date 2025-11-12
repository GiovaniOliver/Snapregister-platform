/**
 * Image Upload API Route
 * Handles image uploads to Bunny.net CDN storage
 * 
 * POST /api/upload
 * 
 * Request: multipart/form-data
 * - file: File (required) - Image file to upload
 * - folder: string (optional) - Folder path in storage (e.g., 'avatars', 'products')
 * 
 * Response:
 * {
 *   success: boolean,
 *   url?: string,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { bunnyStorage } from '@/lib/bunny-storage';
import { localStorage } from '@/lib/local-storage';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Expected field named "file"' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${random}.${ext}`;

    // Determine folder based on context
    let uploadFolder = folder;
    if (folder === 'avatars' || folder === 'users') {
      uploadFolder = `users/${session.id}/${folder}`;
    } else if (folder === 'products') {
      uploadFolder = `users/${session.id}/products`;
    } else {
      uploadFolder = `users/${session.id}/${folder}`;
    }

    // Check if Bunny CDN is configured
    const useBunnyCDN = process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_STORAGE_PASSWORD;

    // Upload to Bunny.net or local storage
    const uploadResult = useBunnyCDN
      ? await bunnyStorage.uploadFile(buffer, fileName, uploadFolder)
      : await localStorage.uploadFile(buffer, fileName, uploadFolder);

    if (!uploadResult.success) {
      const storageType = useBunnyCDN ? 'Bunny.net' : 'local storage';
      console.error(`[Upload] ${storageType} upload failed:`, uploadResult.error);
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    if (!useBunnyCDN) {
      console.log('[Upload] Using local storage (Bunny CDN not configured)');
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      fileName: uploadResult.fileName,
    });
  } catch (error) {
    console.error('[Upload] Error processing upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

