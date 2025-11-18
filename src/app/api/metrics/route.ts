import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';
import { getPoolStats } from '@/lib/db/connection-pool';
import { createApiLogger } from '@/lib/logger';

/**
 * Prometheus metrics endpoint
 * Scraped by Prometheus for monitoring
 *
 * Returns:
 * - Prometheus format metrics (default)
 * - JSON format with ?format=json query parameter
 */
export async function GET(req: NextRequest) {
  const logger = createApiLogger({ route: '/api/metrics' });
  const format = req.nextUrl.searchParams.get('format');

  try {
    // Get connection pool statistics
    const poolStats = getPoolStats();

    // If JSON format requested, return detailed JSON
    if (format === 'json') {
      const successRate = poolStats.totalRequests > 0
        ? ((poolStats.successfulRequests / poolStats.totalRequests) * 100).toFixed(2)
        : '100.00';

      const healthCheckSuccessRate = (poolStats.healthChecksPassed + poolStats.healthChecksFailed) > 0
        ? ((poolStats.healthChecksPassed / (poolStats.healthChecksPassed + poolStats.healthChecksFailed)) * 100).toFixed(2)
        : '100.00';

      const metrics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: {
          process: Math.round(process.uptime()),
          pool: Math.round(poolStats.uptime / 1000),
        },
        database: {
          requests: {
            total: poolStats.totalRequests,
            successful: poolStats.successfulRequests,
            failed: poolStats.failedRequests,
            retried: poolStats.retriedRequests,
            successRate: `${successRate}%`,
          },
          performance: {
            averageResponseTime: Math.round(poolStats.averageResponseTime),
          },
          circuit: {
            state: poolStats.circuitState,
            healthy: poolStats.circuitState === 'CLOSED',
          },
          health: {
            lastCheck: poolStats.lastHealthCheck ? poolStats.lastHealthCheck.toISOString() : null,
            passed: poolStats.healthChecksPassed,
            failed: poolStats.healthChecksFailed,
            successRate: `${healthCheckSuccessRate}%`,
          },
        },
      };

      logger.http('Metrics retrieved (JSON)', { totalRequests: poolStats.totalRequests });

      return NextResponse.json(metrics, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Default: Return Prometheus format
    const prometheusMetrics = await register.metrics();

    logger.http('Metrics retrieved (Prometheus)', { format: 'prometheus' });

    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    logger.error('Failed to generate metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
