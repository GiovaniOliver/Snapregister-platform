/**
 * Warranty Registration Automation API Endpoint
 *
 * POST /api/automation/execute
 *
 * Executes automated warranty registration for a product.
 * This is a production-ready implementation with proper error handling,
 * authentication, and database integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { AutomationOrchestrator } from '@/automation/services/AutomationOrchestrator';
import type { RegistrationData } from '@/automation';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { productId, headless = true } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Get product with manufacturer
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: user.id
      },
      include: {
        manufacturer: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Check if manufacturer has automation
    const { manufacturer } = product;

    if (!manufacturer) {
      return NextResponse.json(
        {
          error: 'Manufacturer not found for this product',
          fallback: 'manual'
        },
        { status: 400 }
      );
    }

    if (!manufacturer.automationAvailable) {
      return NextResponse.json(
        {
          error: 'Automation not available for this manufacturer',
          manufacturer: manufacturer.name,
          fallback: 'manual',
          registrationUrl: manufacturer.registrationUrl
        },
        { status: 400 }
      );
    }

    // 6. Check if already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        productId: product.id,
        status: 'SUCCESS'
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          error: 'Product already registered',
          registrationId: existingRegistration.id,
          confirmationCode: existingRegistration.confirmationCode
        },
        { status: 400 }
      );
    }

    // 7. Prepare registration data
    const registrationData: RegistrationData = {
      // User info
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || undefined,

      // Address
      address: user.address || undefined,
      city: user.city || undefined,
      state: user.state || undefined,
      zipCode: user.zipCode || undefined,
      country: user.country || 'US',

      // Product info
      productName: product.productName,
      manufacturerName: manufacturer.name,
      modelNumber: product.modelNumber || undefined,
      serialNumber: product.serialNumber || undefined, // Will be decrypted if encrypted
      sku: product.sku || undefined,
      upc: product.upc || undefined,

      // Purchase info
      purchaseDate: product.purchaseDate?.toISOString().split('T')[0],
      purchasePrice: product.purchasePrice || undefined,
      retailer: product.retailer || undefined,
    };

    // 8. Create registration record
    const registration = await prisma.registration.create({
      data: {
        productId: product.id,
        userId: user.id,
        manufacturerId: manufacturer.id,
        registrationMethod:
          manufacturer.automationType === 'reliable'
            ? 'AUTOMATION_RELIABLE'
            : 'AUTOMATION_EXPERIMENTAL',
        status: 'PROCESSING',
        automationScript: manufacturer.automationScript,
        scriptVersion: manufacturer.scriptVersion,
        manufacturerUrl: manufacturer.registrationUrl || undefined,
      }
    });

    // 9. Execute automation asynchronously
    // Note: This runs in the background and updates the database when complete
    executeAutomationAsync(
      registration.id,
      manufacturer.name,
      registrationData,
      product.id,
      { headless }
    );

    // 10. Return immediate response
    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      status: 'PROCESSING',
      message: 'Automation started. You will be notified when complete.',
      estimatedCompletionTime: 30 // seconds
    });

  } catch (error: any) {
    console.error('[Automation API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Execute automation asynchronously and update database
 */
async function executeAutomationAsync(
  registrationId: string,
  manufacturer: string,
  data: RegistrationData,
  productId: string,
  options: { headless?: boolean }
): Promise<void> {
  const orchestrator = new AutomationOrchestrator({
    headless: options.headless ?? true,
    screenshots: true,
    maxRetries: 3
  });

  try {
    console.log(`[Automation] Starting registration for ${manufacturer}...`);

    // Execute automation
    const result = await orchestrator.executeRegistration(manufacturer, data);

    console.log(`[Automation] Completed with status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

    // Update registration with result
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: result.success ? 'SUCCESS' : 'FAILED',
        confirmationCode: result.confirmationCode,
        errorMessage: result.errorMessage,
        errorScreenshot: result.screenshotPath,
        completedAt: result.success ? new Date() : undefined,
        automationAttempts: result.attemptNumber || 1,
        lastAttemptAt: new Date(),
      }
    });

    // Create attempt record
    await prisma.registrationAttempt.create({
      data: {
        registrationId,
        attemptNumber: result.attemptNumber || 1,
        method: result.success ? 'AUTOMATION_RELIABLE' : 'AUTOMATION_EXPERIMENTAL',
        startedAt: new Date(Date.now() - result.duration),
        completedAt: new Date(),
        success: result.success,
        errorMessage: result.errorMessage,
        errorType: result.errorType,
        screenshot: result.screenshotPath,
        htmlSnapshot: result.htmlSnapshot,
        durationMs: result.duration,
      }
    });

    // Update product status if successful
    if (result.success) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: 'REGISTERED' }
      });

      // Create success notification
      await prisma.notification.create({
        data: {
          userId: (await prisma.registration.findUnique({
            where: { id: registrationId },
            select: { userId: true }
          }))!.userId,
          type: 'REGISTRATION_SUCCESS',
          title: 'Warranty Registered Successfully',
          message: `Your ${data.productName} warranty has been registered with ${manufacturer}.`,
          actionUrl: `/products/${productId}`,
        }
      });

      // TODO: Send success email
    } else {
      // Create failure notification
      await prisma.notification.create({
        data: {
          userId: (await prisma.registration.findUnique({
            where: { id: registrationId },
            select: { userId: true }
          }))!.userId,
          type: result.errorType === 'captcha' ? 'MANUAL_ACTION_REQUIRED' : 'REGISTRATION_FAILED',
          title: 'Warranty Registration Needs Attention',
          message: result.errorType === 'captcha'
            ? `Manual registration required for your ${data.productName}.`
            : `Automatic registration failed for your ${data.productName}.`,
          actionUrl: `/products/${productId}/register`,
        }
      });

      // TODO: Send failure email with manual instructions
    }

  } catch (error: any) {
    console.error('[Automation] Unexpected error:', error);

    // Update registration with error
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'FAILED',
        errorMessage: `Unexpected error: ${error.message}`,
      }
    });

  } finally {
    // Cleanup
    await orchestrator.shutdown();
  }
}

/**
 * GET /api/automation/execute?registrationId=xxx
 *
 * Check status of an automation execution
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get registration ID from query
    const searchParams = request.nextUrl.searchParams;
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get registration
    const registration = await prisma.registration.findUnique({
      where: {
        id: registrationId,
        userId: user.id
      },
      include: {
        attempts: {
          orderBy: { attemptNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Return status
    return NextResponse.json({
      registrationId: registration.id,
      status: registration.status,
      confirmationCode: registration.confirmationCode,
      errorMessage: registration.errorMessage,
      completedAt: registration.completedAt,
      attempts: registration.automationAttempts,
      lastAttempt: registration.attempts[0] || null
    });

  } catch (error: any) {
    console.error('[Automation API] Status check error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
