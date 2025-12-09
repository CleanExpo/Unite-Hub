/**
 * System Health Check Endpoint
 *
 * GET /api/monitoring/health
 *
 * Returns system health status and diagnostics
 */

 

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getHealthScore, getAverageLatency } from '@/lib/monitoring/error-metrics';

export async function GET(_req: NextRequest) {
  try {
    const metrics = getMetrics();
    const healthScore = getHealthScore();
    const avgLatency = getAverageLatency();

    // Determine health status
    let status: 'healthy' | 'degraded' | 'critical';

    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 50) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    const response = {
      status,
      timestamp: new Date().toISOString(),
      healthScore,
      metrics: {
        totalErrors: metrics.totalErrors,
        errorsByType: Object.entries(metrics.errors).map(([type, data]) => ({
          type,
          count: data.count,
          lastOccurrence: data.lastOccurrence,
        })),
        performance: {
          averageLatencyMs: Math.round(avgLatency),
        },
      },
      checks: {
        api: healthScore > 50 ? 'healthy' : 'unhealthy',
        database: metrics.errors['DATABASE_ERROR']
          ? metrics.errors['DATABASE_ERROR'].count < 10
            ? 'healthy'
            : 'unhealthy'
          : 'healthy',
      },
    };

    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error checking health:', error);
    return NextResponse.json(
      {
        status: 'critical',
        error: 'Failed to check system health',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
