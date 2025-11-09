import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions for the response
interface ProductAnalysisResult {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyPeriod: number | null;
  retailer: string | null;
  price: number | null;
  confidence: 'high' | 'medium' | 'low';
  additionalInfo?: string;
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/ai/analyze-product
 *
 * Analyzes 4 product images to extract comprehensive product information:
 * - Serial number photo
 * - Warranty card photo
 * - Receipt photo
 * - Product photo
 *
 * Returns structured JSON with extracted product details
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI Analyze Product] OpenAI API key not configured');
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();

    // Extract images from form data
    const serialNumberImage = formData.get('serialNumberImage') as File | null;
    const warrantyCardImage = formData.get('warrantyCardImage') as File | null;
    const receiptImage = formData.get('receiptImage') as File | null;
    const productImage = formData.get('productImage') as File | null;

    // Validate that at least one image is provided
    if (!serialNumberImage && !warrantyCardImage && !receiptImage && !productImage) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Validate images
    const images = [
      { name: 'serialNumberImage', file: serialNumberImage },
      { name: 'warrantyCardImage', file: warrantyCardImage },
      { name: 'receiptImage', file: receiptImage },
      { name: 'productImage', file: productImage },
    ];

    const validImages: { name: string; base64: string }[] = [];

    for (const { name, file } of images) {
      if (!file) continue;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type for ${name}. Allowed types: jpg, png, webp`
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${name} exceeds 10MB size limit`
          },
          { status: 400 }
        );
      }

      // Convert to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      validImages.push({ name, base64: dataUrl });
    }

    if (validImages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid images provided' },
        { status: 400 }
      );
    }

    // Build the prompt with image context
    const imageDescriptions = validImages.map(img => {
      const descriptions: Record<string, string> = {
        serialNumberImage: 'Photo of the product serial number label',
        warrantyCardImage: 'Photo of the warranty card or warranty document',
        receiptImage: 'Photo of the purchase receipt',
        productImage: 'Photo of the product itself',
      };
      return descriptions[img.name];
    }).join(', ');

    // Create message content with all images
    const messageContent: any[] = [
      {
        type: 'text',
        text: `You are analyzing ${validImages.length} product-related image(s): ${imageDescriptions}.

Please extract ALL available information from these images and return a comprehensive JSON object with the following fields:

{
  "brand": "The manufacturer or brand name (e.g., 'Apple', 'Samsung', 'LG')",
  "model": "The specific model number or name",
  "serialNumber": "The product serial number (look for S/N, Serial, or similar labels)",
  "purchaseDate": "The purchase date in YYYY-MM-DD format (from receipt)",
  "warrantyPeriod": "Warranty duration in months (e.g., 12 for 1 year, 24 for 2 years)",
  "retailer": "The store or retailer name (from receipt)",
  "price": "Purchase price as a number (from receipt, without currency symbols)",
  "confidence": "Your confidence level: 'high', 'medium', or 'low'",
  "additionalInfo": "Any other relevant information found (warranty terms, coverage details, etc.)"
}

INSTRUCTIONS:
- Extract information from ALL provided images
- Cross-reference information between images for accuracy
- For warranty period: convert "1 year" to 12, "2 years" to 24, "90 days" to 3, etc.
- For dates: use YYYY-MM-DD format (e.g., "2024-01-15")
- For price: extract only the number, removing currency symbols
- If a field cannot be determined, set it to null
- Set confidence to 'high' if information is clearly visible, 'medium' if partially visible/inferred, 'low' if very unclear
- In additionalInfo, include any warranty terms, coverage details, or other useful information

Return ONLY valid JSON, no markdown formatting.`,
      },
    ];

    // Add all images to the message
    validImages.forEach(({ base64 }) => {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: base64,
          detail: 'high', // Use high detail for better OCR
        },
      });
    });

    // Call OpenAI Vision API
    console.log(`[AI Analyze Product] Processing ${validImages.length} images for user ${session.id}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o which has excellent vision capabilities
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for more consistent, factual outputs
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let extractedData: ProductAnalysisResult;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[AI Analyze Product] Error parsing OpenAI response:', parseError);
      console.error('[AI Analyze Product] Raw content:', content);

      // Return a more helpful error response
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
        rawResponse: content,
      }, { status: 500 });
    }

    // Validate and sanitize the extracted data
    const sanitizedData: ProductAnalysisResult = {
      brand: extractedData.brand || null,
      model: extractedData.model || null,
      serialNumber: extractedData.serialNumber || null,
      purchaseDate: extractedData.purchaseDate || null,
      warrantyPeriod: extractedData.warrantyPeriod ? Number(extractedData.warrantyPeriod) : null,
      retailer: extractedData.retailer || null,
      price: extractedData.price ? Number(extractedData.price) : null,
      confidence: extractedData.confidence || 'low',
      additionalInfo: extractedData.additionalInfo || undefined,
    };

    // Calculate warranty end date if we have start date and period
    let warrantyEndDate = null;
    if (sanitizedData.purchaseDate && sanitizedData.warrantyPeriod) {
      const startDate = new Date(sanitizedData.purchaseDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + sanitizedData.warrantyPeriod);
      warrantyEndDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    console.log(`[AI Analyze Product] Successfully extracted data with ${sanitizedData.confidence} confidence`);

    return NextResponse.json({
      success: true,
      data: {
        ...sanitizedData,
        warrantyEndDate,
        extractedAt: new Date().toISOString(),
        userId: session.id,
      },
    });

  } catch (error: any) {
    console.error('[AI Analyze Product] Error:', error);

    // Handle specific OpenAI errors
    if (error?.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image format or request. Please ensure images are in JPG, PNG, or WebP format.',
        },
        { status: 400 }
      );
    }

    if (error?.error?.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service quota exceeded. Please contact support.',
        },
        { status: 503 }
      );
    }

    if (error?.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again in a moment.',
        },
        { status: 429 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze images. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
