# Whirlpool Corporation Automation Implementation

**Status:** ✅ Implemented
**Last Updated:** 2025-11-12
**Automation Type:** Reliable
**Estimated Success Rate:** 80%

## Overview

The Whirlpool automation connector handles warranty registration for all Whirlpool Corporation brands using their unified registration portal. This single automation supports multiple appliance brands owned by Whirlpool Corporation.

## Supported Brands

All Whirlpool Corporation brands use the same registration portal and process:

- ✅ **Whirlpool** - Full line of appliances
- ✅ **KitchenAid** - Premium kitchen appliances
- ✅ **Maytag** - Dependable home appliances
- ✅ **Amana** - Value-priced appliances
- ✅ **Jenn-Air** - Luxury kitchen appliances

## Supported Products

### Refrigeration
- Refrigerators (French Door, Side-by-Side, Top Freezer, Bottom Freezer)
- Freezers (Upright, Chest)
- Ice Makers

### Cooking
- Ranges (Gas, Electric, Dual Fuel)
- Wall Ovens (Single, Double)
- Cooktops (Gas, Electric, Induction)
- Microwaves (Countertop, Over-the-Range, Built-in)
- Range Hoods

### Cleaning
- Dishwashers (Built-in, Portable)
- Trash Compactors
- Disposers

### Laundry
- Washers (Front Load, Top Load)
- Dryers (Electric, Gas)
- Washer/Dryer Combos
- Pedestals & Accessories

### Other
- Water Filtration Systems
- Small Appliances

## Registration URL

```
https://www.whirlpool.com/services/registration.html
```

Note: KitchenAid, Maytag, and other brands redirect to the same unified Whirlpool registration system.

## Required Fields

The following fields are **required** for successful registration:

- `firstName` - Customer's first name
- `lastName` - Customer's last name
- `email` - Valid email address
- `serialNumber` - Appliance serial number
- `modelNumber` - Model number
- `address` - Street address
- `city` - City
- `state` - State (2-letter code or full name)
- `zipCode` - ZIP/postal code
- `purchaseDate` - Date of purchase (YYYY-MM-DD format)

## Optional Fields

These fields enhance the registration but are not required:

- `phone` - Contact phone number
- `country` - Country (defaults to United States)
- `retailer` - Store/dealer name where purchased

## Form Structure

### Initial Flow
1. Cookie consent handling (OneTrust)
2. Navigate to registration page
3. Product information validation

### Step 1: Product Information
- Model Number input
- Serial Number input
- Product Type selection (auto-detected when possible)
- Product validation

### Step 2: Personal Information
- First Name
- Last Name
- Email address
- Email confirmation (if present)
- Phone number (optional)

### Step 3: Address Information
- Country (defaults to US)
- Street address
- City
- State (dropdown or text input)
- ZIP code

### Step 4: Purchase Information
- Purchase date (single field or split month/day/year)
- Retailer/store name (optional)

### Step 5: Marketing Preferences
- Newsletter opt-in/out (defaults to opt-out)
- Promotional emails (defaults to opt-out)

## Special Features

### Multi-Brand Support
The automation automatically handles all Whirlpool Corporation brands:
- Single codebase for Whirlpool, KitchenAid, Maytag, Amana, Jenn-Air
- Brand-specific URLs redirect to unified portal
- No brand-specific customization needed

### Product Type Detection
Intelligent product type detection based on model number or product name:
- Automatically detects: Refrigerators, Dishwashers, Ranges, Washers, Dryers, Microwaves, Freezers
- Handles product type dropdown when present
- Falls back gracefully if detection not required

### Cookie Consent Handling
- Automatically accepts OneTrust cookie banners
- Supports multiple cookie consent frameworks
- Handles "Accept All" and "I Accept" variations

### Product Validation
- Waits for server-side product validation
- Detects loading indicators
- Checks for validation errors
- Throws descriptive errors for invalid products

### Email Confirmation
- Automatically fills email confirmation fields
- Ensures consistency between email and confirmation

### Date Handling
- Supports single date input field (YYYY-MM-DD)
- Handles split date fields (month/day/year dropdowns)
- Converts between date formats automatically

### State Selection
- Handles both dropdown and text input for states
- Supports full state names and abbreviations
- Converts between formats automatically

### Marketing Preferences
- Unchecks marketing opt-in checkboxes by default
- Protects user privacy
- Handles newsletter and promotional email preferences

## Success Verification

The automation verifies successful registration by checking for:

1. **Success URLs**: `/confirmation`, `/success`, `/thank-you`, `/complete`, `/registered`
2. **Success Messages**: "Thank you", "Successfully registered", "Registration complete", "Confirmation"
3. **Visual Elements**: Success banners, confirmation pages, checkmarks
4. **Already Registered**: "Already registered" messages (counted as success)
5. **Confirmation Codes**: Extracts confirmation/reference numbers when available

## Error Handling

### Common Issues

1. **Invalid Model Number**
   - **Error**: "Product not found" or "Invalid model number"
   - **Action**: Returns validation error to user
   - **Solution**: Verify model number format (usually on rating plate inside appliance)
   - **Example**: `WRF535SWHZ` (Whirlpool refrigerator)

2. **Invalid Serial Number**
   - **Error**: "Serial number not found" or "Format invalid"
   - **Action**: Returns validation error to user
   - **Solution**: Check serial number location (usually on rating plate)
   - **Example**: 10-character alphanumeric

3. **Duplicate Registration**
   - **Error**: "Product already registered"
   - **Action**: Returns success with note about existing registration
   - **Note**: Whirlpool allows warranty status check without re-registering

4. **Product Type Required**
   - **Error**: "Please select product type"
   - **Action**: Automation attempts to auto-detect from model/name
   - **Solution**: Ensure product type can be inferred from model number

5. **Form Timeout**
   - **Error**: Page load timeout or validation timeout
   - **Action**: Retries with exponential backoff
   - **Note**: Whirlpool's servers may be slow during peak hours

6. **Invalid Purchase Date**
   - **Error**: "Purchase date must be within X years"
   - **Action**: Returns validation error
   - **Solution**: Verify purchase date is accurate and not too old

## CAPTCHA Detection

- **Frequency**: Rare, mainly during high traffic periods
- **Types**: reCAPTCHA v2/v3, hCAPTCHA
- **Handling**: Automation detects and reports CAPTCHA presence for manual completion

## Testing

### Test Data Requirements

```typescript
const testData: RegistrationData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "555-123-4567",              // Optional
  serialNumber: "WP1234567A",          // 10 characters, alphanumeric
  modelNumber: "WRF535SWHZ",           // Whirlpool refrigerator model
  address: "123 Main Street",
  city: "Benton Harbor",
  state: "MI",                         // Michigan (or "Michigan")
  zipCode: "49022",
  country: "United States",            // Optional (defaults to US)
  purchaseDate: "2024-06-15",          // YYYY-MM-DD
  retailer: "Lowe's"                   // Optional
};
```

### Whirlpool Model Number Format

Model numbers vary by product type:

**Refrigerators**:
- Whirlpool: `WRF535SWHZ`, `WRS325SDHZ`
- KitchenAid: `KRFF305ESS`, `KRMF706ESS`
- Maytag: `MFI2570FEZ`, `MFF2558FEZ`

**Dishwashers**:
- Whirlpool: `WDT730PAHZ`, `WDF520PADM`
- KitchenAid: `KDFE104HPS`, `KDTE334GPS`
- Maytag: `MDB4949SHZ`, `MDB7959SKZ`

**Washers**:
- Whirlpool: `WFW5620HW`, `WTW7120HW`
- Maytag: `MHW5630HW`, `MVWC565FW`

**Dryers**:
- Whirlpool: `WED5620HW`, `WGD5620HW`
- Maytag: `MED5630HW`, `MGD5630HW`

### Serial Number Format

Whirlpool serial numbers are typically:
- **Length**: 10 characters
- **Format**: Mix of letters and numbers
- **Example**: `WP1234567A`, `F12345678`, `C98765432B`
- **Location**: Rating plate inside appliance door, on back, or inside control panel

### Manual Testing Steps

1. Verify model number matches Whirlpool format for product type
2. Ensure serial number is from actual Whirlpool product
3. Test with different Whirlpool brands (Whirlpool, KitchenAid, Maytag)
4. Test with and without optional retailer field
5. Verify marketing preferences are unchecked
6. Test date field handling (both single and split formats)
7. Verify state selection works with both abbreviations and full names

## Performance

- **Average Execution Time**: 25-35 seconds
- **Network Calls**: 5-7 requests
- **Screenshot Captures**: 2 (before submit, after submit)
- **Retry Attempts**: Up to 3 on transient failures
- **Timeout**: 30 seconds per step

## Known Limitations

1. **Product Validation Strict**: Model and serial must exactly match Whirlpool database
2. **Purchase Date Window**: Some products require registration within X years of purchase
3. **US Market Focus**: Currently optimized for US registration portal
4. **Product Type Detection**: May not detect all product types automatically
5. **Brand-Specific Fields**: Some premium brands (Jenn-Air) may have additional fields

## Product Categories by Brand

### Whirlpool
- **Kitchen**: Refrigerators, Dishwashers, Ranges, Microwaves, Hoods
- **Laundry**: Washers, Dryers, All-in-One
- **Other**: Freezers, Trash Compactors, Water Filters

### KitchenAid
- **Premium Kitchen**: Professional Ranges, Built-in Refrigerators, Wine Cellars
- **Cooking**: Wall Ovens, Cooktops, Ranges
- **Cleanup**: Dishwashers
- **Small Appliances**: Mixers, Food Processors, Blenders

### Maytag
- **Laundry**: Commercial-grade Washers & Dryers
- **Kitchen**: Durable Dishwashers, Refrigerators, Ranges
- **Focus**: Dependability and longevity

### Amana
- **Budget-Friendly**: Value-priced appliances
- **Full Line**: Refrigerators, Ranges, Dishwashers, Laundry

### Jenn-Air
- **Luxury Kitchen**: High-end built-in appliances
- **Specialty**: Column refrigerators, Pro-style ranges
- **Design**: Premium finishes and features

## Serial Number & Model Number Location

### Refrigerators
- **Serial Number**: Inside fresh food compartment, upper left corner
- **Model Number**: Same location as serial number
- **Also Check**: Back of unit near bottom

### Dishwashers
- **Serial Number**: Inside door frame on left or right side
- **Model Number**: Same location as serial number

### Ranges
- **Serial Number**: Inside oven door frame or drawer
- **Model Number**: Behind storage drawer or on back

### Washers & Dryers
- **Serial Number**: Inside door opening or on back
- **Model Number**: Same location as serial number

## Usage Example

```typescript
import { WhirlpoolAutomation } from '@/automation/manufacturers/WhirlpoolAutomation';

const automation = new WhirlpoolAutomation();

// Works for all Whirlpool Corporation brands
const registrationData = {
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.j@example.com",
  phone: "555-789-0123",
  serialNumber: "KA9876543B",         // KitchenAid serial
  modelNumber: "KRFF305ESS",          // KitchenAid refrigerator
  address: "456 Oak Avenue",
  city: "Chicago",
  state: "Illinois",
  zipCode: "60601",
  purchaseDate: "2024-07-20",
  retailer: "Best Buy"
};

try {
  const result = await automation.execute(registrationData);
  if (result.success) {
    console.log('Whirlpool product registered successfully!');
    if (result.confirmationCode) {
      console.log('Confirmation code:', result.confirmationCode);
    }
  }
} catch (error) {
  console.error('Registration failed:', error.message);
  // Handle error (e.g., invalid model, duplicate registration)
}
```

## Monitoring Integration

The Whirlpool automation integrates with the Phase 3 monitoring system:

```typescript
import { metricsCollector, MetricType } from '@/lib/monitoring';

// Metrics are automatically recorded:
// - automation_success / automation_failure
// - Latency measurements (product validation, form submission)
// - Error categorization (invalid_product, duplicate, timeout, etc.)
// - Brand-specific success rates (Whirlpool vs KitchenAid vs Maytag)
```

## Troubleshooting

### Model Number Not Accepted
- Verify model number format matches brand's convention
- Check if product is from a Whirlpool Corporation brand
- Some older models may not be in the database
- Try finding model number on rating plate inside appliance

### Serial Number Validation Failed
- Ensure serial number is typed correctly (avoid O/0, I/1 confusion)
- Check serial number location on physical appliance
- Serial format may vary by product age
- Some refurbished units may have different formats

### Product Type Selection Error
- Manual product type selection may be required
- Automation attempts auto-detection but may not cover all types
- Check if model number clearly indicates product type

### Purchase Date Too Old
- Some products must be registered within warranty period
- Standard appliance warranties are typically 1 year
- Extended warranties may have different registration requirements

### Form Timeout During Validation
- Whirlpool's product database may be slow to respond
- Increase timeout setting in automation config
- Retry during off-peak hours (avoid evenings/weekends)

## Future Improvements

- [ ] Add support for extended warranty registration
- [ ] Handle proof of purchase upload
- [ ] Support for Whirlpool Canada and international portals
- [ ] Add support for commercial products
- [ ] Integration with Whirlpool smart appliance ecosystem
- [ ] Support for service plan enrollment during registration
- [ ] Handle product bundles (matching appliances)

## Support

For issues or questions about Whirlpool automation:
1. Check automation logs for detailed error messages
2. Verify model and serial are from actual Whirlpool product
3. Review screenshots in automation output folder
4. Check Whirlpool's website directly to see registration flow
5. Review monitoring dashboard for brand-specific success rates

## Related Documentation

- Whirlpool Support: https://www.whirlpool.com/support.html
- KitchenAid Support: https://www.kitchenaid.com/support.html
- Maytag Support: https://www.maytag.com/support.html
- Amana Support: https://www.amana.com/support.html
- Jenn-Air Support: https://www.jennair.com/support.html

## Warranty Information

Standard warranty terms for Whirlpool Corporation brands:
- **Parts & Labor**: 1 year from date of purchase
- **Extended Coverage**: Varies by product (compressors, motors, etc.)
- **Registration Benefits**: Easier warranty claims, product updates, recalls
- **Service Network**: Nationwide authorized service providers

## Changelog

### 2025-11-12 - Initial Implementation
- ✅ Created Whirlpool automation connector
- ✅ Multi-brand support (Whirlpool, KitchenAid, Maytag, Amana, Jenn-Air)
- ✅ Intelligent product type detection
- ✅ Cookie consent handling
- ✅ Product validation with error detection
- ✅ Email confirmation auto-fill
- ✅ Split date field handling
- ✅ State name/abbreviation conversion
- ✅ Marketing opt-out by default
- ✅ Success verification with multiple methods
- ✅ Confirmation code extraction
- ✅ Registered in ManufacturerRegistry
