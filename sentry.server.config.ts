/**
 * Sentry Server Configuration
 * 
 * Monitors server-side errors in Next.js API routes and server components.
 * Runs in the Node.js runtime for all server-side code.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment configuration
  environment: ENVIRONMENT,
  
  // Performance monitoring (lower sample rate for server)
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.05 : 1.0,
  
  // Server-specific integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: undefined }), // If using Prisma
  ],
  
  // Error filtering
  ignoreErrors: [
    // Expected errors
    'ECONNREFUSED',
    'ETIMEDOUT',
    // Database connection errors during maintenance
    'Connection terminated unexpectedly',
  ],
  
  // Release tracking
  release: process.env.SENTRY_RELEASE,
  
  // Server name for tracking
  serverName: process.env.HOSTNAME || 'unite-hub-server',
  
  // Error handling
  beforeSend(event, hint) {
    // Don't send in development
    if (ENVIRONMENT === 'development') {
      console.log('Sentry server event (dev mode):', event);
      return null;
    }
    
    // Log server errors
    if (event.exception) {
      console.error('Server error captured by Sentry:', hint.originalException || hint.syntheticException);
    }
    
    // Scrub sensitive data
    if (event.request) {
      // Remove auth headers
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
      
      // Remove sensitive query params
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string
          .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
      }
    }
    
    return event;
  },
});
