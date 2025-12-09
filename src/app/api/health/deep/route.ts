/* eslint-disable @typescript-eslint/no-explicit-any */
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

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs)),
  ]);
}

async function checkDatabase(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServer();

    const result = await withTimeout(
      supabase.from('organizations').select('id').limit(1),
      5000,
      { data: null, error: { message: 'Database check timed out after 5 seconds' } as any }
    );

    const latency = Date.now() - start;

    if (result.error) {
      return {
        status: latency > 5000 ? 'degraded' : 'unhealthy',
        latency_ms: latency,
        error: result.error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latency_ms: latency,
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

    const result = await withTimeout(
      redis.ping(),
      5000,
      'TIMEOUT'
    );

    const latency = Date.now() - start;

    if (result === 'TIMEOUT') {
      return {
        status: 'degraded',
        latency_ms: latency,
        error: 'Redis ping timed out after 5 seconds',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latency_ms: latency,
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

    // Perform lightweight API validation check
    try {
      const response = await withTimeout(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        }),
        5000,
        null as any
      );

      const latency = Date.now() - start;

      if (!response) {
        return {
          status: 'degraded',
          latency_ms: latency,
          error: 'Anthropic API check timed out after 5 seconds',
          timestamp: new Date().toISOString(),
        };
      }

      // 200 or 400 means API is reachable (400 expected for minimal request)
      if (response.ok || response.status === 400) {
        return {
          status: 'healthy',
          latency_ms: latency,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'degraded',
        latency_ms: latency,
        error: `Anthropic API returned status ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    } catch (fetchError) {
      return {
        status: 'degraded',
        latency_ms: Date.now() - start,
        error: fetchError instanceof Error ? fetchError.message : 'API check failed',
        timestamp: new Date().toISOString(),
      };
    }
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
    const hasGmailConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const hasEmailConfig = Boolean(
      process.env.SENDGRID_API_KEY ||
      process.env.RESEND_API_KEY ||
      (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER)
    );
    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const missingServices: string[] = [];
    if (!hasGmailConfig) {
missingServices.push('Gmail OAuth');
}
    if (!hasEmailConfig) {
missingServices.push('Email service');
}
    if (!hasSupabaseConfig) {
missingServices.push('Supabase');
}

    if (missingServices.length > 0) {
      return {
        status: missingServices.includes('Supabase') ? 'unhealthy' : 'degraded',
        latency_ms: Date.now() - start,
        error: `Missing configurations: ${missingServices.join(', ')}`,
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

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const checkStart = Date.now();

  try {
    logger.info('Deep health check requested', { requestId });

    // Check if Datadog export is requested
    const shouldExportToDatadog = request.nextUrl.searchParams.get('export') === 'datadog';

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

    const checkDuration = Date.now() - checkStart;

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

    // Export to Datadog if enabled
    if (shouldExportToDatadog && process.env.DATADOG_API_KEY) {
      try {
        const { getDatadogClient } = await import('@/lib/monitoring/datadog-client');
        const { default: HealthMetricsExporter } = await import('@/lib/monitoring/health-metrics-exporter');

        const client = getDatadogClient();
        const exporter = new HealthMetricsExporter(client);

        await exporter.exportHealthMetrics(response);

        logger.debug('Health metrics exported to Datadog', { requestId });
      } catch (exportError) {
        logger.warn('Failed to export to Datadog', { error: exportError, requestId });
        // Don't fail the health check if Datadog export fails
      }
    }

    logger.info('Deep health check complete', {
      status: overallStatus,
      duration_ms: checkDuration,
      database: database.status,
      cache: cache.status,
      ai: ai.status,
      external: external.status,
      requestId,
    });

    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(
      {
        ...response,
        metadata: {
          request_id: requestId,
          check_duration_ms: checkDuration,
        },
      },
      {
        status: httpStatus,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    const checkDuration = Date.now() - checkStart;
    logger.error('Deep health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: checkDuration,
      requestId,
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
        metadata: {
          request_id: requestId,
          check_duration_ms: checkDuration,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      {
        status: 503,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  }
}
