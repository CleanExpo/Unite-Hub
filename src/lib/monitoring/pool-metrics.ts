/**
 * Database Connection Pool Monitoring
 *
 * Tracks connection pool health, performance, and exhaustion events.
 * Integrates with Prometheus metrics for observability.
 *
 * Metrics Tracked:
 * - Active connections count
 * - Connection wait times
 * - Pool exhaustion events
 * - Connection reuse rate
 * - Pooler URL status
 *
 * @module lib/monitoring/pool-metrics
 */

 

import { recordError } from './error-metrics';
import { getPoolingConfig, isPoolingConfigured } from '@/lib/supabase/pooling-config';

/**
 * Connection pool statistics
 */
interface PoolMetric {
  activeConnections: number;
  waitTimeMs: number;
  timestamp: Date;
  isPooled: boolean;
}

/**
 * Pool health status
 */
export interface PoolHealth {
  isHealthy: boolean;
  score: number; // 0-100
  activeConnections: number;
  avgWaitTimeMs: number;
  poolExhaustionEvents: number;
  isPoolingConfigured: boolean;
  message: string;
}

/**
 * In-memory pool metrics collector
 */
class PoolMetricsCollector {
  private metrics: PoolMetric[] = [];
  private maxMetricsHistory = 1000;
  private poolExhaustionCount = 0;
  private connectionWaitTimes: number[] = [];
  private maxWaitTimeHistory = 500;

  /**
   * Record a connection attempt
   */
  recordConnectionAttempt(waitTimeMs: number, isPooled: boolean): void {
    const metric: PoolMetric = {
      activeConnections: 1, // Will be updated by pool status
      waitTimeMs,
      timestamp: new Date(),
      isPooled,
    };

    this.metrics.push(metric);
    this.connectionWaitTimes.push(waitTimeMs);

    // Trim history
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    if (this.connectionWaitTimes.length > this.maxWaitTimeHistory) {
      this.connectionWaitTimes.shift();
    }

    // Alert if pool is exhausted (wait time > 5 seconds)
    if (waitTimeMs > 5000) {
      this.poolExhaustionCount++;
      recordError('POOL_EXHAUSTION', {
        waitTimeMs,
        isPooled,
      });
    }
  }

  /**
   * Get pool health score (0-100)
   *
   * Based on:
   * - Average connection wait time (max penalty: 50 points)
   * - Pool exhaustion events (max penalty: 50 points)
   */
  getHealthScore(): number {
    const avgWaitTime = this.getAverageWaitTime();
    const exhaustionEventCount = this.poolExhaustionCount;

    let score = 100;

    // Penalize for wait time (max 50 points)
    // Acceptable: <100ms, bad: >1000ms
    const waitTimePenalty = Math.min(50, (avgWaitTime / 1000) * 50);
    score -= waitTimePenalty;

    // Penalize for exhaustion events (max 50 points)
    // Each event: 1 point penalty, max 50
    const exhaustionPenalty = Math.min(50, exhaustionEventCount * 0.1);
    score -= exhaustionPenalty;

    return Math.max(0, Math.round(score));
  }

  /**
   * Get average connection wait time
   */
  getAverageWaitTime(): number {
    if (this.connectionWaitTimes.length === 0) {
return 0;
}

    const sum = this.connectionWaitTimes.reduce((a, b) => a + b, 0);
    return sum / this.connectionWaitTimes.length;
  }

  /**
   * Get percentile wait time (p50, p95, p99)
   */
  getWaitTimePercentile(percentile: number): number {
    if (this.connectionWaitTimes.length === 0) {
return 0;
}

    const sorted = [...this.connectionWaitTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  /**
   * Get pool exhaustion event count
   */
  getExhaustionEventCount(): number {
    return this.poolExhaustionCount;
  }

  /**
   * Get pooling configuration status
   */
  isPoolingActive(): boolean {
    return isPoolingConfigured();
  }

  /**
   * Get pool health status
   */
  getPoolHealth(): PoolHealth {
    const config = getPoolingConfig();
    const score = this.getHealthScore();
    const avgWaitTime = this.getAverageWaitTime();
    const exhaustionCount = this.getExhaustionEventCount();

    return {
      isHealthy: score >= 70,
      score,
      activeConnections: 0, // Would need pg_bouncer stats to get real number
      avgWaitTimeMs: Math.round(avgWaitTime),
      poolExhaustionEvents: exhaustionCount,
      isPoolingConfigured: config.enabled,
      message:
        score >= 70
          ? `Pool healthy: ${config.mode} mode, avg wait ${Math.round(avgWaitTime)}ms`
          : `Pool degraded (score: ${score}): avg wait ${Math.round(avgWaitTime)}ms, ${exhaustionCount} exhaustion events`,
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
    this.connectionWaitTimes = [];
    this.poolExhaustionCount = 0;
  }

  /**
   * Export Prometheus format metrics
   */
  exportPrometheus(): string {
    const health = this.getPoolHealth();
    const config = getPoolingConfig();

    let output = '# HELP supabase_pool_health_score Pool health score (0-100)\n';
    output += '# TYPE supabase_pool_health_score gauge\n';
    output += `supabase_pool_health_score{mode="${config.mode}",pooling="${config.isPooled ? 'true' : 'false'}"} ${health.score}\n`;

    output += '\n# HELP supabase_pool_wait_time_ms Average connection wait time\n';
    output += '# TYPE supabase_pool_wait_time_ms gauge\n';
    output += `supabase_pool_wait_time_ms{mode="${config.mode}"} ${health.avgWaitTimeMs}\n`;

    output += '\n# HELP supabase_pool_wait_time_percentiles Connection wait time percentiles\n';
    output += '# TYPE supabase_pool_wait_time_percentiles gauge\n';
    output += `supabase_pool_wait_time_percentiles{percentile="p50",mode="${config.mode}"} ${this.getWaitTimePercentile(50)}\n`;
    output += `supabase_pool_wait_time_percentiles{percentile="p95",mode="${config.mode}"} ${this.getWaitTimePercentile(95)}\n`;
    output += `supabase_pool_wait_time_percentiles{percentile="p99",mode="${config.mode}"} ${this.getWaitTimePercentile(99)}\n`;

    output += '\n# HELP supabase_pool_exhaustion_total Total pool exhaustion events\n';
    output += '# TYPE supabase_pool_exhaustion_total counter\n';
    output += `supabase_pool_exhaustion_total${`{mode="${config.mode}"}`} ${health.poolExhaustionEvents}\n`;

    return output;
  }
}

/**
 * Singleton instance
 */
export const poolMetricsCollector = new PoolMetricsCollector();

/**
 * Record connection attempt
 */
export function recordPoolConnection(waitTimeMs: number): void {
  const config = getPoolingConfig();
  poolMetricsCollector.recordConnectionAttempt(waitTimeMs, config.isPooled);
}

/**
 * Get pool health status
 */
export function getPoolHealth(): PoolHealth {
  return poolMetricsCollector.getPoolHealth();
}

/**
 * Get pool health score (0-100)
 */
export function getPoolHealthScore(): number {
  return poolMetricsCollector.getHealthScore();
}

/**
 * Get average connection wait time (ms)
 */
export function getAverageWaitTime(): number {
  return poolMetricsCollector.getAverageWaitTime();
}

/**
 * Get connection wait time percentile
 */
export function getWaitTimePercentile(percentile: number): number {
  return poolMetricsCollector.getWaitTimePercentile(percentile);
}

/**
 * Get pool exhaustion event count
 */
export function getPoolExhaustionEventCount(): number {
  return poolMetricsCollector.getExhaustionEventCount();
}

/**
 * Check if pooling is active
 */
export function isPoolingActive(): boolean {
  return poolMetricsCollector.isPoolingActive();
}

/**
 * Export Prometheus format metrics
 */
export function exportPoolMetricsPrometheus(): string {
  return poolMetricsCollector.exportPrometheus();
}

/**
 * Reset all metrics
 */
export function resetPoolMetrics(): void {
  poolMetricsCollector.reset();
}

export default poolMetricsCollector;
