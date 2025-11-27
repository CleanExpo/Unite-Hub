/**
 * Alert Monitoring & Metrics
 * Tracks performance metrics for the alert system
 */

interface MetricsValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

class AlertMetricsCollector {
  private metrics: Map<string, MetricsValue[]> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();
  private metricsRetention = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Record counter metric
   */
  recordCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricsKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    // Log metric
    this.logMetric(name, current + value, labels);
  }

  /**
   * Record histogram metric (latency, duration, etc)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricsKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }

    this.histograms.get(key)!.push(value);

    // Keep only recent values
    const values = this.histograms.get(key)!;
    if (values.length > 1000) {
      values.shift();
    }

    this.logMetric(name, value, labels);
  }

  /**
   * Record gauge metric (current state)
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricsKey(name, labels);
    this.gauges.set(key, value);
    this.logMetric(name, value, labels);
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricsKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get histogram stats
   */
  getHistogramStats(name: string, labels?: Record<string, string>) {
    const key = this.getMetricsKey(name, labels);
    const values = this.histograms.get(key) || [];

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    return {
      count: values.length,
      sum,
      mean,
      min: sorted[0],
      max: sorted[values.length - 1],
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricsKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get all metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = '';

    // Export counters
    this.counters.forEach((value, key) => {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n`;
    });

    // Export gauges
    this.gauges.forEach((value, key) => {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${value}\n`;
    });

    // Export histograms
    this.histograms.forEach((values, key) => {
      const stats = this.calculateStats(values);
      output += `# TYPE ${key} histogram\n`;
      output += `${key}_count ${values.length}\n`;
      output += `${key}_sum ${stats.sum}\n`;
      output += `${key}_bucket{le="0.1"} ${values.filter((v) => v <= 0.1).length}\n`;
      output += `${key}_bucket{le="1"} ${values.filter((v) => v <= 1).length}\n`;
      output += `${key}_bucket{le="10"} ${values.filter((v) => v <= 10).length}\n`;
      output += `${key}_bucket{le="100"} ${values.filter((v) => v <= 100).length}\n`;
      output += `${key}_bucket{le="+Inf"} ${values.length}\n`;
    });

    return output;
  }

  /**
   * Get overall metrics summary
   */
  getMetricsSummary() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          this.calculateStats(values),
        ])
      ),
      timestamp: new Date(),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.metrics.clear();
    console.log('[Metrics] All metrics reset');
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    // Calculate based on error rates and latencies
    const alertErrors = this.getCounter('alert_processing_errors');
    const alertProcessed = this.getCounter('alerts_processed');
    const errorRate = alertProcessed > 0 ? (alertErrors / alertProcessed) * 100 : 0;

    const latencyStats = this.getHistogramStats('alert_processing_latency_ms');
    let latencyScore = 100;

    if (latencyStats && latencyStats.p95 > 1000) {
      latencyScore = 50;
    } else if (latencyStats && latencyStats.p95 > 500) {
      latencyScore = 75;
    }

    const errorScore = Math.max(0, 100 - errorRate * 10);
    const overallScore = (latencyScore + errorScore) / 2;

    return Math.round(overallScore);
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();

    this.metrics.forEach((values, key) => {
      const recent = values.filter((v) => now - v.timestamp.getTime() < this.metricsRetention);

      if (recent.length === 0) {
        this.metrics.delete(key);
      } else if (recent.length < values.length) {
        this.metrics.set(key, recent);
      }
    });
  }

  private getMetricsKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  private logMetric(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricsKey(name, labels);
    const timestamp = new Date();

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push({
      value,
      timestamp,
      labels,
    });

    // Cleanup periodically
    if (Math.random() < 0.01) {
      // 1% of the time
      this.cleanupOldMetrics();
    }
  }

  private calculateStats(values: number[]) {
    if (values.length === 0) {
      return { sum: 0, mean: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      sum,
      mean: sum / values.length,
      count: values.length,
    };
  }
}

// Singleton instance
export const metricsCollector = new AlertMetricsCollector();

/**
 * Alert-specific metrics helpers
 */
export const AlertMetrics = {
  /**
   * Record alert processed
   */
  recordAlertProcessed(latencyMs: number, frameworkId?: string): void {
    metricsCollector.recordCounter('alerts_processed');
    metricsCollector.recordHistogram('alert_processing_latency_ms', latencyMs, {
      framework_id: frameworkId || 'unknown',
    });
  },

  /**
   * Record alert error
   */
  recordAlertError(frameworkId?: string): void {
    metricsCollector.recordCounter('alert_processing_errors');
  },

  /**
   * Record notification sent
   */
  recordNotificationSent(channel: string): void {
    metricsCollector.recordCounter('notifications_sent', 1, { channel });
  },

  /**
   * Record WebSocket connections
   */
  recordWebSocketConnections(count: number): void {
    metricsCollector.recordGauge('websocket_connections_active', count);
  },

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    metricsCollector.recordCounter('cache_hits');
  },

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    metricsCollector.recordCounter('cache_misses');
  },

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const hits = metricsCollector.getCounter('cache_hits');
    const misses = metricsCollector.getCounter('cache_misses');
    const total = hits + misses;

    return total > 0 ? (hits / total) * 100 : 0;
  },

  /**
   * Get alert processing latency stats
   */
  getAlertLatencyStats() {
    return metricsCollector.getHistogramStats('alert_processing_latency_ms');
  },

  /**
   * Get health score
   */
  getHealthScore(): number {
    return metricsCollector.getHealthScore();
  },

  /**
   * Export metrics
   */
  exportPrometheus(): string {
    return metricsCollector.exportPrometheusMetrics();
  },

  /**
   * Get summary
   */
  getSummary() {
    return metricsCollector.getMetricsSummary();
  },
};

export default AlertMetrics;
