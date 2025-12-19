/**
 * M1 Self-Healing & Auto-Remediation System
 *
 * Proactive health monitoring with automatic remediation, recovery strategies,
 * and intelligent problem resolution
 *
 * Version: v3.0.0
 * Phase: 17A - Self-Healing & Auto-Remediation
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'down';
export type RemediationType = 'restart' | 'scale' | 'failover' | 'circuit_break' | 'throttle' | 'drain';
export type RecoveryStrategy = 'immediate' | 'gradual' | 'canary' | 'blue_green';

/**
 * Health check configuration
 */
export interface HealthCheck {
  id: string;
  name: string;
  serviceId: string;
  type: 'http' | 'grpc' | 'tcp' | 'custom';
  endpoint: string;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  threshold: number; // consecutive failures before alert
  enabled: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  checkId: string;
  serviceId: string;
  status: 'pass' | 'fail';
  responseTime: number; // milliseconds
  timestamp: number;
  details?: string;
}

/**
 * Service health baseline
 */
export interface HealthBaseline {
  serviceId: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cpuBaseline: number;
  memoryBaseline: number;
  lastUpdated: number;
}

/**
 * Remediation action
 */
export interface RemediationAction {
  id: string;
  serviceId: string;
  type: RemediationType;
  reason: string;
  parameters: Record<string, unknown>;
  executedAt: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  completedAt?: number;
}

/**
 * Recovery plan
 */
export interface RecoveryPlan {
  id: string;
  serviceId: string;
  strategy: RecoveryStrategy;
  stages: RecoveryStage[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Recovery stage
 */
export interface RecoveryStage {
  id: string;
  name: string;
  order: number;
  action: RemediationType;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  expectedDuration: number; // milliseconds
  actualDuration?: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Self-Healing Manager
 */
export class SelfHealingManager {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private healthCheckResults: HealthCheckResult[] = [];
  private healthBaselines: Map<string, HealthBaseline> = new Map();
  private remediationActions: Map<string, RemediationAction> = new Map();
  private recoveryPlans: Map<string, RecoveryPlan> = new Map();
  private failureCounters: Map<string, number> = new Map(); // checkId -> consecutive failures
  private checkIntervals: Map<string, NodeJS.Timer> = new Map();

  /**
   * Create health check
   */
  createHealthCheck(
    name: string,
    serviceId: string,
    type: 'http' | 'grpc' | 'tcp' | 'custom',
    endpoint: string,
    interval: number = 30000,
    timeout: number = 5000,
    threshold: number = 3
  ): string {
    const id = `check_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const check: HealthCheck = {
      id,
      name,
      serviceId,
      type,
      endpoint,
      interval,
      timeout,
      threshold,
      enabled: true,
    };

    this.healthChecks.set(id, check);
    this.failureCounters.set(id, 0);

    // Start health check interval
    this.startHealthCheck(id);

    return id;
  }

  /**
   * Get health check
   */
  getHealthCheck(checkId: string): HealthCheck | null {
    return this.healthChecks.get(checkId) || null;
  }

  /**
   * Record health check result
   */
  recordHealthCheckResult(
    checkId: string,
    serviceId: string,
    status: 'pass' | 'fail',
    responseTime: number,
    details?: string
  ): void {
    const result: HealthCheckResult = {
      checkId,
      serviceId,
      status,
      responseTime,
      timestamp: Date.now(),
      details,
    };

    this.healthCheckResults.push(result);

    // Update failure counter
    if (status === 'fail') {
      const count = (this.failureCounters.get(checkId) || 0) + 1;
      this.failureCounters.set(checkId, count);

      // Check if threshold exceeded
      const check = this.healthChecks.get(checkId);
      if (check && count >= check.threshold) {
        this.triggerRemediation(serviceId, `Health check failed ${count} times`, check);
      }
    } else {
      this.failureCounters.set(checkId, 0);
    }
  }

  /**
   * Set health baseline
   */
  setHealthBaseline(
    serviceId: string,
    avgResponseTime: number,
    p95ResponseTime: number,
    p99ResponseTime: number,
    errorRate: number,
    cpuBaseline: number,
    memoryBaseline: number
  ): void {
    const baseline: HealthBaseline = {
      serviceId,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      cpuBaseline,
      memoryBaseline,
      lastUpdated: Date.now(),
    };

    this.healthBaselines.set(serviceId, baseline);
  }

  /**
   * Get health baseline
   */
  getHealthBaseline(serviceId: string): HealthBaseline | null {
    return this.healthBaselines.get(serviceId) || null;
  }

  /**
   * Detect anomaly against baseline
   */
  detectAnomaly(
    serviceId: string,
    currentMetrics: {
      responseTime: number;
      errorRate: number;
      cpuUsage: number;
      memoryUsage: number;
    }
  ): { isAnomaly: boolean; type: string; severity: number } {
    const baseline = this.healthBaselines.get(serviceId);
    if (!baseline) {
      return { isAnomaly: false, type: 'no_baseline', severity: 0 };
    }

    let anomalyScore = 0;
    let anomalyType = '';

    // Response time anomaly (>150% of baseline)
    if (currentMetrics.responseTime > baseline.p95ResponseTime * 1.5) {
      anomalyScore += 30;
      anomalyType = 'high_latency';
    }

    // Error rate anomaly (>2x baseline)
    if (currentMetrics.errorRate > baseline.errorRate * 2) {
      anomalyScore += 40;
      anomalyType = 'high_error_rate';
    }

    // CPU anomaly (>80% or 2x baseline)
    if (currentMetrics.cpuUsage > 0.8 || currentMetrics.cpuUsage > baseline.cpuBaseline * 2) {
      anomalyScore += 25;
      anomalyType = 'high_cpu';
    }

    // Memory anomaly (>90% or 2x baseline)
    if (currentMetrics.memoryUsage > 0.9 || currentMetrics.memoryUsage > baseline.memoryBaseline * 2) {
      anomalyScore += 25;
      anomalyType = 'high_memory';
    }

    return {
      isAnomaly: anomalyScore > 0,
      type: anomalyType,
      severity: Math.min(100, anomalyScore),
    };
  }

  /**
   * Trigger remediation
   */
  triggerRemediation(serviceId: string, reason: string, check?: HealthCheck): string {
    const id = `remediation_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Determine remediation type based on reason
    let type: RemediationType = 'restart';
    if (reason.includes('memory')) {
      type = 'scale';
    } else if (reason.includes('error')) {
      type = 'circuit_break';
    } else if (reason.includes('connection')) {
      type = 'failover';
    }

    const action: RemediationAction = {
      id,
      serviceId,
      type,
      reason,
      parameters: {
        checkId: check?.id,
        retries: 3,
        timeout: check?.timeout || 5000,
      },
      executedAt: Date.now(),
      status: 'pending',
    };

    this.remediationActions.set(id, action);

    // Auto-execute remediation
    this.executeRemediation(id);

    return id;
  }

  /**
   * Execute remediation
   */
  executeRemediation(remediationId: string): boolean {
    const action = this.remediationActions.get(remediationId);
    if (!action) {
return false;
}

    action.status = 'executing';
    const startTime = Date.now();

    try {
      // Simulate remediation execution based on type
      let result = '';
      switch (action.type) {
        case 'restart':
          result = 'Service restarted successfully';
          break;
        case 'scale':
          result = 'Service scaled from 2 to 4 instances';
          break;
        case 'failover':
          result = 'Failed over to backup instance';
          break;
        case 'circuit_break':
          result = 'Circuit breaker activated, requests throttled';
          break;
        case 'throttle':
          result = 'Rate limiting applied';
          break;
        case 'drain':
          result = 'Graceful connection draining started';
          break;
      }

      action.status = 'completed';
      action.result = result;
      action.completedAt = Date.now();

      return true;
    } catch (error) {
      action.status = 'failed';
      action.result = error instanceof Error ? error.message : 'Unknown error';
      action.completedAt = Date.now();

      return false;
    }
  }

  /**
   * Create recovery plan
   */
  createRecoveryPlan(
    serviceId: string,
    strategy: RecoveryStrategy = 'gradual',
    remediationTypes: RemediationType[] = []
  ): string {
    const id = `recovery_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const stages = this.createRecoveryStages(strategy, remediationTypes);

    const plan: RecoveryPlan = {
      id,
      serviceId,
      strategy,
      stages,
      createdAt: Date.now(),
    };

    this.recoveryPlans.set(id, plan);
    return id;
  }

  /**
   * Start recovery plan
   */
  startRecoveryPlan(planId: string): boolean {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) {
return false;
}

    const now = Date.now();
    plan.startedAt = now;

    // Start first stage
    if (plan.stages.length > 0) {
      plan.stages[0].status = 'executing';
      plan.stages[0].startedAt = now;
    }

    return true;
  }

  /**
   * Complete recovery stage
   */
  completeRecoveryStage(planId: string, stageId: string): boolean {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) {
return false;
}

    const stageIndex = plan.stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) {
return false;
}

    const stage = plan.stages[stageIndex];
    const now = Date.now();

    stage.status = 'completed';
    stage.completedAt = now;
    stage.actualDuration = now - (stage.startedAt || now);

    // Start next stage
    if (stageIndex + 1 < plan.stages.length) {
      const nextStage = plan.stages[stageIndex + 1];
      nextStage.status = 'executing';
      nextStage.startedAt = now;
    } else {
      // All stages complete
      plan.completedAt = now;
    }

    return true;
  }

  /**
   * Get remediation status
   */
  getRemediationStatus(serviceId: string): {
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  } {
    const actions = Array.from(this.remediationActions.values()).filter((a) => a.serviceId === serviceId);

    return {
      pending: actions.filter((a) => a.status === 'pending').length,
      executing: actions.filter((a) => a.status === 'executing').length,
      completed: actions.filter((a) => a.status === 'completed').length,
      failed: actions.filter((a) => a.status === 'failed').length,
    };
  }

  /**
   * Get health check history
   */
  getHealthCheckHistory(
    checkId: string,
    filters?: { limit?: number; status?: 'pass' | 'fail' }
  ): HealthCheckResult[] {
    let results = this.healthCheckResults.filter((r) => r.checkId === checkId);

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get self-healing statistics
   */
  getStatistics(): Record<string, unknown> {
    const allActions = Array.from(this.remediationActions.values());
    const allResults = this.healthCheckResults;

    const failedChecks = allResults.filter((r) => r.status === 'fail').length;
    const passedChecks = allResults.filter((r) => r.status === 'pass').length;

    const avgResponseTime =
      allResults.length > 0 ? allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length : 0;

    return {
      activeHealthChecks: Array.from(this.healthChecks.values()).filter((c) => c.enabled).length,
      totalHealthChecks: this.healthChecks.size,
      healthCheckResults: allResults.length,
      failedChecks,
      passedChecks,
      successRate: passedChecks + failedChecks > 0 ? (passedChecks / (passedChecks + failedChecks)) * 100 : 0,
      avgResponseTime,
      remediationActions: allActions.length,
      completedRemediations: allActions.filter((a) => a.status === 'completed').length,
      failedRemediations: allActions.filter((a) => a.status === 'failed').length,
      recoveryPlans: this.recoveryPlans.size,
      healthBaselines: this.healthBaselines.size,
    };
  }

  /**
   * Start health check
   */
  private startHealthCheck(checkId: string): void {
    const check = this.healthChecks.get(checkId);
    if (!check) {
return;
}

    const interval = setInterval(() => {
      if (!check.enabled) {
        clearInterval(interval);
        return;
      }

      // Simulate health check
      const responseTime = Math.random() * 500;
      const status = responseTime < 100 ? 'pass' : 'fail';

      this.recordHealthCheckResult(checkId, check.serviceId, status, responseTime);
    }, check.interval);

    this.checkIntervals.set(checkId, interval);
  }

  /**
   * Create recovery stages
   */
  private createRecoveryStages(strategy: RecoveryStrategy, remediationTypes: RemediationType[]): RecoveryStage[] {
    const now = Date.now();

    switch (strategy) {
      case 'immediate':
        return [
          {
            id: `stage_${now}_1`,
            name: 'Immediate Restart',
            order: 1,
            action: 'restart',
            status: 'pending',
            expectedDuration: 10000,
          },
        ];

      case 'gradual':
        return [
          {
            id: `stage_${now}_1`,
            name: 'Monitor and Assess',
            order: 1,
            action: 'throttle',
            status: 'pending',
            expectedDuration: 30000,
          },
          {
            id: `stage_${now}_2`,
            name: 'Scale Up',
            order: 2,
            action: 'scale',
            status: 'pending',
            expectedDuration: 60000,
          },
          {
            id: `stage_${now}_3`,
            name: 'Verify Stability',
            order: 3,
            action: 'restart',
            status: 'pending',
            expectedDuration: 30000,
          },
        ];

      case 'canary':
        return [
          {
            id: `stage_${now}_1`,
            name: 'Canary Restart (10%)',
            order: 1,
            action: 'restart',
            status: 'pending',
            expectedDuration: 20000,
          },
          {
            id: `stage_${now}_2`,
            name: 'Monitor Metrics',
            order: 2,
            action: 'throttle',
            status: 'pending',
            expectedDuration: 30000,
          },
          {
            id: `stage_${now}_3`,
            name: 'Full Rollout (100%)',
            order: 3,
            action: 'restart',
            status: 'pending',
            expectedDuration: 20000,
          },
        ];

      case 'blue_green':
        return [
          {
            id: `stage_${now}_1`,
            name: 'Deploy to Green',
            order: 1,
            action: 'scale',
            status: 'pending',
            expectedDuration: 60000,
          },
          {
            id: `stage_${now}_2`,
            name: 'Switch Traffic',
            order: 2,
            action: 'failover',
            status: 'pending',
            expectedDuration: 10000,
          },
          {
            id: `stage_${now}_3`,
            name: 'Drain Blue',
            order: 3,
            action: 'drain',
            status: 'pending',
            expectedDuration: 30000,
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
  }
}

// Export singleton
export const selfHealingManager = new SelfHealingManager();
