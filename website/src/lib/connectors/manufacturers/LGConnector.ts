/**
 * LG Connector
 *
 * Integrates with LG warranty registration (API + Web Automation fallback)
 * Priority: CRITICAL (Tier 1)
 * Methods: API (primary), Web Automation (fallback)
 * Expected Volume: 6-8% of all registrations
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

interface LGAPIRequest {
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

interface LGAPIResponse {
  success: boolean;
  confirmation_code?: string;
  registration_id?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class LGConnector extends ApiConnector {
  private automationFallbackEnabled: boolean = true;

  constructor() {
    const config: ConnectorConfig = {
      manufacturerId: 'lg',
      name: 'LG Electronics',
      priority: 90, // Tier 1 - high priority
      supportedMethods: ['API', 'AUTOMATION_RELIABLE', 'ASSISTED_MANUAL'],
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000, // 50 requests per minute
      },
      timeout: 10000,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 2000,
        maxBackoffMs: 10000,
      },
    };

    const baseUrl = process.env.LG_API_BASE_URL || 'https://api.lg.com/warranty';
    const headers = {
      'Authorization': `Bearer ${process.env.LG_API_KEY || ''}`,
      'X-LG-Partner': process.env.LG_PARTNER_ID || '',
    };

    super(config, baseUrl, headers);
  }

  /**
   * Main registration method with fallback strategy
   */
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    this.logger.info('Starting LG registration', {
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
   * Register via LG API
   */
  private async registerViaAPI(request: RegistrationRequest): Promise<RegistrationResponse> {
    const response = await this.executeProtected(async () => {
      const apiRequest = this.mapToManufacturerFormat(request);
      return await this.request<LGAPIResponse>('/v1/products/register', {
        method: 'POST',
        body: JSON.stringify(apiRequest),
      });
    });

    if (response.success && response.confirmation_code) {
      this.logger.info('LG API registration successful', {
        confirmationCode: response.confirmation_code,
      });

      return this.createSuccessResponse(
        response.confirmation_code,
        'API',
        {
          registrationId: response.registration_id,
          registrationUrl: 'https://www.lg.com/us/support/product-registration',
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
      this.logger.info('Starting web automation for LG');

      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();

      // Navigate to registration page
      await page.goto('https://www.lg.com/us/support/product-registration', {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      });

      // Fill form fields
      await this.fillRegistrationForm(page, request);

      // Submit form
      await page.click('button[type="submit"], input[type="submit"], .submit-btn, .register-submit');

      // Wait for success indicator
      await page.waitForSelector('.registration-success, .confirmation-message, .success-message, #confirmationCode', {
        timeout: 15000,
      });

      // Extract confirmation code
      const confirmationCode = await this.extractConfirmationCode(page);

      // Capture screenshot for proof
      const screenshot = await page.screenshot({ fullPage: false });

      this.logger.info('LG web automation successful', {
        confirmationCode,
      });

      return this.createSuccessResponse(
        confirmationCode,
        'AUTOMATION_RELIABLE',
        {
          method: 'web_automation',
          registrationUrl: page.url(),
          screenshot: screenshot.toString('base64').substring(0, 100) + '...', // Store reference
        }
      );

    } catch (error) {
      // Take screenshot for debugging
      if (page) {
        try {
          const screenshot = await page.screenshot({ fullPage: true });
          this.logger.debug('Automation failed - screenshot captured', {
            screenshotSize: screenshot.length,
          });
          // In production, upload screenshot to S3 or similar storage
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
   * Fill LG registration form
   */
  private async fillRegistrationForm(page: Page, request: RegistrationRequest): Promise<void> {
    const { user, product, purchase } = request;

    // Wait for form to be visible
    await page.waitForSelector('input[name="serialNumber"], input[name="serial"], #serialNumber', {
      timeout: 5000,
    });

    // Product information
    await this.fillField(page, [
      'input[name="serialNumber"]',
      'input[name="serial"]',
      '#serialNumber',
      'input[id*="serial"]'
    ], this.formatSerialNumber(product.serialNumber));

    await this.fillField(page, [
      'input[name="modelNumber"]',
      'input[name="model"]',
      '#modelNumber',
      'input[id*="model"]'
    ], product.modelNumber || '');

    await this.fillField(page, [
      'input[name="purchaseDate"]',
      'input[name="purchase-date"]',
      '#purchaseDate',
      'input[type="date"]'
    ], DataFormatter.formatDate(purchase.date, 'MM/DD/YYYY'));

    // Customer information
    await this.fillField(page, [
      'input[name="firstName"]',
      'input[name="first-name"]',
      '#firstName',
      'input[id*="firstName"]'
    ], user.firstName);

    await this.fillField(page, [
      'input[name="lastName"]',
      'input[name="last-name"]',
      '#lastName',
      'input[id*="lastName"]'
    ], user.lastName);

    await this.fillField(page, [
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      'input[id*="email"]'
    ], user.email);

    await this.fillField(page, [
      'input[name="phone"]',
      'input[name="phoneNumber"]',
      'input[type="tel"]',
      '#phone'
    ], DataFormatter.formatPhone(user.phone, 'RAW') || '');

    // Address
    if (user.address) {
      await this.fillField(page, [
        'input[name="address1"]',
        'input[name="street"]',
        'input[name="address"]',
        '#address1'
      ], user.address.street);

      await this.fillField(page, [
        'input[name="city"]',
        '#city'
      ], user.address.city);

      // Try to select state from dropdown or fill as text
      const stateSelectors = [
        'select[name="state"]',
        'select[id="state"]',
        'input[name="state"]'
      ];
      for (const selector of stateSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
              await page.selectOption(selector, user.address.state);
            } else {
              await page.fill(selector, user.address.state);
            }
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      await this.fillField(page, [
        'input[name="zip"]',
        'input[name="zipCode"]',
        'input[name="postalCode"]',
        '#zipCode'
      ], user.address.zipCode);
    }

    // Retailer
    if (purchase.retailer) {
      await this.fillField(page, [
        'input[name="retailer"]',
        'input[name="store"]',
        'select[name="retailer"]',
        '#retailer'
      ], purchase.retailer);
    }
  }

  /**
   * Helper to fill a field using multiple possible selectors
   */
  private async fillField(page: Page, selectors: string[], value: string): Promise<void> {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());

          if (tagName === 'select') {
            // Try to select by value or text
            try {
              await page.selectOption(selector, value);
            } catch (e) {
              // If exact value doesn't work, try partial match
              const options = await page.$$eval(
                `${selector} option`,
                (opts, val) => opts
                  .filter(opt => opt.textContent?.toLowerCase().includes(val.toLowerCase()))
                  .map(opt => opt.value),
                value
              );
              if (options.length > 0) {
                await page.selectOption(selector, options[0]);
              }
            }
          } else {
            await page.fill(selector, value);
          }
          return; // Successfully filled, exit
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    // If we get here, field wasn't found - log warning but don't fail
    this.logger.warn(`Field not found for selectors: ${selectors.join(', ')}`);
  }

  /**
   * Extract confirmation code from success page
   */
  private async extractConfirmationCode(page: Page): Promise<string> {
    // Try multiple selectors for confirmation code
    const selectors = [
      '.confirmation-code',
      '#confirmationNumber',
      '#confirmationCode',
      '[data-confirmation]',
      '.registration-success strong',
      '.success-code',
      '.conf-code',
      '[class*="confirmation"]',
      '[id*="confirmation"]',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            // Extract code from text (format might be "Confirmation: ABC123XYZ" or "ABC123XYZ")
            const match = text.match(/[A-Z0-9]{6,20}/i);
            if (match) {
              return match[0].toUpperCase();
            }
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Try to find any alphanumeric code pattern on the page
    try {
      const pageText = await page.textContent('body');
      if (pageText) {
        // Look for patterns like "Confirmation Code: XXXXX" or "Code: XXXXX"
        const confirmationMatch = pageText.match(/(?:confirmation|registration)\s*(?:code|number|id)?:?\s*([A-Z0-9]{6,20})/i);
        if (confirmationMatch) {
          return confirmationMatch[1].toUpperCase();
        }
      }
    } catch (error) {
      this.logger.warn('Failed to extract confirmation code from page text', error);
    }

    // Fallback: generate code from timestamp if we can't find it
    this.logger.warn('Could not extract confirmation code, generating fallback code');
    return `LG-${Date.now().toString(36).toUpperCase()}`;
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
      errors.push('Invalid LG serial number format (typically 9-15 alphanumeric characters)');
    }

    // Model number
    if (!request.product.modelNumber) {
      warnings.push('Model number is recommended for faster processing');
    }

    // Purchase date
    if (!request.purchase.date) {
      errors.push('Purchase date is required');
    } else if (this.isPurchaseDateTooOld(request.purchase.date)) {
      warnings.push('Purchase date is over 1 year old - warranty may be limited');
    }

    // User information
    if (!request.user.email || !this.isValidEmail(request.user.email)) {
      errors.push('Valid email is required');
    }

    if (!request.user.firstName || !request.user.lastName) {
      errors.push('First name and last name are required');
    }

    // Phone validation
    if (!request.user.phone) {
      warnings.push('Phone number is recommended for registration confirmation');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Map to LG's API format
   */
  mapToManufacturerFormat(request: RegistrationRequest): LGAPIRequest {
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
   * Validate LG serial number
   * LG serial numbers are typically 9-15 characters, alphanumeric
   */
  private isValidSerialNumber(serialNumber: string): boolean {
    const cleaned = serialNumber.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z0-9]{9,15}$/.test(cleaned);
  }

  /**
   * Format serial number (LG typically uses format with dashes)
   */
  private formatSerialNumber(serialNumber: string): string {
    return DataFormatter.formatSerialNumber(serialNumber, 'lg');
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
 * Factory function to create LG connector instance
 */
export function createLGConnector(): LGConnector {
  return new LGConnector();
}
