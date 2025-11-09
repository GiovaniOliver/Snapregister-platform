// Warranty System Type Definitions

export enum WarrantyType {
  LIMITED = 'LIMITED',
  EXTENDED = 'EXTENDED',
  LIFETIME = 'LIFETIME',
  MANUFACTURER = 'MANUFACTURER',
  RETAIL_PROTECTION = 'RETAIL_PROTECTION',
  THIRD_PARTY = 'THIRD_PARTY',
}

export enum WarrantyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  CLAIMED = 'CLAIMED',
  VOID = 'VOID',
  LIFETIME = 'LIFETIME',
}

export enum WarrantyNotificationType {
  EXPIRY_90_DAYS = 'EXPIRY_90_DAYS',
  EXPIRY_30_DAYS = 'EXPIRY_30_DAYS',
  EXPIRY_7_DAYS = 'EXPIRY_7_DAYS',
  EXPIRY_1_DAY = 'EXPIRY_1_DAY',
  EXPIRED = 'EXPIRED',
  RENEWAL_AVAILABLE = 'RENEWAL_AVAILABLE',
  CLAIM_REMINDER = 'CLAIM_REMINDER',
  CUSTOM = 'CUSTOM',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export interface WarrantyContract {
  id: string;
  userId: string;
  productId?: string;

  // Document Information
  documentUrl: string;
  documentType: string;
  fileName: string;
  fileSize: number;

  // Warranty Details
  duration?: string;
  durationMonths?: number;
  startDate?: Date;
  expiryDate?: Date;
  warrantyType: WarrantyType;
  status: WarrantyStatus;

  // Coverage
  coverageItems: string[];
  exclusions: string[];
  limitations: string[];

  // Claim Information
  claimProcedure?: string;
  claimContacts: {
    phone?: string;
    email?: string;
    website?: string;
  };
  requiredDocs: string[];

  // Extension/Renewal
  originalEndDate?: Date;
  extendedBy?: number;
  extensionDate?: Date;
  renewalCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyNotification {
  id: string;
  warrantyId: string;
  type: WarrantyNotificationType;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  message: string;
  attempts: number;
  error?: string;
}

export interface WarrantyPreferences {
  id: string;
  userId: string;

  // Notification Preferences
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Custom Reminder Schedule
  reminder90Days: boolean;
  reminder30Days: boolean;
  reminder7Days: boolean;
  reminder1Day: boolean;
  customDays?: number[];

  // Digest Settings
  dailyDigest: boolean;
  weeklyDigest: boolean;
  monthlyDigest: boolean;

  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  timezone: string;

  // Additional Settings
  autoRenewReminder: boolean;
  lifetimeWarrantyReminder: boolean;
}

export interface WarrantyStatusInfo {
  status: WarrantyStatus;
  daysRemaining: number | null;
  expiryDate: Date | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isLifetime: boolean;
}

export interface ExpiringWarranty {
  id: string;
  productName: string;
  manufacturer: string;
  warrantyType: WarrantyType;
  expiryDate: Date;
  daysRemaining: number;
  status: WarrantyStatus;
  productId?: string;
}

export interface WarrantyExtensionRequest {
  warrantyId: string;
  extensionMonths: number;
  notes?: string;
}

export interface WarrantyExtensionResponse {
  success: boolean;
  warranty: WarrantyContract;
  message: string;
}

export interface NotificationSchedule {
  warrantyId: string;
  notifications: {
    type: WarrantyNotificationType;
    scheduledFor: Date;
    daysBeforeExpiry: number;
  }[];
}
