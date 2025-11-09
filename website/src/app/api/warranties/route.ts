import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { WarrantyStatus } from '@/types/warranty';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products with warranty information for the user
    const products = await prisma.product.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        productName: true,
        manufacturerName: true,
        warrantyStartDate: true,
        warrantyExpiry: true,
        warrantyType: true,
        warrantyDuration: true,
      },
      orderBy: {
        warrantyExpiry: 'asc',
      }
    });

    const now = new Date();

    // Transform products into warranty objects with calculated status
    const warranties = products
      .filter(p => p.warrantyExpiry) // Only include products with warranty expiry dates
      .map(product => {
        const expiryDate = product.warrantyExpiry!;
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let status: WarrantyStatus;
        if (product.warrantyType === 'Lifetime') {
          status = WarrantyStatus.LIFETIME;
        } else if (daysRemaining < 0) {
          status = WarrantyStatus.EXPIRED;
        } else if (daysRemaining <= 30) {
          status = WarrantyStatus.EXPIRING_SOON;
        } else {
          status = WarrantyStatus.ACTIVE;
        }

        return {
          id: product.id,
          productName: product.productName,
          manufacturer: product.manufacturerName,
          startDate: product.warrantyStartDate,
          expiryDate: product.warrantyExpiry,
          warrantyType: product.warrantyType || 'Standard',
          status,
          daysRemaining: daysRemaining >= 0 ? daysRemaining : null,
        };
      });

    return NextResponse.json({
      success: true,
      warranties,
      count: warranties.length,
    });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warranties' },
      { status: 500 }
    );
  }
}
