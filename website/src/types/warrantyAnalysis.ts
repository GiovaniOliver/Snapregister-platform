/**
 * TypeScript types for AI-powered warranty analysis
 */

export enum WarrantyAnalysisStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
  REANALYZING = 'REANALYZING',
}

export interface ClaimContact {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface CriticalDate {
  date: string | Date;
  description: string;
  type: 'registration_deadline' | 'expiry' | 'inspection_required' | 'other';
}

export interface WarrantyHighlight {
  text: string;
  category: 'critical' | 'warning' | 'info';
  icon: string;
  importance: number;
}

export interface WarrantyAnalysis {
  id: string;
  status: WarrantyAnalysisStatus;
  confidence_score?: number;

  // Document Info
  document_url: string;
  document_type: string;
  file_name: string;
  file_size: number;

  // Extracted Text
  contract_text?: string;
  ocr_confidence?: number;

  // AI Analysis
  ai_summary?: string;

  // Warranty Details
  duration?: string;
  duration_months?: number;
  start_date?: Date | string;
  expiry_date?: Date | string;

  // Coverage
  coverage_items: string[];
  exclusions: string[];
  limitations: string[];

  // Claims
  claim_procedure?: string;
  claim_contacts: ClaimContact;
  required_docs: string[];

  // Important Dates
  critical_dates: CriticalDate[];

  // Additional Terms
  transferable?: boolean;
  extended_options?: string;

  // Highlights
  critical_highlights: WarrantyHighlight[];
  warning_highlights: WarrantyHighlight[];
  info_highlights: WarrantyHighlight[];

  // Metadata
  ai_model: string;
  analysis_date: Date | string;
  error_message?: string;

  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;
}

export interface WarrantyAnalysisRequest {
  file: File;
  user_id: string;
  product_id?: string;
}

export interface WarrantyAnalysisError {
  error: string;
  detail?: string;
  status_code?: number;
}
