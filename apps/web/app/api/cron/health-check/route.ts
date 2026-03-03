import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Health Check Cron Job
 *
 * Runs every 5 minutes
 * Pings the backend to ensure it's responsive
 * Can be extended to check database, external services, etc.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // Check backend health
    const backendStart = Date.now();
    const backendResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const backendLatency = Date.now() - backendStart;
    const backendHealthy = backendResponse.ok;

    const allHealthy = backendHealthy;

    // Log results
    logger.info('Health check cron', {
      backend: backendHealthy ? 'healthy' : 'unhealthy',
      backendLatency: `${backendLatency}ms`,
      timestamp: new Date().toISOString(),
    });

    // If unhealthy, you could send alerts here
    if (!allHealthy) {
      logger.error('Health check failed! Backend is not responding.');
      // TODO: Send alert to monitoring service (e.g., PagerDuty, Slack)
    }

    return NextResponse.json({
      success: true,
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: {
        backend: {
          healthy: backendHealthy,
          latency: backendLatency,
          url: backendUrl,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check cron error', error);
    logger.error('CRITICAL: Health check cron failed to execute!');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
