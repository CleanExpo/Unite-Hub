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

    // Sanitize all data to prevent Date serialization issues
    try {
      // Convert event to JSON and back to strip Date objects and other non-serializable values
      const sanitized = JSON.parse(JSON.stringify(event, (key, value) => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        // Remove functions
        if (typeof value === 'function') {
          return undefined;
        }
        // Handle NaN and Infinity
        if (typeof value === 'number' && !isFinite(value)) {
          return null;
        }
        return value;
      }));

      return sanitized;
    } catch (error) {
      console.error('Sentry beforeSend sanitization failed:', error);
      // Return event as-is if sanitization fails
      return event;
    }
  },
});
