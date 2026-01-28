/**
 * Sentry Edge Configuration
 * 
 * Monitors errors in Edge Runtime (middleware, edge API routes).
 * Runs in the lightweight Edge Runtime environment.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment configuration
  environment: ENVIRONMENT,
  
  // Minimal performance monitoring for edge (very lightweight)
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.01 : 1.0,
  
  // Edge-specific configuration (minimal integrations due to runtime limits)
  integrations: [],
  
  // Error filtering
  ignoreErrors: [
    'NetworkError',
    'Failed to fetch',
  ],
  
  // Release tracking
  release: process.env.SENTRY_RELEASE,
  
  // Error handling
  beforeSend(event) {
    // Don't send in development
    if (ENVIRONMENT === 'development') {
      return null;
    }
    
    return event;
  },
});
