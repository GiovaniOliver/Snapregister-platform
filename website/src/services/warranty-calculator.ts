// Warranty Expiration Calculator Service

import {
  WarrantyType,
  WarrantyStatus,
  WarrantyStatusInfo,
  WarrantyNotificationType,
  NotificationSchedule,
} from '@/types/warranty';
import { addMonths, differenceInDays, isAfter, addDays, lastDayOfMonth } from 'date-fns';

/**
 * Calculate warranty end date based on start date and duration
 */
export function calculateWarrantyEndDate(
  startDate: Date,
  durationMonths: number,
  warrantyType: WarrantyType
): Date | null {
  if (warrantyType === WarrantyType.LIFETIME) {
    return null; // Lifetime warranties don't expire
  }

  const baseTargetDate = addMonths(startDate, durationMonths);

  const targetMonthAnchor = new Date(
    baseTargetDate.getFullYear(),
    baseTargetDate.getMonth(),
    1,
    baseTargetDate.getHours(),
    baseTargetDate.getMinutes(),
    baseTargetDate.getSeconds(),
    baseTargetDate.getMilliseconds()
  );

  const lastValidDay = lastDayOfMonth(targetMonthAnchor).getDate();
  const clampedDay = Math.min(startDate.getDate(), lastValidDay);

  const clampedDate = new Date(targetMonthAnchor);
  clampedDate.setDate(clampedDay);

  return clampedDate;
}

/**
 * Calculate days remaining until warranty expiration
 */
export function calculateDaysRemaining(expiryDate: Date | null): number | null {
  if (!expiryDate) {
    return null; // Lifetime warranty
  }

  const today = new Date();
  const days = differenceInDays(expiryDate, today);

  return days;
}

/**
 * Determine warranty status based on expiry date
 */
export function determineWarrantyStatus(
  expiryDate: Date | null,
  warrantyType: WarrantyType,
  isClaimed: boolean = false,
  isVoid: boolean = false
): WarrantyStatus {
  // Check special cases first
  if (isVoid) return WarrantyStatus.VOID;
  if (isClaimed) return WarrantyStatus.CLAIMED;
  if (warrantyType === WarrantyType.LIFETIME) return WarrantyStatus.LIFETIME;

  // No expiry date means active
  if (!expiryDate) return WarrantyStatus.ACTIVE;

  const today = new Date();
  const daysRemaining = calculateDaysRemaining(expiryDate);

  if (daysRemaining === null) {
    return WarrantyStatus.LIFETIME;
  }

  if (daysRemaining < 0) {
    return WarrantyStatus.EXPIRED;
  }

  if (daysRemaining <= 30) {
    return WarrantyStatus.EXPIRING_SOON;
  }

  return WarrantyStatus.ACTIVE;
}

/**
 * Get comprehensive warranty status information
 */
export function getWarrantyStatusInfo(
  startDate: Date | null,
  expiryDate: Date | null,
  warrantyType: WarrantyType,
  isClaimed: boolean = false,
  isVoid: boolean = false
): WarrantyStatusInfo {
  const daysRemaining = calculateDaysRemaining(expiryDate);
  const status = determineWarrantyStatus(expiryDate, warrantyType, isClaimed, isVoid);

  return {
    status,
    daysRemaining,
    expiryDate,
    isExpired: status === WarrantyStatus.EXPIRED,
    isExpiringSoon: status === WarrantyStatus.EXPIRING_SOON,
    isLifetime: status === WarrantyStatus.LIFETIME,
  };
}

/**
 * Calculate notification schedule for a warranty
 */
export function calculateNotificationSchedule(
  warrantyId: string,
  expiryDate: Date | null,
  warrantyType: WarrantyType,
  preferences: {
    reminder90Days: boolean;
    reminder30Days: boolean;
    reminder7Days: boolean;
    reminder1Day: boolean;
    customDays?: number[];
  }
): NotificationSchedule {
  const notifications: NotificationSchedule['notifications'] = [];

  // Lifetime warranties don't need expiry notifications
  if (warrantyType === WarrantyType.LIFETIME || !expiryDate) {
    return { warrantyId, notifications };
  }

  const today = new Date();

  // Standard reminders
  if (preferences.reminder90Days) {
    const scheduledDate = addDays(expiryDate, -90);
    if (isAfter(scheduledDate, today)) {
      notifications.push({
        type: WarrantyNotificationType.EXPIRY_90_DAYS,
        scheduledFor: scheduledDate,
        daysBeforeExpiry: 90,
      });
    }
  }

  if (preferences.reminder30Days) {
    const scheduledDate = addDays(expiryDate, -30);
    if (isAfter(scheduledDate, today)) {
      notifications.push({
        type: WarrantyNotificationType.EXPIRY_30_DAYS,
        scheduledFor: scheduledDate,
        daysBeforeExpiry: 30,
      });
    }
  }

  if (preferences.reminder7Days) {
    const scheduledDate = addDays(expiryDate, -7);
    if (isAfter(scheduledDate, today)) {
      notifications.push({
        type: WarrantyNotificationType.EXPIRY_7_DAYS,
        scheduledFor: scheduledDate,
        daysBeforeExpiry: 7,
      });
    }
  }

  if (preferences.reminder1Day) {
    const scheduledDate = addDays(expiryDate, -1);
    if (isAfter(scheduledDate, today)) {
      notifications.push({
        type: WarrantyNotificationType.EXPIRY_1_DAY,
        scheduledFor: scheduledDate,
        daysBeforeExpiry: 1,
      });
    }
  }

  // Custom reminders
  if (preferences.customDays && preferences.customDays.length > 0) {
    preferences.customDays.forEach((days) => {
      const scheduledDate = addDays(expiryDate, -days);
      if (isAfter(scheduledDate, today)) {
        notifications.push({
          type: WarrantyNotificationType.CUSTOM,
          scheduledFor: scheduledDate,
          daysBeforeExpiry: days,
        });
      }
    });
  }

  // Sort by scheduled date (earliest first)
  notifications.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  return { warrantyId, notifications };
}

/**
 * Extend a warranty by adding months to the expiry date
 */
export function extendWarranty(
  currentExpiryDate: Date | null,
  extensionMonths: number,
  warrantyType: WarrantyType
): {
  newExpiryDate: Date | null;
  originalEndDate: Date | null;
  extendedBy: number;
} {
  if (warrantyType === WarrantyType.LIFETIME) {
    return {
      newExpiryDate: null,
      originalEndDate: null,
      extendedBy: 0,
    };
  }

  if (!currentExpiryDate) {
    throw new Error('Cannot extend warranty without current expiry date');
  }

  const newExpiryDate = addMonths(currentExpiryDate, extensionMonths);

  return {
    newExpiryDate,
    originalEndDate: currentExpiryDate,
    extendedBy: extensionMonths,
  };
}

/**
 * Check if a warranty should trigger a notification today
 */
export function shouldNotifyToday(
  expiryDate: Date | null,
  warrantyType: WarrantyType,
  lastNotificationDate: Date | null,
  notificationType: WarrantyNotificationType
): boolean {
  if (warrantyType === WarrantyType.LIFETIME || !expiryDate) {
    return false;
  }

  const today = new Date();
  const daysRemaining = calculateDaysRemaining(expiryDate);

  if (daysRemaining === null) return false;

  // Don't send if already notified today
  if (lastNotificationDate) {
    const daysSinceLastNotification = differenceInDays(today, lastNotificationDate);
    if (daysSinceLastNotification < 1) {
      return false;
    }
  }

  // Check if we should send based on notification type
  switch (notificationType) {
    case WarrantyNotificationType.EXPIRY_90_DAYS:
      return daysRemaining === 90;
    case WarrantyNotificationType.EXPIRY_30_DAYS:
      return daysRemaining === 30;
    case WarrantyNotificationType.EXPIRY_7_DAYS:
      return daysRemaining === 7;
    case WarrantyNotificationType.EXPIRY_1_DAY:
      return daysRemaining === 1;
    case WarrantyNotificationType.EXPIRED:
      return daysRemaining === 0;
    default:
      return false;
  }
}

/**
 * Parse warranty duration string to months
 */
export function parseDurationToMonths(duration: string): number | null {
  const durationLower = duration.toLowerCase().trim();

  // Handle lifetime
  if (durationLower.includes('lifetime') || durationLower.includes('permanent')) {
    return null;
  }

  // Extract number
  const numberMatch = durationLower.match(/(\d+)/);
  if (!numberMatch) return null;

  const value = parseInt(numberMatch[1], 10);

  // Determine unit
  if (durationLower.includes('year')) {
    return value * 12;
  } else if (durationLower.includes('month')) {
    return value;
  } else if (durationLower.includes('day')) {
    return Math.ceil(value / 30);
  } else if (durationLower.includes('week')) {
    return Math.ceil(value / 4);
  }

  // Default to months if no unit specified
  return value;
}

/**
 * Format warranty status for display
 */
export function formatWarrantyStatus(status: WarrantyStatus): string {
  const statusLabels: Record<WarrantyStatus, string> = {
    [WarrantyStatus.ACTIVE]: 'Active',
    [WarrantyStatus.EXPIRING_SOON]: 'Expiring Soon',
    [WarrantyStatus.EXPIRED]: 'Expired',
    [WarrantyStatus.CLAIMED]: 'Claimed',
    [WarrantyStatus.VOID]: 'Void',
    [WarrantyStatus.LIFETIME]: 'Lifetime',
  };

  return statusLabels[status];
}

/**
 * Get color for warranty status badge
 */
export function getStatusColor(status: WarrantyStatus): string {
  const statusColors: Record<WarrantyStatus, string> = {
    [WarrantyStatus.ACTIVE]: 'green',
    [WarrantyStatus.EXPIRING_SOON]: 'yellow',
    [WarrantyStatus.EXPIRED]: 'red',
    [WarrantyStatus.CLAIMED]: 'blue',
    [WarrantyStatus.VOID]: 'gray',
    [WarrantyStatus.LIFETIME]: 'purple',
  };

  return statusColors[status];
}
