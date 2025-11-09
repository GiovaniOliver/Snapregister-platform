import { NextRequest, NextResponse } from 'next/server';
import { DataFormatter } from '@/lib/services/data-formatter';
import type { UserData, ProductData } from '@/lib/types/warranty-autofill';

/**
 * POST /api/warranty-autofill/format-data
 * Format user and product data for registration forms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData, productData, options } = body as {
      userData: UserData;
      productData: ProductData;
      options?: {
        dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
        phoneFormat?: 'US' | 'INTERNATIONAL' | 'DASHES' | 'DOTS' | 'SPACES' | 'RAW';
        addressFormat?: 'US_STANDARD' | 'SINGLE_LINE' | 'MULTI_LINE' | 'INTERNATIONAL';
        includeCountryCode?: boolean;
      };
    };

    if (!userData || !productData) {
      return NextResponse.json(
        { error: 'userData and productData are required' },
        { status: 400 }
      );
    }

    const formattedData = DataFormatter.formatRegistrationData(
      userData,
      productData,
      options
    );

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Error formatting data:', error);
    return NextResponse.json(
      { error: 'Failed to format data' },
      { status: 500 }
    );
  }
}
