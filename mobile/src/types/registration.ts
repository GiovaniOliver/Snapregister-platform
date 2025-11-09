/**
 * Registration Flow Type Definitions
 * Shared types between mobile app and backend API
 */

export interface UserContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

export interface ProductInfo {
  productName: string;
  manufacturer: string;
  modelNumber?: string;
  serialNumber?: string;
  sku?: string;
  upc?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  retailer?: string;
  category?: string;
}

export interface WarrantyInfo {
  warrantyDuration?: number;
  warrantyStartDate?: string;
  warrantyExpiry?: string;
  warrantyType?: string;
}

export interface DeviceMetadata {
  type: string;
  os: string;
  browser: string;
  model?: string;
}

export interface RegistrationMetadata {
  registrationDate: string;
  registrationId: string;
  source: 'snapregister';
  version: string;
}

export interface ManufacturerDataPackage {
  // Product Information
  product: ProductInfo;

  // User Information
  user: UserContactInfo;

  // Device Information
  device: DeviceMetadata;

  // Registration Metadata
  registration: RegistrationMetadata;

  // Optional Warranty Info
  warranty?: WarrantyInfo;
}

export interface PhotoFiles {
  serialNumber?: File | { uri: string; name: string; type: string };
  warrantyCard?: File | { uri: string; name: string; type: string };
  receipt?: File | { uri: string; name: string; type: string };
  product?: File | { uri: string; name: string; type: string };
}

export interface RegistrationFormData {
  // Step 1: Photos (handled separately)
  photos?: PhotoFiles;

  // Step 2: AI Extracted Data (review)
  extractedData?: ProductInfo;

  // Step 3: User Information
  userInfo?: UserContactInfo;

  // Step 4: Device Info (auto-captured)
  deviceInfo?: string; // Device fingerprint

  // Step 5: Submission options
  submissionMethod?: 'auto' | 'manual' | 'assisted';
}

export enum RegistrationStep {
  PHOTO_CAPTURE = 1,
  DATA_REVIEW = 2,
  USER_INFO = 3,
  DEVICE_CAPTURE = 4,
  SUBMISSION = 5,
}

export interface RegistrationState {
  currentStep: RegistrationStep;
  completedSteps: RegistrationStep[];
  formData: RegistrationFormData;
  isLoading: boolean;
  error?: string;
}

export interface DataPackageExportOptions {
  format: 'json' | 'xml' | 'csv';
  includeDeviceInfo: boolean;
  includePhotos: boolean;
  encryption?: 'none' | 'aes256';
}
