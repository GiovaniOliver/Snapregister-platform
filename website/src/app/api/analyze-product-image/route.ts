import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import OpenAI from 'openai';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/**
 * POST /api/analyze-product-image
 * Analyzes a single product image using OpenAI Vision API
 *
 * Request Body (JSON):
 * - image: string (required) - URL or base64 data URI of the image to analyze
 *
 * Request Body (multipart/form-data):
 * - file: File (required) - Image file to analyze (field name: "file")
 *
 * Security:
 * - Requires authentication via session cookie or Authorization header
 * - Input validation to prevent injection attacks
 * - SSRF protection: validates URLs, blocks private IPs, checks DNS resolution
 * - File size limits: max 10MB per file
 * - Allowed file types: image/jpeg, image/png, image/webp, image/gif
 * - Rate limiting should be applied at middleware level
 */

// ============================================================================
// SSRF Protection Configuration
// ============================================================================

/**
 * Allowlist of trusted image hosting domains
 * Only images from these domains will be allowed via URL
 */
const ALLOWED_IMAGE_DOMAINS = [
  // AWS S3 and CloudFront
  'amazonaws.com',
  's3.amazonaws.com',
  'cloudfront.net',

  // Google Cloud Storage
  'googleapis.com',
  'storage.googleapis.com',

  // Azure Storage
  'blob.core.windows.net',
  'azureedge.net',

  // Popular CDNs
  'cloudinary.com',
  'imgix.net',
  'akamaized.net',
  'fastly.net',

  // Image hosting services
  'imgur.com',
  'i.imgur.com',

  // Add your own domain if you host images
  // 'yourdomain.com',
];

/**
 * Private IP ranges that should be blocked (RFC 1918, RFC 6598, etc.)
 */
const PRIVATE_IP_RANGES = [
  // IPv4 Loopback
  { start: '127.0.0.0', end: '127.255.255.255', cidr: '127.0.0.0/8' },

  // IPv4 Private Networks
  { start: '10.0.0.0', end: '10.255.255.255', cidr: '10.0.0.0/8' },
  { start: '172.16.0.0', end: '172.31.255.255', cidr: '172.16.0.0/12' },
  { start: '192.168.0.0', end: '192.168.255.255', cidr: '192.168.0.0/16' },

  // Cloud Metadata IPs (AWS, GCP, Azure)
  { start: '169.254.0.0', end: '169.254.255.255', cidr: '169.254.0.0/16' },

  // Link-local addresses
  { start: '169.254.169.254', end: '169.254.169.254', cidr: '169.254.169.254/32' }, // AWS/GCP/Azure metadata

  // Carrier-grade NAT
  { start: '100.64.0.0', end: '100.127.255.255', cidr: '100.64.0.0/10' },

  // IPv4 Broadcast
  { start: '255.255.255.255', end: '255.255.255.255', cidr: '255.255.255.255/32' },

  // IPv6 Loopback
  { start: '::1', end: '::1', cidr: '::1/128' },

  // IPv6 Link-local
  { start: 'fe80::', end: 'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', cidr: 'fe80::/10' },

  // IPv6 Unique Local Addresses
  { start: 'fc00::', end: 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', cidr: 'fc00::/7' },
];

/**
 * Convert IP address to a comparable number
 * @param ip - IPv4 address string
 * @returns Number representation of IP
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  return (
    (parseInt(parts[0], 10) << 24) +
    (parseInt(parts[1], 10) << 16) +
    (parseInt(parts[2], 10) << 8) +
    parseInt(parts[3], 10)
  );
}

/**
 * Check if an IP address is in a private range
 * @param ip - IP address to check
 * @returns true if IP is private, false otherwise
 */
function isPrivateIP(ip: string): boolean {
  // Handle IPv6 addresses
  if (ip.includes(':')) {
    // IPv6 loopback
    if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
      return true;
    }
    // IPv6 link-local (fe80::/10)
    if (ip.toLowerCase().startsWith('fe80:')) {
      return true;
    }
    // IPv6 unique local (fc00::/7)
    if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) {
      return true;
    }
    return false;
  }

  // IPv4 validation
  const ipNum = ipToNumber(ip);

  for (const range of PRIVATE_IP_RANGES) {
    if (!range.start.includes(':')) { // Only check IPv4 ranges
      const startNum = ipToNumber(range.start);
      const endNum = ipToNumber(range.end);

      if (ipNum >= startNum && ipNum <= endNum) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if hostname is in the allowed domains list
 * @param hostname - Hostname to check
 * @returns true if allowed, false otherwise
 */
function isAllowedDomain(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Check exact match or subdomain match
  return ALLOWED_IMAGE_DOMAINS.some(domain => {
    const lowerDomain = domain.toLowerCase();
    return lowerHostname === lowerDomain || lowerHostname.endsWith('.' + lowerDomain);
  });
}

/**
 * Validate URL to prevent SSRF attacks
 * @param urlString - URL to validate
 * @returns Object with validation result and error message if invalid
 */
async function validateImageUrl(urlString: string): Promise<{ valid: boolean; error?: string }> {
  let parsedUrl: URL;

  // Step 1: Parse URL
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Step 2: Validate protocol - only http and https allowed
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: `Blocked: Invalid protocol "${parsedUrl.protocol}". Only http:// and https:// are allowed.`
    };
  }

  // Step 3: Extract hostname
  const hostname = parsedUrl.hostname.toLowerCase();

  // Step 4: Block localhost variations
  const localhostVariations = [
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '0:0:0:0:0:0:0:1',
  ];

  if (localhostVariations.includes(hostname)) {
    return {
      valid: false,
      error: 'Blocked: Access to localhost is not allowed.'
    };
  }

  // Step 5: Check if hostname is an IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const isIPv4 = ipRegex.test(hostname);
  const isIPv6 = hostname.includes(':');

  if (isIPv4 || isIPv6) {
    // Direct IP access - check if it's a private IP
    if (isPrivateIP(hostname)) {
      return {
        valid: false,
        error: `Blocked: Access to private IP address ${hostname} is not allowed.`
      };
    }

    // Even public IPs should be checked against allowlist
    // This prevents accessing arbitrary public servers
    return {
      valid: false,
      error: 'Blocked: Direct IP access is not allowed. Please use a domain name from an approved image hosting service.'
    };
  }

  // Step 6: Validate domain against allowlist
  if (!isAllowedDomain(hostname)) {
    return {
      valid: false,
      error: `Blocked: Domain "${hostname}" is not in the allowed image hosting domains. Please use images from approved CDNs or contact support to whitelist your domain.`
    };
  }

  // Step 7: Perform DNS resolution to check for DNS rebinding attacks
  try {
    const { address, family } = await dnsLookup(hostname);

    // Check if resolved IP is private
    if (isPrivateIP(address)) {
      console.error(`[SSRF Prevention] DNS rebinding attack detected: ${hostname} resolves to private IP ${address}`);
      return {
        valid: false,
        error: `Blocked: Domain "${hostname}" resolves to a private IP address. This may indicate a DNS rebinding attack.`
      };
    }

    // Log successful validation for security monitoring
    console.log(`[SSRF Prevention] URL validated successfully: ${hostname} -> ${address} (IPv${family})`);

  } catch (dnsError) {
    console.error(`[SSRF Prevention] DNS lookup failed for ${hostname}:`, dnsError);
    return {
      valid: false,
      error: `Blocked: Unable to resolve domain "${hostname}". Please verify the URL is correct.`
    };
  }

  // Step 8: Additional checks for suspicious patterns
  // Block URLs with credentials
  if (parsedUrl.username || parsedUrl.password) {
    return {
      valid: false,
      error: 'Blocked: URLs with embedded credentials are not allowed.'
    };
  }

  // Block non-standard ports that might be used for internal services
  if (parsedUrl.port) {
    const port = parseInt(parsedUrl.port, 10);
    const allowedPorts = [80, 443, 8080, 8443]; // Common HTTP/HTTPS ports
    if (!allowedPorts.includes(port)) {
      return {
        valid: false,
        error: `Blocked: Non-standard port ${port} is not allowed.`
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// File Upload Configuration and Helpers
// ============================================================================

/**
 * Maximum file size for uploaded images (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Convert uploaded file to base64 data URI
 * @param file - File from FormData
 * @returns Base64 data URI string
 */
async function fileToDataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
}

/**
 * Validate uploaded file
 * @param file - File from FormData
 * @returns Object with validation result and error message if invalid
 */
function validateUploadedFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authentication check - supports both web (cookies) and mobile (Authorization header)
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // ========================================================================
    // Handle both JSON and multipart/form-data requests
    // ========================================================================
    let image: string;
    const contentType = req.headers.get('content-type') || '';

    // Check if request is multipart/form-data (file upload from mobile)
    if (contentType.includes('multipart/form-data')) {
      console.log('[Analyze Image] Processing multipart file upload');

      let formData: FormData;
      try {
        formData = await req.formData();
      } catch (formError) {
        console.error('[Analyze Image] Failed to parse FormData:', formError);
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Failed to parse multipart form data'
          },
          { status: 400 }
        );
      }

      // Extract file from FormData (field name: "file")
      const file = formData.get('file');

      if (!file) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'No file provided. Expected file field named "file"'
          },
          { status: 400 }
        );
      }

      if (!(file instanceof File)) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Invalid file format. Expected a File object'
          },
          { status: 400 }
        );
      }

      console.log('[Analyze Image] File received:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)}KB`,
        userId: session.id,
      });

      // Validate uploaded file
      const fileValidation = validateUploadedFile(file);
      if (!fileValidation.valid) {
        console.warn(`[Analyze Image] File validation failed for user ${session.id}:`, fileValidation.error);
        return NextResponse.json(
          {
            error: 'Invalid file',
            message: fileValidation.error || 'File validation failed'
          },
          { status: 400 }
        );
      }

      // Convert file to base64 data URI for OpenAI
      try {
        image = await fileToDataUri(file);
        console.log('[Analyze Image] File converted to data URI successfully');
      } catch (conversionError) {
        console.error('[Analyze Image] Failed to convert file to data URI:', conversionError);
        return NextResponse.json(
          {
            error: 'Processing failed',
            message: 'Failed to process uploaded file'
          },
          { status: 500 }
        );
      }
    } else {
      // Handle JSON request (existing functionality for web/URL uploads)
      console.log('[Analyze Image] Processing JSON request');

      let body;
      try {
        body = await req.json();
      } catch (jsonError) {
        console.error('[Analyze Image] Failed to parse JSON:', jsonError);
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Invalid JSON in request body'
          },
          { status: 400 }
        );
      }

      const { image: imageData } = body;

      // Validate input
      if (!imageData || typeof imageData !== 'string') {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Image data is required and must be a string (URL or data URI)'
          },
          { status: 400 }
        );
      }

      // Validate image format (URL or data URI)
      const isDataUri = imageData.startsWith('data:image/');
      const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://');

      if (!isDataUri && !isUrl) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Image must be a valid URL (http:// or https://) or data URI (data:image/...)'
          },
          { status: 400 }
        );
      }

      // ========================================================================
      // SSRF Protection: Validate URL before processing
      // ========================================================================
      if (isUrl) {
        console.log(`[SSRF Prevention] Validating image URL for user ${session.id}`);

        const validation = await validateImageUrl(imageData);

        if (!validation.valid) {
          console.warn(`[SSRF Prevention] Blocked URL attempt by user ${session.id}: ${validation.error}`);

          return NextResponse.json(
            {
              error: 'Security validation failed',
              message: validation.error || 'The provided URL failed security validation.'
            },
            { status: 403 }
          );
        }

        console.log(`[SSRF Prevention] URL validation passed for user ${session.id}`);
      }

      image = imageData;
    }

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Analyze Image] OpenAI API key not configured');
      return NextResponse.json(
        {
          error: 'Service unavailable',
          message: 'AI service is not configured. Please contact support.'
        },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('[Analyze Image] Starting analysis for user:', session.id);

    // Call OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert product information extractor. Analyze product images and extract all visible information with high accuracy. Return only valid JSON without markdown code blocks.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this product image and extract the following information:
              - Product Name
              - Manufacturer/Brand
              - Model Number
              - Serial Number
              - Any warranty information (duration, start date, etc.)
              - Product Category (APPLIANCE, ELECTRONICS, AUTOMOTIVE, TOOL, FURNITURE, OUTDOOR, SPORTING_GOODS, HOME_GARDEN, OTHER)
              - SKU, UPC, or barcode if visible
              - Any purchase information (price, date, retailer)

              Return the data in JSON format with these exact fields:
              {
                "productName": "string or null",
                "manufacturer": "string or null",
                "modelNumber": "string or null",
                "serialNumber": "string or null",
                "warrantyDuration": "string or null (e.g., '1 year', '2 years')",
                "warrantyType": "string or null (e.g., 'Limited', 'Standard', 'Extended')",
                "category": "string or null",
                "sku": "string or null",
                "upc": "string or null",
                "purchasePrice": "number or null",
                "retailer": "string or null",
                "confidenceScore": "number 0-1 indicating overall extraction confidence",
                "additionalInfo": "any other relevant information found"
              }

              If you cannot find a specific field, set it to null. Be as accurate as possible and conservative with confidence scores.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high' // Use high detail for better OCR
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('[Analyze Image] No response from OpenAI');
      return NextResponse.json(
        {
          error: 'Analysis failed',
          message: 'Failed to analyze image. Please try again.'
        },
        { status: 500 }
      );
    }

    // Parse the JSON response from OpenAI
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('[Analyze Image] Failed to parse OpenAI response:', parseError);
      console.error('[Analyze Image] Raw response:', content);
      return NextResponse.json(
        {
          error: 'Analysis failed',
          message: 'Failed to parse analysis results. Please try again.'
        },
        { status: 500 }
      );
    }

    // Calculate warranty duration in months and expiry date
    let warrantyDurationMonths = null;
    let warrantyExpiry = null;
    let warrantyStartDate = new Date().toISOString();

    if (extractedData.warrantyDuration) {
      const durationMatch = extractedData.warrantyDuration.match(/(\d+)\s*(year|month|day)/i);
      if (durationMatch) {
        const [, amount, unit] = durationMatch;
        const amountNum = parseInt(amount, 10);
        const now = new Date();
        const expiry = new Date(now);

        switch (unit.toLowerCase()) {
          case 'year':
            warrantyDurationMonths = amountNum * 12;
            expiry.setFullYear(expiry.getFullYear() + amountNum);
            break;
          case 'month':
            warrantyDurationMonths = amountNum;
            expiry.setMonth(expiry.getMonth() + amountNum);
            break;
          case 'day':
            warrantyDurationMonths = Math.ceil(amountNum / 30);
            expiry.setDate(expiry.getDate() + amountNum);
            break;
        }

        warrantyExpiry = expiry.toISOString();
      }
    }

    console.log('[Analyze Image] Analysis completed successfully for user:', session.id);
    console.log('[Analyze Image] Detected product:', extractedData.productName || 'Unknown');

    return NextResponse.json({
      success: true,
      data: {
        productName: extractedData.productName || null,
        manufacturer: extractedData.manufacturer || null,
        modelNumber: extractedData.modelNumber || null,
        serialNumber: extractedData.serialNumber || null,
        warrantyDuration: extractedData.warrantyDuration || null,
        warrantyDurationMonths,
        warrantyType: extractedData.warrantyType || null,
        warrantyStartDate,
        warrantyExpiry,
        category: extractedData.category || null,
        sku: extractedData.sku || null,
        upc: extractedData.upc || null,
        purchasePrice: extractedData.purchasePrice || null,
        retailer: extractedData.retailer || null,
        confidenceScore: extractedData.confidenceScore || 0.5,
        additionalInfo: extractedData.additionalInfo || null,
        extractedAt: new Date().toISOString(),
      },
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      }
    });
  } catch (error) {
    // Log error details server-side for debugging
    console.error('[Analyze Image API] Error analyzing image:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check for OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      console.error('[Analyze Image API] OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });

      // Handle specific error cases
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: 'Service configuration error',
            message: 'AI service authentication failed. Please contact support.'
          },
          { status: 503 }
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many analysis requests. Please try again in a few moments.'
          },
          { status: 429 }
        );
      }

      if (error.status === 400 || error.type === 'invalid_request_error') {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'Invalid image format or size. Please try a different image.'
          },
          { status: 400 }
        );
      }
    }

    // Return generic error message to prevent information leakage
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to analyze image. Please try again later.'
      },
      { status: 500 }
    );
  }
}
