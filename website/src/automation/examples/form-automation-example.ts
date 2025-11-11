/**
 * Form Automation Example
 * 
 * Demonstrates how to use the FormAutomationService to automate
 * product registration form filling.
 */

import { chromium } from 'playwright';
import { FormAutomationService } from '../services/FormAutomationService';
import { RegistrationData } from '../core/BaseAutomation';
import { getFormMappings } from '../config/form-mappings';

/**
 * Example 1: Basic form automation with intelligent detection
 */
export async function example1_BasicFormAutomation() {
  console.log('\n=== Example 1: Basic Form Automation ===\n');

  const browser = await chromium.launch({ headless: false });
  const service = new FormAutomationService({
    headless: false,
    screenshots: true,
    fieldDetectionStrategy: 'intelligent'
  });

  const registrationData: RegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '5551234567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
    productName: 'Samsung TV',
    manufacturerName: 'Samsung',
    modelNumber: 'UN55TU8000FXZA',
    serialNumber: 'Z3N8K9M2P1Q',
    purchaseDate: '2024-01-15',
    retailer: 'Best Buy'
  };

  try {
    const result = await service.execute(
      browser,
      'https://www.samsung.com/us/support/register/',
      registrationData
    );

    console.log('Result:', {
      success: result.success,
      confirmationCode: result.confirmationCode,
      fieldsFilled: result.fieldsFilled,
      fieldsDetected: result.fieldsDetected,
      duration: `${result.duration}ms`
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Example 2: Form automation with configured field mappings
 */
export async function example2_ConfiguredMappings() {
  console.log('\n=== Example 2: Configured Field Mappings ===\n');

  const browser = await chromium.launch({ headless: false });
  const service = new FormAutomationService({
    headless: false,
    screenshots: true,
    fieldDetectionStrategy: 'configured'
  });

  const registrationData: RegistrationData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '5559876543',
    productName: 'LG Refrigerator',
    manufacturerName: 'LG',
    modelNumber: 'LFXS26973S',
    serialNumber: 'LG2024ABC123',
    purchaseDate: '2024-02-20'
  };

  // Get pre-configured mappings for Samsung
  const fieldMappings = getFormMappings('samsung');

  try {
    const result = await service.execute(
      browser,
      'https://www.samsung.com/us/support/register/',
      registrationData,
      fieldMappings
    );

    console.log('Result:', {
      success: result.success,
      confirmationCode: result.confirmationCode,
      fieldsFilled: result.fieldsFilled,
      duration: `${result.duration}ms`
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Example 3: Hybrid detection (configured + intelligent fallback)
 */
export async function example3_HybridDetection() {
  console.log('\n=== Example 3: Hybrid Detection ===\n');

  const browser = await chromium.launch({ headless: false });
  const service = new FormAutomationService({
    headless: false,
    screenshots: true,
    fieldDetectionStrategy: 'hybrid' // Try configured first, fall back to intelligent
  });

  const registrationData: RegistrationData = {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '5555555555',
    productName: 'Whirlpool Washer',
    manufacturerName: 'Whirlpool',
    modelNumber: 'WTW5000DW',
    serialNumber: 'WP2024XYZ789',
    purchaseDate: '2024-03-10',
    retailer: 'Home Depot'
  };

  // Try with configured mappings, will fall back to intelligent if not found
  const fieldMappings = getFormMappings('whirlpool');

  try {
    const result = await service.execute(
      browser,
      'https://www.whirlpool.com/support/register-product.html',
      registrationData,
      fieldMappings
    );

    console.log('Result:', {
      success: result.success,
      confirmationCode: result.confirmationCode,
      fieldsFilled: result.fieldsFilled,
      fieldsDetected: result.fieldsDetected,
      duration: `${result.duration}ms`
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Example 4: Using the API endpoint
 */
export async function example4_UsingAPI() {
  console.log('\n=== Example 4: Using API Endpoint ===\n');

  const registrationData = {
    registrationId: 'your-registration-id',
    registrationUrl: 'https://www.samsung.com/us/support/register/',
    fieldMappings: getFormMappings('samsung'),
    options: {
      headless: true,
      screenshots: true,
      fieldDetectionStrategy: 'hybrid'
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/automation/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    const result = await response.json();
    console.log('API Response:', result);

    // Check status
    if (result.registrationId) {
      setTimeout(async () => {
        const statusResponse = await fetch(
          `http://localhost:3000/api/automation/form?registrationId=${result.registrationId}`
        );
        const status = await statusResponse.json();
        console.log('Status:', status);
      }, 5000);
    }

  } catch (error) {
    console.error('API Error:', error);
  }
}

/**
 * Example 5: Custom field mappings
 */
export async function example5_CustomMappings() {
  console.log('\n=== Example 5: Custom Field Mappings ===\n');

  const browser = await chromium.launch({ headless: false });
  const service = new FormAutomationService({
    headless: false,
    screenshots: true
  });

  const registrationData: RegistrationData = {
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
    productName: 'Custom Product',
    manufacturerName: 'Custom Manufacturer',
    modelNumber: 'MODEL123',
    serialNumber: 'SERIAL456'
  };

  // Define custom field mappings for a specific form
  const customMappings = {
    firstName: {
      selector: '#first-name-field',
      type: 'text' as const,
      required: true
    },
    lastName: {
      selector: '#last-name-field',
      type: 'text' as const,
      required: true
    },
    email: {
      selector: '#email-field',
      type: 'email' as const,
      required: true
    },
    modelNumber: {
      selector: '#model-field',
      type: 'text' as const,
      required: true
    },
    serialNumber: {
      selector: '#serial-field',
      type: 'text' as const,
      required: true
    }
  };

  try {
    const result = await service.execute(
      browser,
      'https://example.com/register',
      registrationData,
      customMappings
    );

    console.log('Result:', result);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    try {
      // Uncomment the example you want to run:
      // await example1_BasicFormAutomation();
      // await example2_ConfiguredMappings();
      // await example3_HybridDetection();
      // await example4_UsingAPI();
      // await example5_CustomMappings();

      console.log('\nExamples completed. Uncomment the example you want to run.');
    } catch (error) {
      console.error('Example execution error:', error);
      process.exit(1);
    }
  })();
}

