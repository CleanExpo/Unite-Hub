/**
 * M1 Advanced Analytics API
 *
 * Provides advanced query interface for M1 metrics with support for:
 * - Time-range aggregations
 * - Percentile calculations
 * - Drill-down analysis
 * - Trend detection
 * - Anomaly detection
 *
 * Version: v2.3.0
 * Phase: 10 - Enhanced Analytics Engine
 */

/**
 * Query filter operator
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';

/**
 * Aggregation function
 */
export type AggregationFunction =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'p50'
  | 'p95'
  | 'p99'
  | 'stddev'
  | 'rate';

/**
 * Query filter
 */
export interface QueryFilter {
  field: string;
  op: FilterOperator;
  value: unknown;
}

/**
 * Analytics query
 */
export interface AnalyticsQuery {
  metric: string; // e.g., 'policy_decisions', 'tool_executions', 'cache_performance'
  timeRange: string; // e.g., '1h', '24h', '7d'
  groupBy?: string[]; // e.g., ['toolName', 'scope']
  filters?: QueryFilter[];
  aggregations: AggregationFunction[];
  limit?: number;
  offset?: number;
}

/**
 * Query result
 */
export interface QueryResult {
  query: AnalyticsQuery;
  timestamp: number;
  rowCount: number;
  rows: Array<Record<string, unknown>>;
  aggregations: Record<string, unknown>;
  executionTime: number;
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

/**
 * Advanced analytics engine
 */
export class AnalyticsEngine {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private retentionHours: number = 24; // Keep 24 hours of data

  /**
   * Record metric data point
   */
  recordMetric(metric: string, value: number, tags?: Record<string, string>): void {
    const key = tags ? `${metric}:${JSON.stringify(tags)}` : metric;
    const points = this.metrics.get(key) || [];
    points.push({
      timestamp: Date.now(),
      value,
      tags,
    });

    // Prune old data
    const cutoff = Date.now() - this.retentionHours * 60 * 60 * 1000;
    const pruned = points.filter(p => p.timestamp > cutoff);
    this.metrics.set(key, pruned);
  }

  /**
   * Execute analytics query
   */
  async executeQuery(query: AnalyticsQuery): Promise<QueryResult> {
    const startTime = Date.now();

    // Parse time range
    const timeRange = this.parseTimeRange(query.timeRange);
    const cutoff = Date.now() - timeRange;

    // Collect matching metrics
    let dataPoints: MetricDataPoint[] = [];
    for (const [key, points] of this.metrics.entries()) {
      if (key.startsWith(query.metric)) {
        dataPoints = dataPoints.concat(
          points.filter(p => p.timestamp >= cutoff)
        );
      }
    }

    // Apply filters
    if (query.filters) {
      dataPoints = this.applyFilters(dataPoints, query.filters);
    }

    // Group data
    let rows: Array<Record<string, unknown>> = [];
    if (query.groupBy && query.groupBy.length > 0) {
      const grouped = this.groupData(dataPoints, query.groupBy);
      rows = Array.from(grouped.entries()).map(([key, group]) => {
        const [groupKey, groupData] = [key, group];
        const result: Record<string, unknown> = { group: groupKey };

        // Calculate aggregations
        for (const agg of query.aggregations) {
          result[agg] = this.calculateAggregation(agg, groupData.map(p => p.value));
        }

        return result;
      });
    } else {
      // No grouping
      const result: Record<string, unknown> = {};
      for (const agg of query.aggregations) {
        result[agg] = this.calculateAggregation(agg, dataPoints.map(p => p.value));
      }
      rows = [result];
    }

    // Apply limit and offset
    if (query.offset) {
      rows = rows.slice(query.offset);
    }
    if (query.limit) {
      rows = rows.slice(0, query.limit);
    }

    // Calculate overall aggregations
    const aggregations: Record<string, unknown> = {};
    for (const agg of query.aggregations) {
      aggregations[agg] = this.calculateAggregation(agg, dataPoints.map(p => p.value));
    }

    const executionTime = Date.now() - startTime;

    return {
      query,
      timestamp: Date.now(),
      rowCount: rows.length,
      rows,
      aggregations,
      executionTime,
    };
  }

  /**
   * Parse time range string to milliseconds
   */
  private parseTimeRange(range: string): number {
    const match = range.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time range: ${range}`);
    }

    const [, num, unit] = match;
    const value = parseInt(num, 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /**
   * Apply filters to data points
   */
  private applyFilters(
    dataPoints: MetricDataPoint[],
    filters: QueryFilter[]
  ): MetricDataPoint[] {
    return dataPoints.filter(point => {
      for (const filter of filters) {
        const value = this.getFieldValue(point, filter.field);
        if (!this.evaluateFilter(value, filter.op, filter.value)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get field value from data point
   */
  private getFieldValue(point: MetricDataPoint, field: string): unknown {
    if (field === 'value') {
      return point.value;
    }
    if (field === 'timestamp') {
      return point.timestamp;
    }
    if (point.tags && field in point.tags) {
      return point.tags[field];
    }
    return undefined;
  }

  /**
   * Evaluate filter condition
   */
  private evaluateFilter(value: unknown, op: FilterOperator, expected: unknown): boolean {
    switch (op) {
      case 'eq':
        return value === expected;
      case 'ne':
        return value !== expected;
      case 'gt':
        return Number(value) > Number(expected);
      case 'lt':
        return Number(value) < Number(expected);
      case 'gte':
        return Number(value) >= Number(expected);
      case 'lte':
        return Number(value) <= Number(expected);
      case 'in':
        return Array.isArray(expected) && expected.includes(value);
      case 'contains':
        return String(value).includes(String(expected));
      default:
        return false;
    }
  }

  /**
   * Group data points by fields
   */
  private groupData(
    dataPoints: MetricDataPoint[],
    groupBy: string[]
  ): Map<string, MetricDataPoint[]> {
    const grouped = new Map<string, MetricDataPoint[]>();

    for (const point of dataPoints) {
      const keyParts: string[] = [];
      for (const field of groupBy) {
        const value = this.getFieldValue(point, field);
        keyParts.push(String(value));
      }
      const key = keyParts.join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(point);
    }

    return grouped;
  }

  /**
   * Calculate aggregation function
   */
  private calculateAggregation(func: AggregationFunction, values: number[]): unknown {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);

    switch (func) {
      case 'count':
        return values.length;

      case 'sum':
        return values.reduce((a, b) => a + b, 0);

      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;

      case 'min':
        return Math.min(...values);

      case 'max':
        return Math.max(...values);

      case 'p50':
        return this.percentile(sorted, 50);

      case 'p95':
        return this.percentile(sorted, 95);

      case 'p99':
        return this.percentile(sorted, 99);

      case 'stddev': {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(v => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
      }

      case 'rate':
        return values.length; // Simplistic rate (count per period)

      default:
        return 0;
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Detect anomalies using moving average
   */
  detectAnomalies(metric: string, window: number = 10, threshold: number = 2.0): MetricDataPoint[] {
    const points = Array.from(this.metrics.values())
      .flat()
      .filter(p => {
        const key = `${metric}:${JSON.stringify(p.tags || {})}`;
        return key.startsWith(metric);
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (points.length < window) {
      return [];
    }

    const anomalies: MetricDataPoint[] = [];

    for (let i = window; i < points.length; i++) {
      const windowValues = points.slice(i - window, i).map(p => p.value);
      const mean = windowValues.reduce((a, b) => a + b, 0) / window;
      const squareDiffs = windowValues.map(v => Math.pow(v - mean, 2));
      const variance = squareDiffs.reduce((a, b) => a + b, 0) / window;
      const stddev = Math.sqrt(variance);

      const zScore = Math.abs((points[i].value - mean) / stddev);
      if (zScore > threshold) {
        anomalies.push(points[i]);
      }
    }

    return anomalies;
  }

  /**
   * Get trend analysis
   */
  getTrend(metric: string, period: string): { trend: 'up' | 'down' | 'stable'; change: number } {
    const timeRange = this.parseTimeRange(period);
    const cutoff = Date.now() - timeRange;

    const points = Array.from(this.metrics.values())
      .flat()
      .filter(
        p =>
          p.timestamp >= cutoff &&
          Array.from(this.metrics.keys()).some(k => k.startsWith(metric))
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    if (points.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const midpoint = Math.floor(points.length / 2);
    const firstHalf = points.slice(0, midpoint);
    const secondHalf = points.slice(midpoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

    return { trend, change };
  }

  /**
   * Clear old data
   */
  pruneOldData(): number {
    const cutoff = Date.now() - this.retentionHours * 60 * 60 * 1000;
    let prunedCount = 0;

    for (const [key, points] of this.metrics.entries()) {
      const filtered = points.filter(p => p.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else if (filtered.length < points.length) {
        this.metrics.set(key, filtered);
        prunedCount += points.length - filtered.length;
      }
    }

    return prunedCount;
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    metricCount: number;
    dataPointCount: number;
    memoryUsage: number;
  } {
    let dataPointCount = 0;
    for (const points of this.metrics.values()) {
      dataPointCount += points.length;
    }

    // Rough memory estimate (each point ~100 bytes)
    const memoryUsage = dataPointCount * 100;

    return {
      metricCount: this.metrics.size,
      dataPointCount,
      memoryUsage,
    };
  }
}

// Export singleton
export const analyticsEngine = new AnalyticsEngine();
