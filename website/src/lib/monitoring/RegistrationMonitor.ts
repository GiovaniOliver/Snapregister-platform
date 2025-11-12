/**
 * RegistrationMonitor - Monitors registration system health and performance
 */

import { metricsCollector, MetricType, ErrorCategory } from './MetricsCollector';
import { alertManager } from './AlertManager';

export interface RegistrationHealth {
  isHealthy: boolean;
  issues: string[];
  metrics: {
    last24Hours: {
      totalAttempts: number;
      successRate: number;
      averageLatency: number;
    };
    lastHour: {
      totalAttempts: number;
      successRate: number;
      averageLatency: number;
    };
  };
}

export class RegistrationMonitor {
  private static instance: RegistrationMonitor;
  private checkInterval: NodeJS.Timeout | null = null;

  // Thresholds for alerting
  private readonly THRESHOLDS = {
    MIN_SUCCESS_RATE: 0.85, // Alert if below 85%
    MAX_AVG_LATENCY: 120000, // Alert if above 2 minutes
    CONSECUTIVE_FAILURES: 5, // Alert after 5 consecutive failures
    MIN_SUCCESS_RATE_CRITICAL: 0.70, // Critical alert if below 70%
  };

  private constructor() {}

  static getInstance(): RegistrationMonitor {
    if (!RegistrationMonitor.instance) {
      RegistrationMonitor.instance = new RegistrationMonitor();
    }
    return RegistrationMonitor.instance;
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring(intervalMs = 300000): void {
    // Check every 5 minutes by default
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // Perform initial check
    this.performHealthCheck();

    console.log(`Registration monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Registration monitoring stopped');
    }
  }

  /**
   * Perform health check and trigger alerts if needed
   */
  async performHealthCheck(): Promise<RegistrationHealth> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const issues: string[] = [];

    // Get metrics for last 24 hours
    const summary24h = await metricsCollector.getMetricsSummary(
      MetricType.AUTOMATION_SUCCESS,
      last24Hours,
      now
    );

    // Get metrics for last hour
    const summary1h = await metricsCollector.getMetricsSummary(
      MetricType.AUTOMATION_SUCCESS,
      lastHour,
      now
    );

    // Check success rate (24h)
    if (summary24h.successRate < this.THRESHOLDS.MIN_SUCCESS_RATE_CRITICAL) {
      issues.push(`CRITICAL: Success rate at ${(summary24h.successRate * 100).toFixed(1)}% (threshold: ${this.THRESHOLDS.MIN_SUCCESS_RATE_CRITICAL * 100}%)`);
      await alertManager.sendAlert({
        severity: 'critical',
        title: 'Registration Success Rate Critical',
        message: `Success rate has dropped to ${(summary24h.successRate * 100).toFixed(1)}% over the last 24 hours`,
        metadata: { summary24h },
      });
    } else if (summary24h.successRate < this.THRESHOLDS.MIN_SUCCESS_RATE) {
      issues.push(`WARNING: Success rate at ${(summary24h.successRate * 100).toFixed(1)}% (threshold: ${this.THRESHOLDS.MIN_SUCCESS_RATE * 100}%)`);
      await alertManager.sendAlert({
        severity: 'warning',
        title: 'Registration Success Rate Low',
        message: `Success rate has dropped to ${(summary24h.successRate * 100).toFixed(1)}% over the last 24 hours`,
        metadata: { summary24h },
      });
    }

    // Check latency
    if (summary24h.averageLatency > this.THRESHOLDS.MAX_AVG_LATENCY) {
      issues.push(`WARNING: Average latency at ${(summary24h.averageLatency / 1000).toFixed(1)}s (threshold: ${this.THRESHOLDS.MAX_AVG_LATENCY / 1000}s)`);
      await alertManager.sendAlert({
        severity: 'warning',
        title: 'High Registration Latency',
        message: `Average latency is ${(summary24h.averageLatency / 1000).toFixed(1)}s, exceeding threshold of ${this.THRESHOLDS.MAX_AVG_LATENCY / 1000}s`,
        metadata: { summary24h },
      });
    }

    // Check manufacturer health
    const healthStatus = await metricsCollector.getHealthStatus();

    healthStatus.manufacturers.forEach(mfr => {
      if (mfr.consecutiveFailures >= this.THRESHOLDS.CONSECUTIVE_FAILURES) {
        issues.push(`ALERT: ${mfr.name} has ${mfr.consecutiveFailures} consecutive failures`);
        alertManager.sendAlert({
          severity: 'error',
          title: `${mfr.name} Automation Failing`,
          message: `${mfr.name} has experienced ${mfr.consecutiveFailures} consecutive failures`,
          metadata: { manufacturer: mfr },
        });
      }

      if (mfr.status === 'unhealthy') {
        issues.push(`UNHEALTHY: ${mfr.name} at ${(mfr.successRate * 100).toFixed(1)}% success rate`);
      }
    });

    const isHealthy = issues.length === 0;

    return {
      isHealthy,
      issues,
      metrics: {
        last24Hours: {
          totalAttempts: summary24h.totalCount,
          successRate: summary24h.successRate,
          averageLatency: summary24h.averageLatency,
        },
        lastHour: {
          totalAttempts: summary1h.totalCount,
          successRate: summary1h.successRate,
          averageLatency: summary1h.averageLatency,
        },
      },
    };
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<{
    status: 'operational' | 'degraded' | 'outage';
    uptime: number;
    health: RegistrationHealth;
    manufacturerHealth: Awaited<ReturnType<typeof metricsCollector.getHealthStatus>>;
  }> {
    const health = await this.performHealthCheck();
    const manufacturerHealth = await metricsCollector.getHealthStatus();

    let status: 'operational' | 'degraded' | 'outage';

    if (manufacturerHealth.overall === 'unhealthy' || !health.isHealthy) {
      status = 'outage';
    } else if (manufacturerHealth.overall === 'degraded') {
      status = 'degraded';
    } else {
      status = 'operational';
    }

    return {
      status,
      uptime: process.uptime(),
      health,
      manufacturerHealth,
    };
  }
}

// Export singleton instance
export const registrationMonitor = RegistrationMonitor.getInstance();
