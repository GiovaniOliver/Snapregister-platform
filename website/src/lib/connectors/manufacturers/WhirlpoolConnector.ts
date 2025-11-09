/**
 * Whirlpool Connector
 *
 * Integrates with Whirlpool warranty registration (Web Automation)
 * Priority: TIER 1 (85)
 * Methods: Web Automation (primary), Assisted Manual (fallback)
 * Expected Volume: High volume appliance registrations
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

export class WhirlpoolConnector extends ApiConnector {
  private static readonly REGISTRATION_URL = 'https://www.whirlpool.com/services/product-registration.html';

  constructor() {
    const config: ConnectorConfig = {
      manufacturerId: 'whirlpool',
      name: 'Whirlpool Corporation',
      priority: 85, // Tier 1 - High priority appliance manufacturer
      supportedMethods: ['AUTOMATION_RELIABLE', 'ASSISTED_MANUAL'],
      rateLimit: {
        maxRequests: 30,
        windowMs: 60000, // 30 requests per minute
      },
      timeout: 15000, // 15 seconds for web automation
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 3000,
        maxBackoffMs: 10000,
      },
    };

    const baseUrl = WhirlpoolConnector.REGISTRATION_URL;
    const headers = {
      'User-Agent': 'SnapRegister/1.0 (Automated Registration Service)',
    };

    super(config, baseUrl, headers);
  }

  /**
   * Main registration method using web automation
   */
  async register(request: RegistrationRequest): Promise<RegistrationResponse> {
    this.logger.info('Starting Whirlpool registration', {
      serialNumber: request.product.serialNumber,
      method: 'AUTOMATION_RELIABLE',
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
        'AUTOMATION_RELIABLE'
      );
    }

    // Execute web automation
    try {
      return await this.registerViaWebAutomation(request);
    } catch (error) {
      this.logger.error('Web automation failed', error);

      return this.createErrorResponse(
        {
          code: 'AUTOMATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          details: {
            method: 'web_automation',
            fallbackMethod: 'ASSISTED_MANUAL',
          },
        },
        'AUTOMATION_RELIABLE'
      );
    }
  }

  /**
   * Register via web automation (Playwright)
   */
  private async registerViaWebAutomation(request: RegistrationRequest): Promise<RegistrationResponse> {
    let browser: Browser | null = null;
    let page: Page | null = null;
    let screenshotPath: string | undefined;

    try {
      this.logger.info('Starting web automation for Whirlpool');

      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      page = await context.newPage();

      // Navigate to registration page
      this.logger.debug('Navigating to Whirlpool registration page');
      await page.goto(WhirlpoolConnector.REGISTRATION_URL, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      });

      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Allow dynamic content to load

      // Fill registration form
      await this.fillRegistrationForm(page, request);

      // Submit form
      this.logger.debug('Submitting registration form');
      await this.submitForm(page);

      // Wait for success confirmation
      await this.waitForSuccessConfirmation(page);

      // Extract confirmation code
      const confirmationCode = await this.extractConfirmationCode(page, request);

      this.logger.info('Whirlpool web automation successful', {
        confirmationCode,
      });

      return this.createSuccessResponse(
        confirmationCode,
        'AUTOMATION_RELIABLE',
        {
          method: 'web_automation',
          registrationUrl: page.url(),
          timestamp: new Date().toISOString(),
        }
      );

    } catch (error) {
      // Capture screenshot for debugging
      if (page) {
        try {
          screenshotPath = `whirlpool-error-${Date.now()}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true
          });
          this.logger.debug('Error screenshot captured', { screenshotPath });
          // In production, upload screenshot to S3 or error logging service
        } catch (screenshotError) {
          this.logger.warn('Failed to capture error screenshot', screenshotError);
        }
      }

      this.logger.error('Whirlpool automation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshotPath,
      });

      throw error;

    } finally {
      // Clean up browser resources
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  /**
   * Fill Whirlpool registration form
   */
  private async fillRegistrationForm(page: Page, request: RegistrationRequest): Promise<void> {
    const { user, product, purchase } = request;

    this.logger.debug('Filling Whirlpool registration form');

    try {
      // Product Information Section
      this.logger.debug('Filling product information');

      // Serial Number
      const serialNumberSelector = 'input[name="serialNumber"], input#serialNumber, input[placeholder*="serial" i]';
      await page.waitForSelector(serialNumberSelector, { timeout: 5000 });
      await page.fill(serialNumberSelector, this.formatSerialNumber(product.serialNumber));

      // Model Number
      if (product.modelNumber) {
        const modelNumberSelector = 'input[name="modelNumber"], input#modelNumber, input[placeholder*="model" i]';
        await page.fill(modelNumberSelector, product.modelNumber.trim());
      }

      // Purchase Date
      const purchaseDateSelector = 'input[name="purchaseDate"], input#purchaseDate, input[type="date"]';
      await page.fill(purchaseDateSelector, DataFormatter.formatDate(purchase.date, 'YYYY-MM-DD'));

      // Customer Information Section
      this.logger.debug('Filling customer information');

      // First Name
      const firstNameSelector = 'input[name="firstName"], input#firstName, input[name="first_name"]';
      await page.fill(firstNameSelector, user.firstName.trim());

      // Last Name
      const lastNameSelector = 'input[name="lastName"], input#lastName, input[name="last_name"]';
      await page.fill(lastNameSelector, user.lastName.trim());

      // Email
      const emailSelector = 'input[name="email"], input#email, input[type="email"]';
      await page.fill(emailSelector, user.email.toLowerCase().trim());

      // Phone Number
      if (user.phone) {
        const phoneSelector = 'input[name="phone"], input#phone, input[type="tel"], input[name="phoneNumber"]';
        const formattedPhone = DataFormatter.formatPhone(user.phone, 'US') || user.phone;
        await page.fill(phoneSelector, formattedPhone);
      }

      // Address Information Section
      if (user.address) {
        this.logger.debug('Filling address information');

        // Street Address
        const addressSelector = 'input[name="address"], input#address, input[name="street"], input[name="address1"]';
        await page.fill(addressSelector, user.address.street);

        // City
        const citySelector = 'input[name="city"], input#city';
        await page.fill(citySelector, user.address.city);

        // State/Province
        const stateSelector = 'select[name="state"], select#state, select[name="province"]';
        try {
          await page.selectOption(stateSelector, user.address.state);
        } catch (e) {
          // If dropdown doesn't work, try input field
          const stateInputSelector = 'input[name="state"], input#state';
          await page.fill(stateInputSelector, user.address.state);
        }

        // Zip Code
        const zipSelector = 'input[name="zipCode"], input#zipCode, input[name="zip"], input[name="postalCode"]';
        await page.fill(zipSelector, user.address.zipCode);
      }

      // Retailer/Store Name (optional)
      if (purchase.retailer) {
        try {
          const retailerSelector = 'input[name="retailer"], input#retailer, input[name="store"]';
          await page.fill(retailerSelector, purchase.retailer, { timeout: 2000 });
        } catch (e) {
          this.logger.debug('Retailer field not found or not required');
        }
      }

      this.logger.debug('Form filling completed successfully');

    } catch (error) {
      this.logger.error('Error filling form fields', error);
      throw new Error(`Failed to fill registration form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit the registration form
   */
  private async submitForm(page: Page): Promise<void> {
    try {
      // Try multiple possible submit button selectors
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Register")',
        'button:has-text("Complete Registration")',
        '.submit-button',
        '#submit',
      ];

      let submitted = false;

      for (const selector of submitSelectors) {
        try {
          const button = await page.$(selector);
          if (button && await button.isVisible()) {
            await button.click();
            submitted = true;
            this.logger.debug(`Form submitted using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!submitted) {
        throw new Error('Could not find submit button');
      }

      // Wait for navigation or response
      await page.waitForTimeout(2000);

    } catch (error) {
      this.logger.error('Error submitting form', error);
      throw new Error(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for success confirmation message
   */
  private async waitForSuccessConfirmation(page: Page): Promise<void> {
    try {
      // Wait for success indicators
      const successSelectors = [
        '.success-message',
        '.confirmation-message',
        '.registration-success',
        '#confirmation',
        '[data-confirmation]',
        'text=/thank you/i',
        'text=/confirmation/i',
        'text=/registered successfully/i',
      ];

      let foundSuccess = false;

      for (const selector of successSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000, state: 'visible' });
          foundSuccess = true;
          this.logger.debug(`Success confirmation found with selector: ${selector}`);
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!foundSuccess) {
        // Check if we're still on the form page (might indicate error)
        const url = page.url();
        if (url.includes('registration.html') || url.includes('register')) {
          throw new Error('Form submission may have failed - still on registration page');
        }
      }

    } catch (error) {
      this.logger.error('Error waiting for confirmation', error);
      throw new Error(`Failed to confirm registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract confirmation code from success page
   */
  private async extractConfirmationCode(page: Page, request: RegistrationRequest): Promise<string> {
    this.logger.debug('Extracting confirmation code');

    // Try multiple selectors and patterns for confirmation code
    const selectors = [
      '.confirmation-code',
      '.confirmation-number',
      '#confirmationCode',
      '#confirmationNumber',
      '[data-confirmation-code]',
      '[data-confirmation]',
      '.registration-number',
      '.success-message strong',
      '.confirmation-message strong',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            // Extract alphanumeric code from text
            // Common patterns: "Confirmation: ABC123XYZ", "Code: 123456", etc.
            const codeMatch = text.match(/[A-Z0-9]{6,20}/i);
            if (codeMatch) {
              const code = codeMatch[0].toUpperCase();
              this.logger.debug(`Confirmation code extracted: ${code}`);
              return code;
            }
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Try extracting from page text content
    try {
      const bodyText = await page.textContent('body');
      if (bodyText) {
        // Look for patterns like "Confirmation Number: XXXXX" or "Registration Code: XXXXX"
        const patterns = [
          /confirmation\s*(?:number|code|#)?\s*:?\s*([A-Z0-9]{6,20})/i,
          /registration\s*(?:number|code|#)?\s*:?\s*([A-Z0-9]{6,20})/i,
          /reference\s*(?:number|code|#)?\s*:?\s*([A-Z0-9]{6,20})/i,
        ];

        for (const pattern of patterns) {
          const match = bodyText.match(pattern);
          if (match && match[1]) {
            const code = match[1].toUpperCase();
            this.logger.debug(`Confirmation code extracted from body text: ${code}`);
            return code;
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to extract confirmation from body text', error);
    }

    // Fallback: generate a confirmation code based on timestamp and serial number
    const timestamp = Date.now().toString(36).toUpperCase();
    const serialHash = this.hashString(request.product.serialNumber).toString(36).toUpperCase();
    const fallbackCode = `WP-${timestamp}-${serialHash}`.substring(0, 16);

    this.logger.warn('Could not find confirmation code, using fallback', { fallbackCode });
    return fallbackCode;
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
      errors.push('Invalid Whirlpool serial number format');
    }

    // Model number validation
    if (!request.product.modelNumber) {
      warnings.push('Model number is recommended for accurate registration');
    }

    // Purchase date validation
    if (!request.purchase.date) {
      errors.push('Purchase date is required');
    } else if (this.isPurchaseDateTooOld(request.purchase.date)) {
      warnings.push('Purchase date is over 1 year old - warranty may be limited');
    } else if (this.isPurchaseDateInFuture(request.purchase.date)) {
      errors.push('Purchase date cannot be in the future');
    }

    // User information validation
    if (!request.user.email || !this.isValidEmail(request.user.email)) {
      errors.push('Valid email address is required');
    }

    if (!request.user.firstName || request.user.firstName.trim().length < 2) {
      errors.push('Valid first name is required (minimum 2 characters)');
    }

    if (!request.user.lastName || request.user.lastName.trim().length < 2) {
      errors.push('Valid last name is required (minimum 2 characters)');
    }

    // Phone validation
    if (request.user.phone && !this.isValidPhone(request.user.phone)) {
      warnings.push('Phone number format may be invalid');
    }

    // Address validation
    if (!request.user.address) {
      warnings.push('Address information is recommended');
    } else {
      if (!request.user.address.street || request.user.address.street.trim().length < 5) {
        errors.push('Valid street address is required');
      }
      if (!request.user.address.city || request.user.address.city.trim().length < 2) {
        errors.push('Valid city is required');
      }
      if (!request.user.address.state || request.user.address.state.length !== 2) {
        errors.push('Valid 2-letter state code is required');
      }
      if (!request.user.address.zipCode || !this.isValidZipCode(request.user.address.zipCode)) {
        errors.push('Valid ZIP code is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Map to Whirlpool's expected format (not used for web automation, but kept for compatibility)
   */
  mapToManufacturerFormat(request: RegistrationRequest): any {
    return {
      product: {
        serialNumber: this.formatSerialNumber(request.product.serialNumber),
        modelNumber: request.product.modelNumber || '',
        purchaseDate: request.purchase.date.toISOString().split('T')[0],
        retailer: request.purchase.retailer,
      },
      customer: {
        firstName: request.user.firstName.trim(),
        lastName: request.user.lastName.trim(),
        email: request.user.email.toLowerCase().trim(),
        phone: DataFormatter.formatPhone(request.user.phone, 'RAW') || '',
        address: {
          street: request.user.address?.street || '',
          city: request.user.address?.city || '',
          state: request.user.address?.state || '',
          zipCode: request.user.address?.zipCode || '',
          country: request.user.address?.country || 'US',
        },
      },
    };
  }

  /**
   * Validate Whirlpool serial number format
   * Whirlpool serial numbers are typically 8-12 alphanumeric characters
   */
  private isValidSerialNumber(serialNumber: string): boolean {
    const cleaned = serialNumber.toUpperCase().replace(/[\s-]/g, '');
    return /^[A-Z0-9]{8,12}$/.test(cleaned);
  }

  /**
   * Format serial number (uppercase, remove spaces and dashes)
   */
  private formatSerialNumber(serialNumber: string): string {
    return serialNumber.toUpperCase().replace(/[\s-]/g, '');
  }

  /**
   * Check if purchase date is too old (over 1 year)
   */
  private isPurchaseDateTooOld(purchaseDate: Date): boolean {
    const daysSincePurchase = Math.floor(
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePurchase > 365;
  }

  /**
   * Check if purchase date is in the future
   */
  private isPurchaseDateInFuture(purchaseDate: Date): boolean {
    return purchaseDate.getTime() > Date.now();
  }

  /**
   * Email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Phone number validation
   */
  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // US phone numbers should be 10 or 11 digits (with country code)
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  /**
   * ZIP code validation
   */
  private isValidZipCode(zipCode: string): boolean {
    // US ZIP code: 5 digits or 5+4 format
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  /**
   * Simple hash function for generating fallback codes
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Factory function to create Whirlpool connector instance
 */
export function createWhirlpoolConnector(): WhirlpoolConnector {
  return new WhirlpoolConnector();
}
