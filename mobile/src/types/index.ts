/**
 * Core Type Definitions for SnapRegister Mobile App
 * This file exports all types used throughout the application
 */

// Re-export all backend-compatible types
export * from './warranty';
export * from './warrantyAnalysis';
export * from './registration';
export * from './device';

// Core data models for SnapRegister mobile app

export interface Product {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  category: string;
  purchaseDate: Date | string;
  purchasePrice?: number;
  retailer?: string;
  imageUrl?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Warranty {
  id: string;
  productId: string;
  provider: string;
  type: 'manufacturer' | 'extended' | 'retailer';
  startDate: Date | string;
  endDate: Date | string;
  coverageDetails?: string;
  terms?: string;
  documentUrl?: string;
  claimInstructions?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Registration {
  id: string;
  productId: string;
  warrantyId?: string;
  registrationNumber?: string;
  registrationDate: Date | string;
  status: 'pending' | 'completed' | 'failed';
  submittedData?: Record<string, any>;
  confirmationDetails?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  plan?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AIExtractedData {
  brand?: string;
  model?: string;
  serialNumber?: string;
  productName?: string;
  category?: string;
  warrantyInfo?: {
    duration?: string;
    startDate?: string;
    endDate?: string;
    terms?: string;
  };
  confidence: number;
  rawText?: string;
}

// Enhanced type for multi-image product analysis
export interface ProductAnalysisResult {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyPeriod: number | null;
  warrantyEndDate: string | null;
  retailer: string | null;
  price: number | null;
  confidence: 'high' | 'medium' | 'low';
  additionalInfo?: string;
  extractedAt: string;
  userId: string;
}

export interface CaptureResult {
  imageUri: string;
  extractedData?: AIExtractedData;
  timestamp: Date;
}

// Multi-image capture result
export interface MultiImageCapture {
  serialNumberImage?: string;
  warrantyCardImage?: string;
  receiptImage?: string;
  productImage?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetails: { productId: string };
  WarrantyDetails: { warrantyId: string };
  CameraCapture: undefined;
  EditProduct: { productId?: string };
  MultiImageCapture: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  About: undefined;
};

export type TabParamList = {
  Home: undefined;
  Scan: undefined;
  Products: undefined;
  Profile: undefined;
};
