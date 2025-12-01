/**
 * Error Logging Integration
 *
 * Provides structured error logging for all API errors.
 * Captures error context (route, user, workspace) for debugging and monitoring.
 */

/**
 * Error context for logging
 */
export interface ErrorContext {
  route?: string;
  method?: string;
  operationType?: string;
  userId?: string;
  workspaceId?: string;
  timestamp: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  code: string;
  status: number;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
  context: ErrorContext;
}

/**
 * In-memory error logger for development/testing
 * In production, use Winston with file transports
 */
class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private readonly maxSize = 10000;

  log(entry: ErrorLogEntry): void {
    this.errors.push(entry);

    if (this.errors.length > this.maxSize) {
      this.errors = this.errors.slice(-this.maxSize);
    }
  }

  /**
   * Get recent errors (for dashboard/monitoring)
   */
  getRecent(count: number = 100): ErrorLogEntry[] {
    return this.errors.slice(-count);
  }

  /**
   * Get errors by code
   */
  getByCode(code: string): ErrorLogEntry[] {
    return this.errors.filter((e) => e.code === code);
  }

  /**
   * Get error stats
   */
  getStats(): {
    total: number;
    byCode: Record<string, number>;
    byStatus: Record<number, number>;
    recent24h: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const byCode: Record<string, number> = {};
    const byStatus: Record<number, number> = {};
    let recent24h = 0;

    for (const error of this.errors) {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      byStatus[error.status] = (byStatus[error.status] || 0) + 1;

      const errorTime = new Date(error.timestamp).getTime();
      if (errorTime > oneDayAgo) {
        recent24h += 1;
      }
    }

    return {
      total: this.errors.length,
      byCode,
      byStatus,
      recent24h,
    };
  }

  /**
   * Clear logs (useful for testing)
   */
  clear(): void {
    this.errors = [];
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Log API error with context
 */
export function logApiError(entry: ErrorLogEntry): void {
  errorLogger.log(entry);
}

/**
 * Create error context from request
 */
 
 
export function createErrorContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any,
  overrides?: Partial<ErrorContext>
): ErrorContext {
  return {
    route: req?.nextUrl?.pathname,
    method: req?.method,
    timestamp: new Date().toISOString(),
    ip: req?.headers?.get('x-forwarded-for') || req?.headers?.get('cf-connecting-ip'),
    userAgent: req?.headers?.get('user-agent'),
    ...overrides,
  };
}

/**
 * Get error monitoring dashboard data
 */
export function getErrorMonitoringData() {
  const stats = errorLogger.getStats();
  const recent = errorLogger.getRecent(50);

  return {
    stats,
    recent,
    topErrors: Object.entries(stats.byCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10),
    topStatuses: Object.entries(stats.byStatus)
      .sort(([, a], [, b]) => b - a),
  };
}

/**
 * Error health check
 */
export function checkErrorHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  errorRate: number;
  message: string;
} {
  const stats = errorLogger.getStats();
  const errorRate = stats.recent24h / (24 * 60);

  if (errorRate < 1) {
    return {
      status: 'healthy',
      errorRate,
      message: 'Error rate is normal',
    };
  }
  if (errorRate < 10) {
    return {
      status: 'warning',
      errorRate,
      message: 'Error rate is elevated',
    };
  }
  return {
    status: 'critical',
    errorRate,
    message: 'Error rate is critically high',
  };
}
