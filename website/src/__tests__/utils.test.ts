import { describe, it, expect } from '@jest/globals';

describe('Utility Functions', () => {
  describe('String Utilities', () => {
    it('should normalize manufacturer names', () => {
      const normalizeManufacturerName = (name: string): string => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '');
      };

      expect(normalizeManufacturerName('Apple Inc.')).toBe('appleinc');
      expect(normalizeManufacturerName('Samsung Electronics')).toBe('samsungelectronics');
      expect(normalizeManufacturerName('LG Electronics Inc.')).toBe('lgelectronicsinc');
      expect(normalizeManufacturerName('Sony Corporation')).toBe('sonycorporation');
    });

    it('should capitalize words correctly', () => {
      const capitalizeWords = (str: string): string => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
      };

      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(capitalizeWords('ALREADY CAPS')).toBe('ALREADY CAPS');
    });

    it('should truncate long strings with ellipsis', () => {
      const truncate = (str: string, maxLength: number): string => {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
      };

      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('This is a very long string', 15)).toBe('This is a ve...');
      expect(truncate('Exact length!', 13)).toBe('Exact length!');
    });

    it('should sanitize file names', () => {
      const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-zA-Z0-9._-]/g, '_');
      };

      expect(sanitizeFileName('my file.pdf')).toBe('my_file.pdf');
      expect(sanitizeFileName('receipt@2024.jpg')).toBe('receipt_2024.jpg');
      expect(sanitizeFileName('invoice#123.png')).toBe('invoice_123.png');
    });
  });

  describe('Date Utilities', () => {
    it('should format dates consistently', () => {
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const testDate = new Date('2024-01-15T10:30:00');
      expect(formatDate(testDate)).toBe('2024-01-15');

      const testDate2 = new Date('2024-12-31T23:59:59');
      expect(formatDate(testDate2)).toBe('2024-12-31');
    });

    it('should calculate date differences in days', () => {
      const daysBetween = (date1: Date, date2: Date): number => {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-31');
      expect(daysBetween(date1, date2)).toBe(30);

      const date3 = new Date('2024-01-01');
      const date4 = new Date('2024-12-31');
      expect(daysBetween(date3, date4)).toBe(365);
    });

    it('should check if date is in the past', () => {
      const isInPast = (date: Date): boolean => {
        return date < new Date();
      };

      const pastDate = new Date('2023-01-01');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(isInPast(pastDate)).toBe(true);
      expect(isInPast(futureDate)).toBe(false);
    });

    it('should parse ISO date strings', () => {
      const parseISODate = (dateString: string): Date | null => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      };

      expect(parseISODate('2024-01-15')).toBeInstanceOf(Date);
      expect(parseISODate('2024-01-15T10:30:00Z')).toBeInstanceOf(Date);
      expect(parseISODate('invalid-date')).toBeNull();
    });
  });

  describe('Number Utilities', () => {
    it('should format currency correctly', () => {
      const formatCurrency = (amount: number, currency = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format file sizes', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };

      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });

    it('should calculate percentages', () => {
      const calculatePercentage = (value: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100 * 10) / 10;
      };

      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(33, 100)).toBe(33);
      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(0, 0)).toBe(0);
    });

    it('should clamp numbers within range', () => {
      const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
      };

      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('Array Utilities', () => {
    it('should remove duplicates from arrays', () => {
      const removeDuplicates = <T>(arr: T[]): T[] => {
        return [...new Set(arr)];
      };

      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(removeDuplicates([])).toEqual([]);
    });

    it('should chunk arrays into smaller arrays', () => {
      const chunkArray = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('should shuffle arrays randomly', () => {
      const shuffle = <T>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should group array items by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
        return arr.reduce((groups, item) => {
          const groupKey = String(item[key]);
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(item);
          return groups;
        }, {} as Record<string, T[]>);
      };

      const items = [
        { category: 'fruit', name: 'apple' },
        { category: 'fruit', name: 'banana' },
        { category: 'vegetable', name: 'carrot' },
      ];

      const grouped = groupBy(items, 'category');
      expect(grouped.fruit).toHaveLength(2);
      expect(grouped.vegetable).toHaveLength(1);
    });
  });

  describe('Object Utilities', () => {
    it('should deep clone objects', () => {
      const deepClone = <T>(obj: T): T => {
        return JSON.parse(JSON.stringify(obj));
      };

      const original = { a: 1, b: { c: 2, d: [3, 4] } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should pick specific keys from object', () => {
      const pick = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
          if (key in obj) {
            result[key] = obj[key];
          }
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    it('should omit specific keys from object', () => {
      const omit = <T extends object, K extends keyof T>(
        obj: T,
        keys: K[]
      ): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach(key => {
          delete result[key];
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
    });

    it('should check if objects are empty', () => {
      const isEmpty = (obj: object): boolean => {
        return Object.keys(obj).length === 0;
      };

      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty({ a: undefined })).toBe(false);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should validate URL format', () => {
      const isValidURL = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('not-a-url')).toBe(false);
    });

    it('should validate UUID format', () => {
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('invalid-uuid')).toBe(false);
      // This is actually a v1 UUID, not v4, so it should fail v4 validation
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    });
  });

  describe('Error Handling Utilities', () => {
    it('should safely parse JSON', () => {
      const safeJSONParse = <T>(json: string, fallback: T): T => {
        try {
          return JSON.parse(json);
        } catch {
          return fallback;
        }
      };

      expect(safeJSONParse('{"a":1}', {})).toEqual({ a: 1 });
      expect(safeJSONParse('invalid json', {})).toEqual({});
      expect(safeJSONParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('should retry failed operations', async () => {
      const retry = async <T>(
        fn: () => Promise<T>,
        maxAttempts: number
      ): Promise<T> => {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error as Error;
            if (attempt === maxAttempts - 1) break;
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          }
        }

        throw lastError;
      };

      let attempts = 0;
      const flakeyFunction = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      };

      const result = await retry(flakeyFunction, 5);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});
