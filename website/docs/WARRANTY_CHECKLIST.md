# Warranty Tracking System - Implementation Checklist

Use this checklist to verify that the warranty tracking system is properly set up and functioning.

## Pre-Installation

- [ ] Node.js 18+ installed
- [ ] Redis server available (local or cloud)
- [ ] Resend account created and API key obtained
- [ ] Database ready (SQLite or PostgreSQL)
- [ ] Git repository up to date

## Installation Steps

### 1. Dependencies
- [ ] All npm packages installed (`npm install`)
- [ ] No dependency conflicts or warnings
- [ ] `bullmq` version 5.8.6+ installed
- [ ] `ioredis` version 5.4.1+ installed
- [ ] `resend` version 3.4.0+ installed
- [ ] `date-fns` version 3.6.0+ installed

### 2. Environment Configuration
- [ ] `.env` file created from `.env.sample`
- [ ] `REDIS_URL` set correctly
- [ ] `RESEND_API_KEY` configured
- [ ] `FROM_EMAIL` verified in Resend dashboard
- [ ] `NEXT_PUBLIC_APP_URL` set to correct domain
- [ ] `DATABASE_URL` configured

### 3. Database Setup
- [ ] Prisma schema updated with warranty tables
- [ ] Migration file created: `add_warranty_tracking.sql`
- [ ] Migration executed: `npx prisma migrate dev`
- [ ] Prisma Client generated: `npx prisma generate`
- [ ] Database tables created successfully:
  - [ ] WarrantyContract (with new fields)
  - [ ] WarrantyNotification
  - [ ] WarrantyPreferences
- [ ] Indexes created on:
  - [ ] Product.warrantyExpiry
  - [ ] WarrantyContract.status
  - [ ] WarrantyContract.expiryDate
  - [ ] WarrantyNotification.status
  - [ ] WarrantyNotification.scheduledFor

### 4. File Structure Verification

**Types:**
- [ ] `src/types/warranty.ts` exists
- [ ] All enums defined (WarrantyType, WarrantyStatus, etc.)
- [ ] All interfaces defined

**Services:**
- [ ] `src/services/warranty-calculator.ts` exists
- [ ] `src/services/warranty-service.ts` exists
- [ ] `src/services/warranty-notification-service.ts` exists
- [ ] All functions implemented and exported

**Workers:**
- [ ] `src/workers/index.ts` exists
- [ ] `src/workers/warranty-worker.ts` exists
- [ ] Queue definitions present
- [ ] Worker processors defined
- [ ] Cron schedules configured

**API Routes:**
- [ ] `src/app/api/warranties/expiring/route.ts` exists
- [ ] `src/app/api/warranties/[id]/status/route.ts` exists
- [ ] `src/app/api/warranties/[id]/extend/route.ts` exists
- [ ] `src/app/api/warranties/[id]/notify/route.ts` exists
- [ ] `src/app/api/warranties/preferences/route.ts` exists

**Components:**
- [ ] `src/components/warranty/ExpiringWarrantiesWidget.tsx` exists
- [ ] `src/components/warranty/WarrantyStatusBadge.tsx` exists
- [ ] `src/components/warranty/WarrantyTimeline.tsx` exists
- [ ] `src/components/warranty/WarrantyPreferencesForm.tsx` exists

**Email Templates:**
- [ ] `src/emails/WarrantyExpiringEmail.tsx` exists
- [ ] Email template renders correctly

**Dashboard Pages:**
- [ ] `src/app/dashboard/warranties/page.tsx` exists
- [ ] `src/app/dashboard/warranties/settings/page.tsx` exists

**Documentation:**
- [ ] `docs/WARRANTY_SYSTEM.md` exists
- [ ] `docs/WARRANTY_SETUP.md` exists
- [ ] `docs/WARRANTY_ARCHITECTURE.md` exists
- [ ] `WARRANTY_IMPLEMENTATION_SUMMARY.md` exists
- [ ] `WARRANTY_QUICK_REFERENCE.md` exists

## Redis Setup

- [ ] Redis server running and accessible
- [ ] Connection test successful: `redis-cli ping` returns `PONG`
- [ ] Redis URL format correct (redis:// or rediss://)
- [ ] No connection errors in logs
- [ ] Redis version 6.0+ (check with `redis-cli --version`)

## Worker Setup

- [ ] Worker script exists in `package.json`:
  - [ ] `"worker:dev": "tsx watch src/workers/index.ts"`
  - [ ] `"worker:build": "tsx src/workers/index.ts"`
- [ ] Worker starts without errors: `npm run worker:dev`
- [ ] Worker logs show:
  - [ ] "Starting SnapRegister background workers..."
  - [ ] "Initializing warranty worker..."
  - [ ] "Scheduled daily warranty status update job"
  - [ ] "Scheduled daily notification check job"
  - [ ] "Scheduled hourly notification processing job"
  - [ ] "Warranty worker initialized successfully!"
- [ ] No Redis connection errors
- [ ] No Prisma errors
- [ ] Worker process stays running

## Application Setup

- [ ] Development server starts: `npm run dev`
- [ ] No TypeScript compilation errors
- [ ] No import/export errors
- [ ] Application accessible at configured URL
- [ ] No console errors on page load

## Functional Testing

### 1. Database Operations
- [ ] Can create test warranty contract
- [ ] Can query warranties by userId
- [ ] Can update warranty status
- [ ] Can create notification record
- [ ] Can create/update preferences

### 2. API Endpoints
- [ ] `GET /api/warranties/expiring` returns 200
- [ ] `GET /api/warranties/[id]/status` returns warranty data
- [ ] `PUT /api/warranties/[id]/extend` successfully extends warranty
- [ ] `POST /api/warranties/[id]/notify` triggers notification
- [ ] `GET /api/warranties/preferences` returns preferences
- [ ] `PUT /api/warranties/preferences` updates preferences
- [ ] All endpoints require authentication
- [ ] Proper error handling for invalid requests

### 3. Service Functions

**Calculator Service:**
- [ ] `calculateWarrantyEndDate()` returns correct date
- [ ] `calculateDaysRemaining()` calculates correctly
- [ ] `determineWarrantyStatus()` returns correct status
- [ ] `extendWarranty()` calculates extension correctly
- [ ] `parseDurationToMonths()` parses strings correctly

**Warranty Service:**
- [ ] `getExpiringWarranties()` returns correct warranties
- [ ] `getUserWarranties()` filters by userId
- [ ] `extendWarrantyContract()` updates database
- [ ] `updateWarrantyStatuses()` processes all warranties
- [ ] `getWarrantyPreferences()` retrieves or creates defaults

**Notification Service:**
- [ ] `createWarrantyNotification()` creates record
- [ ] `sendWarrantyNotificationEmail()` sends via Resend
- [ ] `scheduleWarrantyNotifications()` creates schedule
- [ ] Email HTML generates without errors

### 4. Background Jobs
- [ ] Status update job can be triggered manually
- [ ] Notification check job can be triggered manually
- [ ] Jobs are processed by workers
- [ ] Jobs update database correctly
- [ ] Failed jobs retry with backoff
- [ ] Job errors are logged properly

### 5. Frontend Components

**ExpiringWarrantiesWidget:**
- [ ] Renders without errors
- [ ] Shows loading state
- [ ] Fetches data from API
- [ ] Displays warranties correctly
- [ ] Shows urgency colors (red, orange, yellow)
- [ ] Click navigation works

**WarrantyStatusBadge:**
- [ ] All status types render
- [ ] Colors are correct for each status
- [ ] Icons display properly
- [ ] Days remaining shown when applicable

**WarrantyTimeline:**
- [ ] Timeline renders
- [ ] Months display correctly
- [ ] Warranties plotted on timeline
- [ ] Expiration markers visible

**WarrantyPreferencesForm:**
- [ ] Form loads preferences
- [ ] All checkboxes functional
- [ ] Custom days can be added/removed
- [ ] Quiet hours selectors work
- [ ] Form saves successfully
- [ ] Success/error messages display

### 6. Dashboard Pages

**Main Dashboard (/dashboard/warranties):**
- [ ] Page loads without errors
- [ ] Stats cards show correct counts
- [ ] Widgets display data
- [ ] Quick actions links work
- [ ] Settings button navigates correctly

**Settings Page (/dashboard/warranties/settings):**
- [ ] Page loads without errors
- [ ] Preferences form displays
- [ ] Back button works
- [ ] Can save preferences

## Email Testing

- [ ] Resend API key is valid
- [ ] FROM_EMAIL domain verified in Resend
- [ ] Test email sends successfully
- [ ] Email template renders in inbox
- [ ] Links in email work
- [ ] Email styling displays correctly
- [ ] Responsive design works on mobile

### Test Email Checklist:
- [ ] Subject line appears
- [ ] Product name displays
- [ ] Expiration date shown
- [ ] Days remaining calculated
- [ ] Urgency styling appropriate
- [ ] CTA button links to correct page
- [ ] Footer links work
- [ ] Unsubscribe preference link works

## Notification System Testing

### Create Test Warranty:
```sql
-- Warranty expiring in 30 days
INSERT INTO WarrantyContract (...)
```

- [ ] Test warranty created
- [ ] Notifications scheduled automatically
- [ ] Can view notifications in database

### Manual Notification Test:
- [ ] Trigger notification via API
- [ ] Notification queued in BullMQ
- [ ] Worker processes notification
- [ ] Email sent successfully
- [ ] Notification status updated to SENT
- [ ] In-app notification created

### Scheduled Notification Test:
- [ ] Set warranty to expire in 30 days
- [ ] Wait for daily cron (or trigger manually)
- [ ] Notification scheduled correctly
- [ ] Email sent at correct time
- [ ] Status updates after sending

## Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] API responses in < 500ms
- [ ] Widget data fetches quickly
- [ ] Worker processes jobs efficiently
- [ ] No memory leaks in worker
- [ ] Redis operations are fast
- [ ] Database queries optimized

## Error Handling

- [ ] Invalid API requests return proper errors
- [ ] Missing authentication returns 401
- [ ] Missing authorization returns 403
- [ ] Invalid data returns 400 with details
- [ ] Server errors return 500 with safe message
- [ ] Worker errors are logged
- [ ] Failed notifications retry
- [ ] Database errors handled gracefully

## Security Verification

- [ ] Environment variables not committed
- [ ] API routes require authentication
- [ ] Users can only access own warranties
- [ ] SQL injection protected (Prisma)
- [ ] XSS protection in place
- [ ] CSRF protection enabled
- [ ] Secure Redis connection (TLS in production)
- [ ] Email addresses validated
- [ ] Rate limiting considered

## Production Readiness

### Environment:
- [ ] Production `.env` configured
- [ ] Production Redis URL set (Upstash recommended)
- [ ] Production Resend API key
- [ ] Production database URL
- [ ] Production app URL set
- [ ] All secrets secured

### Deployment:
- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] Worker deployed separately
- [ ] Environment variables set in platform
- [ ] Domain verified for emails
- [ ] SSL/TLS enabled
- [ ] CORS configured if needed

### Monitoring:
- [ ] Worker logs accessible
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Email delivery monitoring
- [ ] Database performance monitoring
- [ ] Queue health monitoring
- [ ] Uptime monitoring

### Backup & Recovery:
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Worker restart on failure
- [ ] Rollback plan documented

## Documentation Review

- [ ] README updated with warranty system info
- [ ] API documentation complete
- [ ] Setup guide accurate
- [ ] Architecture diagram clear
- [ ] Code comments sufficient
- [ ] Type definitions documented

## Final Verification

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] No linting errors
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Team trained on system

## Post-Deployment Checklist

### Day 1:
- [ ] Monitor worker logs
- [ ] Check first scheduled job runs
- [ ] Verify emails are sending
- [ ] Review error logs
- [ ] Check Redis health

### Week 1:
- [ ] Monitor notification delivery rates
- [ ] Check email open rates
- [ ] Review user feedback
- [ ] Optimize slow queries
- [ ] Adjust cron schedules if needed

### Month 1:
- [ ] Analyze usage patterns
- [ ] Review warranty expiration trends
- [ ] Optimize notification timing
- [ ] Clean up old notification records
- [ ] Update documentation based on learnings

## Known Issues & Limitations

Document any known issues:
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________
- [ ] Issue 3: ________________

## Sign-Off

Implementation completed by: ________________

Date: ________________

Verified by: ________________

Date: ________________

Production deployment approved: Yes / No

Notes:
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Test Commands

```bash
# Test Redis connection
redis-cli ping

# Check database
npx prisma studio

# Test worker
npm run worker:dev

# Test API
curl http://localhost:3000/api/warranties/expiring

# Trigger test notification
curl -X POST http://localhost:3000/api/warranties/{id}/notify \
  -H "Content-Type: application/json" \
  -d '{"notificationType":"EXPIRY_30_DAYS"}'

# Check logs
tail -f logs/worker.log
```

---

**Completion Status: ___ / ___ items checked**

All critical items must be checked before production deployment.
