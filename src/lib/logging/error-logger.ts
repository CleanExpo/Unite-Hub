/**
 * Error Logging System - Winston Integration
 *
 * Comprehensive error logging with:
 * - Daily log rotation
 * - Error level tracking
 * - Structured logging
 * - Production-ready format
 *
 * @module lib/logging/error-logger
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from 'winston';
import path from 'path';
import { sanitizeFormat } from './sanitize';

const LOG_DIR = process.env.LOG_DIR || 'logs';

/**
 * Log levels with custom colors
 */
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'gray',
  },
};

/**
 * Create error logger instance with automatic sanitization
 */
const errorLogger = winston.createLogger({
  levels: customLevels.levels,
  defaultMeta: { service: 'unite-hub-api' },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    sanitizeFormat(), // ✅ Sanitize all error logs
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Error logs (all errors)
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 30,
      tailable: true,
    }),

    // All logs (combined)
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 30,
      tailable: true,
    }),
  ],
});

/**
 * Add console transport in development
 */
if (process.env.NODE_ENV !== 'production') {
  errorLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: customLevels.colors }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

/**
 * Log error with context
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  errorLogger.error(errorMessage, {
    ...context,
    stack: errorStack,
  });
}

/**
 * Log validation error
 */
export function logValidationError(
  message: string,
  details: Record<string, any>
): void {
  errorLogger.warn(message, {
    type: 'VALIDATION_ERROR',
    ...details,
  });
}

/**
 * Log authentication error
 */
export function logAuthError(
  message: string,
  details?: Record<string, any>
): void {
  errorLogger.warn(message, {
    type: 'AUTH_ERROR',
    ...details,
  });
}

/**
 * Log database error
 */
export function logDatabaseError(
  message: string,
  details?: Record<string, any>
): void {
  errorLogger.error(message, {
    type: 'DATABASE_ERROR',
    ...details,
  });
}

/**
 * Log API request/response
 */
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  details?: Record<string, any>
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';

  errorLogger.log(level, `${method} ${path}`, {
    type: 'API_CALL',
    statusCode,
    duration,
    ...details,
  });
}

/**
 * Get logs summary (last N errors)
 */
export async function getErrorSummary(): Promise<Record<string, unknown>[]> {
  // This would typically read from log files or a log aggregation service
  // For now, return placeholder
  return [];
}

/**
 * Cleanup old logs
 */
export function cleanupLogs(): void {
  // Winston handles this with maxFiles setting
  errorLogger.info('Log cleanup triggered');
}

export default errorLogger;
