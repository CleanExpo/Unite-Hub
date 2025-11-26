/**
 * Health Check API Endpoint
 * Used by Docker healthcheck and monitoring systems
 * Checks: Redis, Database, overall system health
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/middleware/rateLimiter";
import { createApiLogger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { getSupabaseServer } from "@/lib/supabase";
import { getPoolStats } from "@/lib/db/connection-pool";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface HealthCheck {
  status: HealthStatus;
  latency?: number;
  error?: string;
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
  const logger = createApiLogger({ route: '/api/health' });

  try {
    // Apply rate limiting (public tier - 20 requests per minute)
    const rateLimitResult = await rateLimit(request, { tier: 'public' });
    if (!rateLimitResult.success) {
      logger.warn('Health check rate limited', {
        ip: request.headers.get('x-forwarded-for')
      });
      return rateLimitResult.response;
    }

    // Run health checks in parallel
    const [redisCheck, dbCheck] = await Promise.all([
      checkRedis(),
      checkDatabase(),
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
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      checks: {
        redis: redisCheck,
        database: dbCheck,
      },
      pool: {
        totalRequests: poolStats.totalRequests,
        successRate,
        averageResponseTime: Math.round(poolStats.averageResponseTime),
        circuitState: poolStats.circuitState,
      },
    };

    // Log with appropriate level based on status
    if (overallStatus === "healthy") {
      logger.http('Health check successful', { checks: health.checks });
    } else if (overallStatus === "degraded") {
      logger.warn('Health check degraded', { checks: health.checks });
    } else {
      logger.error('Health check unhealthy', { checks: health.checks });
    }

    // Return appropriate HTTP status
    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

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
