/**
 * Health Check API Endpoint
 * Used by Docker healthcheck and monitoring systems
 */

import { NextRequest, NextResponse } from "next/server";
import { publicRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await publicRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Basic health check - can be extended with database/redis checks
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
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
