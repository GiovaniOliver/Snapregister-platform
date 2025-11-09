// Device Information Service
// Database operations for device info

import { PrismaClient, DeviceInfo as PrismaDeviceInfo } from '@prisma/client';
import { DeviceInfo } from '@/types/device';
import prisma from '@/lib/prisma';

export class DeviceService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Find device by fingerprint
   */
  async findByFingerprint(fingerprint: string): Promise<PrismaDeviceInfo | null> {
    return this.prisma.deviceInfo.findUnique({
      where: { deviceFingerprint: fingerprint }
    });
  }

  /**
   * Create new device info record
   */
  async create(deviceInfo: Partial<DeviceInfo>): Promise<PrismaDeviceInfo> {
    if (!deviceInfo.deviceFingerprint || !deviceInfo.userAgent) {
      throw new Error('Device fingerprint and user agent are required');
    }

    return this.prisma.deviceInfo.create({
      data: {
        deviceFingerprint: deviceInfo.deviceFingerprint,
        userAgent: deviceInfo.userAgent,
        browserName: deviceInfo.browserName,
        browserVersion: deviceInfo.browserVersion,
        browserEngine: deviceInfo.browserEngine,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        osPlatform: deviceInfo.osPlatform,
        deviceType: deviceInfo.deviceType || 'UNKNOWN',
        deviceVendor: deviceInfo.deviceVendor,
        deviceModel: deviceInfo.deviceModel,
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight,
        screenPixelRatio: deviceInfo.screenPixelRatio,
        colorDepth: deviceInfo.colorDepth,
        touchSupport: deviceInfo.touchSupport || false,
        javaScriptEnabled: deviceInfo.javaScriptEnabled ?? true,
        cookiesEnabled: deviceInfo.cookiesEnabled ?? true,
        connectionType: deviceInfo.connectionType,
        effectiveType: deviceInfo.effectiveType,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language,
        country: deviceInfo.country,
        metadata: deviceInfo.metadata ? JSON.stringify(deviceInfo.metadata) : null
      }
    });
  }

  /**
   * Update device last seen timestamp
   */
  async updateLastSeen(id: string): Promise<PrismaDeviceInfo> {
    return this.prisma.deviceInfo.update({
      where: { id },
      data: { lastSeen: new Date() }
    });
  }

  /**
   * Find or create device info
   */
  async findOrCreate(deviceInfo: Partial<DeviceInfo>): Promise<PrismaDeviceInfo> {
    if (!deviceInfo.deviceFingerprint) {
      throw new Error('Device fingerprint is required');
    }

    const existing = await this.findByFingerprint(deviceInfo.deviceFingerprint);

    if (existing) {
      return this.updateLastSeen(existing.id);
    }

    return this.create(deviceInfo);
  }

  /**
   * Get device statistics
   */
  async getStatistics(): Promise<{
    totalDevices: number;
    byType: Record<string, number>;
    byOS: Record<string, number>;
    byBrowser: Record<string, number>;
  }> {
    const devices = await this.prisma.deviceInfo.findMany({
      select: {
        deviceType: true,
        osName: true,
        browserName: true
      }
    });

    const byType: Record<string, number> = {};
    const byOS: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};

    devices.forEach(device => {
      // Count by type
      byType[device.deviceType] = (byType[device.deviceType] || 0) + 1;

      // Count by OS
      if (device.osName) {
        byOS[device.osName] = (byOS[device.osName] || 0) + 1;
      }

      // Count by browser
      if (device.browserName) {
        byBrowser[device.browserName] = (byBrowser[device.browserName] || 0) + 1;
      }
    });

    return {
      totalDevices: devices.length,
      byType,
      byOS,
      byBrowser
    };
  }

  /**
   * Get devices by type
   */
  async getByType(deviceType: string): Promise<PrismaDeviceInfo[]> {
    return this.prisma.deviceInfo.findMany({
      where: { deviceType: deviceType as any }
    });
  }

  /**
   * Get recently seen devices
   */
  async getRecentDevices(limit: number = 10): Promise<PrismaDeviceInfo[]> {
    return this.prisma.deviceInfo.findMany({
      orderBy: { lastSeen: 'desc' },
      take: limit
    });
  }

  /**
   * Delete old device records (cleanup)
   */
  async deleteOldDevices(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.deviceInfo.deleteMany({
      where: {
        lastSeen: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}

// Export singleton instance
export const deviceService = new DeviceService();
