/**
 * Error Monitoring and Alerting System
 * Tracks error priority, severity, and triggers alerts for critical errors
 */

import { ApiError, ErrorPriority, ErrorSeverity } from './errors';
import { createApiLogger } from './logger';
import { apiErrors } from './metrics';

const logger = createApiLogger({ route: '/error-monitor' });

/**
 * Error statistics tracking
 */
interface ErrorStats {
  total: number;
  byPriority: Record<ErrorPriority, number>;
  bySeverity: Record<ErrorSeverity, number>;
  lastReset: Date;
}

const errorStats: ErrorStats = {
  total: 0,
  byPriority: {
    [ErrorPriority.P0_CRITICAL]: 0,
    [ErrorPriority.P1_HIGH]: 0,
    [ErrorPriority.P2_MEDIUM]: 0,
    [ErrorPriority.P3_LOW]: 0,
    [ErrorPriority.P4_TRIVIAL]: 0,
  },
  bySeverity: {
    [ErrorSeverity.FATAL]: 0,
    [ErrorSeverity.ERROR]: 0,
    [ErrorSeverity.WARNING]: 0,
    [ErrorSeverity.INFO]: 0,
  },
  lastReset: new Date(),
};

/**
 * Alert configuration by priority
 */
const ALERT_CONFIG = {
  [ErrorPriority.P0_CRITICAL]: {
    shouldAlert: true,
    immediateNotification: true,
    escalationMinutes: 5,
  },
  [ErrorPriority.P1_HIGH]: {
    shouldAlert: true,
    immediateNotification: true,
    escalationMinutes: 15,
  },
  [ErrorPriority.P2_MEDIUM]: {
    shouldAlert: true,
    immediateNotification: false,
    escalationMinutes: 60,
  },
  [ErrorPriority.P3_LOW]: {
    shouldAlert: false,
    immediateNotification: false,
    escalationMinutes: 240,
  },
  [ErrorPriority.P4_TRIVIAL]: {
    shouldAlert: false,
    immediateNotification: false,
    escalationMinutes: 0,
  },
};

/**
 * Monitor and log an error with priority and severity
 */
export function monitorError(error: ApiError, context?: Record<string, any>): void {
  const priority = error.problemDetail.priority || ErrorPriority.P3_LOW;
  const severity = error.problemDetail.severity || ErrorSeverity.ERROR;

  // Update statistics
  errorStats.total++;
  errorStats.byPriority[priority]++;
  errorStats.bySeverity[severity]++;

  // Record in Prometheus metrics
  apiErrors.inc({
    route: context?.route || 'unknown',
    error_type: error.problemDetail.type,
  });

  // Log with appropriate level
  const logData = {
    error: error.toJSON(),
    priority,
    severity,
    context,
  };

  switch (severity) {
    case ErrorSeverity.FATAL:
      logger.error('FATAL error occurred', logData);
      break;
    case ErrorSeverity.ERROR:
      logger.error('Error occurred', logData);
      break;
    case ErrorSeverity.WARNING:
      logger.warn('Warning occurred', logData);
      break;
    case ErrorSeverity.INFO:
      logger.info('Info event', logData);
      break;
  }

  // Trigger alerts for critical/high priority errors
  const alertConfig = ALERT_CONFIG[priority];
  if (alertConfig.shouldAlert) {
    triggerAlert(error, priority, alertConfig.immediateNotification);
  }
}

/**
 * Trigger alert for high-priority errors
 */
function triggerAlert(error: ApiError, priority: ErrorPriority, immediate: boolean): void {
  const alertData = {
    priority,
    immediate,
    error: error.toJSON(),
    timestamp: new Date().toISOString(),
  };

  if (immediate) {
    logger.error('🚨 IMMEDIATE ALERT TRIGGERED', alertData);
    // In production, integrate with:
    // - PagerDuty
    // - Slack webhooks
    // - Email alerts
    // - SMS alerts (Twilio)
  } else {
    logger.warn('⚠️  Alert queued', alertData);
    // Queue for batch processing
  }
}

/**
 * Get current error statistics
 */
export function getErrorStats(): ErrorStats {
  return {
    ...errorStats,
    lastReset: new Date(errorStats.lastReset),
  };
}

/**
 * Reset error statistics (e.g., daily reset)
 */
export function resetErrorStats(): void {
  errorStats.total = 0;
  errorStats.byPriority = {
    [ErrorPriority.P0_CRITICAL]: 0,
    [ErrorPriority.P1_HIGH]: 0,
    [ErrorPriority.P2_MEDIUM]: 0,
    [ErrorPriority.P3_LOW]: 0,
    [ErrorPriority.P4_TRIVIAL]: 0,
  };
  errorStats.bySeverity = {
    [ErrorSeverity.FATAL]: 0,
    [ErrorSeverity.ERROR]: 0,
    [ErrorSeverity.WARNING]: 0,
    [ErrorSeverity.INFO]: 0,
  };
  errorStats.lastReset = new Date();
  logger.info('Error statistics reset');
}

/**
 * Check if error rate is healthy
 */
export function isErrorRateHealthy(): {
  healthy: boolean;
  criticalCount: number;
  highCount: number;
  totalCount: number;
} {
  const criticalCount = errorStats.byPriority[ErrorPriority.P0_CRITICAL];
  const highCount = errorStats.byPriority[ErrorPriority.P1_HIGH];
  const totalCount = errorStats.total;

  // Healthy if: no P0 errors and fewer than 10 P1 errors
  const healthy = criticalCount === 0 && highCount < 10;

  return {
    healthy,
    criticalCount,
    highCount,
    totalCount,
  };
}

/**
 * Middleware helper to monitor API errors
 */
export function withErrorMonitoring<T>(
  fn: () => Promise<T>,
  context: Record<string, any>
): Promise<T> {
  return fn().catch((error) => {
    if (error instanceof ApiError) {
      monitorError(error, context);
    }
    throw error;
  });
}
