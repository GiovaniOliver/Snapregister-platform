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

    // Validate required fields - only productName is truly required
    // Manufacturer can fall back to "Unknown Manufacturer" if not provided
    if (!productInfo.productName && !productInfo.name) {
      return NextResponse.json(
        { 
          error: 'Product name is required',
          details: 'productInfo must contain either productName or name field'
        },
        { status: 400 }
      );
    }

    // Note: Manufacturer is not strictly required - will use "Unknown Manufacturer" as fallback

    // Get user profile data from database if userInfo not provided
    let registrationUserInfo = userInfo;
    if (!registrationUserInfo) {
      try {
        // Use a safe query that doesn't fail if fields don't exist
        const user = await prisma.user.findUnique({
          where: { id: session.id },
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Use login email for registration
        const emailForRegistration = user.email;

        // Build registrationUserInfo, only including fields that exist
        registrationUserInfo = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: emailForRegistration,
          phone: user.phone || undefined,
          address: user.address || undefined,
          city: user.city || undefined,
          state: user.state || undefined,
          zipCode: user.zipCode || undefined,
          country: user.country || 'US',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined,
          companyName: user.companyName || undefined,
          alternatePhone: user.alternatePhone || undefined,
        };
      } catch (error: any) {
        // Handle Prisma connection errors
        if (error.code === 'P1001') {
          console.error('[Registration] Database connection error:', error);
          return NextResponse.json(
            { 
              error: 'Database connection failed',
              message: 'Unable to connect to database. Please try again later.'
            },
            { status: 503 }
          );
        }
        // Handle field validation errors
        if (error.code === 'P2009' || error.message?.includes('Unknown field')) {
          console.error('[Registration] Schema mismatch error:', error);
          return NextResponse.json(
            { 
              error: 'Database schema mismatch',
              message: 'The database schema is out of sync. Please contact support.'
            },
            { status: 500 }
          );
        }
        throw error;
      }
    }

    // Normalize product data - handle different field name variations
    const normalizedProductInfo = {
      productName: productInfo.productName || productInfo.name || 'Unknown Product',
      manufacturerName: productInfo.manufacturer || productInfo.manufacturerName || productInfo.brand || 'Unknown Manufacturer',
      modelNumber: productInfo.modelNumber || productInfo.model || null,
      serialNumber: productInfo.serialNumber || null,
      sku: productInfo.sku || null,
      upc: productInfo.upc || null,
      purchaseDate: productInfo.purchaseDate ? new Date(productInfo.purchaseDate) : null,
      purchasePrice: productInfo.purchasePrice || productInfo.price || null,
      retailer: productInfo.retailer || null,
      category: productInfo.category || null,
      imageUrls: productInfo.imageUrls || [],
      extractedData: productInfo.extractedData || productInfo,
      warrantyDuration: productInfo.warrantyDuration || null,
      warrantyStartDate: productInfo.warrantyStartDate ? new Date(productInfo.warrantyStartDate) : null,
      warrantyExpiry: productInfo.warrantyExpiry ? new Date(productInfo.warrantyExpiry) : null,
      warrantyType: productInfo.warrantyType || null,
    };

    // Log normalized data for debugging
    console.log('[Registration Submit] Normalized product info:', {
      productName: normalizedProductInfo.productName,
      manufacturerName: normalizedProductInfo.manufacturerName,
      hasModelNumber: !!normalizedProductInfo.modelNumber,
      hasSerialNumber: !!normalizedProductInfo.serialNumber,
    });

    // Create product record
    const product = await prisma.product.create({
      data: {
        userId: session.id,
        productName: normalizedProductInfo.productName,
        manufacturerName: normalizedProductInfo.manufacturerName,
        modelNumber: normalizedProductInfo.modelNumber,
        serialNumber: normalizedProductInfo.serialNumber,
        sku: normalizedProductInfo.sku,
        upc: normalizedProductInfo.upc,
        purchaseDate: normalizedProductInfo.purchaseDate,
        purchasePrice: normalizedProductInfo.purchasePrice,
        retailer: normalizedProductInfo.retailer,
        category: normalizedProductInfo.category,
        imageUrls: JSON.stringify(normalizedProductInfo.imageUrls),
        extractedData: JSON.stringify(normalizedProductInfo.extractedData),
        status: 'READY',
        warrantyDuration: normalizedProductInfo.warrantyDuration,
        warrantyStartDate: normalizedProductInfo.warrantyStartDate,
        warrantyExpiry: normalizedProductInfo.warrantyExpiry,
        warrantyType: normalizedProductInfo.warrantyType,
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
  } catch (error: any) {
    console.error('Error submitting registration:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to submit registration';
    const isPrismaError = error.code && error.code.startsWith('P');
    
    return NextResponse.json(
      { 
        error: 'Failed to submit registration',
        message: errorMessage,
        details: isPrismaError ? 'Database error occurred' : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}