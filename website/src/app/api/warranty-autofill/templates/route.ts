import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Uncomment when Prisma is set up

/**
 * GET /api/warranty-autofill/templates
 * Get all form templates or filter by manufacturer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturerId = searchParams.get('manufacturerId');

    // TODO: Replace with actual Prisma query when database is set up
    // const templates = await prisma.manufacturerFormTemplate.findMany({
    //   where: manufacturerId ? { manufacturerId } : { isActive: true },
    //   include: {
    //     manufacturer: {
    //       select: {
    //         id: true,
    //         name: true,
    //         logo: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     timesUsed: 'desc',
    //   },
    // });

    // Mock data for development
    const mockTemplates = [
      {
        id: 'template_1',
        manufacturerId: 'samsung',
        manufacturerName: 'Samsung',
        formName: 'Standard Warranty Registration',
        formUrl: 'https://www.samsung.com/us/support/warranty/',
        formType: 'WEB_FORM',
        screenshotUrl: '/templates/samsung-registration.png',
        fieldMappings: [
          {
            ourField: 'firstName',
            theirFieldName: 'first_name',
            theirFieldId: 'firstName',
            theirFieldType: 'text',
            required: true,
          },
          {
            ourField: 'lastName',
            theirFieldName: 'last_name',
            theirFieldId: 'lastName',
            theirFieldType: 'text',
            required: true,
          },
          {
            ourField: 'email',
            theirFieldName: 'email',
            theirFieldId: 'email',
            theirFieldType: 'email',
            required: true,
          },
          {
            ourField: 'serialNumber',
            theirFieldName: 'serial_number',
            theirFieldId: 'serialNumber',
            theirFieldType: 'text',
            required: true,
            helpText: 'Enter serial number without spaces or dashes',
          },
          {
            ourField: 'modelNumber',
            theirFieldName: 'model_number',
            theirFieldId: 'modelNumber',
            theirFieldType: 'text',
            required: true,
          },
          {
            ourField: 'purchaseDate',
            theirFieldName: 'purchase_date',
            theirFieldId: 'purchaseDate',
            theirFieldType: 'date',
            required: true,
          },
        ],
        instructions: [
          {
            step: 1,
            title: 'Open Registration Form',
            description: 'Click the "Open Form" button to navigate to Samsung\'s warranty registration page in a new tab.',
            estimatedTimeSeconds: 30,
          },
          {
            step: 2,
            title: 'Enter Personal Information',
            description: 'Copy and paste your name, email, and phone number into the corresponding fields.',
            fieldsToCopy: ['firstName', 'lastName', 'email', 'phone'],
            estimatedTimeSeconds: 60,
          },
          {
            step: 3,
            title: 'Enter Product Information',
            description: 'Copy the serial number and model number. Make sure to remove any spaces or dashes from the serial number.',
            fieldsToCopy: ['serialNumber', 'modelNumber', 'purchaseDate'],
            estimatedTimeSeconds: 60,
            notes: 'Samsung requires serial numbers without spaces. Use the formatted version.',
          },
          {
            step: 4,
            title: 'Submit Form',
            description: 'Review your information and click Submit. You should receive a confirmation email.',
            estimatedTimeSeconds: 30,
          },
        ],
        lastVerified: new Date('2024-01-15'),
        verifiedWorking: true,
        difficulty: 'EASY',
        estimatedTime: 3,
        requiresCaptcha: false,
        requiresAccount: false,
        timesUsed: 150,
        successCount: 145,
        failureCount: 5,
        avgCompletionTime: 180,
        isActive: true,
      },
    ];

    const filteredTemplates = manufacturerId
      ? mockTemplates.filter((t) => t.manufacturerId === manufacturerId)
      : mockTemplates;

    return NextResponse.json({
      success: true,
      data: filteredTemplates,
      count: filteredTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/warranty-autofill/templates
 * Create a new form template (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Add authentication check here
    // TODO: Validate request body

    // TODO: Replace with actual Prisma query when database is set up
    // const template = await prisma.manufacturerFormTemplate.create({
    //   data: body,
    // });

    return NextResponse.json({
      success: true,
      message: 'Template creation endpoint - to be implemented with Prisma',
      data: body,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
