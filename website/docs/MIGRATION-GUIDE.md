# Device Information Capture System - Migration Guide

## Overview

This guide walks you through updating your SnapRegister database to support the new Device Information Capture System.

## Prerequisites

- Backup your existing database
- Ensure Prisma CLI is installed: `npm install prisma --save-dev`
- Node.js 18+ installed

## Step-by-Step Migration

### Step 1: Backup Current Database

```bash
# For SQLite (development)
cp prisma/dev.db prisma/dev.db.backup

# For PostgreSQL (production)
pg_dump -U your_username -d snapregister > backup_$(date +%Y%m%d).sql
```

### Step 2: Update Prisma Schema

The schema has already been updated in `prisma/schema.prisma` with:
- New `DeviceInfo` model
- New `WarrantyContract` model
- Updated `Product` model with `deviceInfoId` field
- Updated `Registration` model with device and data package fields

### Step 3: Generate Migration

```bash
# Generate a new migration
npx prisma migrate dev --name add_device_info_system

# This will:
# 1. Create the DeviceInfo table
# 2. Create the WarrantyContract table
# 3. Add deviceInfoId to Product table
# 4. Add deviceInfoId, contactData, and dataPackage fields to Registration table
# 5. Create necessary indexes
```

### Step 4: Generate Prisma Client

```bash
# Regenerate Prisma Client with new types
npx prisma generate
```

### Step 5: Verify Migration

```bash
# Open Prisma Studio to verify tables
npx prisma studio

# Check that these tables exist:
# - DeviceInfo
# - WarrantyContract
# - Updated Product (with deviceInfoId)
# - Updated Registration (with new fields)
```

## Database Changes Summary

### New Tables

#### DeviceInfo
```sql
CREATE TABLE "DeviceInfo" (
  "id" TEXT PRIMARY KEY,
  "deviceFingerprint" TEXT UNIQUE NOT NULL,
  "userAgent" TEXT NOT NULL,
  "browserName" TEXT,
  "browserVersion" TEXT,
  "browserEngine" TEXT,
  "osName" TEXT,
  "osVersion" TEXT,
  "osPlatform" TEXT,
  "deviceType" TEXT NOT NULL,
  "deviceVendor" TEXT,
  "deviceModel" TEXT,
  "screenWidth" INTEGER,
  "screenHeight" INTEGER,
  "screenPixelRatio" REAL,
  "colorDepth" INTEGER,
  "touchSupport" BOOLEAN DEFAULT false,
  "javaScriptEnabled" BOOLEAN DEFAULT true,
  "cookiesEnabled" BOOLEAN DEFAULT true,
  "connectionType" TEXT,
  "effectiveType" TEXT,
  "timezone" TEXT,
  "language" TEXT,
  "country" TEXT,
  "metadata" TEXT,
  "firstSeen" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "lastSeen" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DeviceInfo_deviceFingerprint_idx" ON "DeviceInfo"("deviceFingerprint");
CREATE INDEX "DeviceInfo_deviceType_idx" ON "DeviceInfo"("deviceType");
CREATE INDEX "DeviceInfo_firstSeen_idx" ON "DeviceInfo"("firstSeen");
```

#### WarrantyContract
```sql
CREATE TABLE "WarrantyContract" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "contractNumber" TEXT UNIQUE,
  "provider" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "coverageStart" DATETIME NOT NULL,
  "coverageEnd" DATETIME NOT NULL,
  "termMonths" INTEGER NOT NULL,
  "termsUrl" TEXT,
  "termsDocument" TEXT,
  "claimProcess" TEXT,
  "supportPhone" TEXT,
  "supportEmail" TEXT,
  "claimUrl" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "metadata" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "WarrantyContract_userId_idx" ON "WarrantyContract"("userId");
CREATE INDEX "WarrantyContract_status_idx" ON "WarrantyContract"("status");
CREATE INDEX "WarrantyContract_coverageEnd_idx" ON "WarrantyContract"("coverageEnd");
```

### Updated Tables

#### Product Table - New Fields
```sql
ALTER TABLE "Product" ADD COLUMN "deviceInfoId" TEXT;
ALTER TABLE "Product" ADD COLUMN "warrantyContractId" TEXT UNIQUE;

CREATE INDEX "Product_deviceInfoId_idx" ON "Product"("deviceInfoId");
```

#### Registration Table - New Fields
```sql
ALTER TABLE "Registration" ADD COLUMN "deviceInfoId" TEXT;
ALTER TABLE "Registration" ADD COLUMN "contactData" TEXT;
ALTER TABLE "Registration" ADD COLUMN "dataPackage" TEXT;
ALTER TABLE "Registration" ADD COLUMN "dataPackageFormat" TEXT;

CREATE INDEX "Registration_deviceInfoId_idx" ON "Registration"("deviceInfoId");
```

## Data Migration Scripts

### Migrate Existing User Data to WarrantyContracts

If you have existing warranty data in the Product table:

```typescript
// scripts/migrate-warranties.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateWarranties() {
  const products = await prisma.product.findMany({
    where: {
      warrantyExpiry: { not: null },
      warrantyContractId: null
    }
  });

  for (const product of products) {
    if (!product.warrantyExpiry || !product.warrantyStartDate) continue;

    const warranty = await prisma.warrantyContract.create({
      data: {
        userId: product.userId,
        provider: product.manufacturer,
        type: product.warrantyType || 'MANUFACTURER',
        coverageStart: product.warrantyStartDate,
        coverageEnd: product.warrantyExpiry,
        termMonths: product.warrantyDuration || 12,
        status: new Date() < product.warrantyExpiry ? 'ACTIVE' : 'EXPIRED'
      }
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { warrantyContractId: warranty.id }
    });
  }

  console.log(`Migrated ${products.length} warranties`);
}

migrateWarranties()
  .then(() => prisma.$disconnect())
  .catch(console.error);
```

Run the migration:
```bash
npx tsx scripts/migrate-warranties.ts
```

### Backfill Device Information

For existing registrations without device info:

```typescript
// scripts/backfill-devices.ts
import { PrismaClient } from '@prisma/client';
import { parseDeviceInfoFromUserAgent } from '@/lib/device-detector';

const prisma = new PrismaClient();

async function backfillDevices() {
  const registrations = await prisma.registration.findMany({
    where: { deviceInfoId: null }
  });

  for (const registration of registrations) {
    // Attempt to extract from user agent if available
    // Note: You may not have historical user agents
    const userAgent = 'Unknown/Legacy Registration';

    const deviceInfo = parseDeviceInfoFromUserAgent(userAgent);

    // Create a placeholder device record
    const device = await prisma.deviceInfo.create({
      data: {
        deviceFingerprint: `legacy-${registration.id}`,
        userAgent,
        deviceType: 'UNKNOWN',
        browserName: deviceInfo.browserName,
        osName: deviceInfo.osName,
        touchSupport: false,
        javaScriptEnabled: true,
        cookiesEnabled: true,
        metadata: JSON.stringify({ legacy: true })
      }
    });

    await prisma.registration.update({
      where: { id: registration.id },
      data: { deviceInfoId: device.id }
    });
  }

  console.log(`Backfilled ${registrations.length} device records`);
}

backfillDevices()
  .then(() => prisma.$disconnect())
  .catch(console.error);
```

## Rollback Procedure

If you need to rollback the migration:

```bash
# For development (SQLite)
cp prisma/dev.db.backup prisma/dev.db

# For production (PostgreSQL)
# Restore from backup
psql -U your_username -d snapregister < backup_YYYYMMDD.sql
```

Or use Prisma migrate rollback:

```bash
# View migration history
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back add_device_info_system
```

## Production Deployment

### Step 1: Deploy Schema Changes

```bash
# Push schema changes to production database
npx prisma migrate deploy
```

### Step 2: Verify in Production

```bash
# Check migration status
npx prisma migrate status

# Expected output:
# ✓ add_device_info_system (applied)
```

### Step 3: Monitor Application

- Check error logs for any issues
- Monitor API response times
- Verify new registrations capture device info
- Test data export functionality

## Verification Checklist

- [ ] Backup created successfully
- [ ] Migration applied without errors
- [ ] DeviceInfo table exists with correct columns
- [ ] WarrantyContract table exists
- [ ] Product table has deviceInfoId column
- [ ] Registration table has new fields
- [ ] All indexes created
- [ ] Foreign keys working
- [ ] Prisma Client regenerated
- [ ] Application starts without errors
- [ ] Device detection API works
- [ ] Registration submission works
- [ ] Data export works in all formats

## Troubleshooting

### Issue: Migration Fails with Foreign Key Error

**Solution**: Ensure no orphaned records exist before migration
```sql
-- Check for orphaned products
SELECT * FROM Product WHERE userId NOT IN (SELECT id FROM User);

-- Delete orphaned records
DELETE FROM Product WHERE userId NOT IN (SELECT id FROM User);
```

### Issue: DeviceInfo Index Already Exists

**Solution**: Drop existing index before migration
```sql
DROP INDEX IF EXISTS DeviceInfo_deviceFingerprint_idx;
```

### Issue: Prisma Client Out of Sync

**Solution**: Regenerate Prisma Client
```bash
npx prisma generate --force
```

### Issue: TypeScript Errors After Migration

**Solution**: Restart TypeScript server
```bash
# In VSCode: Cmd/Ctrl + Shift + P > TypeScript: Restart TS Server
```

## Performance Considerations

### Indexes

The migration adds these indexes for performance:
- `DeviceInfo.deviceFingerprint` - Fast device lookup
- `DeviceInfo.deviceType` - Filter by device type
- `DeviceInfo.firstSeen` - Temporal queries
- `Product.deviceInfoId` - Join performance
- `Registration.deviceInfoId` - Join performance

### Database Size

Estimated additional storage per registration:
- DeviceInfo record: ~2-3 KB
- Updated Registration fields: ~5-10 KB (with data package)
- Total: ~7-13 KB additional per registration

For 10,000 registrations: ~70-130 MB additional storage

### Query Performance

Monitor these queries after migration:
```sql
-- Device lookup (should use index)
EXPLAIN QUERY PLAN
SELECT * FROM DeviceInfo WHERE deviceFingerprint = ?;

-- Registration with device join
EXPLAIN QUERY PLAN
SELECT * FROM Registration r
LEFT JOIN DeviceInfo d ON r.deviceInfoId = d.id
WHERE r.userId = ?;
```

## Support

If you encounter issues during migration:
1. Check the [troubleshooting section](#troubleshooting) above
2. Review Prisma migration logs in `prisma/migrations/`
3. Contact support at support@snapregister.com

## Next Steps

After successful migration:
1. Deploy updated application code
2. Test device capture flow end-to-end
3. Monitor device statistics dashboard
4. Configure data export automation
5. Set up warranty expiration notifications
