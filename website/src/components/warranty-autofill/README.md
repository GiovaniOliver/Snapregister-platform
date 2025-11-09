# Warranty Auto-Fill Feature

A comprehensive auto-fill system that helps users copy their product and personal information to manufacturer warranty registration forms.

## Features

1. **Data Formatting Service** - Formats stored data into common form field formats
2. **Copy-to-Clipboard UI** - Organized sections with individual and bulk copy options
3. **Smart Form Assistant** - Guided step-by-step form filling experience
4. **Manufacturer Form Templates** - Pre-configured templates with screenshots and instructions
5. **Manual Submission Helper** - Wizard interface for guided form completion
6. **Floating Widget** - Quick access widget for copying data

## Directory Structure

```
warranty-autofill/
├── CopyButton.tsx              # Copy button components with animations
├── CopyDataPanel.tsx           # Main data display panel with sections
├── FormGuide.tsx               # Step-by-step form guide component
├── SubmissionTracker.tsx       # Track form submission progress
├── ManualSubmissionWizard.tsx  # Complete wizard for manual submission
├── FloatingQuickFillWidget.tsx # Floating quick-access widget
├── index.ts                    # Barrel export file
└── README.md                   # This file
```

## Installation

The components are already in your project. To use them, import from the warranty-autofill directory:

```tsx
import {
  CopyButton,
  CopyDataPanel,
  FormGuide,
  ManualSubmissionWizard,
  FloatingQuickFillWidget,
} from '@/components/warranty-autofill';
```

## Usage Examples

### 1. Basic Copy Button

```tsx
import { CopyButton } from '@/components/warranty-autofill';

function MyComponent() {
  return (
    <CopyButton
      value="ABC123XYZ"
      label="Copy Serial Number"
      size="md"
      variant="primary"
      onCopy={(value) => console.log('Copied:', value)}
    />
  );
}
```

### 2. Copy Data Panel

Display organized sections of personal and product information with copy buttons:

```tsx
import { CopyDataPanel } from '@/components/warranty-autofill';

function RegistrationPage() {
  const userData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '5551234567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  };

  const productData = {
    productName: 'Refrigerator XYZ',
    manufacturer: 'Samsung',
    modelNumber: 'RF28R7351SR',
    serialNumber: 'ABC123XYZ',
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 2499.99,
    retailer: 'Best Buy',
  };

  return (
    <CopyDataPanel
      userData={userData}
      productData={productData}
      onCopy={(fieldKey, value, format) => {
        console.log(`Copied ${fieldKey}: ${value}`);
      }}
    />
  );
}
```

### 3. Form Guide with Templates

Show step-by-step instructions for filling manufacturer forms:

```tsx
import { FormGuide } from '@/components/warranty-autofill';
import { DataFormatter } from '@/lib/services/data-formatter';

function FormGuidePage() {
  const template = {
    id: 'template_1',
    manufacturerId: 'samsung',
    manufacturerName: 'Samsung',
    formName: 'Standard Warranty Registration',
    formUrl: 'https://www.samsung.com/us/support/warranty/',
    formType: 'WEB_FORM',
    difficulty: 'EASY',
    estimatedTime: 3,
    requiresCaptcha: false,
    requiresAccount: false,
    instructions: [
      {
        step: 1,
        title: 'Open Registration Form',
        description: 'Click the "Open Form" button to navigate to Samsung\'s warranty registration page.',
        estimatedTimeSeconds: 30,
      },
      {
        step: 2,
        title: 'Enter Personal Information',
        description: 'Copy and paste your name, email, and phone number.',
        fieldsToCopy: ['firstName', 'lastName', 'email', 'phone'],
        estimatedTimeSeconds: 60,
      },
    ],
    fieldMappings: [],
    timesUsed: 150,
    successCount: 145,
    failureCount: 5,
    verifiedWorking: true,
  };

  const formattedData = DataFormatter.formatRegistrationData(userData, productData);

  return (
    <FormGuide
      template={template}
      registrationData={formattedData}
      onStepComplete={(step) => console.log('Completed step:', step)}
      onFieldCopy={(key, value) => console.log('Copied:', key, value)}
    />
  );
}
```

### 4. Manual Submission Wizard

Complete wizard interface for guided form submission:

```tsx
import { ManualSubmissionWizard } from '@/components/warranty-autofill';

function WarrantyRegistrationPage() {
  const manufacturers = [
    { id: 'samsung', name: 'Samsung', logo: '/logos/samsung.png' },
    { id: 'lg', name: 'LG', logo: '/logos/lg.png' },
    { id: 'whirlpool', name: 'Whirlpool', logo: '/logos/whirlpool.png' },
  ];

  return (
    <ManualSubmissionWizard
      manufacturers={manufacturers}
      templates={[]} // Fetch from API
      userData={userData}
      productData={productData}
      registrationId="reg_123"
      onComplete={(submissionId) => {
        console.log('Completed submission:', submissionId);
        // Navigate to success page
      }}
      onCancel={() => {
        // Handle cancellation
      }}
    />
  );
}
```

### 5. Floating Quick Fill Widget

Add a floating widget that users can access while filling forms:

```tsx
import { FloatingQuickFillWidget } from '@/components/warranty-autofill';

function Layout({ children }) {
  return (
    <>
      {children}
      <FloatingQuickFillWidget
        userData={userData}
        productData={productData}
        defaultOpen={false}
        position="bottom-right"
        onCopy={(fieldKey, value) => {
          console.log('Copied from widget:', fieldKey, value);
        }}
      />
    </>
  );
}
```

### 6. Compact Copy Panel

Use the compact version for sidebars or smaller spaces:

```tsx
import { CompactCopyDataPanel } from '@/components/warranty-autofill';

function Sidebar() {
  return (
    <CompactCopyDataPanel
      userData={userData}
      productData={productData}
      onCopy={(fieldKey, value) => console.log('Copied:', fieldKey)}
    />
  );
}
```

## Data Formatting Service

The `DataFormatter` service provides utilities for formatting data:

```typescript
import { DataFormatter } from '@/lib/services/data-formatter';

// Format dates
DataFormatter.formatDate(new Date(), 'MM/DD/YYYY'); // "01/15/2024"
DataFormatter.formatDate(new Date(), 'YYYY-MM-DD');  // "2024-01-15"

// Format phone numbers
DataFormatter.formatPhone('5551234567', 'US');          // "(555) 123-4567"
DataFormatter.formatPhone('5551234567', 'DASHES');      // "555-123-4567"
DataFormatter.formatPhone('5551234567', 'INTERNATIONAL'); // "+1 555 123 4567"

// Format addresses
DataFormatter.formatAddress(
  '123 Main St',
  'New York',
  'NY',
  '10001',
  'US',
  'US_STANDARD'
); // "123 Main St, New York, NY, 10001"

// Format serial numbers (manufacturer-specific)
DataFormatter.formatSerialNumber('ABC-123-XYZ', 'Samsung'); // "ABC123XYZ"

// Format complete registration data
const formattedData = DataFormatter.formatRegistrationData(
  userData,
  productData,
  {
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: 'US',
    addressFormat: 'US_STANDARD',
    includeCountryCode: false,
  }
);

// Export as plain text
const plainText = DataFormatter.toPlainText(formattedData);

// Export as JSON
const json = DataFormatter.toJSON(formattedData);
```

## API Endpoints

### Format Data

```typescript
POST /api/warranty-autofill/format-data

Body:
{
  userData: UserData,
  productData: ProductData,
  options?: {
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
    phoneFormat?: 'US' | 'INTERNATIONAL' | 'DASHES',
    addressFormat?: 'US_STANDARD' | 'SINGLE_LINE' | 'MULTI_LINE'
  }
}

Response:
{
  success: true,
  data: FormattedRegistrationData
}
```

### Get Templates

```typescript
GET /api/warranty-autofill/templates?manufacturerId=samsung

Response:
{
  success: true,
  data: ManufacturerFormTemplate[],
  count: number
}
```

### Create Submission

```typescript
POST /api/warranty-autofill/submissions

Body:
{
  registrationId: string,
  templateId: string,
  userId: string,
  totalSteps: number
}

Response:
{
  success: true,
  data: FormSubmission
}
```

### Update Submission

```typescript
PATCH /api/warranty-autofill/submissions/[id]

Body:
{
  currentStep?: number,
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
  copiedFields?: string[],
  difficultyRating?: number,
  feedback?: string
}
```

## Database Schema

The feature adds these models to Prisma:

- `ManufacturerFormTemplate` - Stores form templates with instructions
- `FormSubmission` - Tracks user submission progress
- `FormType` enum - Web form, PDF, email, phone, mail
- `FormDifficulty` enum - Easy, medium, hard, expert
- `FormSubmissionStatus` enum - In progress, completed, abandoned, failed

Run migrations after updating the schema:

```bash
npx prisma migrate dev --name add_warranty_autofill
npx prisma generate
```

## Styling

Components use Tailwind CSS. Make sure you have these animations in your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
};
```

## Keyboard Shortcuts

- **Ctrl/Cmd + Shift + C**: Toggle Floating Quick Fill Widget

## Best Practices

1. **Secure Serial Numbers**: Encrypt serial numbers before storing in the database
2. **Track Analytics**: Monitor which templates are most successful
3. **Update Templates**: Regularly verify templates are still working
4. **User Feedback**: Collect ratings to improve templates
5. **Accessibility**: Ensure all copy actions announce to screen readers
6. **Error Handling**: Provide fallbacks if clipboard API fails

## Browser Compatibility

- Clipboard API requires HTTPS in production
- Tested in Chrome, Firefox, Safari, Edge
- Fallback methods available for older browsers

## Future Enhancements

1. **Browser Extension**: Auto-detect and fill form fields
2. **OCR Integration**: Scan warranty cards directly
3. **Multi-language**: Support international forms
4. **AI Form Detection**: Automatically map fields
5. **Batch Registration**: Register multiple products at once

## Support

For issues or questions:
- Check the component props using TypeScript IntelliSense
- Review the type definitions in `@/lib/types/warranty-autofill.ts`
- Test with the mock data provided in the API endpoints

## License

Part of SnapRegister project.
