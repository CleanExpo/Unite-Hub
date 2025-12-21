/**
 * M1 Performance Profiler
 *
 * Latency tracking, percentile analysis, bottleneck detection,
 * and optimization recommendations
 *
 * Version: v1.0.0
 * Phase: 22 - Advanced Caching & Performance Optimization
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Operation latency sample
 */
export interface LatencySample {
  operationId: string;
  operationName: string;
  latencyMs: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Latency statistics
 */
export interface LatencyStats {
  operationName: string;
  samples: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number; // median
  p95Ms: number;
  p99Ms: number;
  stdDev: number;
}

/**
 * Bottleneck identification
 */
export interface Bottleneck {
  operationName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  metrics: Record<string, number>;
  recommendation: string;
}

/**
 * Performance optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  operationName: string;
  category: 'caching' | 'indexing' | 'parallelization' | 'batching' | 'async' | 'algorithm';
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedImprovement: number; // percentage
  effort: 'low' | 'medium' | 'high';
}

/**
 * Resource usage snapshot
 */
export interface ResourceUsage {
  timestamp: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance profiler
 */
export class PerformanceProfiler {
  private latencySamples: Map<string, LatencySample[]> = new Map(); // operation -> samples
  private resourceSnapshots: ResourceUsage[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private operationTracking: Map<string, { startTime: number; metadata?: Record<string, unknown> }> = new Map();

  /**
   * Start tracking operation latency
   */
  startOperation(operationName: string, metadata?: Record<string, unknown>): string {
    const operationId = `op_${generateUUID()}`;
    this.operationTracking.set(operationId, {
      startTime: Date.now(),
      metadata,
    });
    return operationId;
  }

  /**
   * End operation and record latency
   */
  endOperation(operationId: string): number {
    const tracking = this.operationTracking.get(operationId);
    if (!tracking) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const latencyMs = Date.now() - tracking.startTime;

    // Parse operation name if it's a path (e.g., "db.query.users")
    const parts = operationId.split('_');
    const operationName = parts[1] || 'unknown';

    if (!this.latencySamples.has(operationName)) {
      this.latencySamples.set(operationName, []);
    }

    const sample: LatencySample = {
      operationId,
      operationName,
      latencyMs,
      timestamp: Date.now(),
      metadata: tracking.metadata,
    };

    this.latencySamples.get(operationName)!.push(sample);
    this.operationTracking.delete(operationId);

    return latencyMs;
  }

  /**
   * Record latency sample directly
   */
  recordLatency(operationName: string, latencyMs: number, metadata?: Record<string, unknown>): void {
    if (!this.latencySamples.has(operationName)) {
      this.latencySamples.set(operationName, []);
    }

    const sample: LatencySample = {
      operationId: `op_${generateUUID()}`,
      operationName,
      latencyMs,
      timestamp: Date.now(),
      metadata,
    };

    this.latencySamples.get(operationName)!.push(sample);
  }

  /**
   * Calculate percentile for array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], avg: number): number {
    const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get latency statistics for operation
   */
  getLatencyStats(operationName: string): LatencyStats | null {
    const samples = this.latencySamples.get(operationName);
    if (!samples || samples.length === 0) {
      return null;
    }

    const latencies = samples.map((s) => s.latencyMs);
    const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const stdDev = this.calculateStdDev(latencies, avg);

    return {
      operationName,
      samples: samples.length,
      minMs: Math.min(...latencies),
      maxMs: Math.max(...latencies),
      avgMs: Math.round(avg * 100) / 100,
      p50Ms: this.calculatePercentile(latencies, 50),
      p95Ms: this.calculatePercentile(latencies, 95),
      p99Ms: this.calculatePercentile(latencies, 99),
      stdDev: Math.round(stdDev * 100) / 100,
    };
  }

  /**
   * Get all latency statistics
   */
  getAllLatencyStats(): LatencyStats[] {
    const allStats: LatencyStats[] = [];

    for (const operationName of this.latencySamples.keys()) {
      const stats = this.getLatencyStats(operationName);
      if (stats) {
        allStats.push(stats);
      }
    }

    return allStats;
  }

  /**
   * Detect bottlenecks
   */
  detectBottlenecks(): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const allStats = this.getAllLatencyStats();

    // Calculate average latency across all operations
    const avgLatencies = allStats.map((s) => s.avgMs);
    const overallAvg = avgLatencies.reduce((sum, l) => sum + l, 0) / avgLatencies.length;

    for (const stats of allStats) {
      // Rule 1: Very high latency (>500ms)
      if (stats.maxMs > 500) {
        bottlenecks.push({
          operationName: stats.operationName,
          severity: 'critical',
          reason: `Max latency is ${stats.maxMs}ms (>500ms threshold)`,
          metrics: {
            maxLatency: stats.maxMs,
            avgLatency: stats.avgMs,
            p99Latency: stats.p99Ms,
          },
          recommendation: 'Consider caching, batching, or async operations',
        });
      }

      // Rule 2: High variance (stdDev > 0.5 * avg)
      if (stats.stdDev > stats.avgMs * 0.5) {
        bottlenecks.push({
          operationName: stats.operationName,
          severity: 'high',
          reason: `High variance detected (stdDev: ${stats.stdDev}ms, avg: ${stats.avgMs}ms)`,
          metrics: {
            stdDev: stats.stdDev,
            avgLatency: stats.avgMs,
          },
          recommendation: 'Investigate performance variance; consider adding caching',
        });
      }

      // Rule 3: Significantly above average
      if (stats.avgMs > overallAvg * 2) {
        bottlenecks.push({
          operationName: stats.operationName,
          severity: 'medium',
          reason: `Latency is 2x higher than average (${stats.avgMs}ms vs ${overallAvg}ms)`,
          metrics: {
            operationLatency: stats.avgMs,
            averageLatency: overallAvg,
          },
          recommendation: 'Consider optimization or caching',
        });
      }

      // Rule 4: High p99 (tail latency)
      if (stats.p99Ms > stats.avgMs * 5) {
        bottlenecks.push({
          operationName: stats.operationName,
          severity: 'medium',
          reason: `High tail latency (p99: ${stats.p99Ms}ms vs avg: ${stats.avgMs}ms)`,
          metrics: {
            p99Latency: stats.p99Ms,
            avgLatency: stats.avgMs,
          },
          recommendation: 'Investigate outliers; consider timeout optimization',
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const bottlenecks = this.detectBottlenecks();

    for (const bottleneck of bottlenecks) {
      const recommendation: OptimizationRecommendation = {
        id: `rec_${generateUUID()}`,
        operationName: bottleneck.operationName,
        category: 'caching', // Default, could be more sophisticated
        priority: bottleneck.severity === 'critical' ? 'high' : 'medium',
        description: bottleneck.recommendation,
        estimatedImprovement: bottleneck.severity === 'critical' ? 50 : 30, // Rough estimate
        effort: 'medium',
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * Record resource usage
   */
  recordResourceUsage(memoryUsageMb: number, cpuUsagePercent: number, metadata?: Record<string, unknown>): void {
    this.resourceSnapshots.push({
      timestamp: Date.now(),
      memoryUsageMb,
      cpuUsagePercent,
      metadata,
    });

    // Keep only last 1000 snapshots
    if (this.resourceSnapshots.length > 1000) {
      this.resourceSnapshots = this.resourceSnapshots.slice(-1000);
    }
  }

  /**
   * Get resource usage trends
   */
  getResourceTrends(
    periodMs: number = 60000
  ): {
    avgMemoryMb: number;
    peakMemoryMb: number;
    avgCpuPercent: number;
    peakCpuPercent: number;
    samplesInPeriod: number;
  } {
    const cutoff = Date.now() - periodMs;
    const recentSnapshots = this.resourceSnapshots.filter((s) => s.timestamp >= cutoff);

    if (recentSnapshots.length === 0) {
      return {
        avgMemoryMb: 0,
        peakMemoryMb: 0,
        avgCpuPercent: 0,
        peakCpuPercent: 0,
        samplesInPeriod: 0,
      };
    }

    const memories = recentSnapshots.map((s) => s.memoryUsageMb);
    const cpus = recentSnapshots.map((s) => s.cpuUsagePercent);

    return {
      avgMemoryMb: Math.round((memories.reduce((a, b) => a + b, 0) / memories.length) * 100) / 100,
      peakMemoryMb: Math.max(...memories),
      avgCpuPercent: Math.round((cpus.reduce((a, b) => a + b, 0) / cpus.length) * 100) / 100,
      peakCpuPercent: Math.max(...cpus),
      samplesInPeriod: recentSnapshots.length,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    timestamp: number;
    latencyStats: LatencyStats[];
    bottlenecks: Bottleneck[];
    recommendations: OptimizationRecommendation[];
    resourceTrends: ReturnType<PerformanceProfiler['getResourceTrends']>;
  } {
    return {
      timestamp: Date.now(),
      latencyStats: this.getAllLatencyStats(),
      bottlenecks: this.detectBottlenecks(),
      recommendations: this.generateRecommendations(),
      resourceTrends: this.getResourceTrends(),
    };
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.latencySamples.clear();
    this.resourceSnapshots = [];
    this.operationTracking.clear();
    this.recommendations = [];
  }
}

// Export singleton
export const performanceProfiler = new PerformanceProfiler();
