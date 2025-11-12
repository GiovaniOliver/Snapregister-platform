/**
 * Health Check API
 * GET /api/health
 *
 * Returns system health status for uptime monitoring
 */

import { NextResponse } from 'next/server';
import { registrationMonitor } from '@/lib/monitoring/RegistrationMonitor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connectivity
    const dbHealthy = await checkDatabaseHealth();

    // Get system status
    const systemStatus = await registrationMonitor.getSystemStatus();

    // Overall health determination
    const isHealthy = dbHealthy && systemStatus.status !== 'outage';

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          registrationSystem: systemStatus.status,
          manufacturerHealth: systemStatus.manufacturerHealth.overall,
        },
        details: {
          systemStatus,
        },
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
