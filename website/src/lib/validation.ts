// Form Validation Schemas using Zod

import { z } from 'zod';

// User Contact Information Schema
export const userContactInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format')
    .min(10, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
  addressLine2: z.string().max(200, 'Address line 2 is too long').optional().or(z.literal('')),
  city: z.string().max(100, 'City name is too long').optional().or(z.literal('')),
  state: z.string().max(50, 'State is too long').optional().or(z.literal('')),
  zipCode: z.string()
    .regex(/^[\d\-\s]+$/, 'Invalid zip code format')
    .max(20, 'Zip code is too long')
    .optional()
    .or(z.literal('')),
  country: z.string().min(2, 'Country is required').max(2, 'Country code must be 2 letters')
});

export type UserContactInfoFormData = z.infer<typeof userContactInfoSchema>;

// Product Information Schema
export const productInfoSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  modelNumber: z.string().max(100).optional().or(z.literal('')),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  sku: z.string().max(100).optional().or(z.literal('')),
  upc: z.string().max(50).optional().or(z.literal('')),
  purchaseDate: z.string().optional().or(z.literal('')),
  purchasePrice: z.number().positive().optional().or(z.literal(0)),
  retailer: z.string().max(100).optional().or(z.literal('')),
  category: z.string().optional().or(z.literal(''))
});

export type ProductInfoFormData = z.infer<typeof productInfoSchema>;

// Device Information Schema
export const deviceInfoSchema = z.object({
  deviceFingerprint: z.string(),
  userAgent: z.string(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  deviceType: z.enum(['MOBILE', 'TABLET', 'DESKTOP', 'SMARTTV', 'WEARABLE', 'EMBEDDED', 'UNKNOWN']),
  deviceVendor: z.string().optional(),
  deviceModel: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  touchSupport: z.boolean(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional()
});

export type DeviceInfoFormData = z.infer<typeof deviceInfoSchema>;

// Complete Registration Form Schema
export const registrationFormSchema = z.object({
  userInfo: userContactInfoSchema,
  productInfo: productInfoSchema,
  deviceInfo: deviceInfoSchema.optional()
});

export type RegistrationFormData = z.infer<typeof registrationFormSchema>;

// Validation helper functions
export function validateUserContactInfo(data: unknown) {
  return userContactInfoSchema.safeParse(data);
}

export function validateProductInfo(data: unknown) {
  return productInfoSchema.safeParse(data);
}

export function validateDeviceInfo(data: unknown) {
  return deviceInfoSchema.safeParse(data);
}

export function validateRegistrationForm(data: unknown) {
  return registrationFormSchema.safeParse(data);
}
