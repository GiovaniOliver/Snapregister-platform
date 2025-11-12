/**
 * Bosch Home Appliances Automation
 *
 * Handles warranty registration for Bosch premium appliance brands:
 * - Bosch (main brand)
 * - Thermador (luxury brand)
 * - Gaggenau (ultra-luxury brand)
 *
 * Registration URL: https://www.bosch-home.com/us/customer-service/product-registration
 *
 * RELIABILITY: Reliable
 * - Standard form-based registration
 * - Clear field identification
 * - Consistent success confirmation
 * - No CAPTCHA observed
 *
 * KEY FEATURES:
 * - Multi-brand support (Bosch, Thermador, Gaggenau)
 * - Model number validation
 * - Serial number format validation (typically E-Nr format)
 * - Purchase date validation
 * - Optional retailer information
 * - Marketing preferences opt-out
 *
 * REQUIRED FIELDS:
 * - First Name, Last Name
 * - Email
 * - Phone
 * - Model Number (E-Nr)
 * - Serial Number (FD/Ser.No.)
 * - Purchase Date
 * - Address, City, State, Zip
 *
 * FORM BEHAVIOR:
 * - Standard HTML form with text inputs
 * - Dropdown for state selection
 * - Date picker for purchase date
 * - Optional retailer dropdown
 * - Checkbox for terms acceptance
 * - Marketing opt-in checkbox (unchecked by default)
 *
 * SUCCESS INDICATORS:
 * - Redirect to confirmation page
 * - "Thank you" or "Registration successful" message
 * - Confirmation number displayed
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
import { RegistrationData, AutomationResult } from '../types';

export class BoschAutomation extends BaseAutomation {
  manufacturer = 'Bosch';
  automationType = 'reliable' as const;
  registrationUrl = 'https://www.bosch-home.com/us/customer-service/product-registration';

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
    'zipCode'
  ];

  /**
   * Fill out the Bosch registration form
   */
  async fillForm(page: Page, data: RegistrationData): Promise<void> {
    this.log('Starting Bosch form fill process');

    // Wait for form to load
    await this.waitForForm(page);

    // Handle cookie consent if present
    await this.handleCookieConsent(page);

    // Personal Information Section
    await this.fillPersonalInfo(page, data);

    // Product Information Section
    await this.fillProductInfo(page, data);

    // Address Information Section
    await this.fillAddressInfo(page, data);

    // Purchase Information Section
    await this.fillPurchaseInfo(page, data);

    // Handle marketing preferences (opt-out by default)
    await this.handleMarketingPreferences(page);

    this.log('Form filling completed');
  }

  /**
   * Wait for the registration form to be ready
   */
  private async waitForForm(page: Page): Promise<void> {
    try {
      // Wait for main form element
      await page.waitForSelector('form[name="registration"], form[id*="registration"], form.registration-form', {
        timeout: 15000,
        state: 'visible'
      });

      this.log('Registration form loaded');

      // Wait a bit for dynamic content
      await this.randomDelay(1000, 2000);
    } catch (error) {
      throw new Error('Registration form did not load properly');
    }
  }

  /**
   * Handle cookie consent banner if present
   */
  private async handleCookieConsent(page: Page): Promise<void> {
    try {
      const consentSelectors = [
        'button[id*="accept"]',
        'button[id*="consent"]',
        'button.cookie-accept',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Accept")',
        '#onetrust-accept-btn-handler'
      ];

      for (const selector of consentSelectors) {
        try {
          const button = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
   * Fill personal information section
   */
  private async fillPersonalInfo(page: Page, data: RegistrationData): Promise<void> {
    this.log('Filling personal information');

    // First Name
    await this.fillFieldWithSelectors(
      page,
      data.firstName,
      [
        'input[name="firstName"]',
        'input[id*="firstName"]',
        'input[placeholder*="First"]',
        'input[name*="first"]'
      ],
      'First Name'
    );

    // Last Name
    await this.fillFieldWithSelectors(
      page,
      data.lastName,
      [
        'input[name="lastName"]',
        'input[id*="lastName"]',
        'input[placeholder*="Last"]',
        'input[name*="last"]'
      ],
      'Last Name'
    );

    // Email
    await this.fillFieldWithSelectors(
      page,
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
    const phone = this.formatPhone(data.phone);
    await this.fillFieldWithSelectors(
      page,
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

    await this.randomDelay(500, 1000);
  }

  /**
   * Fill product information section
   */
  private async fillProductInfo(page: Page, data: RegistrationData): Promise<void> {
    this.log('Filling product information');

    // Model Number (E-Nr)
    await this.fillFieldWithSelectors(
      page,
      data.modelNumber,
      [
        'input[name="modelNumber"]',
        'input[name="model"]',
        'input[id*="model"]',
        'input[placeholder*="model" i]',
        'input[placeholder*="E-Nr" i]',
        'input[name*="enr"]'
      ],
      'Model Number'
    );

    // Serial Number (FD/Ser.No.)
    await this.fillFieldWithSelectors(
      page,
      data.serialNumber,
      [
        'input[name="serialNumber"]',
        'input[name="serial"]',
        'input[id*="serial"]',
        'input[placeholder*="serial" i]',
        'input[placeholder*="FD" i]',
        'input[name*="fd"]'
      ],
      'Serial Number'
    );

    await this.randomDelay(500, 1000);
  }

  /**
   * Fill address information section
   */
  private async fillAddressInfo(page: Page, data: RegistrationData): Promise<void> {
    this.log('Filling address information');

    // Street Address
    await this.fillFieldWithSelectors(
      page,
      data.address,
      [
        'input[name="address"]',
        'input[name="street"]',
        'input[id*="address"]',
        'input[placeholder*="address" i]',
        'input[placeholder*="street" i]'
      ],
      'Address'
    );

    // Address Line 2 (if available)
    if (data.addressLine2) {
      await this.fillFieldWithSelectors(
        page,
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
      page,
      data.city,
      [
        'input[name="city"]',
        'input[id*="city"]',
        'input[placeholder*="city" i]'
      ],
      'City'
    );

    // State
    await this.selectState(page, data.state);

    // Zip Code
    await this.fillFieldWithSelectors(
      page,
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
  }

  /**
   * Select state from dropdown
   */
  private async selectState(page: Page, state: string): Promise<void> {
    const stateSelectors = [
      'select[name="state"]',
      'select[id*="state"]',
      'select[name*="region"]'
    ];

    const stateValue = this.getStateAbbreviation(state);

    for (const selector of stateSelectors) {
      try {
        const select = await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        if (select) {
          // Try by value
          try {
            await select.selectOption({ value: stateValue });
            this.log(`Selected state: ${stateValue}`);
            return;
          } catch {
            // Try by label
            try {
              await select.selectOption({ label: stateValue });
              this.log(`Selected state by label: ${stateValue}`);
              return;
            } catch {
              // Try full state name
              const fullName = this.getStateName(state);
              await select.selectOption({ label: fullName });
              this.log(`Selected state by full name: ${fullName}`);
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
  private async fillPurchaseInfo(page: Page, data: RegistrationData): Promise<void> {
    if (!data.purchaseDate) {
      this.log('Purchase date not provided, skipping purchase info');
      return;
    }

    this.log('Filling purchase information');

    // Purchase Date
    await this.fillPurchaseDate(page, data.purchaseDate);

    // Retailer (optional)
    if (data.retailer) {
      await this.selectRetailer(page, data.retailer);
    }

    await this.randomDelay(500, 1000);
  }

  /**
   * Fill purchase date field
   */
  private async fillPurchaseDate(page: Page, purchaseDate: string | Date): Promise<void> {
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
        const input = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
   * Select retailer from dropdown if available
   */
  private async selectRetailer(page: Page, retailer: string): Promise<void> {
    const retailerSelectors = [
      'select[name="retailer"]',
      'select[id*="retailer"]',
      'select[name*="store"]'
    ];

    for (const selector of retailerSelectors) {
      try {
        const select = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
              this.log('Could not select retailer', 'warn');
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  /**
   * Handle marketing preferences (opt-out by default)
   */
  private async handleMarketingPreferences(page: Page): Promise<void> {
    try {
      // Look for marketing opt-in checkbox
      const marketingSelectors = [
        'input[type="checkbox"][name*="marketing"]',
        'input[type="checkbox"][name*="newsletter"]',
        'input[type="checkbox"][name*="email"]',
        'input[type="checkbox"][id*="marketing"]',
        'input[type="checkbox"][id*="newsletter"]'
      ];

      for (const selector of marketingSelectors) {
        try {
          const checkbox = await page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
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
   * Submit the registration form
   */
  async submitForm(page: Page): Promise<void> {
    this.log('Submitting Bosch registration form');

    // Accept terms and conditions if checkbox present
    await this.acceptTerms(page);

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Register")',
      'button:has-text("Complete Registration")',
      'button.submit',
      'button[name="submit"]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
  }

  /**
   * Accept terms and conditions
   */
  private async acceptTerms(page: Page): Promise<void> {
    const termsSelectors = [
      'input[type="checkbox"][name*="terms"]',
      'input[type="checkbox"][name*="agree"]',
      'input[type="checkbox"][id*="terms"]',
      'input[type="checkbox"][id*="agree"]',
      'input[type="checkbox"][required]'
    ];

    for (const selector of termsSelectors) {
      try {
        const checkbox = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
  async verifySuccess(page: Page): Promise<boolean> {
    try {
      // Wait for navigation or success message
      await this.randomDelay(3000, 4000);

      const currentUrl = page.url();
      this.log(`Current URL after submission: ${currentUrl}`);

      // Check for success URL patterns
      const successUrlPatterns = [
        /thank[_-]?you/i,
        /success/i,
        /confirmation/i,
        /complete/i,
        /registered/i
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
        '.success-message',
        '.confirmation-message',
        '[class*="success"]',
        '[id*="success"]'
      ];

      for (const selector of successSelectors) {
        try {
          const element = await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
          if (element) {
            const text = await element.textContent();
            this.log(`Success message found: ${text?.substring(0, 100)}`);
            return true;
          }
        } catch {
          continue;
        }
      }

      // Check for confirmation number
      const confirmationPatterns = [
        /confirmation.*number/i,
        /reference.*number/i,
        /registration.*number/i
      ];

      const pageContent = await page.content();
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
        '.error-message',
        '[class*="error"]',
        '[role="alert"]'
      ];

      for (const selector of errorSelectors) {
        try {
          const element = await page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
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
    page: Page,
    value: string,
    selectors: string[],
    fieldName: string,
    required: boolean = true
  ): Promise<void> {
    for (const selector of selectors) {
      try {
        const input = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
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
