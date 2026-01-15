/**
 * Self-Healing Workflows System
 *
 * Automatically detects, prevents, and recovers from failures without manual intervention.
 * Implements predictive error prevention and autonomous recovery strategies.
 *
 * Features:
 * - Automatic error detection and recovery
 * - Predictive failure prevention
 * - Health monitoring and auto-remediation
 * - Degradation detection and response
 * - Recovery strategy execution
 *
 * Usage:
 *   import { selfHealing } from '@/lib/autonomous/self-healing';
 *
 *   // Enable self-healing
 *   await selfHealing.enable('workspace-123');
 *
 *   // Execute with self-healing protection
 *   const result = await selfHealing.executeWithHealing(
 *     'email_processing',
 *     async () => await processEmail(emailId)
 *   );
 */

import { executionFeedback, type ExecutionTracker, type TaskType } from '@/lib/learning/execution-feedback';
import { patternAnalyzer, type Pattern } from '@/lib/learning/pattern-analyzer';
import { performanceTracker } from '@/lib/learning/performance-tracker';
import { healthCheckManager, type ComponentHealth } from '@/lib/monitoring/health-checks';
import { cacheManager } from '@/lib/cache/redis-client';
import { apm } from '@/lib/monitoring/apm';

export interface RecoveryStrategy {
  name: string;
  description: string;
  applicable_errors: string[];
  max_attempts: number;
  backoff_ms: number;
  success_rate: number;
  last_used: number;
}

export interface HealingAction {
  id: string;
  timestamp: number;
  workspace_id: string;
  issue_detected: string;
  recovery_strategy: string;
  success: boolean;
  duration_ms: number;
  details: Record<string, any>;
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  detected_at: number;
  auto_recoverable: boolean;
  recovery_strategy?: string;
}

type RecoveryStrategyExecutor = (error: Error, context: any) => Promise<boolean>;

class SelfHealingSystem {
  private enabled: Map<string, boolean> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private healingHistory: HealingAction[] = [];
  private strategyExecutors: Map<string, RecoveryStrategyExecutor> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize built-in recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Strategy 1: Retry with exponential backoff
    this.registerStrategy({
      name: 'exponential_backoff_retry',
      description: 'Retry operation with exponential backoff',
      applicable_errors: [
        'NetworkError',
        'TimeoutError',
        'ConnectionError',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ],
      max_attempts: 3,
      backoff_ms: 1000,
      success_rate: 0.85,
      last_used: 0,
    }, async (error, context) => {
      const { operation, attempt, maxAttempts } = context;

      if (attempt >= maxAttempts) {
        return false;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        await operation();
        return true;
      } catch (retryError) {
        return false;
      }
    });

    // Strategy 2: Clear cache and retry
    this.registerStrategy({
      name: 'clear_cache_retry',
      description: 'Clear cache and retry operation',
      applicable_errors: ['CacheCorruption', 'StaleCache', 'InvalidCacheData'],
      max_attempts: 2,
      backoff_ms: 500,
      success_rate: 0.75,
      last_used: 0,
    }, async (error, context) => {
      const { operation, cacheKey } = context;

      // Clear relevant cache
      if (cacheKey) {
        await cacheManager.del(cacheKey);
      } else {
        // Clear pattern-based cache
        await cacheManager.invalidatePattern('*');
      }

      try {
        await operation();
        return true;
      } catch (retryError) {
        return false;
      }
    });

    // Strategy 3: Reduce scope and retry
    this.registerStrategy({
      name: 'reduce_scope_retry',
      description: 'Reduce operation scope and retry',
      applicable_errors: [
        'TooManyRows',
        'QueryTooComplex',
        'PayloadTooLarge',
        'MemoryExhausted',
      ],
      max_attempts: 2,
      backoff_ms: 1000,
      success_rate: 0.7,
      last_used: 0,
    }, async (error, context) => {
      const { operation, reduceScope } = context;

      if (!reduceScope) {
        return false;
      }

      try {
        const reducedOperation = await reduceScope();
        await reducedOperation();
        return true;
      } catch (retryError) {
        return false;
      }
    });

    // Strategy 4: Switch to fallback service
    this.registerStrategy({
      name: 'fallback_service',
      description: 'Switch to fallback service/provider',
      applicable_errors: ['ServiceUnavailable', 'RateLimitExceeded', 'QuotaExceeded'],
      max_attempts: 1,
      backoff_ms: 0,
      success_rate: 0.9,
      last_used: 0,
    }, async (error, context) => {
      const { fallbackOperation } = context;

      if (!fallbackOperation) {
        return false;
      }

      try {
        await fallbackOperation();
        return true;
      } catch (fallbackError) {
        return false;
      }
    });

    // Strategy 5: Reset circuit breaker
    this.registerStrategy({
      name: 'reset_circuit_breaker',
      description: 'Reset circuit breaker and retry',
      applicable_errors: ['CircuitBreakerError'],
      max_attempts: 1,
      backoff_ms: 5000,
      success_rate: 0.65,
      last_used: 0,
    }, async (error, context) => {
      const { operation } = context;

      // Reset circuit breaker
      cacheManager.resetCircuitBreaker();

      // Wait for services to stabilize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      try {
        await operation();
        return true;
      } catch (retryError) {
        return false;
      }
    });
  }

  /**
   * Register a custom recovery strategy
   */
  registerStrategy(
    strategy: RecoveryStrategy,
    executor: RecoveryStrategyExecutor
  ): void {
    this.recoveryStrategies.set(strategy.name, strategy);
    this.strategyExecutors.set(strategy.name, executor);
  }

  /**
   * Enable self-healing for a workspace
   */
  async enable(workspaceId: string): Promise<void> {
    this.enabled.set(workspaceId, true);

    // Start health monitoring
    this.startHealthMonitoring(workspaceId);

    console.log(`[SelfHealing] Enabled for workspace: ${workspaceId}`);
  }

  /**
   * Disable self-healing for a workspace
   */
  disable(workspaceId: string): void {
    this.enabled.set(workspaceId, false);
    console.log(`[SelfHealing] Disabled for workspace: ${workspaceId}`);
  }

  /**
   * Check if self-healing is enabled
   */
  isEnabled(workspaceId: string): boolean {
    return this.enabled.get(workspaceId) === true;
  }

  /**
   * Execute operation with self-healing protection
   */
  async executeWithHealing<T>(
    taskType: TaskType,
    operation: () => Promise<T>,
    context: {
      workspaceId: string;
      agentId: string;
      description: string;
      fallbackOperation?: () => Promise<T>;
      reduceScope?: () => Promise<() => Promise<T>>;
      cacheKey?: string;
    }
  ): Promise<T> {
    const { workspaceId, agentId, description } = context;

    if (!this.isEnabled(workspaceId)) {
      return await operation();
    }

    // Start execution tracking
    const execution = await executionFeedback.startExecution({
      agentId: agentId as any,
      taskType,
      taskDescription: description,
      workspaceId,
    });

    let lastError: Error | undefined;
    let attemptCount = 0;

    // Try operation with recovery strategies
    while (attemptCount < 5) {
      // Max 5 total attempts across all strategies
      try {
        const result = await operation();

        // Success!
        await execution.finish({
          success: true,
          outputs: { result },
          metadata: { attempts: attemptCount + 1 },
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        attemptCount++;

        console.log(
          `[SelfHealing] Operation failed (attempt ${attemptCount}):`,
          error instanceof Error ? error.message : error
        );

        // Find applicable recovery strategy
        const strategy = this.findRecoveryStrategy(error as Error);

        if (!strategy) {
          // No recovery strategy available
          break;
        }

        // Attempt recovery
        const recovered = await this.executeRecoveryStrategy(
          strategy,
          error as Error,
          {
            ...context,
            operation,
            attempt: attemptCount,
            maxAttempts: strategy.max_attempts,
          }
        );

        if (recovered) {
          // Recovery successful, record it
          this.recordHealingAction({
            id: `healing_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            workspace_id: workspaceId,
            issue_detected: (error as Error).name,
            recovery_strategy: strategy.name,
            success: true,
            duration_ms: 0,
            details: { attempts: attemptCount },
          });

          // Try operation again after recovery
          continue;
        } else {
          // Recovery failed
          this.recordHealingAction({
            id: `healing_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            workspace_id: workspaceId,
            issue_detected: (error as Error).name,
            recovery_strategy: strategy.name,
            success: false,
            duration_ms: 0,
            details: { attempts: attemptCount },
          });

          // Try next strategy or fail
        }
      }
    }

    // All recovery attempts failed
    await execution.finish({
      success: false,
      error: lastError,
      metadata: { attempts: attemptCount, recovery_failed: true },
    });

    throw lastError || new Error('Operation failed after all recovery attempts');
  }

  /**
   * Find applicable recovery strategy for an error
   */
  private findRecoveryStrategy(error: Error): RecoveryStrategy | null {
    const errorName = error.name;
    const errorMessage = error.message;

    // Find strategies applicable to this error
    const applicableStrategies = Array.from(this.recoveryStrategies.values()).filter(
      (strategy) =>
        strategy.applicable_errors.some(
          (pattern) =>
            errorName.includes(pattern) || errorMessage.includes(pattern)
        )
    );

    if (applicableStrategies.length === 0) {
      return null;
    }

    // Sort by success rate and recency
    applicableStrategies.sort((a, b) => {
      const scoreA = a.success_rate - (Date.now() - a.last_used) / 1000000;
      const scoreB = b.success_rate - (Date.now() - b.last_used) / 1000000;
      return scoreB - scoreA;
    });

    return applicableStrategies[0];
  }

  /**
   * Execute a recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    error: Error,
    context: any
  ): Promise<boolean> {
    const executor = this.strategyExecutors.get(strategy.name);

    if (!executor) {
      console.error(`[SelfHealing] No executor for strategy: ${strategy.name}`);
      return false;
    }

    console.log(`[SelfHealing] Executing recovery strategy: ${strategy.name}`);

    try {
      const success = await executor(error, context);

      // Update strategy last used time
      strategy.last_used = Date.now();

      // Update success rate (exponential moving average)
      const alpha = 0.2;
      strategy.success_rate =
        alpha * (success ? 1 : 0) + (1 - alpha) * strategy.success_rate;

      return success;
    } catch (recoveryError) {
      console.error(
        `[SelfHealing] Recovery strategy failed:`,
        recoveryError
      );
      return false;
    }
  }

  /**
   * Record healing action
   */
  private recordHealingAction(action: HealingAction): void {
    this.healingHistory.push(action);

    // Keep only last 100 actions
    if (this.healingHistory.length > 100) {
      this.healingHistory = this.healingHistory.slice(-100);
    }

    // Record to APM
    apm.incrementCounter('self_healing.actions', 1, {
      success: String(action.success),
      strategy: action.recovery_strategy,
    });
  }

  /**
   * Detect health issues proactively
   */
  async detectHealthIssues(workspaceId: string): Promise<HealthIssue[]> {
    const issues: HealthIssue[] = [];

    // Check system health
    const health = await healthCheckManager.checkAll();

    health.checks.forEach((check) => {
      if (check.status === 'unhealthy') {
        issues.push({
          severity: 'high',
          component: check.name,
          description: check.error || 'Component unhealthy',
          detected_at: Date.now(),
          auto_recoverable: this.isRecoverable(check),
          recovery_strategy: this.getRecoveryStrategyForComponent(check.name),
        });
      } else if (check.status === 'degraded') {
        issues.push({
          severity: 'medium',
          component: check.name,
          description: check.error || 'Component degraded',
          detected_at: Date.now(),
          auto_recoverable: this.isRecoverable(check),
          recovery_strategy: this.getRecoveryStrategyForComponent(check.name),
        });
      }
    });

    // Check for patterns indicating potential issues
    const patterns = await patternAnalyzer.detectPatterns(workspaceId, {
      types: ['anomaly', 'failure_cause'],
      minConfidence: 0.7,
    });

    patterns.forEach((pattern) => {
      if (pattern.type === 'anomaly' && 'severity' in pattern) {
        const anomaly = pattern as any;

        issues.push({
          severity: anomaly.severity,
          component: 'performance',
          description: pattern.description,
          detected_at: pattern.detected_at,
          auto_recoverable: false,
          recovery_strategy: 'monitor_and_alert',
        });
      }
    });

    return issues;
  }

  /**
   * Auto-remediate detected issues
   */
  async autoRemediate(workspaceId: string): Promise<number> {
    const issues = await this.detectHealthIssues(workspaceId);
    let remediatedCount = 0;

    for (const issue of issues) {
      if (!issue.auto_recoverable || !issue.recovery_strategy) {
        continue;
      }

      const strategy = this.recoveryStrategies.get(issue.recovery_strategy);

      if (!strategy) {
        continue;
      }

      console.log(
        `[SelfHealing] Auto-remediating ${issue.component}: ${issue.description}`
      );

      const success = await this.executeRecoveryStrategy(
        strategy,
        new Error(issue.description),
        { workspaceId, component: issue.component }
      );

      if (success) {
        remediatedCount++;

        this.recordHealingAction({
          id: `auto_remediate_${Date.now()}`,
          timestamp: Date.now(),
          workspace_id: workspaceId,
          issue_detected: issue.description,
          recovery_strategy: strategy.name,
          success: true,
          duration_ms: 0,
          details: { component: issue.component, severity: issue.severity },
        });
      }
    }

    return remediatedCount;
  }

  /**
   * Start health monitoring for a workspace
   */
  private startHealthMonitoring(workspaceId: string): void {
    // Run health check every 5 minutes
    setInterval(async () => {
      if (!this.isEnabled(workspaceId)) {
        return;
      }

      const remediatedCount = await this.autoRemediate(workspaceId);

      if (remediatedCount > 0) {
        console.log(
          `[SelfHealing] Auto-remediated ${remediatedCount} issue(s) for workspace: ${workspaceId}`
        );
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a component is auto-recoverable
   */
  private isRecoverable(check: ComponentHealth): boolean {
    // Redis circuit breaker can be reset
    if (check.name === 'redis' && check.details?.circuit_breaker) {
      return true;
    }

    // Other components may have recovery strategies
    return false;
  }

  /**
   * Get recovery strategy for a component
   */
  private getRecoveryStrategyForComponent(component: string): string | undefined {
    const strategyMap: Record<string, string> = {
      redis: 'reset_circuit_breaker',
      database: 'exponential_backoff_retry',
      ai_service: 'fallback_service',
    };

    return strategyMap[component];
  }

  /**
   * Get healing history
   */
  getHealingHistory(limit: number = 50): HealingAction[] {
    return this.healingHistory.slice(-limit);
  }

  /**
   * Get recovery strategies
   */
  getRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values());
  }
}

// Singleton instance
export const selfHealing = new SelfHealingSystem();

// Export types and classes
export { SelfHealingSystem };
