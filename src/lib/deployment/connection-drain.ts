 
/**
 * Connection Draining Module
 *
 * Tracks active HTTP connections and drains them gracefully during shutdown.
 * Prevents new connections while allowing existing requests to complete.
 *
 * @module connection-drain
 */

import type { Server } from 'http';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Active connection tracking
 */
const activeConnections = new Set<string>();

/**
 * Request tracking metadata
 */
interface RequestMetadata {
  id: string;
  startedAt: Date;
  method: string;
  url: string;
}

const requestMetadata = new Map<string, RequestMetadata>();

/**
 * Drain state
 */
interface DrainState {
  isDraining: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  initialConnectionCount: number;
  finalConnectionCount: number;
}

let drainState: DrainState = {
  isDraining: false,
  startedAt: null,
  completedAt: null,
  initialConnectionCount: 0,
  finalConnectionCount: 0,
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get count of active connections
 *
 * @returns Number of active connections
 */
export function getActiveConnectionCount(): number {
  return activeConnections.size;
}

/**
 * Get drain state
 *
 * @returns Current drain state
 */
export function getDrainState(): Readonly<DrainState> {
  return { ...drainState };
}

/**
 * Check if draining is in progress
 *
 * @returns True if draining
 */
export function isDraining(): boolean {
  return drainState.isDraining;
}

/**
 * Get active request metadata
 *
 * @returns Array of active request metadata
 */
export function getActiveRequests(): RequestMetadata[] {
  return Array.from(requestMetadata.values());
}

/**
 * Track connection start
 *
 * @param requestId - Unique request identifier
 * @param method - HTTP method
 * @param url - Request URL
 */
function trackConnectionStart(requestId: string, method: string, url: string): void {
  activeConnections.add(requestId);
  requestMetadata.set(requestId, {
    id: requestId,
    startedAt: new Date(),
    method,
    url,
  });
}

/**
 * Track connection end
 *
 * @param requestId - Unique request identifier
 */
function trackConnectionEnd(requestId: string): void {
  activeConnections.delete(requestId);
  requestMetadata.delete(requestId);
}

/**
 * Create middleware for connection tracking
 *
 * Use this middleware in your Next.js API routes or Edge middleware
 * to track active connections.
 *
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * import { createTrackingMiddleware } from './connection-drain';
 *
 * const trackingMiddleware = createTrackingMiddleware();
 *
 * export async function middleware(request: NextRequest) {
 *   return trackingMiddleware(request, async () => {
 *     // Your handler logic
 *     return NextResponse.next();
 *   });
 * }
 * ```
 */
export function createTrackingMiddleware() {
  return async function trackingMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Reject new connections if draining
    if (drainState.isDraining) {
      return new NextResponse(
        JSON.stringify({
          error: 'Service Unavailable',
          message: 'Server is shutting down',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '30',
          },
        }
      );
    }

    const requestId = generateRequestId();
    const method = request.method;
    const url = request.url;

    trackConnectionStart(requestId, method, url);

    try {
      const response = await handler();
      return response;
    } finally {
      trackConnectionEnd(requestId);
    }
  };
}

/**
 * Wait for all active connections to complete
 *
 * @param timeout - Maximum time to wait (ms)
 * @returns Promise that resolves when all connections drained or timeout
 */
async function waitForConnections(timeout: number): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 100; // Check every 100ms

  return new Promise<void>((resolve) => {
    const checkConnections = () => {
      const elapsed = Date.now() - startTime;
      const remaining = activeConnections.size;

      if (remaining === 0) {
        console.log('[Connection Drain] All connections completed');
        resolve();
        return;
      }

      if (elapsed >= timeout) {
        console.warn(
          `[Connection Drain] Timeout reached with ${remaining} active connections`
        );
        console.warn('[Connection Drain] Active requests:', getActiveRequests());
        resolve();
        return;
      }

      // Log progress every 5 seconds
      if (elapsed % 5000 < checkInterval) {
        console.log(
          `[Connection Drain] Waiting for ${remaining} connections (${Math.round(elapsed / 1000)}s elapsed)`
        );
      }

      setTimeout(checkConnections, checkInterval);
    };

    checkConnections();
  });
}

/**
 * Force close HTTP server
 *
 * @param server - HTTP server instance
 */
function forceCloseServer(server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Drain HTTP connections gracefully
 *
 * 1. Stop accepting new connections
 * 2. Wait for active connections to complete (up to timeout)
 * 3. Force close remaining connections after timeout
 *
 * @param server - HTTP server instance
 * @param timeout - Maximum time to wait for draining (ms)
 *
 * @example
 * ```typescript
 * import { createServer } from 'http';
 * import { drainConnections } from './connection-drain';
 *
 * const server = createServer(app);
 *
 * process.on('SIGTERM', async () => {
 *   await drainConnections(server, 30000);
 *   process.exit(0);
 * });
 * ```
 */
export async function drainConnections(
  server: Server,
  timeout: number = 30000
): Promise<void> {
  if (drainState.isDraining) {
    console.log('[Connection Drain] Already draining, ignoring duplicate call');
    return;
  }

  drainState.isDraining = true;
  drainState.startedAt = new Date();
  drainState.initialConnectionCount = activeConnections.size;

  console.log(
    `[Connection Drain] Starting connection drain (${drainState.initialConnectionCount} active connections)`
  );

  try {
    // Wait for connections to drain naturally
    await waitForConnections(timeout);

    // Force close server (closes any remaining connections)
    console.log('[Connection Drain] Closing HTTP server...');
    await forceCloseServer(server);

    drainState.completedAt = new Date();
    drainState.finalConnectionCount = activeConnections.size;

    const duration =
      drainState.completedAt.getTime() - drainState.startedAt.getTime();

    if (drainState.finalConnectionCount === 0) {
      console.log(
        `[Connection Drain] Successfully drained all connections in ${duration}ms`
      );
    } else {
      console.warn(
        `[Connection Drain] Drain completed with ${drainState.finalConnectionCount} forced closures in ${duration}ms`
      );
    }
  } catch (error) {
    console.error('[Connection Drain] Error during drain:', error);
    throw error;
  }
}

/**
 * Reset drain state (for testing)
 */
export function resetDrainState(): void {
  activeConnections.clear();
  requestMetadata.clear();
  drainState = {
    isDraining: false,
    startedAt: null,
    completedAt: null,
    initialConnectionCount: 0,
    finalConnectionCount: 0,
  };
}
