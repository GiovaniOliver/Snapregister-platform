# Quick Start: Form Automation

## Installation

Playwright is already installed. If you need to install browsers:

```bash
npm run automation:install
```

## Basic Usage

### 1. Using the Service Directly

```typescript
import { chromium } from 'playwright';
import { FormAutomationService } from '@/automation/services/FormAutomationService';

const browser = await chromium.launch({ headless: false });
const service = new FormAutomationService({
  headless: false,
  screenshots: true
});

const result = await service.execute(
  browser,
  'https://manufacturer.com/register',
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    productName: 'Product Name',
    manufacturerName: 'Manufacturer',
    modelNumber: 'MODEL123',
    serialNumber: 'SERIAL456'
  }
);

await browser.close();
```

### 2. Using the API Endpoint

```typescript
const response = await fetch('/api/automation/form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId: 'your-registration-id',
    registrationUrl: 'https://manufacturer.com/register',
    options: {
      headless: true,
      fieldDetectionStrategy: 'hybrid'
    }
  })
});
```

### 3. Using with Existing Registration

```typescript
// The API will automatically fetch registration data from the database
const response = await fetch('/api/automation/form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    registrationId: 'existing-registration-id',
    registrationUrl: 'https://manufacturer.com/register'
  })
});
```

## Field Detection Strategies

- **`'intelligent'`**: Auto-detects all form fields
- **`'configured'`**: Uses pre-configured field mappings
- **`'hybrid'`**: Tries configured first, falls back to intelligent (recommended)

## Adding Manufacturer Mappings

Edit `website/src/automation/config/form-mappings.ts`:

```typescript
export const FORM_MAPPINGS: Record<string, FormFieldMapping> = {
  manufacturerName: {
    serialNumber: {
      selector: '#serial-number',
      type: 'text',
      required: true
    },
    // ... more fields
  }
};
```

## Testing

Run examples:

```bash
npm run automation:test
```

Or run specific example:

```typescript
import { example1_BasicFormAutomation } from '@/automation/examples/form-automation-example';
await example1_BasicFormAutomation();
```

## Common Issues

1. **Fields not detected**: Try `fieldDetectionStrategy: 'intelligent'`
2. **CAPTCHA detected**: Manual intervention required
3. **Form submission fails**: Check validation errors in screenshot
4. **Timeout errors**: Increase `timeout` option

## Next Steps

- See `README_FORM_AUTOMATION.md` for detailed documentation
- Check `form-automation-example.ts` for complete examples
- Add manufacturer-specific mappings in `form-mappings.ts`

