/**
 * Local Storage Service for Development
 * Provides a fallback for image storage when Bunny CDN is not configured
 * Saves files to the public/uploads directory
 */

import fs from 'fs/promises';
import path from 'path';

interface LocalUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

class LocalStorage {
  private uploadsDir: string;
  private publicPath: string;

  constructor() {
    // Store files in public/uploads directory
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    this.publicPath = '/uploads';
  }

  /**
   * Ensure uploads directory exists
   */
  private async ensureUploadsDir(folder?: string): Promise<string> {
    const fullPath = folder
      ? path.join(this.uploadsDir, folder)
      : this.uploadsDir;

    try {
      await fs.mkdir(fullPath, { recursive: true });
      return fullPath;
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      throw new Error('Failed to create uploads directory');
    }
  }

  /**
   * Upload a file to local storage
   * @param file - File buffer or base64 string
   * @param fileName - Name for the file in storage
   * @param folder - Optional folder path (e.g., 'products', 'users/123')
   */
  async uploadFile(
    file: Buffer | string,
    fileName: string,
    folder?: string
  ): Promise<LocalUploadResult> {
    try {
      // Convert base64 to buffer if needed
      let fileBuffer: Buffer;
      if (typeof file === 'string') {
        // Remove data URL prefix if present
        const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = file;
      }

      // Ensure directory exists
      const uploadDir = await this.ensureUploadsDir(folder);

      // Construct the file path
      const filePath = path.join(uploadDir, fileName);
      const relativePath = folder ? `${folder}/${fileName}` : fileName;

      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Construct the public URL
      const publicUrl = `${this.publicPath}/${relativePath}`;

      console.log(`[Local Storage] File saved: ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        fileName: relativePath,
      };
    } catch (error) {
      console.error('Local storage upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: Array<{ file: Buffer | string; fileName: string }>,
    folder?: string
  ): Promise<LocalUploadResult[]> {
    const uploads = files.map((f) => this.uploadFile(f.file, f.fileName, folder));
    return Promise.all(uploads);
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Local storage delete error:', error);
      return false;
    }
  }

  /**
   * Get a file's public URL
   */
  getPublicUrl(filePath: string): string {
    return `${this.publicPath}/${filePath}`;
  }

  /**
   * Generate a unique filename
   */
  generateFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop() || 'jpg';
    const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '-');

    return prefix
      ? `${prefix}-${timestamp}-${random}.${ext}`
      : `${timestamp}-${random}-${safeName}`;
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const localStorage = new LocalStorage();

// Export class for testing
export { LocalStorage };
