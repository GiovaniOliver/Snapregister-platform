/**
 * MetricsCollector - Collects and stores system metrics for monitoring
 *
 * Features:
 * - Track success/failure rates for automation
 * - Measure latencies and processing times
 * - Record error types and frequencies
 * - Monitor queue performance
 * - Track AI extraction metrics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum MetricType {
  AUTOMATION_SUCCESS = 'automation_success',
  AUTOMATION_FAILURE = 'automation_failure',
  OCR_PROCESSING = 'ocr_processing',
  WARRANTY_NOTIFICATION = 'warranty_notification',
  API_REQUEST = 'api_request',
  QUEUE_JOB = 'queue_job',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  CAPTCHA = 'captcha',
  TIMEOUT = 'timeout',
  AUTHENTICATION = 'authentication',
  FORM_CHANGE = 'form_change',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

export interface MetricData {
  type: MetricType;
  manufacturer?: string;
  success: boolean;
  latencyMs?: number;
  errorCategory?: ErrorCategory;
  errorMessage?: string;
  metadata?: Record<string, any>;
  userId?: string;
  registrationId?: string;
}

export interface MetricsSummary {
  totalCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorBreakdown: Record<ErrorCategory, number>;
}

export interface ManufacturerMetrics {
  manufacturer: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageLatency: number;
  lastAttemptAt: Date;
  commonErrors: Array<{ category: ErrorCategory; count: number }>;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private inMemoryMetrics: MetricData[] = [];
  private readonly MAX_IN_MEMORY = 1000;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record a metric event
   */
  async recordMetric(data: MetricData): Promise<void> {
    // Store in memory for real-time access
    this.inMemoryMetrics.push({
      ...data,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
      },
    });

    // Trim in-memory cache
    if (this.inMemoryMetrics.length > this.MAX_IN_MEMORY) {
      this.inMemoryMetrics = this.inMemoryMetrics.slice(-this.MAX_IN_MEMORY);
    }

    // Persist to database based on type
    try {
      switch (data.type) {
        case MetricType.AUTOMATION_SUCCESS:
        case MetricType.AUTOMATION_FAILURE:
          await this.recordAutomationMetric(data);
          break;

        case MetricType.OCR_PROCESSING:
          await this.recordOcrMetric(data);
          break;

        case MetricType.WARRANTY_NOTIFICATION:
          // Already tracked in WarrantyNotification table
          break;

        default:
          // Generic metric storage could go here
          break;
      }
    } catch (error) {
      console.error('Failed to persist metric:', error);
      // Don't throw - metrics collection should not break the app
    }
  }

  /**
   * Record automation attempt metric
   */
  private async recordAutomationMetric(data: MetricData): Promise<void> {
    if (!data.registrationId) return;

    await prisma.registration.update({
      where: { id: data.registrationId },
      data: {
        status: data.success ? 'COMPLETED' : 'FAILED',
        completedAt: data.success ? new Date() : undefined,
        errorMessage: data.errorMessage,
        errorCategory: data.errorCategory,
        metadata: data.metadata as any,
      },
    });
  }

  /**
   * Record OCR processing metric
   */
  private async recordOcrMetric(data: MetricData): Promise<void> {
    // OCR metrics are already tracked in AiExtractionMetric table
    // This could aggregate or supplement that data
  }

  /**
   * Get metrics summary for a time period
   */
  async getMetricsSummary(
    type: MetricType,
    startDate: Date,
    endDate: Date,
    manufacturer?: string
  ): Promise<MetricsSummary> {
    const metrics = this.inMemoryMetrics.filter(
      m =>
        m.type === type &&
        (!manufacturer || m.manufacturer === manufacturer) &&
        new Date(m.metadata?.timestamp || 0) >= startDate &&
        new Date(m.metadata?.timestamp || 0) <= endDate
    );

    const successCount = metrics.filter(m => m.success).length;
    const failureCount = metrics.filter(m => !m.success).length;
    const latencies = metrics.filter(m => m.latencyMs).map(m => m.latencyMs!);

    const errorBreakdown = metrics
      .filter(m => !m.success && m.errorCategory)
      .reduce((acc, m) => {
        const category = m.errorCategory!;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<ErrorCategory, number>);

    return {
      totalCount: metrics.length,
      successCount,
      failureCount,
      successRate: metrics.length > 0 ? successCount / metrics.length : 0,
      averageLatency: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
      p95Latency: this.calculatePercentile(latencies, 0.95),
      p99Latency: this.calculatePercentile(latencies, 0.99),
      errorBreakdown,
    };
  }

  /**
   * Get metrics by manufacturer
   */
  async getManufacturerMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ManufacturerMetrics[]> {
    const registrations = await prisma.registration.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        manufacturer: true,
        status: true,
        createdAt: true,
        errorCategory: true,
        metadata: true,
      },
    });

    const byManufacturer = registrations.reduce((acc, reg) => {
      const mfr = reg.manufacturer;
      if (!acc[mfr]) {
        acc[mfr] = {
          manufacturer: mfr,
          attempts: [],
        };
      }
      acc[mfr].attempts.push(reg);
      return acc;
    }, {} as Record<string, { manufacturer: string; attempts: any[] }>);

    return Object.values(byManufacturer).map(data => {
      const successCount = data.attempts.filter(
        a => a.status === 'COMPLETED'
      ).length;
      const failureCount = data.attempts.filter(
        a => a.status === 'FAILED'
      ).length;

      const errorCounts = data.attempts
        .filter(a => a.errorCategory)
        .reduce((acc, a) => {
          const category = a.errorCategory as ErrorCategory;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<ErrorCategory, number>);

      const latencies = data.attempts
        .filter(a => a.metadata?.latencyMs)
        .map(a => a.metadata.latencyMs as number);

      return {
        manufacturer: data.manufacturer,
        totalAttempts: data.attempts.length,
        successCount,
        failureCount,
        successRate: data.attempts.length > 0 ? successCount / data.attempts.length : 0,
        averageLatency: latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0,
        lastAttemptAt: new Date(Math.max(...data.attempts.map(a => new Date(a.createdAt).getTime()))),
        commonErrors: Object.entries(errorCounts)
          .map(([category, count]) => ({ category: category as ErrorCategory, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    });
  }

  /**
   * Get real-time metrics (last N records from memory)
   */
  getRealtimeMetrics(type?: MetricType, limit = 100): MetricData[] {
    let metrics = this.inMemoryMetrics;

    if (type) {
      metrics = metrics.filter(m => m.type === type);
    }

    return metrics.slice(-limit).reverse();
  }

  /**
   * Get health status for all manufacturers
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    manufacturers: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      successRate: number;
      lastSuccess?: Date;
      consecutiveFailures: number;
    }>;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const manufacturerMetrics = await this.getManufacturerMetrics(last24Hours, new Date());

    const manufacturers = manufacturerMetrics.map(m => {
      let status: 'healthy' | 'degraded' | 'unhealthy';

      if (m.successRate >= 0.85) {
        status = 'healthy';
      } else if (m.successRate >= 0.70) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      // Check for consecutive failures
      const recentAttempts = this.inMemoryMetrics
        .filter(metric => metric.manufacturer === m.manufacturer)
        .slice(-10);

      let consecutiveFailures = 0;
      for (let i = recentAttempts.length - 1; i >= 0; i--) {
        if (recentAttempts[i].success) break;
        consecutiveFailures++;
      }

      return {
        name: m.manufacturer,
        status,
        successRate: m.successRate,
        lastSuccess: m.lastAttemptAt,
        consecutiveFailures,
      };
    });

    // Determine overall health
    const unhealthyCount = manufacturers.filter(m => m.status === 'unhealthy').length;
    const degradedCount = manufacturers.filter(m => m.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > manufacturers.length * 0.3) {
      overall = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > manufacturers.length * 0.3) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      manufacturers,
    };
  }

  /**
   * Calculate percentile from array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;

    return sorted[index] || 0;
  }

  /**
   * Clear in-memory metrics (for testing)
   */
  clearInMemoryMetrics(): void {
    this.inMemoryMetrics = [];
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();
