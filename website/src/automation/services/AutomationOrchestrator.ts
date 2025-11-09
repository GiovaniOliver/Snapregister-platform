/**
 * Automation Orchestrator
 *
 * Coordinates warranty registration automation across manufacturers.
 * Handles browser pooling, retry logic, and result tracking.
 */

import { chromium, Browser, BrowserType } from 'playwright';
import { BaseAutomation, RegistrationData, AutomationResult } from '../core/BaseAutomation';
import { ManufacturerRegistry } from '../manufacturers';

export interface OrchestratorOptions {
  headless?: boolean;
  maxRetries?: number;
  timeout?: number;
  screenshots?: boolean;
  videoRecording?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
}

export interface RegistrationRequest {
  manufacturer: string;
  data: RegistrationData;
  options?: OrchestratorOptions;
}

export class AutomationOrchestrator {
  private browser: Browser | null = null;
  private defaultOptions: OrchestratorOptions;

  constructor(defaultOptions: OrchestratorOptions = {}) {
    this.defaultOptions = {
      headless: true,
      maxRetries: 3,
      timeout: 30000,
      screenshots: true,
      videoRecording: false,
      browserType: 'chromium',
      ...defaultOptions
    };
  }

  /**
   * Execute a single warranty registration
   */
  async executeRegistration(
    manufacturer: string,
    data: RegistrationData,
    options: OrchestratorOptions = {}
  ): Promise<AutomationResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Get automation for manufacturer
    const automation = ManufacturerRegistry.get(manufacturer);

    if (!automation) {
      return {
        success: false,
        errorMessage: `No automation available for manufacturer: ${manufacturer}`,
        errorType: 'unknown',
        duration: 0
      };
    }

    // Execute with retry logic
    let lastResult: AutomationResult | null = null;
    const maxRetries = mergedOptions.maxRetries!;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n[Orchestrator] Attempt ${attempt}/${maxRetries} for ${manufacturer}`);

      try {
        // Ensure browser is available
        const browser = await this.getBrowser(mergedOptions.browserType!);

        // Execute automation
        const result = await automation.execute(browser, data, attempt);

        if (result.success) {
          console.log(`[Orchestrator] ✓ Success on attempt ${attempt}`);
          return result;
        }

        lastResult = result;

        // Don't retry for certain error types
        if (this.shouldNotRetry(result)) {
          console.log(`[Orchestrator] ✗ Error type ${result.errorType} - not retrying`);
          return result;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`[Orchestrator] Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }

      } catch (error: any) {
        console.error(`[Orchestrator] Unexpected error on attempt ${attempt}:`, error);

        lastResult = {
          success: false,
          errorMessage: error.message,
          errorType: 'unknown',
          duration: 0,
          attemptNumber: attempt
        };
      }
    }

    // All retries exhausted
    console.log(`[Orchestrator] ✗ All ${maxRetries} attempts failed`);
    return lastResult || {
      success: false,
      errorMessage: 'All retry attempts exhausted',
      errorType: 'unknown',
      duration: 0
    };
  }

  /**
   * Execute multiple registrations in parallel (with concurrency limit)
   */
  async executeMultiple(
    requests: RegistrationRequest[],
    concurrency: number = 3
  ): Promise<AutomationResult[]> {
    console.log(`\n[Orchestrator] Executing ${requests.length} registrations with concurrency ${concurrency}`);

    const results: AutomationResult[] = [];

    // Process in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      console.log(`\n[Orchestrator] Processing batch ${Math.floor(i / concurrency) + 1}...`);

      const batchResults = await Promise.all(
        batch.map(req =>
          this.executeRegistration(req.manufacturer, req.data, req.options)
        )
      );

      results.push(...batchResults);
    }

    // Log summary
    const successCount = results.filter(r => r.success).length;
    console.log(`\n[Orchestrator] Completed: ${successCount}/${results.length} successful`);

    return results;
  }

  /**
   * Get or create browser instance
   */
  private async getBrowser(browserType: 'chromium' | 'firefox' | 'webkit'): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    console.log(`[Orchestrator] Launching ${browserType} browser...`);

    const launchOptions = {
      headless: this.defaultOptions.headless,
      args: [
        '--disable-blink-features=AutomationControlled', // Hide automation flags
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ]
    };

    switch (browserType) {
      case 'firefox':
        const { firefox } = await import('playwright');
        this.browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        const { webkit } = await import('playwright');
        this.browser = await webkit.launch(launchOptions);
        break;
      default:
        this.browser = await chromium.launch(launchOptions);
    }

    return this.browser;
  }

  /**
   * Determine if error type should not be retried
   */
  private shouldNotRetry(result: AutomationResult): boolean {
    const noRetryTypes = ['captcha', 'validation', 'form_changed'];
    return result.errorType ? noRetryTypes.includes(result.errorType) : false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 2000; // 2 seconds
    return baseDelay * Math.pow(2, attempt - 1); // 2s, 4s, 8s, etc.
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if automation is available for manufacturer
   */
  hasAutomation(manufacturer: string): boolean {
    return ManufacturerRegistry.has(manufacturer);
  }

  /**
   * Get list of supported manufacturers
   */
  getSupportedManufacturers(): string[] {
    return ManufacturerRegistry.getAll();
  }

  /**
   * Get automation info for all manufacturers
   */
  getAutomationInfo() {
    return ManufacturerRegistry.getAllInfo();
  }

  /**
   * Cleanup: Close browser
   */
  async shutdown(): Promise<void> {
    if (this.browser && this.browser.isConnected()) {
      console.log('[Orchestrator] Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
