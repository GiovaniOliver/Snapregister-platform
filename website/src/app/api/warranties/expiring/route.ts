// GET /api/warranties/expiring - Get warranties expiring soon

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daysAhead = parseInt(searchParams.get('days') || '30', 10);

    // Validate daysAhead parameter
    if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 365.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Get expiring warranties
    const products = await prisma.product.findMany({
      where: {
        userId: session.id,
        warrantyExpiry: {
          gte: now,
          lte: futureDate,
        },
      },
      select: {
        id: true,
        productName: true,
        manufacturerName: true,
        warrantyType: true,
        warrantyExpiry: true,
      },
      orderBy: {
        warrantyExpiry: 'asc',
      },
    });

    const warranties = products.map((product) => {
      const daysRemaining = Math.ceil(
        (product.warrantyExpiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: product.id,
        productName: product.productName,
        manufacturer: product.manufacturerName,
        warrantyType: product.warrantyType || 'Standard',
        expiryDate: product.warrantyExpiry,
        daysRemaining,
        status: daysRemaining <= 7 ? 'critical' : 'warning',
        productId: product.id,
      };
    });

    return NextResponse.json({
      success: true,
      count: warranties.length,
      daysAhead,
      warranties,
    });
  } catch (error: any) {
    console.error('Error fetching expiring warranties:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch expiring warranties',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
