/**
 * Datadog Historical Trending
 * Analyzes metric trends, baselines, and anomalies
 */

import { DatadogClient } from './datadog-client';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'DatadogTrending' });

interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  change_percent: number;
  current_value: number;
  baseline_value: number;
  forecast: number;
  confidence: 'high' | 'medium' | 'low';
}

interface BaselineResult {
  metric: string;
  average: number;
  min: number;
  max: number;
  stddev: number;
  samples: number;
}

interface AnomalyResult {
  is_anomaly: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  z_score: number;
  current_value: number;
  expected_range: [number, number];
}

interface TrendReport {
  metric: string;
  period_days: number;
  trend: TrendResult;
  baseline: BaselineResult;
  anomaly: AnomalyResult;
  timestamp: string;
}

export class DatadogTrending {
  private datadogClient: DatadogClient;

  constructor(datadogClient: DatadogClient) {
    this.datadogClient = datadogClient;
  }

  /**
   * Calculate trend direction for a metric
   */
  async calculateTrend(metric: string, days: number = 7): Promise<TrendResult> {
    try {
      // Get historical data
      const history = await this.datadogClient.getMetricHistory(metric, days * 24);

      if (!history || !history.series || history.series.length === 0) {
        logger.warn('No historical data for metric', { metric });
        return this.getDefaultTrend(0, 0);
      }

      const series = history.series[0];
      const points = series.points;

      if (points.length < 2) {
        return this.getDefaultTrend(points[0]?.[1] || 0, points[0]?.[1] || 0);
      }

      // Calculate baseline (first half of data)
      const midpoint = Math.floor(points.length / 2);
      const baselinePoints = points.slice(0, midpoint);
      const recentPoints = points.slice(midpoint);

      const baselineAvg = this.average(baselinePoints.map((p) => p[1]));
      const recentAvg = this.average(recentPoints.map((p) => p[1]));
      const currentValue = points[points.length - 1][1];

      // Calculate change percentage
      const changePercent =
        baselineAvg > 0 ? ((recentAvg - baselineAvg) / baselineAvg) * 100 : 0;

      // Determine direction
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(changePercent) > 5) {
        direction = changePercent > 0 ? 'up' : 'down';
      }

      // Simple linear forecast (next value)
      const forecast = this.forecastNext(points.map((p) => p[1]));

      // Confidence based on data variance
      const confidence = this.calculateConfidence(points.map((p) => p[1]));

      logger.debug('Trend calculated', {
        metric,
        direction,
        changePercent: changePercent.toFixed(2),
      });

      return {
        direction,
        change_percent: changePercent,
        current_value: currentValue,
        baseline_value: baselineAvg,
        forecast,
        confidence,
      };
    } catch (error) {
      logger.error('Failed to calculate trend', { metric, error });
      return this.getDefaultTrend(0, 0);
    }
  }

  /**
   * Get metric baseline (average over period)
   */
  async getMetricBaseline(metric: string, days: number = 7): Promise<BaselineResult> {
    try {
      const history = await this.datadogClient.getMetricHistory(metric, days * 24);

      if (!history || !history.series || history.series.length === 0) {
        return {
          metric,
          average: 0,
          min: 0,
          max: 0,
          stddev: 0,
          samples: 0,
        };
      }

      const points = history.series[0].points.map((p) => p[1]);

      return {
        metric,
        average: this.average(points),
        min: Math.min(...points),
        max: Math.max(...points),
        stddev: this.standardDeviation(points),
        samples: points.length,
      };
    } catch (error) {
      logger.error('Failed to get metric baseline', { metric, error });
      return {
        metric,
        average: 0,
        min: 0,
        max: 0,
        stddev: 0,
        samples: 0,
      };
    }
  }

  /**
   * Detect anomaly in current value
   */
  async detectAnomaly(
    metric: string,
    currentValue: number,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AnomalyResult> {
    try {
      const baseline = await this.getMetricBaseline(metric, 7);

      if (baseline.samples === 0) {
        return {
          is_anomaly: false,
          severity: 'none',
          z_score: 0,
          current_value: currentValue,
          expected_range: [0, 0],
        };
      }

      // Calculate z-score
      const zScore =
        baseline.stddev > 0
          ? (currentValue - baseline.average) / baseline.stddev
          : 0;

      // Sensitivity thresholds
      const thresholds = {
        low: 3.0, // 99.7% confidence
        medium: 2.5, // ~98.8% confidence
        high: 2.0, // ~95.4% confidence
      };

      const threshold = thresholds[sensitivity];
      const isAnomaly = Math.abs(zScore) > threshold;

      // Severity based on z-score magnitude
      let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
      if (isAnomaly) {
        const absZ = Math.abs(zScore);
        if (absZ > 4.0) severity = 'high';
        else if (absZ > 3.0) severity = 'medium';
        else severity = 'low';
      }

      // Expected range (±2 standard deviations)
      const expectedRange: [number, number] = [
        baseline.average - 2 * baseline.stddev,
        baseline.average + 2 * baseline.stddev,
      ];

      logger.debug('Anomaly detection result', {
        metric,
        isAnomaly,
        severity,
        zScore: zScore.toFixed(2),
      });

      return {
        is_anomaly: isAnomaly,
        severity,
        z_score: zScore,
        current_value: currentValue,
        expected_range: expectedRange,
      };
    } catch (error) {
      logger.error('Failed to detect anomaly', { metric, error });
      return {
        is_anomaly: false,
        severity: 'none',
        z_score: 0,
        current_value: currentValue,
        expected_range: [0, 0],
      };
    }
  }

  /**
   * Forecast metric value (simple linear regression)
   */
  async forecastMetric(metric: string, days: number = 7): Promise<number> {
    try {
      const history = await this.datadogClient.getMetricHistory(metric, days * 24);

      if (!history || !history.series || history.series.length === 0) {
        return 0;
      }

      const values = history.series[0].points.map((p) => p[1]);
      return this.forecastNext(values);
    } catch (error) {
      logger.error('Failed to forecast metric', { metric, error });
      return 0;
    }
  }

  /**
   * Generate comprehensive trend report for multiple metrics
   */
  async generateTrendReport(metrics: string[], days: number = 7): Promise<TrendReport[]> {
    const reports: TrendReport[] = [];

    for (const metric of metrics) {
      try {
        const trend = await this.calculateTrend(metric, days);
        const baseline = await this.getMetricBaseline(metric, days);
        const anomaly = await this.detectAnomaly(metric, trend.current_value);

        reports.push({
          metric,
          period_days: days,
          trend,
          baseline,
          anomaly,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to generate trend report for metric', { metric, error });
      }
    }

    logger.info('Trend report generated', {
      metrics: metrics.length,
      reports: reports.length,
    });

    return reports;
  }

  /**
   * Get health metrics trend report
   */
  async getHealthTrendReport(days: number = 7): Promise<TrendReport[]> {
    const healthMetrics = [
      'health.overall.status',
      'health.check.latency_ms',
      'health.routes.success_rate',
      'health.dependency.database.status',
      'health.dependency.cache.status',
      'cache.hit_rate',
      'verification.success_rate',
    ];

    return this.generateTrendReport(healthMetrics, days);
  }

  /**
   * Calculate average of array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = this.average(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Simple linear forecast for next value
   */
  private forecastNext(values: number[]): number {
    if (values.length < 2) return values[0] || 0;

    // Simple moving average of last 3 values + trend
    const recent = values.slice(-3);
    const avg = this.average(recent);

    // Calculate trend from last 5 points
    const trendPoints = values.slice(-5);
    const firstHalf = trendPoints.slice(0, Math.floor(trendPoints.length / 2));
    const secondHalf = trendPoints.slice(Math.floor(trendPoints.length / 2));

    const trend = this.average(secondHalf) - this.average(firstHalf);

    return avg + trend;
  }

  /**
   * Calculate confidence level based on variance
   */
  private calculateConfidence(values: number[]): 'high' | 'medium' | 'low' {
    if (values.length < 10) return 'low';

    const stddev = this.standardDeviation(values);
    const avg = this.average(values);
    const coefficientOfVariation = avg !== 0 ? (stddev / Math.abs(avg)) * 100 : 0;

    if (coefficientOfVariation < 10) return 'high';
    if (coefficientOfVariation < 25) return 'medium';
    return 'low';
  }

  /**
   * Get default trend when no data available
   */
  private getDefaultTrend(current: number, baseline: number): TrendResult {
    return {
      direction: 'stable',
      change_percent: 0,
      current_value: current,
      baseline_value: baseline,
      forecast: current,
      confidence: 'low',
    };
  }
}

export default DatadogTrending;
