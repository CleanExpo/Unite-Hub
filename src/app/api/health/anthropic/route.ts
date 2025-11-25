/**
 * Anthropic API Health Check Endpoint
 * 
 * Provides real-time health status of Anthropic API connection
 * Includes circuit breaker state and recent failure metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicHealth, resetCircuitBreaker } from '@/lib/anthropic/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/anthropic
 * 
 * Returns health status of Anthropic API
 */
export async function GET(req: NextRequest) {
  try {
    const health = getAnthropicHealth();

    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      circuitBreaker: {
        state: health.circuitState,
        consecutiveFailures: health.consecutiveFailures,
      },
      lastCheck: health.lastCheck.toISOString(),
      error: health.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/anthropic/reset
 * 
 * Reset circuit breaker (admin only)
 * Requires authorization header
 */
export async function POST(req: NextRequest) {
  try {
    // Simple auth check - in production, use proper authentication
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.ANTHROPIC_API_KEY;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reset circuit breaker
    resetCircuitBreaker();

    return NextResponse.json({
      status: 'success',
      message: 'Circuit breaker has been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
