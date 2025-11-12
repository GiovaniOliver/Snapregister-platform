/**
 * Manufacturer Analytics API
 * GET /api/analytics/manufacturers
 *
 * Returns detailed analytics for each manufacturer
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/monitoring/MetricsCollector';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const manufacturer = searchParams.get('manufacturer');
    const period = searchParams.get('period') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
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
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get manufacturer metrics
    const manufacturerMetrics = await metricsCollector.getManufacturerMetrics(
      startDate,
      now
    );

    // Filter by specific manufacturer if requested
    const filteredMetrics = manufacturer
      ? manufacturerMetrics.filter(m => m.manufacturer === manufacturer)
      : manufacturerMetrics;

    // Sort by success rate (ascending) to show problematic ones first
    const sortedMetrics = filteredMetrics.sort(
      (a, b) => a.successRate - b.successRate
    );

    return NextResponse.json({
      period,
      timestamp: now.toISOString(),
      count: sortedMetrics.length,
      manufacturers: sortedMetrics,
    });
  } catch (error) {
    console.error('Error fetching manufacturer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer analytics' },
      { status: 500 }
    );
  }
}
