// PUT /api/warranties/[id]/extend - Extend warranty

import { NextRequest, NextResponse } from 'next/server';
import { extendWarrantyContract } from '@/services/warranty-service';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const extendSchema = z.object({
  extensionMonths: z.number().min(1).max(120),
  notes: z.string().optional(),
});

export async function PUT(
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

    // Parse and validate request body
    const body = await request.json();
    const validation = extendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { extensionMonths, notes } = validation.data;

    // Extend warranty
    const result = await extendWarrantyContract({
      warrantyId,
      extensionMonths,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }

    // Verify ownership
    if (result.warranty.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      warranty: result.warranty,
    });
  } catch (error: any) {
    console.error('Error extending warranty:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extend warranty',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
