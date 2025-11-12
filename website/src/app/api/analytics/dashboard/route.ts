/**
 * Analytics Dashboard API
 * GET /api/analytics/dashboard
 *
 * Returns comprehensive analytics data for the monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector, MetricType } from '@/lib/monitoring/MetricsCollector';
import { registrationMonitor } from '@/lib/monitoring/RegistrationMonitor';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admins should access analytics
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get automation metrics
    const automationMetrics = await metricsCollector.getMetricsSummary(
      MetricType.AUTOMATION_SUCCESS,
      startDate,
      now
    );

    // Get OCR metrics
    const ocrMetrics = await metricsCollector.getMetricsSummary(
      MetricType.OCR_PROCESSING,
      startDate,
      now
    );

    // Get manufacturer-specific metrics
    const manufacturerMetrics = await metricsCollector.getManufacturerMetrics(
      startDate,
      now
    );

    // Get system health status
    const systemStatus = await registrationMonitor.getSystemStatus();

    // Get realtime metrics (last 100 events)
    const realtimeMetrics = metricsCollector.getRealtimeMetrics(undefined, 100);

    return NextResponse.json({
      period,
      timestamp: now.toISOString(),
      systemStatus,
      metrics: {
        automation: automationMetrics,
        ocr: ocrMetrics,
        byManufacturer: manufacturerMetrics,
      },
      realtime: realtimeMetrics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
