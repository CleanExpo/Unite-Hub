/**
 * Performance Metrics Collection for Distributed Tracing
 *
 * Comprehensive metrics collection across HTTP, database, and error operations:
 * - Latency histograms with configurable percentiles (p50, p75, p90, p95, p99)
 * - Operation counters and error tracking
 * - Health score calculation (0-100) based on error rates and latency
 * - Resource utilization tracking (memory, active operations)
 * - Time-series aggregation for trend analysis
 *
 * Integrates with:
 * - HTTP span metrics (request latency, status codes)
 * - Database operation metrics (query latency, row counts)
 * - Error boundary metrics (error severity, recovery rates)
 * - Distributed tracing context
 *
 * @module lib/tracing/performance-metrics
 */

 
/* global process, console */

/**
 * Performance metric data point
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

/**
 * Histogram for tracking latency distributions
 */
export interface LatencyHistogram {
  name: string;
  samples: number[];
  min: number;
  max: number;
  count: number;
  mean: number;
  stdDev: number;
  percentiles: Record<number, number>;
}

/**
 * Operation metrics snapshot
 */
export interface OperationMetrics {
  name: string;
  count: number;
  errorCount: number;
  errorRate: number;
  latency: LatencyHistogram;
  lastUpdated: number;
}

/**
 * System health score (0-100)
 */
export interface HealthScore {
  overall: number;
  errorRate: number;
  latencyHealth: number;
  resourceHealth: number;
  uptime: number;
  recommendations: string[];
  timestamp: number;
}

/**
 * Performance metrics snapshot for export
 */
export interface MetricsSnapshot {
  timestamp: number;
  uptime: number;
  operations: Record<string, OperationMetrics>;
  health: HealthScore;
  resourceUsage: {
    memoryMb: number;
    activeOperations: number;
  };
}

/**
 * Histogram implementation with statistical calculations
 *
 * QUALITY GATE 1: Must accurately calculate percentiles
 * QUALITY GATE 2: Must maintain bounded memory usage
 */
class Histogram {
  private samples: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  record(value: number): void {
    this.samples.push(value);
    // Keep memory bounded
    if (this.samples.length > this.maxSize) {
      this.samples = this.samples.slice(this.samples.length - this.maxSize);
    }
  }

  percentile(p: number): number {
    if (this.samples.length === 0) {
      return 0;
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  mean(): number {
    if (this.samples.length === 0) {
      return 0;
    }
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }

  stdDev(): number {
    if (this.samples.length <= 1) {
      return 0;
    }
    const avg = this.mean();
    const squaredDiffs = this.samples.map((s) => Math.pow(s - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (this.samples.length - 1);
    return Math.sqrt(variance);
  }

  min(): number {
    return this.samples.length === 0 ? 0 : Math.min(...this.samples);
  }

  max(): number {
    return this.samples.length === 0 ? 0 : Math.max(...this.samples);
  }

  count(): number {
    return this.samples.length;
  }

  reset(): void {
    this.samples = [];
  }

  getPercentiles(percentiles: number[]): Record<number, number> {
    const result: Record<number, number> = {};
    for (const p of percentiles) {
      result[p] = this.percentile(p);
    }
    return result;
  }
}

/**
 * Performance metrics collector
 *
 * QUALITY GATE 3: Must track all operation types
 * QUALITY GATE 4: Must calculate health scores accurately
 * QUALITY GATE 5: Must never throw during metrics recording
 */
export class PerformanceMetricsCollector {
  private operationMetrics: Map<string, OperationMetrics> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private startTime: number = Date.now();
  private percentiles: number[] = [50, 75, 90, 95, 99];
  private maxHistogramSize: number = 1000;
  private errorRateThreshold: number = 0.05; // 5% error rate is acceptable
  private latencyThreshold: number = 1000; // 1000ms is acceptable

  /**
   * Record operation execution
   */
  recordOperation(
    operationName: string,
    latency: number,
    success: boolean
  ): void {
    try {
      // Get or create operation metrics
      let metrics = this.operationMetrics.get(operationName);
      if (!metrics) {
        metrics = {
          name: operationName,
          count: 0,
          errorCount: 0,
          errorRate: 0,
          latency: {
            name: operationName,
            samples: [],
            min: 0,
            max: 0,
            count: 0,
            mean: 0,
            stdDev: 0,
            percentiles: {},
          },
          lastUpdated: Date.now(),
        };
        this.operationMetrics.set(operationName, metrics);
      }

      // Update counters
      metrics.count += 1;
      if (!success) {
        metrics.errorCount += 1;
      }
      metrics.errorRate = metrics.errorCount / metrics.count;
      metrics.lastUpdated = Date.now();

      // Record latency histogram
      const histogramKey = operationName;
      let histogram = this.histograms.get(histogramKey);
      if (!histogram) {
        histogram = new Histogram(this.maxHistogramSize);
        this.histograms.set(histogramKey, histogram);
      }
      histogram.record(latency);

      // Update latency snapshot
      metrics.latency.samples = histogram.count() > 0 ? [latency] : [];
      metrics.latency.min = histogram.min();
      metrics.latency.max = histogram.max();
      metrics.latency.count = histogram.count();
      metrics.latency.mean = histogram.mean();
      metrics.latency.stdDev = histogram.stdDev();
      metrics.latency.percentiles = histogram.getPercentiles(this.percentiles);
    } catch (error) {
      // QUALITY GATE 5: Never throw
      console.error('[PerformanceMetrics] Error recording operation:', error);
    }
  }

  /**
   * Calculate system health score (0-100)
   *
   * QUALITY GATE 4: Health score must be accurate and meaningful
   */
  calculateHealthScore(): HealthScore {
    const now = Date.now();
    const uptime = now - this.startTime;
    const recommendations: string[] = [];

    // Calculate error rate health (0-100)
    let errorRateScore = 100;
    let totalErrors = 0;
    let totalOperations = 0;

    for (const metrics of this.operationMetrics.values()) {
      totalOperations += metrics.count;
      totalErrors += metrics.errorCount;

      if (metrics.errorRate > this.errorRateThreshold) {
        errorRateScore -= Math.min(30, metrics.errorRate * 100);
        recommendations.push(
          `High error rate in ${metrics.name}: ${(metrics.errorRate * 100).toFixed(1)}%`
        );
      }
    }

    const overallErrorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
    errorRateScore = Math.max(0, Math.min(100, errorRateScore));

    // Calculate latency health (0-100)
    let latencyScore = 100;
    for (const metrics of this.operationMetrics.values()) {
      if (metrics.latency.mean > this.latencyThreshold) {
        latencyScore -= Math.min(30, (metrics.latency.mean / this.latencyThreshold) * 10);
        recommendations.push(
          `High latency in ${metrics.name}: ${metrics.latency.mean.toFixed(0)}ms`
        );
      }

      if (metrics.latency.percentiles[99] && metrics.latency.percentiles[99] > this.latencyThreshold * 2) {
        latencyScore -= 10;
        recommendations.push(
          `P99 latency in ${metrics.name}: ${metrics.latency.percentiles[99].toFixed(0)}ms`
        );
      }
    }

    latencyScore = Math.max(0, Math.min(100, latencyScore));

    // Calculate resource health (0-100)
    let resourceScore = 100;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memoryUsage > 200) {
      resourceScore -= Math.min(20, (memoryUsage / 500) * 20);
      recommendations.push(`High memory usage: ${memoryUsage.toFixed(0)}MB`);
    }

    resourceScore = Math.max(0, Math.min(100, resourceScore));

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      errorRateScore * 0.4 + latencyScore * 0.4 + resourceScore * 0.2
    );

    return {
      overall: overallScore,
      errorRate: Math.round(overallErrorRate * 100 * 100) / 100,
      latencyHealth: latencyScore,
      resourceHealth: resourceScore,
      uptime,
      recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
      timestamp: now,
    };
  }

  /**
   * Get metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    const health = this.calculateHealthScore();

    const operations: Record<string, OperationMetrics> = {};
    for (const [name, metrics] of this.operationMetrics.entries()) {
      operations[name] = { ...metrics };
    }

    // Calculate resource usage
    let activeOperations = 0;
    for (const metrics of this.operationMetrics.values()) {
      // Rough estimate: operations active in last 5 seconds
      if (Date.now() - metrics.lastUpdated < 5000) {
        activeOperations += Math.round(metrics.count * 0.1);
      }
    }

    return {
      timestamp: Date.now(),
      uptime: health.uptime,
      operations,
      health,
      resourceUsage: {
        memoryMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        activeOperations,
      },
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.operationMetrics.clear();
    this.histograms.clear();
    this.startTime = Date.now();
  }

  /**
   * Get operation metrics
   */
  getOperationMetrics(operationName: string): OperationMetrics | undefined {
    return this.operationMetrics.get(operationName);
  }

  /**
   * Get all operation names
   */
  getOperationNames(): string[] {
    return Array.from(this.operationMetrics.keys());
  }
}

/**
 * Global metrics collector instance
 */
let metricsCollector: PerformanceMetricsCollector | null = null;

/**
 * Initialize performance metrics collector
 */
export function initializePerformanceMetrics(): PerformanceMetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new PerformanceMetricsCollector();
  }
  return metricsCollector;
}

/**
 * Get metrics collector instance
 */
export function getPerformanceMetrics(): PerformanceMetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new PerformanceMetricsCollector();
  }
  return metricsCollector;
}

/**
 * Record operation execution
 */
export function recordOperation(
  operationName: string,
  latency: number,
  success: boolean
): void {
  getPerformanceMetrics().recordOperation(operationName, latency, success);
}

/**
 * Get current metrics snapshot
 */
export function getMetricsSnapshot(): MetricsSnapshot {
  return getPerformanceMetrics().getSnapshot();
}

/**
 * Get health score
 */
export function getHealthScore(): HealthScore {
  return getPerformanceMetrics().calculateHealthScore();
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  getPerformanceMetrics().reset();
}
