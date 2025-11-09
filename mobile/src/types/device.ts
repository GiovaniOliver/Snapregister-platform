/**
 * Device Information Type Definitions
 * Shared types between mobile app and backend API
 */

export enum DeviceType {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
  SMARTTV = 'SMARTTV',
  WEARABLE = 'WEARABLE',
  EMBEDDED = 'EMBEDDED',
  UNKNOWN = 'UNKNOWN',
}

export interface DeviceInfo {
  id?: string;
  deviceFingerprint: string;
  userAgent: string;

  // Browser Information
  browserName?: string;
  browserVersion?: string;
  browserEngine?: string;

  // Operating System
  osName?: string;
  osVersion?: string;
  osPlatform?: string;

  // Device Details
  deviceType: DeviceType;
  deviceVendor?: string;
  deviceModel?: string;

  // Screen Information
  screenWidth?: number;
  screenHeight?: number;
  screenPixelRatio?: number;
  colorDepth?: number;

  // Capabilities
  touchSupport: boolean;
  javaScriptEnabled: boolean;
  cookiesEnabled: boolean;

  // Network Information
  connectionType?: string;
  effectiveType?: string;

  // Location
  timezone?: string;
  language?: string;
  country?: string;

  // Additional Metadata
  metadata?: Record<string, any>;

  // Timestamps
  firstSeen?: Date | string;
  lastSeen?: Date | string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
}

export interface OSInfo {
  name: string;
  version: string;
  platform: string;
}

export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
  colorDepth: number;
  orientation: 'portrait' | 'landscape';
}

export interface NetworkInfo {
  type?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface DeviceCapabilities {
  touch: boolean;
  javascript: boolean;
  cookies: boolean;
  webgl: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  geolocation: boolean;
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
}
