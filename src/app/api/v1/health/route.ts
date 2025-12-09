 
import { withErrorBoundary, successResponse } from '@/lib/errors/boundaries';

/**
 * Health Check Endpoint
 *
 * GET /api/v1/health
 *
 * No authentication required. Returns API version, status, and timestamp.
 * Used for monitoring, load balancer health checks, and uptime verification.
 */
export const GET = withErrorBoundary(async () => {
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
      uptime: process.uptime?.() || 0,
    };

    return successResponse(extended, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-API-Version': '1.0.0',
    }, undefined, 200);
  }

  // Production response - minimal information
  return successResponse(healthData, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-API-Version': '1.0.0',
  }, undefined, 200);
});

/**
 * HEAD method for lightweight health checks
 * Used by some monitoring tools that only check response codes
 */
export const HEAD = withErrorBoundary(async () => {
  return successResponse(null, {
    'X-API-Version': '1.0.0',
  }, undefined, 200);
});
