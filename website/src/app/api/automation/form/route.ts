/**
 * Form Automation API Endpoint
 * 
 * POST /api/automation/form
 * 
 * Executes automated form filling for product registration using Playwright.
 * This endpoint uses intelligent field detection to work with any manufacturer's form.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chromium } from 'playwright';
import { FormAutomationService, FormFieldMapping } from '@/automation/services/FormAutomationService';
import { RegistrationData } from '@/automation/core/BaseAutomation';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      registrationId,
      registrationUrl,
      fieldMappings,
      options = {}
    } = body;

    if (!registrationUrl) {
      return NextResponse.json(
        { error: 'Registration URL is required' },
        { status: 400 }
      );
    }

    // 3. Get registration and product data
    let registrationData: RegistrationData;
    let productId: string;

    if (registrationId) {
      // Get from existing registration
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          product: {
            include: {
              manufacturer: true
            }
          },
          user: true
        }
      });

      if (!registration || registration.userId !== session.id) {
        return NextResponse.json(
          { error: 'Registration not found or access denied' },
          { status: 404 }
        );
      }

      productId = registration.productId;
      registrationData = {
        firstName: registration.user.firstName,
        lastName: registration.user.lastName,
        email: registration.user.email,
        phone: registration.user.phone || undefined,
        address: registration.user.address || undefined,
        city: registration.user.city || undefined,
        state: registration.user.state || undefined,
        zipCode: registration.user.zipCode || undefined,
        country: registration.user.country || 'US',
        productName: registration.product.productName,
        manufacturerName: registration.product.manufacturer?.name || registration.product.manufacturerName || '',
        modelNumber: registration.product.modelNumber || undefined,
        serialNumber: registration.product.serialNumber || undefined,
        sku: registration.product.sku || undefined,
        upc: registration.product.upc || undefined,
        purchaseDate: registration.product.purchaseDate?.toISOString().split('T')[0],
        purchasePrice: registration.product.purchasePrice || undefined,
        retailer: registration.product.retailer || undefined
      };
    } else {
      // Get from request body
      const { productId: reqProductId, data } = body;

      if (!reqProductId || !data) {
        return NextResponse.json(
          { error: 'Product ID and registration data are required' },
          { status: 400 }
        );
      }

      productId = reqProductId;

      // Verify product belongs to user
      const product = await prisma.product.findUnique({
        where: { id: reqProductId, userId: session.id }
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found or access denied' },
          { status: 404 }
        );
      }

      registrationData = data;
    }

    // 4. Update registration status to PROCESSING
    if (registrationId) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { status: 'PROCESSING' }
      });
    }

    // 5. Execute automation asynchronously
    executeFormAutomationAsync(
      registrationId || 'new',
      registrationUrl,
      registrationData,
      productId,
      fieldMappings as FormFieldMapping | undefined,
      options
    );

    // 6. Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Form automation started',
      registrationId: registrationId || 'new',
      estimatedCompletionTime: 30 // seconds
    });

  } catch (error: any) {
    console.error('[Form Automation API] Error:', error);

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
 * Execute form automation asynchronously
 */
async function executeFormAutomationAsync(
  registrationId: string,
  registrationUrl: string,
  data: RegistrationData,
  productId: string,
  fieldMappings: FormFieldMapping | undefined,
  options: any
): Promise<void> {
  let browser;
  const service = new FormAutomationService({
    headless: options.headless !== false,
    timeout: options.timeout || 30000,
    screenshots: options.screenshots !== false,
    waitForNetworkIdle: options.waitForNetworkIdle !== false,
    fieldDetectionStrategy: options.fieldDetectionStrategy || 'hybrid'
  });

  try {
    console.log(`[Form Automation] Starting automation for registration ${registrationId}...`);

    // Launch browser
    browser = await chromium.launch({
      headless: options.headless !== false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    });

    // Execute automation
    const result = await service.execute(
      browser,
      registrationUrl,
      data,
      fieldMappings
    );

    console.log(`[Form Automation] Completed with status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

    // Update registration if it exists
    if (registrationId !== 'new') {
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          confirmationCode: result.confirmationCode,
          errorMessage: result.errorMessage,
          errorScreenshot: result.screenshotPath,
          completedAt: result.success ? new Date() : undefined,
          lastAttemptAt: new Date()
        }
      });

      // Update product status if successful
      if (result.success) {
        await prisma.product.update({
          where: { id: productId },
          data: { status: 'REGISTERED' }
        });

        // Create success notification
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          select: { userId: true }
        });

        if (registration) {
          await prisma.notification.create({
            data: {
              userId: registration.userId,
              type: 'REGISTRATION_SUCCESS',
              title: 'Warranty Registered Successfully',
              message: `Your product warranty has been registered successfully.${result.confirmationCode ? ` Confirmation: ${result.confirmationCode}` : ''}`,
              actionUrl: `/products/${productId}`
            }
          });
        }
      } else {
        // Create failure notification
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          select: { userId: true }
        });

        if (registration) {
          await prisma.notification.create({
            data: {
              userId: registration.userId,
              type: result.errorType === 'captcha' ? 'MANUAL_ACTION_REQUIRED' : 'REGISTRATION_FAILED',
              title: 'Warranty Registration Needs Attention',
              message: result.errorType === 'captcha'
                ? 'Manual registration required due to CAPTCHA.'
                : `Automatic registration failed: ${result.errorMessage}`,
              actionUrl: `/products/${productId}/register`
            }
          });
        }
      }
    }

  } catch (error: any) {
    console.error('[Form Automation] Unexpected error:', error);

    // Update registration with error
    if (registrationId !== 'new') {
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: 'FAILED',
          errorMessage: `Unexpected error: ${error.message}`
        }
      });
    }
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * GET /api/automation/form?registrationId=xxx
 * 
 * Check status of form automation execution
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findUnique({
      where: {
        id: registrationId,
        userId: session.id
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registrationId: registration.id,
      status: registration.status,
      confirmationCode: registration.confirmationCode,
      errorMessage: registration.errorMessage,
      completedAt: registration.completedAt
    });

  } catch (error: any) {
    console.error('[Form Automation API] Status check error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

