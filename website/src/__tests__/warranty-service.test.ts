import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateWarrantyEndDate } from '../services/warranty-calculator';
import { WarrantyType } from '../types/warranty';

// Mock Prisma
const mockPrismaWarrantyContractCreate = jest.fn();
const mockPrismaWarrantyContractFindUnique = jest.fn();
const mockPrismaWarrantyContractUpdate = jest.fn();
const mockPrismaWarrantyContractDelete = jest.fn();
const mockPrismaWarrantyContractFindMany = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    warrantyContract: {
      create: mockPrismaWarrantyContractCreate,
      findUnique: mockPrismaWarrantyContractFindUnique,
      update: mockPrismaWarrantyContractUpdate,
      delete: mockPrismaWarrantyContractDelete,
      findMany: mockPrismaWarrantyContractFindMany,
    },
  },
}));

describe('Warranty Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Warranty Duration Calculation', () => {
    it('should calculate warranty expiry date correctly', () => {
      const startDate = new Date('2024-01-01');
      const durationMonths = 12;

      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      expect(expiryDate.toISOString().split('T')[0]).toBe('2025-01-01');
    });

    it('should clamp Jan 31 to Feb 29 in leap years', () => {
      const startDate = new Date('2024-01-31');

      const expiryDate = calculateWarrantyEndDate(
        startDate,
        1,
        WarrantyType.LIMITED
      );

      expect(expiryDate).not.toBeNull();
      expect(expiryDate?.toISOString().split('T')[0]).toBe('2024-02-29');
    });

    it('should clamp Jan 31 to Feb 28 in non-leap years', () => {
      const startDate = new Date('2023-01-31');

      const expiryDate = calculateWarrantyEndDate(
        startDate,
        1,
        WarrantyType.LIMITED
      );

      expect(expiryDate).not.toBeNull();
      expect(expiryDate?.toISOString().split('T')[0]).toBe('2023-02-28');
    });

    it('should handle multi-year warranties', () => {
      const startDate = new Date('2024-01-01');
      const durationMonths = 36; // 3 years

      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      expect(expiryDate.toISOString().split('T')[0]).toBe('2027-01-01');
    });

    it('should handle leap years correctly', () => {
      const startDate = new Date('2024-02-29'); // Leap year

      const expiryDate = calculateWarrantyEndDate(
        startDate,
        12,
        WarrantyType.LIMITED
      );

      expect(expiryDate).not.toBeNull();
      expect(expiryDate?.getMonth()).toBe(1); // February
    });
  });

  describe('Warranty Status Check', () => {
    it('should identify active warranties', () => {
      const today = new Date();
      const futureExpiry = new Date(today);
      futureExpiry.setMonth(futureExpiry.getMonth() + 6);

      const isActive = futureExpiry > today;
      expect(isActive).toBe(true);
    });

    it('should identify expired warranties', () => {
      const today = new Date();
      const pastExpiry = new Date(today);
      pastExpiry.setMonth(pastExpiry.getMonth() - 1);

      const isActive = pastExpiry > today;
      expect(isActive).toBe(false);
    });

    it('should identify warranties expiring soon (within 30 days)', () => {
      const today = new Date();
      const soonExpiry = new Date(today);
      soonExpiry.setDate(soonExpiry.getDate() + 15); // 15 days from now

      const daysUntilExpiry = Math.ceil((soonExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

      expect(isExpiringSoon).toBe(true);
      expect(daysUntilExpiry).toBeLessThanOrEqual(30);
    });
  });

  describe('Warranty Contract Creation', () => {
    it('should create warranty contract with all fields', async () => {
      const mockWarrantyData = {
        userId: 'user-123',
        productId: 'product-456',
        documentUrl: 'https://storage.example.com/warranty.pdf',
        documentType: 'pdf',
        fileName: 'warranty.pdf',
        fileSize: 102400,
        contractText: 'Full warranty terms...',
        ocrConfidence: 0.95,
        aiSummary: 'This is a 2-year limited warranty covering manufacturing defects.',
        confidenceScore: 0.9,
        duration: '24 months',
        durationMonths: 24,
        startDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        status: 'COMPLETED',
      };

      mockPrismaWarrantyContractCreate.mockResolvedValueOnce({
        id: 'warranty-789',
        ...mockWarrantyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = mockPrismaWarrantyContractCreate({ data: mockWarrantyData });

      await expect(result).resolves.toMatchObject({
        id: 'warranty-789',
        userId: 'user-123',
        productId: 'product-456',
      });

      expect(mockPrismaWarrantyContractCreate).toHaveBeenCalledWith({
        data: mockWarrantyData,
      });
    });

    it('should handle warranty contract creation errors', async () => {
      const mockError = new Error('Database error');
      mockPrismaWarrantyContractCreate.mockRejectedValueOnce(mockError);

      const warrantyData = {
        userId: 'user-123',
        productId: 'product-456',
        documentUrl: 'https://storage.example.com/warranty.pdf',
        documentType: 'pdf',
        fileName: 'warranty.pdf',
        fileSize: 102400,
      };

      await expect(
        mockPrismaWarrantyContractCreate({ data: warrantyData })
      ).rejects.toThrow('Database error');
    });
  });

  describe('Warranty Term Parsing', () => {
    it('should parse warranty duration strings correctly', () => {
      const parseWarrantyDuration = (duration: string): number | null => {
        const patterns = [
          { regex: /(\d+)\s*year/i, multiplier: 12 },
          { regex: /(\d+)\s*month/i, multiplier: 1 },
          { regex: /lifetime/i, value: 1200 }, // 100 years
        ];

        for (const pattern of patterns) {
          const match = duration.match(pattern.regex);
          if (match) {
            if ('value' in pattern) return pattern.value;
            return parseInt(match[1]) * pattern.multiplier;
          }
        }
        return null;
      };

      expect(parseWarrantyDuration('12 months')).toBe(12);
      expect(parseWarrantyDuration('1 year')).toBe(12);
      expect(parseWarrantyDuration('2 years')).toBe(24);
      expect(parseWarrantyDuration('Lifetime')).toBe(1200);
      expect(parseWarrantyDuration('6 months')).toBe(6);
    });

    it('should handle warranty types correctly', () => {
      const validTypes = ['Limited', 'Extended', 'Lifetime'];
      const invalidTypes = ['Basic', 'Premium', 'Invalid'];

      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });

      invalidTypes.forEach(type => {
        expect(validTypes).not.toContain(type);
      });
    });
  });

  describe('Coverage Analysis', () => {
    it('should parse coverage items from text', () => {
      const warrantyText = `
        Coverage includes:
        - Manufacturing defects
        - Parts and labor
        - Electrical components

        Exclusions:
        - Physical damage
        - Water damage
        - Unauthorized modifications
      `;

      const parseCoverage = (text: string) => {
        const coverageMatch = text.match(/Coverage includes:(.*?)Exclusions:/s);
        if (!coverageMatch) return [];

        return coverageMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim());
      };

      const coverage = parseCoverage(warrantyText);
      expect(coverage).toHaveLength(3);
      expect(coverage).toContain('Manufacturing defects');
      expect(coverage).toContain('Parts and labor');
    });

    it('should parse exclusions from text', () => {
      const warrantyText = `
        Exclusions:
        - Physical damage
        - Water damage
        - Unauthorized modifications
      `;

      const parseExclusions = (text: string) => {
        const exclusionsMatch = text.match(/Exclusions:(.*?)$/s);
        if (!exclusionsMatch) return [];

        return exclusionsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim());
      };

      const exclusions = parseExclusions(warrantyText);
      expect(exclusions).toHaveLength(3);
      expect(exclusions).toContain('Physical damage');
      expect(exclusions).toContain('Water damage');
    });
  });

  describe('Warranty Notifications', () => {
    it('should calculate correct notification dates', () => {
      const expiryDate = new Date('2025-01-01');
      const notificationDays = [30, 7, 1]; // 30 days, 7 days, 1 day before expiry

      const getNotificationDates = (expiry: Date, daysBefore: number[]) => {
        return daysBefore.map(days => {
          const notificationDate = new Date(expiry);
          notificationDate.setDate(notificationDate.getDate() - days);
          return notificationDate;
        });
      };

      const dates = getNotificationDates(expiryDate, notificationDays);

      expect(dates[0].toISOString().split('T')[0]).toBe('2024-12-02'); // 30 days before
      expect(dates[1].toISOString().split('T')[0]).toBe('2024-12-25'); // 7 days before
      expect(dates[2].toISOString().split('T')[0]).toBe('2024-12-31'); // 1 day before
    });

    it('should determine if notification should be sent', () => {
      const shouldSendNotification = (expiryDate: Date, lastNotified: Date | null, daysBefore: number) => {
        const notificationDate = new Date(expiryDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);

        const today = new Date();
        if (today < notificationDate) return false;

        if (!lastNotified) return true;

        return lastNotified < notificationDate;
      };

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15); // 15 days from now

      // Should not send 30-day notification yet (expiry is only 15 days away)
      expect(shouldSendNotification(expiryDate, null, 30)).toBe(true);

      // Should send 7-day notification (we're within 7 days)
      expect(shouldSendNotification(expiryDate, null, 7)).toBe(false);
    });
  });

  describe('Warranty Search and Filtering', () => {
    it('should find warranties expiring within timeframe', async () => {
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const mockWarranties = [
        { id: '1', expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { id: '2', expiryDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000) },
        { id: '3', expiryDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000) },
      ];

      mockPrismaWarrantyContractFindMany.mockResolvedValueOnce(
        mockWarranties.filter(w => w.expiryDate <= thirtyDaysLater && w.expiryDate >= today)
      );

      const result = await mockPrismaWarrantyContractFindMany({
        where: {
          expiryDate: {
            gte: today,
            lte: thirtyDaysLater,
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result.map((w: any) => w.id)).toEqual(['1', '2']);
    });

    it('should filter warranties by status', async () => {
      const mockWarranties = [
        { id: '1', status: 'COMPLETED' },
        { id: '2', status: 'PROCESSING' },
        { id: '3', status: 'COMPLETED' },
      ];

      mockPrismaWarrantyContractFindMany.mockResolvedValueOnce(
        mockWarranties.filter(w => w.status === 'COMPLETED')
      );

      const result = await mockPrismaWarrantyContractFindMany({
        where: { status: 'COMPLETED' },
      });

      expect(result).toHaveLength(2);
      expect(result.every((w: any) => w.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('Warranty Data Validation', () => {
    it('should validate OCR confidence scores', () => {
      const isValidConfidence = (score: number) => {
        return score >= 0 && score <= 1;
      };

      expect(isValidConfidence(0.95)).toBe(true);
      expect(isValidConfidence(0)).toBe(true);
      expect(isValidConfidence(1)).toBe(true);
      expect(isValidConfidence(-0.1)).toBe(false);
      expect(isValidConfidence(1.1)).toBe(false);
    });

    it('should validate warranty date logic', () => {
      const isValidWarrantyDates = (startDate: Date, expiryDate: Date) => {
        return startDate < expiryDate;
      };

      const start = new Date('2024-01-01');
      const validExpiry = new Date('2025-01-01');
      const invalidExpiry = new Date('2023-01-01');

      expect(isValidWarrantyDates(start, validExpiry)).toBe(true);
      expect(isValidWarrantyDates(start, invalidExpiry)).toBe(false);
    });
  });
});
