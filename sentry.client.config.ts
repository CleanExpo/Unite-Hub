/**
 * Sentry Client Configuration
 * 
 * Monitors client-side errors, performance, and user interactions.
 * Runs in the browser for all client-side React components.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment configuration
  environment: ENVIRONMENT,
  
  // Performance monitoring
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Performance monitoring for navigation and HTTP requests
      tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.unite-hub\.com/],
    }),
    new Sentry.Replay({
      // Mask all text content for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Error filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
    // Third-party scripts
    'ResizeObserver loop limit exceeded',
  ],
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  
  // User feedback
  beforeSend(event, hint) {
    // Filter out development errors
    if (ENVIRONMENT === 'development') {
      console.log('Sentry event (dev mode):', event);
      return null; // Don't send in development
    }

    // Add custom context
    if (event.exception) {
      console.error('Error captured by Sentry:', hint.originalException || hint.syntheticException);
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
