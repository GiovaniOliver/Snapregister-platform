// Data Package Generator for Manufacturers
// Creates standardized data packages in multiple formats

import { ManufacturerDataPackage, UserContactInfo, ProductInfo, DataPackageExportOptions } from '@/types/registration';
import { DeviceInfo } from '@/types/device';

/**
 * Generate a standardized data package for manufacturer submission
 */
export function generateManufacturerDataPackage(
  product: ProductInfo,
  user: UserContactInfo,
  device: Partial<DeviceInfo>
): ManufacturerDataPackage {
  return {
    product: {
      productName: product.productName,
      manufacturer: product.manufacturer,
      modelNumber: product.modelNumber,
      serialNumber: product.serialNumber,
      sku: product.sku,
      upc: product.upc,
      purchaseDate: product.purchaseDate,
      purchasePrice: product.purchasePrice,
      retailer: product.retailer,
      category: product.category
    },
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country
    },
    device: {
      type: device.deviceType || 'UNKNOWN',
      os: device.osName && device.osVersion
        ? `${device.osName} ${device.osVersion}`
        : 'Unknown',
      browser: device.browserName && device.browserVersion
        ? `${device.browserName} ${device.browserVersion}`
        : 'Unknown',
      model: device.deviceModel
    },
    registration: {
      registrationDate: new Date().toISOString(),
      registrationId: generateRegistrationId(),
      source: 'snapregister',
      version: '1.0.0'
    }
  };
}

/**
 * Export data package as JSON
 */
export function exportAsJSON(dataPackage: ManufacturerDataPackage): string {
  return JSON.stringify(dataPackage, null, 2);
}

/**
 * Export data package as XML
 */
export function exportAsXML(dataPackage: ManufacturerDataPackage): string {
  const xml: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  xml.push('<ProductRegistration>');

  // Product Information
  xml.push('  <Product>');
  Object.entries(dataPackage.product).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      xml.push(`    <${key}>${escapeXML(String(value))}</${key}>`);
    }
  });
  xml.push('  </Product>');

  // User Information
  xml.push('  <User>');
  Object.entries(dataPackage.user).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      xml.push(`    <${key}>${escapeXML(String(value))}</${key}>`);
    }
  });
  xml.push('  </User>');

  // Device Information
  xml.push('  <Device>');
  Object.entries(dataPackage.device).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      xml.push(`    <${key}>${escapeXML(String(value))}</${key}>`);
    }
  });
  xml.push('  </Device>');

  // Registration Information
  xml.push('  <Registration>');
  Object.entries(dataPackage.registration).forEach(([key, value]) => {
    xml.push(`    <${key}>${escapeXML(String(value))}</${key}>`);
  });
  xml.push('  </Registration>');

  xml.push('</ProductRegistration>');

  return xml.join('\n');
}

/**
 * Export data package as CSV
 */
export function exportAsCSV(dataPackage: ManufacturerDataPackage): string {
  const rows: string[] = [];

  // Header
  rows.push('Category,Field,Value');

  // Product data
  Object.entries(dataPackage.product).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      rows.push(`Product,${key},"${escapeCSV(String(value))}"`);
    }
  });

  // User data
  Object.entries(dataPackage.user).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      rows.push(`User,${key},"${escapeCSV(String(value))}"`);
    }
  });

  // Device data
  Object.entries(dataPackage.device).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      rows.push(`Device,${key},"${escapeCSV(String(value))}"`);
    }
  });

  // Registration data
  Object.entries(dataPackage.registration).forEach(([key, value]) => {
    rows.push(`Registration,${key},"${escapeCSV(String(value))}"`);
  });

  return rows.join('\n');
}

/**
 * Export data package in specified format
 */
export function exportDataPackage(
  dataPackage: ManufacturerDataPackage,
  options: DataPackageExportOptions
): string {
  switch (options.format) {
    case 'json':
      return exportAsJSON(dataPackage);
    case 'xml':
      return exportAsXML(dataPackage);
    case 'csv':
      return exportAsCSV(dataPackage);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Create a downloadable blob for the data package
 */
export function createDownloadBlob(
  content: string,
  format: 'json' | 'xml' | 'csv'
): Blob {
  const mimeTypes = {
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv'
  };

  return new Blob([content], { type: mimeTypes[format] });
}

/**
 * Trigger download of data package
 */
export function downloadDataPackage(
  dataPackage: ManufacturerDataPackage,
  options: DataPackageExportOptions,
  filename?: string
): void {
  const content = exportDataPackage(dataPackage, options);
  const blob = createDownloadBlob(content, options.format);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `registration-${dataPackage.registration.registrationId}.${options.format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Encrypt sensitive data in the package (placeholder for AES-256)
 */
export function encryptDataPackage(
  dataPackage: ManufacturerDataPackage,
  key: string
): ManufacturerDataPackage {
  // In production, implement actual AES-256 encryption
  // For now, this is a placeholder that returns the data as-is
  // TODO: Implement encryption using crypto library

  console.warn('Encryption not yet implemented');
  return dataPackage;
}

/**
 * Validate data package completeness
 */
export function validateDataPackage(dataPackage: ManufacturerDataPackage): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Required product fields
  if (!dataPackage.product.productName) missingFields.push('product.productName');
  if (!dataPackage.product.manufacturer) missingFields.push('product.manufacturer');

  // Required user fields
  if (!dataPackage.user.firstName) missingFields.push('user.firstName');
  if (!dataPackage.user.lastName) missingFields.push('user.lastName');
  if (!dataPackage.user.email) missingFields.push('user.email');

  // Optional but recommended fields
  if (!dataPackage.product.serialNumber) warnings.push('Serial number not provided');
  if (!dataPackage.product.purchaseDate) warnings.push('Purchase date not provided');
  if (!dataPackage.user.phone) warnings.push('Phone number not provided');
  if (!dataPackage.user.address) warnings.push('Address not provided');

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

// Helper functions

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCSV(str: string): string {
  return str.replace(/"/g, '""');
}

function generateRegistrationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `REG-${timestamp}-${random}`.toUpperCase();
}
