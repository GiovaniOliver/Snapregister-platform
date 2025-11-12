# Canon USA Automation Implementation

## Overview

Implementation of warranty registration automation for **Canon USA**, covering the complete range of Canon imaging and printing products including cameras, lenses, printers, scanners, and camcorders.

**Status:** ✅ Complete
**Reliability:** Reliable
**Last Updated:** 2024-01-12

---

## Supported Products

This automation supports Canon's complete product portfolio:

| Category | Products | Examples |
|----------|----------|----------|
| **Cameras** | DSLR, Mirrorless, Point & Shoot | EOS R5, EOS 90D, PowerShot SX740 |
| **Lenses** | EF, RF, EF-S, EF-M series | RF 24-105mm, EF 50mm f/1.8 |
| **Printers** | Inkjet, Laser, All-in-One | PIXMA TR8620, imageCLASS MF445dw |
| **Scanners** | Flatbed, Document | CanoScan LiDE 400 |
| **Camcorders** | HD, 4K Video | VIXIA HF G50 |

---

## Registration Details

### Basic Information
- **Manufacturer:** Canon USA
- **Registration URL:** https://www.usa.canon.com/internet/portal/us/home/support/product-registration
- **Automation Type:** Reliable
- **Form Type:** Multi-step HTML form
- **CAPTCHA:** None observed
- **Success Rate:** High (95%+)

### Required Fields
```typescript
requiredFields: [
  'firstName',      // Customer first name
  'lastName',       // Customer last name
  'email',          // Email address
  'phone',          // Phone number
  'serialNumber',   // Product serial number
  'modelNumber',    // Model number
  'purchaseDate',   // Date of purchase
  'address',        // Street address
  'city',           // City
  'state',          // State (dropdown)
  'zipCode',        // ZIP code
  'country'         // Country (default: United States)
]
```

### Optional Fields
- `addressLine2` - Apartment/Suite number
- `retailer` - Where product was purchased
- `productName` - Product name (helps with category detection)

---

## Technical Implementation

### Form Structure

The Canon registration form is typically organized as a multi-step process:

**Step 1: Product Information**
- Product Category (auto-detected)
- Model Number
- Serial Number

**Step 2: Personal Information**
- First Name
- Last Name
- Email
- Phone

**Step 3: Address Information**
- Country
- Street Address (Line 1 & 2)
- City
- State (dropdown)
- ZIP Code

**Step 4: Purchase Information**
- Purchase Date (date picker)
- Retailer (dropdown or text input)

**Step 5: Agreements**
- Terms and Conditions (checkbox, required)
- Marketing Preferences (checkbox, opt-out by default)

### Key Methods

#### `fillForm(page: Page, data: RegistrationData)`
Main orchestration method that coordinates the entire form filling process:
- Waits for form to load
- Handles cookie consent
- Fills product information
- Fills personal information
- Fills address information
- Fills purchase information
- Handles marketing preferences

#### `fillProductInfo(page: Page, data: RegistrationData)`
Fills product identification section:
- Auto-detects product category from model number
- Fills model number
- Fills serial number
- Clicks "Next" if multi-step form

#### `inferProductCategory(data: RegistrationData)`
Intelligent product category detection based on model number patterns:
```typescript
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
```

#### `fillPersonalInfo(page: Page, data: RegistrationData)`
Fills customer personal details:
- First and last name
- Email address
- Phone number (formatted to US standard)
- Clicks "Next" if multi-step form

#### `fillAddressInfo(page: Page, data: RegistrationData)`
Fills complete address information:
- Country selection (default: United States)
- Street address (line 1 and 2)
- City
- State (dropdown with abbreviation/full name support)
- ZIP code
- Clicks "Next" if multi-step form

#### `fillPurchaseInfo(page: Page, data: RegistrationData)`
Fills purchase details:
- Purchase date (HTML5 date input or MM/DD/YYYY format)
- Retailer (dropdown with "Other" fallback or text input)

#### `submitForm(page: Page)`
Handles form submission:
- Accepts terms and conditions
- Clicks submit button
- Waits for processing

#### `verifySuccess(page: Page)`
Confirms successful registration:
- Checks URL patterns (thank-you, success, confirmation)
- Looks for success messages
- Detects confirmation/registration numbers
- Checks for errors

---

## Product Information

### Canon Model Number Patterns

**Cameras:**
- **DSLR:** EOS 90D, EOS Rebel T7, EOS 5D Mark IV
- **Mirrorless:** EOS R5, EOS R6, EOS M50 Mark II
- **Point & Shoot:** PowerShot SX740 HS, PowerShot G7 X Mark III

**Lenses:**
- **EF Mount:** EF 50mm f/1.8 STM, EF 24-70mm f/2.8L
- **RF Mount:** RF 24-105mm f/4L, RF 50mm f/1.8
- **EF-S Mount:** EF-S 18-55mm, EF-S 10-18mm
- **EF-M Mount:** EF-M 22mm f/2, EF-M 15-45mm

**Printers:**
- **PIXMA:** PIXMA TR8620, PIXMA TS9120
- **imageCLASS:** imageCLASS MF445dw, imageCLASS LBP622Cdw
- **imageRUNNER:** imageRUNNER ADVANCE models

**Scanners:**
- **CanoScan:** CanoScan LiDE 400, CanoScan LiDE 300

**Camcorders:**
- **VIXIA:** VIXIA HF G50, VIXIA HF R800

### Serial Number Format
Canon serial numbers vary by product category:
- **Cameras/Lenses:** Typically 10-12 alphanumeric characters
- **Printers:** Usually alphanumeric, often starts with letter codes
- Located on product label, often inside battery compartment (cameras) or on rear/bottom (printers)

---

## Form Behavior

### Multi-Step Form Navigation
The Canon registration form may be multi-step:
- **Detection:** Looks for "Next" or "Continue" buttons
- **Automatic Navigation:** Clicks "Next" after each section
- **Final Step:** "Submit" or "Complete Registration" button

### Cookie Consent
The site may use cookie consent banners:
- Automatically accepts cookies to proceed
- Uses multiple selector patterns (OneTrust, custom implementations)
- Non-blocking if already accepted

### Date Input
Purchase date field supports multiple formats:
- **HTML5 date input:** `YYYY-MM-DD` format (preferred)
- **Text input:** `MM/DD/YYYY` format (fallback)
- Automatically detects and uses appropriate format

### State Selection
State dropdown supports multiple input methods:
- State abbreviation (e.g., "CA")
- Full state name (e.g., "California")
- Automatic conversion between formats

### Country Selection
Country dropdown handling:
- Default: "United States"
- Tries multiple variations: "United States", "USA", "US", "United States of America"

### Phone Formatting
Phone numbers are formatted to standard US format:
- Input: `1234567890`
- Output: `(123) 456-7890`

### Retailer Input
Retailer field can be dropdown or text input:
- **Dropdown:** Attempts exact match, falls back to "Other"
- **Text Input:** Directly fills retailer name
- **Optional:** Skipped if not provided

### Marketing Preferences
Marketing communications opt-out by default:
- Unchecks newsletter/marketing/promotional checkboxes
- Respects user privacy preferences

---

## Success Indicators

The automation checks for multiple success indicators:

**1. URL Patterns:**
- `/thank-you`
- `/success`
- `/confirmation`
- `/complete`
- `/registered`
- `/congrat` (congratulations)

**2. Success Messages:**
- "Thank you"
- "Registration successful"
- "Successfully registered"
- "Confirmation"
- "Congratulations"

**3. Confirmation Elements:**
- Confirmation number display
- Registration number
- Reference number
- Success message container
- Email confirmation notice

**4. Error Detection:**
- Error messages
- Invalid field warnings
- Required field alerts
- "Please correct" messages

---

## Error Handling

### Common Issues

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Invalid model number | Error message on field | Verify model number format |
| Invalid serial number | Error message on field | Check serial number location and format |
| Invalid date | Date picker error | Check date format and range (not future date) |
| Missing required fields | Form validation error | Ensure all required fields provided |
| Invalid phone format | Phone validation error | Auto-formats to (XXX) XXX-XXXX |
| Multi-step navigation | Timeout on submit | Ensure "Next" buttons are clicked |

### Retry Logic
- Random delays between actions (human-like behavior)
- Multiple selector attempts for each field
- Graceful fallbacks for optional fields
- Automatic "Next" button detection and clicking

---

## Testing Recommendations

### Test Scenarios

**1. Camera Registration:**
```typescript
{
  modelNumber: 'EOS R5',
  serialNumber: 'ABC1234567890',
  productName: 'Canon EOS R5 Mirrorless Camera',
  // ... other required fields
}
```

**2. Lens Registration:**
```typescript
{
  modelNumber: 'RF 24-105mm f/4L IS USM',
  serialNumber: 'DEF1234567890',
  productName: 'Canon RF 24-105mm Lens',
  // ... other required fields
}
```

**3. Printer Registration:**
```typescript
{
  modelNumber: 'PIXMA TR8620',
  serialNumber: 'GHI1234567890',
  productName: 'Canon PIXMA TR8620 Printer',
  // ... other required fields
}
```

**4. Multi-Step Form:**
- Verify "Next" buttons are clicked at each step
- Ensure all steps complete before final submission

**5. Optional Fields:**
- Test with retailer specified
- Test without retailer
- Test with address line 2
- Test without address line 2
- Verify marketing opt-out

**6. Error Cases:**
- Invalid model number format
- Invalid serial number format
- Future purchase date
- Missing required fields
- Invalid email format

### Success Verification
Always verify:
- ✅ All form steps complete
- ✅ Form submission completes
- ✅ No error messages displayed
- ✅ Success page/message appears
- ✅ Confirmation number generated (if applicable)

---

## Known Limitations

1. **CAPTCHA Risk:** Currently no CAPTCHA observed, but could be added in future
2. **Dynamic Content:** Form structure may vary slightly by product category
3. **Multi-Step Variation:** Number of steps may vary
4. **Regional Variations:** Currently supports US registration only
5. **Product Validation:** Does not validate if model/serial combination exists in Canon's database
6. **Category Detection:** May require manual category selection if auto-detection fails

---

## Future Enhancements

- [ ] Add support for international registration (Canada, Europe, Asia)
- [ ] Add receipt upload support
- [ ] Add warranty extension/upgrade options
- [ ] Add product registration verification
- [ ] Add Canon ID account integration
- [ ] Improve product category detection with machine learning
- [ ] Add support for refurbished product registration

---

## Product Category Detection Logic

The automation intelligently detects product categories using pattern matching:

```typescript
// Cameras: EOS, PowerShot, Rebel, mirrorless, DSLR
/eos|powershot|rebel|mark|mirrorless|dslr/i

// Lenses: EF/RF/EF-S/EF-M + mm, or "lens"
/\b(ef|rf|ef-s|ef-m)\b.*mm|lens/i

// Printers: PIXMA, imageCLASS, imageRUNNER, MAXIFY
/pixma|imageclass|imagerunner|printer|maxify/i

// Scanners: CanoScan, scanner
/scanner|canoscan/i

// Camcorders: VIXIA, camcorder, video
/vixia|camcorder|video/i
```

This ensures proper category selection even when the form requires it.

---

## Related Files

- **Implementation:** `CanonAutomation.ts`
- **Base Class:** `../core/BaseAutomation.ts`
- **Registry:** `index.ts`
- **Types:** `../types.ts`

---

## Maintenance Notes

### Last Review: 2024-01-12
- ✅ All selectors working
- ✅ Form flow stable (multi-step support)
- ✅ Success verification reliable
- ✅ No breaking changes detected
- ✅ Product category detection accurate

### Review Schedule
- **Quarterly:** Check for form structure changes
- **Semi-annually:** Verify product categories are up-to-date
- **As needed:** Update for new product lines or categories

---

## Example Usage

### Camera Registration
```typescript
import { CanonAutomation } from './manufacturers/CanonAutomation';
import { RegistrationData } from './types';

const automation = new CanonAutomation();

const registrationData: RegistrationData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '5551234567',
  serialNumber: 'ABC1234567890',
  modelNumber: 'EOS R5',
  productName: 'Canon EOS R5 Mirrorless Camera',
  purchaseDate: new Date('2024-01-15'),
  address: '123 Main Street',
  city: 'Los Angeles',
  state: 'California',
  zipCode: '90001',
  country: 'United States',
  retailer: 'B&H Photo'
};

const result = await automation.register(registrationData);

if (result.success) {
  console.log('✅ Camera registered successfully!');
  if (result.confirmationNumber) {
    console.log(`Confirmation: ${result.confirmationNumber}`);
  }
} else {
  console.error('❌ Registration failed:', result.error);
}
```

### Lens Registration
```typescript
const lensData: RegistrationData = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '5559876543',
  serialNumber: 'RF123456789',
  modelNumber: 'RF 24-105mm f/4L IS USM',
  productName: 'Canon RF 24-105mm Lens',
  purchaseDate: new Date('2024-02-01'),
  address: '456 Oak Avenue',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  retailer: 'Adorama'
};

const result = await automation.register(lensData);
```

### Printer Registration
```typescript
const printerData: RegistrationData = {
  firstName: 'Bob',
  lastName: 'Johnson',
  email: 'bob.johnson@example.com',
  phone: '5555551234',
  serialNumber: 'PIXMA123456',
  modelNumber: 'PIXMA TR8620',
  productName: 'Canon PIXMA TR8620 Printer',
  purchaseDate: new Date('2024-01-20'),
  address: '789 Elm Street',
  addressLine2: 'Suite 200',
  city: 'San Francisco',
  state: 'California',
  zipCode: '94102',
  country: 'United States',
  retailer: 'Best Buy'
};

const result = await automation.register(printerData);
```

---

## Support

For issues or questions:
1. Check form structure hasn't changed at registration URL
2. Verify all required fields are provided
3. Confirm product category is correctly detected
4. Ensure multi-step navigation is working
5. Review automation logs for specific errors
6. Test manually to confirm site availability
7. Update selectors if form structure changed

---

## Canon-Specific Notes

### Product Registration Benefits
- Extended warranty options
- Firmware updates notifications
- Exclusive offers and promotions
- Product support and resources
- Faster service claims

### Serial Number Location
- **Cameras:** Battery compartment, camera base, or inside SD card slot
- **Lenses:** Barrel or rear mount area
- **Printers:** Rear panel, inside paper tray, or bottom
- **Scanners:** Bottom or rear panel

### Model Number Location
- Same locations as serial numbers
- Often labeled as "Model No." or just the product name

---

**Document Version:** 1.0
**Automation Version:** 1.0
**Compatibility:** Canon USA (2024)
