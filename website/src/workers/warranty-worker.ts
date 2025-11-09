// Warranty Background Worker - Handles warranty expiration checks and notifications

import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import {
  updateWarrantyStatuses,
  getWarrantiesNeedingNotification,
} from '@/services/warranty-service';
import {
  processPendingNotifications,
  scheduleWarrantyNotifications,
} from '@/services/warranty-notification-service';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create queues
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

// Queue Schedulers
const warrantyNotificationScheduler = new QueueScheduler(
  'warranty-notifications',
  { connection }
);

const warrantyStatusScheduler = new QueueScheduler('warranty-status-updates', {
  connection,
});

// Job Processors

/**
 * Worker for processing warranty notifications
 */
export const warrantyNotificationWorker = new Worker(
  'warranty-notifications',
  async (job) => {
    const { type, data } = job.data;

    console.log(`Processing warranty notification job: ${type}`, {
      jobId: job.id,
      data,
    });

    switch (type) {
      case 'check-and-send':
        return await checkAndSendNotifications();

      case 'send-notification':
        return await sendSingleNotification(data.notificationId);

      case 'schedule-warranty-notifications':
        return await scheduleWarrantyNotifications(data.warrantyId);

      case 'process-pending':
        return await processPendingNotifications();

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

/**
 * Worker for updating warranty statuses
 */
export const warrantyStatusWorker = new Worker(
  'warranty-status-updates',
  async (job) => {
    const { type } = job.data;

    console.log(`Processing warranty status job: ${type}`, {
      jobId: job.id,
    });

    switch (type) {
      case 'update-all-statuses':
        return await updateWarrantyStatuses();

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 1, // Run one at a time to avoid conflicts
  }
);

// Job Functions

/**
 * Check warranties and send notifications
 */
async function checkAndSendNotifications() {
  console.log('Checking warranties for notifications...');

  try {
    const warrantiesNeedingNotification =
      await getWarrantiesNeedingNotification([90, 30, 7, 1]);

    console.log(
      `Found ${warrantiesNeedingNotification.length} warranties needing notification`
    );

    for (const { warranty, daysUntilExpiry } of warrantiesNeedingNotification) {
      // Schedule notification for each warranty
      await warrantyQueue.add('schedule-warranty-notifications', {
        type: 'schedule-warranty-notifications',
        data: {
          warrantyId: warranty.id,
        },
      });
    }

    return {
      success: true,
      warrantiesChecked: warrantiesNeedingNotification.length,
    };
  } catch (error: any) {
    console.error('Error checking warranties for notifications:', error);
    throw error;
  }
}

/**
 * Send a single notification
 */
async function sendSingleNotification(notificationId: string) {
  console.log(`Sending notification: ${notificationId}`);

  try {
    const { sendWarrantyNotificationEmail } = await import(
      '@/services/warranty-notification-service'
    );
    const result = await sendWarrantyNotificationEmail(notificationId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }

    return {
      success: true,
      notificationId,
    };
  } catch (error: any) {
    console.error(`Error sending notification ${notificationId}:`, error);
    throw error;
  }
}

// Event Handlers

warrantyNotificationWorker.on('completed', (job) => {
  console.log(`Warranty notification job ${job.id} completed successfully`);
});

warrantyNotificationWorker.on('failed', (job, err) => {
  console.error(`Warranty notification job ${job?.id} failed:`, err);
});

warrantyStatusWorker.on('completed', (job) => {
  console.log(`Warranty status job ${job.id} completed successfully`);
});

warrantyStatusWorker.on('failed', (job, err) => {
  console.error(`Warranty status job ${job?.id} failed:`, err);
});

// Scheduled Jobs

/**
 * Schedule daily warranty status updates (runs at 12:00 AM)
 */
export async function scheduleDailyStatusUpdate() {
  await warrantyStatusQueue.add(
    'update-all-statuses',
    {
      type: 'update-all-statuses',
    },
    {
      repeat: {
        pattern: '0 0 * * *', // Daily at midnight
      },
    }
  );

  console.log('Scheduled daily warranty status update job');
}

/**
 * Schedule daily notification checks (runs at 8:00 AM)
 */
export async function scheduleDailyNotificationCheck() {
  await warrantyQueue.add(
    'check-and-send',
    {
      type: 'check-and-send',
    },
    {
      repeat: {
        pattern: '0 8 * * *', // Daily at 8 AM
      },
    }
  );

  console.log('Scheduled daily notification check job');
}

/**
 * Schedule pending notification processing (runs every hour)
 */
export async function scheduleHourlyNotificationProcessing() {
  await warrantyQueue.add(
    'process-pending',
    {
      type: 'process-pending',
    },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  );

  console.log('Scheduled hourly notification processing job');
}

// Helper functions for manual job triggering

/**
 * Manually trigger warranty status update
 */
export async function triggerStatusUpdate() {
  return await warrantyStatusQueue.add('update-all-statuses', {
    type: 'update-all-statuses',
  });
}

/**
 * Manually trigger notification check
 */
export async function triggerNotificationCheck() {
  return await warrantyQueue.add('check-and-send', {
    type: 'check-and-send',
  });
}

/**
 * Queue a notification for immediate sending
 */
export async function queueNotification(notificationId: string) {
  return await warrantyQueue.add('send-notification', {
    type: 'send-notification',
    data: {
      notificationId,
    },
  });
}

/**
 * Initialize all scheduled jobs
 */
export async function initializeWarrantyWorker() {
  console.log('Initializing warranty worker...');

  // Schedule recurring jobs
  await scheduleDailyStatusUpdate();
  await scheduleDailyNotificationCheck();
  await scheduleHourlyNotificationProcessing();

  console.log('Warranty worker initialized successfully');

  return {
    warrantyQueue,
    warrantyStatusQueue,
    warrantyNotificationWorker,
    warrantyStatusWorker,
  };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down warranty workers...');
  await warrantyNotificationWorker.close();
  await warrantyStatusWorker.close();
  await connection.quit();
  process.exit(0);
});

// Export for use in other modules
export default {
  warrantyQueue,
  warrantyStatusQueue,
  warrantyNotificationWorker,
  warrantyStatusWorker,
  initializeWarrantyWorker,
  triggerStatusUpdate,
  triggerNotificationCheck,
  queueNotification,
};
