/**
 * Performance Monitoring Utilities
 * Track and analyze application performance metrics
 */

import { httpRequestDuration, dbQueryDuration, aiRequestDuration } from './metrics';
import { createApiLogger } from './logger';

const logger = createApiLogger({ route: '/performance-monitor' });

/**
 * Performance thresholds (in milliseconds)
 */
const THRESHOLDS = {
  API_RESPONSE: {
    good: 100,
    acceptable: 500,
    slow: 1000,
  },
  DATABASE_QUERY: {
    good: 50,
    acceptable: 200,
    slow: 500,
  },
  AI_REQUEST: {
    good: 2000,
    acceptable: 5000,
    slow: 10000,
  },
};

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Mark a checkpoint
   */
  checkpoint(name: string): void {
    const elapsed = performance.now() - this.startTime;
    this.checkpoints.set(name, elapsed);
  }

  /**
   * Get elapsed time since start
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get checkpoint duration
   */
  getCheckpoint(name: string): number | undefined {
    return this.checkpoints.get(name);
  }

  /**
   * Get all checkpoints
   */
  getAllCheckpoints(): Record<string, number> {
    return Object.fromEntries(this.checkpoints);
  }

  /**
   * End timer and return duration
   */
  end(): number {
    return this.elapsed();
  }
}

/**
 * Monitor API request performance
 */
export async function monitorApiRequest<T>(
  method: string,
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer();

  try {
    const result = await fn();
    const duration = timer.end() / 1000; // Convert to seconds

    // Record in Prometheus
    httpRequestDuration.observe({ method, route, status_code: 200 }, duration);

    // Log if slow
    if (duration > THRESHOLDS.API_RESPONSE.slow / 1000) {
      logger.warn('Slow API request detected', {
        method,
        route,
        duration,
        threshold: THRESHOLDS.API_RESPONSE.slow / 1000,
      });
    }

    return result;
  } catch (error) {
    const duration = timer.end() / 1000;
    httpRequestDuration.observe({ method, route, status_code: 500 }, duration);
    throw error;
  }
}

/**
 * Monitor database query performance
 */
export async function monitorDbQuery<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer();

  try {
    const result = await fn();
    const duration = timer.end() / 1000; // Convert to seconds

    // Record in Prometheus
    dbQueryDuration.observe({ operation, table }, duration);

    // Log if slow
    if (duration > THRESHOLDS.DATABASE_QUERY.slow / 1000) {
      logger.warn('Slow database query detected', {
        operation,
        table,
        duration,
        threshold: THRESHOLDS.DATABASE_QUERY.slow / 1000,
      });
    }

    return result;
  } catch (error) {
    logger.error('Database query failed', {
      operation,
      table,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Monitor AI/LLM request performance
 */
export async function monitorAiRequest<T>(
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer();

  try {
    const result = await fn();
    const duration = timer.end() / 1000; // Convert to seconds

    // Record in Prometheus
    aiRequestDuration.observe({ model, operation }, duration);

    // Log if slow
    if (duration > THRESHOLDS.AI_REQUEST.slow / 1000) {
      logger.warn('Slow AI request detected', {
        model,
        operation,
        duration,
        threshold: THRESHOLDS.AI_REQUEST.slow / 1000,
      });
    }

    return result;
  } catch (error) {
    logger.error('AI request failed', {
      model,
      operation,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Performance report generation
 */
export interface PerformanceReport {
  timestamp: string;
  metrics: {
    apiRequests: {
      total: number;
      avgDuration: number;
      p95Duration: number;
      slowRequests: number;
    };
    databaseQueries: {
      total: number;
      avgDuration: number;
      slowQueries: number;
    };
    aiRequests: {
      total: number;
      avgDuration: number;
      slowRequests: number;
    };
  };
  recommendations: string[];
}

/**
 * Generate performance recommendations
 */
export function generateRecommendations(report: PerformanceReport): string[] {
  const recommendations: string[] = [];

  // API performance
  if (report.metrics.apiRequests.avgDuration > THRESHOLDS.API_RESPONSE.acceptable) {
    recommendations.push('Consider implementing API response caching');
  }
  if (report.metrics.apiRequests.slowRequests > 10) {
    recommendations.push('High number of slow API requests detected - investigate bottlenecks');
  }

  // Database performance
  if (report.metrics.databaseQueries.avgDuration > THRESHOLDS.DATABASE_QUERY.acceptable) {
    recommendations.push('Database queries are slow - add indexes or optimize queries');
  }
  if (report.metrics.databaseQueries.slowQueries > 5) {
    recommendations.push('Consider implementing database connection pooling or read replicas');
  }

  // AI performance
  if (report.metrics.aiRequests.avgDuration > THRESHOLDS.AI_REQUEST.acceptable) {
    recommendations.push('AI requests are slow - consider prompt caching or model optimization');
  }

  return recommendations;
}

/**
 * Web Vitals monitoring (Client-side)
 */
export interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  FCP?: number; // First Contentful Paint
}

/**
 * Check if Web Vitals meet thresholds
 */
export function areWebVitalsGood(vitals: WebVitals): {
  good: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (vitals.LCP && vitals.LCP > 2500) {
    issues.push('LCP (Largest Contentful Paint) is too slow');
  }
  if (vitals.FID && vitals.FID > 100) {
    issues.push('FID (First Input Delay) is too high');
  }
  if (vitals.CLS && vitals.CLS > 0.1) {
    issues.push('CLS (Cumulative Layout Shift) is too high');
  }
  if (vitals.TTFB && vitals.TTFB > 600) {
    issues.push('TTFB (Time to First Byte) is too slow');
  }
  if (vitals.FCP && vitals.FCP > 1800) {
    issues.push('FCP (First Contentful Paint) is too slow');
  }

  return {
    good: issues.length === 0,
    issues,
  };
}
