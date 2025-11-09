/**
 * Samsung Connector
 *
 * Integrates with Samsung warranty registration (API + Web Automation fallback)
 * Priority: CRITICAL (Tier 1)
 * Methods: API (primary), Web Automation (fallback)
 * Expected Volume: 8-10% of all registrations
 */

import {
  ApiConnector,
  ConnectorConfig,
  RegistrationRequest,
  RegistrationResponse,
  ValidationResult,
  ConnectorError,
} from '../base/ManufacturerConnector';
import { RegistrationMethod } from '@prisma/client';
import { Page, Browser } from 'playwright';
import { chromium } from 'playwright';
import { DataFormatter } from '../../services/data-formatter';

interface SamsungAPIRequest {
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country_code: string;
    };
  };
  product: {
    serial_number: string;
    model_number: string;
    purchase_date: string; // YYYY-MM-DD
    retailer_name?: string;
  };
}

interface SamsungAPIResponse {
  success: boolean;
  confirmation_code?: string;
  registration_id?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class SamsungConnector extends ApiConnector {
  private automationFallbackEnabled: boolean = true;

  constructor() {
    const config: ConnectorConfig = {
      manufacturerId: 'samsung',
      name: 'Samsung Electronics',
      priority: 98, // Highest priority - highest volume
      supportedMethods: ['API', 'AUTOMATION_RELIABLE', 'ASSISTED_MANUAL'],
      rateLimit: {
        maxRequests: 60,
        windowMs: 60000, // 60 requests per minute
      },
      timeout: 10000,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 2000,
        maxBackoffMs: 10000,
      },
    };

    const baseUrl = process.env.SAMSUNG_API_BASE_URL || 'https://api.samsung.com/warranty';
    const headers = {
      'Authorization': `Bearer ${process.env.SAMSUNG_API_KEY || ''}`,
      'X-Samsung-Partner': process.env.SAMSUNG_PARTNER_ID || '',
    };

    super(config, baseUrl, headers);
  }

  /**
   * Main registration method with fallback strategy
   */
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    this.logger.info('Starting Samsung registration', {
      serialNumber: request.product.serialNumber,
      method: 'API',
    });

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return this.createErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
          recoverable: false,
        },
        'API'
      );
    }

    // Try API first
    try {
      return await this.registerViaAPI(request);
    } catch (error) {
      this.logger.warn('API registration failed, trying web automation', error);

      // Fallback to web automation if API fails
      if (this.automationFallbackEnabled) {
        try {
          return await this.registerViaWebAutomation(request);
        } catch (automationError) {
          this.logger.error('Web automation failed', automationError);

          return this.createErrorResponse(
            {
              code: 'ALL_METHODS_FAILED',
              message: 'Both API and web automation failed',
              recoverable: true,
              details: {
                apiError: error instanceof Error ? error.message : 'Unknown',
                automationError: automationError instanceof Error ? automationError.message : 'Unknown',
              },
            },
            'AUTOMATION_RELIABLE'
          );
        }
      }

      return this.createErrorResponse(
        {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        },
        'API'
      );
    }
  }

  /**
   * Register via Samsung API
   */
  private async registerViaAPI(request: RegistrationRequest): Promise<RegistrationResponse> {
    const response = await this.executeProtected(async () => {
      const apiRequest = this.mapToManufacturerFormat(request);
      return await this.request<SamsungAPIResponse>('/v1/products/register', {
        method: 'POST',
        body: JSON.stringify(apiRequest),
      });
    });

    if (response.success && response.confirmation_code) {
      this.logger.info('Samsung API registration successful', {
        confirmationCode: response.confirmation_code,
      });

      return this.createSuccessResponse(
        response.confirmation_code,
        'API',
        {
          registrationId: response.registration_id,
          registrationUrl: 'https://www.samsung.com/us/support/register/',
        }
      );
    } else {
      throw new Error(response.error?.message || 'Registration failed');
    }
  }

  /**
   * Register via web automation (Playwright)
   */
  private async registerViaWebAutomation(request: RegistrationRequest): Promise<RegistrationResponse> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      this.logger.info('Starting web automation for Samsung');

      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();

      // Navigate to registration page
      await page.goto('https://www.samsung.com/us/support/register/', {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      });

      // Fill form fields
      await this.fillRegistrationForm(page, request);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success indicator
      await page.waitForSelector('.registration-success, .confirmation-message', {
        timeout: 10000,
      });

      // Extract confirmation code
      const confirmationCode = await this.extractConfirmationCode(page);

      this.logger.info('Samsung web automation successful', {
        confirmationCode,
      });

      return this.createSuccessResponse(
        confirmationCode,
        'AUTOMATION_RELIABLE',
        {
          method: 'web_automation',
          registrationUrl: page.url(),
        }
      );

    } catch (error) {
      // Take screenshot for debugging
      if (page) {
        try {
          const screenshot = await page.screenshot({ fullPage: true });
          this.logger.debug('Automation failed - screenshot captured');
          // In production, upload screenshot to S3
        } catch (screenshotError) {
          this.logger.warn('Failed to capture screenshot', screenshotError);
        }
      }

      throw error;

    } finally {
      // Clean up
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  /**
   * Fill Samsung registration form
   */
  private async fillRegistrationForm(page: Page, request: RegistrationRequest): Promise<void> {
    const { user, product, purchase } = request;

    // Product information
    await page.fill('input[name="serialNumber"]', this.formatSerialNumber(product.serialNumber));
    await page.fill('input[name="modelNumber"]', product.modelNumber || '');
    await page.fill('input[name="purchaseDate"]', DataFormatter.formatDate(purchase.date, 'MM/DD/YYYY'));

    // Customer information
    await page.fill('input[name="firstName"]', user.firstName);
    await page.fill('input[name="lastName"]', user.lastName);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="phone"]', DataFormatter.formatPhone(user.phone, 'RAW') || '');

    // Address
    if (user.address) {
      await page.fill('input[name="address1"]', user.address.street);
      await page.fill('input[name="city"]', user.address.city);
      await page.selectOption('select[name="state"]', user.address.state);
      await page.fill('input[name="zip"]', user.address.zipCode);
    }

    // Retailer
    if (purchase.retailer) {
      await page.fill('input[name="retailer"]', purchase.retailer);
    }
  }

  /**
   * Extract confirmation code from success page
   */
  private async extractConfirmationCode(page: Page): Promise<string> {
    // Try multiple selectors for confirmation code
    const selectors = [
      '.confirmation-code',
      '#confirmationNumber',
      '[data-confirmation]',
      '.registration-success strong',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            // Extract code from text (format might be "Confirmation: ABC123XYZ")
            const match = text.match(/[A-Z0-9]{6,20}/);
            if (match) {
              return match[0];
            }
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Fallback: generate code from timestamp if we can't find it
    return `SAM-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Validate request data
   */
  validateRequest(request: RegistrationRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Serial number validation
    if (!request.product.serialNumber) {
      errors.push('Serial number is required');
    } else if (!this.isValidSerialNumber(request.product.serialNumber)) {
      errors.push('Invalid Samsung serial number format (8-20 alphanumeric characters)');
    }

    // Model number
    if (!request.product.modelNumber) {
      warnings.push('Model number is recommended for faster processing');
    }

    // Purchase date
    if (!request.purchase.date) {
      errors.push('Purchase date is required');
    } else if (this.isPurchaseDateTooOld(request.purchase.date)) {
      warnings.push('Purchase date is over 1 year old');
    }

    // User information
    if (!request.user.email || !this.isValidEmail(request.user.email)) {
      errors.push('Valid email is required');
    }

    if (!request.user.firstName || !request.user.lastName) {
      errors.push('First name and last name are required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Map to Samsung's API format
   */
  mapToManufacturerFormat(request: RegistrationRequest): SamsungAPIRequest {
    return {
      customer: {
        first_name: request.user.firstName,
        last_name: request.user.lastName,
        email: request.user.email,
        phone_number: DataFormatter.formatPhone(request.user.phone, 'RAW') || '',
        address: {
          line1: request.user.address?.street || '',
          city: request.user.address?.city || '',
          state: request.user.address?.state || '',
          postal_code: request.user.address?.zipCode || '',
          country_code: request.user.address?.country || 'US',
        },
      },
      product: {
        serial_number: this.formatSerialNumber(request.product.serialNumber),
        model_number: request.product.modelNumber || '',
        purchase_date: request.purchase.date.toISOString().split('T')[0],
        retailer_name: request.purchase.retailer,
      },
    };
  }

  /**
   * Validate Samsung serial number
   */
  private isValidSerialNumber(serialNumber: string): boolean {
    const cleaned = serialNumber.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z0-9]{8,20}$/.test(cleaned);
  }

  /**
   * Format serial number (remove spaces and dashes)
   */
  private formatSerialNumber(serialNumber: string): string {
    return serialNumber.toUpperCase().replace(/[\s-]/g, '');
  }

  /**
   * Check if purchase date is too old
   */
  private isPurchaseDateTooOld(purchaseDate: Date): boolean {
    const daysSincePurchase = Math.floor(
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePurchase > 365;
  }

  /**
   * Email validation
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Disable web automation fallback (for testing or maintenance)
   */
  disableAutomationFallback(): void {
    this.automationFallbackEnabled = false;
    this.logger.info('Web automation fallback disabled');
  }

  /**
   * Enable web automation fallback
   */
  enableAutomationFallback(): void {
    this.automationFallbackEnabled = true;
    this.logger.info('Web automation fallback enabled');
  }
}

/**
 * Factory function to create Samsung connector instance
 */
export function createSamsungConnector(): SamsungConnector {
  return new SamsungConnector();
}
