/**
 * Error Metrics System - Prometheus Integration
 *
 * Track and report:
 * - Error counts by type
 * - Error rates
 * - Response times
 * - Health scores
 * - Alert thresholds
 *
 * @module lib/monitoring/error-metrics
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ErrorMetric {
  type: string;
  count: number;
  lastOccurrence: Date;
  averageResponseTime?: number;
}

interface MetricsData {
  timestamp: Date;
  errors: Record<string, ErrorMetric>;
  totalErrors: number;
  healthScore: number;
}

/**
 * In-memory metrics store (use Redis in production)
 */
class ErrorMetricsCollector {
  private metrics: Record<string, ErrorMetric> = {};
  private apiLatencies: number[] = [];
  private maxLatencyHistory = 1000;

  /**
   * Record an error occurrence
   */
  recordError(
    errorType: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.metrics[errorType]) {
      this.metrics[errorType] = {
        type: errorType,
        count: 0,
        lastOccurrence: new Date(),
      };
    }

    this.metrics[errorType].count++;
    this.metrics[errorType].lastOccurrence = new Date();

    if (metadata?.duration) {
      this.recordLatency(metadata.duration);
    }
  }

  /**
   * Record API latency
   */
  recordLatency(duration: number): void {
    this.apiLatencies.push(duration);

    // Keep only recent latencies
    if (this.apiLatencies.length > this.maxLatencyHistory) {
      this.apiLatencies.shift();
    }
  }

  /**
   * Get error metrics
   */
  getMetrics(): MetricsData {
    const totalErrors = Object.values(this.metrics).reduce(
      (sum, m) => sum + m.count,
      0
    );

    return {
      timestamp: new Date(),
      errors: this.metrics,
      totalErrors,
      healthScore: this.calculateHealthScore(),
    };
  }

  /**
   * Calculate health score (0-100)
   * Higher is better
   */
  private calculateHealthScore(): number {
    // Factors:
    // - Error rate (lower is better)
    // - Response time (lower is better)
    // - 4xx vs 5xx ratio (more 4xx is acceptable)

    const avgLatency = this.getAverageLatency();
    const errorRate = this.calculateErrorRate();

    // 100 = healthy, 0 = severe issues
    // Max latency budget: 500ms
    // Max error rate: 5%

    let score = 100;

    // Deduct for latency (max 50 points)
    const latencyPenalty = Math.min(50, (avgLatency / 500) * 50);
    score -= latencyPenalty;

    // Deduct for error rate (max 50 points)
    const errorPenalty = Math.min(50, (errorRate / 5) * 50);
    score -= errorPenalty;

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate error rate (errors per minute)
   */
  private calculateErrorRate(): number {
    if (this.apiLatencies.length === 0) {
return 0;
}

    const totalErrors = Object.values(this.metrics).reduce(
      (sum, m) => sum + m.count,
      0
    );

    // Estimate based on recent activity
    return (totalErrors / Math.max(1, this.apiLatencies.length)) * 100;
  }

  /**
   * Get average API latency
   */
  getAverageLatency(): number {
    if (this.apiLatencies.length === 0) {
return 0;
}

    const sum = this.apiLatencies.reduce((a, b) => a + b, 0);
    return sum / this.apiLatencies.length;
  }

  /**
   * Get percentile latency (p95, p99)
   */
  getLatencyPercentile(percentile: number): number {
    if (this.apiLatencies.length === 0) {
return 0;
}

    const sorted = [...this.apiLatencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Get error count by type
   */
  getErrorCount(errorType?: string): number {
    if (errorType) {
      return this.metrics[errorType]?.count || 0;
    }

    return Object.values(this.metrics).reduce((sum, m) => sum + m.count, 0);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {};
    this.apiLatencies = [];
  }

  /**
   * Export Prometheus format
   */
  exportPrometheus(): string {
    let output = '# HELP unite_hub_errors_total Total errors by type\n';
    output += '# TYPE unite_hub_errors_total counter\n';

    Object.entries(this.metrics).forEach(([type, metric]) => {
      output += `unite_hub_errors_total{type="${type}"} ${metric.count}\n`;
    });

    output += '\n# HELP unite_hub_api_latency_ms API latency in milliseconds\n';
    output += '# TYPE unite_hub_api_latency_ms gauge\n';
    output += `unite_hub_api_latency_ms{quantile="0.5"} ${this.getLatencyPercentile(50)}\n`;
    output += `unite_hub_api_latency_ms{quantile="0.95"} ${this.getLatencyPercentile(95)}\n`;
    output += `unite_hub_api_latency_ms{quantile="0.99"} ${this.getLatencyPercentile(99)}\n`;

    output += '\n# HELP unite_hub_health_score System health score (0-100)\n';
    output += '# TYPE unite_hub_health_score gauge\n';
    output += `unite_hub_health_score ${this.calculateHealthScore()}\n`;

    return output;
  }
}

/**
 * Singleton instance
 */
export const metricsCollector = new ErrorMetricsCollector();

/**
 * Convenience functions
 */
export function recordError(
  errorType: string,
  metadata?: Record<string, any>
): void {
  metricsCollector.recordError(errorType, metadata);
}

export function recordLatency(duration: number): void {
  metricsCollector.recordLatency(duration);
}

export function getMetrics(): MetricsData {
  return metricsCollector.getMetrics();
}

export function getHealthScore(): number {
  return metricsCollector.getMetrics().healthScore;
}

export function getErrorCount(type?: string): number {
  return metricsCollector.getErrorCount(type);
}

export function getAverageLatency(): number {
  return metricsCollector.getAverageLatency();
}

export function exportPrometheus(): string {
  return metricsCollector.exportPrometheus();
}

export default metricsCollector;
