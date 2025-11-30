/**
 * Winston Database Transport
 *
 * Custom Winston transport that logs to database autonomously
 */

import Transport from 'winston-transport';
import { logError, ErrorSeverity, ErrorPriority } from './autonomous-monitor';

interface DatabaseTransportOptions extends Transport.TransportStreamOptions {
  tableName?: string;
}

/**
 * Map Winston log levels to our severity levels
 */
function mapSeverity(level: string): ErrorSeverity {
  switch (level) {
    case 'error':
      return ErrorSeverity.ERROR;
    case 'warn':
      return ErrorSeverity.WARNING;
    case 'info':
      return ErrorSeverity.INFO;
    default:
      return ErrorSeverity.INFO;
  }
}

/**
 * Infer priority from message content
 */
function inferPriority(message: string, meta: any): ErrorPriority {
  const msgLower = message.toLowerCase();

  // P0: Critical keywords
  if (
    msgLower.includes('fatal') ||
    msgLower.includes('crash') ||
    msgLower.includes('down') ||
    msgLower.includes('security') ||
    msgLower.includes('breach') ||
    meta?.priority === 'P0' ||
    meta?.severity === 'FATAL'
  ) {
    return ErrorPriority.P0_CRITICAL;
  }

  // P1: High priority keywords
  if (
    msgLower.includes('failed') ||
    msgLower.includes('broken') ||
    msgLower.includes('timeout') ||
    msgLower.includes('unavailable') ||
    meta?.priority === 'P1'
  ) {
    return ErrorPriority.P1_HIGH;
  }

  // P2: Medium priority
  if (
    msgLower.includes('slow') ||
    msgLower.includes('degraded') ||
    msgLower.includes('retry') ||
    meta?.priority === 'P2'
  ) {
    return ErrorPriority.P2_MEDIUM;
  }

  // Default to P3
  return ErrorPriority.P3_LOW;
}

/**
 * Custom Winston transport that logs to database
 *
 * Uses a circuit breaker pattern to prevent infinite recursion:
 * When database logging fails, subsequent log.error calls should NOT
 * trigger more database writes until the circuit resets.
 */
export class DatabaseTransport extends Transport {
  private isLogging = false;
  private circuitOpen = false;
  private circuitOpenedAt = 0;
  private readonly circuitResetMs = 30000; // Reset after 30 seconds

  constructor(opts?: DatabaseTransportOptions) {
    super(opts);
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Only log errors and warnings to database (not info/debug)
    if (info.level !== 'error' && info.level !== 'warn') {
      callback();
      return;
    }

    // Circuit breaker: prevent recursive logging and respect circuit state
    if (this.isLogging) {
      // Already in a logging call - skip to prevent recursion
      callback();
      return;
    }

    // Check if circuit is open (database unavailable)
    if (this.circuitOpen) {
      // Check if it's time to reset the circuit
      if (Date.now() - this.circuitOpenedAt > this.circuitResetMs) {
        this.circuitOpen = false;
        console.log('[DatabaseTransport] Circuit reset - retrying database logging');
      } else {
        // Circuit still open, skip database logging
        callback();
        return;
      }
    }

    // Set flag to prevent recursive logging
    this.isLogging = true;

    try {
      const severity = mapSeverity(info.level);
      const priority = inferPriority(info.message, info);

      // Extract context from meta
      const context: Record<string, any> = { ...info };
      delete context.level;
      delete context.message;
      delete context.timestamp;

      // Extract error stack trace if available
      let stackTrace: string | undefined;
      if (info.stack) {
        stackTrace = info.stack;
      } else if (info.error && info.error.stack) {
        stackTrace = info.error.stack;
      }

      // Log to database
      await logError({
        severity,
        priority,
        errorType: info.errorType || 'GENERIC_ERROR',
        message: info.message,
        stackTrace,
        context,
        userId: info.userId,
        workspaceId: info.workspaceId,
        route: info.route,
      });
    } catch (error) {
      // Open circuit to prevent flooding failed database with retries
      this.circuitOpen = true;
      this.circuitOpenedAt = Date.now();
      console.error('[DatabaseTransport] Failed to log to database, opening circuit for 30s:',
        error instanceof Error ? error.message : error);
    } finally {
      this.isLogging = false;
    }

    callback();
  }
}
