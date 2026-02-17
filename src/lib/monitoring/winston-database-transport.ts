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
 *
 * IMPORTANT: Only explicit meta.priority can trigger P0/P1 (which send email alerts).
 * Keyword-based inference caps at P2_MEDIUM to prevent every log.error("failed...")
 * across the codebase from sending alert emails via logError() → sendCriticalErrorAlert().
 */
function inferPriority(message: string, meta: any): ErrorPriority {
  // Only explicit metadata can trigger P0/P1 (email-alerting priorities)
  if (meta?.priority === 'P0' || meta?.severity === 'FATAL') {
    return ErrorPriority.P0_CRITICAL;
  }
  if (meta?.priority === 'P1') {
    return ErrorPriority.P1_HIGH;
  }
  if (meta?.priority === 'P2') {
    return ErrorPriority.P2_MEDIUM;
  }

  // Keyword-based inference (capped at P2 — no email alerts)
  const msgLower = message.toLowerCase();

  if (
    msgLower.includes('fatal') ||
    msgLower.includes('crash') ||
    msgLower.includes('breach') ||
    msgLower.includes('failed') ||
    msgLower.includes('broken') ||
    msgLower.includes('timeout') ||
    msgLower.includes('unavailable')
  ) {
    return ErrorPriority.P2_MEDIUM;
  }

  if (
    msgLower.includes('slow') ||
    msgLower.includes('degraded') ||
    msgLower.includes('retry')
  ) {
    return ErrorPriority.P3_LOW;
  }

  // Default to P3
  return ErrorPriority.P3_LOW;
}

/**
 * Custom Winston transport that logs to database
 */
export class DatabaseTransport extends Transport {
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
      // Don't throw - just log to console
      console.error('Failed to log to database:', error);
    }

    callback();
  }
}
