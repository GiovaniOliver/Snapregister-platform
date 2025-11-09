# BullMQ Configuration for SnapRegister

This document explains the BullMQ job queue configuration for the SnapRegister backend and provides best practices for production deployment.

## Overview

SnapRegister uses BullMQ for background job processing, including:

- **Warranty Status Updates**: Daily job to check and update warranty statuses
- **Warranty Notifications**: Daily job to check warranties needing notification
- **Email Sending**: Individual jobs to send warranty expiration emails
- **Notification Processing**: Hourly job to process pending notifications

## Architecture

```
┌─────────────────────┐
│   Next.js App       │
│                     │
│  Creates Jobs       │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│   Redis Server      │
│                     │
│  Stores Job Queues  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│   BullMQ Workers    │
│                     │
│  Process Jobs       │
└─────────────────────┘
```

## Queue Configuration

### Connection Setup

Located in `website/src/workers/warranty-worker.ts`:

```typescript
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});
```

**Configuration Options**:

- `maxRetriesPerRequest: null` - Required for BullMQ, allows unlimited retries for long-running operations
- `enableReadyCheck: true` - Ensures Redis is ready before accepting commands
- `enableOfflineQueue: true` - Queues commands while disconnected and replays when reconnected

### Queue Definitions

Two main queues are defined:

#### 1. Warranty Notifications Queue

```typescript
export const warrantyQueue = new Queue('warranty-notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
```

**Purpose**: Handles all warranty notification-related jobs

**Job Types**:
- `check-and-send` - Check warranties and queue notifications
- `send-notification` - Send individual email notification
- `schedule-warranty-notifications` - Schedule notifications for a warranty
- `process-pending` - Process pending notifications

**Default Options**:
- `attempts: 3` - Retry up to 3 times on failure
- `backoff: exponential` - Wait progressively longer between retries (1s, 2s, 4s)

#### 2. Warranty Status Queue

```typescript
export const warrantyStatusQueue = new Queue('warranty-status-updates', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

**Purpose**: Handles warranty status update jobs

**Job Types**:
- `update-all-statuses` - Update all warranty statuses

**Default Options**:
- `attempts: 2` - Fewer retries since this is idempotent
- `backoff: exponential` - Starting at 2 seconds

### Queue Schedulers

BullMQ Queue Schedulers enable delayed and repeated jobs:

```typescript
const warrantyNotificationScheduler = new QueueScheduler(
  'warranty-notifications',
  { connection }
);

const warrantyStatusScheduler = new QueueScheduler('warranty-status-updates', {
  connection,
});
```

**Note**: Queue Schedulers must be running for scheduled/repeated jobs to execute.

## Worker Configuration

### Warranty Notification Worker

```typescript
export const warrantyNotificationWorker = new Worker(
  'warranty-notifications',
  async (job) => {
    // Process job based on type
    const { type, data } = job.data;
    // ... processing logic
  },
  {
    connection,
    concurrency: 5,
  }
);
```

**Concurrency**: 5 jobs processed simultaneously

**Suitable for**: I/O-bound tasks like sending emails

### Warranty Status Worker

```typescript
export const warrantyStatusWorker = new Worker(
  'warranty-status-updates',
  async (job) => {
    // Process status updates
    // ... processing logic
  },
  {
    connection,
    concurrency: 1,
  }
);
```

**Concurrency**: 1 job at a time

**Reason**: Prevents race conditions when updating warranty statuses

## Scheduled Jobs

### Daily Status Update (Midnight)

```typescript
await warrantyStatusQueue.add(
  'update-all-statuses',
  { type: 'update-all-statuses' },
  {
    repeat: {
      pattern: '0 0 * * *', // Cron: Daily at 12:00 AM
    },
  }
);
```

### Daily Notification Check (8:00 AM)

```typescript
await warrantyQueue.add(
  'check-and-send',
  { type: 'check-and-send' },
  {
    repeat: {
      pattern: '0 8 * * *', // Cron: Daily at 8:00 AM
    },
  }
);
```

### Hourly Notification Processing

```typescript
await warrantyQueue.add(
  'process-pending',
  { type: 'process-pending' },
  {
    repeat: {
      pattern: '0 * * * *', // Cron: Every hour
    },
  }
);
```

## Error Handling

### Worker Event Listeners

```typescript
warrantyNotificationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

warrantyNotificationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

### Job-Level Error Handling

Each job processor includes try-catch blocks:

```typescript
async function checkAndSendNotifications() {
  try {
    // ... business logic
    return { success: true, warrantiesChecked: count };
  } catch (error: any) {
    console.error('Error checking warranties:', error);
    throw error; // Re-throw to trigger retry
  }
}
```

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  console.log('Shutting down warranty workers...');
  await warrantyNotificationWorker.close();
  await warrantyStatusWorker.close();
  await connection.quit();
  process.exit(0);
});
```

## Production Best Practices

### 1. Connection Pooling

BullMQ automatically manages connection pooling. Each queue and worker uses `connection.duplicate()` internally.

### 2. Job Retention

Configure job retention to prevent Redis memory issues:

```typescript
// Clean up old jobs periodically
await warrantyQueue.clean(24 * 3600 * 1000, 100, 'completed'); // Keep 24 hours of completed jobs
await warrantyQueue.clean(7 * 24 * 3600 * 1000, 100, 'failed'); // Keep 7 days of failed jobs
```

### 3. Rate Limiting

Prevent overwhelming external services:

```typescript
const queue = new Queue('warranty-notifications', {
  connection,
  limiter: {
    max: 10,      // 10 jobs
    duration: 1000 // per second
  }
});
```

### 4. Job Priority

Prioritize urgent notifications:

```typescript
await warrantyQueue.add(
  'send-notification',
  { notificationId: '123' },
  { priority: 1 } // Lower number = higher priority
);
```

### 5. Job Timeout

Prevent jobs from hanging:

```typescript
const worker = new Worker(
  'warranty-notifications',
  async (job) => { /* ... */ },
  {
    connection,
    concurrency: 5,
    lockDuration: 30000,  // 30 seconds max per job
  }
);
```

### 6. Metrics and Monitoring

Monitor queue health:

```typescript
// Get queue metrics
const counts = await warrantyQueue.getJobCounts();
console.log('Queue metrics:', counts);
// { waiting: 5, active: 2, completed: 100, failed: 3 }

// Get failed jobs
const failedJobs = await warrantyQueue.getFailed();
```

### 7. Redis Persistence

Ensure Redis is configured with persistence:

```bash
# In redis.conf
appendonly yes
appendfsync everysec
```

### 8. Multiple Worker Instances

Scale horizontally by running multiple worker processes:

```bash
# Terminal 1
npm run worker:dev

# Terminal 2 (optional, for scaling)
npm run worker:dev
```

BullMQ automatically distributes jobs across workers.

### 9. Environment-Specific Configuration

```typescript
const concurrency = process.env.NODE_ENV === 'production' ? 10 : 5;

const worker = new Worker(
  'warranty-notifications',
  async (job) => { /* ... */ },
  { connection, concurrency }
);
```

### 10. Dead Letter Queue

Handle permanently failed jobs:

```typescript
warrantyNotificationWorker.on('failed', async (job, error) => {
  if (job && job.attemptsMade >= job.opts.attempts!) {
    // Job has exhausted all retries
    console.error('Job permanently failed:', job.id, error);

    // Log to monitoring service
    // await logToMonitoring(job, error);

    // Store in database for manual review
    // await db.failedJobs.create({ jobId: job.id, error: error.message });
  }
});
```

## Monitoring and Debugging

### BullMQ Board (UI Dashboard)

Install BullMQ Board for a web interface:

```bash
npm install @bull-board/api @bull-board/ui @bull-board/express
```

Set up in your Next.js API routes:

```typescript
// pages/api/admin/queues.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(warrantyQueue),
    new BullMQAdapter(warrantyStatusQueue),
  ],
  serverAdapter,
});

export default serverAdapter.getRouter();
```

### Redis CLI Monitoring

```bash
# Monitor all Redis commands
redis-cli MONITOR

# View specific queue keys
redis-cli KEYS "bull:warranty-notifications:*"

# Get queue length
redis-cli LLEN "bull:warranty-notifications:waiting"

# View job data
redis-cli GET "bull:warranty-notifications:job-id"
```

### Logging Best Practices

Add structured logging:

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('warranty-worker');

warrantyNotificationWorker.on('completed', (job, result) => {
  logger.info('Job completed', {
    jobId: job.id,
    type: job.data.type,
    result,
    duration: job.finishedOn! - job.processedOn!,
  });
});

warrantyNotificationWorker.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    type: job?.data?.type,
    error: error.message,
    stack: error.stack,
    attemptsMade: job?.attemptsMade,
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Jobs Not Processing

**Symptoms**: Jobs stay in "waiting" state

**Solutions**:
- Ensure worker is running: `npm run worker:dev`
- Check Redis connection: `redis-cli ping`
- Verify Queue Scheduler is running
- Check worker logs for errors

#### 2. Jobs Failing Repeatedly

**Symptoms**: Jobs in "failed" state

**Solutions**:
- Check error logs in worker output
- Verify external service connectivity (email, database)
- Increase retry attempts
- Add more specific error handling

#### 3. Memory Issues

**Symptoms**: Redis running out of memory

**Solutions**:
- Implement job cleanup
- Reduce job retention period
- Increase Redis memory limit
- Monitor queue sizes

#### 4. Duplicate Jobs

**Symptoms**: Same job processing multiple times

**Solutions**:
- Use unique `jobId` for idempotent operations
- Set `removeOnComplete: true` for one-time jobs
- Check for duplicate job additions in code

#### 5. Slow Job Processing

**Symptoms**: Jobs taking too long

**Solutions**:
- Increase worker concurrency
- Optimize job processing logic
- Add database indexes
- Use job timeouts

## Testing

### Manual Job Testing

```typescript
// In Next.js API route or console
import { warrantyQueue } from '@/workers/warranty-worker';

// Add test job
const job = await warrantyQueue.add('check-and-send', {
  type: 'check-and-send',
});

console.log('Job added:', job.id);

// Check job status
const jobStatus = await job.getState();
console.log('Job status:', jobStatus);

// Wait for completion
await job.waitUntilFinished();
```

### Automated Testing

Use the test script:

```bash
npm run test:redis
```

This tests:
- Redis connectivity
- Queue creation
- Job creation
- Worker processing
- Cleanup

## Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [BullMQ Patterns](https://docs.bullmq.io/patterns/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Cron Pattern Reference](https://crontab.guru/)

## Summary

The SnapRegister BullMQ configuration is production-ready with:

- Proper error handling and retries
- Graceful shutdown handling
- Separate queues for different job types
- Appropriate concurrency levels
- Scheduled recurring jobs
- Event listeners for monitoring

Follow the production best practices outlined above to ensure reliable background job processing.
