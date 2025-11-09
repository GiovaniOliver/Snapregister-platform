// API Route: Submit Product Registration
// POST /api/registration/submit - Create complete registration

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

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

    if (!productInfo || !userInfo) {
      return NextResponse.json(
        { error: 'Product and user information are required' },
        { status: 400 }
      );
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