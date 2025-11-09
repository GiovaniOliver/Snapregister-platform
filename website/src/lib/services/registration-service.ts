// Registration Service
// Business logic for product registration

import { PrismaClient, Registration, Product } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateManufacturerDataPackage, exportAsJSON } from '@/lib/data-package-generator';
import { UserContactInfo, ProductInfo } from '@/types/registration';
import { DeviceInfo } from '@/types/device';
import { deviceService } from './device-service';

export class RegistrationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a complete product registration
   */
  async createRegistration(data: {
    userId: string;
    productInfo: ProductInfo;
    userInfo: UserContactInfo;
    deviceInfo?: Partial<DeviceInfo>;
  }): Promise<{ registration: Registration; product: Product }> {
    const { userId, productInfo, userInfo, deviceInfo } = data;

    // Handle device info
    let deviceRecord = null;
    if (deviceInfo && deviceInfo.deviceFingerprint) {
      deviceRecord = await deviceService.findOrCreate(deviceInfo);
    }

    // Create product record
    const product = await this.prisma.product.create({
      data: {
        userId,
        productName: productInfo.productName,
        manufacturer: productInfo.manufacturer,
        modelNumber: productInfo.modelNumber || null,
        serialNumber: productInfo.serialNumber || null,
        sku: productInfo.sku || null,
        upc: productInfo.upc || null,
        purchaseDate: productInfo.purchaseDate ? new Date(productInfo.purchaseDate) : null,
        purchasePrice: productInfo.purchasePrice || null,
        retailer: productInfo.retailer || null,
        imageUrls: '[]', // Will be populated by photo upload
        extractedData: JSON.stringify(productInfo),
        status: 'READY',
        deviceInfoId: deviceRecord?.id || null
      }
    });

    // Generate data package
    const dataPackage = generateManufacturerDataPackage(
      productInfo,
      userInfo,
      deviceInfo || {}
    );

    // Encrypt contact data
    const contactData = this.encryptContactData(userInfo);

    // Create registration record
    const registration = await this.prisma.registration.create({
      data: {
        productId: product.id,
        userId,
        deviceInfoId: deviceRecord?.id || null,
        registrationMethod: 'AUTOMATION_RELIABLE',
        status: 'PENDING',
        contactData,
        dataPackage: exportAsJSON(dataPackage),
        dataPackageFormat: 'json'
      }
    });

    return { registration, product };
  }

  /**
   * Get registration by ID
   */
  async getRegistration(id: string): Promise<Registration | null> {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        product: true,
        user: true,
        deviceInfo: true,
        manufacturer: true
      }
    });
  }

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: { userId },
      include: {
        product: true,
        manufacturer: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update registration status
   */
  async updateStatus(
    id: string,
    status: string,
    statusMessage?: string
  ): Promise<Registration> {
    return this.prisma.registration.update({
      where: { id },
      data: {
        status: status as any,
        statusMessage,
        completedAt: status === 'SUCCESS' ? new Date() : null
      }
    });
  }

  /**
   * Get registration statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    successRate: number;
  }> {
    const where = userId ? { userId } : {};

    const registrations = await this.prisma.registration.findMany({
      where,
      select: { status: true }
    });

    const byStatus: Record<string, number> = {};
    let successCount = 0;

    registrations.forEach(reg => {
      byStatus[reg.status] = (byStatus[reg.status] || 0) + 1;
      if (reg.status === 'SUCCESS' || reg.status === 'PARTIAL_SUCCESS') {
        successCount++;
      }
    });

    return {
      total: registrations.length,
      byStatus,
      successRate: registrations.length > 0 ? successCount / registrations.length : 0
    };
  }

  /**
   * Export registration data package
   */
  async exportDataPackage(
    registrationId: string,
    format: 'json' | 'xml' | 'csv'
  ): Promise<string> {
    const registration = await this.getRegistration(registrationId);

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (!registration.dataPackage) {
      throw new Error('Data package not available');
    }

    // Parse and re-export in desired format
    const dataPackage = JSON.parse(registration.dataPackage);

    // Import export functions dynamically based on format
    const { exportDataPackage } = await import('@/lib/data-package-generator');

    return exportDataPackage(dataPackage, {
      format,
      includeDeviceInfo: true,
      includePhotos: false
    });
  }

  /**
   * Encrypt contact data (placeholder)
   * TODO: Implement actual encryption using crypto library
   */
  private encryptContactData(userInfo: UserContactInfo): string {
    // In production, implement AES-256 encryption
    // For now, just JSON stringify
    return JSON.stringify(userInfo);
  }

  /**
   * Decrypt contact data (placeholder)
   * TODO: Implement actual decryption
   */
  private decryptContactData(encryptedData: string): UserContactInfo {
    // In production, implement AES-256 decryption
    // For now, just JSON parse
    return JSON.parse(encryptedData);
  }

  /**
   * Mark registration as manually completed
   */
  async markManuallyCompleted(
    id: string,
    confirmationCode?: string
  ): Promise<Registration> {
    return this.prisma.registration.update({
      where: { id },
      data: {
        status: 'USER_COMPLETED',
        confirmationCode,
        userCompletedAt: new Date(),
        completedAt: new Date()
      }
    });
  }

  /**
   * Get pending registrations for automation
   */
  async getPendingRegistrations(limit: number = 10): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: {
        status: 'PENDING',
        automationAttempts: { lt: 3 }
      },
      include: {
        product: true,
        user: true,
        manufacturer: true
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }
}

// Export singleton instance
export const registrationService = new RegistrationService();
