# Device Capture System - Quick Start Guide

## Get Started in 5 Minutes

### 1. Run Database Migration

```bash
cd website
npx prisma migrate dev --name add_device_info_system
npx prisma generate
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Registration Flow

Visit: http://localhost:3000/register

## Key Files

| File | Purpose |
|------|---------|
| `src/components/RegistrationWizard.tsx` | Main registration wizard |
| `src/components/UserInfoForm.tsx` | User contact form |
| `src/components/DeviceCapture.tsx` | Device detection component |
| `src/lib/device-detector.ts` | Device detection utilities |
| `src/lib/data-package-generator.ts` | Export to JSON/XML/CSV |
| `src/app/api/device-info/route.ts` | Device API endpoint |
| `src/app/api/registration/submit/route.ts` | Registration API |

## Common Tasks

### Capture Device Info

```typescript
import { collectDeviceInfo } from '@/lib/device-detector';

const deviceInfo = collectDeviceInfo();
```

### Create Registration

```typescript
import { registrationService } from '@/lib/services/registration-service';

const { registration, product } = await registrationService.createRegistration({
  userId: 'user123',
  productInfo: { productName: '...', manufacturer: '...' },
  userInfo: { firstName: '...', lastName: '...', email: '...' },
  deviceInfo: { deviceFingerprint: '...' }
});
```

### Export Data Package

```typescript
import { downloadDataPackage } from '@/lib/data-package-generator';

downloadDataPackage(dataPackage, { format: 'json' });
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/device-info` | POST | Store device info |
| `/api/device-info` | GET | Parse from headers |
| `/api/registration/submit` | POST | Submit registration |
| `/api/registration/export?id=X&format=Y` | GET | Export data |

## Database Models

- **DeviceInfo** - Device fingerprints and capabilities
- **Product** - Products with linked device info
- **Registration** - Registrations with device and data packages
- **WarrantyContract** - Warranty contracts

## Need Help?

- Documentation: `docs/DEVICE-CAPTURE-SYSTEM.md`
- Migration Guide: `docs/MIGRATION-GUIDE.md`
- Implementation Summary: `../DEVICE-CAPTURE-IMPLEMENTATION.md`
