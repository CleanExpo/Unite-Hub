/* eslint-disable no-undef, no-console, @typescript-eslint/no-explicit-any */
/**
 * Next.js Server Wrapper with Graceful Shutdown
 *
 * Wraps Next.js standalone server startup with graceful shutdown handlers
 * and connection draining middleware.
 *
 * @module next-server
 */

import { createServer, Server } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupGracefulShutdown, setHttpServer } from './graceful-shutdown';

/**
 * Server configuration
 */
interface ServerConfig {
  /**
   * Port to listen on
   * @default 3008
   */
  port?: number;

  /**
   * Hostname to bind to
   * @default 'localhost'
   */
  hostname?: string;

  /**
   * Whether in development mode
   * @default false
   */
  dev?: boolean;

  /**
   * Shutdown drain timeout (ms)
   * @default 30000
   */
  drainTimeout?: number;

  /**
   * Total shutdown timeout (ms)
   * @default 60000
   */
  shutdownTimeout?: number;
}

const DEFAULT_CONFIG: Required<ServerConfig> = {
  port: 3008,
  hostname: 'localhost',
  dev: false,
  drainTimeout: 30000,
  shutdownTimeout: 60000,
};

/**
 * Server state
 */
let server: Server | null = null;
let nextApp: any = null;

/**
 * Initialize deployment handlers
 *
 * Sets up graceful shutdown handlers and connection tracking.
 * Should be called before starting the server.
 *
 * @param config - Server configuration
 *
 * @example
 * ```typescript
 * import { setupDeploymentHandlers } from './next-server';
 *
 * setupDeploymentHandlers({
 *   drainTimeout: 20000,
 *   shutdownTimeout: 45000,
 * });
 * ```
 */
export function setupDeploymentHandlers(config: ServerConfig = {}): void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('[Next Server] Setting up deployment handlers...');

  // Setup graceful shutdown (server will be set later)
  setupGracefulShutdown(undefined, {
    drainTimeout: mergedConfig.drainTimeout,
    shutdownTimeout: mergedConfig.shutdownTimeout,
    forceExit: true,
    signals: ['SIGTERM', 'SIGINT'],
  });

  console.log('[Next Server] Deployment handlers configured');
}

/**
 * Start Next.js server with graceful shutdown
 *
 * Initializes Next.js app, creates HTTP server, and registers shutdown handlers.
 *
 * @param config - Server configuration
 * @returns HTTP server instance
 *
 * @example
 * ```typescript
 * import { startServer } from './next-server';
 *
 * const server = await startServer({
 *   port: 3008,
 *   dev: process.env.NODE_ENV !== 'production',
 * });
 *
 * console.log('Server listening on port 3008');
 * ```
 */
export async function startServer(config: ServerConfig = {}): Promise<Server> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('[Next Server] Starting Next.js server...');
  console.log('[Next Server] Port:', mergedConfig.port);
  console.log('[Next Server] Hostname:', mergedConfig.hostname);
  console.log('[Next Server] Development mode:', mergedConfig.dev);

  // Initialize Next.js app
  nextApp = next({
    dev: mergedConfig.dev,
    hostname: mergedConfig.hostname,
    port: mergedConfig.port,
  });

  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();
  console.log('[Next Server] Next.js app prepared');

  // Create HTTP server
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error('[Next Server] Error handling request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Register server with graceful shutdown handler
  setHttpServer(server);

  // Start listening
  await new Promise<void>((resolve, reject) => {
    server!.listen(mergedConfig.port, mergedConfig.hostname, () => {
      console.log(
        `[Next Server] Server listening on http://${mergedConfig.hostname}:${mergedConfig.port}`
      );
      resolve();
    });

    server!.on('error', (error) => {
      console.error('[Next Server] Server error:', error);
      reject(error);
    });
  });

  return server;
}

/**
 * Get server instance (if started)
 *
 * @returns HTTP server instance or null
 */
export function getServer(): Server | null {
  return server;
}

/**
 * Get Next.js app instance (if initialized)
 *
 * @returns Next.js app instance or null
 */
export function getNextApp(): any {
  return nextApp;
}
