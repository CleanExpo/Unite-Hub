/**
 * ML Observability Layer
 *
 * Proactive error detection and pattern analysis for Unite-Hub API routes.
 * Uses statistical methods to detect anomalies and predict issues.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export interface RequestMetrics {
  routePath: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  workspaceId?: string;
  userId?: string;
  timestamp: Date;
  errorMessage?: string;
  errorStack?: string;
}

export interface AnomalyDetection {
  type: 'latency_spike' | 'error_rate_spike' | 'unusual_pattern' | 'cascade_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  route: string;
  description: string;
  detectedAt: Date;
  metrics: Record<string, number>;
}

export interface HealthScore {
  overall: number; // 0-100
  latency: number;
  errorRate: number;
  availability: number;
  timestamp: Date;
}

// ============================================
// IN-MEMORY METRICS BUFFER
// ============================================

class MetricsBuffer {
  private buffer: RequestMetrics[] = [];
  private maxSize = 10000;
  private flushInterval = 60000; // 1 minute
  private lastFlush = Date.now();

  add(metric: RequestMetrics): void {
    this.buffer.push(metric);

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  getRecent(windowMs: number = 300000): RequestMetrics[] {
    const cutoff = Date.now() - windowMs;
    return this.buffer.filter(m => m.timestamp.getTime() > cutoff);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metricsToFlush = [...this.buffer];
    this.buffer = [];
    this.lastFlush = Date.now();

    try {
      const supabase = await getSupabaseServer();

      // Batch insert to observability_logs table
      const { error } = await supabase
        .from('observability_logs')
        .insert(
          metricsToFlush.map(m => ({
            route_path: m.routePath,
            method: m.method,
            status_code: m.statusCode,
            latency_ms: m.latencyMs,
            workspace_id: m.workspaceId,
            user_id: m.userId,
            error_message: m.errorMessage,
            error_stack: m.errorStack,
            created_at: m.timestamp.toISOString(),
          }))
        );

      if (error) {
        console.error('[MLDetector] Failed to flush metrics:', error);
        // Re-add to buffer on failure (with limit)
        this.buffer.push(...metricsToFlush.slice(0, 1000));
      }
    } catch (err) {
      console.error('[MLDetector] Flush error:', err);
    }
  }

  clear(): void {
    this.buffer = [];
  }
}

// ============================================
// STATISTICAL HELPERS
// ============================================

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const m = mean ?? calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ============================================
// ML DETECTOR CLASS
// ============================================

class MLDetector {
  private metricsBuffer: MetricsBuffer;
  private baselineLatencies: Map<string, number[]> = new Map();
  private baselineErrorRates: Map<string, number> = new Map();
  private anomalyHistory: AnomalyDetection[] = [];
  private initialized = false;

  constructor() {
    this.metricsBuffer = new MetricsBuffer();
    this.startPeriodicTasks();
  }

  private startPeriodicTasks(): void {
    // Flush metrics every minute
    setInterval(() => {
      this.metricsBuffer.flush();
    }, 60000);

    // Update baselines every 5 minutes
    setInterval(() => {
      this.updateBaselines();
    }, 300000);

    // Clean old anomaly history every hour
    setInterval(() => {
      this.cleanAnomalyHistory();
    }, 3600000);
  }

  /**
   * Record a request metric
   */
  recordRequest(metric: RequestMetrics): void {
    this.metricsBuffer.add(metric);

    // Real-time anomaly detection
    this.detectAnomalies(metric);
  }

  /**
   * Detect anomalies in real-time
   */
  private detectAnomalies(metric: RequestMetrics): void {
    const routeKey = `${metric.method}:${metric.routePath}`;

    // Latency spike detection
    const baselineLatencies = this.baselineLatencies.get(routeKey) || [];
    if (baselineLatencies.length >= 10) {
      const mean = calculateMean(baselineLatencies);
      const stdDev = calculateStdDev(baselineLatencies, mean);
      const threshold = mean + (3 * stdDev); // 3 sigma rule

      if (metric.latencyMs > threshold && metric.latencyMs > 1000) {
        this.recordAnomaly({
          type: 'latency_spike',
          severity: metric.latencyMs > threshold * 2 ? 'high' : 'medium',
          route: routeKey,
          description: `Latency ${metric.latencyMs}ms exceeds baseline ${mean.toFixed(0)}ms by ${((metric.latencyMs - mean) / mean * 100).toFixed(0)}%`,
          detectedAt: new Date(),
          metrics: {
            latency: metric.latencyMs,
            baseline: mean,
            threshold,
          },
        });
      }
    }

    // Update baseline with new data
    baselineLatencies.push(metric.latencyMs);
    if (baselineLatencies.length > 100) {
      baselineLatencies.shift();
    }
    this.baselineLatencies.set(routeKey, baselineLatencies);

    // Error rate spike detection
    if (metric.statusCode >= 500) {
      const recentMetrics = this.metricsBuffer.getRecent(60000); // Last minute
      const routeMetrics = recentMetrics.filter(m =>
        `${m.method}:${m.routePath}` === routeKey
      );

      if (routeMetrics.length >= 5) {
        const errorRate = routeMetrics.filter(m => m.statusCode >= 500).length / routeMetrics.length;
        const baselineRate = this.baselineErrorRates.get(routeKey) || 0.01;

        if (errorRate > 0.2 && errorRate > baselineRate * 5) {
          this.recordAnomaly({
            type: 'error_rate_spike',
            severity: errorRate > 0.5 ? 'critical' : 'high',
            route: routeKey,
            description: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds baseline ${(baselineRate * 100).toFixed(1)}%`,
            detectedAt: new Date(),
            metrics: {
              errorRate,
              baselineRate,
              sampleSize: routeMetrics.length,
            },
          });
        }
      }
    }
  }

  /**
   * Record an anomaly for tracking
   */
  private recordAnomaly(anomaly: AnomalyDetection): void {
    // Deduplicate: don't record same anomaly within 5 minutes
    const recentSame = this.anomalyHistory.find(a =>
      a.type === anomaly.type &&
      a.route === anomaly.route &&
      Date.now() - a.detectedAt.getTime() < 300000
    );

    if (!recentSame) {
      this.anomalyHistory.push(anomaly);
      console.warn(`[MLDetector] Anomaly detected:`, anomaly);

      // Log to database for persistence
      this.persistAnomaly(anomaly);
    }
  }

  /**
   * Persist anomaly to database
   */
  private async persistAnomaly(anomaly: AnomalyDetection): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      await supabase
        .from('observability_anomalies')
        .insert({
          type: anomaly.type,
          severity: anomaly.severity,
          route: anomaly.route,
          description: anomaly.description,
          metrics: anomaly.metrics,
          detected_at: anomaly.detectedAt.toISOString(),
        });
    } catch (err) {
      console.error('[MLDetector] Failed to persist anomaly:', err);
    }
  }

  /**
   * Update baseline metrics from recent history
   */
  private async updateBaselines(): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      // Get last hour of metrics from database
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

      const { data, error } = await supabase
        .from('observability_logs')
        .select('route_path, method, status_code, latency_ms')
        .gte('created_at', oneHourAgo);

      if (error || !data) return;

      // Calculate baselines per route
      const routeGroups = new Map<string, { latencies: number[], errors: number, total: number }>();

      for (const log of data) {
        const key = `${log.method}:${log.route_path}`;
        const group = routeGroups.get(key) || { latencies: [], errors: 0, total: 0 };

        group.latencies.push(log.latency_ms);
        group.total++;
        if (log.status_code >= 500) group.errors++;

        routeGroups.set(key, group);
      }

      // Update baselines
      for (const [route, group] of routeGroups) {
        this.baselineLatencies.set(route, group.latencies.slice(-100));
        this.baselineErrorRates.set(route, group.errors / group.total);
      }

      console.log(`[MLDetector] Updated baselines for ${routeGroups.size} routes`);
    } catch (err) {
      console.error('[MLDetector] Failed to update baselines:', err);
    }
  }

  /**
   * Clean old anomaly history
   */
  private cleanAnomalyHistory(): void {
    const cutoff = Date.now() - 86400000; // 24 hours
    this.anomalyHistory = this.anomalyHistory.filter(a =>
      a.detectedAt.getTime() > cutoff
    );
  }

  /**
   * Calculate overall system health score
   */
  getHealthScore(): HealthScore {
    const recentMetrics = this.metricsBuffer.getRecent(300000); // Last 5 minutes

    if (recentMetrics.length === 0) {
      return {
        overall: 100,
        latency: 100,
        errorRate: 100,
        availability: 100,
        timestamp: new Date(),
      };
    }

    // Latency score (p95 < 200ms = 100, > 2000ms = 0)
    const latencies = recentMetrics.map(m => m.latencyMs);
    const p95 = calculatePercentile(latencies, 95);
    const latencyScore = Math.max(0, Math.min(100, 100 - ((p95 - 200) / 18)));

    // Error rate score (< 1% = 100, > 10% = 0)
    const errorCount = recentMetrics.filter(m => m.statusCode >= 500).length;
    const errorRate = errorCount / recentMetrics.length;
    const errorScore = Math.max(0, Math.min(100, 100 - (errorRate * 1000)));

    // Availability score (based on 4xx and 5xx)
    const failCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const availability = 1 - (failCount / recentMetrics.length);
    const availabilityScore = availability * 100;

    // Weighted overall score
    const overall = (latencyScore * 0.3) + (errorScore * 0.4) + (availabilityScore * 0.3);

    return {
      overall: Math.round(overall),
      latency: Math.round(latencyScore),
      errorRate: Math.round(errorScore),
      availability: Math.round(availabilityScore),
      timestamp: new Date(),
    };
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies(limit = 20): AnomalyDetection[] {
    return this.anomalyHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * Get route performance summary
   */
  getRoutePerformance(): Map<string, { p50: number; p95: number; p99: number; errorRate: number; count: number }> {
    const recentMetrics = this.metricsBuffer.getRecent(300000);
    const routeStats = new Map<string, RequestMetrics[]>();

    // Group by route
    for (const metric of recentMetrics) {
      const key = `${metric.method}:${metric.routePath}`;
      const group = routeStats.get(key) || [];
      group.push(metric);
      routeStats.set(key, group);
    }

    // Calculate stats per route
    const result = new Map<string, { p50: number; p95: number; p99: number; errorRate: number; count: number }>();

    for (const [route, metrics] of routeStats) {
      const latencies = metrics.map(m => m.latencyMs);
      const errors = metrics.filter(m => m.statusCode >= 500).length;

      result.set(route, {
        p50: calculatePercentile(latencies, 50),
        p95: calculatePercentile(latencies, 95),
        p99: calculatePercentile(latencies, 99),
        errorRate: errors / metrics.length,
        count: metrics.length,
      });
    }

    return result;
  }

  /**
   * Flush all pending metrics (call on shutdown)
   */
  async shutdown(): Promise<void> {
    await this.metricsBuffer.flush();
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const mlDetector = new MLDetector();

// ============================================
// MIDDLEWARE HELPER
// ============================================

/**
 * Create timing function for API routes
 * Usage:
 * ```
 * const timing = startTiming('/api/contacts', 'GET');
 * // ... handle request ...
 * timing.end(200);
 * ```
 */
export function startTiming(
  routePath: string,
  method: string,
  workspaceId?: string,
  userId?: string
): { end: (statusCode: number, error?: Error) => void } {
  const startTime = Date.now();

  return {
    end: (statusCode: number, error?: Error) => {
      const latencyMs = Date.now() - startTime;

      mlDetector.recordRequest({
        routePath,
        method,
        statusCode,
        latencyMs,
        workspaceId,
        userId,
        timestamp: new Date(),
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
    },
  };
}

// ============================================
// API ROUTE WRAPPER
// ============================================

/**
 * Wrap an API route handler with observability
 */
export function withObservability<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  routePath: string
): T {
  return (async (...args: Parameters<T>): Promise<Response> => {
    const req = args[0] as Request;
    const method = req.method || 'UNKNOWN';
    const timing = startTiming(routePath, method);

    try {
      const response = await handler(...args);
      timing.end(response.status);
      return response;
    } catch (error) {
      timing.end(500, error as Error);
      throw error;
    }
  }) as T;
}
