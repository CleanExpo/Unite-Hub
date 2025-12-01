/**
 * Connection Tracker Middleware
 *
 * Purpose: Track active HTTP connections for graceful shutdown
 *
 * Features:
 * - Increment connection count on request start
 * - Decrement connection count on request end
 * - Reject requests if shutting down
 * - Update health tracker in real-time
 *
 * Integration:
 * - Add to Next.js middleware chain
 * - Works with graceful shutdown process
 * - Updates health tracker for health check endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthTracker } from '@/lib/deployment/health-tracker';

/**
 * Connection tracking middleware
 * Tracks active connections and rejects requests during shutdown
 */
export async function connectionTrackerMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Check if server is shutting down
  if (healthTracker.getShuttingDown()) {
    return NextResponse.json(
      {
        error: 'Service unavailable',
        message: 'Server is shutting down',
      },
      { status: 503 }
    );
  }

  // Increment connection count
  healthTracker.incrementConnections();

  try {
    // Process request
    const response = await next();

    return response;
  } finally {
    // Always decrement connection count, even if request fails
    healthTracker.decrementConnections();
  }
}
