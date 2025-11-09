/**
 * Next.js API route for warranty analysis
 * Proxies requests to Python microservice
 */

import { NextRequest, NextResponse } from 'next/server';

const WARRANTY_SERVICE_URL = process.env.WARRANTY_SERVICE_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();

    // Validate required fields
    const file = formData.get('file');
    const userId = formData.get('user_id');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          detail: 'Only PDF and image files (PNG, JPEG) are supported'
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          detail: `Maximum file size is ${maxSize / (1024 * 1024)}MB`
        },
        { status: 413 }
      );
    }

    // Forward request to warranty analyzer service
    const serviceFormData = new FormData();
    serviceFormData.append('file', file);
    serviceFormData.append('user_id', userId.toString());

    const productId = formData.get('product_id');
    if (productId) {
      serviceFormData.append('product_id', productId.toString());
    }

    console.log(`Forwarding warranty analysis request to: ${WARRANTY_SERVICE_URL}/analyze-warranty`);

    const response = await fetch(`${WARRANTY_SERVICE_URL}/analyze-warranty`, {
      method: 'POST',
      body: serviceFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Warranty service error:', data);
      return NextResponse.json(
        {
          error: data.error || 'Failed to analyze warranty',
          detail: data.detail
        },
        { status: response.status }
      );
    }

    // Return successful analysis
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in warranty analysis API route:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check service health
export async function GET() {
  try {
    const response = await fetch(`${WARRANTY_SERVICE_URL}/health`);
    const data = await response.json();

    return NextResponse.json({
      status: 'ok',
      warrantyService: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Warranty service unavailable'
      },
      { status: 503 }
    );
  }
}
