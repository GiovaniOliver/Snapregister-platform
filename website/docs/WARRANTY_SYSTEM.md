# Warranty Expiration Tracking System

## Overview

The Warranty Expiration Tracking System is a comprehensive solution for monitoring product warranties, sending intelligent notifications, and helping users manage their warranty coverage proactively.

## Features

### 1. Warranty Expiration Calculator
- Calculates warranty end dates based on purchase date and warranty period
- Supports multiple warranty types:
  - Limited
  - Extended
  - Lifetime
  - Manufacturer
  - Retail Protection
  - Third Party
- Handles warranty extensions and renewals
- Calculates days remaining and expiration status
- Automatically determines warranty status (Active, Expiring Soon, Expired, etc.)

### 2. Notification System
- **Email Reminders**: Sent at 90 days, 30 days, 7 days, and 1 day before expiration
- **In-App Notifications**: Real-time notification center showing upcoming expirations
- **Custom Reminder Schedule**: Users can customize their reminder intervals
- **Notification Queue**: BullMQ-based queue system for reliable notification delivery
- **Retry Logic**: Automatic retry with exponential backoff for failed notifications

### 3. Dashboard Widgets
- **Expiring Soon Widget**: Shows warranties expiring in the next 30 days
- **Visual Timeline**: Interactive timeline displaying all product warranties
- **Status Badges**: Color-coded badges (Active, Expiring Soon, Expired, Lifetime)
- **Quick Actions**: Renew, Contact Manufacturer, View Details buttons

### 4. Database Schema

#### WarrantyContract Table
```sql
- id: Unique identifier
- userId: Owner of the warranty
- productId: Associated product
- warrantyType: Type of warranty (enum)
- status: Current status (enum)
- startDate: Warranty start date
- expiryDate: Warranty end date (null for lifetime)
- durationMonths: Warranty duration in months
- originalEndDate: Original end date before extensions
- extendedBy: Number of months extended
- extensionDate: Date of last extension
- renewalCount: Number of times renewed
- coverageItems: What's covered (JSON)
- exclusions: What's not covered (JSON)
- claimProcedure: How to file claims
- claimContacts: Manufacturer contact info (JSON)
```

#### WarrantyNotification Table
```sql
- id: Unique identifier
- warrantyId: Associated warranty
- type: Notification type (enum)
- scheduledFor: When to send
- sentAt: When actually sent
- status: Current status (enum)
- channel: Email, In-App, SMS, Push
- recipient: Email/phone/user ID
- subject: Notification subject
- message: Notification message
- emailId: Email provider message ID
- opened: Email opened status
- clicked: Email clicked status
- attempts: Number of send attempts
- error: Error message if failed
```

#### WarrantyPreferences Table
```sql
- id: Unique identifier
- userId: User ID
- emailEnabled: Enable email notifications
- inAppEnabled: Enable in-app notifications
- smsEnabled: Enable SMS notifications
- pushEnabled: Enable push notifications
- reminder90Days: 90-day reminder enabled
- reminder30Days: 30-day reminder enabled
- reminder7Days: 7-day reminder enabled
- reminder1Day: 1-day reminder enabled
- customDays: Custom reminder intervals (JSON)
- dailyDigest: Enable daily digest
- weeklyDigest: Enable weekly digest
- monthlyDigest: Enable monthly digest
- quietHoursEnabled: Enable quiet hours
- quietHoursStart: Quiet hours start time
- quietHoursEnd: Quiet hours end time
- timezone: User timezone
- autoRenewReminder: Remind about auto-renewal
- lifetimeWarrantyReminder: Remind for lifetime warranties
```

### 5. API Endpoints

#### GET /api/warranties/expiring
Get warranties expiring soon.

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30, max: 365)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "daysAhead": 30,
  "warranties": [
    {
      "id": "warranty-123",
      "productName": "Samsung Refrigerator",
      "manufacturer": "Samsung",
      "warrantyType": "LIMITED",
      "expiryDate": "2024-12-31T00:00:00.000Z",
      "daysRemaining": 30,
      "status": "EXPIRING_SOON",
      "productId": "product-456"
    }
  ]
}
```

#### GET /api/warranties/[id]/status
Get warranty status for a specific warranty.

**Response:**
```json
{
  "success": true,
  "warranty": {
    "id": "warranty-123",
    "warrantyType": "LIMITED",
    "startDate": "2023-01-01T00:00:00.000Z",
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "status": "EXPIRING_SOON"
  },
  "status": {
    "status": "EXPIRING_SOON",
    "daysRemaining": 30,
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "isExpired": false,
    "isExpiringSoon": true,
    "isLifetime": false
  }
}
```

#### PUT /api/warranties/[id]/extend
Extend a warranty.

**Request Body:**
```json
{
  "extensionMonths": 12,
  "notes": "Extended for additional coverage"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Warranty extended by 12 months",
  "warranty": {
    "id": "warranty-123",
    "expiryDate": "2025-12-31T00:00:00.000Z",
    "originalEndDate": "2024-12-31T00:00:00.000Z",
    "extendedBy": 12,
    "renewalCount": 1
  }
}
```

#### POST /api/warranties/[id]/notify
Manually trigger a warranty notification.

**Request Body:**
```json
{
  "notificationType": "EXPIRY_30_DAYS",
  "customMessage": "Optional custom message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "notification": {
    "id": "notification-789",
    "type": "EXPIRY_30_DAYS",
    "sentAt": "2024-11-06T10:30:00.000Z"
  }
}
```

#### GET /api/warranties/preferences
Get user's warranty notification preferences.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "emailEnabled": true,
    "inAppEnabled": true,
    "smsEnabled": false,
    "reminder90Days": true,
    "reminder30Days": true,
    "reminder7Days": true,
    "reminder1Day": true,
    "customDays": [45, 60],
    "weeklyDigest": true,
    "quietHoursEnabled": true,
    "quietHoursStart": 22,
    "quietHoursEnd": 8,
    "timezone": "America/New_York"
  }
}
```

#### PUT /api/warranties/preferences
Update warranty notification preferences.

**Request Body:**
```json
{
  "emailEnabled": true,
  "reminder90Days": false,
  "customDays": [45, 60, 14]
}
```

### 6. Background Jobs

#### Daily Status Update (12:00 AM)
- Updates warranty statuses based on current date
- Transitions warranties from Active → Expiring Soon → Expired
- Runs automatically via cron schedule

#### Daily Notification Check (8:00 AM)
- Checks all warranties for upcoming notifications
- Schedules notifications based on user preferences
- Runs automatically via cron schedule

#### Hourly Notification Processing
- Processes all pending notifications
- Sends emails via Resend
- Creates in-app notifications
- Handles retry logic for failed sends

## Usage

### Installation

1. **Update Database Schema:**
```bash
cd website
npx prisma migrate dev --name add-warranty-tracking
npx prisma generate
```

2. **Start Background Worker:**
```bash
npm run worker:dev
```

### Integrating in Your Dashboard

```tsx
import ExpiringWarrantiesWidget from '@/components/warranty/ExpiringWarrantiesWidget';
import WarrantyTimeline from '@/components/warranty/WarrantyTimeline';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ExpiringWarrantiesWidget daysAhead={30} maxItems={5} />
      <WarrantyTimeline timelineMonths={12} />
    </div>
  );
}
```

### Creating a Warranty Settings Page

```tsx
import WarrantyPreferencesForm from '@/components/warranty/WarrantyPreferencesForm';

export default function WarrantySettings() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <WarrantyPreferencesForm />
    </div>
  );
}
```

### Manually Triggering Notifications

```typescript
import { queueNotification } from '@/workers/warranty-worker';

// Queue a notification for immediate sending
await queueNotification('notification-id-123');
```

### Extending a Warranty Programmatically

```typescript
import { extendWarrantyContract } from '@/services/warranty-service';

const result = await extendWarrantyContract({
  warrantyId: 'warranty-123',
  extensionMonths: 12,
  notes: 'Extended warranty purchased',
});

if (result.success) {
  console.log('Warranty extended:', result.warranty);
}
```

## Service Architecture

### WarrantyCalculatorService
Pure calculation functions for warranty dates, status, and notifications.

**Key Functions:**
- `calculateWarrantyEndDate()`: Calculate end date from start date and duration
- `calculateDaysRemaining()`: Get days until expiration
- `determineWarrantyStatus()`: Calculate current status
- `calculateNotificationSchedule()`: Generate notification schedule
- `extendWarranty()`: Calculate new dates after extension
- `parseDurationToMonths()`: Parse duration strings like "2 years"

### WarrantyService
Database operations for warranties and preferences.

**Key Functions:**
- `getExpiringWarranties()`: Fetch warranties expiring soon
- `getUserWarranties()`: Get all user warranties with status
- `getWarrantyStatus()`: Get status for specific warranty
- `extendWarrantyContract()`: Extend warranty in database
- `updateWarrantyStatuses()`: Batch update all warranty statuses
- `getWarrantiesNeedingNotification()`: Find warranties due for notification
- `getWarrantyDashboardStats()`: Get statistics for dashboard
- `getWarrantyPreferences()`: Get user preferences
- `updateWarrantyPreferences()`: Update user preferences

### WarrantyNotificationService
Handles notification creation and delivery.

**Key Functions:**
- `createWarrantyNotification()`: Create notification record
- `sendWarrantyNotificationEmail()`: Send email via Resend
- `scheduleWarrantyNotifications()`: Schedule all notifications for a warranty
- `processPendingNotifications()`: Process queued notifications

### WarrantyWorker
Background job processing via BullMQ.

**Jobs:**
- `check-and-send`: Check warranties and schedule notifications
- `send-notification`: Send individual notification
- `schedule-warranty-notifications`: Schedule notifications for warranty
- `process-pending`: Process all pending notifications
- `update-all-statuses`: Update all warranty statuses

## Environment Variables

```env
# Required
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@snapregister.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
DATABASE_URL=file:./dev.db
```

## Testing

### Test Notification System
```bash
# Trigger manual notification check
curl -X POST http://localhost:3000/api/admin/trigger-warranty-check

# Send test notification
curl -X POST http://localhost:3000/api/warranties/warranty-123/notify \
  -H "Content-Type: application/json" \
  -d '{"notificationType":"EXPIRY_30_DAYS"}'
```

### Monitor Background Jobs
```bash
# Check BullMQ dashboard
npm run bull-board
```

## Best Practices

1. **Set Default Preferences**: Create default preferences when user signs up
2. **Respect Quiet Hours**: Check quiet hours before sending notifications
3. **Rate Limiting**: Add delays between bulk notification sends
4. **Error Handling**: Log all notification errors for debugging
5. **Retry Logic**: Use exponential backoff for failed notifications
6. **Email Tracking**: Track opens and clicks for optimization
7. **User Privacy**: Allow users to opt out of specific notification types
8. **Performance**: Index warranty expiry dates for efficient queries

## Troubleshooting

### Notifications Not Sending
- Check Redis connection
- Verify Resend API key
- Check email logs table
- Review worker logs

### Incorrect Warranty Status
- Run manual status update: `POST /api/admin/update-warranty-statuses`
- Check date calculations in warranty-calculator.ts
- Verify timezone settings

### Background Jobs Not Running
- Ensure Redis is running
- Check worker process is active
- Review BullMQ queue status
- Check cron patterns

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Push notifications for mobile app
- [ ] AI-powered warranty insights
- [ ] Warranty document OCR and extraction
- [ ] Manufacturer integration for auto-renewal
- [ ] Warranty claim filing assistance
- [ ] Extended warranty marketplace
- [ ] Family sharing for warranties

## Support

For issues or questions, contact the development team or file an issue in the repository.
