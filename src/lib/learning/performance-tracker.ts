/**
 * Performance Tracker
 *
 * Tracks and optimizes system performance metrics across agents, services, and operations.
 * Provides insights for performance improvements and automatic optimization recommendations.
 *
 * Features:
 * - Real-time performance metrics collection
 * - Automatic baseline calculation
 * - Performance degradation detection
 * - Optimization recommendations
 * - Historical trend analysis
 *
 * Usage:
 *   import { performanceTracker } from '@/lib/learning/performance-tracker';
 *
 *   // Track operation
 *   const metric = performanceTracker.trackOperation('database_query', async () => {
 *     return await supabase.from('contacts').select('*');
 *   });
 *
 *   // Get performance report
 *   const report = await performanceTracker.getPerformanceReport('workspace-123');
 *
 *   // Get optimization recommendations
 *   const recommendations = await performanceTracker.getOptimizationRecommendations();
 */

import { apm } from '@/lib/monitoring/apm';
import { executionFeedback } from './execution-feedback';

export type MetricType =
  | 'latency'
  | 'throughput'
  | 'error_rate'
  | 'memory_usage'
  | 'cpu_usage'
  | 'cache_hit_rate'
  | 'db_connections'
  | 'api_calls';

export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

export interface PerformanceBaseline {
  metric_name: string;
  metric_type: MetricType;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  std_dev: number;
  sample_size: number;
  calculated_at: number;
}

export interface PerformanceTrend {
  metric_name: string;
  direction: 'improving' | 'degrading' | 'stable';
  change_percentage: number;
  significance: 'high' | 'medium' | 'low';
  period_days: number;
}

export interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'database' | 'cache' | 'api' | 'agent' | 'infrastructure';
  title: string;
  description: string;
  expected_improvement: string;
  implementation_effort: 'low' | 'medium' | 'high';
  actions: string[];
}

export interface PerformanceReport {
  workspace_id: string;
  generated_at: number;
  overall_health: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: PerformanceMetric[];
  baselines: PerformanceBaseline[];
  trends: PerformanceTrend[];
  recommendations: OptimizationRecommendation[];
  top_slow_operations: Array<{ operation: string; avg_duration_ms: number; count: number }>;
  top_error_operations: Array<{ operation: string; error_rate: number; count: number }>;
}

class PerformanceTrackerService {
  private metrics: PerformanceMetric[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private readonly MAX_METRICS = 10000; // Prevent memory overflow

  /**
   * Track an operation and measure its performance
   */
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;

      // Record latency metric
      this.recordMetric({
        name: `operation.${operationName}.latency`,
        type: 'latency',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, success: 'true' },
      });

      // Record memory usage if significant
      if (Math.abs(memoryDelta) > 1024 * 1024) {
        // >1MB change
        this.recordMetric({
          name: `operation.${operationName}.memory`,
          type: 'memory_usage',
          value: memoryDelta / (1024 * 1024), // Convert to MB
          unit: 'MB',
          timestamp: Date.now(),
          tags,
        });
      }

      // Record to APM
      apm.recordHistogram(`performance.${operationName}`, duration, tags);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed operation
      this.recordMetric({
        name: `operation.${operationName}.latency`,
        type: 'latency',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, success: 'false' },
      });

      apm.recordHistogram(`performance.${operationName}.error`, duration, {
        ...tags,
        error: error instanceof Error ? error.name : 'unknown',
      });

      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Prevent memory overflow
    if (this.metrics.length > this.MAX_METRICS) {
      // Remove oldest 20%
      this.metrics = this.metrics.slice(Math.floor(this.MAX_METRICS * 0.2));
    }

    // Send to APM
    if (metric.type === 'latency') {
      apm.recordHistogram(metric.name, metric.value, metric.tags);
    } else if (metric.type === 'throughput' || metric.type === 'error_rate') {
      apm.incrementCounter(metric.name, metric.value, metric.tags);
    } else {
      apm.setGauge(metric.name, metric.value, metric.tags);
    }
  }

  /**
   * Calculate performance baseline for a metric
   */
  calculateBaseline(metricName: string, windowHours: number = 24): PerformanceBaseline | null {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

    const relevantMetrics = this.metrics.filter(
      (m) => m.name === metricName && m.timestamp >= cutoff
    );

    if (relevantMetrics.length < 10) {
      // Need at least 10 samples
      return null;
    }

    const values = relevantMetrics.map((m) => m.value).sort((a, b) => a - b);

    // Calculate percentiles
    const p50Index = Math.floor(values.length * 0.5);
    const p95Index = Math.floor(values.length * 0.95);
    const p99Index = Math.floor(values.length * 0.99);

    const p50 = values[p50Index];
    const p95 = values[p95Index];
    const p99 = values[p99Index];

    // Calculate average
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const baseline: PerformanceBaseline = {
      metric_name: metricName,
      metric_type: relevantMetrics[0].type,
      p50,
      p95,
      p99,
      avg,
      std_dev: stdDev,
      sample_size: values.length,
      calculated_at: Date.now(),
    };

    this.baselines.set(metricName, baseline);
    return baseline;
  }

  /**
   * Detect performance degradation
   */
  detectDegradation(
    metricName: string,
    currentValue: number,
    threshold: number = 1.5
  ): { degraded: boolean; severity: 'low' | 'medium' | 'high' } {
    const baseline = this.baselines.get(metricName);

    if (!baseline) {
      return { degraded: false, severity: 'low' };
    }

    // Check if current value exceeds baseline p95 by threshold
    const degradationRatio = currentValue / baseline.p95;

    if (degradationRatio >= threshold * 2) {
      return { degraded: true, severity: 'high' };
    } else if (degradationRatio >= threshold * 1.5) {
      return { degraded: true, severity: 'medium' };
    } else if (degradationRatio >= threshold) {
      return { degraded: true, severity: 'low' };
    }

    return { degraded: false, severity: 'low' };
  }

  /**
   * Analyze performance trends
   */
  analyzeTrend(metricName: string, periodDays: number = 7): PerformanceTrend | null {
    const now = Date.now();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const halfPeriodMs = periodMs / 2;

    // Get metrics for two halves of the period
    const olderMetrics = this.metrics.filter(
      (m) =>
        m.name === metricName &&
        m.timestamp >= now - periodMs &&
        m.timestamp < now - halfPeriodMs
    );

    const recentMetrics = this.metrics.filter(
      (m) => m.name === metricName && m.timestamp >= now - halfPeriodMs
    );

    if (olderMetrics.length < 5 || recentMetrics.length < 5) {
      return null;
    }

    // Calculate averages
    const olderAvg =
      olderMetrics.reduce((sum, m) => sum + m.value, 0) / olderMetrics.length;
    const recentAvg =
      recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;

    // Calculate change percentage
    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Determine direction (for latency, lower is better)
    const metricType = this.metrics.find((m) => m.name === metricName)?.type;
    const lowerIsBetter = metricType === 'latency' || metricType === 'error_rate';

    let direction: 'improving' | 'degrading' | 'stable';

    if (Math.abs(changePercentage) < 5) {
      direction = 'stable';
    } else if (lowerIsBetter) {
      direction = changePercentage < 0 ? 'improving' : 'degrading';
    } else {
      direction = changePercentage > 0 ? 'improving' : 'degrading';
    }

    // Determine significance
    let significance: 'high' | 'medium' | 'low';
    const absChange = Math.abs(changePercentage);

    if (absChange >= 50) {
      significance = 'high';
    } else if (absChange >= 20) {
      significance = 'medium';
    } else {
      significance = 'low';
    }

    return {
      metric_name: metricName,
      direction,
      change_percentage: changePercentage,
      significance,
      period_days: periodDays,
    };
  }

  /**
   * Generate optimization recommendations based on performance data
   */
  async getOptimizationRecommendations(
    workspaceId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze execution history for slow operations
    const slowOps = await this.identifySlowOperations(workspaceId);

    for (const op of slowOps.slice(0, 3)) {
      recommendations.push({
        priority: op.avg_duration_ms > 5000 ? 'high' : op.avg_duration_ms > 2000 ? 'medium' : 'low',
        category: 'agent',
        title: `Optimize ${op.task_type} operations`,
        description: `${op.agent_id} takes an average of ${Math.round(op.avg_duration_ms)}ms for ${op.task_type} tasks, which is above optimal performance.`,
        expected_improvement: `30-50% latency reduction`,
        implementation_effort: 'medium',
        actions: [
          'Review ${op.agent_id} implementation for bottlenecks',
          'Add caching for repeated operations',
          'Consider parallel processing where applicable',
          'Profile and optimize database queries',
        ],
      });
    }

    // Check cache performance
    const cacheMetrics = this.metrics.filter((m) => m.type === 'cache_hit_rate');
    if (cacheMetrics.length > 0) {
      const avgHitRate =
        cacheMetrics.reduce((sum, m) => sum + m.value, 0) / cacheMetrics.length;

      if (avgHitRate < 0.7) {
        recommendations.push({
          priority: 'high',
          category: 'cache',
          title: 'Improve cache hit rate',
          description: `Cache hit rate is ${(avgHitRate * 100).toFixed(1)}%, below optimal 80%+`,
          expected_improvement: `15-25% overall latency reduction`,
          implementation_effort: 'low',
          actions: [
            'Review cache key strategies',
            'Increase TTL for stable data',
            'Implement cache warming for common queries',
            'Add cache preloading for predictable patterns',
          ],
        });
      }
    }

    // Check database connection usage
    const dbConnections = this.metrics.filter((m) => m.type === 'db_connections');
    if (dbConnections.length > 0) {
      const maxConnections = Math.max(...dbConnections.map((m) => m.value));

      if (maxConnections > 50) {
        recommendations.push({
          priority: 'medium',
          category: 'database',
          title: 'Enable database connection pooling',
          description: `Peak database connections (${maxConnections}) approaching limits`,
          expected_improvement: `60-80% query latency reduction`,
          implementation_effort: 'low',
          actions: [
            'Enable ENABLE_DB_POOLER=true in environment',
            'Configure DB_POOL_SIZE based on load',
            'Monitor connection usage after enabling',
          ],
        });
      }
    }

    // Check error patterns
    const errorPatterns = await executionFeedback.identifyErrorPatterns(workspaceId, 7);

    for (const pattern of errorPatterns.slice(0, 2)) {
      if (pattern.count >= 5) {
        recommendations.push({
          priority: pattern.count >= 20 ? 'high' : 'medium',
          category: 'agent',
          title: `Address recurring ${pattern.pattern} errors`,
          description: `${pattern.count} occurrences of ${pattern.pattern} errors across ${pattern.agents.join(', ')}`,
          expected_improvement: `Reduce error rate by 50-90%`,
          implementation_effort: 'medium',
          actions: [
            'Review error logs for root cause',
            'Add error handling for ${pattern.pattern}',
            'Implement retry logic with exponential backoff',
            'Add monitoring alerts for this error type',
          ],
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Identify slow operations from execution history
   */
  private async identifySlowOperations(
    workspaceId: string
  ): Promise<Array<{ agent_id: string; task_type: string; avg_duration_ms: number; count: number }>> {
    const history = await executionFeedback.getExecutionHistory(workspaceId, {
      success: true,
      limit: 1000,
    });

    // Group by agent + task type
    const groups: Record<string, { durations: number[]; count: number }> = {};

    history.forEach((record) => {
      if (!record.duration_ms) return;

      const key = `${record.agent_id}:${record.task_type}`;

      if (!groups[key]) {
        groups[key] = { durations: [], count: 0 };
      }

      groups[key].durations.push(record.duration_ms);
      groups[key].count++;
    });

    // Calculate averages and filter slow operations
    const results = Object.entries(groups)
      .map(([key, data]) => {
        const [agent_id, task_type] = key.split(':');
        const avg_duration_ms =
          data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;

        return {
          agent_id,
          task_type,
          avg_duration_ms,
          count: data.count,
        };
      })
      .filter((op) => op.avg_duration_ms > 1000) // >1 second
      .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);

    return results;
  }

  /**
   * Generate comprehensive performance report
   */
  async getPerformanceReport(workspaceId: string): Promise<PerformanceReport> {
    const recentMetrics = this.metrics.slice(-100);

    // Calculate baselines for key metrics
    const baselines: PerformanceBaseline[] = [];
    const metricNames = [...new Set(recentMetrics.map((m) => m.name))];

    for (const name of metricNames) {
      const baseline = this.calculateBaseline(name, 24);
      if (baseline) {
        baselines.push(baseline);
      }
    }

    // Analyze trends
    const trends: PerformanceTrend[] = [];
    for (const name of metricNames.slice(0, 10)) {
      const trend = this.analyzeTrend(name, 7);
      if (trend) {
        trends.push(trend);
      }
    }

    // Get optimization recommendations
    const recommendations = await this.getOptimizationRecommendations(workspaceId);

    // Get top slow operations
    const topSlowOperations = await this.identifySlowOperations(workspaceId);

    // Calculate overall health
    const degradingTrends = trends.filter((t) => t.direction === 'degrading' && t.significance !== 'low').length;
    const highPriorityIssues = recommendations.filter((r) => r.priority === 'high').length;

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (highPriorityIssues >= 3 || degradingTrends >= 3) {
      overallHealth = 'poor';
    } else if (highPriorityIssues >= 1 || degradingTrends >= 2) {
      overallHealth = 'fair';
    } else if (degradingTrends >= 1) {
      overallHealth = 'good';
    } else {
      overallHealth = 'excellent';
    }

    return {
      workspace_id: workspaceId,
      generated_at: Date.now(),
      overall_health: overallHealth,
      metrics: recentMetrics,
      baselines,
      trends,
      recommendations,
      top_slow_operations: topSlowOperations.slice(0, 5),
      top_error_operations: [], // TODO: Implement from error patterns
    };
  }

  /**
   * Clear old metrics (cleanup)
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTrackerService();

// Export types and classes
export { PerformanceTrackerService };
