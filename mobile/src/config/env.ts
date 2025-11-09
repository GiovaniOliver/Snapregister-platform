/**
 * Environment Configuration for SnapRegister Mobile App
 * Legacy file - maintained for backward compatibility
 * New code should import from './api' instead
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper function to get platform-specific API URL
const getPlatformApiUrl = (baseUrl: string): string => {
  // If running on Android emulator, replace localhost with 10.0.2.2
  if (Platform.OS === 'android' && baseUrl.includes('localhost')) {
    return baseUrl.replace('localhost', '10.0.2.2');
  }
  return baseUrl;
};

const ENV = {
  dev: {
    // For iOS simulator, use your computer's local IP address
    // For Android emulator, it will automatically use 10.0.2.2
    // Default: Try environment variable, fallback to local IP for iOS
    apiUrl: getPlatformApiUrl(
      process.env.EXPO_PUBLIC_API_URL ||
      process.env.API_URL ||
      (Platform.OS === 'ios' ? 'http://192.168.1.15:3004/api' : 'http://localhost:3004/api')
    ),
    webUrl: getPlatformApiUrl(
      process.env.EXPO_PUBLIC_WEB_URL ||
      process.env.WEB_URL ||
      (Platform.OS === 'ios' ? 'http://192.168.1.15:3004' : 'http://localhost:3004')
    ),
  },
  staging: {
    apiUrl: 'https://staging.snapregister.com/api',
    webUrl: 'https://staging.snapregister.com',
  },
  prod: {
    apiUrl: 'https://snapregister.com/api',
    webUrl: 'https://snapregister.com',
  },
};

const getEnvVars = (env = Constants.expoConfig?.extra?.environment || process.env.ENVIRONMENT || 'dev') => {
  if (env === 'prod') return ENV.prod;
  if (env === 'staging') return ENV.staging;
  return ENV.dev;
};

export default getEnvVars();

// Export individual values for convenience
export const API_URL = getEnvVars().apiUrl;
export const WEB_URL = getEnvVars().webUrl;

// Log the API URL for debugging (only in development)
if (__DEV__) {
  console.log('[ENV Config] Environment:', Constants.expoConfig?.extra?.environment || process.env.ENVIRONMENT || 'dev');
  console.log('[ENV Config] Platform:', Platform.OS);
  console.log('[ENV Config] API URL:', API_URL);
  console.log('[ENV Config] Web URL:', WEB_URL);
}

// API endpoint paths - matching the website's Next.js API routes
// DEPRECATED: Use API_ENDPOINTS from './api' instead
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/signup',
  LOGOUT: '/auth/logout',
  SESSION: '/auth/session',

  // Products endpoints
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,

  // Warranties endpoints
  WARRANTIES: '/warranties',
  WARRANTY: '/warranty',
  WARRANTY_BY_ID: (id: string) => `/warranty/${id}`,
  WARRANTY_AUTOFILL: '/warranty-autofill',
  PRODUCT_WARRANTIES: (productId: string) => `/products/${productId}/warranties`,

  // Registration endpoints
  REGISTRATIONS: '/registration',
  REGISTRATION_BY_ID: (id: string) => `/registration/${id}`,

  // AI Processing endpoints
  AI_EXTRACT: '/ai/extract',
  AI_ANALYZE_IMAGE: '/analyze-product-image',
  AI_ANALYZE_PRODUCT: '/ai/analyze-product',
  DEVICE_INFO: '/device-info',

  // User endpoints
  USER_PROFILE: '/user/profile',
  USER_PRODUCTS: '/user/products',
};
