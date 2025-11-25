/**
 * Sentry Edge Runtime Configuration
 *
 * Captures errors from Edge Runtime (middleware, edge functions)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN || undefined,

  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  debug: false,

  environment: SENTRY_ENVIRONMENT,

  enabled: SENTRY_ENVIRONMENT !== 'development',
});
