/**
 * Playwright Automation - Usage Examples
 *
 * This file demonstrates how to use the warranty registration automation system.
 */

import { AutomationOrchestrator } from '../services/AutomationOrchestrator';
import { executeWarrantyRegistration } from '../index';
import type { RegistrationData } from '../core/BaseAutomation';

// =============================================================================
// Example 1: Simple Single Registration
// =============================================================================

export async function example1_SimpleRegistration() {
  console.log('\n=== Example 1: Simple Registration ===\n');

  const registrationData: RegistrationData = {
    // User information
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',

    // Address
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',

    // Product information
    productName: 'Samsung 65" 4K Smart TV',
    manufacturerName: 'Samsung',
    modelNumber: 'UN65TU8000',
    serialNumber: 'ABC123XYZ789',

    // Purchase information
    purchaseDate: '2024-01-15',
    purchasePrice: 899.99,
    retailer: 'Best Buy',
  };

  // Execute registration (convenience function)
  const result = await executeWarrantyRegistration('Samsung', registrationData, {
    headless: true, // Run in background
    screenshots: true, // Capture screenshots
    maxRetries: 3 // Retry up to 3 times
  });

  if (result.success) {
    console.log('✓ Registration successful!');
    console.log('Confirmation Code:', result.confirmationCode);
    console.log('Screenshot:', result.screenshotPath);
  } else {
    console.error('✗ Registration failed');
    console.error('Error:', result.errorMessage);
    console.error('Error Type:', result.errorType);
    console.error('Screenshot:', result.screenshotPath);
  }

  return result;
}

// =============================================================================
// Example 2: Using Orchestrator Directly
// =============================================================================

export async function example2_OrchestratorUsage() {
  console.log('\n=== Example 2: Using Orchestrator ===\n');

  const orchestrator = new AutomationOrchestrator({
    headless: false, // Show browser for debugging
    screenshots: true,
    videoRecording: true, // Record video
    maxRetries: 2
  });

  try {
    const data: RegistrationData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      productName: 'iPhone 15 Pro',
      manufacturerName: 'Apple',
      serialNumber: 'F2LX1234ABC',
    };

    const result = await orchestrator.executeRegistration('Apple', data);

    console.log('Result:', result);

    return result;
  } finally {
    // Always cleanup
    await orchestrator.shutdown();
  }
}

// =============================================================================
// Example 3: Multiple Registrations in Parallel
// =============================================================================

export async function example3_BatchRegistrations() {
  console.log('\n=== Example 3: Batch Registrations ===\n');

  const orchestrator = new AutomationOrchestrator({
    headless: true,
    maxRetries: 3
  });

  try {
    const registrations = [
      {
        manufacturer: 'Samsung',
        data: {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          productName: 'Samsung Refrigerator',
          manufacturerName: 'Samsung',
          serialNumber: 'SAM123456',
          modelNumber: 'RF28R7201SR',
        } as RegistrationData
      },
      {
        manufacturer: 'Apple',
        data: {
          firstName: 'Bob',
          lastName: 'Williams',
          email: 'bob@example.com',
          productName: 'MacBook Pro',
          manufacturerName: 'Apple',
          serialNumber: 'C02XY1234ABC',
        } as RegistrationData
      },
      {
        manufacturer: 'Samsung',
        data: {
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol@example.com',
          productName: 'Samsung Washer',
          manufacturerName: 'Samsung',
          serialNumber: 'SAM789012',
          modelNumber: 'WF45R6100AP',
        } as RegistrationData
      }
    ];

    // Execute with concurrency limit of 2
    const results = await orchestrator.executeMultiple(registrations, 2);

    // Print summary
    const successCount = results.filter(r => r.success).length;
    console.log(`\nCompleted: ${successCount}/${results.length} successful`);

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${registrations[index].manufacturer}:`);
      console.log(`   Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (result.confirmationCode) {
        console.log(`   Confirmation: ${result.confirmationCode}`);
      }
      if (result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`);
      }
    });

    return results;
  } finally {
    await orchestrator.shutdown();
  }
}

// =============================================================================
// Example 4: Error Handling
// =============================================================================

export async function example4_ErrorHandling() {
  console.log('\n=== Example 4: Error Handling ===\n');

  const orchestrator = new AutomationOrchestrator({
    headless: true,
    screenshots: true,
    maxRetries: 3
  });

  try {
    // Invalid data (missing required fields)
    const invalidData: Partial<RegistrationData> = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      productName: 'Test Product',
      manufacturerName: 'Samsung',
      // Missing serialNumber and modelNumber
    };

    const result = await orchestrator.executeRegistration(
      'Samsung',
      invalidData as RegistrationData
    );

    // Handle different error types
    if (!result.success) {
      switch (result.errorType) {
        case 'validation':
          console.error('Validation error - check required fields');
          console.error('Message:', result.errorMessage);
          break;

        case 'captcha':
          console.error('CAPTCHA detected - manual intervention required');
          console.error('Screenshot:', result.screenshotPath);
          // TODO: Notify user to complete manually
          break;

        case 'form_changed':
          console.error('Form structure changed - automation needs update');
          console.error('HTML snapshot saved for debugging');
          // TODO: Alert developer to update automation script
          break;

        case 'timeout':
          console.error('Timeout - network or performance issue');
          // Will auto-retry if retries configured
          break;

        case 'network':
          console.error('Network error - check connectivity');
          break;

        default:
          console.error('Unknown error:', result.errorMessage);
      }
    }

    return result;
  } finally {
    await orchestrator.shutdown();
  }
}

// =============================================================================
// Example 5: Check Supported Manufacturers
// =============================================================================

export async function example5_CheckSupport() {
  console.log('\n=== Example 5: Check Supported Manufacturers ===\n');

  const orchestrator = new AutomationOrchestrator();

  // Get all supported manufacturers
  const supported = orchestrator.getSupportedManufacturers();
  console.log('Supported manufacturers:', supported);

  // Check if specific manufacturer is supported
  console.log('Samsung supported?', orchestrator.hasAutomation('Samsung'));
  console.log('LG supported?', orchestrator.hasAutomation('LG'));

  // Get detailed info
  const info = orchestrator.getAutomationInfo();
  console.log('\nDetailed info:');
  info.forEach(mfr => {
    console.log(`\n${mfr.manufacturer}:`);
    console.log(`  Type: ${mfr.automationType}`);
    console.log(`  Required fields: ${mfr.requiredFields.join(', ')}`);
  });

  await orchestrator.shutdown();
}

// =============================================================================
// Example 6: Integration with Next.js API
// =============================================================================

export async function example6_ApiIntegration() {
  console.log('\n=== Example 6: API Integration ===\n');

  // Client-side code example
  const productId = 'product_123';

  try {
    // Start automation
    const response = await fetch('/api/automation/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, headless: true })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    console.log('Automation started:', data);
    const { registrationId } = data;

    // Poll for status (every 2 seconds)
    const checkStatus = async () => {
      const statusResponse = await fetch(
        `/api/automation/execute?registrationId=${registrationId}`
      );

      const status = await statusResponse.json();
      console.log('Current status:', status.status);

      if (status.status === 'SUCCESS') {
        console.log('✓ Registration complete!');
        console.log('Confirmation:', status.confirmationCode);
        return status;
      } else if (status.status === 'FAILED') {
        console.error('✗ Registration failed');
        console.error('Error:', status.errorMessage);
        return status;
      } else if (status.status === 'PROCESSING') {
        // Still processing, check again
        setTimeout(checkStatus, 2000);
      }
    };

    // Start polling
    await checkStatus();

  } catch (error) {
    console.error('Error:', error);
  }
}

// =============================================================================
// Example 7: Testing Mode (Headed Browser for Development)
// =============================================================================

export async function example7_TestingMode() {
  console.log('\n=== Example 7: Testing Mode ===\n');

  // Run with visible browser for debugging
  const orchestrator = new AutomationOrchestrator({
    headless: false, // Show browser
    screenshots: true,
    videoRecording: true,
    timeout: 60000 // Longer timeout for debugging
  });

  try {
    const data: RegistrationData = {
      firstName: 'Debug',
      lastName: 'Test',
      email: 'debug@example.com',
      productName: 'Samsung TV',
      manufacturerName: 'Samsung',
      serialNumber: 'TEST123456',
      modelNumber: 'UN65TU8000',
    };

    console.log('Running in visible browser mode...');
    console.log('You can watch the automation in real-time');

    const result = await orchestrator.executeRegistration('Samsung', data, {
      headless: false
    });

    console.log('\nResult:', result);

    return result;
  } finally {
    await orchestrator.shutdown();
  }
}

// =============================================================================
// Run examples (uncomment to test)
// =============================================================================

if (require.main === module) {
  (async () => {
    // Run examples one by one
    // await example1_SimpleRegistration();
    // await example2_OrchestratorUsage();
    // await example3_BatchRegistrations();
    // await example4_ErrorHandling();
    // await example5_CheckSupport();
    // await example7_TestingMode();

    console.log('\n✓ All examples completed\n');
  })();
}
