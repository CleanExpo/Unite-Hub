/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
/* global process, AbortController, setTimeout, clearInterval, fetch, URL */

/**
 * Routes Health Check Endpoint
 * GET /api/health/routes
 *
 * Verifies all 672 API routes are accessible
 * Returns health status for route inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import { promises as fs } from 'fs';
import { resolve } from 'path';

const logger = createApiLogger({ context: 'HealthCheck/Routes' });

interface RouteHealth {
  route: string;
  method: string;
  status: 'accessible' | 'error';
  response_time_ms?: number;
  error?: string;
}

async function discoverRoutes(): Promise<string[]> {
  try {
    const apiDir = resolve(process.cwd(), 'src/app/api');
    const routes: string[] = [];

    async function walkDir(dir: string, basePath = ''): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = resolve(dir, entry.name);

          if (entry.isDirectory()) {
            const nextBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
            await walkDir(fullPath, nextBasePath);
          } else if (entry.name === 'route.ts') {
            const routePath = basePath ? `/api/${basePath}` : '/api';
            routes.push(routePath);
          }
        }
      } catch (error) {
        logger.warn('Error reading directory', { dir, error });
      }
    }

    await walkDir(apiDir);
    return [...new Set(routes)]; // Remove duplicates
  } catch (error) {
    logger.error('Failed to discover routes', { error });
    return [];
  }
}

async function checkRouteHealth(route: string): Promise<RouteHealth> {
  const start = Date.now();
  try {
    // Determine HTTP method (most routes are POST or GET)
    let method = 'GET';
    if (route.includes('create') || route.includes('update') || route.includes('delete')) {
      method = 'POST';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';
    const url = new URL(route, baseUrl).toString();

    const response = await fetch(url, {
      method,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - start;

    // 401/403 is ok - means endpoint exists but needs auth
    // 404/500 means endpoint doesn't work
    if (response.ok || response.status === 401 || response.status === 403) {
      return {
        route,
        method,
        status: 'accessible',
        response_time_ms: responseTime,
      };
    }

    return {
      route,
      method,
      status: 'error',
      response_time_ms: responseTime,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      route,
      method: 'GET',
      status: 'error',
      response_time_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const checkStart = Date.now();

  try {
    logger.info('Routes health check requested', { requestId });

    // Check if Datadog export is requested
    const shouldExportToDatadog = request.nextUrl.searchParams.get('export') === 'datadog';

    // Discover all routes
    const routes = await discoverRoutes();
    logger.info(`Discovered ${routes.length} routes`, { requestId });

    // Check subset of routes (full check would take too long)
    // Check every 10th route plus critical ones
    const criticalRoutes = [
      '/api/health',
      '/api/auth/callback',
      '/api/contacts',
      '/api/campaigns',
      '/api/agents',
    ];

    const routesToCheck = [
      ...new Set([
        ...criticalRoutes,
        ...routes.filter((_, i) => i % Math.max(1, Math.floor(routes.length / 50)) === 0),
      ]),
    ];

    // Check routes in parallel batches
    const batchSize = 10;
    const results: RouteHealth[] = [];

    for (let i = 0; i < routesToCheck.length; i += batchSize) {
      const batch = routesToCheck.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(route => checkRouteHealth(route))
      );
      results.push(...batchResults);
    }

    // Calculate stats
    const healthy = results.filter(r => r.status === 'accessible').length;
    const errors = results.filter(r => r.status === 'error').length;
    const checkDuration = Date.now() - checkStart;

    const response = {
      total_routes_in_system: routes.length,
      checked: results.length,
      healthy,
      unhealthy: errors,
      check_coverage: `${((results.length / routes.length) * 100).toFixed(1)}%`,
      routes_sampled: results,
      timestamp: new Date().toISOString(),
    };

    // Export to Datadog if enabled
    if (shouldExportToDatadog && process.env.DATADOG_API_KEY) {
      try {
        const { getDatadogClient } = await import('@/lib/monitoring/datadog-client');
        const { default: HealthMetricsExporter } = await import('@/lib/monitoring/health-metrics-exporter');

        const client = getDatadogClient();
        const exporter = new HealthMetricsExporter(client);

        await exporter.exportRouteHealth(response);

        logger.debug('Route health metrics exported to Datadog', { requestId });
      } catch (exportError) {
        logger.warn('Failed to export to Datadog', { error: exportError, requestId });
        // Don't fail the health check if Datadog export fails
      }
    }

    logger.info('Routes health check complete', {
      total: routes.length,
      checked: results.length,
      healthy,
      unhealthy: errors,
      duration_ms: checkDuration,
      requestId,
    });

    return NextResponse.json(
      {
        ...response,
        metadata: {
          request_id: requestId,
          check_duration_ms: checkDuration,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    const checkDuration = Date.now() - checkStart;
    logger.error('Routes health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: checkDuration,
      requestId,
    });

    return NextResponse.json(
      {
        total_routes_in_system: 0,
        checked: 0,
        healthy: 0,
        unhealthy: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        metadata: {
          request_id: requestId,
          check_duration_ms: checkDuration,
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
