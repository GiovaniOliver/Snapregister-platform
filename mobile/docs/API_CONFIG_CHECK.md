# Mobile App API Configuration - All Locations Checked

## Summary of Issues Found and Fixed

### ✅ Issues Fixed:

1. **Default Port Changed**: Updated from port 3000 → 3004 to match `npm run dev:mobile`
   - File: `mobile/src/config/api.ts`
   - Changed: `DEFAULT_DEV_BASE_URL` from `http://localhost:3000` to `http://localhost:3004`

2. **Inconsistent Config Imports**: Fixed services using legacy `env.ts` instead of `api.ts`
   - File: `mobile/src/services/imageService.ts` - Now uses `../config/api`
   - File: `mobile/src/services/aiService.ts` - Now uses `../config/api`
   - File: `mobile/src/__tests__/api.test.ts` - Now uses `../config/api`

3. **Updated Comments**: Updated example URLs to use port 3004

## All API Configuration Locations

### Primary Configuration (✅ USE THIS)
**File**: `mobile/src/config/api.ts`
- **Default Port**: 3004 (matches `npm run dev:mobile`)
- **Environment Variable**: `EXPO_PUBLIC_API_URL`
- **Fallback**: `http://localhost:3004`
- **Used By**: Most services (authService, productService, warrantyService, api.ts)

### Legacy Configuration (⚠️ DEPRECATED - Still exists for compatibility)
**File**: `mobile/src/config/env.ts`
- **Default Port**: 3000 (OLD - don't use)
- **Status**: Marked as deprecated, but still imported by some old code
- **Note**: Should migrate all code to use `api.ts` instead

## Services Using API Config

### ✅ Using Correct Config (`api.ts`):
- `mobile/src/services/api.ts` - Main API service
- `mobile/src/services/authService.ts` - Authentication
- `mobile/src/services/productService.ts` - Products
- `mobile/src/services/warrantyService.ts` - Warranties
- `mobile/src/services/imageService.ts` - **FIXED** - Now uses `api.ts`
- `mobile/src/services/aiService.ts` - **FIXED** - Now uses `api.ts`

### ⚠️ Still Using Legacy (`env.ts`):
- None (all fixed!)

## Environment Variables

### Required in `.env` file:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP:3004
ENVIRONMENT=dev
```

### How It Works:
1. App checks `process.env.EXPO_PUBLIC_API_URL` first
2. If not set, uses default: `http://localhost:3004`
3. Android emulator: Auto-converts `localhost` → `10.0.2.2`
4. iOS/Physical: Use your actual IP address

## Port Configuration

### Backend Server (Website):
- **Command**: `npm run dev:mobile`
- **Port**: 3004
- **URL**: `http://localhost:3004`

### Mobile App Default:
- **Port**: 3004 (matches backend)
- **Can override**: Set `EXPO_PUBLIC_API_URL` in `.env`

## Verification Checklist

- [x] Default port is 3004 (matches backend)
- [x] All services use `api.ts` config (not `env.ts`)
- [x] Environment variable `EXPO_PUBLIC_API_URL` is checked first
- [x] Android emulator auto-converts localhost
- [x] Comments updated with correct port
- [x] Test file uses correct import

## Next Steps

1. **Create `.env` file** in `mobile/` directory:
   ```bash
   cd mobile
   node setup-env.js  # Auto-creates .env with your IP
   ```

2. **Or manually create `.env`**:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3004
   ENVIRONMENT=dev
   ```

3. **Start backend** (Terminal 1):
   ```bash
   cd website
   npm run dev:mobile
   ```

4. **Start mobile app** (Terminal 2):
   ```bash
   cd mobile
   npm start -- --clear
   ```

## Debugging

Check console logs for:
```
[API Config] Environment: dev
[API Config] Platform: ios/android
[API Config] Base URL: http://...
[API Config] API URL: http://.../api
```

If you see `localhost:3000`, the environment variable isn't being read. Make sure:
- `.env` file exists in `mobile/` directory
- Restart Expo after creating/changing `.env`
- Use `npm start -- --clear` to clear cache

