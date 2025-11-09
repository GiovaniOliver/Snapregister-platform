# Warranty Tracking System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SNAPREGISTER WARRANTY SYSTEM                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│   Next.js    │────▶│  Database   │
│   Client    │◀────│   App API    │◀────│  (Prisma)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │   BullMQ     │             │
                    │   Queues     │             │
                    └──────────────┘             │
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │   Redis      │             │
                    │   Store      │             │
                    └──────────────┘             │
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │   Worker     │─────────────┘
                    │   Process    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Resend     │
                    │   Email API  │
                    └──────────────┘
```

## Data Flow Diagram

### 1. Warranty Creation Flow

```
User Action
    │
    ▼
┌─────────────────┐
│ Create Product  │
│ with Warranty   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Save to Database            │
│ - WarrantyContract record   │
│ - Calculate expiry date     │
│ - Set initial status        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Schedule Notifications      │
│ - 90 days before expiry     │
│ - 30 days before expiry     │
│ - 7 days before expiry      │
│ - 1 day before expiry       │
└─────────────────────────────┘
```

### 2. Notification Processing Flow

```
Cron Schedule (Daily 8 AM)
         │
         ▼
┌─────────────────────────────┐
│ Check for Warranties        │
│ Needing Notification        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Query Database              │
│ WHERE expiryDate IN         │
│   [today+90, +30, +7, +1]   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ For Each Warranty:          │
│ - Check user preferences    │
│ - Check quiet hours         │
│ - Check already notified    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Queue Notification Jobs     │
│ in BullMQ                   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Worker Processes Jobs       │
│ - Generate email HTML       │
│ - Send via Resend           │
│ - Create in-app notification│
│ - Update notification status│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Track Delivery              │
│ - Email sent                │
│ - Email opened (webhook)    │
│ - Email clicked (webhook)   │
└─────────────────────────────┘
```

### 3. Status Update Flow

```
Cron Schedule (Daily 12 AM)
         │
         ▼
┌─────────────────────────────┐
│ Fetch All Active Warranties │
│ WHERE warrantyType != LIFE  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ For Each Warranty:          │
│ - Calculate days remaining  │
│ - Determine new status      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Update Status if Changed    │
│ - ACTIVE                    │
│ - EXPIRING_SOON (≤30 days)  │
│ - EXPIRED (<0 days)         │
└─────────────────────────────┘
```

## Component Architecture

### Frontend Layer

```
┌───────────────────────────────────────────────────────┐
│                    Dashboard Page                      │
│  /dashboard/warranties                                 │
│                                                        │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Stats Cards      │  │ Quick Actions    │          │
│  │ - Total          │  │ - Add New        │          │
│  │ - Active         │  │ - Import         │          │
│  │ - Expiring Soon  │  │ - Export         │          │
│  │ - Expired        │  │ - Settings       │          │
│  │ - Lifetime       │  └──────────────────┘          │
│  └──────────────────┘                                 │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │      ExpiringWarrantiesWidget                │    │
│  │  - Lists warranties expiring in 30 days      │    │
│  │  - Color-coded urgency indicators            │    │
│  │  - Click to view product details             │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │          WarrantyTimeline                    │    │
│  │  - Visual timeline of expirations            │    │
│  │  - Month-by-month view                       │    │
│  │  - Status badges for each warranty           │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│                  Settings Page                         │
│  /dashboard/warranties/settings                        │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │     WarrantyPreferencesForm                  │    │
│  │                                              │    │
│  │  Notification Channels:                      │    │
│  │  ☑ Email  ☑ In-App  ☐ SMS  ☐ Push          │    │
│  │                                              │    │
│  │  Reminder Schedule:                          │    │
│  │  ☑ 90 days  ☑ 30 days  ☑ 7 days  ☑ 1 day   │    │
│  │  Custom: [45, 60, 14]                        │    │
│  │                                              │    │
│  │  Digest Settings:                            │    │
│  │  ☐ Daily  ☑ Weekly  ☐ Monthly               │    │
│  │                                              │    │
│  │  Quiet Hours:                                │    │
│  │  ☑ Enabled  [22:00] to [08:00]              │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### API Layer

```
┌─────────────────────────────────────────────────┐
│                  API Routes                      │
│  /api/warranties/                                │
│                                                  │
│  GET  /expiring                                  │
│       ?days=30                                   │
│       Returns: Warranties expiring soon          │
│                                                  │
│  GET  /[id]/status                               │
│       Returns: Warranty status info              │
│                                                  │
│  PUT  /[id]/extend                               │
│       Body: { extensionMonths, notes }           │
│       Returns: Updated warranty                  │
│                                                  │
│  POST /[id]/notify                               │
│       Body: { notificationType, customMessage }  │
│       Returns: Notification confirmation         │
│                                                  │
│  GET  /preferences                               │
│       Returns: User preferences                  │
│                                                  │
│  PUT  /preferences                               │
│       Body: { ...preference updates }            │
│       Returns: Updated preferences               │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Service Layer

```
┌─────────────────────────────────────────────────┐
│              warranty-calculator.ts              │
│  Pure calculation functions (no I/O)            │
│                                                  │
│  • calculateWarrantyEndDate()                   │
│  • calculateDaysRemaining()                     │
│  • determineWarrantyStatus()                    │
│  • getWarrantyStatusInfo()                      │
│  • calculateNotificationSchedule()              │
│  • extendWarranty()                             │
│  • shouldNotifyToday()                          │
│  • parseDurationToMonths()                      │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│               warranty-service.ts                │
│  Database operations via Prisma                 │
│                                                  │
│  • getExpiringWarranties()                      │
│  • getUserWarranties()                          │
│  • getWarrantyStatus()                          │
│  • extendWarrantyContract()                     │
│  • updateWarrantyStatuses()                     │
│  • getWarrantiesNeedingNotification()           │
│  • getWarrantyDashboardStats()                  │
│  • getWarrantyPreferences()                     │
│  • updateWarrantyPreferences()                  │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         warranty-notification-service.ts         │
│  Notification creation and delivery             │
│                                                  │
│  • createWarrantyNotification()                 │
│  • sendWarrantyNotificationEmail()              │
│  • scheduleWarrantyNotifications()              │
│  • processPendingNotifications()                │
│  • generateEmailHTML()                          │
└──────────────────────────────────────────────────┘
```

### Worker Layer

```
┌─────────────────────────────────────────────────┐
│               warranty-worker.ts                 │
│  Background job processing with BullMQ          │
│                                                  │
│  Queues:                                         │
│  • warranty-notifications                        │
│  • warranty-status-updates                       │
│                                                  │
│  Jobs:                                           │
│  • check-and-send                                │
│  • send-notification                             │
│  • schedule-warranty-notifications               │
│  • process-pending                               │
│  • update-all-statuses                           │
│                                                  │
│  Scheduled Jobs:                                 │
│  • Daily 00:00 - Update statuses                 │
│  • Daily 08:00 - Check notifications             │
│  • Hourly      - Process pending                 │
└──────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────┐
│                      User                        │
├─────────────────────────────────────────────────┤
│ id: string                                       │
│ email: string                                    │
│ firstName: string                                │
│ lastName: string                                 │
│ notificationsEnabled: boolean                    │
├─────────────────────────────────────────────────┤
│ Relations:                                       │
│ • products []                                    │
│ • warrantyContracts []                           │
│ • warrantyPreferences ?                          │
└─────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────┐
│                WarrantyContract                  │
├─────────────────────────────────────────────────┤
│ id: string                                       │
│ userId: string                                   │
│ productId?: string                               │
│ warrantyType: enum                               │
│ status: enum                                     │
│ startDate: DateTime                              │
│ expiryDate?: DateTime                            │
│ durationMonths?: number                          │
│ originalEndDate?: DateTime                       │
│ extendedBy?: number                              │
│ renewalCount: number                             │
│ coverageItems: JSON                              │
│ exclusions: JSON                                 │
│ claimProcedure?: string                          │
│ claimContacts: JSON                              │
├─────────────────────────────────────────────────┤
│ Relations:                                       │
│ • user                                           │
│ • product ?                                      │
│ • notifications []                               │
└─────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────┐
│             WarrantyNotification                 │
├─────────────────────────────────────────────────┤
│ id: string                                       │
│ warrantyId: string                               │
│ type: enum                                       │
│ scheduledFor: DateTime                           │
│ sentAt?: DateTime                                │
│ status: enum                                     │
│ channel: enum                                    │
│ recipient: string                                │
│ subject: string                                  │
│ message: string                                  │
│ emailId?: string                                 │
│ opened: boolean                                  │
│ clicked: boolean                                 │
│ attempts: number                                 │
│ error?: string                                   │
├─────────────────────────────────────────────────┤
│ Relations:                                       │
│ • warranty                                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│             WarrantyPreferences                  │
├─────────────────────────────────────────────────┤
│ id: string                                       │
│ userId: string (unique)                          │
│ emailEnabled: boolean                            │
│ inAppEnabled: boolean                            │
│ smsEnabled: boolean                              │
│ pushEnabled: boolean                             │
│ reminder90Days: boolean                          │
│ reminder30Days: boolean                          │
│ reminder7Days: boolean                           │
│ reminder1Day: boolean                            │
│ customDays: JSON                                 │
│ dailyDigest: boolean                             │
│ weeklyDigest: boolean                            │
│ monthlyDigest: boolean                           │
│ quietHoursEnabled: boolean                       │
│ quietHoursStart?: number                         │
│ quietHoursEnd?: number                           │
│ timezone: string                                 │
│ autoRenewReminder: boolean                       │
│ lifetimeWarrantyReminder: boolean                │
├─────────────────────────────────────────────────┤
│ Relations:                                       │
│ • user                                           │
└─────────────────────────────────────────────────┘
```

## State Transitions

### Warranty Status State Machine

```
                    ┌────────────┐
                    │  LIFETIME  │◀──────────────┐
                    └────────────┘               │
                                                 │
    CREATE                                       │
      │                                          │
      ▼                                          │
┌────────────┐                                   │
│   ACTIVE   │────────────────────────────────────
└─────┬──────┘        if type == LIFETIME
      │
      │ expiryDate - today ≤ 30 days
      ▼
┌──────────────┐
│EXPIRING_SOON │
└──────┬───────┘
       │
       │ expiryDate < today
       ▼
┌────────────┐
│  EXPIRED   │
└────────────┘

     Manual Actions:
┌────────────┐     ┌────────────┐
│  CLAIMED   │     │    VOID    │
└────────────┘     └────────────┘
```

### Notification Status State Machine

```
    CREATE
      │
      ▼
┌────────────┐
│  PENDING   │
└─────┬──────┘
      │
      │ Worker picks up job
      ▼
┌────────────┐
│ SCHEDULED  │
└─────┬──────┘
      │
      │ Send attempt
      ├──────────┐
      │          │
      ▼          ▼
┌────────┐  ┌────────┐
│  SENT  │  │ FAILED │
└────┬───┘  └───┬────┘
     │          │
     │          │ Retry (max 3)
     │          └────────────┐
     │                       │
     │ Resend webhook        │
     ▼                       ▼
┌───────────┐         ┌────────────┐
│ DELIVERED │         │ CANCELLED  │
└───────────┘         └────────────┘
```

## Deployment Architecture

### Development

```
┌──────────────┐
│ Developer    │
│ Machine      │
│              │
│ ┌──────────┐ │
│ │ Next.js  │ │
│ │ :3000    │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ Worker   │ │
│ │ Process  │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ Redis    │ │
│ │ :6379    │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ SQLite   │ │
│ │ dev.db   │ │
│ └──────────┘ │
└──────────────┘
```

### Production

```
┌─────────────────────────────────────────┐
│            Load Balancer                 │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌────────┐
│ Web    │      │ Web    │
│ Server │      │ Server │
│ (Next) │      │ (Next) │
└───┬────┘      └───┬────┘
    │               │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  PostgreSQL   │
    │   Database    │
    └───────────────┘

┌────────────────┐      ┌────────────────┐
│  Worker        │─────▶│  Upstash       │
│  Server        │      │  Redis         │
│  (Background)  │      │  (Cloud)       │
└────────┬───────┘      └────────────────┘
         │
         ▼
  ┌──────────────┐
  │   Resend     │
  │   Email API  │
  └──────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────┐
│          Security Layers                 │
└─────────────────────────────────────────┘

1. Authentication
   ├─ Next-Auth session validation
   └─ User ownership verification

2. Authorization
   ├─ User can only access own warranties
   ├─ API routes check userId
   └─ Database queries filtered by userId

3. Data Protection
   ├─ Environment variables for secrets
   ├─ Encrypted sensitive data
   └─ Secure Redis connection (TLS)

4. Email Security
   ├─ DKIM/SPF records
   ├─ Verified sender domain
   └─ Rate limiting on sends

5. Worker Security
   ├─ Authenticated Redis connection
   ├─ Job data validation
   └─ Error handling and logging
```

## Performance Optimization

```
┌─────────────────────────────────────────┐
│      Performance Strategies              │
└─────────────────────────────────────────┘

1. Database Indexes
   ├─ warrantyExpiry (Product)
   ├─ status, expiryDate (WarrantyContract)
   ├─ status, scheduledFor (WarrantyNotification)
   └─ userId (All user-related tables)

2. Query Optimization
   ├─ Use select to limit fields
   ├─ Include only needed relations
   ├─ Batch operations where possible
   └─ Pagination for large lists

3. Caching Strategy
   ├─ Redis cache for frequently accessed data
   ├─ Dashboard stats caching (5 min TTL)
   └─ User preferences caching

4. Background Processing
   ├─ Async notification sending
   ├─ Batch status updates
   ├─ Delayed job processing
   └─ Rate limiting

5. Frontend Optimization
   ├─ Component lazy loading
   ├─ Client-side caching
   ├─ Optimistic UI updates
   └─ Debounced API calls
```

This architecture provides a robust, scalable warranty tracking system with clear separation of concerns and efficient data processing.
