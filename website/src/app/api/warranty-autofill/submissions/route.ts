import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Uncomment when Prisma is set up

/**
 * GET /api/warranty-autofill/submissions
 * Get submission history for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const registrationId = searchParams.get('registrationId');

    if (!userId && !registrationId) {
      return NextResponse.json(
        { error: 'userId or registrationId is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Prisma query when database is set up
    // const submissions = await prisma.formSubmission.findMany({
    //   where: {
    //     ...(userId && { userId }),
    //     ...(registrationId && { registrationId }),
    //   },
    //   include: {
    //     template: {
    //       select: {
    //         id: true,
    //         formName: true,
    //         manufacturerId: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // });

    // Mock data for development
    const mockSubmissions: any[] = [];

    return NextResponse.json({
      success: true,
      data: mockSubmissions,
      count: mockSubmissions.length,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/warranty-autofill/submissions
 * Create a new form submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, templateId, userId, totalSteps } = body;

    if (!registrationId || !templateId || !userId || !totalSteps) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Prisma query when database is set up
    // const submission = await prisma.formSubmission.create({
    //   data: {
    //     registrationId,
    //     templateId,
    //     userId,
    //     totalSteps,
    //     status: 'IN_PROGRESS',
    //     currentStep: 1,
    //   },
    // });

    // Mock response
    const mockSubmission = {
      id: 'mock-submission-id',
      registrationId,
      templateId,
      userId,
      totalSteps,
      currentStep: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockSubmission,
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}