'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemStatus {
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  health: {
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
  };
  manufacturerHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    manufacturers: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      successRate: number;
      lastSuccess?: Date;
      consecutiveFailures: number;
    }>;
  };
}

interface AutomationMetrics {
  totalCount: number;
  successRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  failureCount: number;
  errorBreakdown?: Record<string, number>;
}

interface OCRMetrics {
  totalCount: number;
  successRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
}

interface DashboardData {
  period: string;
  timestamp: string;
  systemStatus: SystemStatus;
  metrics: {
    automation: AutomationMetrics;
    ocr: OCRMetrics;
    byManufacturer: Array<{
      manufacturer: string;
      totalAttempts: number;
      successCount: number;
      failureCount: number;
      successRate: number;
      averageLatency: number;
      lastAttemptAt: string;
      commonErrors: Array<{ category: string; count: number }>;
    }>;
  };
  realtime: any[];
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { systemStatus, metrics } = data;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and analytics dashboard
          </p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <StatusBadge status={systemStatus.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-2xl font-bold">
                {formatUptime(systemStatus.uptime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last 24h Success Rate</p>
              <p className="text-2xl font-bold">
                {(systemStatus.health.metrics.last24Hours.successRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Latency (24h)</p>
              <p className="text-2xl font-bold">
                {(systemStatus.health.metrics.last24Hours.averageLatency / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {systemStatus.health.issues.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-yellow-900 mb-2">Active Issues:</p>
              <ul className="space-y-1">
                {systemStatus.health.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-yellow-800">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manufacturers">Manufacturers</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Automation Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <MetricRow
                    label="Total Attempts"
                    value={metrics.automation.totalCount}
                  />
                  <MetricRow
                    label="Success Rate"
                    value={`${(metrics.automation.successRate * 100).toFixed(1)}%`}
                  />
                  <MetricRow
                    label="Average Latency"
                    value={`${(metrics.automation.averageLatency / 1000).toFixed(1)}s`}
                  />
                  <MetricRow
                    label="P95 Latency"
                    value={`${(metrics.automation.p95Latency / 1000).toFixed(1)}s`}
                  />
                  <MetricRow
                    label="P99 Latency"
                    value={`${(metrics.automation.p99Latency / 1000).toFixed(1)}s`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* OCR Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>OCR Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <MetricRow
                    label="Total Processed"
                    value={metrics.ocr.totalCount}
                  />
                  <MetricRow
                    label="Success Rate"
                    value={`${(metrics.ocr.successRate * 100).toFixed(1)}%`}
                  />
                  <MetricRow
                    label="Average Latency"
                    value={`${(metrics.ocr.averageLatency / 1000).toFixed(1)}s`}
                  />
                  <MetricRow
                    label="P95 Latency"
                    value={`${(metrics.ocr.p95Latency / 1000).toFixed(1)}s`}
                  />
                  <MetricRow
                    label="P99 Latency"
                    value={`${(metrics.ocr.p99Latency / 1000).toFixed(1)}s`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manufacturers Tab */}
        <TabsContent value="manufacturers">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Manufacturer</th>
                      <th className="text-right p-3">Attempts</th>
                      <th className="text-right p-3">Success Rate</th>
                      <th className="text-right p-3">Avg Latency</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.byManufacturer.map(mfr => (
                      <tr key={mfr.manufacturer} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{mfr.manufacturer}</td>
                        <td className="p-3 text-right">{mfr.totalAttempts}</td>
                        <td className="p-3 text-right">
                          <span
                            className={
                              mfr.successRate >= 0.85
                                ? 'text-green-600 font-semibold'
                                : mfr.successRate >= 0.7
                                ? 'text-yellow-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {(mfr.successRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {(mfr.averageLatency / 1000).toFixed(1)}s
                        </td>
                        <td className="p-3 text-center">
                          <HealthBadge
                            status={
                              mfr.successRate >= 0.85
                                ? 'healthy'
                                : mfr.successRate >= 0.7
                                ? 'degraded'
                                : 'unhealthy'
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Analysis Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.automation.errorBreakdown || {}).map(
                  ([category, count]: [string, number]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-64 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (count / metrics.automation.failureCount) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-16 text-right">
                          {count} ({((count / metrics.automation.failureCount) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    outage: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100'}>
      {status}
    </Badge>
  );
}

function HealthBadge({ status }: { status: string }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    unhealthy: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100'}>
      {status}
    </Badge>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
