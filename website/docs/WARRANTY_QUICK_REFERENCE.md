# Warranty System - Quick Reference

## Common Operations

### Get Expiring Warranties
```typescript
import { getExpiringWarranties } from '@/services/warranty-service';

const warranties = await getExpiringWarranties(userId, 30); // Next 30 days
```

### Check Warranty Status
```typescript
import { getWarrantyStatus } from '@/services/warranty-service';

const { warranty, statusInfo } = await getWarrantyStatus(warrantyId);

console.log(statusInfo.status); // ACTIVE, EXPIRING_SOON, EXPIRED, etc.
console.log(statusInfo.daysRemaining); // Days until expiration
console.log(statusInfo.isExpiringSoon); // boolean
```

### Extend Warranty
```typescript
import { extendWarrantyContract } from '@/services/warranty-service';

const result = await extendWarrantyContract({
  warrantyId: 'warranty-123',
  extensionMonths: 12,
  notes: 'Extended warranty purchased',
});
```

### Send Notification
```typescript
import { queueNotification } from '@/workers/warranty-worker';

await queueNotification('notification-id');
```

### Update User Preferences
```typescript
import { updateWarrantyPreferences } from '@/services/warranty-service';

await updateWarrantyPreferences(userId, {
  emailEnabled: true,
  reminder30Days: true,
  customDays: [45, 60],
});
```

## API Endpoints Quick Reference

```bash
# Get expiring warranties
GET /api/warranties/expiring?days=30

# Get warranty status
GET /api/warranties/{id}/status

# Extend warranty
PUT /api/warranties/{id}/extend
Content-Type: application/json
{
  "extensionMonths": 12,
  "notes": "Extended coverage"
}

# Manually trigger notification
POST /api/warranties/{id}/notify
Content-Type: application/json
{
  "notificationType": "EXPIRY_30_DAYS",
  "customMessage": "Optional message"
}

# Get preferences
GET /api/warranties/preferences

# Update preferences
PUT /api/warranties/preferences
Content-Type: application/json
{
  "emailEnabled": true,
  "reminder90Days": false,
  "customDays": [45, 60, 14]
}
```

## Component Usage

### Expiring Warranties Widget
```tsx
import ExpiringWarrantiesWidget from '@/components/warranty/ExpiringWarrantiesWidget';

<ExpiringWarrantiesWidget
  daysAhead={30}
  maxItems={5}
  showViewAll={true}
/>
```

### Warranty Status Badge
```tsx
import WarrantyStatusBadge from '@/components/warranty/WarrantyStatusBadge';
import { WarrantyStatus } from '@/types/warranty';

<WarrantyStatusBadge
  status={WarrantyStatus.EXPIRING_SOON}
  daysRemaining={30}
  size="md"
  showIcon={true}
/>
```

### Warranty Timeline
```tsx
import WarrantyTimeline from '@/components/warranty/WarrantyTimeline';

<WarrantyTimeline timelineMonths={12} />
```

### Preferences Form
```tsx
import WarrantyPreferencesForm from '@/components/warranty/WarrantyPreferencesForm';

<WarrantyPreferencesForm />
```

## Calculator Functions

### Calculate End Date
```typescript
import { calculateWarrantyEndDate } from '@/services/warranty-calculator';
import { WarrantyType } from '@/types/warranty';

const endDate = calculateWarrantyEndDate(
  new Date('2024-01-01'),
  12, // months
  WarrantyType.LIMITED
);
```

### Calculate Days Remaining
```typescript
import { calculateDaysRemaining } from '@/services/warranty-calculator';

const days = calculateDaysRemaining(new Date('2024-12-31'));
```

### Determine Status
```typescript
import { determineWarrantyStatus } from '@/services/warranty-calculator';
import { WarrantyType } from '@/types/warranty';

const status = determineWarrantyStatus(
  new Date('2024-12-31'),
  WarrantyType.LIMITED,
  false, // isClaimed
  false  // isVoid
);
```

### Calculate Notification Schedule
```typescript
import { calculateNotificationSchedule } from '@/services/warranty-calculator';

const schedule = calculateNotificationSchedule(
  'warranty-123',
  new Date('2024-12-31'),
  WarrantyType.LIMITED,
  {
    reminder90Days: true,
    reminder30Days: true,
    reminder7Days: true,
    reminder1Day: true,
    customDays: [45, 60],
  }
);
```

## Database Queries

### Find Warranties Needing Notification
```typescript
const warranties = await prisma.warrantyContract.findMany({
  where: {
    expiryDate: {
      gte: new Date(),
      lte: addDays(new Date(), 30),
    },
    status: {
      in: ['ACTIVE', 'EXPIRING_SOON'],
    },
  },
  include: {
    user: true,
    product: true,
  },
});
```

### Create Notification
```typescript
await prisma.warrantyNotification.create({
  data: {
    warrantyId: 'warranty-123',
    type: 'EXPIRY_30_DAYS',
    scheduledFor: new Date(),
    status: 'PENDING',
    channel: 'EMAIL',
    recipient: 'user@example.com',
    subject: 'Warranty Expiring Soon',
    message: 'Your warranty expires in 30 days',
  },
});
```

### Get User Statistics
```typescript
const stats = await prisma.warrantyContract.groupBy({
  by: ['status'],
  where: { userId },
  _count: true,
});
```

## Worker Commands

### Trigger Status Update
```typescript
import { triggerStatusUpdate } from '@/workers/warranty-worker';

await triggerStatusUpdate();
```

### Trigger Notification Check
```typescript
import { triggerNotificationCheck } from '@/workers/warranty-worker';

await triggerNotificationCheck();
```

### Queue Notification
```typescript
import { queueNotification } from '@/workers/warranty-worker';

await queueNotification('notification-id');
```

## Environment Variables

```env
# Required
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=noreply@snapregister.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
DATABASE_URL=file:./dev.db
```

## Cron Schedules

| Job | Schedule | Description |
|-----|----------|-------------|
| Status Update | `0 0 * * *` | Daily at 12:00 AM |
| Notification Check | `0 8 * * *` | Daily at 8:00 AM |
| Process Pending | `0 * * * *` | Every hour |

## Status Colors

| Status | Color | Badge Class |
|--------|-------|-------------|
| ACTIVE | Green | `bg-green-100 text-green-700` |
| EXPIRING_SOON | Yellow | `bg-yellow-100 text-yellow-700` |
| EXPIRED | Red | `bg-red-100 text-red-700` |
| CLAIMED | Blue | `bg-blue-100 text-blue-700` |
| VOID | Gray | `bg-gray-100 text-gray-700` |
| LIFETIME | Purple | `bg-purple-100 text-purple-700` |

## Notification Types

| Type | Days Before | Urgency |
|------|-------------|---------|
| EXPIRY_90_DAYS | 90 | Info |
| EXPIRY_30_DAYS | 30 | Warning |
| EXPIRY_7_DAYS | 7 | Urgent |
| EXPIRY_1_DAY | 1 | Critical |
| EXPIRED | 0 | Alert |
| RENEWAL_AVAILABLE | N/A | Info |
| CLAIM_REMINDER | N/A | Action |

## Testing Commands

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start worker
npm run worker:dev

# Start dev server
npm run dev

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Check Redis
redis-cli ping

# Monitor Redis
redis-cli monitor

# View queue jobs
# http://localhost:3000/admin/jobs (if Bull Board configured)
```

## Common Errors

### Redis Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Fix:** Start Redis server or check `REDIS_URL`

### Email Not Sending
```
Error: Invalid API key
```
**Fix:** Verify `RESEND_API_KEY` in `.env`

### Worker Not Processing
```
No jobs being processed
```
**Fix:** Ensure worker is running: `npm run worker:dev`

### Database Error
```
Prisma Client not generated
```
**Fix:** Run `npx prisma generate`

## Useful Links

- [BullMQ Documentation](https://docs.bullmq.io)
- [Resend Documentation](https://resend.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [date-fns Documentation](https://date-fns.org)
- [React Email Documentation](https://react.email)

## File Locations

```
Types:              src/types/warranty.ts
Services:           src/services/warranty-*.ts
Workers:            src/workers/warranty-worker.ts
API Routes:         src/app/api/warranties/
Components:         src/components/warranty/
Email Templates:    src/emails/
Dashboard Pages:    src/app/dashboard/warranties/
Documentation:      docs/WARRANTY_*.md
```

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.sample .env
# Edit .env with your values

# 3. Run migrations
npx prisma migrate dev
npx prisma generate

# 4. Start Redis
docker run -d -p 6379:6379 redis:alpine

# 5. Start worker (separate terminal)
npm run worker:dev

# 6. Start app
npm run dev

# 7. Access dashboard
open http://localhost:3000/dashboard/warranties
```

## Need Help?

- Documentation: `docs/WARRANTY_SYSTEM.md`
- Setup Guide: `docs/WARRANTY_SETUP.md`
- Full Summary: `WARRANTY_IMPLEMENTATION_SUMMARY.md`
