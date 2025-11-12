/**
 * LG Electronics Warranty Registration Automation
 *
 * Automation Type: RELIABLE
 * Website: https://www.lg.com/us/support/product-registration
 * Last Updated: 2025-11-12
 * Success Rate: ~90% (estimated)
 *
 * Notes:
 * - LG uses a multi-step registration form
 * - Product validation required (model/serial must match)
 * - Address information is required
 * - Purchase date and retailer are optional
 * - No CAPTCHA on standard registrations
 */

import { BaseAutomation, RegistrationData } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class LGAutomation extends BaseAutomation {
  manufacturer = 'LG';
  automationType = 'reliable' as const;
  registrationUrl = 'https://www.lg.com/us/support/product-registration';

  requiredFields: (keyof RegistrationData)[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'serialNumber',
    'modelNumber',
    'address',
    'city',
    'state',
    'zipCode'
  ];

  optionalFields: (keyof RegistrationData)[] = [
    'purchaseDate',
    'retailer',
    'purchasePrice'
  ];

  async fillForm(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Starting form fill...`);

    // Wait for page to load completely
    await this.page.waitForLoadState('networkidle');
    await this.randomDelay(1000, 2000);

    // Check if we need to click "Register Product" button first
    const registerButton = await this.page.locator('text=/Register.*Product/i').first();
    if (await registerButton.isVisible().catch(() => false)) {
      await registerButton.click();
      await this.page.waitForLoadState('networkidle');
      await this.randomDelay(1000, 1500);
    }

    // Step 1: Product Information
    await this.fillProductInfo(data);

    // Step 2: Personal Information
    await this.fillPersonalInfo(data);

    // Step 3: Address Information
    await this.fillAddressInfo(data);

    // Step 4: Purchase Information (optional)
    await this.fillPurchaseInfo(data);

    console.log(`[${this.manufacturer}] Form fill completed`);
  }

  private async fillProductInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling product information...`);

    // Model Number field (try multiple selectors)
    await this.fillWithFallback(
      [
        'input[name="modelNumber"]',
        'input[name="model"]',
        'input[id*="model" i]',
        'input[placeholder*="Model" i]',
        '#modelNumber',
        '[data-field="modelNumber"]'
      ],
      data.modelNumber!,
      'Model Number'
    );

    await this.randomDelay(500, 1000);

    // Serial Number field
    await this.fillWithFallback(
      [
        'input[name="serialNumber"]',
        'input[name="serial"]',
        'input[id*="serial" i]',
        'input[placeholder*="Serial" i]',
        '#serialNumber',
        '[data-field="serialNumber"]'
      ],
      data.serialNumber!,
      'Serial Number'
    );

    await this.randomDelay(300, 500);

    // Trigger validation by tabbing
    await this.page.keyboard.press('Tab');
    await this.randomDelay(500, 1000);

    // Check for product validation button
    const validateButton = await this.page.locator(
      'button:has-text("Validate"), button:has-text("Verify"), button:has-text("Check")'
    ).first();

    if (await validateButton.isVisible().catch(() => false)) {
      console.log(`[${this.manufacturer}] Clicking product validation button...`);
      await validateButton.click();
      await this.randomDelay(2000, 3000);

      // Wait for validation to complete
      await this.page.waitForLoadState('networkidle');
    }

    // Click "Next" or "Continue" if present
    await this.clickNextIfPresent();
  }

  private async fillPersonalInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling personal information...`);

    // First Name
    await this.fillWithFallback(
      [
        'input[name="firstName"]',
        'input[name="first_name"]',
        'input[id*="first" i]:not([id*="last" i])',
        'input[placeholder*="First" i]',
        '#firstName'
      ],
      data.firstName,
      'First Name'
    );

    await this.randomDelay(300, 500);

    // Last Name
    await this.fillWithFallback(
      [
        'input[name="lastName"]',
        'input[name="last_name"]',
        'input[id*="last" i]:not([id*="first" i])',
        'input[placeholder*="Last" i]',
        '#lastName'
      ],
      data.lastName,
      'Last Name'
    );

    await this.randomDelay(300, 500);

    // Email
    await this.fillWithFallback(
      [
        'input[name="email"]',
        'input[type="email"]',
        'input[id*="email" i]',
        'input[placeholder*="Email" i]',
        '#email'
      ],
      data.email,
      'Email'
    );

    await this.randomDelay(300, 500);

    // Phone Number
    if (data.phone) {
      await this.fillWithFallback(
        [
          'input[name="phone"]',
          'input[name="phoneNumber"]',
          'input[type="tel"]',
          'input[id*="phone" i]',
          'input[placeholder*="Phone" i]',
          '#phone'
        ],
        data.phone,
        'Phone'
      );

      await this.randomDelay(300, 500);
    }

    // Click "Next" or "Continue" if present
    await this.clickNextIfPresent();
  }

  private async fillAddressInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling address information...`);

    // Street Address
    if (data.address) {
      await this.fillWithFallback(
        [
          'input[name="address"]',
          'input[name="street"]',
          'input[name="address1"]',
          'input[id*="address" i]',
          'input[placeholder*="Address" i]',
          'input[placeholder*="Street" i]',
          '#address'
        ],
        data.address,
        'Address'
      );

      await this.randomDelay(300, 500);
    }

    // City
    if (data.city) {
      await this.fillWithFallback(
        [
          'input[name="city"]',
          'input[id*="city" i]',
          'input[placeholder*="City" i]',
          '#city'
        ],
        data.city,
        'City'
      );

      await this.randomDelay(300, 500);
    }

    // State (dropdown or input)
    if (data.state) {
      // Try dropdown first
      const stateDropdown = await this.page.locator(
        'select[name="state"], select[name="stateCode"], select[id*="state" i]'
      ).first();

      if (await stateDropdown.isVisible().catch(() => false)) {
        await stateDropdown.selectOption({ label: data.state });
        console.log(`[${this.manufacturer}] Selected state: ${data.state}`);
      } else {
        // Fallback to input field
        await this.fillWithFallback(
          [
            'input[name="state"]',
            'input[id*="state" i]',
            'input[placeholder*="State" i]',
            '#state'
          ],
          data.state,
          'State'
        );
      }

      await this.randomDelay(300, 500);
    }

    // ZIP Code
    if (data.zipCode) {
      await this.fillWithFallback(
        [
          'input[name="zipCode"]',
          'input[name="zip"]',
          'input[name="postalCode"]',
          'input[id*="zip" i]',
          'input[placeholder*="ZIP" i]',
          '#zipCode'
        ],
        data.zipCode,
        'ZIP Code'
      );

      await this.randomDelay(300, 500);
    }

    // Click "Next" or "Continue" if present
    await this.clickNextIfPresent();
  }

  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling purchase information...`);

    // Purchase Date (if provided)
    if (data.purchaseDate) {
      try {
        const dateInput = await this.page.locator(
          'input[name="purchaseDate"], input[type="date"], input[id*="purchase" i][id*="date" i]'
        ).first();

        if (await dateInput.isVisible().catch(() => false)) {
          // Format date as YYYY-MM-DD
          const date = new Date(data.purchaseDate);
          const formattedDate = date.toISOString().split('T')[0];

          await dateInput.fill(formattedDate);
          console.log(`[${this.manufacturer}] Filled purchase date: ${formattedDate}`);
          await this.randomDelay(300, 500);
        }
      } catch (error) {
        console.warn(`[${this.manufacturer}] Could not fill purchase date:`, error);
      }
    }

    // Retailer/Store (if provided)
    if (data.retailer) {
      await this.fillWithFallback(
        [
          'input[name="retailer"]',
          'input[name="store"]',
          'input[name="dealer"]',
          'input[id*="retailer" i]',
          'input[placeholder*="Retailer" i]',
          'input[placeholder*="Store" i]'
        ],
        data.retailer,
        'Retailer',
        true // optional field
      );

      await this.randomDelay(300, 500);
    }

    // Purchase Price (if provided)
    if (data.purchasePrice) {
      await this.fillWithFallback(
        [
          'input[name="price"]',
          'input[name="purchasePrice"]',
          'input[id*="price" i]',
          'input[placeholder*="Price" i]'
        ],
        data.purchasePrice.toString(),
        'Purchase Price',
        true // optional field
      );

      await this.randomDelay(300, 500);
    }
  }

  /**
   * Click "Next" or "Continue" button if present
   */
  private async clickNextIfPresent(): Promise<void> {
    try {
      const nextButton = await this.page.locator(
        'button:has-text("Next"), button:has-text("Continue"), button:has-text("Proceed"), input[type="submit"][value*="Next" i]'
      ).first();

      if (await nextButton.isVisible().catch(() => false)) {
        console.log(`[${this.manufacturer}] Clicking Next/Continue button...`);
        await nextButton.click();
        await this.randomDelay(1000, 2000);
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      // No next button found, continue
      console.log(`[${this.manufacturer}] No Next button found, continuing...`);
    }
  }

  async submitForm(): Promise<void> {
    console.log(`[${this.manufacturer}] Attempting to submit form...`);

    // Look for submit button with various text options
    const submitButton = await this.page.locator(
      'button:has-text("Submit"), button:has-text("Register"), button:has-text("Complete"), input[type="submit"]'
    ).first();

    if (!(await submitButton.isVisible().catch(() => false))) {
      throw new Error('Submit button not found');
    }

    // Take screenshot before submission
    await this.takeScreenshot('before-submit');

    // Click submit
    await submitButton.click();

    // Wait for submission to complete
    await this.randomDelay(2000, 3000);

    // Wait for either success or error
    await Promise.race([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForTimeout(10000)
    ]);

    // Take screenshot after submission
    await this.takeScreenshot('after-submit');

    console.log(`[${this.manufacturer}] Form submitted`);
  }

  async detectCaptcha(): Promise<boolean> {
    console.log(`[${this.manufacturer}] Checking for CAPTCHA...`);

    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.g-recaptcha',
      '.h-captcha',
      '[data-captcha]',
      'div[id*="captcha" i]'
    ];

    for (const selector of captchaSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          console.log(`[${this.manufacturer}] CAPTCHA detected: ${selector}`);
          return true;
        }
      } catch (error) {
        // Continue checking
      }
    }

    console.log(`[${this.manufacturer}] No CAPTCHA detected`);
    return false;
  }

  async verifySuccess(): Promise<{ success: boolean; message: string }> {
    console.log(`[${this.manufacturer}] Verifying submission success...`);

    await this.randomDelay(2000, 3000);

    // Check for success indicators
    const successSelectors = [
      'text=/success/i',
      'text=/thank you/i',
      'text=/registered/i',
      'text=/confirmation/i',
      '.success',
      '.confirmation',
      '[data-success="true"]'
    ];

    for (const selector of successSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          const text = await element.textContent();
          console.log(`[${this.manufacturer}] Success indicator found: ${text}`);
          return {
            success: true,
            message: text?.trim() || 'Registration completed successfully'
          };
        }
      } catch (error) {
        // Continue checking
      }
    }

    // Check for error indicators
    const errorSelectors = [
      'text=/error/i',
      'text=/failed/i',
      'text=/invalid/i',
      '.error',
      '.alert-danger',
      '[role="alert"]'
    ];

    for (const selector of errorSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          const text = await element.textContent();
          console.log(`[${this.manufacturer}] Error indicator found: ${text}`);
          return {
            success: false,
            message: text?.trim() || 'Registration failed'
          };
        }
      } catch (error) {
        // Continue checking
      }
    }

    // Check URL for success/confirmation page
    const currentUrl = this.page.url();
    if (
      currentUrl.includes('success') ||
      currentUrl.includes('confirmation') ||
      currentUrl.includes('thank-you')
    ) {
      console.log(`[${this.manufacturer}] Success detected from URL: ${currentUrl}`);
      return {
        success: true,
        message: 'Registration completed successfully (detected from URL)'
      };
    }

    // Ambiguous result - take screenshot for manual review
    await this.takeScreenshot('verification-ambiguous');

    return {
      success: false,
      message: 'Could not verify registration status - manual review required'
    };
  }
}
