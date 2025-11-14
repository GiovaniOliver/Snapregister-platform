/**
 * GE Appliances Automation
 *
 * Handles warranty registration for GE Appliances products:
 * - Refrigerators (French Door, Side-by-Side, Top Freezer, Bottom Freezer)
 * - Ranges/Ovens (Gas, Electric, Dual Fuel, Wall Ovens, Cooktops)
 * - Dishwashers
 * - Washers & Dryers (Front Load, Top Load, Stackable)
 * - Microwaves (Countertop, Over-the-Range, Built-in)
 * - Small Appliances
 *
 * Includes GE, GE Profile, GE Café, Monogram, and Haier brands.
 *
 * @manufacturer GE Appliances
 * @automationType reliable
 * @lastUpdated 2025-11-12
 */

import { BaseAutomation, RegistrationData, AutomationResult } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class GEAutomation extends BaseAutomation {
  manufacturer = 'GE Appliances';
  automationType = 'reliable' as const;

  // GE Appliances product registration portal
  registrationUrl = 'https://www.geappliances.com/ge/service-and-support/product-registration/';

  requiredFields: (keyof RegistrationData)[] = [
    'firstName',
    'lastName',
    'email',
    'serialNumber',
    'modelNumber',
    'purchaseDate',
    'address',
    'city',
    'state',
    'zipCode'
  ];

  optionalFields: (keyof RegistrationData)[] = [
    'phone',
    'retailer'
  ];

  /**
   * Main form filling logic for GE registration
   */
  async fillForm(data: RegistrationData): Promise<void> {
    console.log('Starting GE Appliances warranty registration...');

    // Handle cookie consent banner
    await this.handleCookieConsent();

    // Navigate to registration page if not already there
    await this.navigateToRegistration();

    // Step 1: Enter product information
    await this.fillProductInfo(data);

    // Step 2: Fill personal information
    await this.fillPersonalInfo(data);

    // Step 3: Fill address information
    await this.fillAddressInfo(data);

    // Step 4: Fill purchase information
    await this.fillPurchaseInfo(data);

    // Step 5: Handle preferences (opt-out of marketing)
    await this.handleMarketingPreferences();

    console.log('GE Appliances form filled successfully');
  }

  /**
   * Navigate to registration page
   */
  private async navigateToRegistration(): Promise<void> {
    const currentUrl = this.page.url();

    // If not on registration page, navigate there
    if (!currentUrl.includes('register') && !currentUrl.includes('registration')) {
      await this.page.goto(this.registrationUrl, { waitUntil: 'networkidle' });
      console.log('Navigated to GE Appliances registration page');
    }

    // Wait for form to load
    await this.page.waitForLoadState('domcontentloaded');
    await this.randomDelay(1000, 2000);
  }

  /**
   * Handle cookie consent banner
   */
  private async handleCookieConsent(): Promise<void> {
    try {
      const cookieSelectors = [
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("Accept All Cookies")',
        'button:has-text("I Accept")',
        'button:has-text("OK")',
        '#onetrust-accept-btn-handler',
        '.accept-cookies',
        '[data-testid="accept-cookies"]',
        'button[id*="accept" i]'
      ];

      for (const selector of cookieSelectors) {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          console.log('Accepted cookie consent');
          await this.randomDelay(500, 1000);
          break;
        }
      }
    } catch (error) {
      console.log('No cookie consent banner found or already accepted');
    }
  }

  /**
   * Fill product information section
   */
  private async fillProductInfo(data: RegistrationData): Promise<void> {
    console.log('Filling product information...');

    // Model Number
    await this.fillWithFallback(
      [
        'input[name="modelNumber"]',
        'input[name="model"]',
        'input[name="productModel"]',
        'input[id*="model" i]',
        '#modelNumber',
        'input[placeholder*="model" i]'
      ],
      data.modelNumber!,
      'Model Number'
    );

    await this.randomDelay(500, 1000);

    // Serial Number
    await this.fillWithFallback(
      [
        'input[name="serialNumber"]',
        'input[name="serial"]',
        'input[id*="serial" i]',
        '#serialNumber',
        'input[placeholder*="serial" i]'
      ],
      data.serialNumber!,
      'Serial Number'
    );

    await this.randomDelay(500, 1000);

    // Wait for product validation
    await this.waitForProductValidation();

    console.log('Product information filled');
  }

  /**
   * Wait for product validation to complete
   */
  private async waitForProductValidation(): Promise<void> {
    try {
      // Look for loading indicators
      const loadingIndicators = [
        '.loading',
        '.spinner',
        '[data-loading="true"]',
        '.validating',
        'text=/validating/i',
        'text=/verifying/i'
      ];

      for (const selector of loadingIndicators) {
        const loading = this.page.locator(selector).first();
        if (await loading.isVisible({ timeout: 2000 })) {
          await loading.waitFor({ state: 'hidden', timeout: 15000 });
          console.log('Product validation completed');
          break;
        }
      }

      // Check for validation errors
      await this.checkForProductErrors();

      await this.randomDelay(1000, 1500);
    } catch (error) {
      console.log('Product validation check completed or not required');
    }
  }

  /**
   * Check for product validation errors
   */
  private async checkForProductErrors(): Promise<void> {
    const errorSelectors = [
      '.error-message',
      '.field-error',
      '[role="alert"]',
      '.validation-error',
      'text=/invalid.*model/i',
      'text=/invalid.*serial/i',
      'text=/product.*not found/i',
      'text=/not recognized/i'
    ];

    for (const selector of errorSelectors) {
      const error = this.page.locator(selector).first();
      if (await error.isVisible({ timeout: 2000 })) {
        const errorText = await error.textContent();
        throw new Error(`Product validation failed: ${errorText}`);
      }
    }
  }

  /**
   * Fill personal information section
   */
  private async fillPersonalInfo(data: RegistrationData): Promise<void> {
    console.log('Filling personal information...');

    // First Name
    await this.fillWithFallback(
      [
        'input[name="firstName"]',
        'input[name="firstname"]',
        'input[name="first_name"]',
        'input[id*="first" i]',
        '#firstName',
        'input[placeholder*="first name" i]'
      ],
      data.firstName,
      'First Name'
    );

    await this.randomDelay(300, 700);

    // Last Name
    await this.fillWithFallback(
      [
        'input[name="lastName"]',
        'input[name="lastname"]',
        'input[name="last_name"]',
        'input[id*="last" i]',
        '#lastName',
        'input[placeholder*="last name" i]'
      ],
      data.lastName,
      'Last Name'
    );

    await this.randomDelay(300, 700);

    // Email
    await this.fillWithFallback(
      [
        'input[name="email"]',
        'input[name="emailAddress"]',
        'input[type="email"]',
        'input[id*="email" i]',
        '#email'
      ],
      data.email,
      'Email'
    );

    await this.randomDelay(300, 700);

    // Email Confirmation (if present)
    await this.fillEmailConfirmation(data.email);

    // Phone (optional)
    if (data.phone) {
      await this.fillWithFallback(
        [
          'input[name="phone"]',
          'input[name="phoneNumber"]',
          'input[type="tel"]',
          'input[id*="phone" i]',
          '#phone'
        ],
        data.phone,
        'Phone',
        true
      );

      await this.randomDelay(300, 700);
    }

    console.log('Personal information filled');
  }

  /**
   * Fill email confirmation field if present
   */
  private async fillEmailConfirmation(email: string): Promise<void> {
    try {
      const confirmSelectors = [
        'input[name="confirmEmail"]',
        'input[name="emailConfirmation"]',
        'input[name="confirm_email"]',
        'input[id*="confirm" i][id*="email" i]',
        '#confirmEmail'
      ];

      for (const selector of confirmSelectors) {
        const field = this.page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill(email);
          console.log('Filled email confirmation');
          await this.randomDelay(300, 700);
          break;
        }
      }
    } catch (error) {
      console.log('No email confirmation field found');
    }
  }

  /**
   * Fill address information section
   */
  private async fillAddressInfo(data: RegistrationData): Promise<void> {
    console.log('Filling address information...');

    // Address Line 1
    await this.fillWithFallback(
      [
        'input[name="address"]',
        'input[name="address1"]',
        'input[name="streetAddress"]',
        'input[id*="address" i]',
        '#address',
        'input[placeholder*="address" i]'
      ],
      data.address!,
      'Address'
    );

    await this.randomDelay(300, 700);

    // Address Line 2 (optional)
    if (data.addressLine2) {
      await this.fillWithFallback(
        [
          'input[name="address2"]',
          'input[name="addressLine2"]',
          'input[id*="address2" i]',
          '#address2'
        ],
        data.addressLine2,
        'Address Line 2',
        true
      );

      await this.randomDelay(300, 700);
    }

    // City
    await this.fillWithFallback(
      [
        'input[name="city"]',
        'input[id*="city" i]',
        '#city',
        'input[placeholder*="city" i]'
      ],
      data.city!,
      'City'
    );

    await this.randomDelay(300, 700);

    // State
    await this.fillState(data.state!);

    await this.randomDelay(300, 700);

    // ZIP Code
    await this.fillWithFallback(
      [
        'input[name="zipCode"]',
        'input[name="zip"]',
        'input[name="postalCode"]',
        'input[id*="zip" i]',
        '#zipCode',
        'input[placeholder*="zip" i]'
      ],
      data.zipCode!,
      'ZIP Code'
    );

    await this.randomDelay(500, 1000);

    console.log('Address information filled');
  }

  /**
   * Fill state field (handles both select and input)
   */
  private async fillState(state: string): Promise<void> {
    // Try select dropdown first
    const stateSelects = [
      'select[name="state"]',
      'select[id*="state" i]',
      '#state'
    ];

    for (const selector of stateSelects) {
      const select = this.page.locator(selector).first();
      if (await select.isVisible({ timeout: 2000 })) {
        // Try both full name and abbreviation
        const stateOptions = [
          state,
          this.getStateAbbreviation(state),
          this.getStateName(state)
        ];

        for (const option of stateOptions) {
          try {
            await select.selectOption({ label: option });
            console.log(`Selected state: ${option}`);
            return;
          } catch {
            continue;
          }
        }
      }
    }

    // Fall back to text input
    await this.fillWithFallback(
      [
        'input[name="state"]',
        'input[id*="state" i]',
        '#state',
        'input[placeholder*="state" i]'
      ],
      state,
      'State'
    );
  }

  /**
   * Fill purchase information section
   */
  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    console.log('Filling purchase information...');

    // Purchase Date (required for GE)
    if (data.purchaseDate) {
      await this.fillPurchaseDate(data.purchaseDate);
      await this.randomDelay(300, 700);
    }

    // Retailer/Store (optional)
    if (data.retailer) {
      await this.fillRetailer(data.retailer);
      await this.randomDelay(300, 700);
    }

    console.log('Purchase information filled');
  }

  /**
   * Fill purchase date field
   */
  private async fillPurchaseDate(purchaseDate: string): Promise<void> {
    try {
      const dateSelectors = [
        'input[name="purchaseDate"]',
        'input[name="dateOfPurchase"]',
        'input[name="purchase_date"]',
        'input[type="date"]',
        'input[id*="purchase" i][id*="date" i]',
        '#purchaseDate'
      ];

      for (const selector of dateSelectors) {
        const field = this.page.locator(selector).first();
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill(purchaseDate);
          console.log(`Filled purchase date: ${purchaseDate}`);
          return;
        }
      }

      // Handle split date fields (month/day/year)
      await this.handleSplitDateFields(purchaseDate);
    } catch (error) {
      console.log('Could not fill purchase date');
    }
  }

  /**
   * Handle split date fields (month, day, year separately)
   */
  private async handleSplitDateFields(dateString: string): Promise<void> {
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString();
      const day = date.getDate().toString();
      const year = date.getFullYear().toString();

      // Month field
      const monthField = this.page.locator('select[name*="month" i], input[name*="month" i]').first();
      if (await monthField.isVisible({ timeout: 1000 })) {
        const tagName = await monthField.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await monthField.selectOption({ label: month });
        } else {
          await monthField.fill(month);
        }
      }

      // Day field
      const dayField = this.page.locator('select[name*="day" i], input[name*="day" i]').first();
      if (await dayField.isVisible({ timeout: 1000 })) {
        const tagName = await dayField.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await dayField.selectOption({ label: day });
        } else {
          await dayField.fill(day);
        }
      }

      // Year field
      const yearField = this.page.locator('select[name*="year" i], input[name*="year" i]').first();
      if (await yearField.isVisible({ timeout: 1000 })) {
        const tagName = await yearField.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await yearField.selectOption({ label: year });
        } else {
          await yearField.fill(year);
        }
      }

      console.log('Filled split date fields');
    } catch (error) {
      console.log('No split date fields found');
    }
  }

  /**
   * Fill retailer field
   */
  private async fillRetailer(retailer: string): Promise<void> {
    try {
      // Check for retailer dropdown first
      const retailerDropdowns = [
        'select[name*="retailer" i]',
        'select[name*="store" i]',
        'select[id*="retailer" i]',
        'select[id*="store" i]'
      ];

      for (const selector of retailerDropdowns) {
        const select = this.page.locator(selector).first();
        if (await select.isVisible({ timeout: 2000 })) {
          // Try to select the retailer
          try {
            await select.selectOption({ label: retailer });
            console.log(`Selected retailer from dropdown: ${retailer}`);
            return;
          } catch {
            // If exact match fails, try "Other"
            try {
              await select.selectOption({ label: 'Other' });
              console.log('Selected "Other" for retailer');
            } catch {
              console.log('Could not select retailer from dropdown');
            }
          }
        }
      }

      // Fall back to text input
      await this.fillWithFallback(
        [
          'input[name="retailer"]',
          'input[name="store"]',
          'input[name="dealer"]',
          'input[id*="retailer" i]',
          'input[id*="store" i]',
          '#retailer',
          'input[placeholder*="retailer" i]'
        ],
        retailer,
        'Retailer',
        true
      );
    } catch (error) {
      console.log('Could not fill retailer field');
    }
  }

  /**
   * Handle marketing preferences (opt-out by default)
   */
  private async handleMarketingPreferences(): Promise<void> {
    try {
      const marketingSelectors = [
        'input[type="checkbox"][name*="marketing" i]',
        'input[type="checkbox"][name*="newsletter" i]',
        'input[type="checkbox"][name*="promotional" i]',
        'input[type="checkbox"][name*="offers" i]',
        'input[type="checkbox"][id*="marketing" i]',
        'input[type="checkbox"][id*="newsletter" i]'
      ];

      for (const selector of marketingSelectors) {
        const checkboxes = await this.page.locator(selector).all();
        for (const checkbox of checkboxes) {
          if (await checkbox.isVisible() && await checkbox.isChecked()) {
            await checkbox.uncheck();
            console.log('Unchecked marketing preference');
            await this.randomDelay(200, 500);
          }
        }
      }
    } catch (error) {
      console.log('No marketing preferences found or already unchecked');
    }
  }

  /**
   * Submit the registration form
   */
  async submitForm(): Promise<{ confirmationCode?: string }> {
    console.log('Submitting GE Appliances registration form...');

    // Take screenshot before submission
    await this.page.screenshot({
      path: `./screenshots/ge-before-submit-${Date.now()}.png`,
      fullPage: true
    });

    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Register")',
      'button:has-text("Complete Registration")',
      'button:has-text("Register Product")',
      '[data-testid="submit"]',
      '#submit',
      '.submit-button'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        console.log('Clicked submit button');
        submitted = true;
        break;
      }
    }

    if (!submitted) {
      throw new Error('Could not find submit button');
    }

    // Wait for submission to process
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.randomDelay(2000, 3000);

    // Take screenshot after submission
    await this.page.screenshot({
      path: `./screenshots/ge-after-submit-${Date.now()}.png`,
      fullPage: true
    });

    // Look for confirmation code
    const confirmationCode = await this.extractConfirmationCode();

    return { confirmationCode };
  }

  /**
   * Extract confirmation code from success page
   */
  private async extractConfirmationCode(): Promise<string | undefined> {
    try {
      const codeSelectors = [
        '.confirmation-code',
        '.confirmation-number',
        '.registration-number',
        '[data-testid="confirmation-code"]',
        '#confirmationCode',
        'text=/confirmation.*code.*[A-Z0-9-]+/i',
        'text=/registration.*number.*[A-Z0-9-]+/i',
        'text=/reference.*[A-Z0-9-]+/i'
      ];

      for (const selector of codeSelectors) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          const text = await element.textContent();
          const codeMatch = text?.match(/[A-Z0-9]{6,}/);
          if (codeMatch) {
            console.log(`Found confirmation code: ${codeMatch[0]}`);
            return codeMatch[0];
          }
        }
      }
    } catch (error) {
      console.log('Could not extract confirmation code');
    }

    return undefined;
  }

  /**
   * Verify successful registration
   */
  async verifySuccess(): Promise<boolean> {
    console.log('Verifying GE Appliances registration success...');

    const currentUrl = this.page.url();
    const pageContent = await this.page.content();

    // Check URL for success indicators
    const successUrlPatterns = [
      /confirmation/i,
      /success/i,
      /thank.*you/i,
      /complete/i,
      /registered/i
    ];

    for (const pattern of successUrlPatterns) {
      if (pattern.test(currentUrl)) {
        console.log('Success detected in URL');
        return true;
      }
    }

    // Check page content for success messages
    const successSelectors = [
      'text=/thank you.*registration/i',
      'text=/successfully registered/i',
      'text=/registration.*complete/i',
      'text=/product.*registered/i',
      'text=/confirmation/i',
      '.success-message',
      '.confirmation-message',
      '[data-testid="success"]',
      'h1:has-text("Success")',
      'h1:has-text("Thank You")',
      'h2:has-text("Registration Complete")'
    ];

    for (const selector of successSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        console.log('Success message found on page');
        return true;
      }
    }

    // Check for "already registered" message (also considered success)
    const alreadyRegisteredSelectors = [
      'text=/already registered/i',
      'text=/product.*already.*registered/i',
      'text=/duplicate.*registration/i'
    ];

    for (const selector of alreadyRegisteredSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        console.log('Product already registered (considered success)');
        return true;
      }
    }

    // Check for error messages (indicates failure)
    const errorSelectors = [
      '.error-message',
      '[role="alert"]',
      'text=/error occurred/i',
      'text=/failed/i',
      'text=/invalid/i'
    ];

    for (const selector of errorSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        const errorText = await element.textContent();
        console.error(`Error detected: ${errorText}`);
        return false;
      }
    }

    // If we reached here, look for any positive indicators in page text
    const successKeywords = [
      'successfully',
      'confirmation',
      'registered',
      'thank you',
      'complete'
    ];

    const hasSuccessKeyword = successKeywords.some(keyword =>
      pageContent.toLowerCase().includes(keyword)
    );

    if (hasSuccessKeyword) {
      console.log('Success keywords found in page content');
      return true;
    }

    console.warn('Could not definitively verify success or failure');
    return false;
  }

  /**
   * Get state abbreviation from full name
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

    return stateMap[state.toLowerCase()] || state;
  }

  /**
   * Get full state name from abbreviation
   */
  private getStateName(abbr: string): string {
    const nameMap: Record<string, string> = {
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

    return nameMap[abbr.toUpperCase()] || abbr;
  }
}
