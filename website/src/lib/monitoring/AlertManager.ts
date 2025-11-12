/**
 * AlertManager - Manages alerts and notifications for system issues
 */

import { Resend } from 'resend';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface AlertConfig {
  emailEnabled: boolean;
  slackEnabled: boolean;
  adminEmails: string[];
  slackWebhookUrl?: string;
  minSeverity: AlertSeverity;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

export class AlertManager {
  private static instance: AlertManager;
  private resend: Resend | null = null;
  private alertHistory: Alert[] = [];
  private readonly MAX_HISTORY = 1000;

  private config: AlertConfig = {
    emailEnabled: true,
    slackEnabled: false,
    adminEmails: process.env.ADMIN_EMAILS?.split(',') || [],
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    minSeverity: 'warning',
  };

  private constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Update alert configuration
   */
  configure(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send an alert through configured channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    // Add timestamp
    const fullAlert: Alert = {
      ...alert,
      timestamp: alert.timestamp || new Date(),
    };

    // Store in history
    this.alertHistory.push(fullAlert);
    if (this.alertHistory.length > this.MAX_HISTORY) {
      this.alertHistory = this.alertHistory.slice(-this.MAX_HISTORY);
    }

    // Check if severity meets minimum threshold
    if (SEVERITY_ORDER[alert.severity] < SEVERITY_ORDER[this.config.minSeverity]) {
      return; // Don't send alerts below threshold
    }

    // Log to console
    this.logAlert(fullAlert);

    // Send through configured channels
    const promises: Promise<any>[] = [];

    if (this.config.emailEnabled && this.config.adminEmails.length > 0) {
      promises.push(this.sendEmailAlert(fullAlert));
    }

    if (this.config.slackEnabled && this.config.slackWebhookUrl) {
      promises.push(this.sendSlackAlert(fullAlert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send alert via email
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.resend) {
      console.error('Resend not configured - cannot send email alert');
      return;
    }

    try {
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
      const html = this.generateEmailHtml(alert);

      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'alerts@snapregister.com',
        to: this.config.adminEmails,
        subject,
        html,
      });

      console.log(`Email alert sent to ${this.config.adminEmails.join(', ')}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    try {
      const color = this.getSeverityColor(alert.severity);
      const payload = {
        attachments: [
          {
            color,
            title: alert.title,
            text: alert.message,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Timestamp',
                value: alert.timestamp?.toISOString() || new Date().toISOString(),
                short: true,
              },
            ],
            footer: 'SnapRegister Monitoring',
            ts: Math.floor((alert.timestamp?.getTime() || Date.now()) / 1000),
          },
        ],
      };

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`);
      }

      console.log('Slack alert sent');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Log alert to console
   */
  private logAlert(alert: Alert): void {
    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = alert.timestamp?.toISOString() || new Date().toISOString();

    console.log(`\n${emoji} ALERT [${alert.severity.toUpperCase()}] ${timestamp}`);
    console.log(`Title: ${alert.title}`);
    console.log(`Message: ${alert.message}`);

    if (alert.metadata) {
      console.log('Metadata:', JSON.stringify(alert.metadata, null, 2));
    }

    console.log('---\n');
  }

  /**
   * Generate HTML for email alert
   */
  private generateEmailHtml(alert: Alert): string {
    const color = this.getSeverityColor(alert.severity);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .severity { font-weight: bold; text-transform: uppercase; }
            .metadata { background: white; padding: 10px; border-radius: 3px; margin-top: 10px; }
            pre { background: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${alert.title}</h2>
              <p class="severity">Severity: ${alert.severity}</p>
            </div>
            <div class="content">
              <p><strong>Message:</strong></p>
              <p>${alert.message}</p>

              <p><strong>Timestamp:</strong> ${alert.timestamp?.toISOString() || new Date().toISOString()}</p>

              ${
                alert.metadata
                  ? `
                <div class="metadata">
                  <p><strong>Additional Details:</strong></p>
                  <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get color code for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      info: '#3498db',
      warning: '#f39c12',
      error: '#e74c3c',
      critical: '#c0392b',
    };
    return colors[severity];
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis: Record<AlertSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return emojis[severity];
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100, minSeverity?: AlertSeverity): Alert[] {
    let alerts = this.alertHistory;

    if (minSeverity) {
      const minOrder = SEVERITY_ORDER[minSeverity];
      alerts = alerts.filter(a => SEVERITY_ORDER[a.severity] >= minOrder);
    }

    return alerts.slice(-limit).reverse();
  }

  /**
   * Clear alert history (for testing)
   */
  clearHistory(): void {
    this.alertHistory = [];
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance();
