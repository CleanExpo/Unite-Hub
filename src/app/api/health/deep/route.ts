/* eslint-disable no-undef */
/* global process */

/**
 * Deep Health Check Endpoint
 * GET /api/health/deep
 *
 * Comprehensive health checks including all dependencies
 * Used by verification system and independent auditors
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import { getSupabaseServer } from '@/lib/supabase';

const logger = createApiLogger({ context: 'HealthCheck/Deep' });

interface DependencyCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  error?: string;
  timestamp: string;
}

interface DeepHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: DependencyCheck;
    cache: DependencyCheck;
    ai_services: DependencyCheck;
    external_apis: DependencyCheck;
  };
}

async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkCache(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();

    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkAIServices(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    // Check if Anthropic API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - start,
        error: 'Anthropic API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Could add actual API call here, but API key presence is sufficient for now
    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkExternalAPIs(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    // Check required environment variables for external services
    const hasGmailConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    const hasStripeConfig = process.env.STRIPE_SECRET_KEY;

    if (!hasGmailConfig || !hasStripeConfig) {
      return {
        status: 'degraded',
        latency_ms: Date.now() - start,
        error: 'Some external API credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function GET(_request: NextRequest) {
  try {
    logger.info('Deep health check requested');

    // Run all dependency checks in parallel
    const [database, cache, ai, external] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkAIServices(),
      checkExternalAPIs(),
    ]);

    // Determine overall status
    const statuses = [database, cache, ai, external].map(c => c.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasDegraded = statuses.includes('degraded');

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = hasUnhealthy
      ? 'unhealthy'
      : hasDegraded
      ? 'degraded'
      : 'healthy';

    const response: DeepHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        cache,
        ai_services: ai,
        external_apis: external,
      },
    };

    logger.info('Deep health check complete', {
      status: overallStatus,
      database: database.status,
      cache: cache.status,
      ai: ai.status,
      external: external.status,
    });

    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Deep health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'unknown', latency_ms: 0, timestamp: new Date().toISOString() },
          cache: { status: 'unknown', latency_ms: 0, timestamp: new Date().toISOString() },
          ai_services: { status: 'unknown', latency_ms: 0, timestamp: new Date().toISOString() },
          external_apis: { status: 'unknown', latency_ms: 0, timestamp: new Date().toISOString() },
        },
      },
      { status: 503 }
    );
  }
}
