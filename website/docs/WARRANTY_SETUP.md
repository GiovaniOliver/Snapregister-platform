# Warranty Tracking System - Setup Guide

## Quick Start

Follow these steps to set up the warranty expiration tracking system in your SnapRegister installation.

## Prerequisites

- Node.js 18+ installed
- Redis server running (for background jobs)
- Resend API key (for email notifications)
- PostgreSQL or SQLite database

## Installation Steps

### 1. Install Dependencies

The required dependencies are already in your `package.json`:
- `bullmq` - Job queue system
- `ioredis` - Redis client
- `resend` - Email service
- `date-fns` - Date utilities
- `@react-email/components` - Email templates

If not already installed:
```bash
cd website
npm install
```

### 2. Set Up Environment Variables

Add the following to your `.env` file:

```env
# Redis (required for background jobs)
REDIS_URL=redis://localhost:6379
# For Upstash Redis (cloud):
# REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

# Resend (required for email notifications)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@snapregister.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Update Database Schema

The enhanced Prisma schema is already in place. Run the migration:

```bash
cd website
npx prisma migrate dev --name add-warranty-tracking
npx prisma generate
```

This will create the following tables:
- `WarrantyContract` (updated with new fields)
- `WarrantyNotification`
- `WarrantyPreferences`

### 4. Start Redis Server

**Option A: Local Redis**
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (using WSL or Docker)
docker run -d -p 6379:6379 redis:alpine
```

**Option B: Cloud Redis (Upstash)**
1. Sign up at https://upstash.com
2. Create a new Redis database
3. Copy the connection string to `REDIS_URL` in `.env`

### 5. Start the Background Worker

In a separate terminal window:

```bash
cd website
npm run worker:dev
```

You should see:
```
Starting SnapRegister background workers...
Initializing warranty worker...
Scheduled daily warranty status update job
Scheduled daily notification check job
Scheduled hourly notification processing job
Warranty worker initialized successfully!
Workers are running and waiting for jobs...
```

### 6. Start the Development Server

In your main terminal:

```bash
cd website
npm run dev
```

### 7. Test the System

#### Create a Test Warranty

You can create test data directly in the database or via the API:

```typescript
// Example: Create a test warranty that expires in 30 days
await prisma.warrantyContract.create({
  data: {
    userId: 'your-user-id',
    productId: 'your-product-id',
    documentUrl: 'https://example.com/warranty.pdf',
    documentType: 'pdf',
    fileName: 'warranty.pdf',
    fileSize: 12345,
    contractText: 'Sample warranty text',
    warrantyType: 'LIMITED',
    status: 'ACTIVE',
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    durationMonths: 12,
  },
});
```

#### Test Notification Sending

```bash
# Trigger manual notification check
curl -X POST http://localhost:3000/api/admin/trigger-warranty-check

# Or manually send a notification
curl -X POST http://localhost:3000/api/warranties/YOUR_WARRANTY_ID/notify \
  -H "Content-Type: application/json" \
  -d '{"notificationType":"EXPIRY_30_DAYS"}'
```

#### View the Dashboard

Navigate to: http://localhost:3000/dashboard/warranties

You should see:
- Warranty statistics
- Expiring warranties widget
- Warranty timeline
- Quick actions

## Production Deployment

### 1. Environment Setup

Update your production `.env`:

```env
# Use production Redis (Upstash recommended)
REDIS_URL=rediss://default:PASSWORD@endpoint.upstash.io:6379

# Production Resend API key
RESEND_API_KEY=re_prod_your_key_here
FROM_EMAIL=noreply@yourdomain.com

# Production app URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 2. Database Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Deploy Worker Process

The worker must run as a separate process. Options:

**Option A: Same server (using PM2)**
```bash
npm install -g pm2
pm2 start npm --name "warranty-worker" -- run worker:build
pm2 save
pm2 startup
```

**Option B: Separate worker dyno (Heroku)**
```
# Procfile
web: npm start
worker: npm run worker:build
```

**Option C: Background service (Vercel/Netlify)**
Use a serverless cron service or separate worker service like:
- Railway
- Render
- Fly.io

### 4. Set Up Monitoring

Monitor your background jobs:

```bash
# Add Bull Board for job monitoring
npm install @bull-board/express @bull-board/api
```

Create monitoring endpoint:
```typescript
// src/app/api/admin/jobs/route.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { warrantyQueue, warrantyStatusQueue } from '@/workers/warranty-worker';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/jobs');

createBullBoard({
  queues: [
    new BullMQAdapter(warrantyQueue),
    new BullMQAdapter(warrantyStatusQueue),
  ],
  serverAdapter,
});

export const GET = serverAdapter.registerPlugin();
```

Access at: `https://yourdomain.com/admin/jobs`

## Verification Checklist

- [ ] Redis connection working
- [ ] Resend API key valid
- [ ] Database migrations applied
- [ ] Worker process running
- [ ] Cron jobs scheduled (check logs)
- [ ] Test notification sent successfully
- [ ] Dashboard accessible
- [ ] Email templates rendering correctly
- [ ] Preferences can be saved
- [ ] Warranties showing correct status

## Troubleshooting

### Redis Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_URL` in `.env`
- For cloud Redis, verify connection string and credentials

### Worker Not Processing Jobs

**Check:**
1. Worker process is running
2. Redis connection is stable
3. Queue names match between job creator and worker
4. Check worker logs for errors

### Emails Not Sending

**Check:**
1. Resend API key is valid
2. `FROM_EMAIL` is verified in Resend dashboard
3. Check email logs table for errors
4. Verify recipient email addresses

### Notifications Not Scheduling

**Check:**
1. Warranty has valid `expiryDate`
2. User preferences allow notifications
3. Notification already sent (check `WarrantyNotification` table)
4. Cron job is running (check worker logs)

## Common Issues

### Issue: Duplicate Notifications

**Cause:** Multiple worker instances or missed de-duplication

**Solution:**
```typescript
// Check for existing notification before creating
const existing = await prisma.warrantyNotification.findFirst({
  where: {
    warrantyId,
    type,
    scheduledFor,
  },
});

if (!existing) {
  // Create notification
}
```

### Issue: Wrong Timezone

**Cause:** Server timezone differs from user timezone

**Solution:**
- Store user timezone in preferences
- Convert dates to user timezone before sending
- Use UTC for all database dates

### Issue: High Email Bounce Rate

**Solution:**
- Verify email addresses before sending
- Implement email validation
- Monitor bounce rates in Resend dashboard
- Clean inactive/bounced emails

## Maintenance

### Daily Tasks
- Monitor worker logs
- Check email delivery rates
- Review failed notification attempts

### Weekly Tasks
- Review notification preferences trends
- Analyze warranty expiration patterns
- Check queue health metrics

### Monthly Tasks
- Clean up old notification records
- Review and optimize cron schedules
- Update email templates based on feedback

## Support Resources

- Resend Documentation: https://resend.com/docs
- BullMQ Documentation: https://docs.bullmq.io
- Upstash Redis: https://docs.upstash.com/redis
- date-fns Documentation: https://date-fns.org

## Next Steps

After setup is complete:

1. Customize email templates in `src/emails/`
2. Add custom notification types
3. Integrate with mobile app for push notifications
4. Set up SMS notifications (optional)
5. Create admin dashboard for monitoring
6. Add analytics and reporting

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review worker logs
3. Check Redis connection
4. Verify environment variables
5. Test with manual API calls
6. File an issue in the repository

## Success!

Once everything is working, you should have:
- Automated warranty expiration tracking
- Email notifications at 90, 30, 7, and 1 day before expiration
- In-app notification center
- User-customizable preferences
- Background job processing
- Visual dashboard with timeline and widgets

Your warranty tracking system is now ready to help users never miss a warranty expiration!
