import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id]
 * Retrieves a single product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product with authorization check
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: session.id, // Authorization: Only user's own products
      },
      select: {
        id: true,
        productName: true,
        manufacturerName: true,
        category: true,
        modelNumber: true,
        serialNumber: true,
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
        extractedData: true,
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
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Not found', message: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields safely
    const imageUrls = safeJsonParse(product.imageUrls, []);
    const extractedData = safeJsonParse(product.extractedData, {});
    const notes = extractedData.notes || extractedData.additionalInfo || undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        imageUrls,
        notes,
        // Map backend field names to mobile app expectations
        name: product.productName,
        brand: product.manufacturerName,
        model: product.modelNumber,
      },
    });
  } catch (error) {
    console.error('[Products API] Error fetching product:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch product. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Updates a product by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload', message: 'Unable to parse request body' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.id,
      },
      select: {
        extractedData: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Not found', message: 'Product not found' },
        { status: 404 }
      );
    }

    // Handle notes update in extractedData
    let updatedExtractedData = undefined;
    if (body.notes !== undefined) {
      const currentExtractedData = safeJsonParse(existingProduct.extractedData, {});
      updatedExtractedData = JSON.stringify({
        ...currentExtractedData,
        notes: body.notes,
        updatedAt: new Date().toISOString(),
      });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productName: body.name || body.productName,
        manufacturerName: body.brand || body.manufacturerName,
        modelNumber: body.model || body.modelNumber,
        serialNumber: body.serialNumber,
        category: body.category,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : undefined,
        retailer: body.retailer,
        warrantyDuration: body.warrantyPeriod,
        warrantyStartDate: body.warrantyStartDate ? new Date(body.warrantyStartDate) : undefined,
        warrantyExpiry: body.warrantyEndDate ? new Date(body.warrantyEndDate) : undefined,
        extractedData: updatedExtractedData,
      },
    });

    // Parse extractedData to return notes
    const extractedData = safeJsonParse(updatedProduct.extractedData, {});
    const notes = extractedData.notes || extractedData.additionalInfo || undefined;

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        notes,
        name: updatedProduct.productName,
        brand: updatedProduct.manufacturerName,
        model: updatedProduct.modelNumber,
      },
    });
  } catch (error) {
    console.error('[Products API] Error updating product:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update product. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Deletes a product by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId: session.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Not found', message: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('[Products API] Error deleting product:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete product. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to safely parse JSON fields
 */
function safeJsonParse(value: any, fallback: any = null): any {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Helper to validate positive integers
 */
function validatePositiveInteger(
  value: string | null,
  defaultValue: number
): number | null {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
