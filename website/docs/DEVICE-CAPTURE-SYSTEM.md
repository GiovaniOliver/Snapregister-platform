# Device Information Capture System

## Overview

The Device Information Capture System is a comprehensive solution for collecting, storing, and managing device data during product warranty registration. This system enhances warranty validation, fraud detection, and provides manufacturers with valuable insights about their customers' devices.

## Features

### 1. Device Detection System
- **Automatic Detection**: Captures device information automatically when users access the registration flow
- **Comprehensive Data**: Collects browser, OS, device type, screen resolution, and capabilities
- **Fingerprinting**: Generates unique device fingerprints for warranty validation
- **Privacy-Focused**: Only collects non-invasive device metadata

### 2. User Information Collection
- **Validated Forms**: Uses Zod schemas for robust input validation
- **React Hook Form**: Provides excellent UX with real-time validation
- **Auto-Save**: Automatically saves progress to localStorage
- **Encryption Ready**: Infrastructure for encrypting sensitive user data

### 3. Multi-Step Registration Wizard
- **5-Step Process**:
  1. Photo Capture (serial number, warranty card, receipt, product)
  2. AI Data Extraction Review
  3. User Information Input
  4. Device Information Auto-Capture
  5. Manufacturer Submission
- **Progress Indicator**: Visual progress bar showing completion status
- **Step Navigation**: Back/forward navigation with state preservation
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

### 4. Data Package Generation
- **Multiple Formats**: Export as JSON, XML, or CSV
- **Standardized Structure**: Consistent data format for manufacturer APIs
- **Validation**: Ensures data completeness before submission
- **Download Options**: Users can download their registration data

### 5. Database Architecture
- **DeviceInfo Table**: Stores comprehensive device information
- **Product-Device Linking**: Associates products with the device used for registration
- **Registration-Device Linking**: Tracks which device was used for each registration
- **Efficient Indexing**: Optimized queries for device lookups

## Architecture

### Frontend Components

#### RegistrationWizard
Main orchestrator component managing the entire registration flow.

**Location**: `src/components/RegistrationWizard.tsx`

**Features**:
- State management with auto-save
- Step navigation
- Form data aggregation
- API integration

#### RegistrationProgress
Visual progress indicator showing current step and completion status.

**Location**: `src/components/RegistrationProgress.tsx`

**Features**:
- 5-step progress bar
- Current/completed/pending states
- Responsive design
- Smooth animations

#### UserInfoForm
Comprehensive user contact information form with validation.

**Location**: `src/components/UserInfoForm.tsx`

**Features**:
- Name, email, phone validation
- Address collection
- Country selection
- Real-time error messages

#### DeviceCapture
Automatic device information detection and display component.

**Location**: `src/components/DeviceCapture.tsx`

**Features**:
- Automatic device detection
- Device information display
- Capability detection
- Privacy notice

### Backend Services

#### DeviceService
Database operations for device information management.

**Location**: `src/lib/services/device-service.ts`

**Methods**:
- `findByFingerprint()`: Find device by fingerprint
- `create()`: Create new device record
- `findOrCreate()`: Upsert device information
- `getStatistics()`: Device analytics
- `deleteOldDevices()`: Cleanup old records

#### RegistrationService
Business logic for product registration.

**Location**: `src/lib/services/registration-service.ts`

**Methods**:
- `createRegistration()`: Create complete registration
- `getRegistration()`: Fetch registration details
- `getUserRegistrations()`: Get user's registrations
- `updateStatus()`: Update registration status
- `exportDataPackage()`: Export data in various formats

### Utilities

#### device-detector.ts
Comprehensive device detection and fingerprinting.

**Location**: `src/lib/device-detector.ts`

**Functions**:
- `parseBrowserInfo()`: Extract browser details from user agent
- `parseOSInfo()`: Extract OS information
- `getDeviceType()`: Determine device category
- `getDeviceModel()`: Extract device vendor/model
- `generateDeviceFingerprint()`: Create unique device hash
- `collectDeviceInfo()`: Client-side comprehensive data collection
- `parseDeviceInfoFromUserAgent()`: Server-side user agent parsing

#### data-package-generator.ts
Generate standardized data packages for manufacturers.

**Location**: `src/lib/data-package-generator.ts`

**Functions**:
- `generateManufacturerDataPackage()`: Create data package
- `exportAsJSON()`: Export as JSON
- `exportAsXML()`: Export as XML
- `exportAsCSV()`: Export as CSV
- `validateDataPackage()`: Validate completeness
- `downloadDataPackage()`: Trigger browser download

#### validation.ts
Zod schemas for form validation.

**Location**: `src/lib/validation.ts`

**Schemas**:
- `userContactInfoSchema`: User information validation
- `productInfoSchema`: Product information validation
- `deviceInfoSchema`: Device information validation
- `registrationFormSchema`: Complete registration validation

## API Routes

### POST /api/device-info
Store device information in database.

**Request Body**:
```json
{
  "deviceFingerprint": "abc123...",
  "userAgent": "Mozilla/5.0...",
  "browserName": "Chrome",
  "browserVersion": "120.0",
  "osName": "Windows",
  "osVersion": "10",
  "deviceType": "DESKTOP",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "touchSupport": false,
  "timezone": "America/New_York",
  "language": "en-US"
}
```

**Response**:
```json
{
  "success": true,
  "deviceInfo": {
    "id": "clx123...",
    "deviceFingerprint": "abc123...",
    "deviceType": "DESKTOP",
    "isNew": true
  }
}
```

### GET /api/device-info
Parse device information from request headers.

**Response**:
```json
{
  "success": true,
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "browserName": "Chrome",
    "osName": "Windows",
    "deviceType": "DESKTOP"
  }
}
```

### POST /api/registration/submit
Submit complete product registration.

**Request Body**:
```json
{
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "productInfo": {
    "productName": "KitchenAid Stand Mixer",
    "manufacturer": "KitchenAid",
    "modelNumber": "KSM150PSER",
    "serialNumber": "W12345678",
    "purchaseDate": "2024-01-15",
    "purchasePrice": 379.99,
    "retailer": "Best Buy"
  },
  "deviceInfo": {
    "deviceFingerprint": "abc123..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "registration": {
    "id": "clx456...",
    "productId": "clx789...",
    "status": "PENDING",
    "dataPackage": {...}
  },
  "message": "Registration submitted successfully"
}
```

### GET /api/registration/export
Export registration data package.

**Query Parameters**:
- `id`: Registration ID (required)
- `format`: Export format - json, xml, or csv (default: json)

**Response**: File download with appropriate content type

## Database Schema

### DeviceInfo Table
```prisma
model DeviceInfo {
  id                String   @id @default(cuid())
  deviceFingerprint String   @unique
  userAgent         String

  // Browser
  browserName       String?
  browserVersion    String?
  browserEngine     String?

  // OS
  osName            String?
  osVersion         String?
  osPlatform        String?

  // Device
  deviceType        DeviceType
  deviceVendor      String?
  deviceModel       String?

  // Screen
  screenWidth       Int?
  screenHeight      Int?
  screenPixelRatio  Float?
  colorDepth        Int?

  // Capabilities
  touchSupport      Boolean  @default(false)
  javaScriptEnabled Boolean  @default(true)
  cookiesEnabled    Boolean  @default(true)

  // Network
  connectionType    String?
  effectiveType     String?

  // Location
  timezone          String?
  language          String?
  country           String?

  // Metadata
  metadata          String?

  // Timestamps
  firstSeen         DateTime @default(now())
  lastSeen          DateTime @updatedAt

  // Relations
  products          Product[]
  registrations     Registration[]
}
```

### Enhanced Product Table
```prisma
model Product {
  // ... existing fields ...

  deviceInfoId    String?  // NEW
  deviceInfo      DeviceInfo? @relation(fields: [deviceInfoId], references: [id])
}
```

### Enhanced Registration Table
```prisma
model Registration {
  // ... existing fields ...

  deviceInfoId      String?  // NEW
  contactData       String?  // NEW - Encrypted user contact
  dataPackage       String?  // NEW - Complete data package
  dataPackageFormat String?  // NEW - json, xml, csv

  deviceInfo        DeviceInfo? @relation(fields: [deviceInfoId], references: [id])
}
```

## Usage Examples

### Basic Registration Flow

```typescript
import RegistrationWizard from '@/components/RegistrationWizard';

export default function RegisterPage() {
  const productData = {
    productName: 'KitchenAid Stand Mixer',
    manufacturer: 'KitchenAid',
    modelNumber: 'KSM150PSER',
    serialNumber: 'W12345678'
  };

  return <RegistrationWizard initialProductData={productData} />;
}
```

### Manual Device Detection

```typescript
import { collectDeviceInfo } from '@/lib/device-detector';

function MyComponent() {
  const handleDetect = async () => {
    const deviceInfo = collectDeviceInfo();

    const response = await fetch('/api/device-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceInfo)
    });

    const result = await response.json();
    console.log('Device ID:', result.deviceInfo.id);
  };

  return <button onClick={handleDetect}>Detect Device</button>;
}
```

### Generate Data Package

```typescript
import { generateManufacturerDataPackage, downloadDataPackage } from '@/lib/data-package-generator';

const dataPackage = generateManufacturerDataPackage(
  productInfo,
  userInfo,
  deviceInfo
);

// Download as JSON
downloadDataPackage(dataPackage, { format: 'json', includeDeviceInfo: true });

// Download as XML
downloadDataPackage(dataPackage, { format: 'xml', includeDeviceInfo: true });

// Download as CSV
downloadDataPackage(dataPackage, { format: 'csv', includeDeviceInfo: true });
```

### Using Services

```typescript
import { deviceService } from '@/lib/services/device-service';
import { registrationService } from '@/lib/services/registration-service';

// Find or create device
const device = await deviceService.findOrCreate(deviceInfo);

// Create registration
const { registration, product } = await registrationService.createRegistration({
  userId: 'user123',
  productInfo,
  userInfo,
  deviceInfo
});

// Get statistics
const stats = await deviceService.getStatistics();
console.log('Total devices:', stats.totalDevices);
console.log('By type:', stats.byType);
```

## Security Considerations

### Data Encryption
- User contact information is encrypted before storage
- Sensitive fields (serial numbers) are encrypted in database
- HTTPS required for all API endpoints
- Encryption keys stored in environment variables

### Privacy
- Device fingerprinting is non-invasive
- No persistent tracking beyond warranty registration
- Users can opt-out of device data collection
- GDPR/CCPA compliant data handling
- Clear privacy notices displayed

### Validation
- All inputs validated with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through React's built-in escaping
- CSRF protection via Next.js

## Testing

### Unit Tests
```bash
# Test device detector
npm test src/lib/device-detector.test.ts

# Test validation schemas
npm test src/lib/validation.test.ts

# Test data package generator
npm test src/lib/data-package-generator.test.ts
```

### Integration Tests
```bash
# Test API routes
npm test src/app/api/device-info/route.test.ts
npm test src/app/api/registration/submit/route.test.ts
```

### E2E Tests
```bash
# Test registration flow
npm run test:e2e
```

## Deployment

### Environment Variables
```env
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://..."  # PostgreSQL for production

# Encryption keys
ENCRYPTION_KEY="your-256-bit-key"
ENCRYPTION_IV="your-initialization-vector"
```

### Database Migration
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# View database in Prisma Studio
npm run prisma:studio
```

### Build and Deploy
```bash
# Build application
npm run build

# Start production server
npm start
```

## Monitoring

### Device Analytics
- Track device type distribution
- Monitor browser/OS trends
- Detect unusual device patterns
- Identify potential fraud

### Performance Metrics
- Device detection latency
- API response times
- Database query performance
- Registration completion rates

## Future Enhancements

### Planned Features
1. **Advanced Fingerprinting**: Canvas fingerprinting, WebGL detection
2. **Behavioral Analysis**: Mouse movement patterns, typing speed
3. **Location Services**: IP geolocation, GPS coordinates (with permission)
4. **Multi-Device Support**: Link multiple devices to one user account
5. **Device Verification**: Two-factor authentication via device
6. **Fraud Detection**: Machine learning models for anomaly detection
7. **Real-time Sync**: WebSocket-based device status updates
8. **Mobile Apps**: Native iOS/Android device capture

### Optimization Opportunities
- Implement caching layer (Redis)
- Add CDN for static assets
- Optimize database indexes
- Implement lazy loading for components
- Add service worker for offline support

## Support

For questions or issues with the device capture system:
- Check the [troubleshooting guide](./TROUBLESHOOTING.md)
- Review [API documentation](./API-DOCS.md)
- Contact: support@snapregister.com

## License

Copyright 2024 SnapRegister. All rights reserved.
