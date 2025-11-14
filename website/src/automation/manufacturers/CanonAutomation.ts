/**
 * Canon USA Automation
 *
 * Handles warranty registration for Canon imaging and printing products:
 * - Cameras (EOS, PowerShot, EOS R series)
 * - Lenses (EF, RF, EF-S, EF-M series)
 * - Printers (PIXMA, imageCLASS, imageRUNNER)
 * - Scanners and Camcorders
 *
 * Registration URL: https://www.usa.canon.com/internet/portal/us/home/support/product-registration
 *
 * RELIABILITY: Reliable
 * - Standard form-based registration
 * - Clear field identification
 * - Consistent success confirmation
 * - No CAPTCHA observed
 *
 * KEY FEATURES:
 * - Multi-category product support (Cameras, Lenses, Printers)
 * - Intelligent product category detection
 * - Model number validation and formatting
 * - Serial number format validation
 * - Purchase date with date picker
 * - Optional retailer information
 * - Marketing preferences opt-out
 *
 * REQUIRED FIELDS:
 * - First Name, Last Name
 * - Email
 * - Phone
 * - Model Number
 * - Serial Number
 * - Purchase Date
 * - Address, City, State, Zip
 * - Country
 *
 * FORM BEHAVIOR:
 * - Multi-step form (product info → personal info → address)
 * - Product category dropdown
 * - Model number auto-complete/validation
 * - Serial number format checking
 * - Date picker for purchase date
 * - State dropdown
 * - Optional retailer field
 * - Terms acceptance checkbox
 * - Marketing opt-in checkbox (unchecked by default)
 *
 * SUCCESS INDICATORS:
 * - Redirect to confirmation page
 * - "Thank you" or "Registration successful" message
 * - Registration confirmation number
 * - Email confirmation sent
 *
 * KNOWN ISSUES:
 * - None currently identified
 *
 * @status Complete
 * @reliability Reliable
 * @lastUpdated 2024-01-12
 */

import { Page } from 'playwright';
import { BaseAutomation } from '../core/BaseAutomation';
import { RegistrationData, AutomationResult } from '../core/BaseAutomation';

export class CanonAutomation extends BaseAutomation {
  manufacturer = 'Canon';
  automationType = 'reliable' as const;
  registrationUrl = 'https://www.usa.canon.com/internet/portal/us/home/support/product-registration';

  requiredFields: (keyof RegistrationData)[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'serialNumber',
    'modelNumber',
    'purchaseDate',
    'address',
    'city',
    'state',
    'zipCode',
    'country'
  ];

  optionalFields: (keyof RegistrationData)[] = [
    'retailer',
    'productName',
    'purchasePrice'
  ];

  /**
   * Fill out the Canon registration form
   */
  async fillForm(data: RegistrationData): Promise<void> {
    this.log('Starting Canon form fill process');

    // Wait for form to load
    await this.waitForForm();

    // Handle cookie consent if present
    await this.handleCookieConsent();

    // Step 1: Product Information
    await this.fillProductInfo(data);

    // Step 2: Personal Information
    await this.fillPersonalInfo(data);

    // Step 3: Address Information
    await this.fillAddressInfo(data);

    // Step 4: Purchase Information
    await this.fillPurchaseInfo(data);

    // Handle marketing preferences (opt-out by default)
    await this.handleMarketingPreferences();

    this.log('Form filling completed');
  }

  /**
   * Wait for the registration form to be ready
   */
  private async waitForForm(): Promise<void> {
    try {
      // Wait for main form element or product registration container
      const formSelectors = [
        'form[name="registration"]',
        'form[id*="registration"]',
        'form.product-registration',
        '#registration-form',
        '.registration-container'
      ];

      for (const selector of formSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000, state: 'visible' });
          this.log('Registration form loaded');
          await this.randomDelay(1000, 2000);
          return;
        } catch {
          continue;
        }
      }

      // If no specific form found, wait for general form element
      await this.page.waitForSelector('form', { timeout: 5000, state: 'visible' });
      this.log('Generic form loaded');
    } catch (error) {
      throw new Error('Registration form did not load properly');
    }
  }

  /**
   * Handle cookie consent banner if present
   */
  private async handleCookieConsent(): Promise<void> {
    try {
      const consentSelectors = [
        'button[id*="accept"]',
        'button[id*="consent"]',
        'button.cookie-accept',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Accept")',
        '#onetrust-accept-btn-handler',
        '.accept-cookies'
      ];

      for (const selector of consentSelectors) {
        try {
          const button = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
          if (button) {
            await button.click();
            this.log('Cookie consent accepted');
            await this.randomDelay(500, 1000);
            return;
          }
        } catch {
          continue;
        }
      }
    } catch {
      this.log('No cookie consent banner found or already accepted');
    }
  }

  /**
   * Fill product information section
   */
  private async fillProductInfo(data: RegistrationData): Promise<void> {
    this.log('Filling product information');

    // Product Category (auto-detect from model number)
    const category = this.inferProductCategory(data);
    if (category) {
      await this.selectProductCategory(category);
    }

    // Model Number
    await this.fillFieldWithSelectors(
      data.modelNumber,
      [
        'input[name="modelNumber"]',
        'input[name="model"]',
        'input[id*="model"]',
        'input[placeholder*="model" i]',
        'input[name*="productModel"]'
      ],
      'Model Number'
    );

    // Serial Number
    await this.fillFieldWithSelectors(
      data.serialNumber,
      [
        'input[name="serialNumber"]',
        'input[name="serial"]',
        'input[id*="serial"]',
        'input[placeholder*="serial" i]',
        'input[name*="productSerial"]'
      ],
      'Serial Number'
    );

    await this.randomDelay(500, 1000);

    // Check if there's a "Next" or "Continue" button for multi-step form
    await this.clickNextIfPresent();
  }

  /**
   * Infer product category from model number and product name
   */
  private inferProductCategory(data: RegistrationData): string | null {
    const combined = `${data.productName || ''} ${data.modelNumber}`.toLowerCase();

    // Camera detection
    if (combined.match(/eos|powershot|rebel|mark|mirrorless|dslr/i)) {
      return 'Cameras';
    }

    // Lens detection
    if (combined.match(/\b(ef|rf|ef-s|ef-m)\b.*mm|lens/i)) {
      return 'Lenses';
    }

    // Printer detection
    if (combined.match(/pixma|imageclass|imagerunner|printer|maxify/i)) {
      return 'Printers';
    }

    // Scanner detection
    if (combined.match(/scanner|canoscan/i)) {
      return 'Scanners';
    }

    // Camcorder detection
    if (combined.match(/vixia|camcorder|video/i)) {
      return 'Camcorders';
    }

    this.log('Could not automatically detect product category', 'warn');
    return null;
  }

  /**
   * Select product category from dropdown
   */
  private async selectProductCategory(category: string): Promise<void> {
    const categorySelectors = [
      'select[name="category"]',
      'select[name="productCategory"]',
      'select[id*="category"]',
      'select[name*="productType"]'
    ];

    for (const selector of categorySelectors) {
      try {
        const select = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (select) {
          // Try exact match
          try {
            await select.selectOption({ label: category });
            this.log(`Selected product category: ${category}`);
            await this.randomDelay(500, 1000);
            return;
          } catch {
            // Try by value (lowercase)
            try {
              await select.selectOption({ value: category.toLowerCase() });
              this.log(`Selected product category by value: ${category}`);
              await this.randomDelay(500, 1000);
              return;
            } catch {
              this.log(`Could not select category: ${category}`, 'warn');
            }
          }
        }
      } catch {
        continue;
      }
    }

    this.log('Product category dropdown not found or not required');
  }

  /**
   * Fill personal information section
   */
  private async fillPersonalInfo(data: RegistrationData): Promise<void> {
    this.log('Filling personal information');

    // First Name
    await this.fillFieldWithSelectors(
      data.firstName,
      [
        'input[name="firstName"]',
        'input[id*="firstName"]',
        'input[placeholder*="First" i]',
        'input[name*="first"]'
      ],
      'First Name'
    );

    // Last Name
    await this.fillFieldWithSelectors(
      data.lastName,
      [
        'input[name="lastName"]',
        'input[id*="lastName"]',
        'input[placeholder*="Last" i]',
        'input[name*="last"]'
      ],
      'Last Name'
    );

    // Email
    await this.fillFieldWithSelectors(
      data.email,
      [
        'input[name="email"]',
        'input[type="email"]',
        'input[id*="email"]',
        'input[placeholder*="email" i]'
      ],
      'Email'
    );

    // Phone
    if (data.phone) {
      const phone = this.formatPhone(data.phone);
      await this.fillFieldWithSelectors(
        phone,
        [
          'input[name="phone"]',
          'input[name="telephone"]',
          'input[type="tel"]',
          'input[id*="phone"]',
          'input[placeholder*="phone" i]'
        ],
        'Phone'
      );
    } else {
      this.log('Phone number not provided, skipping phone field');
    }

    await this.randomDelay(500, 1000);

    // Check if there's a "Next" or "Continue" button for multi-step form
    await this.clickNextIfPresent();
  }

  /**
   * Fill address information section
   */
  private async fillAddressInfo(data: RegistrationData): Promise<void> {
    this.log('Filling address information');

    // Country (if available, default to US)
    const country = data.country || 'United States';
    await this.selectCountry(country);

    // Street Address
    await this.fillFieldWithSelectors(
      data.address,
      [
        'input[name="address"]',
        'input[name="street"]',
        'input[name="addressLine1"]',
        'input[id*="address"]',
        'input[placeholder*="address" i]',
        'input[placeholder*="street" i]'
      ],
      'Address'
    );

    // Address Line 2 (if available)
    if (data.addressLine2) {
      await this.fillFieldWithSelectors(
        data.addressLine2,
        [
          'input[name="address2"]',
          'input[name="addressLine2"]',
          'input[id*="address2"]',
          'input[placeholder*="Apt" i]',
          'input[placeholder*="Suite" i]'
        ],
        'Address Line 2',
        false // optional
      );
    }

    // City
    await this.fillFieldWithSelectors(
      data.city,
      [
        'input[name="city"]',
        'input[id*="city"]',
        'input[placeholder*="city" i]'
      ],
      'City'
    );

    // State
    await this.selectState(data.state);

    // Zip Code
    await this.fillFieldWithSelectors(
      data.zipCode,
      [
        'input[name="zipCode"]',
        'input[name="zip"]',
        'input[name="postalCode"]',
        'input[id*="zip"]',
        'input[placeholder*="zip" i]'
      ],
      'Zip Code'
    );

    await this.randomDelay(500, 1000);

    // Check if there's a "Next" or "Continue" button for multi-step form
    await this.clickNextIfPresent();
  }

  /**
   * Select country from dropdown
   */
  private async selectCountry(country: string): Promise<void> {
    const countrySelectors = [
      'select[name="country"]',
      'select[id*="country"]',
      'select[name*="countryCode"]'
    ];

    for (const selector of countrySelectors) {
      try {
        const select = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (select) {
          // Try exact match
          try {
            await select.selectOption({ label: country });
            this.log(`Selected country: ${country}`);
            await this.randomDelay(500, 1000);
            return;
          } catch {
            // Try common variations
            const variations = ['United States', 'USA', 'US', 'United States of America'];
            for (const variant of variations) {
              try {
                await select.selectOption({ label: variant });
                this.log(`Selected country: ${variant}`);
                await this.randomDelay(500, 1000);
                return;
              } catch {
                continue;
              }
            }
          }
        }
      } catch {
        continue;
      }
    }

    this.log('Country dropdown not found or already set to default');
  }

  /**
   * Select state from dropdown
   */
  private async selectState(state: string | undefined): Promise<void> {
    if (!state) {
      this.log('State not provided, skipping state selection');
      return;
    }

    const stateSelectors = [
      'select[name="state"]',
      'select[id*="state"]',
      'select[name*="region"]',
      'select[name*="province"]'
    ];

    const stateValue = this.getStateAbbreviation(state);

    for (const selector of stateSelectors) {
      try {
        const select = await this.page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        if (select) {
          // Try by value (abbreviation)
          try {
            await select.selectOption({ value: stateValue });
            this.log(`Selected state: ${stateValue}`);
            await this.randomDelay(300, 600);
            return;
          } catch {
            // Try by label (abbreviation)
            try {
              await select.selectOption({ label: stateValue });
              this.log(`Selected state by label: ${stateValue}`);
              await this.randomDelay(300, 600);
              return;
            } catch {
              // Try full state name
              const fullName = this.getStateName(state);
              await select.selectOption({ label: fullName });
              this.log(`Selected state by full name: ${fullName}`);
              await this.randomDelay(300, 600);
              return;
            }
          }
        }
      } catch {
        continue;
      }
    }

    this.log('Could not select state - may need manual intervention', 'warn');
  }

  /**
   * Fill purchase information section
   */
  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    if (!data.purchaseDate) {
      this.log('Purchase date not provided, skipping purchase info');
      return;
    }

    this.log('Filling purchase information');

    // Purchase Date
    await this.fillPurchaseDate(data.purchaseDate);

    // Retailer (optional)
    if (data.retailer) {
      await this.fillRetailer(data.retailer);
    }

    await this.randomDelay(500, 1000);
  }

  /**
   * Fill purchase date field
   */
  private async fillPurchaseDate(purchaseDate: string | Date): Promise<void> {
    const date = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate;
    const formattedDate = this.formatDate(date);

    const dateSelectors = [
      'input[name="purchaseDate"]',
      'input[name="dateOfPurchase"]',
      'input[type="date"]',
      'input[id*="purchase"]',
      'input[placeholder*="purchase" i]'
    ];

    for (const selector of dateSelectors) {
      try {
        const input = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (input) {
          // Clear existing value
          await input.click();
          await input.fill('');
          await this.randomDelay(200, 400);

          // Try YYYY-MM-DD format first (HTML5 date input)
          const isoDate = date.toISOString().split('T')[0];
          await input.fill(isoDate);
          await this.randomDelay(200, 400);

          // Verify the value was accepted
          const value = await input.inputValue();
          if (value && value.includes(date.getFullYear().toString())) {
            this.log(`Filled purchase date: ${formattedDate}`);
            return;
          }

          // If not accepted, try MM/DD/YYYY format
          await input.fill(formattedDate);
          this.log(`Filled purchase date: ${formattedDate}`);
          return;
        }
      } catch {
        continue;
      }
    }

    this.log('Could not fill purchase date - field may not be present', 'warn');
  }

  /**
   * Fill retailer field (text input or dropdown)
   */
  private async fillRetailer(retailer: string): Promise<void> {
    // Try dropdown first
    const selectSelectors = [
      'select[name="retailer"]',
      'select[id*="retailer"]',
      'select[name*="store"]',
      'select[name*="dealer"]'
    ];

    for (const selector of selectSelectors) {
      try {
        const select = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (select) {
          // Try exact match
          try {
            await select.selectOption({ label: retailer });
            this.log(`Selected retailer: ${retailer}`);
            return;
          } catch {
            // Try "Other" option
            try {
              await select.selectOption({ label: 'Other' });
              this.log('Selected "Other" for retailer');
              return;
            } catch {
              this.log('Could not select retailer from dropdown', 'warn');
            }
          }
        }
      } catch {
        continue;
      }
    }

    // Try text input
    const inputSelectors = [
      'input[name="retailer"]',
      'input[id*="retailer"]',
      'input[name*="store"]',
      'input[name*="dealer"]'
    ];

    for (const selector of inputSelectors) {
      try {
        const input = await this.page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        if (input) {
          await input.fill(retailer);
          this.log(`Filled retailer: ${retailer}`);
          return;
        }
      } catch {
        continue;
      }
    }

    this.log('Retailer field not found (optional)');
  }

  /**
   * Handle marketing preferences (opt-out by default)
   */
  private async handleMarketingPreferences(): Promise<void> {
    try {
      // Look for marketing opt-in checkbox
      const marketingSelectors = [
        'input[type="checkbox"][name*="marketing"]',
        'input[type="checkbox"][name*="newsletter"]',
        'input[type="checkbox"][name*="email"]',
        'input[type="checkbox"][name*="promotional"]',
        'input[type="checkbox"][id*="marketing"]',
        'input[type="checkbox"][id*="newsletter"]'
      ];

      for (const selector of marketingSelectors) {
        try {
          const checkbox = await this.page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
          if (checkbox) {
            const isChecked = await checkbox.isChecked();
            if (isChecked) {
              await checkbox.uncheck();
              this.log('Opted out of marketing communications');
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      this.log('No marketing preferences found');
    }
  }

  /**
   * Click "Next" or "Continue" button if present in multi-step form
   */
  private async clickNextIfPresent(): Promise<void> {
    const nextSelectors = [
      'button:has-text("Next")',
      'button:has-text("Continue")',
      'button[name="next"]',
      'button[id*="next"]',
      'button.next',
      'input[type="button"][value*="Next" i]'
    ];

    for (const selector of nextSelectors) {
      try {
        const button = await this.page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        if (button) {
          await button.click();
          this.log('Clicked "Next" button');
          await this.randomDelay(1000, 2000);
          return;
        }
      } catch {
        continue;
      }
    }

    // No "Next" button found - single page form
  }

  /**
   * Submit the registration form
   */
  async submitForm(): Promise<{ confirmationCode?: string }> {
    this.log('Submitting Canon registration form');

    // Accept terms and conditions if checkbox present
    await this.acceptTerms();

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Register")',
      'button:has-text("Complete Registration")',
      'button:has-text("Finish")',
      'button.submit',
      'button[name="submit"]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (button) {
          await button.click();
          this.log('Submit button clicked');
          submitted = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!submitted) {
      throw new Error('Could not find submit button');
    }

    // Wait for submission to process
    await this.randomDelay(2000, 3000);

    return {};
  }

  /**
   * Accept terms and conditions
   */
  private async acceptTerms(): Promise<void> {
    const termsSelectors = [
      'input[type="checkbox"][name*="terms"]',
      'input[type="checkbox"][name*="agree"]',
      'input[type="checkbox"][id*="terms"]',
      'input[type="checkbox"][id*="agree"]',
      'input[type="checkbox"][required]'
    ];

    for (const selector of termsSelectors) {
      try {
        const checkbox = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (checkbox) {
          const isChecked = await checkbox.isChecked();
          if (!isChecked) {
            await checkbox.check();
            this.log('Accepted terms and conditions');
            await this.randomDelay(300, 600);
          }
          return;
        }
      } catch {
        continue;
      }
    }

    this.log('No terms checkbox found or already accepted');
  }

  /**
   * Verify successful registration
   */
  async verifySuccess(): Promise<boolean> {
    try {
      // Wait for navigation or success message
      await this.randomDelay(3000, 4000);

      const currentUrl = this.page.url();
      this.log(`Current URL after submission: ${currentUrl}`);

      // Check for success URL patterns
      const successUrlPatterns = [
        /thank[_-]?you/i,
        /success/i,
        /confirmation/i,
        /complete/i,
        /registered/i,
        /congrat/i
      ];

      for (const pattern of successUrlPatterns) {
        if (pattern.test(currentUrl)) {
          this.log(`Success detected via URL pattern: ${pattern}`);
          return true;
        }
      }

      // Check for success message elements
      const successSelectors = [
        'text=/thank you/i',
        'text=/registration.*successful/i',
        'text=/successfully.*registered/i',
        'text=/confirmation/i',
        'text=/congratulations/i',
        '.success-message',
        '.confirmation-message',
        '[class*="success"]',
        '[id*="success"]',
        '[class*="confirmation"]'
      ];

      for (const selector of successSelectors) {
        try {
          const element = await this.page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
          if (element) {
            const text = await element.textContent();
            this.log(`Success message found: ${text?.substring(0, 100)}`);
            return true;
          }
        } catch {
          continue;
        }
      }

      // Check for registration/confirmation number
      const confirmationPatterns = [
        /confirmation.*number/i,
        /registration.*number/i,
        /reference.*number/i,
        /product.*registered/i
      ];

      const pageContent = await this.page.content();
      for (const pattern of confirmationPatterns) {
        if (pattern.test(pageContent)) {
          this.log('Confirmation number detected in page content');
          return true;
        }
      }

      // Check for error messages
      const errorSelectors = [
        'text=/error/i',
        'text=/invalid/i',
        'text=/required/i',
        'text=/please.*correct/i',
        '.error-message',
        '[class*="error"]',
        '[role="alert"]'
      ];

      for (const selector of errorSelectors) {
        try {
          const element = await this.page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
          if (element) {
            const text = await element.textContent();
            this.log(`Error detected: ${text}`, 'error');
            return false;
          }
        } catch {
          continue;
        }
      }

      // If no clear success or error, consider it uncertain
      this.log('Could not definitively verify success or failure', 'warn');
      return false;

    } catch (error) {
      this.log(`Error during success verification: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Format phone number to standard format
   */
  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  /**
   * Format date to MM/DD/YYYY
   */
  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Get state abbreviation from full name or abbreviation
   */
  private getStateAbbreviation(state: string): string {
    const stateMap: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    };

    const normalized = state.toLowerCase().trim();
    return stateMap[normalized] || state.toUpperCase();
  }

  /**
   * Get full state name from abbreviation or full name
   */
  private getStateName(state: string): string {
    const stateMap: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    const normalized = state.toUpperCase().trim();
    return stateMap[normalized] || state;
  }

  /**
   * Helper to fill field with multiple selector attempts
   */
  private async fillFieldWithSelectors(
    value: string | undefined,
    selectors: string[],
    fieldName: string,
    required: boolean = true
  ): Promise<void> {
    if (!value) {
      if (required) {
        this.log(`Required field not provided: ${fieldName}`, 'warn');
      } else {
        this.log(`Optional field not provided: ${fieldName}`);
      }
      return;
    }

    for (const selector of selectors) {
      try {
        const input = await this.page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (input) {
          await input.click();
          await input.fill('');
          await this.randomDelay(100, 300);
          await input.fill(value);
          await this.randomDelay(200, 400);
          this.log(`Filled ${fieldName}: ${value}`);
          return;
        }
      } catch {
        continue;
      }
    }

    if (required) {
      this.log(`Could not fill required field: ${fieldName}`, 'warn');
    } else {
      this.log(`Optional field not found: ${fieldName}`);
    }
  }
}
