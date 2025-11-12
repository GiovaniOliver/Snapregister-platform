/**
 * HP Inc. Warranty Registration Automation
 *
 * Automation Type: RELIABLE
 * Website: https://support.hp.com/us-en/product-registration
 * Last Updated: 2025-11-12
 * Success Rate: ~85% (estimated)
 *
 * Notes:
 * - HP uses different flows for different product categories
 * - Printers: Simple registration with serial number
 * - Computers: More detailed information required
 * - Some products may require HP Account creation
 * - Product number validation is strict
 * - May redirect to HP Account login if user has existing account
 */

import { BaseAutomation, RegistrationData } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class HPAutomation extends BaseAutomation {
  manufacturer = 'HP';
  automationType = 'reliable' as const;
  registrationUrl = 'https://support.hp.com/us-en/product-registration';

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
    'country',
    'purchaseDate',
    'retailer'
  ];

  async fillForm(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Starting form fill...`);

    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    await this.randomDelay(1500, 2500);

    // Check if we need to accept cookies
    await this.handleCookieConsent();

    // Check if we need to create account or login
    await this.handleAccountFlow(data);

    // Step 1: Enter product information
    await this.fillProductInfo(data);

    // Step 2: Fill personal information (if not already from account)
    await this.fillPersonalInfo(data);

    // Step 3: Fill address information (optional but recommended)
    await this.fillAddressInfo(data);

    // Step 4: Fill purchase information (optional)
    await this.fillPurchaseInfo(data);

    console.log(`[${this.manufacturer}] Form fill completed`);
  }

  /**
   * Handle cookie consent banner
   */
  private async handleCookieConsent(): Promise<void> {
    try {
      const cookieButton = await this.page.locator(
        'button:has-text("Accept"), button:has-text("I Accept"), button:has-text("OK"), #onetrust-accept-btn-handler'
      ).first();

      if (await cookieButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`[${this.manufacturer}] Accepting cookies...`);
        await cookieButton.click();
        await this.randomDelay(500, 1000);
      }
    } catch (error) {
      // No cookie banner, continue
    }
  }

  /**
   * Handle HP Account login/creation flow
   */
  private async handleAccountFlow(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Checking for account login requirement...`);

    // Check if we're on HP Account login page
    const loginPage = await this.page.locator(
      'text=/Sign in/i, text=/Log in/i, input[type="email"][placeholder*="email" i]'
    ).first();

    if (await loginPage.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`[${this.manufacturer}] HP Account login detected - will attempt guest registration...`);

      // Look for "Register as Guest" or "Continue without signing in" option
      const guestOption = await this.page.locator(
        'text=/continue.*guest/i, text=/register.*guest/i, text=/skip.*sign/i, button:has-text("Skip")'
      ).first();

      if (await guestOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`[${this.manufacturer}] Clicking guest registration option...`);
        await guestOption.click();
        await this.randomDelay(1000, 2000);
        await this.page.waitForLoadState('networkidle');
      } else {
        console.warn(`[${this.manufacturer}] Guest registration not available - may require HP Account`);
        throw new Error('HP Account required for this product - cannot automate');
      }
    }
  }

  /**
   * Fill product information
   */
  private async fillProductInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling product information...`);

    // Product Number (Model Number) - HP's terminology
    await this.fillWithFallback(
      [
        'input[name="productNumber"]',
        'input[name="modelNumber"]',
        'input[name="model"]',
        'input[id*="product" i][id*="number" i]',
        'input[placeholder*="Product Number" i]',
        'input[placeholder*="Model" i]',
        '#productNumber'
      ],
      data.modelNumber!,
      'Product Number'
    );

    await this.randomDelay(500, 1000);

    // Serial Number
    await this.fillWithFallback(
      [
        'input[name="serialNumber"]',
        'input[name="serial"]',
        'input[id*="serial" i]',
        'input[placeholder*="Serial" i]',
        '#serialNumber'
      ],
      data.serialNumber!,
      'Serial Number'
    );

    await this.randomDelay(300, 500);

    // Click "Find Product" or "Verify" button if present
    const verifyButton = await this.page.locator(
      'button:has-text("Find"), button:has-text("Verify"), button:has-text("Search"), button:has-text("Continue")'
    ).first();

    if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`[${this.manufacturer}] Clicking product verification button...`);
      await verifyButton.click();
      await this.randomDelay(2000, 3000);

      // Wait for product validation
      await this.page.waitForLoadState('networkidle');

      // Check for error messages
      const errorMessage = await this.page.locator(
        '.error, .alert-danger, [role="alert"], text=/not found/i, text=/invalid/i'
      ).first();

      if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorMessage.textContent();
        console.error(`[${this.manufacturer}] Product validation error: ${errorText}`);
        throw new Error(`Product validation failed: ${errorText}`);
      }
    }

    // Click "Next" if present
    await this.clickNextIfPresent();
  }

  /**
   * Fill personal information
   */
  private async fillPersonalInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling personal information...`);

    // First Name
    await this.fillWithFallback(
      [
        'input[name="firstName"]',
        'input[name="first_name"]',
        'input[name="fname"]',
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
        'input[name="lname"]',
        'input[id*="last" i]:not([id*="first" i])',
        'input[placeholder*="Last" i]',
        '#lastName'
      ],
      data.lastName,
      'Last Name'
    );

    await this.randomDelay(300, 500);

    // Email Address
    await this.fillWithFallback(
      [
        'input[name="email"]',
        'input[name="emailAddress"]',
        'input[type="email"]',
        'input[id*="email" i]',
        'input[placeholder*="Email" i]',
        '#email'
      ],
      data.email,
      'Email'
    );

    await this.randomDelay(300, 500);

    // Confirm Email (if required)
    const confirmEmailField = await this.page.locator(
      'input[name="confirmEmail"], input[name="email_confirm"], input[placeholder*="Confirm Email" i]'
    ).first();

    if (await confirmEmailField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmEmailField.fill(data.email);
      console.log(`[${this.manufacturer}] Filled confirm email field`);
      await this.randomDelay(300, 500);
    }

    // Phone Number (optional)
    if (data.phone) {
      await this.fillWithFallback(
        [
          'input[name="phone"]',
          'input[name="phoneNumber"]',
          'input[name="telephone"]',
          'input[type="tel"]',
          'input[id*="phone" i]',
          'input[placeholder*="Phone" i]',
          '#phone'
        ],
        data.phone,
        'Phone',
        true // optional
      );

      await this.randomDelay(300, 500);
    }

    // Click "Next" if present
    await this.clickNextIfPresent();
  }

  /**
   * Fill address information
   */
  private async fillAddressInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling address information...`);

    // Country (if present - default to US)
    const countryDropdown = await this.page.locator(
      'select[name="country"], select[id*="country" i]'
    ).first();

    if (await countryDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await countryDropdown.selectOption({ label: data.country || 'United States' });
      console.log(`[${this.manufacturer}] Selected country: ${data.country || 'United States'}`);
      await this.randomDelay(500, 1000);
    }

    // Street Address
    if (data.address) {
      await this.fillWithFallback(
        [
          'input[name="address"]',
          'input[name="street"]',
          'input[name="addressLine1"]',
          'input[name="address1"]',
          'input[id*="address" i]',
          'input[placeholder*="Address" i]',
          '#address'
        ],
        data.address,
        'Address',
        true // optional
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
        'City',
        true // optional
      );

      await this.randomDelay(300, 500);
    }

    // State (dropdown or input)
    if (data.state) {
      const stateDropdown = await this.page.locator(
        'select[name="state"], select[name="stateCode"], select[id*="state" i]'
      ).first();

      if (await stateDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        try {
          await stateDropdown.selectOption({ label: data.state });
          console.log(`[${this.manufacturer}] Selected state: ${data.state}`);
        } catch (error) {
          // Try by value (2-letter code)
          await stateDropdown.selectOption({ value: data.state.substring(0, 2).toUpperCase() });
        }
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
          'State',
          true // optional
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
        'ZIP Code',
        true // optional
      );

      await this.randomDelay(300, 500);
    }

    // Click "Next" if present
    await this.clickNextIfPresent();
  }

  /**
   * Fill purchase information
   */
  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    console.log(`[${this.manufacturer}] Filling purchase information...`);

    // Purchase Date (if provided)
    if (data.purchaseDate) {
      try {
        const dateInput = await this.page.locator(
          'input[name="purchaseDate"], input[type="date"], input[id*="purchase" i][id*="date" i]'
        ).first();

        if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
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
          'select[name="retailer"]',
          'input[id*="retailer" i]',
          'input[placeholder*="Retailer" i]',
          'input[placeholder*="Store" i]'
        ],
        data.retailer,
        'Retailer',
        true // optional
      );

      await this.randomDelay(300, 500);
    }

    // Check for optional marketing preferences checkboxes
    await this.handleMarketingPreferences();
  }

  /**
   * Handle marketing preferences checkboxes
   */
  private async handleMarketingPreferences(): Promise<void> {
    try {
      // Look for marketing opt-in checkboxes
      const marketingCheckbox = await this.page.locator(
        'input[type="checkbox"][name*="marketing" i], input[type="checkbox"][name*="newsletter" i], input[type="checkbox"][name*="email" i]'
      ).first();

      if (await marketingCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Uncheck marketing preferences by default (user privacy)
        if (await marketingCheckbox.isChecked()) {
          await marketingCheckbox.uncheck();
          console.log(`[${this.manufacturer}] Unchecked marketing preferences`);
        }
      }
    } catch (error) {
      // No marketing preferences, continue
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

      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
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
      'button:has-text("Submit"), button:has-text("Register"), button:has-text("Complete"), button:has-text("Finish"), input[type="submit"]'
    ).first();

    if (!(await submitButton.isVisible().catch(() => false))) {
      throw new Error('Submit button not found');
    }

    // Take screenshot before submission
    await this.takeScreenshot('before-submit');

    // Click submit
    await submitButton.click();

    // Wait for submission to complete
    await this.randomDelay(2000, 4000);

    // Wait for either success or error
    await Promise.race([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForTimeout(15000)
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
      'div[id*="captcha" i]',
      '#px-captcha' // PerimeterX
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
      'text=/completed/i',
      '.success',
      '.confirmation',
      '[data-success="true"]',
      'h1:has-text("Success")',
      'h2:has-text("Thank")'
    ];

    for (const selector of successSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          const text = await element.textContent();
          console.log(`[${this.manufacturer}] Success indicator found: ${text}`);
          return {
            success: true,
            message: text?.trim() || 'Product registered successfully'
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
      'text=/already registered/i',
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

          // Check if it's a duplicate registration (counts as success)
          if (text?.toLowerCase().includes('already registered')) {
            return {
              success: true,
              message: 'Product already registered'
            };
          }

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
      currentUrl.includes('thank-you') ||
      currentUrl.includes('complete')
    ) {
      console.log(`[${this.manufacturer}] Success detected from URL: ${currentUrl}`);
      return {
        success: true,
        message: 'Product registered successfully (detected from URL)'
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
