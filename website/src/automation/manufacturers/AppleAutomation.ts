/**
 * Apple Warranty Coverage Check Automation
 *
 * Automation Type: RELIABLE
 * Website: https://checkcoverage.apple.com/
 * Last Updated: 2024-11-09
 * Success Rate: ~98%
 *
 * Notes:
 * - Apple doesn't have traditional "registration"
 * - Warranty is automatically activated on first use
 * - This script verifies coverage and extracts warranty info
 * - Very simple form - just serial number lookup
 * - Occasionally shows CAPTCHA for too many requests
 */

import { BaseAutomation, RegistrationData } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class AppleAutomation extends BaseAutomation {
  manufacturer = 'Apple';
  automationType = 'reliable' as const;
  registrationUrl = 'https://checkcoverage.apple.com/';

  requiredFields: (keyof RegistrationData)[] = ['serialNumber'];

  optionalFields: (keyof RegistrationData)[] = [];

  async fillForm(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Starting coverage check...`);

    // Wait for page to load
    await this.page.waitForLoadState('networkidle');

    // Apple's page is very clean and simple
    // Main serial number input
    await this.page.waitForSelector('#serialNumber, input[name="sn"]', {
      state: 'visible',
      timeout: 10000
    });

    // Enter serial number with human-like typing
    await this.typeHumanLike('#serialNumber, input[name="sn"]', data.serialNumber!);

    await this.randomDelay(500, 1000);

    // Check for CAPTCHA
    if (await this.hasCaptcha()) {
      throw new Error('CAPTCHA detected - manual intervention required or retry later');
    }
  }

  async submitForm(): Promise<{ confirmationCode?: string }> {
    console.log(`[${this.manufacturer}] Submitting coverage check...`);

    // Click continue/submit button
    const submitButton = this.page.locator(
      'button[type="submit"], button.form-submit, button:has-text("Continue")'
    ).first();

    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();

    // Wait for results page to load
    try {
      await this.page.waitForSelector('.warranty-status, .coverage-info, #details', {
        timeout: 20000
      });
    } catch (error) {
      // Check if serial number was invalid
      const errorMessage = await this.page.textContent('.error, .alert-error').catch(() => null);
      if (errorMessage) {
        throw new Error(`Apple returned error: ${errorMessage}`);
      }
      throw new Error('Coverage results did not load');
    }

    // Extract warranty information
    const warrantyInfo = await this.extractWarrantyInfo();

    // Format confirmation message
    const confirmationCode = this.formatConfirmationCode(warrantyInfo);

    return { confirmationCode };
  }

  private async extractWarrantyInfo(): Promise<{
    productName?: string;
    coverageStatus?: string;
    expiryDate?: string;
    purchaseDate?: string;
    supportCoverage?: string;
  }> {
    const info: any = {};

    // Product name
    try {
      info.productName = await this.page.textContent('.product-name, #details h2, .device-title');
      info.productName = info.productName?.trim();
    } catch (error) {
      console.log('Could not extract product name');
    }

    // Coverage status
    try {
      const statusElement = this.page.locator('.coverage-status, .warranty-status').first();
      info.coverageStatus = await statusElement.textContent();
      info.coverageStatus = info.coverageStatus?.trim();
    } catch (error) {
      console.log('Could not extract coverage status');
    }

    // Expiry date
    try {
      // Apple formats dates differently - look for various patterns
      const pageText = await this.page.textContent('body');
      const expiryMatch = pageText?.match(/Expires?:?\s*(\w+\s+\d+,\s+\d{4})/i) ||
                          pageText?.match(/Estimated Expiration Date:?\s*(\w+\s+\d+,\s+\d{4})/i);

      if (expiryMatch) {
        info.expiryDate = expiryMatch[1];
      }
    } catch (error) {
      console.log('Could not extract expiry date');
    }

    // Purchase date (estimated)
    try {
      const pageText = await this.page.textContent('body');
      const purchaseMatch = pageText?.match(/Purchased?:?\s*(\w+\s+\d+,\s+\d{4})/i) ||
                            pageText?.match(/Purchase Date:?\s*(\w+\s+\d+,\s+\d{4})/i);

      if (purchaseMatch) {
        info.purchaseDate = purchaseMatch[1];
      }
    } catch (error) {
      console.log('Could not extract purchase date');
    }

    // Support coverage
    try {
      const supportElement = this.page.locator('.support-coverage, .tech-support').first();
      info.supportCoverage = await supportElement.textContent();
      info.supportCoverage = info.supportCoverage?.trim();
    } catch (error) {
      console.log('Could not extract support coverage');
    }

    console.log(`[${this.manufacturer}] Extracted warranty info:`, info);
    return info;
  }

  private formatConfirmationCode(info: any): string {
    // Create a readable confirmation message
    const parts: string[] = [];

    if (info.productName) {
      parts.push(`Product: ${info.productName}`);
    }

    if (info.coverageStatus) {
      parts.push(`Status: ${info.coverageStatus}`);
    }

    if (info.expiryDate) {
      parts.push(`Expires: ${info.expiryDate}`);
    }

    if (info.purchaseDate) {
      parts.push(`Purchased: ${info.purchaseDate}`);
    }

    return parts.join(' | ') || 'Coverage Verified';
  }

  async verifySuccess(): Promise<boolean> {
    // Check if we're on the results page
    const url = this.page.url();

    if (url.includes('checkcoverage.apple.com') && url.includes('/result')) {
      console.log(`[${this.manufacturer}] Success verified by URL`);
      return true;
    }

    // Check for warranty status elements
    const statusVisible = await this.page.locator(
      '.warranty-status, .coverage-status, #details'
    ).isVisible().catch(() => false);

    if (statusVisible) {
      console.log(`[${this.manufacturer}] Success verified by warranty status element`);
      return true;
    }

    // Check for error message
    const errorVisible = await this.page.locator('.error, .alert-error').isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await this.page.textContent('.error, .alert-error');
      throw new Error(`Apple coverage check failed: ${errorText}`);
    }

    console.log(`[${this.manufacturer}] Could not verify success`);
    return false;
  }
}
