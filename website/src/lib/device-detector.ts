// Device Detection Utility
// Comprehensive client-side device information extraction

import { DeviceInfo, DeviceType, BrowserInfo, OSInfo, ScreenInfo, NetworkInfo, DeviceCapabilities } from '@/types/device';
import crypto from 'crypto';

/**
 * Parse User Agent to extract browser information
 */
export function parseBrowserInfo(userAgent: string): BrowserInfo {
  let name = 'Unknown';
  let version = 'Unknown';
  let engine = 'Unknown';

  // Chrome
  if (/Chrome\/(\d+\.\d+)/.test(userAgent)) {
    name = 'Chrome';
    version = RegExp.$1;
    engine = 'Blink';
  }
  // Firefox
  else if (/Firefox\/(\d+\.\d+)/.test(userAgent)) {
    name = 'Firefox';
    version = RegExp.$1;
    engine = 'Gecko';
  }
  // Safari
  else if (/Safari\/(\d+\.\d+)/.test(userAgent) && !/Chrome/.test(userAgent)) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'WebKit';
  }
  // Edge
  else if (/Edg\/(\d+\.\d+)/.test(userAgent)) {
    name = 'Edge';
    version = RegExp.$1;
    engine = 'Blink';
  }
  // Opera
  else if (/OPR\/(\d+\.\d+)/.test(userAgent)) {
    name = 'Opera';
    version = RegExp.$1;
    engine = 'Blink';
  }

  return { name, version, engine };
}

/**
 * Parse User Agent to extract OS information
 */
export function parseOSInfo(userAgent: string): OSInfo {
  let name = 'Unknown';
  let version = 'Unknown';
  let platform = 'Unknown';

  // Windows
  if (/Windows NT (\d+\.\d+)/.test(userAgent)) {
    name = 'Windows';
    const ntVersion = RegExp.$1;
    // Map NT versions to Windows versions
    const versionMap: Record<string, string> = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.1': 'XP'
    };
    version = versionMap[ntVersion] || ntVersion;
    platform = 'Windows';
  }
  // macOS
  else if (/Mac OS X (\d+[._]\d+)/.test(userAgent)) {
    name = 'macOS';
    version = RegExp.$1.replace('_', '.');
    platform = 'macOS';
  }
  // iOS
  else if (/iPhone OS (\d+[._]\d+)/.test(userAgent) || /iPad.*OS (\d+[._]\d+)/.test(userAgent)) {
    name = 'iOS';
    version = RegExp.$1.replace('_', '.');
    platform = 'iOS';
  }
  // Android
  else if (/Android (\d+\.\d+)/.test(userAgent)) {
    name = 'Android';
    version = RegExp.$1;
    platform = 'Android';
  }
  // Linux
  else if (/Linux/.test(userAgent)) {
    name = 'Linux';
    platform = 'Linux';
  }

  return { name, version, platform };
}

/**
 * Determine device type from user agent
 */
export function getDeviceType(userAgent: string): DeviceType {
  // Mobile devices
  if (/Mobile|Android|iPhone/.test(userAgent) && !/iPad|Tablet/.test(userAgent)) {
    return DeviceType.MOBILE;
  }
  // Tablets
  if (/iPad|Tablet|Android/.test(userAgent) && /Safari/.test(userAgent)) {
    return DeviceType.TABLET;
  }
  // Smart TV
  if (/TV|SmartTV|GoogleTV|AppleTV/.test(userAgent)) {
    return DeviceType.SMARTTV;
  }
  // Wearable
  if (/Watch|Wearable/.test(userAgent)) {
    return DeviceType.WEARABLE;
  }
  // Default to desktop
  return DeviceType.DESKTOP;
}

/**
 * Extract device vendor and model from user agent
 */
export function getDeviceModel(userAgent: string): { vendor?: string; model?: string } {
  let vendor: string | undefined;
  let model: string | undefined;

  // iPhone
  if (/iPhone/.test(userAgent)) {
    vendor = 'Apple';
    if (/iPhone(\d+,\d+)/.test(userAgent)) {
      model = `iPhone ${RegExp.$1}`;
    } else {
      model = 'iPhone';
    }
  }
  // iPad
  else if (/iPad/.test(userAgent)) {
    vendor = 'Apple';
    if (/iPad(\d+,\d+)/.test(userAgent)) {
      model = `iPad ${RegExp.$1}`;
    } else {
      model = 'iPad';
    }
  }
  // Samsung
  else if (/SM-[A-Z]\d+/.test(userAgent)) {
    vendor = 'Samsung';
    const match = userAgent.match(/SM-([A-Z]\d+)/);
    model = match ? `Galaxy ${match[1]}` : 'Samsung Device';
  }
  // Google Pixel
  else if (/Pixel/.test(userAgent)) {
    vendor = 'Google';
    const match = userAgent.match(/Pixel (\d+[a-zA-Z]*)/);
    model = match ? `Pixel ${match[1]}` : 'Pixel';
  }
  // Mac
  else if (/Macintosh/.test(userAgent)) {
    vendor = 'Apple';
    model = 'Mac';
  }

  return { vendor, model };
}

/**
 * Generate a device fingerprint from device characteristics
 */
export function generateDeviceFingerprint(data: {
  userAgent: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
  language?: string;
  colorDepth?: number;
  pixelRatio?: number;
}): string {
  const components = [
    data.userAgent,
    data.screenWidth,
    data.screenHeight,
    data.timezone,
    data.language,
    data.colorDepth,
    data.pixelRatio
  ].filter(Boolean).join('|');

  // Create SHA-256 hash
  const hash = crypto.createHash('sha256').update(components).digest('hex');
  return hash;
}

/**
 * Client-side device information collector
 * This should be called from the browser
 */
export function collectDeviceInfo(): Partial<DeviceInfo> {
  if (typeof window === 'undefined') {
    throw new Error('collectDeviceInfo must be called in browser context');
  }

  const userAgent = window.navigator.userAgent;
  const browserInfo = parseBrowserInfo(userAgent);
  const osInfo = parseOSInfo(userAgent);
  const deviceType = getDeviceType(userAgent);
  const { vendor, model } = getDeviceModel(userAgent);

  // Screen information
  const screenInfo: ScreenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth,
    orientation: window.screen.width > window.screen.height ? 'landscape' : 'portrait'
  };

  // Network information (if available)
  const nav = window.navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const networkInfo: NetworkInfo | undefined = connection ? {
    type: connection.type as any,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  } : undefined;

  // Device capabilities
  const capabilities: DeviceCapabilities = {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    javascript: true, // Obviously true if this code is running
    cookies: navigator.cookieEnabled,
    webgl: !!document.createElement('canvas').getContext('webgl'),
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof Storage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  };

  // Generate fingerprint
  const deviceFingerprint = generateDeviceFingerprint({
    userAgent,
    screenWidth: screenInfo.width,
    screenHeight: screenInfo.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    colorDepth: screenInfo.colorDepth,
    pixelRatio: screenInfo.pixelRatio
  });

  const deviceInfo: Partial<DeviceInfo> = {
    deviceFingerprint,
    userAgent,

    // Browser
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    browserEngine: browserInfo.engine,

    // OS
    osName: osInfo.name,
    osVersion: osInfo.version,
    osPlatform: osInfo.platform,

    // Device
    deviceType,
    deviceVendor: vendor,
    deviceModel: model,

    // Screen
    screenWidth: screenInfo.width,
    screenHeight: screenInfo.height,
    screenPixelRatio: screenInfo.pixelRatio,
    colorDepth: screenInfo.colorDepth,

    // Capabilities
    touchSupport: capabilities.touch,
    javaScriptEnabled: capabilities.javascript,
    cookiesEnabled: capabilities.cookies,

    // Network
    connectionType: networkInfo?.type,
    effectiveType: networkInfo?.effectiveType,

    // Location
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,

    // Metadata
    metadata: {
      capabilities,
      screenOrientation: screenInfo.orientation,
      networkInfo
    }
  };

  return deviceInfo;
}

/**
 * Server-side device information parser
 * Extracts basic info from user agent string
 */
export function parseDeviceInfoFromUserAgent(userAgent: string, headers?: Record<string, string>): Partial<DeviceInfo> {
  const browserInfo = parseBrowserInfo(userAgent);
  const osInfo = parseOSInfo(userAgent);
  const deviceType = getDeviceType(userAgent);
  const { vendor, model } = getDeviceModel(userAgent);

  // Try to extract country from headers
  const country = headers?.['cf-ipcountry'] || headers?.['x-vercel-ip-country'];

  const deviceInfo: Partial<DeviceInfo> = {
    userAgent,

    // Browser
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    browserEngine: browserInfo.engine,

    // OS
    osName: osInfo.name,
    osVersion: osInfo.version,
    osPlatform: osInfo.platform,

    // Device
    deviceType,
    deviceVendor: vendor,
    deviceModel: model,

    // Capabilities
    touchSupport: deviceType === DeviceType.MOBILE || deviceType === DeviceType.TABLET,
    javaScriptEnabled: true,
    cookiesEnabled: true,

    // Location
    country,

    // Metadata
    metadata: {
      headers
    }
  };

  return deviceInfo;
}
