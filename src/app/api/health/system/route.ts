/**
 * System Health Check API Endpoint
 *
 * GET /api/health/system
 *
 * Returns comprehensive health status for all system components.
 * Used by monitoring systems (Datadog, etc.) for uptime tracking.
 *
 * Response Codes:
 * - 200: All systems healthy
 * - 206: Some systems degraded but operational
 * - 503: Critical systems unhealthy
 */

import { NextResponse } from 'next/server';
import { healthCheckManager } from '@/lib/monitoring/health-checks';
import { apm } from '@/lib/monitoring/apm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const span = apm.startHTTPSpan('GET', '/api/health/system');

  try {
    const health = await healthCheckManager.checkAll();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;

    const response = {
      ...health,
      uptime_formatted: healthCheckManager.getUptimeFormatted(),
    };

    span.finish({ statusCode });

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    span.finishWithError(error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 503 }
    );
  }
}
