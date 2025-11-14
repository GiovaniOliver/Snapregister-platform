/**
 * Base Automation Class for Warranty Registration
 *
 * Provides a template pattern for manufacturer-specific automation scripts.
 * All manufacturer automations should extend this base class.
 */

import { Page, Browser, BrowserContext } from 'playwright';

export interface RegistrationData {
  // User information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Company information (for B2B registrations)
  companyName?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  addressLine2?: string;

  // Product information
  productName: string;
  manufacturerName: string;
  modelNumber?: string;
  serialNumber?: string;
  sku?: string;
  upc?: string;

  // Purchase information
  purchaseDate?: string; // ISO format: YYYY-MM-DD
  purchasePrice?: number;
  retailer?: string;

  // Documents (file paths)
  receiptPath?: string;
  warrantyCardPath?: string;
  productPhotoPath?: string;
}

export interface AutomationResult {
  success: boolean;
  confirmationCode?: string;
  confirmationEmail?: string;
  screenshotPath?: string;
  htmlSnapshot?: string;
  errorMessage?: string;
  errorType?: 'timeout' | 'captcha' | 'form_changed' | 'network' | 'validation' | 'unknown';
  metadata?: Record<string, any>;
  duration: number;
  attemptNumber?: number;
}

export interface AutomationOptions {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  screenshots?: boolean;
  videoRecording?: boolean;
}

export abstract class BaseAutomation {
  // Manufacturer-specific configuration
  abstract manufacturer: string;
  abstract automationType: 'reliable' | 'experimental';
  abstract registrationUrl: string;
  abstract requiredFields: (keyof RegistrationData)[];
  abstract optionalFields: (keyof RegistrationData)[];

  // Internal state
  protected page!: Page;
  protected context!: BrowserContext;
  protected startTime!: number;
  protected options: AutomationOptions;

  constructor(options: AutomationOptions = {}) {
    this.options = {
      headless: true,
      timeout: 30000,
      viewport: { width: 1920, height: 1080 },
      screenshots: true,
      videoRecording: false,
      ...options
    };
  }

  /**
   * Main execution method - Template Pattern
   *
   * Orchestrates the entire registration flow:
   * 1. Setup browser context
   * 2. Navigate to registration page
   * 3. Fill form with data
   * 4. Submit form
   * 5. Verify success
   * 6. Capture confirmation
   * 7. Cleanup
   */
  async execute(
    browser: Browser,
    data: RegistrationData,
    attemptNumber: number = 1
  ): Promise<AutomationResult> {
    this.startTime = Date.now();

    try {
      // Validate required fields
      this.validateData(data);

      // 1. Setup
      await this.setup(browser);

      // 2. Navigate
      await this.navigate();

      // 3. Fill form (manufacturer-specific)
      await this.fillForm(data);

      // 4. Submit (manufacturer-specific)
      const result = await this.submitForm();

      // 5. Verify success (manufacturer-specific)
      const verified = await this.verifySuccess();

      if (!verified) {
        throw new Error('Submission verification failed - confirmation page not detected');
      }

      // 6. Capture confirmation
      const screenshotPath = this.options.screenshots
        ? await this.captureConfirmation()
        : undefined;

      // 7. HTML snapshot for debugging
      const htmlSnapshot = await this.captureHtmlSnapshot();

      // 8. Cleanup
      await this.cleanup();

      return {
        success: true,
        confirmationCode: result.confirmationCode,
        screenshotPath,
        htmlSnapshot,
        duration: Date.now() - this.startTime,
        attemptNumber
      };

    } catch (error: any) {
      return await this.handleError(error, attemptNumber);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Setup browser context with anti-detection measures
   */
  protected async setup(browser: Browser): Promise<void> {
    this.context = await browser.newContext({
      viewport: this.options.viewport,
      userAgent: this.getRandomUserAgent(),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],

      // Video recording (optional)
      recordVideo: this.options.videoRecording ? {
        dir: './videos/',
        size: this.options.viewport
      } : undefined,
    });

    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.options.timeout!);

    // Enable console logging
    this.page.on('console', msg => {
      console.log(`[${this.manufacturer}] PAGE LOG:`, msg.text());
    });

    // Track network errors
    this.page.on('requestfailed', req => {
      console.error(`[${this.manufacturer}] REQUEST FAILED:`, req.url(), req.failure()?.errorText);
    });

    // Track dialogs (alerts, confirms)
    this.page.on('dialog', async dialog => {
      console.log(`[${this.manufacturer}] DIALOG:`, dialog.message());
      await dialog.accept();
    });
  }

  /**
   * Navigate to manufacturer's registration page
   */
  protected async navigate(): Promise<void> {
    console.log(`[${this.manufacturer}] Navigating to: ${this.registrationUrl}`);

    await this.page.goto(this.registrationUrl, {
      waitUntil: 'domcontentloaded',
      timeout: this.options.timeout
    });

    // Wait for network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Network did not become idle, proceeding anyway');
    });

    // Add random delay to appear more human
    await this.randomDelay(1000, 2000);
  }

  /**
   * Capture screenshot of confirmation page
   */
  protected async captureConfirmation(): Promise<string> {
    const timestamp = Date.now();
    const path = `./screenshots/${this.manufacturer.toLowerCase()}-${timestamp}.png`;

    await this.page.screenshot({
      path,
      fullPage: true
    });

    console.log(`[${this.manufacturer}] Screenshot saved: ${path}`);
    return path;
  }

  /**
   * Capture HTML snapshot for debugging
   */
  protected async captureHtmlSnapshot(): Promise<string> {
    try {
      return await this.page.content();
    } catch (error) {
      console.error('Failed to capture HTML snapshot:', error);
      return '';
    }
  }

  /**
   * Cleanup browser resources
   */
  protected async cleanup(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Handle errors with proper classification and screenshot
   */
  protected async handleError(error: any, attemptNumber: number): Promise<AutomationResult> {
    console.error(`[${this.manufacturer}] Error on attempt ${attemptNumber}:`, error.message);

    // Capture error screenshot
    let screenshotPath: string | undefined;
    try {
      if (this.page && !this.page.isClosed()) {
        screenshotPath = `./errors/${this.manufacturer.toLowerCase()}-error-${Date.now()}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }
    } catch (e) {
      console.error('Failed to capture error screenshot:', e);
    }

    // Capture HTML snapshot
    let htmlSnapshot: string | undefined;
    try {
      if (this.page && !this.page.isClosed()) {
        htmlSnapshot = await this.page.content();
      }
    } catch (e) {
      console.error('Failed to capture HTML snapshot:', e);
    }

    // Classify error type
    const errorType = this.classifyError(error);

    return {
      success: false,
      errorMessage: error.message,
      errorType,
      screenshotPath,
      htmlSnapshot,
      duration: Date.now() - this.startTime,
      attemptNumber
    };
  }

  /**
   * Classify error based on error message
   */
  protected classifyError(error: any): AutomationResult['errorType'] {
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
   * Validate required fields are present
   */
  protected validateData(data: RegistrationData): void {
    const missingFields: string[] = [];

    for (const field of this.requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Get random user agent to avoid detection
   */
  protected getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Random delay to appear more human-like
   */
  /**
   * Log a message with manufacturer prefix
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.manufacturer}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  protected async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Human-like typing with random delays
   */
  protected async typeHumanLike(selector: string, text: string): Promise<void> {
    await this.page.click(selector);
    await this.randomDelay(100, 300);

    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.randomDelay(30, 100);
    }
  }

  /**
   * Try multiple selectors until one works
   */
  protected async fillWithFallback(
    selectors: string[],
    value: string,
    fieldName: string,
    optional?: boolean
  ): Promise<void> {
    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 3000 });
        await this.page.fill(selector, value);
        console.log(`[${this.manufacturer}] Filled ${fieldName} using selector: ${selector}`);
        return;
      } catch (error) {
        continue;
      }
    }

    if (!optional) {
      throw new Error(`Could not find ${fieldName} field with any selector`);
    }
    console.log(`[${this.manufacturer}] Optional field ${fieldName} not found, skipping`);
  }

  /**
   * Check if CAPTCHA is present
   */
  protected async hasCaptcha(): Promise<boolean> {
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
        console.log(`[${this.manufacturer}] CAPTCHA detected: ${selector}`);
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Abstract methods - Must be implemented by manufacturer-specific classes
  // ============================================================================

  /**
   * Fill the registration form with provided data
   */
  abstract fillForm(data: RegistrationData): Promise<void>;

  /**
   * Submit the form and extract confirmation details
   */
  abstract submitForm(): Promise<{ confirmationCode?: string }>;

  /**
   * Verify that submission was successful
   */
  abstract verifySuccess(): Promise<boolean>;
}
