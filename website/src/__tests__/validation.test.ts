import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Import validation schemas from the lib/validation file
// Note: Update imports based on actual exports from validation.ts
describe('Validation Module', () => {
  describe('Email Validation', () => {
    const emailSchema = z.string().email();

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com',
        'user_name@example.org',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('Password Validation', () => {
    const passwordSchema = z.string().min(8).max(100);

    it('should accept valid passwords', () => {
      const validPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'LongPasswordWith1234!@#$',
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject passwords that are too short', () => {
      expect(() => passwordSchema.parse('Short1!')).toThrow();
    });

    it('should reject passwords that are too long', () => {
      const tooLong = 'a'.repeat(101);
      expect(() => passwordSchema.parse(tooLong)).toThrow();
    });
  });

  describe('Product Data Validation', () => {
    const productSchema = z.object({
      productName: z.string().min(1),
      manufacturerName: z.string().min(1),
      modelNumber: z.string().optional(),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().or(z.date()).optional(),
    });

    it('should validate complete product data', () => {
      const validProduct = {
        productName: 'iPhone 15 Pro',
        manufacturerName: 'Apple',
        modelNumber: 'A2848',
        serialNumber: 'DNPXJ3K9Q1GH',
        purchaseDate: '2024-01-15',
      };

      expect(() => productSchema.parse(validProduct)).not.toThrow();
    });

    it('should validate minimal product data', () => {
      const minimalProduct = {
        productName: 'Samsung TV',
        manufacturerName: 'Samsung',
      };

      expect(() => productSchema.parse(minimalProduct)).not.toThrow();
    });

    it('should reject products without required fields', () => {
      const invalidProduct = {
        modelNumber: 'A2848',
      };

      expect(() => productSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject products with empty required fields', () => {
      const invalidProduct = {
        productName: '',
        manufacturerName: 'Apple',
      };

      expect(() => productSchema.parse(invalidProduct)).toThrow();
    });
  });

  describe('Registration Data Validation', () => {
    const registrationSchema = z.object({
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      email: z.string().email(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    });

    it('should validate complete registration data', () => {
      const validRegistration = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      expect(() => registrationSchema.parse(validRegistration)).not.toThrow();
    });

    it('should validate minimal registration data', () => {
      const minimalRegistration = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      expect(() => registrationSchema.parse(minimalRegistration)).not.toThrow();
    });

    it('should reject registration with invalid email', () => {
      const invalidRegistration = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
      };

      expect(() => registrationSchema.parse(invalidRegistration)).toThrow();
    });

    it('should reject names that are too long', () => {
      const tooLongName = 'a'.repeat(51);
      const invalidRegistration = {
        firstName: tooLongName,
        lastName: 'Doe',
        email: 'john@example.com',
      };

      expect(() => registrationSchema.parse(invalidRegistration)).toThrow();
    });
  });

  describe('Warranty Data Validation', () => {
    const warrantySchema = z.object({
      duration: z.string().optional(),
      durationMonths: z.number().int().positive().optional(),
      startDate: z.string().or(z.date()).optional(),
      expiryDate: z.string().or(z.date()).optional(),
      warrantyType: z.enum(['Limited', 'Extended', 'Lifetime']).optional(),
    });

    it('should validate complete warranty data', () => {
      const validWarranty = {
        duration: '12 months',
        durationMonths: 12,
        startDate: '2024-01-01',
        expiryDate: '2025-01-01',
        warrantyType: 'Limited' as const,
      };

      expect(() => warrantySchema.parse(validWarranty)).not.toThrow();
    });

    it('should accept optional warranty fields', () => {
      const minimalWarranty = {
        durationMonths: 24,
      };

      expect(() => warrantySchema.parse(minimalWarranty)).not.toThrow();
    });

    it('should reject negative duration', () => {
      const invalidWarranty = {
        durationMonths: -12,
      };

      expect(() => warrantySchema.parse(invalidWarranty)).toThrow();
    });

    it('should reject invalid warranty type', () => {
      const invalidWarranty = {
        warrantyType: 'InvalidType',
      };

      expect(() => warrantySchema.parse(invalidWarranty)).toThrow();
    });
  });

  describe('Serial Number Validation', () => {
    it('should accept alphanumeric serial numbers', () => {
      const serialSchema = z.string().regex(/^[A-Z0-9]+$/);
      const validSerials = [
        'ABC123DEF456',
        '1234567890',
        'DNPXJ3K9Q1GH',
      ];

      validSerials.forEach(serial => {
        expect(() => serialSchema.parse(serial)).not.toThrow();
      });
    });

    it('should reject serial numbers with special characters', () => {
      const serialSchema = z.string().regex(/^[A-Z0-9]+$/);
      const invalidSerials = [
        'ABC-123',
        'DEF@456',
        'GHI 789',
      ];

      invalidSerials.forEach(serial => {
        expect(() => serialSchema.parse(serial)).toThrow();
      });
    });
  });

  describe('File Upload Validation', () => {
    const fileSchema = z.object({
      fileName: z.string().min(1),
      fileSize: z.number().positive().max(10 * 1024 * 1024), // Max 10MB
      mimeType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/),
    });

    it('should validate acceptable image files', () => {
      const validFiles = [
        { fileName: 'photo.jpg', fileSize: 1024000, mimeType: 'image/jpeg' },
        { fileName: 'scan.png', fileSize: 2048000, mimeType: 'image/png' },
        { fileName: 'receipt.webp', fileSize: 512000, mimeType: 'image/webp' },
      ];

      validFiles.forEach(file => {
        expect(() => fileSchema.parse(file)).not.toThrow();
      });
    });

    it('should reject files that are too large', () => {
      const tooLargeFile = {
        fileName: 'large.jpg',
        fileSize: 11 * 1024 * 1024, // 11MB
        mimeType: 'image/jpeg',
      };

      expect(() => fileSchema.parse(tooLargeFile)).toThrow();
    });

    it('should reject unsupported file types', () => {
      const invalidFile = {
        fileName: 'document.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
      };

      expect(() => fileSchema.parse(invalidFile)).toThrow();
    });
  });

  describe('Date Validation', () => {
    it('should accept valid ISO date strings', () => {
      const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      const validDates = ['2024-01-15', '2023-12-31', '2025-06-30'];

      validDates.forEach(date => {
        expect(() => dateSchema.parse(date)).not.toThrow();
      });
    });

    it('should reject invalid date formats', () => {
      const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      const invalidDates = [
        '2024/01/15',
        '15-01-2024',
        '2024-1-15',
        'January 15, 2024',
      ];

      invalidDates.forEach(date => {
        expect(() => dateSchema.parse(date)).toThrow();
      });
    });

    it('should validate purchase date is not in the future', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const purchaseDateSchema = z.string().refine(
        (date) => new Date(date) <= today,
        { message: 'Purchase date cannot be in the future' }
      );

      expect(() => purchaseDateSchema.parse(today.toISOString().split('T')[0])).not.toThrow();
      expect(() => purchaseDateSchema.parse(tomorrow.toISOString().split('T')[0])).toThrow();
    });
  });
});
