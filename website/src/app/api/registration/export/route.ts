// API Route: Export Registration Data Package
// GET /api/registration/export?id={registrationId}&format={json|xml|csv}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { exportDataPackage } from '@/lib/data-package-generator';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const registrationId = searchParams.get('id');
    const format = (searchParams.get('format') || 'json') as 'json' | 'xml' | 'csv';

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Fetch registration with related data
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        product: true,
        user: true,
        manufacturer: true,
        attempts: true
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Prepare export data
    const exportData = {
      registration: {
        id: registration.id,
        status: registration.status,
        method: registration.registrationMethod,
        confirmationCode: registration.confirmationCode,
        createdAt: registration.createdAt,
        completedAt: registration.completedAt,
      },
      product: registration.product ? {
        name: registration.product.productName,
        manufacturer: registration.product.manufacturerName,
        modelNumber: registration.product.modelNumber,
        serialNumber: registration.product.serialNumber,
        purchaseDate: registration.product.purchaseDate,
        warrantyExpiry: registration.product.warrantyExpiry,
      } : null,
      user: {
        name: `${registration.user.firstName} ${registration.user.lastName}`,
        email: registration.user.email,
      },
      manufacturer: registration.manufacturer ? {
        name: registration.manufacturer.name,
        website: registration.manufacturer.website,
        supportEmail: registration.manufacturer.supportEmail,
      } : null,
    };

    // Format the response based on requested format
    if (format === 'json') {
      return NextResponse.json(exportData);
    } else if (format === 'csv') {
      // Simple CSV implementation
      const csvRows = [];
      csvRows.push('Field,Value');
      csvRows.push(`Registration ID,${registration.id}`);
      csvRows.push(`Status,${registration.status}`);
      csvRows.push(`Product Name,${registration.product?.productName || ''}`);
      csvRows.push(`Model Number,${registration.product?.modelNumber || ''}`);
      csvRows.push(`Serial Number,${registration.product?.serialNumber || ''}`);

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registration-${registrationId}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting registration data:', error);
    return NextResponse.json(
      { error: 'Failed to export registration data' },
      { status: 500 }
    );
  }
}