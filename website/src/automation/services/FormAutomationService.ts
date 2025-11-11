/**
 * Generic Form Automation Service
 * 
 * Provides intelligent form detection and filling capabilities for product registration forms.
 * This service can work with any manufacturer's registration form by automatically detecting
 * form fields and mapping registration data to them.
 */

import { Page, Browser, BrowserContext } from 'playwright';
import { RegistrationData } from '../core/BaseAutomation';
import { FormFieldMapper } from './FormFieldMapper';
import { FormFieldDetector } from './FormFieldDetector';

export interface FormAutomationOptions {
  headless?: boolean;
  timeout?: number;
  screenshots?: boolean;
  waitForNetworkIdle?: boolean;
  retryAttempts?: number;
  fieldDetectionStrategy?: 'intelligent' | 'configured' | 'hybrid';
}

export interface FormFieldMapping {
  [key: string]: {
    selector: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
    required?: boolean;
    fallbackSelectors?: string[];
  };
}

export interface FormAutomationResult {
  success: boolean;
  confirmationCode?: string;
  confirmationMessage?: string;
  screenshotPath?: string;
  htmlSnapshot?: string;
  errorMessage?: string;
  errorType?: 'timeout' | 'captcha' | 'form_changed' | 'network' | 'validation' | 'unknown';
  fieldsFilled: number;
  fieldsDetected: number;
  duration: number;
}

export class FormAutomationService {
  private page!: Page;
  private context!: BrowserContext;
  private fieldMapper: FormFieldMapper;
  private fieldDetector: FormFieldDetector;
  private options: Required<FormAutomationOptions>;
  private startTime!: number;

  constructor(options: FormAutomationOptions = {}) {
    this.options = {
      headless: true,
      timeout: 30000,
      screenshots: true,
      waitForNetworkIdle: true,
      retryAttempts: 3,
      fieldDetectionStrategy: 'hybrid',
      ...options
    };

    this.fieldMapper = new FormFieldMapper();
    this.fieldDetector = new FormFieldDetector();
  }

  /**
   * Execute form automation for a registration
   */
  async execute(
    browser: Browser,
    registrationUrl: string,
    data: RegistrationData,
    fieldMappings?: FormFieldMapping
  ): Promise<FormAutomationResult> {
    this.startTime = Date.now();

    try {
      // Setup browser context
      await this.setup(browser);

      // Navigate to registration page
      await this.navigate(registrationUrl);

      // Detect or use configured form fields
      const fields = await this.detectFormFields(fieldMappings);

      // Map registration data to form fields
      const mappedData = this.fieldMapper.mapDataToFields(data, fields);

      // Fill the form
      const fillResult = await this.fillForm(mappedData, fields);

      // Submit the form
      const submitResult = await this.submitForm();

      // Verify success
      const verified = await this.verifySuccess();

      if (!verified) {
        throw new Error('Form submission verification failed');
      }

      // Capture confirmation
      const confirmation = await this.extractConfirmation();

      // Capture screenshot if enabled
      const screenshotPath = this.options.screenshots
        ? await this.captureScreenshot()
        : undefined;

      // Capture HTML snapshot
      const htmlSnapshot = await this.captureHtmlSnapshot();

      await this.cleanup();

      return {
        success: true,
        confirmationCode: confirmation.code,
        confirmationMessage: confirmation.message,
        screenshotPath,
        htmlSnapshot,
        fieldsFilled: fillResult.fieldsFilled,
        fieldsDetected: fields.length,
        duration: Date.now() - this.startTime
      };

    } catch (error: any) {
      return await this.handleError(error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Setup browser context with anti-detection measures
   */
  private async setup(browser: Browser): Promise<void> {
    this.context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: this.getRandomUserAgent(),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: []
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout);

    // Enable console logging
    this.page.on('console', msg => {
      console.log(`[FormAutomation] PAGE LOG:`, msg.text());
    });

    // Track network errors
    this.page.on('requestfailed', req => {
      console.error(`[FormAutomation] REQUEST FAILED:`, req.url(), req.failure()?.errorText);
    });

    // Handle dialogs
    this.page.on('dialog', async dialog => {
      console.log(`[FormAutomation] DIALOG:`, dialog.message());
      await dialog.accept();
    });
  }

  /**
   * Navigate to registration URL
   */
  private async navigate(url: string): Promise<void> {
    console.log(`[FormAutomation] Navigating to: ${url}`);

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.options.timeout
    });

    if (this.options.waitForNetworkIdle) {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[FormAutomation] Network did not become idle, proceeding anyway');
      });
    }

    // Random delay to appear more human
    await this.randomDelay(1000, 2000);
  }

  /**
   * Detect form fields using intelligent detection or configured mappings
   */
  private async detectFormFields(configuredMappings?: FormFieldMapping): Promise<any[]> {
    if (this.options.fieldDetectionStrategy === 'configured' && configuredMappings) {
      console.log('[FormAutomation] Using configured field mappings');
      return Object.entries(configuredMappings).map(([key, config]) => ({
        name: key,
        ...config
      }));
    }

    if (this.options.fieldDetectionStrategy === 'intelligent') {
      console.log('[FormAutomation] Using intelligent field detection');
      return await this.fieldDetector.detectFields(this.page);
    }

    // Hybrid: Try configured first, fall back to intelligent detection
    if (configuredMappings) {
      try {
        const configuredFields = Object.entries(configuredMappings).map(([key, config]) => ({
          name: key,
          ...config
        }));

        // Verify configured fields exist
        const verifiedFields = [];
        for (const field of configuredFields) {
          const exists = await this.page.locator(field.selector).isVisible().catch(() => false);
          if (exists) {
            verifiedFields.push(field);
          } else if (field.fallbackSelectors) {
            // Try fallback selectors
            for (const fallback of field.fallbackSelectors) {
              const fallbackExists = await this.page.locator(fallback).isVisible().catch(() => false);
              if (fallbackExists) {
                verifiedFields.push({ ...field, selector: fallback });
                break;
              }
            }
          }
        }

        if (verifiedFields.length > 0) {
          console.log(`[FormAutomation] Using ${verifiedFields.length} configured fields`);
          return verifiedFields;
        }
      } catch (error) {
        console.log('[FormAutomation] Configured fields failed, falling back to intelligent detection');
      }
    }

    // Fall back to intelligent detection
    console.log('[FormAutomation] Using intelligent field detection');
    return await this.fieldDetector.detectFields(this.page);
  }

  /**
   * Fill form with mapped data
   */
  private async fillForm(
    mappedData: Map<string, { value: any; field: any }>,
    fields: any[]
  ): Promise<{ fieldsFilled: number }> {
    console.log(`[FormAutomation] Filling ${mappedData.size} fields...`);

    let fieldsFilled = 0;

    for (const [fieldName, { value, field }] of mappedData.entries()) {
      try {
        if (!value) {
          console.log(`[FormAutomation] Skipping ${fieldName} - no value provided`);
          continue;
        }

        await this.fillField(field, value);
        fieldsFilled++;

        // Random delay between fields
        await this.randomDelay(200, 500);

      } catch (error: any) {
        console.error(`[FormAutomation] Failed to fill ${fieldName}:`, error.message);
        // Continue with other fields
      }
    }

    return { fieldsFilled };
  }

  /**
   * Fill a single form field
   */
  private async fillField(field: any, value: any): Promise<void> {
    const selector = field.selector || field.fallbackSelectors?.[0];
    if (!selector) {
      throw new Error(`No selector found for field: ${field.name}`);
    }

    // Wait for field to be visible
    await this.page.waitForSelector(selector, { timeout: 5000 });

    // Handle different field types
    switch (field.type) {
      case 'select':
        await this.page.selectOption(selector, value);
        break;

      case 'checkbox':
        if (value) {
          await this.page.check(selector);
        } else {
          await this.page.uncheck(selector);
        }
        break;

      case 'radio':
        await this.page.check(selector);
        break;

      case 'date':
        // Format date appropriately
        const formattedDate = this.formatDate(value);
        await this.page.fill(selector, formattedDate);
        break;

      case 'tel':
      case 'email':
      case 'text':
      case 'number':
      case 'textarea':
      default:
        // Use human-like typing for text fields
        await this.typeHumanLike(selector, String(value));
        break;
    }

    // Trigger blur event to validate
    await this.page.keyboard.press('Tab');
    await this.randomDelay(100, 300);
  }

  /**
   * Submit the form
   */
  private async submitForm(): Promise<void> {
    console.log('[FormAutomation] Submitting form...');

    // Check for CAPTCHA
    if (await this.hasCaptcha()) {
      throw new Error('CAPTCHA detected - manual intervention required');
    }

    // Find submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Register")',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      '[data-submit]',
      '.submit-button',
      '#submit-button'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          submitted = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!submitted) {
      throw new Error('Could not find submit button');
    }

    // Wait for navigation or confirmation
    try {
      await Promise.race([
        this.page.waitForURL(/confirmation|success|thank-you|complete/i, { timeout: 30000 }),
        this.page.waitForSelector('.success, .confirmation, [data-success]', { timeout: 30000 })
      ]);
    } catch (error) {
      // Check if we're still on the same page (might be AJAX submission)
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Verify form submission was successful
   */
  private async verifySuccess(): Promise<boolean> {
    // Check URL
    const url = this.page.url();
    if (/confirmation|success|thank-you|complete/i.test(url)) {
      return true;
    }

    // Check for success indicators
    const successSelectors = [
      '.success',
      '.confirmation',
      '[data-success]',
      'text=/registration.*successful/i',
      'text=/thank you/i',
      'text=/confirmation/i'
    ];

    for (const selector of successSelectors) {
      const visible = await this.page.locator(selector).isVisible().catch(() => false);
      if (visible) {
        return true;
      }
    }

    // Check for error indicators (inverse verification)
    const errorVisible = await this.page.locator('.error, .alert-error, [data-error]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await this.page.textContent('.error, .alert-error, [data-error]').catch(() => '');
      throw new Error(`Form submission failed: ${errorText}`);
    }

    return false;
  }

  /**
   * Extract confirmation code/message
   */
  private async extractConfirmation(): Promise<{ code?: string; message?: string }> {
    const codeSelectors = [
      '.confirmation-code',
      '.confirmation-number',
      '[data-confirmation-code]',
      'text=/confirmation.*code.*:?\\s*([A-Z0-9-]+)/i'
    ];

    for (const selector of codeSelectors) {
      try {
        if (selector.startsWith('text=/')) {
          const pageText = await this.page.textContent('body');
          const match = pageText?.match(/confirmation.*code.*:?\s*([A-Z0-9-]+)/i);
          if (match) {
            return { code: match[1] };
          }
        } else {
          const code = await this.page.textContent(selector).catch(() => null);
          if (code) {
            return { code: code.trim() };
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Extract success message
    const messageSelectors = [
      '.success-message',
      '.confirmation-message',
      '[data-success-message]'
    ];

    for (const selector of messageSelectors) {
      const message = await this.page.textContent(selector).catch(() => null);
      if (message) {
        return { message: message.trim() };
      }
    }

    return {};
  }

  /**
   * Check if CAPTCHA is present
   */
  private async hasCaptcha(): Promise<boolean> {
    const captchaSelectors = [
      '.g-recaptcha',
      '.h-captcha',
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '#recaptcha',
      '[data-captcha]'
    ];

    for (const selector of captchaSelectors) {
      if (await this.page.isVisible(selector).catch(() => false)) {
        console.log(`[FormAutomation] CAPTCHA detected: ${selector}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Capture screenshot
   */
  private async captureScreenshot(): Promise<string> {
    const timestamp = Date.now();
    const path = `./screenshots/form-automation-${timestamp}.png`;

    await this.page.screenshot({
      path,
      fullPage: true
    });

    return path;
  }

  /**
   * Capture HTML snapshot
   */
  private async captureHtmlSnapshot(): Promise<string> {
    try {
      return await this.page.content();
    } catch (error) {
      console.error('[FormAutomation] Failed to capture HTML snapshot:', error);
      return '';
    }
  }

  /**
   * Handle errors
   */
  private async handleError(error: any): Promise<FormAutomationResult> {
    console.error('[FormAutomation] Error:', error.message);

    let screenshotPath: string | undefined;
    try {
      if (this.page && !this.page.isClosed()) {
        screenshotPath = `./errors/form-automation-error-${Date.now()}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }
    } catch (e) {
      // Ignore screenshot errors
    }

    const htmlSnapshot = await this.captureHtmlSnapshot().catch(() => '');
    const errorType = this.classifyError(error);

    return {
      success: false,
      errorMessage: error.message,
      errorType,
      screenshotPath,
      htmlSnapshot,
      fieldsFilled: 0,
      fieldsDetected: 0,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Classify error type
   */
  private classifyError(error: any): FormAutomationResult['errorType'] {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('waiting')) {
      return 'timeout';
    }
    if (message.includes('captcha') || message.includes('recaptcha')) {
      return 'captcha';
    }
    if (message.includes('selector') || message.includes('not found')) {
      return 'form_changed';
    }
    if (message.includes('network') || message.includes('net::')) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    return 'unknown';
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
    } catch (error) {
      console.error('[FormAutomation] Cleanup error:', error);
    }
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Random delay
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Human-like typing
   */
  private async typeHumanLike(selector: string, text: string): Promise<void> {
    await this.page.click(selector);
    await this.randomDelay(100, 300);

    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.randomDelay(30, 100);
    }
  }

  /**
   * Format date for form input
   */
  private formatDate(date: string): string {
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return date;
    }
  }
}

