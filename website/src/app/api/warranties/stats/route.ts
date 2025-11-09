import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get warranty statistics for the user
    const products = await prisma.product.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        warrantyExpiry: true,
        warrantyType: true,
      }
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: products.length,
      active: products.filter(p => p.warrantyExpiry && p.warrantyExpiry > now).length,
      expiringSoon: products.filter(p =>
        p.warrantyExpiry &&
        p.warrantyExpiry > now &&
        p.warrantyExpiry <= thirtyDaysFromNow
      ).length,
      expired: products.filter(p => p.warrantyExpiry && p.warrantyExpiry <= now).length,
      lifetime: products.filter(p => p.warrantyType === 'Lifetime').length,
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching warranty stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warranty statistics' },
      { status: 500 }
    );
  }
}