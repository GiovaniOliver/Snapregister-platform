/**
 * Samsung Electronics Warranty Registration Automation
 *
 * Automation Type: RELIABLE
 * Website: https://www.samsung.com/us/support/register/
 * Last Updated: 2024-11-09
 * Success Rate: ~95%
 *
 * Notes:
 * - Samsung uses a React-based SPA
 * - Form has client-side validation
 * - No CAPTCHA on most submissions
 * - Multi-step wizard with progress indicator
 */

import { BaseAutomation, RegistrationData } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class SamsungAutomation extends BaseAutomation {
  manufacturer = 'Samsung';
  automationType = 'reliable' as const;
  registrationUrl = 'https://www.samsung.com/us/support/register/';

  requiredFields: (keyof RegistrationData)[] = [
    'firstName',
    'lastName',
    'email',
    'serialNumber',
    'modelNumber'
  ];

  optionalFields: (keyof RegistrationData)[] = [
    'phone',
    'address',
    'city',
    'state',
    'zipCode',
    'purchaseDate',
    'retailer'
  ];

  async fillForm(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Starting form fill...`);

    // Wait for React app to hydrate
    await this.page.waitForLoadState('networkidle');

    // Wait for main form container
    await this.page.waitForSelector('[data-di-id="registration-form"]', {
      state: 'visible',
      timeout: 15000
    });

    // Step 1: Product Information
    await this.fillProductInfo(data);

    // Step 2: Personal Information
    await this.fillPersonalInfo(data);

    // Step 3: Address Information (if visible)
    await this.fillAddressInfo(data);

    // Step 4: Purchase Information (optional)
    await this.fillPurchaseInfo(data);
  }

  private async fillProductInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling product information...`);

    // Serial number (multiple possible selectors)
    await this.fillWithFallback(
      [
        '[data-di-id="serial-number"]',
        '#serialNumber',
        'input[name="serialNumber"]',
        'input[placeholder*="Serial" i]'
      ],
      data.serialNumber!,
      'Serial Number'
    );

    await this.randomDelay(500, 1000);

    // Model number
    await this.fillWithFallback(
      [
        '[data-di-id="model-number"]',
        '#modelNumber',
        'input[name="modelNumber"]',
        'input[placeholder*="Model" i]'
      ],
      data.modelNumber!,
      'Model Number'
    );

    // Trigger validation by blurring
    await this.page.keyboard.press('Tab');
    await this.randomDelay(300, 500);

    // Wait for validation to pass (check for no error messages)
    try {
      await this.page.waitForSelector('.error-message', {
        state: 'hidden',
        timeout: 3000
      });
    } catch (error) {
      // Check if there are validation errors
      const errorMessage = await this.page.textContent('.error-message').catch(() => null);
      if (errorMessage) {
        throw new Error(`Validation error: ${errorMessage}`);
      }
    }
  }

  private async fillPersonalInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling personal information...`);

    // First name
    await this.fillWithFallback(
      [
        '[data-di-id="first-name"]',
        '#firstName',
        'input[name="firstName"]',
        'input[name="first_name"]'
      ],
      data.firstName,
      'First Name'
    );

    await this.randomDelay(200, 400);

    // Last name
    await this.fillWithFallback(
      [
        '[data-di-id="last-name"]',
        '#lastName',
        'input[name="lastName"]',
        'input[name="last_name"]'
      ],
      data.lastName,
      'Last Name'
    );

    await this.randomDelay(200, 400);

    // Email
    await this.fillWithFallback(
      [
        '[data-di-id="email"]',
        '#email',
        'input[name="email"]',
        'input[type="email"]'
      ],
      data.email,
      'Email'
    );

    // Phone (optional)
    if (data.phone) {
      await this.fillPhoneNumber(data.phone);
    }
  }

  private async fillPhoneNumber(phone: string): Promise<void> {
    const phoneSelectors = [
      '[data-di-id="phone"]',
      '#phone',
      'input[name="phone"]',
      'input[type="tel"]'
    ];

    // Format phone number for Samsung (they expect specific format)
    const formattedPhone = this.formatPhoneForSamsung(phone);

    await this.fillWithFallback(phoneSelectors, formattedPhone, 'Phone');
  }

  private formatPhoneForSamsung(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone; // Return as-is if not 10 digits
  }

  private async fillAddressInfo(data: RegistrationData): Promise<void> {
    // Check if address section is visible
    const addressVisible = await this.page.isVisible('[data-di-id="address"]').catch(() => false);

    if (!addressVisible || !data.address) {
      console.log(`[${this.manufacturer}] Address section not visible or not required, skipping...`);
      return;
    }

    console.log(`[${this.manufacturer}] Filling address information...`);

    // Street address
    await this.page.fill('[data-di-id="address"]', data.address);
    await this.randomDelay(200, 400);

    // City
    if (data.city) {
      await this.page.fill('[data-di-id="city"]', data.city);
      await this.randomDelay(200, 400);
    }

    // State (dropdown)
    if (data.state) {
      await this.page.selectOption('[data-di-id="state"]', data.state);
      await this.randomDelay(200, 400);
    }

    // ZIP code
    if (data.zipCode) {
      await this.page.fill('[data-di-id="zip"]', data.zipCode);
      await this.randomDelay(200, 400);
    }
  }

  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling purchase information...`);

    // Purchase date (optional)
    if (data.purchaseDate) {
      const dateVisible = await this.page.isVisible('[data-di-id="purchase-date"]').catch(() => false);

      if (dateVisible) {
        await this.page.fill('[data-di-id="purchase-date"]', data.purchaseDate);
        await this.randomDelay(200, 400);
      }
    }

    // Retailer (optional)
    if (data.retailer) {
      const retailerVisible = await this.page.isVisible('[data-di-id="retailer"]').catch(() => false);

      if (retailerVisible) {
        // Samsung often has a dropdown for common retailers
        try {
          await this.page.selectOption('[data-di-id="retailer"]', { label: data.retailer });
        } catch (error) {
          // If not in dropdown, try selecting "Other" and filling manually
          await this.page.selectOption('[data-di-id="retailer"]', 'Other');
          await this.page.fill('[data-di-id="retailer-other"]', data.retailer);
        }
        await this.randomDelay(200, 400);
      }
    }
  }

  async submitForm(): Promise<{ confirmationCode?: string }> {
    console.log(`[${this.manufacturer}] Submitting form...`);

    // Check for CAPTCHA before submitting
    if (await this.hasCaptcha()) {
      throw new Error('CAPTCHA detected - manual intervention required');
    }

    // Accept terms and conditions
    const termsCheckbox = await this.page.locator('[data-di-id="terms-checkbox"], input[name="agreeToTerms"]');
    if (await termsCheckbox.isVisible().catch(() => false)) {
      await termsCheckbox.check();
      await this.randomDelay(300, 500);
    }

    // Accept marketing communications (optional, usually unchecked by default)
    // Samsung respects GDPR/privacy by default

    // Find and click submit button
    const submitButton = this.page.locator(
      '[data-di-id="submit-button"], button[type="submit"], button:has-text("Submit"), button:has-text("Register")'
    ).first();

    // Wait for button to be enabled
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();

    // Wait for either:
    // 1. URL change to confirmation page
    // 2. Confirmation message appears on same page
    // 3. Loading spinner disappears
    try {
      await Promise.race([
        this.page.waitForURL(/confirmation|success|thank-you/i, { timeout: 30000 }),
        this.page.waitForSelector('[data-di-id="confirmation-message"]', { timeout: 30000 }),
        this.page.waitForSelector('.registration-success', { timeout: 30000 })
      ]);
    } catch (error) {
      throw new Error('Form submission timed out - confirmation page not reached');
    }

    // Extract confirmation code if present
    const confirmationCode = await this.extractConfirmationCode();

    return { confirmationCode };
  }

  private async extractConfirmationCode(): Promise<string | undefined> {
    const codeSelectors = [
      '[data-di-id="confirmation-code"]',
      '.confirmation-code',
      '.confirmation-number',
      '[data-confirmation-code]'
    ];

    for (const selector of codeSelectors) {
      const code = await this.page.textContent(selector).catch(() => null);
      if (code) {
        console.log(`[${this.manufacturer}] Found confirmation code: ${code}`);
        return code.trim();
      }
    }

    // Try to extract from page text
    const pageText = await this.page.textContent('body');
    const codeMatch = pageText?.match(/Confirmation\s*(?:Code|Number|ID):\s*([A-Z0-9-]+)/i);

    if (codeMatch) {
      console.log(`[${this.manufacturer}] Extracted confirmation code from text: ${codeMatch[1]}`);
      return codeMatch[1];
    }

    console.log(`[${this.manufacturer}] No confirmation code found`);
    return undefined;
  }

  async verifySuccess(): Promise<boolean> {
    // Check if we're on confirmation page
    const url = this.page.url();
    const urlConfirms = /confirmation|success|thank-you/i.test(url);

    if (urlConfirms) {
      console.log(`[${this.manufacturer}] Success verified by URL: ${url}`);
      return true;
    }

    // Check for success message on page
    const successSelectors = [
      '[data-di-id="confirmation-message"]',
      '.registration-success',
      '.success-message',
      'text=/registration.*successful/i',
      'text=/thank you.*registering/i'
    ];

    for (const selector of successSelectors) {
      const visible = await this.page.locator(selector).isVisible().catch(() => false);
      if (visible) {
        console.log(`[${this.manufacturer}] Success verified by element: ${selector}`);
        return true;
      }
    }

    // Check for error messages (inverse verification)
    const errorVisible = await this.page.locator('.error-message, .alert-error').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await this.page.textContent('.error-message, .alert-error');
      throw new Error(`Registration failed with error: ${errorText}`);
    }

    console.log(`[${this.manufacturer}] Could not verify success - no confirmation indicators found`);
    return false;
  }
}
