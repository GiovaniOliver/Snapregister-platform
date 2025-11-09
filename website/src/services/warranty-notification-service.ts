// Warranty Notification Service

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import {
  WarrantyNotificationType,
  NotificationChannel,
} from '@/types/warranty';
import { format } from 'date-fns';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationParams {
  warrantyId: string;
  userId: string;
  type: WarrantyNotificationType;
  scheduledFor: Date;
  channel: NotificationChannel;
  recipient: string;
  productName: string;
  manufacturer: string;
  expiryDate: Date;
  daysRemaining: number;
}

/**
 * Create a warranty notification record
 */
export async function createWarrantyNotification(params: NotificationParams) {
  const { subject, message } = generateNotificationContent(
    params.type,
    params.productName,
    params.manufacturer,
    params.expiryDate,
    params.daysRemaining
  );

  const notification = await prisma.warrantyNotification.create({
    data: {
      warrantyId: params.warrantyId,
      type: params.type,
      scheduledFor: params.scheduledFor,
      status: 'SCHEDULED',
      channel: params.channel,
      recipient: params.recipient,
      subject,
      message,
    },
  });

  return notification;
}

/**
 * Send a warranty notification email
 */
export async function sendWarrantyNotificationEmail(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const notification = await prisma.warrantyNotification.findUnique({
      where: { id: notificationId },
      include: {
        warranty: {
          include: {
            user: true,
            product: true,
          },
        },
      },
    });

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    if (notification.status === 'SENT') {
      return { success: true }; // Already sent
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@snapregister.com',
      to: notification.recipient,
      subject: notification.subject,
      html: generateEmailHTML(notification),
    });

    if (error) {
      // Update notification with error
      await prisma.warrantyNotification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          error: error.message,
          attempts: notification.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });

      return { success: false, error: error.message };
    }

    // Update notification as sent
    await prisma.warrantyNotification.update({
      where: { id: notificationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        emailId: data?.id,
        attempts: notification.attempts + 1,
        lastAttemptAt: new Date(),
      },
    });

    // Create in-app notification
    await createInAppNotification(notification);

    // Log email
    await prisma.emailLog.create({
      data: {
        userId: notification.warranty.userId,
        type: 'WARRANTY_REMINDER',
        recipient: notification.recipient,
        subject: notification.subject,
        sent: true,
        sentAt: new Date(),
        messageId: data?.id,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending warranty notification:', error);

    // Update notification with error
    await prisma.warrantyNotification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        error: error.message,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    return { success: false, error: error.message };
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(notification: any) {
  const warranty = notification.warranty;

  await prisma.notification.create({
    data: {
      userId: warranty.userId,
      type: 'WARRANTY_EXPIRING',
      title: notification.subject,
      message: notification.message,
      actionUrl: `/dashboard/warranties/${warranty.id}`,
    },
  });
}

/**
 * Generate notification content based on type
 */
function generateNotificationContent(
  type: WarrantyNotificationType,
  productName: string,
  manufacturer: string,
  expiryDate: Date,
  daysRemaining: number
): { subject: string; message: string } {
  const formattedDate = format(expiryDate, 'MMMM d, yyyy');

  switch (type) {
    case WarrantyNotificationType.EXPIRY_90_DAYS:
      return {
        subject: `Warranty Expiring in 90 Days - ${productName}`,
        message: `Your warranty for ${productName} by ${manufacturer} will expire in 90 days on ${formattedDate}. Consider reviewing your coverage and exploring renewal options.`,
      };

    case WarrantyNotificationType.EXPIRY_30_DAYS:
      return {
        subject: `Warranty Expiring Soon - ${productName}`,
        message: `Your warranty for ${productName} by ${manufacturer} will expire in 30 days on ${formattedDate}. Now is a good time to file any pending claims or consider extending your warranty.`,
      };

    case WarrantyNotificationType.EXPIRY_7_DAYS:
      return {
        subject: `Warranty Expires This Week - ${productName}`,
        message: `IMPORTANT: Your warranty for ${productName} by ${manufacturer} expires in just 7 days on ${formattedDate}. Contact the manufacturer if you need to file a claim or extend coverage.`,
      };

    case WarrantyNotificationType.EXPIRY_1_DAY:
      return {
        subject: `Warranty Expires Tomorrow - ${productName}`,
        message: `URGENT: Your warranty for ${productName} by ${manufacturer} expires tomorrow on ${formattedDate}. This is your last chance to file any claims or extend your coverage.`,
      };

    case WarrantyNotificationType.EXPIRED:
      return {
        subject: `Warranty Expired - ${productName}`,
        message: `Your warranty for ${productName} by ${manufacturer} has expired as of ${formattedDate}. You may still have options for extended coverage or service plans.`,
      };

    case WarrantyNotificationType.RENEWAL_AVAILABLE:
      return {
        subject: `Warranty Renewal Available - ${productName}`,
        message: `A warranty renewal option is available for your ${productName} by ${manufacturer}. Extend your coverage to continue enjoying peace of mind.`,
      };

    default:
      return {
        subject: `Warranty Notification - ${productName}`,
        message: `This is a notification about your warranty for ${productName} by ${manufacturer}.`,
      };
  }
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(notification: any): string {
  const warranty = notification.warranty;
  const product = warranty.product;
  const user = warranty.user;
  const formattedDate = warranty.expiryDate
    ? format(new Date(warranty.expiryDate), 'MMMM d, yyyy')
    : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .product-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .product-info h3 {
            margin-top: 0;
            color: #667eea;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #666;
          }
          .value {
            color: #333;
          }
          .alert-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Warranty Notification</h1>
        </div>

        <div class="content">
          <p>Hello ${user.firstName},</p>

          <p>${notification.message}</p>

          <div class="product-info">
            <h3>Product Details</h3>
            <div class="info-row">
              <span class="label">Product:</span>
              <span class="value">${product?.productName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Manufacturer:</span>
              <span class="value">${product?.manufacturer || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Warranty Type:</span>
              <span class="value">${warranty.warrantyType}</span>
            </div>
            <div class="info-row">
              <span class="label">Expiration Date:</span>
              <span class="value">${formattedDate}</span>
            </div>
          </div>

          ${
            notification.type === WarrantyNotificationType.EXPIRY_7_DAYS ||
            notification.type === WarrantyNotificationType.EXPIRY_1_DAY
              ? `
          <div class="alert-box">
            <strong>Action Required:</strong> Your warranty is expiring soon. Review your coverage and take action if needed.
          </div>
          `
              : ''
          }

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/warranties/${warranty.id}" class="button">
              View Warranty Details
            </a>
          </center>

          <p>You can manage your notification preferences in your account settings.</p>
        </div>

        <div class="footer">
          <p>This email was sent by SnapRegister</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">
              Manage Notification Preferences
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Schedule notifications for a warranty
 */
export async function scheduleWarrantyNotifications(warrantyId: string) {
  const warranty = await prisma.warrantyContract.findUnique({
    where: { id: warrantyId },
    include: {
      user: {
        include: {
          warrantyPreferences: true,
        },
      },
      product: true,
    },
  });

  if (!warranty || !warranty.expiryDate) {
    return;
  }

  const preferences =
    warranty.user.warrantyPreferences || getDefaultPreferences();

  // Delete existing pending notifications
  await prisma.warrantyNotification.deleteMany({
    where: {
      warrantyId,
      status: 'PENDING',
    },
  });

  const notifications: Array<{
    type: WarrantyNotificationType;
    daysBeforeExpiry: number;
    enabled: boolean;
  }> = [
    {
      type: WarrantyNotificationType.EXPIRY_90_DAYS,
      daysBeforeExpiry: 90,
      enabled: preferences.reminder90Days,
    },
    {
      type: WarrantyNotificationType.EXPIRY_30_DAYS,
      daysBeforeExpiry: 30,
      enabled: preferences.reminder30Days,
    },
    {
      type: WarrantyNotificationType.EXPIRY_7_DAYS,
      daysBeforeExpiry: 7,
      enabled: preferences.reminder7Days,
    },
    {
      type: WarrantyNotificationType.EXPIRY_1_DAY,
      daysBeforeExpiry: 1,
      enabled: preferences.reminder1Day,
    },
  ];

  const today = new Date();

  for (const notif of notifications) {
    if (!notif.enabled) continue;

    const scheduledDate = new Date(warranty.expiryDate);
    scheduledDate.setDate(scheduledDate.getDate() - notif.daysBeforeExpiry);

    // Only schedule future notifications
    if (scheduledDate > today) {
      await createWarrantyNotification({
        warrantyId: warranty.id,
        userId: warranty.userId,
        type: notif.type,
        scheduledFor: scheduledDate,
        channel: NotificationChannel.EMAIL,
        recipient: warranty.user.email,
        productName: warranty.product?.productName || 'Unknown Product',
        manufacturer: warranty.product?.manufacturer || 'Unknown',
        expiryDate: warranty.expiryDate,
        daysRemaining: notif.daysBeforeExpiry,
      });
    }
  }
}

/**
 * Process pending notifications (run as background job)
 */
export async function processPendingNotifications(): Promise<{
  processed: number;
  failed: number;
}> {
  let processed = 0;
  let failed = 0;

  const now = new Date();

  const pendingNotifications = await prisma.warrantyNotification.findMany({
    where: {
      status: {
        in: ['PENDING', 'SCHEDULED'],
      },
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      warranty: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const notification of pendingNotifications) {
    const result = await sendWarrantyNotificationEmail(notification.id);

    if (result.success) {
      processed++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { processed, failed };
}

function getDefaultPreferences() {
  return {
    reminder90Days: true,
    reminder30Days: true,
    reminder7Days: true,
    reminder1Day: true,
    emailEnabled: true,
    inAppEnabled: true,
  };
}
