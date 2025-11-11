# Form Automation System

A comprehensive Playwright-based system for automating product registration form filling. This system provides intelligent field detection, automatic data mapping, and support for various form types.

## Features

- **Intelligent Field Detection**: Automatically detects form fields by analyzing HTML structure, labels, and placeholders
- **Smart Data Mapping**: Maps registration data to form fields using name matching, type inference, and label analysis
- **Multiple Detection Strategies**: Supports configured mappings, intelligent detection, or hybrid approach
- **Multi-Step Form Support**: Handles forms with multiple steps or wizards
- **CAPTCHA Detection**: Automatically detects CAPTCHA challenges
- **Error Handling**: Comprehensive error classification and screenshot capture
- **Human-like Behavior**: Random delays and human-like typing to avoid detection

## Architecture

### Core Components

1. **FormAutomationService**: Main service that orchestrates form automation
2. **FormFieldDetector**: Intelligently detects form fields on a page
3. **FormFieldMapper**: Maps registration data to detected form fields
4. **Form Mappings Config**: Pre-configured field mappings for common manufacturers

## Usage

### Basic Usage

```typescript
import { chromium } from 'playwright';
import { FormAutomationService } from '@/automation/services/FormAutomationService';
import { RegistrationData } from '@/automation/core/BaseAutomation';

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
  productName: 'Samsung TV',
  manufacturerName: 'Samsung',
  modelNumber: 'UN55TU8000FXZA',
  serialNumber: 'Z3N8K9M2P1Q',
  purchaseDate: '2024-01-15'
};

const result = await service.execute(
  browser,
  'https://www.samsung.com/us/support/register/',
  registrationData
);

console.log('Success:', result.success);
console.log('Confirmation Code:', result.confirmationCode);
```

### Using Pre-configured Mappings

```typescript
import { getFormMappings } from '@/automation/config/form-mappings';

const fieldMappings = getFormMappings('samsung');

const result = await service.execute(
  browser,
  'https://www.samsung.com/us/support/register/',
  registrationData,
  fieldMappings
);
```

### Using the API Endpoint

```typescript
const response = await fetch('/api/automation/form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId: 'registration-id',
    registrationUrl: 'https://manufacturer.com/register',
    fieldMappings: getFormMappings('samsung'),
    options: {
      headless: true,
      screenshots: true,
      fieldDetectionStrategy: 'hybrid'
    }
  })
});

const result = await response.json();
```

## Field Detection Strategies

### 1. Intelligent Detection (`'intelligent'`)

Automatically detects all form fields by analyzing:
- Input types (text, email, tel, date, number)
- Field names and IDs
- Associated labels
- Placeholder text
- Required attributes

**Use when**: Working with unknown forms or when configured mappings don't exist.

### 2. Configured Mappings (`'configured'`)

Uses pre-configured field selectors and mappings.

**Use when**: You have reliable field mappings for the manufacturer.

### 3. Hybrid (`'hybrid'` - Recommended)

Tries configured mappings first, falls back to intelligent detection if fields aren't found.

**Use when**: You want the best of both worlds - reliability with fallback.

## Form Field Mapping

The system automatically maps registration data to form fields using:

1. **Exact Name Matching**: Matches field names like `firstName`, `lastName`, `email`
2. **Normalized Matching**: Handles variations like `first_name`, `first-name`, `FirstName`
3. **Label Matching**: Matches fields by their associated labels
4. **Placeholder Matching**: Matches fields by placeholder text
5. **Type Inference**: Uses field type (email, tel, date) to match appropriate data

### Supported Field Types

- `text`: Standard text input
- `email`: Email input (auto-validated)
- `tel`: Phone number input (auto-formatted)
- `date`: Date input (auto-formatted to YYYY-MM-DD)
- `number`: Numeric input
- `select`: Dropdown/select fields
- `textarea`: Multi-line text
- `checkbox`: Checkboxes
- `radio`: Radio buttons

## Error Handling

The system classifies errors into types:

- `timeout`: Page load or element wait timeout
- `captcha`: CAPTCHA detected
- `form_changed`: Form structure changed (selectors outdated)
- `network`: Network connectivity issue
- `validation`: Form validation error
- `unknown`: Unclassified error

Errors automatically trigger:
- Screenshot capture
- HTML snapshot capture
- Error classification
- Database logging (when using API)

## Configuration

### Adding New Manufacturer Mappings

Edit `website/src/automation/config/form-mappings.ts`:

```typescript
export const FORM_MAPPINGS: Record<string, FormFieldMapping> = {
  yourManufacturer: {
    serialNumber: {
      selector: '#serial-number, input[name="serialNumber"]',
      type: 'text',
      required: true,
      fallbackSelectors: [
        'input[placeholder*="Serial" i]'
      ]
    },
    // ... more fields
  }
};
```

## API Endpoints

### POST `/api/automation/form`

Execute form automation for a registration.

**Request Body:**
```json
{
  "registrationId": "optional-registration-id",
  "registrationUrl": "https://manufacturer.com/register",
  "fieldMappings": { /* optional */ },
  "options": {
    "headless": true,
    "screenshots": true,
    "fieldDetectionStrategy": "hybrid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form automation started",
  "registrationId": "registration-id",
  "estimatedCompletionTime": 30
}
```

### GET `/api/automation/form?registrationId=xxx`

Check status of form automation execution.

**Response:**
```json
{
  "registrationId": "registration-id",
  "status": "SUCCESS",
  "confirmationCode": "ABC123",
  "errorMessage": null,
  "completedAt": "2024-01-15T10:30:00Z"
}
```

## Examples

See `website/src/automation/examples/form-automation-example.ts` for complete examples:

1. Basic form automation with intelligent detection
2. Form automation with configured field mappings
3. Hybrid detection (configured + intelligent fallback)
4. Using the API endpoint
5. Custom field mappings

## Best Practices

1. **Use Hybrid Strategy**: Provides best reliability with fallback
2. **Configure Mappings**: Add manufacturer-specific mappings for better reliability
3. **Handle CAPTCHA**: Monitor for CAPTCHA and handle manually when detected
4. **Test First**: Test with `headless: false` to debug issues
5. **Monitor Errors**: Check error types and screenshots to improve mappings
6. **Update Mappings**: Keep field mappings updated as forms change

## Troubleshooting

### Fields Not Being Filled

1. Check if field selectors are correct
2. Verify field is visible (not hidden by CSS)
3. Try intelligent detection to see what fields are found
4. Check browser console for errors

### CAPTCHA Detected

- System automatically detects CAPTCHA
- Manual intervention required
- Consider using API-based registration if available

### Form Submission Fails

1. Check for validation errors
2. Verify all required fields are filled
3. Check if form has multiple steps
4. Review screenshot for visual clues

## Integration with Existing System

The form automation system integrates with:

- **BaseAutomation**: Uses same `RegistrationData` interface
- **AutomationOrchestrator**: Can be used alongside manufacturer-specific automations
- **Registration API**: Works with existing registration endpoints
- **Database**: Updates registration status and captures results

## Performance

- Average form fill time: 5-15 seconds
- Field detection time: 1-3 seconds
- Total automation time: 10-30 seconds (depending on form complexity)

## Security

- Uses anti-detection measures (random user agents)
- Human-like behavior (random delays, typing)
- No data storage in automation service
- Screenshots stored locally (configure storage path)

