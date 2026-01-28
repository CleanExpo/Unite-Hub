/**
 * Health Check API Endpoint
 * Used by Docker healthcheck and monitoring systems
 * Checks: Redis, Database, Cache Metrics, overall system health
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/middleware/rateLimiter";
import { createApiLogger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { getSupabaseServer } from "@/lib/supabase";
import { getPoolStats } from "@/lib/db/connection-pool";
import { cacheManager } from "@/lib/cache/redis-client";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface HealthCheck {
  status: HealthStatus;
  latency?: number;
  error?: string;
}

interface CacheMetrics {
  status: "connected" | "degraded" | "disconnected";
  provider: "redis" | "in-memory";
  hit_rate: string;
  hits: number;
  misses: number;
  total_operations: number;
  circuit_breaker?: {
    state: string;
    failures: number;
    successes: number;
    trips: number;
    is_available: boolean;
  };
}

interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string | undefined;
  version: string;
  checks: {
    redis: HealthCheck;
    database: HealthCheck;
  };
  cache?: CacheMetrics;
  pool?: {
    totalRequests: number;
    successRate: string;
    averageResponseTime: number;
    circuitState: string;
  };
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();
    return {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getCacheMetrics(): Promise<CacheMetrics> {
  try {
    // Get metrics from advanced cache manager
    const metrics = cacheManager.getMetrics();
    const status = await cacheManager.getStatus();

    // Determine provider (self-hosted Redis or in-memory fallback)
    const hasRedisUrl = !!process.env.REDIS_URL;
    const provider = hasRedisUrl ? "redis" : "in-memory";

    return {
      status: status as "connected" | "degraded" | "disconnected",
      provider,
      hit_rate: metrics.hit_rate,
      hits: metrics.hits,
      misses: metrics.misses,
      total_operations: metrics.total_operations,
      circuit_breaker: metrics.circuit_breaker,
    };
  } catch (error) {
    console.error("[Health Check] Cache metrics error:", error);
    return {
      status: "disconnected",
      provider: "in-memory",
      hit_rate: "0%",
      hits: 0,
      misses: 0,
      total_operations: 0,
    };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from("organizations").select("id").limit(1);

    if (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }

    return {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function determineOverallStatus(
  redisCheck: HealthCheck,
  dbCheck: HealthCheck
): HealthStatus {
  const unhealthyCount = [redisCheck, dbCheck].filter(
    (check) => check.status === "unhealthy"
  ).length;

  if (unhealthyCount === 0) return "healthy";
  if (unhealthyCount === 1) return "degraded";
  return "unhealthy";
}

export async function GET(request: NextRequest) {
  try {
    // Skip rate limiting to avoid any Sentry instrumentation issues
    // const rateLimitResult = await rateLimit(request, { tier: 'public' });
    // if (!rateLimitResult.success) {
    //   return rateLimitResult.response;
    // }

    // Run health checks in parallel
    const [redisCheck, dbCheck, cacheMetrics] = await Promise.all([
      checkRedis(),
      checkDatabase(),
      getCacheMetrics(),
    ]);

    const overallStatus = determineOverallStatus(redisCheck, dbCheck);

    // Get connection pool stats
    const poolStats = getPoolStats();
    const successRate = poolStats.totalRequests > 0
      ? ((poolStats.successfulRequests / poolStats.totalRequests) * 100).toFixed(2)
      : '100.00';

    const health: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      checks: {
        redis: redisCheck,
        database: dbCheck,
      },
      cache: cacheMetrics,
      pool: {
        totalRequests: poolStats.totalRequests,
        successRate,
        averageResponseTime: Math.round(poolStats.averageResponseTime) || 0,
        circuitState: poolStats.circuitState,
      },
    };

    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    console.error('[Health Check] ERROR:', error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Support HEAD requests for simple health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
