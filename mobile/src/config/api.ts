/**
 * API Configuration for SnapRegister Mobile App
 * Defines base URLs and all API endpoints for backend communication
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment variable configuration
const getEnvironment = () => {
  return Constants.expoConfig?.extra?.environment || process.env.ENVIRONMENT || 'dev';
};

// Platform-specific API URL helper
const getPlatformApiUrl = (baseUrl: string): string => {
  // Android emulator needs special localhost mapping
  if (Platform.OS === 'android' && baseUrl.includes('localhost')) {
    return baseUrl.replace('localhost', '10.0.2.2');
  }
  return baseUrl;
};

// Environment-specific base URLs
const API_CONFIG = {
  dev: {
    baseUrl: getPlatformApiUrl(
      process.env.EXPO_PUBLIC_API_URL ||
      process.env.API_URL ||
      (Platform.OS === 'ios' ? 'http://192.168.1.15:3004' : 'http://localhost:3004')
    ),
  },
  staging: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging.snapregister.com',
  },
  prod: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://snapregister.com',
  },
};

// Get current environment config
const getCurrentConfig = () => {
  const env = getEnvironment();
  if (env === 'prod') return API_CONFIG.prod;
  if (env === 'staging') return API_CONFIG.staging;
  return API_CONFIG.dev;
};

// Export base URL
export const API_BASE_URL = getCurrentConfig().baseUrl;
export const API_URL = `${API_BASE_URL}/api`;

// Log configuration in development
if (__DEV__) {
  console.log('[API Config] Environment:', getEnvironment());
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] API URL:', API_URL);
}

/**
 * API Endpoints
 * All endpoints are relative to the API_URL base
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    SESSION: '/auth/session',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_ACCOUNT: '/auth/delete-account',
  },

  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    PRODUCTS: '/user/products',
    UPDATE_PROFILE: '/user/profile',
    UPDATE_SETTINGS: '/user/settings',
  },

  // Products endpoints
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    WARRANTIES: (productId: string) => `/products/${productId}/warranties`,
  },

  // Warranties endpoints
  WARRANTIES: {
    LIST: '/warranties',
    CREATE: '/warranty',
    BY_ID: (id: string) => `/warranty/${id}`,
    UPDATE: (id: string) => `/warranty/${id}`,
    DELETE: (id: string) => `/warranty/${id}`,
    AUTOFILL: '/warranty-autofill',
    ANALYZE: '/warranty/analyze',
  },

  // Registration endpoints
  REGISTRATION: {
    LIST: '/registration',
    CREATE: '/registration',
    BY_ID: (id: string) => `/registration/${id}`,
    UPDATE: (id: string) => `/registration/${id}`,
    DELETE: (id: string) => `/registration/${id}`,
    STATUS: (id: string) => `/registration/${id}/status`,
  },

  // AI Processing endpoints
  AI: {
    EXTRACT: '/ai/extract',
    ANALYZE_IMAGE: '/analyze-product-image',
    ANALYZE_PRODUCT: '/ai/analyze-product',
    DEVICE_INFO: '/device-info',
  },

  // File upload endpoints
  UPLOAD: {
    IMAGE: '/upload/image',
    DOCUMENT: '/upload/document',
  },
};

/**
 * API Request Configuration
 */
export const API_CONFIG_DEFAULTS = {
  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2, // Exponential backoff
  },

  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  VALIDATION_ERROR: 'Invalid data provided.',
  NOT_FOUND: 'Resource not found.',
};

/**
 * Helper function to build full URL
 */
export const buildUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_URL}${endpoint}`;
};

/**
 * Helper function to check if response is successful
 */
export const isSuccessResponse = (status: number): boolean => {
  return status >= 200 && status < 300;
};

export default {
  API_BASE_URL,
  API_URL,
  API_ENDPOINTS,
  API_CONFIG_DEFAULTS,
  HTTP_STATUS,
  API_ERROR_MESSAGES,
  buildUrl,
  isSuccessResponse,
};
