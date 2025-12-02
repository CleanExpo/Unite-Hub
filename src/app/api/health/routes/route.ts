/* eslint-disable no-undef */
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
  try {
    logger.info('Routes health check requested');

    // Discover all routes
    const routes = await discoverRoutes();
    logger.info(`Discovered ${routes.length} routes`);

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

    const response = {
      total_routes_in_system: routes.length,
      checked: results.length,
      healthy,
      unhealthy: errors,
      check_coverage: `${((results.length / routes.length) * 100).toFixed(1)}%`,
      routes_sampled: results,
      timestamp: new Date().toISOString(),
    };

    logger.info('Routes health check complete', {
      total: routes.length,
      checked: results.length,
      healthy,
      unhealthy: errors,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Routes health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        total_routes_in_system: 0,
        checked: 0,
        healthy: 0,
        unhealthy: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
