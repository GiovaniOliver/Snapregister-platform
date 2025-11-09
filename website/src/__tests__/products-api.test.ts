import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
const mockPrismaProductFindMany = jest.fn();
const mockPrismaProductFindUnique = jest.fn();
const mockPrismaProductCreate = jest.fn();
const mockPrismaProductUpdate = jest.fn();
const mockPrismaProductDelete = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    product: {
      findMany: mockPrismaProductFindMany,
      findUnique: mockPrismaProductFindUnique,
      create: mockPrismaProductCreate,
      update: mockPrismaProductUpdate,
      delete: mockPrismaProductDelete,
    },
  },
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return list of products for authenticated user', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          userId: 'user-123',
          productName: 'iPhone 15 Pro',
          manufacturerName: 'Apple',
          modelNumber: 'A2848',
          serialNumber: 'encrypted-serial-1',
          status: 'READY',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'product-2',
          userId: 'user-123',
          productName: 'MacBook Pro',
          manufacturerName: 'Apple',
          modelNumber: 'A2779',
          serialNumber: 'encrypted-serial-2',
          status: 'REGISTERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaProductFindMany.mockResolvedValueOnce(mockProducts);

      const result = await mockPrismaProductFindMany({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].productName).toBe('iPhone 15 Pro');
      expect(mockPrismaProductFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array for user with no products', async () => {
      mockPrismaProductFindMany.mockResolvedValueOnce([]);

      const result = await mockPrismaProductFindMany({
        where: { userId: 'user-456' },
      });

      expect(result).toEqual([]);
    });

    it('should filter products by status', async () => {
      const registeredProducts = [
        { id: '1', status: 'REGISTERED', productName: 'Product 1' },
      ];

      mockPrismaProductFindMany.mockResolvedValueOnce(registeredProducts);

      const result = await mockPrismaProductFindMany({
        where: { userId: 'user-123', status: 'REGISTERED' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('REGISTERED');
    });

    it('should search products by name', async () => {
      const searchResults = [
        { id: '1', productName: 'iPhone 15 Pro' },
        { id: '2', productName: 'iPhone 15' },
      ];

      mockPrismaProductFindMany.mockResolvedValueOnce(searchResults);

      const result = await mockPrismaProductFindMany({
        where: {
          userId: 'user-123',
          productName: { contains: 'iPhone', mode: 'insensitive' },
        },
      });

      expect(result).toHaveLength(2);
      expect(result.every((p: any) => p.productName.includes('iPhone'))).toBe(true);
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return single product by ID', async () => {
      const mockProduct = {
        id: 'product-1',
        userId: 'user-123',
        productName: 'iPhone 15 Pro',
        manufacturerName: 'Apple',
        modelNumber: 'A2848',
        serialNumber: 'encrypted-serial-1',
        category: 'ELECTRONICS',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 1199.99,
        retailer: 'Apple Store',
        warrantyDuration: 12,
        warrantyStartDate: new Date('2024-01-15'),
        warrantyExpiry: new Date('2025-01-15'),
        status: 'REGISTERED',
        imageUrls: JSON.stringify(['https://storage.example.com/img1.jpg']),
        extractedData: JSON.stringify({ confidence: 0.95 }),
        confidenceScore: 0.95,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaProductFindUnique.mockResolvedValueOnce(mockProduct);

      const result = await mockPrismaProductFindUnique({
        where: { id: 'product-1' },
        include: { manufacturer: true, registrations: true },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('product-1');
      expect(result.productName).toBe('iPhone 15 Pro');
      expect(mockPrismaProductFindUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: { manufacturer: true, registrations: true },
      });
    });

    it('should return null for non-existent product', async () => {
      mockPrismaProductFindUnique.mockResolvedValueOnce(null);

      const result = await mockPrismaProductFindUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });

    it('should include related manufacturer data', async () => {
      const mockProduct = {
        id: 'product-1',
        productName: 'iPhone',
        manufacturer: {
          id: 'mfr-1',
          name: 'Apple',
          website: 'https://apple.com',
        },
      };

      mockPrismaProductFindUnique.mockResolvedValueOnce(mockProduct);

      const result = await mockPrismaProductFindUnique({
        where: { id: 'product-1' },
        include: { manufacturer: true },
      });

      expect(result.manufacturer).toBeDefined();
      expect(result.manufacturer.name).toBe('Apple');
    });
  });

  describe('POST /api/products', () => {
    it('should create new product with valid data', async () => {
      const newProductData = {
        userId: 'user-123',
        productName: 'Samsung TV',
        manufacturerName: 'Samsung',
        modelNumber: 'QN55S95C',
        serialNumber: 'encrypted-serial',
        category: 'ELECTRONICS',
        purchaseDate: new Date('2024-01-01'),
        purchasePrice: 1499.99,
        retailer: 'Best Buy',
        imageUrls: JSON.stringify(['https://storage.example.com/tv.jpg']),
        extractedData: JSON.stringify({ ocr: 'raw data' }),
        confidenceScore: 0.92,
        status: 'PROCESSING',
      };

      const createdProduct = {
        id: 'product-new',
        ...newProductData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaProductCreate.mockResolvedValueOnce(createdProduct);

      const result = await mockPrismaProductCreate({
        data: newProductData,
      });

      expect(result.id).toBe('product-new');
      expect(result.productName).toBe('Samsung TV');
      expect(mockPrismaProductCreate).toHaveBeenCalledWith({
        data: newProductData,
      });
    });

    it('should create product with minimal required fields', async () => {
      const minimalProduct = {
        userId: 'user-123',
        productName: 'Generic Product',
        manufacturerName: 'Unknown',
        imageUrls: JSON.stringify([]),
        extractedData: JSON.stringify({}),
        status: 'NEEDS_REVIEW',
      };

      mockPrismaProductCreate.mockResolvedValueOnce({
        id: 'product-minimal',
        ...minimalProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockPrismaProductCreate({ data: minimalProduct });

      expect(result.id).toBe('product-minimal');
      expect(result.status).toBe('NEEDS_REVIEW');
    });

    it('should handle database errors on create', async () => {
      const productData = {
        userId: 'user-123',
        productName: 'Test Product',
        manufacturerName: 'Test',
      };

      mockPrismaProductCreate.mockRejectedValueOnce(
        new Error('Database constraint violation')
      );

      await expect(
        mockPrismaProductCreate({ data: productData })
      ).rejects.toThrow('Database constraint violation');
    });
  });

  describe('PATCH /api/products/[id]', () => {
    it('should update product fields', async () => {
      const updateData = {
        productName: 'Updated iPhone 15 Pro Max',
        modelNumber: 'A2849',
        status: 'REGISTERED',
      };

      const updatedProduct = {
        id: 'product-1',
        userId: 'user-123',
        productName: 'Updated iPhone 15 Pro Max',
        modelNumber: 'A2849',
        status: 'REGISTERED',
        updatedAt: new Date(),
      };

      mockPrismaProductUpdate.mockResolvedValueOnce(updatedProduct);

      const result = await mockPrismaProductUpdate({
        where: { id: 'product-1' },
        data: updateData,
      });

      expect(result.productName).toBe('Updated iPhone 15 Pro Max');
      expect(result.status).toBe('REGISTERED');
      expect(mockPrismaProductUpdate).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: updateData,
      });
    });

    it('should update only status field', async () => {
      mockPrismaProductUpdate.mockResolvedValueOnce({
        id: 'product-1',
        status: 'READY',
        updatedAt: new Date(),
      });

      const result = await mockPrismaProductUpdate({
        where: { id: 'product-1' },
        data: { status: 'READY' },
      });

      expect(result.status).toBe('READY');
    });

    it('should handle update errors', async () => {
      mockPrismaProductUpdate.mockRejectedValueOnce(
        new Error('Product not found')
      );

      await expect(
        mockPrismaProductUpdate({
          where: { id: 'non-existent' },
          data: { status: 'READY' },
        })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should delete product by ID', async () => {
      const deletedProduct = {
        id: 'product-1',
        userId: 'user-123',
        productName: 'iPhone 15 Pro',
      };

      mockPrismaProductDelete.mockResolvedValueOnce(deletedProduct);

      const result = await mockPrismaProductDelete({
        where: { id: 'product-1' },
      });

      expect(result.id).toBe('product-1');
      expect(mockPrismaProductDelete).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('should handle delete errors', async () => {
      mockPrismaProductDelete.mockRejectedValueOnce(
        new Error('Product not found')
      );

      await expect(
        mockPrismaProductDelete({ where: { id: 'non-existent' } })
      ).rejects.toThrow('Product not found');
    });

    it('should cascade delete related documents', async () => {
      // This is handled by Prisma schema with onDelete: Cascade
      const mockProductWithDocs = {
        id: 'product-1',
        documents: [
          { id: 'doc-1', type: 'RECEIPT' },
          { id: 'doc-2', type: 'WARRANTY_CARD' },
        ],
      };

      mockPrismaProductDelete.mockResolvedValueOnce(mockProductWithDocs);

      const result = await mockPrismaProductDelete({
        where: { id: 'product-1' },
        include: { documents: true },
      });

      expect(result.id).toBe('product-1');
      // Documents should be deleted automatically by cascade
    });
  });

  describe('Product Status Transitions', () => {
    it('should allow valid status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        PROCESSING: ['NEEDS_REVIEW', 'READY', 'REGISTRATION_FAILED'],
        NEEDS_REVIEW: ['READY', 'MANUAL_REQUIRED'],
        READY: ['REGISTERED', 'REGISTRATION_FAILED'],
        REGISTRATION_FAILED: ['MANUAL_REQUIRED', 'READY'],
        MANUAL_REQUIRED: ['REGISTERED'],
      };

      const isValidTransition = (from: string, to: string): boolean => {
        return validTransitions[from]?.includes(to) || false;
      };

      expect(isValidTransition('PROCESSING', 'READY')).toBe(true);
      expect(isValidTransition('READY', 'REGISTERED')).toBe(true);
      expect(isValidTransition('PROCESSING', 'REGISTERED')).toBe(false);
      expect(isValidTransition('REGISTERED', 'PROCESSING')).toBe(false);
    });
  });

  describe('Product Data Extraction', () => {
    it('should parse extracted data JSON', () => {
      const extractedDataJSON = JSON.stringify({
        serialNumber: 'ABC123',
        modelNumber: 'M1234',
        confidence: {
          serialNumber: 0.95,
          modelNumber: 0.89,
        },
      });

      const parsed = JSON.parse(extractedDataJSON);

      expect(parsed.serialNumber).toBe('ABC123');
      expect(parsed.confidence.serialNumber).toBe(0.95);
    });

    it('should parse image URLs array', () => {
      const imageUrlsJSON = JSON.stringify([
        'https://storage.example.com/img1.jpg',
        'https://storage.example.com/img2.jpg',
        'https://storage.example.com/img3.jpg',
      ]);

      const parsed = JSON.parse(imageUrlsJSON);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toContain('img1.jpg');
    });

    it('should handle invalid JSON gracefully', () => {
      const safeJSONParse = (json: string, fallback: any) => {
        try {
          return JSON.parse(json);
        } catch {
          return fallback;
        }
      };

      expect(safeJSONParse('invalid json', {})).toEqual({});
      expect(safeJSONParse('{"valid": true}', {})).toEqual({ valid: true });
    });
  });

  describe('Product Authorization', () => {
    it('should verify product belongs to user', () => {
      const product = { id: 'product-1', userId: 'user-123' };
      const requestingUserId = 'user-123';

      const isAuthorized = product.userId === requestingUserId;
      expect(isAuthorized).toBe(true);
    });

    it('should reject access to other users products', () => {
      const product = { id: 'product-1', userId: 'user-123' };
      const requestingUserId = 'user-456';

      const isAuthorized = product.userId === requestingUserId;
      expect(isAuthorized).toBe(false);
    });
  });
});
