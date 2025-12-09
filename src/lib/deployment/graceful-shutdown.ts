/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Graceful Shutdown Handler
 *
 * Handles SIGTERM/SIGINT signals for clean application shutdown.
 * Implements connection draining, resource cleanup, and coordinated shutdown sequence.
 *
 * @module graceful-shutdown
 */

import { drainConnections } from './connection-drain';
import { cacheManager } from '../cache/redis-client';

/**
 * Shutdown state tracking
 */
interface ShutdownState {
  isShuttingDown: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  phase: 'idle' | 'draining' | 'closing_redis' | 'closing_db' | 'complete';
  error: Error | null;
}

const shutdownState: ShutdownState = {
  isShuttingDown: false,
  startedAt: null,
  completedAt: null,
  phase: 'idle',
  error: null,
};

/**
 * Shutdown configuration
 */
interface ShutdownConfig {
  /**
   * Maximum time to wait for connection draining (milliseconds)
   * @default 30000 (30 seconds)
   */
  drainTimeout?: number;

  /**
   * Maximum time for complete shutdown sequence (milliseconds)
   * @default 60000 (60 seconds)
   */
  shutdownTimeout?: number;

  /**
   * Whether to force exit after timeout
   * @default true
   */
  forceExit?: boolean;

  /**
   * Signals to listen for
   * @default ['SIGTERM', 'SIGINT']
   */
  signals?: NodeJS.Signals[];
}

const DEFAULT_CONFIG: Required<ShutdownConfig> = {
  drainTimeout: 30000, // 30 seconds
  shutdownTimeout: 60000, // 60 seconds
  forceExit: true,
  signals: ['SIGTERM', 'SIGINT'],
};

/**
 * Active HTTP server reference
 */
let httpServer: any = null;

/**
 * Shutdown timeout handle
 */
let shutdownTimeoutHandle: NodeJS.Timeout | null = null;

/**
 * Get current shutdown status
 *
 * @returns Current shutdown state
 */
export function getShutdownStatus(): Readonly<ShutdownState> {
  return { ...shutdownState };
}

/**
 * Check if application is shutting down
 *
 * @returns True if shutdown in progress
 */
export function isShuttingDown(): boolean {
  return shutdownState.isShuttingDown;
}

/**
 * Drain HTTP connections
 *
 * @param timeout - Maximum time to wait for draining (ms)
 */
async function drainHttpConnections(timeout: number): Promise<void> {
  if (!httpServer) {
    console.log('[Graceful Shutdown] No HTTP server to drain');
    return;
  }

  console.log('[Graceful Shutdown] Draining HTTP connections...');
  shutdownState.phase = 'draining';

  try {
    await drainConnections(httpServer, timeout);
    console.log('[Graceful Shutdown] HTTP connections drained successfully');
  } catch (error) {
    console.error('[Graceful Shutdown] Error draining connections:', error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
async function closeRedis(): Promise<void> {
  console.log('[Graceful Shutdown] Closing Redis connection...');
  shutdownState.phase = 'closing_redis';

  try {
    // Redis client from cache manager
    const redis = (cacheManager as any).redis;

    if (redis) {
      await redis.quit();
      console.log('[Graceful Shutdown] Redis connection closed');
    } else {
      console.log('[Graceful Shutdown] No Redis connection to close');
    }
  } catch (error) {
    console.error('[Graceful Shutdown] Error closing Redis:', error);
    // Non-fatal - continue shutdown
  }
}

/**
 * Close database connections
 */
async function closeDatabase(): Promise<void> {
  console.log('[Graceful Shutdown] Closing database connections...');
  shutdownState.phase = 'closing_db';

  try {
    // Supabase client cleanup
    // Note: Supabase JS client doesn't expose explicit close method
    // Connection pooling handled by Supabase infrastructure
    console.log('[Graceful Shutdown] Database connections released');
  } catch (error) {
    console.error('[Graceful Shutdown] Error closing database:', error);
    // Non-fatal - continue shutdown
  }
}

/**
 * Execute graceful shutdown sequence
 *
 * @param signal - Signal that triggered shutdown
 * @param config - Shutdown configuration
 */
async function executeShutdown(
  signal: string,
  config: Required<ShutdownConfig>
): Promise<void> {
  if (shutdownState.isShuttingDown) {
    console.log(`[Graceful Shutdown] Already shutting down, ignoring ${signal}`);
    return;
  }

  shutdownState.isShuttingDown = true;
  shutdownState.startedAt = new Date();

  console.log(`[Graceful Shutdown] Received ${signal}, starting graceful shutdown...`);
  console.log(`[Graceful Shutdown] Drain timeout: ${config.drainTimeout}ms`);
  console.log(`[Graceful Shutdown] Total shutdown timeout: ${config.shutdownTimeout}ms`);

  // Set overall shutdown timeout
  if (config.forceExit) {
    shutdownTimeoutHandle = setTimeout(() => {
      console.error('[Graceful Shutdown] Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, config.shutdownTimeout);
  }

  try {
    // Phase 1: Drain HTTP connections (stop accepting new requests, wait for existing)
    await drainHttpConnections(config.drainTimeout);

    // Phase 2: Close Redis connection
    await closeRedis();

    // Phase 3: Close database connections
    await closeDatabase();

    // Success
    shutdownState.phase = 'complete';
    shutdownState.completedAt = new Date();

    const duration = shutdownState.completedAt.getTime() - shutdownState.startedAt!.getTime();
    console.log(`[Graceful Shutdown] Shutdown completed successfully in ${duration}ms`);

    // Clear timeout and exit cleanly
    if (shutdownTimeoutHandle) {
      clearTimeout(shutdownTimeoutHandle);
      shutdownTimeoutHandle = null;
    }

    process.exit(0);
  } catch (error) {
    shutdownState.error = error as Error;
    console.error('[Graceful Shutdown] Shutdown failed:', error);

    // Clear timeout
    if (shutdownTimeoutHandle) {
      clearTimeout(shutdownTimeoutHandle);
      shutdownTimeoutHandle = null;
    }

    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 *
 * Registers signal handlers for SIGTERM and SIGINT.
 * Configures shutdown sequence with connection draining and resource cleanup.
 *
 * @param server - HTTP server instance (optional, can be set later)
 * @param config - Shutdown configuration
 *
 * @example
 * ```typescript
 * import { createServer } from 'http';
 * import { setupGracefulShutdown } from './graceful-shutdown';
 *
 * const server = createServer(app);
 * setupGracefulShutdown(server, { drainTimeout: 20000 });
 * server.listen(3000);
 * ```
 */
export function setupGracefulShutdown(
  server?: any,
  config: ShutdownConfig = {}
): void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (server) {
    httpServer = server;
  }

  // Register signal handlers
  for (const signal of mergedConfig.signals) {
    process.on(signal, () => {
      executeShutdown(signal, mergedConfig);
    });
  }

  console.log('[Graceful Shutdown] Handlers registered for signals:', mergedConfig.signals);
}

/**
 * Set HTTP server reference (if not provided during setup)
 *
 * @param server - HTTP server instance
 */
export function setHttpServer(server: any): void {
  httpServer = server;
  console.log('[Graceful Shutdown] HTTP server reference set');
}

/**
 * Manual shutdown trigger (for testing or programmatic shutdown)
 *
 * @param config - Shutdown configuration
 */
export async function triggerShutdown(config: ShutdownConfig = {}): Promise<void> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  await executeShutdown('MANUAL', mergedConfig);
}
