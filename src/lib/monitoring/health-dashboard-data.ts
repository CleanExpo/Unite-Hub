/**
 * Health Dashboard Data Export
 * Provides monitoring-ready data for APM tools (Datadog, New Relic, Prometheus)
 */

import { metricsCollector } from './alert-metrics';

export interface HealthSnapshot {
  timestamp: string;
  overall_health_score: number;
  dependency_status: {
    database: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    cache: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    ai_services: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    external_apis: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  };
  metrics: {
    alerts_processed: number;
    alert_errors: number;
    cache_hit_rate: number;
    websocket_connections: number;
    alert_latency_p95: number;
  };
}

export interface PrometheusMetric {
  metric_name: string;
  metric_type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

export interface HealthTrend {
  period: '1h' | '24h' | '7d';
  average_health_score: number;
  max_health_score: number;
  min_health_score: number;
  data_points: number;
  trend_direction: 'improving' | 'stable' | 'degrading';
}

class HealthDashboardData {
  private healthHistory: HealthSnapshot[] = [];
  private maxHistorySize = 1008; // 7 days at 10-minute intervals

  /**
   * Record current health snapshot
   */
  recordHealthSnapshot(snapshot: HealthSnapshot): void {
    this.healthHistory.push(snapshot);

    // Keep only recent history
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get current health snapshot
   */
  async getCurrentHealth(): Promise<HealthSnapshot> {
    const metrics = metricsCollector.getMetricsSummary();
    const healthScore = metricsCollector.getHealthScore();

    // Get alert latency stats
    const latencyStats = metricsCollector.getHistogramStats('alert_processing_latency_ms');
    const alertLatencyP95 = latencyStats?.p95 || 0;

    // Calculate cache hit rate
    const cacheHits = metricsCollector.getCounter('cache_hits');
    const cacheMisses = metricsCollector.getCounter('cache_misses');
    const cacheTotal = cacheHits + cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      overall_health_score: healthScore,
      dependency_status: {
        database: 'unknown',
        cache: 'unknown',
        ai_services: 'unknown',
        external_apis: 'unknown',
      },
      metrics: {
        alerts_processed: metricsCollector.getCounter('alerts_processed'),
        alert_errors: metricsCollector.getCounter('alert_processing_errors'),
        cache_hit_rate: cacheHitRate,
        websocket_connections: metricsCollector.getGauge('websocket_connections_active'),
        alert_latency_p95: alertLatencyP95,
      },
    };
  }

  /**
   * Export all metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    return metricsCollector.exportPrometheusMetrics();
  }

  /**
   * Export metrics as structured data for APM tools
   */
  exportStructuredMetrics(): PrometheusMetric[] {
    const metrics: PrometheusMetric[] = [];
    const summary = metricsCollector.getMetricsSummary();
    const timestamp = Date.now();

    // Export counters
    Object.entries(summary.counters).forEach(([key, value]) => {
      metrics.push({
        metric_name: key,
        metric_type: 'counter',
        value: value as number,
        timestamp,
      });
    });

    // Export gauges
    Object.entries(summary.gauges).forEach(([key, value]) => {
      metrics.push({
        metric_name: key,
        metric_type: 'gauge',
        value: value as number,
        timestamp,
      });
    });

    // Export histogram percentiles
    Object.entries(summary.histograms).forEach(([key, stats]) => {
      const histStats = stats as { count: number; sum: number; mean: number };
      metrics.push(
        {
          metric_name: `${key}_count`,
          metric_type: 'histogram',
          value: histStats.count,
          timestamp,
        },
        {
          metric_name: `${key}_sum`,
          metric_type: 'histogram',
          value: histStats.sum,
          timestamp,
        },
        {
          metric_name: `${key}_mean`,
          metric_type: 'histogram',
          value: histStats.mean,
          timestamp,
        }
      );
    });

    return metrics;
  }

  /**
   * Calculate health trend over a time period
   */
  getHealthTrend(period: '1h' | '24h' | '7d'): HealthTrend {
    const now = Date.now();
    let cutoffTime: number;

    switch (period) {
      case '1h':
        cutoffTime = now - 60 * 60 * 1000;
        break;
      case '24h':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    const relevantSnapshots = this.healthHistory.filter(
      (s) => new Date(s.timestamp).getTime() > cutoffTime
    );

    if (relevantSnapshots.length === 0) {
      return {
        period,
        average_health_score: 0,
        max_health_score: 0,
        min_health_score: 0,
        data_points: 0,
        trend_direction: 'stable',
      };
    }

    const scores = relevantSnapshots.map((s) => s.overall_health_score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Calculate trend direction (compare first half to second half)
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trendDirection: 'improving' | 'stable' | 'degrading';
    if (secondAvg > firstAvg + 5) {
      trendDirection = 'improving';
    } else if (secondAvg < firstAvg - 5) {
      trendDirection = 'degrading';
    } else {
      trendDirection = 'stable';
    }

    return {
      period,
      average_health_score: Math.round(avgScore),
      max_health_score: maxScore,
      min_health_score: minScore,
      data_points: relevantSnapshots.length,
      trend_direction: trendDirection,
    };
  }

  /**
   * Export time-series data for charting
   */
  exportTimeSeries(period: '1h' | '24h' | '7d'): Array<{ timestamp: string; health_score: number }> {
    const now = Date.now();
    let cutoffTime: number;

    switch (period) {
      case '1h':
        cutoffTime = now - 60 * 60 * 1000;
        break;
      case '24h':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    return this.healthHistory
      .filter((s) => new Date(s.timestamp).getTime() > cutoffTime)
      .map((s) => ({
        timestamp: s.timestamp,
        health_score: s.overall_health_score,
      }));
  }

  /**
   * Get Datadog-compatible metrics
   */
  exportDatadogMetrics(): Array<{
    metric: string;
    points: Array<[number, number]>;
    type: string;
    tags?: string[];
  }> {
    const summary = metricsCollector.getMetricsSummary();
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const datadogMetrics: Array<{
      metric: string;
      points: Array<[number, number]>;
      type: string;
      tags?: string[];
    }> = [];

    // Export counters
    Object.entries(summary.counters).forEach(([key, value]) => {
      datadogMetrics.push({
        metric: `unite_hub.${key}`,
        points: [[timestamp, value as number]],
        type: 'count',
      });
    });

    // Export gauges
    Object.entries(summary.gauges).forEach(([key, value]) => {
      datadogMetrics.push({
        metric: `unite_hub.${key}`,
        points: [[timestamp, value as number]],
        type: 'gauge',
      });
    });

    // Export health score
    const healthScore = metricsCollector.getHealthScore();
    datadogMetrics.push({
      metric: 'unite_hub.health_score',
      points: [[timestamp, healthScore]],
      type: 'gauge',
    });

    return datadogMetrics;
  }

  /**
   * Get New Relic-compatible events
   */
  exportNewRelicEvents(): Array<{
    eventType: string;
    timestamp: number;
    [key: string]: string | number;
  }> {
    const summary = metricsCollector.getMetricsSummary();
    const timestamp = Date.now();
    const healthScore = metricsCollector.getHealthScore();

    return [
      {
        eventType: 'UniteHubHealthCheck',
        timestamp,
        health_score: healthScore,
        alerts_processed: summary.counters['alerts_processed'] || 0,
        alert_errors: summary.counters['alert_processing_errors'] || 0,
        cache_hits: summary.counters['cache_hits'] || 0,
        cache_misses: summary.counters['cache_misses'] || 0,
        websocket_connections: summary.gauges['websocket_connections_active'] || 0,
      },
    ];
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.healthHistory = [];
  }
}

// Singleton instance
export const healthDashboard = new HealthDashboardData();

// Start periodic snapshot recording (every 10 minutes)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(async () => {
    const snapshot = await healthDashboard.getCurrentHealth();
    healthDashboard.recordHealthSnapshot(snapshot);
  }, 10 * 60 * 1000); // 10 minutes
}

export default healthDashboard;
