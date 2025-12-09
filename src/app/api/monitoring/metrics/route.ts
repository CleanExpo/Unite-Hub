/**
 * Prometheus Metrics Endpoint
 *
 * GET /api/monitoring/metrics
 *
 * Returns Prometheus-formatted metrics for monitoring and alerting
 */

 

import { NextRequest, NextResponse } from 'next/server';
import { exportPrometheus } from '@/lib/monitoring/error-metrics';

export async function GET(req: NextRequest) {
  try {
    // Basic auth check (use environment variable for token)
    const authHeader = req.headers.get('authorization');
    const metricsToken = process.env.METRICS_AUTH_TOKEN;

    if (metricsToken && (!authHeader || authHeader !== `Bearer ${metricsToken}`)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get metrics in Prometheus format
    const prometheusMetrics = exportPrometheus();

    // Return with proper content type
    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
