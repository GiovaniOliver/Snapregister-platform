/**
 * Dell Automation
 *
 * Handles warranty registration for Dell products:
 * - Laptops (XPS, Inspiron, Latitude, Alienware, Precision)
 * - Desktops (OptiPlex, Vostro, XPS, Alienware, Precision)
 * - Monitors
 * - Servers and Workstations
 * - Accessories
 *
 * Dell uses Service Tags for product identification.
 *
 * @manufacturer Dell
 * @automationType reliable
 * @lastUpdated 2025-11-12
 */

import { BaseAutomation, RegistrationData, AutomationResult } from '../core/BaseAutomation';
import { Page } from 'playwright';

export class DellAutomation extends BaseAutomation {
  manufacturer = 'Dell';
  automationType = 'reliable' as const;

  // Dell product registration portal
  registrationUrl = 'https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/locate-service-tag/register-product';

  requiredFields: (keyof RegistrationData)[] = [
    'firstName',
    'lastName',
    'email',
    'serialNumber', // Dell Service Tag
    'address',
    'city',
    'state',
    'zipCode',
    'country'
  ];

  optionalFields: (keyof RegistrationData)[] = [
    'phone',
    'companyName',
    'purchaseDate'
  ];

  /**
   * Main form filling logic for Dell registration
   */
  async fillForm(data: RegistrationData): Promise<void> {
    console.log('Starting Dell warranty registration...');

    // Handle cookie consent banner
    await this.handleCookieConsent();

    // Navigate to registration page if not already there
    await this.navigateToRegistration();

    // Check if user is logged in (Dell may require account)
    await this.handleAccountRequirement(data);

    // Step 1: Enter Service Tag to find product
    await this.enterServiceTag(data);

    // Step 2: Verify product details
    await this.verifyProductDetails();

    // Step 3: Fill personal information
    await this.fillPersonalInfo(data);

    // Step 4: Fill address information
    await this.fillAddressInfo(data);

    // Step 5: Fill company information (if applicable)
    await this.fillCompanyInfo(data);

    // Step 6: Fill purchase information
    await this.fillPurchaseInfo(data);

    // Step 7: Handle preferences (opt-out of marketing)
    await this.handleMarketingPreferences();

    console.log('Dell form filled successfully');
  }

  /**
   * Navigate to registration page
   */
  private async navigateToRegistration(): Promise<void> {
    const currentUrl = this.page.url();

    // If not on registration page, navigate there
    if (!currentUrl.includes('register') && !currentUrl.includes('product-registration')) {
      await this.page.goto(this.registrationUrl, { waitUntil: 'networkidle' });
      console.log('Navigated to Dell registration page');
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
        '#accept-all-cookies',
        '.accept-cookies-button',
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
   * Handle Dell account requirement
   * Dell may require users to log in or allow guest registration
   */
  private async handleAccountRequirement(data: RegistrationData): Promise<void> {
    try {
      // Check if login page is shown
      const loginIndicators = [
        'text=/sign in/i',
        'text=/log in/i',
        'input[type="password"]',
        'button:has-text("Sign In")',
        'button:has-text("Log In")'
      ];

      let isLoginPage = false;
      for (const selector of loginIndicators) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          isLoginPage = true;
          break;
        }
      }

      if (isLoginPage) {
        // Look for guest registration option
        const guestSelectors = [
          'text=/continue.*guest/i',
          'text=/register.*guest/i',
          'text=/skip.*sign in/i',
          'button:has-text("Continue without signing in")',
          'a:has-text("Register without account")',
          '#guest-checkout',
          '.guest-registration'
        ];

        let foundGuestOption = false;
        for (const selector of guestSelectors) {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click();
            console.log('Selected guest registration option');
            await this.page.waitForLoadState('networkidle');
            foundGuestOption = true;
            break;
          }
        }

        if (!foundGuestOption) {
          throw new Error('Dell account required - cannot proceed with guest registration. Please log in manually or create a Dell account first.');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Dell account required')) {
        throw error;
      }
      console.log('No account requirement detected or already handled');
    }
  }

  /**
   * Enter Dell Service Tag to identify product
   */
  private async enterServiceTag(data: RegistrationData): Promise<void> {
    console.log('Entering Dell Service Tag...');

    // Dell uses "Service Tag" instead of serial number
    const serviceTag = data.serialNumber!;

    // Look for Service Tag input field
    const serviceTagSelectors = [
      'input[name="serviceTag"]',
      'input[name="servicetag"]',
      'input[id*="service" i][id*="tag" i]',
      'input[placeholder*="service tag" i]',
      'input[placeholder*="servicetag" i]',
      '#serviceTag',
      '#servicetag',
      'input[aria-label*="service tag" i]'
    ];

    let filled = false;
    for (const selector of serviceTagSelectors) {
      const field = this.page.locator(selector).first();
      if (await field.isVisible({ timeout: 3000 })) {
        await field.fill(serviceTag);
        console.log(`Filled Service Tag: ${serviceTag}`);
        filled = true;
        await this.randomDelay(500, 1000);
        break;
      }
    }

    if (!filled) {
      // Try generic serial number fields
      await this.fillWithFallback(
        [
          'input[name="serialNumber"]',
          'input[name="serial"]',
          'input[id*="serial" i]',
          '#serialNumber'
        ],
        serviceTag,
        'Service Tag'
      );
    }

    // Look for submit/search button to validate Service Tag
    await this.submitServiceTag();

    // Wait for product information to load
    await this.waitForProductValidation();
  }

  /**
   * Submit Service Tag for validation
   */
  private async submitServiceTag(): Promise<void> {
    try {
      const submitSelectors = [
        'button:has-text("Search")',
        'button:has-text("Find")',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button[type="submit"]',
        'button:has-text("Validate")',
        'button:has-text("Look Up")',
        'input[type="submit"]'
      ];

      for (const selector of submitSelectors) {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log('Submitted Service Tag for validation');
          await this.randomDelay(1000, 2000);
          break;
        }
      }
    } catch (error) {
      console.log('No submit button found or auto-validation in progress');
    }
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
        'text=/loading/i'
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
      await this.checkForServiceTagErrors();

      await this.randomDelay(1000, 1500);
    } catch (error) {
      console.log('Product validation check completed or not required');
    }
  }

  /**
   * Check for Service Tag validation errors
   */
  private async checkForServiceTagErrors(): Promise<void> {
    const errorSelectors = [
      '.error-message',
      '.field-error',
      '[role="alert"]',
      '.validation-error',
      'text=/invalid.*service tag/i',
      'text=/service tag.*not found/i',
      'text=/cannot find.*product/i',
      'text=/not recognized/i',
      'text=/does not exist/i'
    ];

    for (const selector of errorSelectors) {
      const error = this.page.locator(selector).first();
      if (await error.isVisible({ timeout: 2000 })) {
        const errorText = await error.textContent();
        throw new Error(`Service Tag validation failed: ${errorText}`);
      }
    }
  }

  /**
   * Verify product details loaded correctly
   */
  private async verifyProductDetails(): Promise<void> {
    console.log('Verifying product details...');

    try {
      // Look for product information display
      const productInfoSelectors = [
        '.product-details',
        '.product-information',
        '[data-testid="product-info"]',
        'text=/product name/i',
        'text=/model/i',
        'text=/warranty/i'
      ];

      let foundProductInfo = false;
      for (const selector of productInfoSelectors) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log('Product details loaded successfully');
          foundProductInfo = true;
          break;
        }
      }

      if (!foundProductInfo) {
        console.warn('Could not verify product details display');
      }

      await this.randomDelay(1000, 1500);
    } catch (error) {
      console.log('Product details verification skipped or not required');
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
        'input[name="email_address"]',
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
          'input[name="phone_number"]',
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

    // Country (required for Dell)
    await this.fillCountry(data.country || 'United States');

    await this.randomDelay(500, 1000);

    // Address Line 1
    await this.fillWithFallback(
      [
        'input[name="address"]',
        'input[name="address1"]',
        'input[name="addressLine1"]',
        'input[name="streetAddress"]',
        'input[name="street_address"]',
        'input[id*="address" i]',
        '#address',
        '#address1',
        'input[placeholder*="address" i]'
      ],
      data.address!,
      'Address'
    );

    await this.randomDelay(300, 700);

    // Address Line 2 (optional)
    if (data.address2) {
      await this.fillWithFallback(
        [
          'input[name="address2"]',
          'input[name="addressLine2"]',
          'input[id*="address2" i]',
          '#address2'
        ],
        data.address2,
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
        'input[name="postal_code"]',
        'input[id*="zip" i]',
        'input[id*="postal" i]',
        '#zipCode',
        '#zip',
        'input[placeholder*="zip" i]',
        'input[placeholder*="postal" i]'
      ],
      data.zipCode!,
      'ZIP Code'
    );

    await this.randomDelay(500, 1000);

    console.log('Address information filled');
  }

  /**
   * Fill country field
   */
  private async fillCountry(country: string): Promise<void> {
    try {
      const countrySelectors = [
        'select[name="country"]',
        'select[name="countryCode"]',
        'select[id*="country" i]',
        '#country'
      ];

      for (const selector of countrySelectors) {
        const select = this.page.locator(selector).first();
        if (await select.isVisible({ timeout: 2000 })) {
          // Try different country formats
          const countryOptions = [
            country,
            'United States',
            'US',
            'USA',
            'United States of America'
          ];

          for (const option of countryOptions) {
            try {
              await select.selectOption({ label: option });
              console.log(`Selected country: ${option}`);
              await this.randomDelay(500, 1000);
              return;
            } catch {
              continue;
            }
          }
          break;
        }
      }
    } catch (error) {
      console.log('No country field found or not required');
    }
  }

  /**
   * Fill state field (handles both select and input)
   */
  private async fillState(state: string): Promise<void> {
    // Try select dropdown first
    const stateSelects = [
      'select[name="state"]',
      'select[name="stateCode"]',
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
   * Fill company information section (if present)
   */
  private async fillCompanyInfo(data: RegistrationData): Promise<void> {
    if (!data.companyName) {
      return;
    }

    console.log('Filling company information...');

    try {
      // Check if this is a business registration
      const businessCheckbox = this.page.locator(
        'input[type="checkbox"][name*="business" i], input[type="checkbox"][id*="business" i]'
      ).first();

      if (await businessCheckbox.isVisible({ timeout: 2000 })) {
        if (!(await businessCheckbox.isChecked())) {
          await businessCheckbox.check();
          console.log('Selected business registration');
          await this.randomDelay(500, 1000);
        }
      }

      // Fill company name
      await this.fillWithFallback(
        [
          'input[name="companyName"]',
          'input[name="company"]',
          'input[name="organizationName"]',
          'input[id*="company" i]',
          '#companyName',
          'input[placeholder*="company" i]'
        ],
        data.companyName,
        'Company Name',
        true
      );

      await this.randomDelay(300, 700);

      console.log('Company information filled');
    } catch (error) {
      console.log('Company information section not found or not required');
    }
  }

  /**
   * Fill purchase information section
   */
  private async fillPurchaseInfo(data: RegistrationData): Promise<void> {
    if (!data.purchaseDate) {
      return;
    }

    console.log('Filling purchase information...');

    try {
      // Purchase Date
      await this.fillPurchaseDate(data.purchaseDate);
      await this.randomDelay(300, 700);

      // Retailer/Store (if present)
      if (data.retailer) {
        await this.fillWithFallback(
          [
            'input[name="retailer"]',
            'input[name="store"]',
            'input[name="dealer"]',
            'input[name="vendor"]',
            'input[id*="retailer" i]',
            'input[id*="store" i]',
            '#retailer',
            'input[placeholder*="retailer" i]',
            'input[placeholder*="store" i]'
          ],
          data.retailer,
          'Retailer',
          true
        );

        await this.randomDelay(300, 700);
      }

      console.log('Purchase information filled');
    } catch (error) {
      console.log('Purchase information section not found or not required');
    }
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
        'input[type="checkbox"][id*="newsletter" i]',
        'input[type="checkbox"][id*="promotional" i]'
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
    console.log('Submitting Dell registration form...');

    // Take screenshot before submission
    await this.page.screenshot({
      path: `./screenshots/dell-before-submit-${Date.now()}.png`,
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
      path: `./screenshots/dell-after-submit-${Date.now()}.png`,
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
        '.reference-number',
        '[data-testid="confirmation-code"]',
        '#confirmationCode',
        'text=/confirmation.*code.*[A-Z0-9-]+/i',
        'text=/registration.*number.*[A-Z0-9-]+/i',
        'text=/reference.*[A-Z0-9-]+/i',
        'text=/case.*number.*[A-Z0-9-]+/i'
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
    console.log('Verifying Dell registration success...');

    const currentUrl = this.page.url();
    const pageContent = await this.page.content();

    // Check URL for success indicators
    const successUrlPatterns = [
      /confirmation/i,
      /success/i,
      /thank.*you/i,
      /complete/i,
      /registered/i,
      /receipt/i
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
      'h1:has-text("Confirmation")',
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
      'text=/duplicate.*registration/i',
      'text=/previously registered/i'
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
      'text=/invalid/i',
      'text=/unable to.*register/i'
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
