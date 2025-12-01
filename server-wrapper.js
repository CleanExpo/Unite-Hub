/**
 * Custom Server Wrapper for Next.js Standalone Build
 *
 * Purpose: Wrap Next.js standalone server with graceful shutdown and health tracking
 *
 * Features:
 * - Initialize graceful shutdown handlers
 * - Track active connections via health tracker
 * - Support DEPLOYMENT_ENV environment variable
 * - Integrate with existing Next.js standalone server
 *
 * Usage:
 * - In production: node server-wrapper.js
 * - In Docker: CMD ["node", "server-wrapper.js"]
 */

import { setupGracefulShutdown, setHttpServer } from './src/lib/deployment/graceful-shutdown.js';
import { healthTracker } from './src/lib/deployment/health-tracker.js';

console.log('[Server Wrapper] Starting Unite-Hub with graceful shutdown support...');

// Initialize health tracker
healthTracker.reset();
console.log('[Server Wrapper] Health tracker initialized');

// Setup graceful shutdown handlers BEFORE starting server
setupGracefulShutdown(null, {
  drainTimeout: 30000, // 30 seconds
  shutdownTimeout: 60000, // 60 seconds
  forceExit: true,
});

// Import and start Next.js standalone server
// This will be the .next/standalone/server.js file after build
const nextStandalone = await import('./.next/standalone/server.js');

console.log('[Server Wrapper] Next.js standalone server started');
console.log('[Server Wrapper] Deployment environment:', process.env.DEPLOYMENT_ENV || 'unknown');
console.log('[Server Wrapper] Server ready with graceful shutdown enabled');
