// API Route: Check for expiring warranties and send notifications
// This should be called by a cron job daily

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
const resend = new Resend(process.env.RESEND_API_KEY);

// Notification thresholds (days before expiry)
const NOTIFICATION_DAYS = [30, 14, 7, 3, 1];

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const notifications: any[] = [];

    // Check each notification threshold
    for (const days of NOTIFICATION_DAYS) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find products expiring on this specific day
      const expiringProducts = await prisma.product.findMany({
        where: {
          warrantyExpiry: {
            gte: targetDate,
            lt: nextDay,
          },
          status: 'READY',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              notificationsEnabled: true,
            },
          },
        },
      });

      // Send notifications
      for (const product of expiringProducts) {
        if (!product.user.notificationsEnabled) continue;

        try {
          // Send email notification
          await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@snapregister.com',
            to: product.user.email,
            subject: `Warranty Expiring Soon: ${product.productName}`,
            html: getEmailHTML({
              userName: product.user.firstName,
              productName: product.productName,
              manufacturer: product.manufacturerName,
              modelNumber: product.modelNumber || 'N/A',
              expiryDate: product.warrantyExpiry!,
              daysRemaining: days,
            }),
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: product.user.id,
              type: 'WARRANTY_EXPIRING',
              title: `Warranty expiring in ${days} ${days === 1 ? 'day' : 'days'}`,
              message: `Your warranty for ${product.productName} is expiring soon. Consider extending your coverage or preparing for renewal.`,
              actionUrl: `/products/${product.id}`,
            },
          });

          notifications.push({
            productId: product.id,
            productName: product.productName,
            userId: product.user.id,
            email: product.user.email,
            daysRemaining: days,
            notificationSent: true,
          });
        } catch (emailError) {
          console.error(`Failed to send notification for product ${product.id}:`, emailError);
          notifications.push({
            productId: product.id,
            error: 'Failed to send notification',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.length,
      notifications,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking expiring warranties:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check expiring warranties',
      },
      { status: 500 }
    );
  }
}

function getEmailHTML(data: {
  userName: string;
  productName: string;
  manufacturer: string;
  modelNumber: string;
  expiryDate: Date;
  daysRemaining: number;
}): string {
  const { userName, productName, manufacturer, modelNumber, expiryDate, daysRemaining } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Warranty Expiring Soon</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    ⚠️ Warranty Expiring Soon
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">
                    Hi ${userName},
                  </p>

                  <p style="font-size: 16px; color: #333333; margin: 0 0 30px;">
                    This is a friendly reminder that the warranty for your <strong>${productName}</strong> is expiring in <strong style="color: #e53e3e;">${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong>.
                  </p>

                  <!-- Product Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px; color: #2d3748; font-size: 18px;">Product Details</h3>
                        <table width="100%" cellpadding="5" cellspacing="0">
                          <tr>
                            <td style="color: #718096; font-size: 14px;">Product:</td>
                            <td style="color: #2d3748; font-size: 14px; font-weight: bold;">${productName}</td>
                          </tr>
                          <tr>
                            <td style="color: #718096; font-size: 14px;">Manufacturer:</td>
                            <td style="color: #2d3748; font-size: 14px; font-weight: bold;">${manufacturer}</td>
                          </tr>
                          <tr>
                            <td style="color: #718096; font-size: 14px;">Model Number:</td>
                            <td style="color: #2d3748; font-size: 14px; font-weight: bold; font-family: monospace;">${modelNumber}</td>
                          </tr>
                          <tr>
                            <td style="color: #718096; font-size: 14px;">Expiry Date:</td>
                            <td style="color: #e53e3e; font-size: 14px; font-weight: bold;">${new Date(expiryDate).toLocaleDateString()}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Items -->
                  <div style="background-color: #edf2f7; border-left: 4px solid #4299e1; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px; color: #2d3748; font-size: 16px;">What you should do:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
                      <li style="margin-bottom: 8px;">Consider purchasing an extended warranty</li>
                      <li style="margin-bottom: 8px;">Review your product's coverage details</li>
                      <li style="margin-bottom: 8px;">Contact the manufacturer about warranty extension options</li>
                      <li>Check if you're eligible for any promotional coverage extensions</li>
                    </ul>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/warranties"
                           style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                          View My Warranties
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                    <strong>SnapRegister</strong> - Never miss a warranty expiration
                  </p>
                  <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                    You're receiving this because you have warranty notifications enabled.
                    <br>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #667eea; text-decoration: none;">Manage preferences</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
