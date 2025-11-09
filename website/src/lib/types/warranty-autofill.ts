/**
 * Type definitions for warranty auto-fill feature
 */

export type CopyFormat = 'FORM_FIELDS' | 'PLAIN_TEXT' | 'JSON';

export interface UserData {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

export interface ProductData {
  productName?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | null;
  retailer?: string | null;
}

export interface FormattedRegistrationData {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  phoneRaw: string;

  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  addressFormatted: string;

  // Product Information
  productName: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  serialNumberRaw: string;
  purchaseDate: string;
  purchaseDateISO: string;
  purchasePrice: string;
  purchasePriceRaw: string;
  retailer: string;
}

export interface CopyFieldConfig {
  label: string;
  value: string;
  key: keyof FormattedRegistrationData;
  section: 'personal' | 'product';
  copyHint?: string; // Hint about where to paste this field
}

export interface FormFieldMapping {
  ourField: keyof FormattedRegistrationData;
  theirFieldName: string;
  theirFieldId?: string;
  theirFieldType?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea';
  theirFieldPlaceholder?: string;
  required?: boolean;
  helpText?: string;
}

export interface FormInstructionStep {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
  fieldsToCopy?: string[]; // Keys of fields to copy in this step
  estimatedTimeSeconds?: number;
  notes?: string;
}

export interface ManufacturerFormTemplate {
  id: string;
  manufacturerId: string;
  manufacturerName?: string;
  formName: string;
  formUrl: string;
  formType: 'WEB_FORM' | 'PDF_FORM' | 'EMAIL_REQUIRED' | 'PHONE_REQUIRED' | 'MAIL_REQUIRED' | 'API_AVAILABLE';

  // Visual Guide
  screenshotUrl?: string;
  videoUrl?: string;

  // Field Mapping
  fieldMappings: FormFieldMapping[];

  // Instructions
  instructions: FormInstructionStep[];

  // Metadata
  lastVerified?: Date | string;
  verifiedWorking: boolean;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedTime: number; // in minutes
  requiresCaptcha: boolean;
  requiresAccount: boolean;

  // Statistics
  timesUsed: number;
  successCount: number;
  failureCount: number;
  avgCompletionTime?: number;

  notes?: string;
}

export interface FormSubmission {
  id: string;
  registrationId: string;
  templateId: string;
  userId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'FAILED';
  currentStep: number;
  totalSteps: number;
  copiedFields: string[];
  startedAt: Date | string;
  completedAt?: Date | string;
  wasHelpful?: boolean;
  difficultyRating?: number;
  feedback?: string;
}

export interface CopyDataSection {
  title: string;
  icon: string;
  fields: CopyFieldConfig[];
}

export interface CopyEvent {
  fieldKey: string;
  fieldLabel: string;
  value: string;
  format: CopyFormat;
  timestamp: Date;
}

export interface FormAssistantState {
  isOpen: boolean;
  currentStep: number;
  template?: ManufacturerFormTemplate;
  submission?: FormSubmission;
  copiedFields: Set<string>;
}

export interface CopyAllOptions {
  format: CopyFormat;
  includeSections: ('personal' | 'product')[];
  separator?: string;
  includeLabels?: boolean;
}

export interface FieldCopyResult {
  success: boolean;
  fieldKey: string;
  error?: string;
}

export interface SubmissionProgress {
  templateId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  copiedFields: string[];
  startedAt: Date;
  estimatedTimeRemaining?: number; // in seconds
}
