/**
 * Health Check API Endpoint
 * Used by Docker healthcheck and monitoring systems
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/middleware/rateLimiter";
import { createApiLogger } from "@/lib/logger";

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

    // Basic health check - can be extended with database/redis checks
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    };

    logger.http('Health check successful');
    return NextResponse.json(health, { status: 200 });
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
