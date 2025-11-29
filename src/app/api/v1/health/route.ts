import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 *
 * GET /api/v1/health
 *
 * No authentication required. Returns API version, status, and timestamp.
 * Used for monitoring, load balancer health checks, and uptime verification.
 *
 * @returns {NextResponse} JSON response with health status
 */
export async function GET(req: NextRequest) {
  try {
    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Basic health check response
    const healthData = {
      version: '1.0.0',
      status: 'ok',
      timestamp,
    };

    // Optional: Add extended health information in development
    if (process.env.NODE_ENV === 'development') {
      const extended = {
        ...healthData,
        environment: process.env.NODE_ENV,
        node_version: process.version,
        uptime: process.uptime(),
      };

      return NextResponse.json(extended, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-API-Version': '1.0.0',
        },
      });
    }

    // Production response - minimal information
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-API-Version': '1.0.0',
      },
    });
  } catch (error) {
    // Even health check errors should return 200 with degraded status
    // This prevents load balancers from removing healthy instances
    return NextResponse.json(
      {
        version: '1.0.0',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: 'Health check encountered an error',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-API-Version': '1.0.0',
        },
      }
    );
  }
}

/**
 * HEAD method for lightweight health checks
 * Used by some monitoring tools that only check response codes
 */
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-API-Version': '1.0.0',
    },
  });
}
