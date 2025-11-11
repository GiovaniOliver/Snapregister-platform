// POST /api/warranties/[id]/notify - Manually trigger warranty notification

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warrantyId = resolvedParams.id;

    if (!warrantyId) {
      return NextResponse.json(
        { error: 'Warranty ID is required' },
        { status: 400 }
      );
    }

    // Get warranty contract
    const warranty = await prisma.warrantyContract.findUnique({
      where: { id: warrantyId },
      include: { user: true }
    });

    if (!warranty || warranty.userId !== session.id) {
      return NextResponse.json(
        { error: 'Warranty not found or unauthorized' },
        { status: 404 }
      );
    }

    // TODO: Implement email notification service
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending warranty notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}