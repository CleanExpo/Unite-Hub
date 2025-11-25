/**
 * Sentry Client-Side Configuration
 *
 * Captures errors and performance data from the browser
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN || undefined,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  environment: SENTRY_ENVIRONMENT,

  // Don't send errors in development
  enabled: SENTRY_ENVIRONMENT !== 'development',

  // Only send errors in production
  beforeSend(event, hint) {
    // Don't send errors in development
    if (SENTRY_ENVIRONMENT === 'development') {
      return null;
    }

    // Filter out 401 errors (expected for unauthorized requests)
    if (event.exception?.values?.[0]?.value?.includes('401')) {
      return null;
    }

    // Filter out network errors from user's connection issues
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }

    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and input content by default
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
