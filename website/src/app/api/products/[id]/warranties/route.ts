import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id]/warranties
 * Retrieves all warranties associated with a specific product
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

    const { id: productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // First verify the product exists and belongs to the user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: session.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Not found', message: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch warranty contracts for this product
    const warrantyContracts = await prisma.warrantyContract.findMany({
      where: {
        productId: productId,
        userId: session.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map warranty contracts to mobile app format
    const warranties = warrantyContracts.map((warranty) => ({
      id: warranty.id,
      productId: warranty.productId,
      provider: 'Manufacturer', // Default provider
      type: warranty.documentType || 'standard',
      startDate: warranty.startDate?.toISOString() || new Date().toISOString(),
      endDate: warranty.expiryDate?.toISOString() || new Date().toISOString(),
      duration: warranty.duration || `${warranty.durationMonths || 12} months`,
      durationMonths: warranty.durationMonths || 12,
      isActive: warranty.status === 'ACTIVE' || warranty.status === 'PROCESSING',
      coverageDetails: warranty.aiSummary || '',
      terms: warranty.contractText || '',
      documentUrl: warranty.documentUrl,
      claimProcedure: warranty.claimProcedure || '',
      status: warranty.status,
      createdAt: warranty.createdAt.toISOString(),
      updatedAt: warranty.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: warranties,
      count: warranties.length,
    });
  } catch (error) {
    console.error('[Warranties API] Error fetching product warranties:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch warranties. Please try again later.',
      },
      { status: 500 }
    );
  }
}
