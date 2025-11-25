/**
 * Sentry Server-Side Configuration
 *
 * Captures errors and performance data from API routes and server components
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN || undefined,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: SENTRY_ENVIRONMENT,

  // Don't send errors in development
  enabled: SENTRY_ENVIRONMENT !== 'development',

  beforeSend(event, hint) {
    // Don't send errors in development
    if (SENTRY_ENVIRONMENT === 'development') {
      return null;
    }

    // Filter out expected errors
    const error = hint.originalException;

    // Ignore 401 errors (expected for unauthorized requests)
    if (error instanceof Error && error.message.includes('401')) {
      return null;
    }

    // Ignore ECONNREFUSED from external services during development
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return null;
    }

    return event;
  },

  // Add extra context to error reports
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't log breadcrumbs in development
    if (SENTRY_ENVIRONMENT === 'development') {
      return null;
    }

    return breadcrumb;
  },
});
