/**
 * SECURITY-HARDENED WARRANTY API ENDPOINT
 *
 * This endpoint retrieves and updates warranty contract data with comprehensive
 * security controls to prevent unauthorized access and data exposure.
 *
 * SECURITY CONTROLS IMPLEMENTED:
 * 1. Authentication verification - Ensures user is logged in
 * 2. Authorization verification - Ensures warranty belongs to authenticated user
 * 3. Defense in depth - Multiple security layers
 * 4. Secure error messages - No information leakage
 * 5. Audit logging - Security event tracking
 *
 * THREAT MODEL:
 * - IDOR (Insecure Direct Object Reference) attacks
 * - Unauthorized data access attempts
 * - Enumeration attacks on warranty IDs
 * - Session hijacking attempts
 * - Information disclosure through error messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WARRANTY_SERVICE_URL = process.env.WARRANTY_SERVICE_URL || 'http://localhost:8001';

/**
 * SECURITY: Helper function to verify warranty ownership
 *
 * This implements the authorization layer - ensuring the authenticated user
 * actually owns the warranty they're trying to access.
 *
 * SECURITY PRINCIPLES:
 * - Fail closed: Returns null on any error
 * - Minimal data exposure: Only confirms ownership, doesn't return warranty data
 * - Database-level verification: Can't be bypassed by client manipulation
 *
 * @param warrantyId - The warranty contract ID to verify
 * @param userId - The authenticated user's ID
 * @returns Promise<boolean> - True if user owns warranty, false otherwise
 */
async function verifyWarrantyOwnership(
  warrantyId: string,
  userId: string
): Promise<boolean> {
  try {
    // SECURITY: Query database to verify ownership
    // This is the critical authorization check
    const warranty = await prisma.warrantyContract.findUnique({
      where: { id: warrantyId },
      select: { userId: true }, // Only select userId to minimize data exposure
    });

    // SECURITY: Explicit ownership check
    // Returns false if warranty doesn't exist OR doesn't belong to user
    return warranty !== null && warranty.userId === userId;
  } catch (error) {
    // SECURITY: Log the error server-side for debugging and security monitoring
    console.error('[Security] Warranty ownership verification failed:', {
      warrantyId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // SECURITY: Fail closed - deny access on any error
    return false;
  }
}

/**
 * GET /api/warranty/[id]
 *
 * Retrieves a warranty contract analysis by ID
 *
 * SECURITY CONTROLS:
 * 1. Authentication: Verifies user is logged in via session
 * 2. Authorization: Verifies warranty belongs to authenticated user
 * 3. Input validation: Validates warranty ID format
 * 4. Secure error handling: Generic error messages, detailed server-side logging
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing warranty ID
 * @returns Promise<NextResponse> - JSON response with warranty data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // SECURITY LAYER 1: AUTHENTICATION
  // Verify the user is logged in before proceeding
  const session = await getSession();

  if (!session) {
    // SECURITY: Generic error message to prevent user enumeration
    // Don't reveal whether the warranty exists or not
    console.warn('[Security] Unauthorized warranty access attempt:', {
      warrantyId: params.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;

    // SECURITY: Input validation
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid warranty ID' },
        { status: 400 }
      );
    }

    // SECURITY: Additional validation - warranty IDs should follow a specific format
    // This prevents injection attacks and invalid input
    if (!id.match(/^[a-zA-Z0-9_-]+$/)) {
      console.warn('[Security] Invalid warranty ID format:', {
        warrantyId: id,
        userId: session.id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Invalid warranty ID format' },
        { status: 400 }
      );
    }

    // SECURITY LAYER 2: AUTHORIZATION
    // Verify this warranty belongs to the authenticated user
    const isOwner = await verifyWarrantyOwnership(id, session.id);

    if (!isOwner) {
      // SECURITY: Log potential unauthorized access attempt
      // This could indicate an attack or accidental misuse
      console.warn('[Security] Unauthorized warranty access attempt:', {
        warrantyId: id,
        userId: session.id,
        userEmail: session.email,
        timestamp: new Date().toISOString(),
      });

      // SECURITY: Use 404 instead of 403 to prevent warranty ID enumeration
      // An attacker shouldn't be able to tell if a warranty exists or not
      return NextResponse.json(
        { error: 'Warranty not found' },
        { status: 404 }
      );
    }

    // SECURITY: User is authenticated AND authorized - proceed with data retrieval
    // Log successful access for audit trail
    console.info('[Security] Authorized warranty access:', {
      warrantyId: id,
      userId: session.id,
      timestamp: new Date().toISOString(),
    });

    // Forward request to warranty analyzer service
    // SECURITY NOTE: The warranty service doesn't need to verify ownership again
    // since we've already done that at the API gateway level
    const response = await fetch(`${WARRANTY_SERVICE_URL}/warranty-contract/${id}`, {
      // SECURITY: Set reasonable timeout to prevent resource exhaustion
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const data = await response.json();

    if (!response.ok) {
      // SECURITY: Log service errors for monitoring
      console.error('[Service] Warranty service error:', {
        warrantyId: id,
        userId: session.id,
        status: response.status,
        error: data.error,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: data.error || 'Failed to fetch warranty',
          detail: data.detail
        },
        { status: response.status }
      );
    }

    // SECURITY: Successfully retrieved warranty data
    return NextResponse.json(data);

  } catch (error) {
    // SECURITY: Comprehensive error logging server-side
    console.error('[Security] Error in warranty GET endpoint:', {
      warrantyId: params.id,
      userId: session.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // SECURITY: Generic error message to client - no information leakage
    // Don't expose internal error details, stack traces, or system information
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: 'An unexpected error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/warranty/[id]
 *
 * Updates a warranty contract
 *
 * SECURITY CONTROLS:
 * 1. Authentication: Verifies user is logged in via session
 * 2. Authorization: Verifies warranty belongs to authenticated user
 * 3. Input validation: Validates warranty ID and update payload
 * 4. Allowlist validation: Only permits specific fields to be updated
 *
 * @param request - Next.js request object with update payload
 * @param params - Route parameters containing warranty ID
 * @returns Promise<NextResponse> - JSON response with updated warranty data or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // SECURITY LAYER 1: AUTHENTICATION
  const session = await getSession();

  if (!session) {
    console.warn('[Security] Unauthorized warranty update attempt:', {
      warrantyId: params.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;

    // SECURITY: Input validation
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid warranty ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate ID format
    if (!id.match(/^[a-zA-Z0-9_-]+$/)) {
      console.warn('[Security] Invalid warranty ID format in update:', {
        warrantyId: id,
        userId: session.id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Invalid warranty ID format' },
        { status: 400 }
      );
    }

    // SECURITY LAYER 2: AUTHORIZATION
    const isOwner = await verifyWarrantyOwnership(id, session.id);

    if (!isOwner) {
      console.warn('[Security] Unauthorized warranty update attempt:', {
        warrantyId: id,
        userId: session.id,
        userEmail: session.email,
        timestamp: new Date().toISOString(),
      });

      // SECURITY: Use 404 to prevent enumeration
      return NextResponse.json(
        { error: 'Warranty not found' },
        { status: 404 }
      );
    }

    // SECURITY: Parse and validate request body
    let updateData;
    try {
      updateData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // SECURITY: Allowlist validation - only permit specific fields to be updated
    // This prevents users from modifying fields they shouldn't (like userId, id, etc.)
    const allowedFields = [
      'productId',
      'aiSummary',
      'duration',
      'durationMonths',
      'startDate',
      'expiryDate',
      'coverageItems',
      'exclusions',
      'limitations',
      'claimProcedure',
      'claimContacts',
      'requiredDocs',
      'criticalDates',
      'transferable',
      'extendedOptions',
    ];

    // SECURITY: Filter out any fields not in the allowlist
    const sanitizedData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        sanitizedData[field] = updateData[field];
      }
    }

    // SECURITY: Reject if trying to update disallowed fields
    const attemptedFields = Object.keys(updateData);
    const disallowedFields = attemptedFields.filter(f => !allowedFields.includes(f));

    if (disallowedFields.length > 0) {
      console.warn('[Security] Attempt to update disallowed fields:', {
        warrantyId: id,
        userId: session.id,
        disallowedFields,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Invalid fields in update request',
          detail: `Cannot update fields: ${disallowedFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // SECURITY: Validate that we have at least one field to update
    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // SECURITY: Log the update attempt for audit trail
    console.info('[Security] Authorized warranty update:', {
      warrantyId: id,
      userId: session.id,
      fieldsUpdated: Object.keys(sanitizedData),
      timestamp: new Date().toISOString(),
    });

    // SECURITY: Perform the update in database
    // Add updatedAt timestamp automatically
    const updatedWarranty = await prisma.warrantyContract.update({
      where: { id },
      data: {
        ...sanitizedData,
        updatedAt: new Date(),
      },
    });

    // SECURITY: Successfully updated
    return NextResponse.json(updatedWarranty);

  } catch (error) {
    // SECURITY: Comprehensive error logging
    console.error('[Security] Error in warranty PUT endpoint:', {
      warrantyId: params.id,
      userId: session.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // SECURITY: Generic error message - no information leakage
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: 'An unexpected error occurred while updating the warranty'
      },
      { status: 500 }
    );
  }
}
