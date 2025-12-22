/**
 * M1 Adaptive Rate Limiter
 *
 * Dynamic rate limiting that adjusts limits based on system load,
 * latency metrics, and error rates. Automatically backs off under high load.
 *
 * Version: v1.0.0
 * Phase: 24 - Advanced Rate Limiting & Fair Queuing
 */

import { v4 as generateUUID } from 'uuid';

/**
 * System load metrics
 */
export interface SystemMetrics {
  cpuUsage: number; // 0-1
  memoryUsage: number; // 0-1
  latency: number; // milliseconds
  errorRate: number; // 0-1
  queueDepth: number; // pending requests
  activeConnections: number;
}

/**
 * Adaptive limit decision
 */
export interface AdaptiveLimitDecision {
  requestId: string;
  allowed: boolean;
  currentLimit: number;
  recommendedLimit: number;
  loadLevel: 'low' | 'medium' | 'high' | 'critical';
  metrics: SystemMetrics;
  adjustmentReason?: string;
}

/**
 * Load level threshold configuration
 */
export interface LoadThresholds {
  cpuHigh: number; // 0.7
  memoryHigh: number; // 0.8
  latencyHigh: number; // 500ms
  errorRateHigh: number; // 0.05 (5%)
  queueDepthHigh: number; // 100
}

/**
 * Adaptive rate limiter with load-based adjustment
 */
export class AdaptiveRateLimiter {
  private currentLimit: number;
  private baseLimit: number;
  private metricsHistory: SystemMetrics[] = [];
  private loadThresholds: LoadThresholds;
  private backoffMultiplier = 0.5;
  private recoveryMultiplier = 1.1;
  private adjustmentCooldown = 5000; // milliseconds
  private lastAdjustmentAt = 0;

  constructor(baseLimit: number = 1000, thresholds?: Partial<LoadThresholds>) {
    this.baseLimit = baseLimit;
    this.currentLimit = baseLimit;
    this.loadThresholds = {
      cpuHigh: 0.7,
      memoryHigh: 0.8,
      latencyHigh: 500,
      errorRateHigh: 0.05,
      queueDepthHigh: 100,
      ...thresholds,
    };
  }

  /**
   * Record system metrics
   */
  recordMetrics(metrics: SystemMetrics): void {
    const now = Date.now();

    this.metricsHistory.push(metrics);

    // Keep only last 60 seconds of metrics
    const sixtySecondsAgo = now - 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter(
      (m) => (m as any).timestamp ? (m as any).timestamp > sixtySecondsAgo : true
    );

    // Adjust limits based on metrics
    this.adjustLimits(now);
  }

  /**
   * Adjust rate limits based on current metrics
   */
  private adjustLimits(now: number): void {
    // Respect cooldown period
    if (now - this.lastAdjustmentAt < this.adjustmentCooldown) {
      return;
    }

    const metrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (!metrics) {
return;
}

    const loadLevel = this.assessLoadLevel(metrics);

    let newLimit = this.currentLimit;

    switch (loadLevel) {
      case 'critical':
        // Drastic reduction
        newLimit = Math.max(Math.floor(this.baseLimit * 0.1), 1);
        break;

      case 'high':
        // Significant reduction
        newLimit = Math.floor(this.currentLimit * this.backoffMultiplier);
        break;

      case 'medium':
        // Slight reduction if trending high
        if (this.isTrendingHigh()) {
          newLimit = Math.floor(this.currentLimit * 0.95);
        } else if (this.isTrendingLow()) {
          // Gradual recovery
          newLimit = Math.floor(this.currentLimit * this.recoveryMultiplier);
        }
        break;

      case 'low':
        // Gradual recovery towards base limit
        if (newLimit < this.baseLimit) {
          newLimit = Math.min(Math.ceil(newLimit * this.recoveryMultiplier), this.baseLimit);
        }
        break;
    }

    if (newLimit !== this.currentLimit) {
      this.currentLimit = newLimit;
      this.lastAdjustmentAt = now;
    }
  }

  /**
   * Assess overall load level
   */
  private assessLoadLevel(metrics: SystemMetrics): 'low' | 'medium' | 'high' | 'critical' {
    let criticalCount = 0;
    let highCount = 0;

    // Check individual metrics
    if (metrics.cpuUsage > this.loadThresholds.cpuHigh) {
highCount++;
}
    if (metrics.cpuUsage > 0.9) {
criticalCount++;
}

    if (metrics.memoryUsage > this.loadThresholds.memoryHigh) {
highCount++;
}
    if (metrics.memoryUsage > 0.95) {
criticalCount++;
}

    if (metrics.latency > this.loadThresholds.latencyHigh) {
highCount++;
}
    if (metrics.latency > 2000) {
criticalCount++;
}

    if (metrics.errorRate > this.loadThresholds.errorRateHigh) {
highCount++;
}
    if (metrics.errorRate > 0.1) {
criticalCount++;
}

    if (metrics.queueDepth > this.loadThresholds.queueDepthHigh) {
highCount++;
}
    if (metrics.queueDepth > 500) {
criticalCount++;
}

    // Determine load level
    if (criticalCount >= 2) {
return 'critical';
}
    if (highCount >= 3) {
return 'high';
}
    if (highCount >= 1) {
return 'medium';
}
    return 'low';
  }

  /**
   * Check if metrics are trending high
   */
  private isTrendingHigh(): boolean {
    if (this.metricsHistory.length < 2) {
return false;
}

    const recent = this.metricsHistory.slice(-5);
    const cpu = recent.map((m) => m.cpuUsage);
    const memory = recent.map((m) => m.memoryUsage);

    // Check if most recent is higher than average
    const recentCpu = cpu[cpu.length - 1];
    const avgCpu = cpu.reduce((a, b) => a + b, 0) / cpu.length;
    const cpuTrending = recentCpu > avgCpu * 1.05;

    const recentMemory = memory[memory.length - 1];
    const avgMemory = memory.reduce((a, b) => a + b, 0) / memory.length;
    const memoryTrending = recentMemory > avgMemory * 1.05;

    return cpuTrending || memoryTrending;
  }

  /**
   * Check if metrics are trending low
   */
  private isTrendingLow(): boolean {
    if (this.metricsHistory.length < 2) {
return false;
}

    const recent = this.metricsHistory.slice(-5);
    const cpu = recent.map((m) => m.cpuUsage);
    const memory = recent.map((m) => m.memoryUsage);
    const errors = recent.map((m) => m.errorRate);

    // Check if most recent is lower than average
    const recentCpu = cpu[cpu.length - 1];
    const avgCpu = cpu.reduce((a, b) => a + b, 0) / cpu.length;
    const cpuTrending = recentCpu < avgCpu * 0.95;

    const recentMemory = memory[memory.length - 1];
    const avgMemory = memory.reduce((a, b) => a + b, 0) / memory.length;
    const memoryTrending = recentMemory < avgMemory * 0.95;

    const recentErrors = errors[errors.length - 1];
    const avgErrors = errors.reduce((a, b) => a + b, 0) / errors.length;
    const errorsTrending = recentErrors < avgErrors * 0.95;

    return cpuTrending || memoryTrending || errorsTrending;
  }

  /**
   * Check if request should be allowed
   */
  checkLimit(metrics: SystemMetrics): AdaptiveLimitDecision {
    const requestId = `req_${generateUUID()}`;

    // Record metrics
    this.recordMetrics(metrics);

    const loadLevel = this.assessLoadLevel(metrics);
    const allowed = loadLevel !== 'critical';

    const decision: AdaptiveLimitDecision = {
      requestId,
      allowed,
      currentLimit: this.currentLimit,
      recommendedLimit: this.baseLimit,
      loadLevel,
      metrics,
    };

    if (!allowed) {
      decision.adjustmentReason = 'System at critical load - request rejected';
    } else if (loadLevel === 'high') {
      decision.adjustmentReason = 'High load detected - reducing rate limit';
    } else if (loadLevel === 'low' && this.currentLimit < this.baseLimit) {
      decision.adjustmentReason = 'Low load - recovering towards base limit';
    }

    return decision;
  }

  /**
   * Get current limit
   */
  getCurrentLimit(): number {
    return this.currentLimit;
  }

  /**
   * Set base limit (ideal operating point)
   */
  setBaseLimit(limit: number): void {
    this.baseLimit = Math.max(limit, 1);
    this.currentLimit = Math.min(this.currentLimit, this.baseLimit);
  }

  /**
   * Get metrics trend analysis
   */
  getTrendAnalysis(): Record<string, unknown> {
    if (this.metricsHistory.length === 0) {
      return {
        trend: 'no_data',
        analysis: {},
      };
    }

    const recent = this.metricsHistory.slice(-10);
    const cpu = recent.map((m) => m.cpuUsage);
    const memory = recent.map((m) => m.memoryUsage);
    const latency = recent.map((m) => m.latency);
    const errors = recent.map((m) => m.errorRate);

    const cpuAvg = cpu.reduce((a, b) => a + b, 0) / cpu.length;
    const memoryAvg = memory.reduce((a, b) => a + b, 0) / memory.length;
    const latencyAvg = latency.reduce((a, b) => a + b, 0) / latency.length;
    const errorAvg = errors.reduce((a, b) => a + b, 0) / errors.length;

    return {
      sampleCount: recent.length,
      cpu: {
        average: Math.round(cpuAvg * 100) / 100,
        max: Math.max(...cpu),
        min: Math.min(...cpu),
        trend: this.calculateTrend(cpu),
      },
      memory: {
        average: Math.round(memoryAvg * 100) / 100,
        max: Math.max(...memory),
        min: Math.min(...memory),
        trend: this.calculateTrend(memory),
      },
      latency: {
        average: Math.round(latencyAvg),
        max: Math.max(...latency),
        min: Math.min(...latency),
        trend: this.calculateTrend(latency),
      },
      errorRate: {
        average: Math.round(errorAvg * 10000) / 10000,
        max: Math.max(...errors),
        min: Math.min(...errors),
        trend: this.calculateTrend(errors),
      },
      currentLimit: this.currentLimit,
      baseLimit: this.baseLimit,
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) {
return 'stable';
}

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const percentChange = Math.abs(diff) / firstAvg;

    if (percentChange < 0.05) {
return 'stable';
}
    return diff > 0 ? 'up' : 'down';
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, unknown> {
    const currentLoad = this.metricsHistory[this.metricsHistory.length - 1];

    return {
      currentLimit: this.currentLimit,
      baseLimit: this.baseLimit,
      utilizationRatio: this.currentLimit / this.baseLimit,
      metricsHistorySize: this.metricsHistory.length,
      currentLoad: currentLoad || null,
      backoffMultiplier: this.backoffMultiplier,
      recoveryMultiplier: this.recoveryMultiplier,
      adjustmentCooldown: this.adjustmentCooldown,
    };
  }

  /**
   * Force immediate recovery to base limit
   */
  forceRecovery(): void {
    this.currentLimit = this.baseLimit;
    this.lastAdjustmentAt = 0; // Reset cooldown
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory = [];
  }

  /**
   * Reset to base state
   */
  reset(): void {
    this.currentLimit = this.baseLimit;
    this.metricsHistory = [];
    this.lastAdjustmentAt = 0;
  }

  /**
   * Shutdown limiter
   */
  shutdown(): void {
    this.reset();
  }
}

// Export singleton
export const adaptiveRateLimiter = new AdaptiveRateLimiter();
