-- Migration: Add Warranty Tracking System
-- Description: Adds warranty tracking tables and updates existing schema

-- Add index to Product.warrantyExpiry for efficient queries
CREATE INDEX IF NOT EXISTS "Product_warrantyExpiry_idx" ON "Product"("warrantyExpiry");

-- Create WarrantyPreferences table
CREATE TABLE IF NOT EXISTS "WarrantyPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder90Days" BOOLEAN NOT NULL DEFAULT true,
    "reminder30Days" BOOLEAN NOT NULL DEFAULT true,
    "reminder7Days" BOOLEAN NOT NULL DEFAULT true,
    "reminder1Day" BOOLEAN NOT NULL DEFAULT true,
    "customDays" TEXT,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "monthlyDigest" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "autoRenewReminder" BOOLEAN NOT NULL DEFAULT true,
    "lifetimeWarrantyReminder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WarrantyPreferences_userId_key" ON "WarrantyPreferences"("userId");

-- Update WarrantyContract table with additional fields
ALTER TABLE "WarrantyContract" ADD COLUMN IF NOT EXISTS "warrantyType" TEXT DEFAULT 'LIMITED';
ALTER TABLE "WarrantyContract" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "WarrantyContract" ADD COLUMN IF NOT EXISTS "renewalCount" INTEGER DEFAULT 0;

-- Create index on WarrantyContract status and dates
CREATE INDEX IF NOT EXISTS "WarrantyContract_status_idx" ON "WarrantyContract"("status");
CREATE INDEX IF NOT EXISTS "WarrantyContract_startDate_idx" ON "WarrantyContract"("startDate");

-- Create WarrantyNotification table
CREATE TABLE IF NOT EXISTS "WarrantyNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warrantyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "emailId" TEXT,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" DATETIME,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("warrantyId") REFERENCES "WarrantyContract"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "WarrantyNotification_warrantyId_idx" ON "WarrantyNotification"("warrantyId");
CREATE INDEX IF NOT EXISTS "WarrantyNotification_status_idx" ON "WarrantyNotification"("status");
CREATE INDEX IF NOT EXISTS "WarrantyNotification_scheduledFor_idx" ON "WarrantyNotification"("scheduledFor");
CREATE INDEX IF NOT EXISTS "WarrantyNotification_sentAt_idx" ON "WarrantyNotification"("sentAt");

-- Add relation field to User table (this is handled by Prisma schema)
-- No SQL needed as it's a virtual relation

-- Add relation field to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "warrantyContractId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Product_warrantyContractId_key" ON "Product"("warrantyContractId");
