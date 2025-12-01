/**
 * Error Boundary Logger Integration
 *
 * Hooks into the error boundary system to log all errors
 * with context, metrics, and structured data
 *
 * @module lib/logging/error-boundary-logger
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AppError } from '@/core/errors/app-error';
import { logError, logValidationError, logAuthError, logDatabaseError } from './error-logger';
import { recordError, recordLatency } from '@/lib/monitoring/error-metrics';

/**
 * Log error from AppError instance
 */
export function logAppError(
  error: AppError,
  context?: Record<string, any>
): void {
  const errorContext = {
    code: error.code,
    domain: error.domain,
    status: error.status,
    ...context,
  };

  // Record metrics
  recordError(`${error.domain}_${error.code}`, {
    statusCode: error.status,
    route: context?.route,
    duration: context?.duration,
  });

  if (context?.duration) {
    recordLatency(context.duration);
  }

  // Route to appropriate logger
  switch (error.domain) {
    case 'VALIDATION':
      logValidationError(error.message, {
        fields: (error.details as any)?.fields,
        ...errorContext,
      });
      break;

    case 'AUTH':
      logAuthError(error.message, {
        ...errorContext,
      });
      break;

    case 'DATABASE':
      logDatabaseError(error.message, {
        table: (error.details as any)?.table,
        operation: (error.details as any)?.operation,
        ...errorContext,
      });
      break;

    default:
      logError(error, errorContext);
  }
}

/**
 * Log generic error with automatic categorization
 */
export function logGenericError(
  error: Error | string,
  context?: Record<string, any>
): void {
  const message = error instanceof Error ? error.message : error;
  const statusCode = context?.statusCode || 500;

  // Record metrics
  const errorType = statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
  recordError(errorType, {
    statusCode,
    route: context?.route,
    duration: context?.duration,
  });

  if (context?.duration) {
    recordLatency(context.duration);
  }

  logError(message, context);
}

/**
 * Create error logging wrapper for handlers
 * Usage: withErrorLogging(handler, { route: '/api/example' })
 */
export function withErrorLogging(
  handler: (...args: any[]) => Promise<any>,
  defaultContext?: Record<string, any>
) {
  return async (...args: any[]) => {
    const startTime = Date.now();

    try {
      return await handler(...args);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof AppError) {
        logAppError(error, {
          ...defaultContext,
          duration,
        });
      } else {
        logGenericError(error as Error, {
          ...defaultContext,
          duration,
          statusCode: 500,
        });
      }

      throw error; // Re-throw for error boundary to handle
    }
  };
}

export default {
  logAppError,
  logGenericError,
  withErrorLogging,
};
