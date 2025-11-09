import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Product as ProductModel } from '@prisma/client';

const optionalNumber = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') {
    return undefined;
  }
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const normalized = val.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}, z.number().nonnegative().optional());

const optionalInteger = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') {
    return undefined;
  }
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const normalized = val.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }
  return undefined;
}, z.number().int().nonnegative().optional());

const optionalDate = z.preprocess((val) => {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === 'string') {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}, z.date().optional());

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  brand: z.string().min(1, 'Brand is required').max(150),
  model: z.string().max(150).optional(),
  serialNumber: z.string().max(150).optional(),
  category: z.string().max(100).optional(),
  purchaseDate: optionalDate,
  purchasePrice: optionalNumber,
  retailer: z.string().max(150).optional(),
  warrantyPeriod: optionalInteger,
  warrantyStartDate: optionalDate,
  warrantyEndDate: optionalDate,
  notes: z.string().max(4000).optional(),
  imageUrl: z.string().url().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  additionalInfo: z.string().max(4000).optional(),
});

type CreateProductInput = z.infer<typeof createProductSchema>;

const CONFIDENCE_SCORE_MAP: Record<'high' | 'medium' | 'low', number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

/**
 * GET /api/products
 * Retrieves paginated products for the authenticated user
 *
 * Query Parameters:
 * - page: Page number (default: 1, min: 1)
 * - limit: Items per page (default: 20, min: 1, max: 100)
 *
 * Security:
 * - Requires authentication
 * - Returns only products owned by the authenticated user
 * - Input validation to prevent injection attacks
 * - Rate limiting should be applied at middleware level
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;

    // Validate page parameter
    const pageParam = searchParams.get('page');
    const page = validatePositiveInteger(pageParam, 1);

    if (page === null) {
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          message: 'Page must be a positive integer',
          field: 'page'
        },
        { status: 400 }
      );
    }

    // Validate limit parameter with maximum cap
    const limitParam = searchParams.get('limit');
    const limit = validatePositiveInteger(limitParam, 20);

    if (limit === null) {
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          message: 'Limit must be a positive integer',
          field: 'limit'
        },
        { status: 400 }
      );
    }

    // Enforce maximum limit to prevent abuse
    const MAX_LIMIT = 100;
    const sanitizedLimit = Math.min(limit, MAX_LIMIT);

    // Calculate skip for pagination
    const skip = (page - 1) * sanitizedLimit;

    // Get total count for pagination metadata
    const totalCount = await prisma.product.count({
      where: {
        userId: session.id // Authorization: Only user's own products
      },
    });

    // Fetch paginated products with authorization filter
    const products = await prisma.product.findMany({
      where: {
        userId: session.id // Authorization: Only user's own products
      },
      select: {
        id: true,
        productName: true,
        manufacturerName: true,
        category: true,
        modelNumber: true,
        // Do NOT expose serialNumber in API (encrypted sensitive data)
        sku: true,
        upc: true,
        purchaseDate: true,
        purchasePrice: true,
        retailer: true,
        warrantyDuration: true,
        warrantyStartDate: true,
        warrantyExpiry: true,
        warrantyType: true,
        imageUrls: true,
        confidenceScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        manufacturer: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
      skip,
      take: sanitizedLimit,
    });

    // Parse JSON fields safely
    const productsWithParsedData = products.map(product => ({
      ...product,
      imageUrls: safeJsonParse(product.imageUrls, []),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / sanitizedLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: productsWithParsedData,
      pagination: {
        page,
        limit: sanitizedLimit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    // Log error details server-side for debugging
    console.error('[Products API] Error fetching products:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error message to prevent information leakage
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch products. Please try again later.'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product record using AI-assisted data coming from the mobile app.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload', message: 'Unable to parse request body' },
        { status: 400 }
      );
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid product data',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date();

    const sanitizedName = data.name.trim();
    const sanitizedBrand = data.brand.trim();
    const sanitizedModel = data.model?.trim() || null;
    const sanitizedSerial = data.serialNumber?.trim() || null;
    const sanitizedCategory = data.category?.trim() || null;
    const sanitizedRetailer = data.retailer?.trim() || null;
    const sanitizedNotes = data.notes?.trim();
    const sanitizedAdditionalInfo = data.additionalInfo?.trim();

    const purchaseDate = data.purchaseDate ?? null;
    const warrantyStartDate = data.warrantyStartDate ?? purchaseDate;
    const warrantyExpiry = data.warrantyEndDate ?? null;

    let warrantyDuration = data.warrantyPeriod ?? null;
    if (
      (warrantyDuration === null || warrantyDuration === undefined) &&
      warrantyStartDate &&
      warrantyExpiry
    ) {
      warrantyDuration = calculateWarrantyDurationMonths(warrantyStartDate, warrantyExpiry);
    }

    const purchasePrice = data.purchasePrice !== undefined
      ? Number(data.purchasePrice.toFixed(2))
      : null;

    const imageUrls = data.imageUrl ? [data.imageUrl] : [];

    const productRecord = await prisma.product.create({
      data: {
        userId: session.id,
        productName: sanitizedName,
        manufacturerName: sanitizedBrand,
        modelNumber: sanitizedModel || undefined,
        serialNumber: sanitizedSerial || undefined,
        category: sanitizedCategory || undefined,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: purchasePrice ?? undefined,
        retailer: sanitizedRetailer || undefined,
        warrantyDuration: warrantyDuration ?? undefined,
        warrantyStartDate: warrantyStartDate || undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        imageUrls: JSON.stringify(imageUrls),
        extractedData: JSON.stringify({
          source: 'mobile-multi-image',
          capturedAt: now.toISOString(),
          notes: sanitizedNotes,
          additionalInfo: sanitizedAdditionalInfo,
          confidence: data.confidence ?? null,
        }),
        confidenceScore: data.confidence ? CONFIDENCE_SCORE_MAP[data.confidence] : undefined,
        status: determineProductStatus(data.confidence),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapProductToMobileShape(productRecord, {
          imageUrl: data.imageUrl,
          notes: sanitizedNotes,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create product. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * Validates and parses a positive integer parameter
 * @param value - The parameter value to validate
 * @param defaultValue - Default value if parameter is null or undefined
 * @returns Validated integer or null if invalid
 */
function validatePositiveInteger(
  value: string | null,
  defaultValue: number
): number | null {
  // Use default if not provided
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  // Parse as integer
  const parsed = parseInt(value, 10);

  // Validate: must be a valid number and positive
  if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
    return null;
  }

  // Additional security check: prevent extremely large numbers
  if (parsed > Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return parsed;
}

/**
 * Safely parses JSON string with fallback
 * Prevents crashes from malformed JSON in database
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed JSON or fallback value
 */
function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('[Products API] JSON parse error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jsonString: jsonString.substring(0, 100), // Log first 100 chars only
    });
    return fallback;
  }
}

function determineProductStatus(confidence?: 'high' | 'medium' | 'low'): string {
  if (confidence === 'high') return 'READY';
  if (confidence === 'medium') return 'NEEDS_REVIEW';
  if (confidence === 'low') return 'MANUAL_REQUIRED';
  return 'PROCESSING';
}

function calculateWarrantyDurationMonths(
  start: Date,
  end: Date
): number | null {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return null;
  }

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const totalMonths = years * 12 + months;
  return totalMonths > 0 ? totalMonths : null;
}

function mapProductToMobileShape(
  product: ProductModel,
  extra: { imageUrl?: string; notes?: string | null }
) {
  return {
    id: product.id,
    userId: product.userId,
    name: product.productName,
    brand: product.manufacturerName,
    model: product.modelNumber || '',
    serialNumber: product.serialNumber || undefined,
    category: product.category || 'Uncategorized',
    purchaseDate: product.purchaseDate?.toISOString() ?? new Date().toISOString(),
    purchasePrice: product.purchasePrice ?? undefined,
    retailer: product.retailer || undefined,
    imageUrl: extra.imageUrl,
    notes: extra.notes || undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    status: product.status,
    confidenceScore: product.confidenceScore ?? undefined,
  };
}
