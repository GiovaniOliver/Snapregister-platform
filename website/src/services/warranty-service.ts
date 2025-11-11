// Warranty Service - Database Operations

import {
  WarrantyType,
  WarrantyStatus,
  ExpiringWarranty,
  WarrantyExtensionRequest,
  WarrantyExtensionResponse,
} from '@/types/warranty';
import {
  calculateWarrantyEndDate,
  determineWarrantyStatus,
  getWarrantyStatusInfo,
  extendWarranty,
  calculateDaysRemaining,
} from './warranty-calculator';
import { addDays, subDays, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';

/**
 * Get warranties expiring within specified days
 */
export async function getExpiringWarranties(
  userId: string,
  daysAhead: number = 30
): Promise<ExpiringWarranty[]> {
  const today = startOfDay(new Date());
  const futureDate = addDays(today, daysAhead);

  const warranties = await prisma.warrantyContract.findMany({
    where: {
      userId,
      expiryDate: {
        gte: today,
        lte: futureDate,
      },
      status: {
        in: [WarrantyStatus.ACTIVE, WarrantyStatus.EXPIRING_SOON],
      },
    },
    include: {
      product: {
        select: {
          id: true,
          productName: true,
          manufacturer: true,
        },
      },
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });

  return warranties.map((warranty) => {
    const daysRemaining = calculateDaysRemaining(warranty.expiryDate);
    return {
      id: warranty.id,
      productName: warranty.product?.productName || 'Unknown Product',
      manufacturer: warranty.product?.manufacturer || 'Unknown',
      warrantyType: warranty.warrantyType as WarrantyType,
      expiryDate: warranty.expiryDate!,
      daysRemaining: daysRemaining || 0,
      status: warranty.status as WarrantyStatus,
      productId: warranty.productId || undefined,
    };
  });
}

/**
 * Get all warranties for a user with their current status
 */
export async function getUserWarranties(userId: string) {
  const warranties = await prisma.warrantyContract.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          productName: true,
          manufacturer: true,
          category: true,
        },
      },
      notifications: {
        where: {
          status: 'PENDING',
        },
        orderBy: {
          scheduledFor: 'asc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return warranties.map((warranty) => {
    const statusInfo = getWarrantyStatusInfo(
      warranty.startDate,
      warranty.expiryDate,
      warranty.warrantyType as WarrantyType,
      warranty.status === 'CLAIMED',
      warranty.status === 'VOID'
    );

    return {
      ...warranty,
      statusInfo,
      nextNotification: warranty.notifications[0] || null,
    };
  });
}

/**
 * Get warranty status for a specific warranty
 */
export async function getWarrantyStatus(warrantyId: string) {
  const warranty = await prisma.warrantyContract.findUnique({
    where: { id: warrantyId },
    include: {
      product: true,
    },
  });

  if (!warranty) {
    throw new Error('Warranty not found');
  }

  const statusInfo = getWarrantyStatusInfo(
    warranty.startDate,
    warranty.expiryDate,
    warranty.warrantyType as WarrantyType,
    warranty.status === 'CLAIMED',
    warranty.status === 'VOID'
  );

  return {
    warranty,
    statusInfo,
  };
}

/**
 * Extend an existing warranty
 */
export async function extendWarrantyContract(
  request: WarrantyExtensionRequest
): Promise<WarrantyExtensionResponse> {
  const { warrantyId, extensionMonths, notes } = request;

  try {
    const warranty = await prisma.warrantyContract.findUnique({
      where: { id: warrantyId },
    });

    if (!warranty) {
      return {
        success: false,
        warranty: null as any,
        message: 'Warranty not found',
      };
    }

    if (warranty.warrantyType === 'LIFETIME') {
      return {
        success: false,
        warranty: null as any,
        message: 'Lifetime warranties cannot be extended',
      };
    }

    const { newExpiryDate, originalEndDate, extendedBy } = extendWarranty(
      warranty.expiryDate,
      extensionMonths,
      warranty.warrantyType as WarrantyType
    );

    const updatedWarranty = await prisma.warrantyContract.update({
      where: { id: warrantyId },
      data: {
        expiryDate: newExpiryDate,
        originalEndDate: originalEndDate || warranty.originalEndDate,
        extendedBy: (warranty.extendedBy || 0) + extendedBy,
        extensionDate: new Date(),
        renewalCount: warranty.renewalCount + 1,
        status: determineWarrantyStatus(
          newExpiryDate,
          warranty.warrantyType as WarrantyType
        ),
        updatedAt: new Date(),
      },
      include: {
        product: true,
      },
    });

    return {
      success: true,
      warranty: updatedWarranty as any,
      message: `Warranty extended by ${extensionMonths} months`,
    };
  } catch (error) {
    console.error('Error extending warranty:', error);
    return {
      success: false,
      warranty: null as any,
      message: 'Failed to extend warranty',
    };
  }
}

/**
 * Update warranty statuses (run as background job)
 */
export async function updateWarrantyStatuses(): Promise<{
  updated: number;
  errors: number;
}> {
  let updated = 0;
  let errors = 0;

  try {
    // Get all active warranties
    const warranties = await prisma.warrantyContract.findMany({
      where: {
        warrantyType: {
          not: 'LIFETIME',
        },
        expiryDate: {
          not: null,
        },
      },
    });

    for (const warranty of warranties) {
      try {
        const newStatus = determineWarrantyStatus(
          warranty.expiryDate,
          warranty.warrantyType as WarrantyType,
          warranty.status === 'CLAIMED',
          warranty.status === 'VOID'
        );

        // Only update if status changed
        if (newStatus !== warranty.status) {
          await prisma.warrantyContract.update({
            where: { id: warranty.id },
            data: { status: newStatus },
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error updating warranty ${warranty.id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  } catch (error) {
    console.error('Error updating warranty statuses:', error);
    return { updated, errors: errors + 1 };
  }
}

/**
 * Get warranties that need notifications today
 */
export async function getWarrantiesNeedingNotification(
  notificationDays: number[] = [90, 30, 7, 1]
): Promise<
  Array<{
    warranty: any;
    daysUntilExpiry: number;
  }>
> {
  const today = startOfDay(new Date());
  const results: Array<{ warranty: any; daysUntilExpiry: number }> = [];

  for (const days of notificationDays) {
    const targetDate = addDays(today, days);
    const targetDateEnd = addDays(targetDate, 1);

    const warranties = await prisma.warrantyContract.findMany({
      where: {
        expiryDate: {
          gte: targetDate,
          lt: targetDateEnd,
        },
        status: {
          in: [WarrantyStatus.ACTIVE, WarrantyStatus.EXPIRING_SOON],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            notificationsEnabled: true,
          },
        },
        product: {
          select: {
            id: true,
            productName: true,
            manufacturer: true,
          },
        },
        notifications: {
          where: {
            scheduledFor: {
              gte: subDays(today, 1), // Check if already notified recently
              lte: addDays(today, 1),
            },
            status: 'SENT',
          },
        },
      },
    });

    // Filter out warranties that already have a recent notification
    const needingNotification = warranties.filter(
      (w) => w.notifications.length === 0 && w.user.notificationsEnabled
    );

    results.push(
      ...needingNotification.map((warranty) => ({
        warranty,
        daysUntilExpiry: days,
      }))
    );
  }

  return results;
}

/**
 * Get warranty dashboard statistics
 */
export async function getWarrantyDashboardStats(userId: string) {
  const [total, active, expiringSoon, expired, lifetime] = await Promise.all([
    prisma.warrantyContract.count({
      where: { userId },
    }),
    prisma.warrantyContract.count({
      where: {
        userId,
        status: WarrantyStatus.ACTIVE,
      },
    }),
    prisma.warrantyContract.count({
      where: {
        userId,
        status: WarrantyStatus.EXPIRING_SOON,
      },
    }),
    prisma.warrantyContract.count({
      where: {
        userId,
        status: WarrantyStatus.EXPIRED,
      },
    }),
    prisma.warrantyContract.count({
      where: {
        userId,
        status: WarrantyStatus.LIFETIME,
      },
    }),
  ]);

  return {
    total,
    active,
    expiringSoon,
    expired,
    lifetime,
  };
}

/**
 * Get user's warranty notification preferences
 */
export async function getWarrantyPreferences(userId: string) {
  let preferences = await prisma.warrantyPreferences.findUnique({
    where: { userId },
  });

  // Create default preferences if not exists
  if (!preferences) {
    preferences = await prisma.warrantyPreferences.create({
      data: {
        userId,
      },
    });
  }

  return preferences;
}

/**
 * Update user's warranty notification preferences
 */
export async function updateWarrantyPreferences(
  userId: string,
  updates: Partial<{
    emailEnabled: boolean;
    inAppEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    reminder90Days: boolean;
    reminder30Days: boolean;
    reminder7Days: boolean;
    reminder1Day: boolean;
    customDays: number[];
    dailyDigest: boolean;
    weeklyDigest: boolean;
    monthlyDigest: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
    timezone: string;
    autoRenewReminder: boolean;
    lifetimeWarrantyReminder: boolean;
  }>
) {
  const customDaysJson = updates.customDays
    ? JSON.stringify(updates.customDays)
    : undefined;

  const updatedPreferences = await prisma.warrantyPreferences.upsert({
    where: { userId },
    update: {
      ...updates,
      customDays: customDaysJson,
      updatedAt: new Date(),
    },
    create: {
      userId,
      ...updates,
      customDays: customDaysJson,
    },
  });

  return updatedPreferences;
}
