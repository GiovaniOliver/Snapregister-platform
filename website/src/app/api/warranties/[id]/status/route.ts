// GET /api/warranties/[id]/status - Get warranty status

import { NextRequest, NextResponse } from 'next/server';
import { getWarrantyStatus } from '@/services/warranty-service';
import { getServerSession } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const warrantyId = params.id;

    if (!warrantyId) {
      return NextResponse.json(
        { error: 'Warranty ID is required' },
        { status: 400 }
      );
    }

    // Get warranty status
    const result = await getWarrantyStatus(warrantyId);

    // Verify ownership
    if (result.warranty.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      warranty: result.warranty,
      status: result.statusInfo,
    });
  } catch (error: any) {
    console.error('Error fetching warranty status:', error);

    if (error.message === 'Warranty not found') {
      return NextResponse.json(
        { success: false, error: 'Warranty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch warranty status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
