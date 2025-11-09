import { POST } from '@/app/api/products/route';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a product with sanitized payload', async () => {
    const mockSession = { id: 'user-1' };
    (getSession as jest.Mock).mockResolvedValue(mockSession);

    const mockProduct = {
      id: 'prod-1',
      userId: mockSession.id,
      productName: 'Gadget Pro',
      manufacturerName: 'Acme',
      modelNumber: 'A1',
      serialNumber: 'SN-001',
      category: 'Electronics',
      purchaseDate: new Date('2024-01-01T00:00:00.000Z'),
      purchasePrice: 199.99,
      retailer: 'Store',
      warrantyDuration: 12,
      warrantyStartDate: new Date('2024-01-01T00:00:00.000Z'),
      warrantyExpiry: new Date('2025-01-01T00:00:00.000Z'),
      imageUrls: '[]',
      extractedData: '{}',
      confidenceScore: 0.9,
      status: 'READY',
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    };

    (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

    const request = {
      json: jest.fn().mockResolvedValue({
        name: ' Gadget Pro ',
        brand: ' Acme ',
        model: 'A1',
        serialNumber: 'SN-001',
        category: 'Electronics',
        confidence: 'high',
      }),
    } as any;

    const response = await POST(request);
    const payload = await response.json();

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productName: 'Gadget Pro',
          manufacturerName: 'Acme',
          status: 'READY',
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.data.name).toBe('Gadget Pro');
    expect(payload.data.brand).toBe('Acme');
  });

  it('returns validation error for bad payloads', async () => {
    (getSession as jest.Mock).mockResolvedValue({ id: 'user-1' });
    const request = {
      json: jest.fn().mockResolvedValue({
        brand: 'Missing name field',
      }),
    } as any;

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid product data');
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    const request = {
      json: jest.fn(),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});
