/**
 * Bunny CDN Storage Service
 * Handles image uploads and management using Bunny.net Storage API
 */

interface BunnyUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

class BunnyStorage {
  private storageZone: string;
  private apiKey: string;
  private storagePassword: string;
  private region: string;
  private cdnUrl: string;

  constructor() {
    this.storageZone = process.env.BUNNY_STORAGE_ZONE || '';
    this.apiKey = process.env.BUNNY_API_KEY || '';
    this.storagePassword = process.env.BUNNY_STORAGE_PASSWORD || '';
    this.region = process.env.BUNNY_STORAGE_REGION || 'de';
    this.cdnUrl = process.env.BUNNY_CDN_URL || '';

    if (!this.storageZone || !this.apiKey || !this.storagePassword) {
      console.warn('Bunny CDN credentials not configured. Image uploads will fail.');
    }
  }

  /**
   * Get the base URL for the storage API based on region
   */
  private getStorageApiUrl(): string {
    const regionMap: Record<string, string> = {
      de: 'storage.bunnycdn.com',
      ny: 'ny.storage.bunnycdn.com',
      la: 'la.storage.bunnycdn.com',
      sg: 'sg.storage.bunnycdn.com',
      syd: 'syd.storage.bunnycdn.com',
    };

    const baseUrl = regionMap[this.region] || regionMap.de;
    return `https://${baseUrl}`;
  }

  /**
   * Upload a file to Bunny CDN
   * @param file - File buffer or base64 string
   * @param fileName - Name for the file in storage
   * @param folder - Optional folder path (e.g., 'products', 'users/123')
   */
  async uploadFile(
    file: Buffer | string,
    fileName: string,
    folder?: string
  ): Promise<BunnyUploadResult> {
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

      // Construct the file path
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const uploadUrl = `${this.getStorageApiUrl()}/${this.storageZone}/${filePath}`;

      // Upload to Bunny CDN
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: this.storagePassword,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bunny CDN upload failed: ${response.status} - ${errorText}`);
      }

      // Construct the public CDN URL
      const publicUrl = `${this.cdnUrl}/${filePath}`;

      return {
        success: true,
        url: publicUrl,
        fileName: filePath,
      };
    } catch (error) {
      console.error('Bunny CDN upload error:', error);
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
  ): Promise<BunnyUploadResult[]> {
    const uploads = files.map((f) => this.uploadFile(f.file, f.fileName, folder));
    return Promise.all(uploads);
  }

  /**
   * Delete a file from Bunny CDN
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const deleteUrl = `${this.getStorageApiUrl()}/${this.storageZone}/${filePath}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          AccessKey: this.storagePassword,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Bunny CDN delete error:', error);
      return false;
    }
  }

  /**
   * Get a file's public URL
   */
  getPublicUrl(filePath: string): string {
    return `${this.cdnUrl}/${filePath}`;
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
}

// Export singleton instance
export const bunnyStorage = new BunnyStorage();

// Export class for testing
export { BunnyStorage };
