/**
 * M1 Advanced Monitoring & Observability
 *
 * Comprehensive monitoring system with metrics collection, aggregation,
 * alerting, and predictive analysis
 *
 * Version: v3.0.0
 * Phase: 17B - Advanced Monitoring
 */

export type MetricType = 'gauge' | 'counter' | 'histogram' | 'summary';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AggregationInterval = '1m' | '5m' | '15m' | '1h' | '1d';

/**
 * Metric data point
 */
export interface MetricDataPoint {
  name: string;
  value: number;
  type: MetricType;
  timestamp: number;
  labels: Record<string, string>;
  unit?: string;
}

/**
 * Metric aggregate
 */
export interface MetricAggregate {
  name: string;
  interval: AggregationInterval;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  timestamp: number;
}

/**
 * Alert rule
 */
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string; // e.g., "> 0.8" or "< 100"
  threshold: number;
  duration: number; // milliseconds
  severity: AlertSeverity;
  enabled: boolean;
  annotations: Record<string, string>;
  createdAt: number;
}

/**
 * Alert event
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  metric: string;
  value: number;
  severity: AlertSeverity;
  firedAt: number;
  resolvedAt?: number;
  resolved: boolean;
  message: string;
}

/**
 * Performance profile
 */
export interface PerformanceProfile {
  serviceId: string;
  timestamp: number;
  metrics: {
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
    p95Latency: number;
    p99Latency: number;
    cpuUsage: number;
    memoryUsage: number;
    diskIORead: number;
    diskIOWrite: number;
    networkIn: number;
    networkOut: number;
  };
}

/**
 * Trend analysis
 */
export interface TrendAnalysis {
  metricName: string;
  period: AggregationInterval;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  direction: number; // -1 (down), 0 (stable), 1 (up)
  volatility: number; // 0-1
  prediction: {
    value: number;
    confidence: number;
  };
}

/**
 * Advanced Monitoring Manager
 */
export class AdvancedMonitoringManager {
  private metrics: MetricDataPoint[] = [];
  private aggregates: Map<string, MetricAggregate[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, AlertEvent> = new Map();
  private performanceProfiles: Map<string, PerformanceProfile[]> = new Map();
  private trendAnalyses: Map<string, TrendAnalysis> = new Map();
  private ruleEvaluationIntervals: Map<string, NodeJS.Timer> = new Map();

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    type: MetricType = 'gauge',
    labels: Record<string, string> = {},
    unit?: string
  ): void {
    const point: MetricDataPoint = {
      name,
      value,
      type,
      timestamp: Date.now(),
      labels,
      unit,
    };

    this.metrics.push(point);

    // Keep only last 10000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics.shift();
    }
  }

  /**
   * Aggregate metrics
   */
  aggregateMetrics(
    metricName: string,
    interval: AggregationInterval = '1m'
  ): MetricAggregate | null {
    const now = Date.now();
    const intervalMs = this.getIntervalMs(interval);
    const cutoff = now - intervalMs;

    const relevantMetrics = this.metrics.filter(
      (m) => m.name === metricName && m.timestamp >= cutoff && m.type === 'gauge'
    );

    if (relevantMetrics.length === 0) {
      return null;
    }

    const values = relevantMetrics.map((m) => m.value).sort((a, b) => a - b);

    const aggregate: MetricAggregate = {
      name: metricName,
      interval,
      count: values.length,
      sum: values.reduce((sum, v) => sum + v, 0),
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
      timestamp: now,
    };

    // Store aggregate
    const key = `${metricName}_${interval}`;
    const aggregates = this.aggregates.get(key) || [];
    aggregates.push(aggregate);

    // Keep only last 100 aggregates per metric
    if (aggregates.length > 100) {
      aggregates.shift();
    }

    this.aggregates.set(key, aggregates);

    return aggregate;
  }

  /**
   * Create alert rule
   */
  createAlertRule(
    name: string,
    metric: string,
    condition: string,
    threshold: number,
    duration: number,
    severity: AlertSeverity = 'warning',
    annotations: Record<string, string> = {}
  ): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const rule: AlertRule = {
      id,
      name,
      metric,
      condition,
      threshold,
      duration,
      severity,
      enabled: true,
      annotations,
      createdAt: Date.now(),
    };

    this.alertRules.set(id, rule);

    // Start evaluating this rule
    this.evaluateRuleOnInterval(id);

    return id;
  }

  /**
   * Get alert rule
   */
  getAlertRule(ruleId: string): AlertRule | null {
    return this.alertRules.get(ruleId) || null;
  }

  /**
   * Evaluate alert rule
   */
  evaluateRule(ruleId: string): AlertEvent | null {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) {
return null;
}

    // Get recent metrics for the rule's metric
    const now = Date.now();
    const relevantMetrics = this.metrics.filter(
      (m) => m.name === rule.metric && now - m.timestamp < rule.duration
    );

    if (relevantMetrics.length === 0) {
return null;
}

    // Check condition
    const latestValue = relevantMetrics[relevantMetrics.length - 1].value;
    let conditionMet = false;

    try {
      const func = new Function('value', `return value ${rule.condition}`);
      conditionMet = func(latestValue) as boolean;
    } catch {
      return null;
    }

    if (!conditionMet) {
return null;
}

    // Create alert event
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const alert: AlertEvent = {
      id: alertId,
      ruleId,
      metric: rule.metric,
      value: latestValue,
      severity: rule.severity,
      firedAt: now,
      resolved: false,
      message: `${rule.name}: ${rule.metric} ${rule.condition} (current: ${latestValue})`,
    };

    this.alerts.set(alertId, alert);

    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
return false;
}

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    return true;
  }

  /**
   * Record performance profile
   */
  recordPerformanceProfile(
    serviceId: string,
    metrics: PerformanceProfile['metrics']
  ): void {
    const profile: PerformanceProfile = {
      serviceId,
      timestamp: Date.now(),
      metrics,
    };

    const profiles = this.performanceProfiles.get(serviceId) || [];
    profiles.push(profile);

    // Keep only last 1000 profiles per service
    if (profiles.length > 1000) {
      profiles.shift();
    }

    this.performanceProfiles.set(serviceId, profiles);
  }

  /**
   * Analyze trends
   */
  analyzeTrend(
    metricName: string,
    interval: AggregationInterval = '1h'
  ): TrendAnalysis | null {
    const aggregateKey = `${metricName}_${interval}`;
    const aggregates = this.aggregates.get(aggregateKey) || [];

    if (aggregates.length < 2) {
      return null;
    }

    // Get last 10 aggregates
    const recent = aggregates.slice(-10);
    const values = recent.map((a) => a.avg);

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let direction = 0;

    const firstAvg = values[0];
    const lastAvg = values[values.length - 1];
    const percentChange = ((lastAvg - firstAvg) / Math.abs(firstAvg || 1)) * 100;

    if (percentChange > 5) {
      trend = 'up';
      direction = 1;
    } else if (percentChange < -5) {
      trend = 'down';
      direction = -1;
    }

    // Calculate volatility (standard deviation)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance) / mean;

    // Simple linear regression for prediction
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const nextValue = values[values.length - 1] + slope;
    const confidence = Math.min(1, Math.max(0, 1 - volatility));

    const analysis: TrendAnalysis = {
      metricName,
      period: interval,
      trend,
      percentChange,
      direction,
      volatility: Math.min(1, volatility),
      prediction: {
        value: Math.max(0, nextValue),
        confidence,
      },
    };

    this.trendAnalyses.set(`${metricName}_${interval}`, analysis);

    return analysis;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filters?: { severity?: AlertSeverity; metric?: string }): AlertEvent[] {
    let results = Array.from(this.alerts.values()).filter((a) => !a.resolved);

    if (filters?.severity) {
      results = results.filter((a) => a.severity === filters.severity);
    }

    if (filters?.metric) {
      results = results.filter((a) => a.metric === filters.metric);
    }

    return results;
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): Record<string, unknown> {
    const alerts = Array.from(this.alerts.values());
    const rules = Array.from(this.alertRules.values());

    const activeAlerts = alerts.filter((a) => !a.resolved);
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

    return {
      totalMetrics: this.metrics.length,
      uniqueMetricNames: new Set(this.metrics.map((m) => m.name)).size,
      totalAlertRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled).length,
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      resolvedAlerts: alerts.filter((a) => a.resolved).length,
      performanceProfiles: Array.from(this.performanceProfiles.values()).reduce(
        (sum, profiles) => sum + profiles.length,
        0
      ),
      trendAnalyses: this.trendAnalyses.size,
    };
  }

  /**
   * Evaluate rule on interval
   */
  private evaluateRuleOnInterval(ruleId: string): void {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
return;
}

    const interval = setInterval(() => {
      if (!rule.enabled) {
        clearInterval(interval);
        this.ruleEvaluationIntervals.delete(ruleId);
        return;
      }

      this.evaluateRule(ruleId);
    }, 10000); // Evaluate every 10 seconds

    this.ruleEvaluationIntervals.set(ruleId, interval);
  }

  /**
   * Get interval in milliseconds
   */
  private getIntervalMs(interval: AggregationInterval): number {
    const intervals: Record<AggregationInterval, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    return intervals[interval] || 60000;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    for (const interval of this.ruleEvaluationIntervals.values()) {
      clearInterval(interval);
    }
    this.ruleEvaluationIntervals.clear();
  }
}

// Export singleton
export const advancedMonitoringManager = new AdvancedMonitoringManager();
