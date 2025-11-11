// API Route: Submit Product Registration
// POST /api/registration/submit - Create complete registration

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productInfo, userInfo } = body;

    if (!productInfo) {
      return NextResponse.json(
        { error: 'Product information is required' },
        { status: 400 }
      );
    }

    // Get user profile data from database if userInfo not provided
    let registrationUserInfo = userInfo;
    if (!registrationUserInfo) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          addressLine2: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          dateOfBirth: true,
          companyName: true,
          alternatePhone: true,
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Use login email for registration
      const emailForRegistration = user.email;

      registrationUserInfo = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: emailForRegistration,
        phone: user.phone || undefined,
        address: user.address || undefined,
        addressLine2: user.addressLine2 || undefined,
        city: user.city || undefined,
        state: user.state || undefined,
        zipCode: user.zipCode || undefined,
        country: user.country || 'US',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined,
        companyName: user.companyName || undefined,
        alternatePhone: user.alternatePhone || undefined,
      };
    }

    // Create product record
    const product = await prisma.product.create({
      data: {
        userId: session.id,
        productName: productInfo.productName,
        manufacturerName: productInfo.manufacturer || productInfo.manufacturerName,
        modelNumber: productInfo.modelNumber || null,
        serialNumber: productInfo.serialNumber || null,
        sku: productInfo.sku || null,
        upc: productInfo.upc || null,
        purchaseDate: productInfo.purchaseDate ? new Date(productInfo.purchaseDate) : null,
        purchasePrice: productInfo.purchasePrice || null,
        retailer: productInfo.retailer || null,
        category: productInfo.category || null,
        imageUrls: JSON.stringify(productInfo.imageUrls || []),
        extractedData: JSON.stringify(productInfo.extractedData || {}),
        status: 'READY',
        warrantyDuration: productInfo.warrantyDuration || null,
        warrantyStartDate: productInfo.warrantyStartDate ? new Date(productInfo.warrantyStartDate) : null,
        warrantyExpiry: productInfo.warrantyExpiry ? new Date(productInfo.warrantyExpiry) : null,
        warrantyType: productInfo.warrantyType || null,
      }
    });

    // Create registration record
    const registration = await prisma.registration.create({
      data: {
        productId: product.id,
        userId: session.id,
        registrationMethod: 'AUTOMATION_RELIABLE',
        status: 'PENDING',
      }
    });

    return NextResponse.json({
      success: true,
      productId: product.id,
      registrationId: registration.id,
      message: 'Product registered successfully'
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    return NextResponse.json(
      { error: 'Failed to submit registration' },
      { status: 500 }
    );
  }
}