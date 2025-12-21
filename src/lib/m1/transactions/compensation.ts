/**
 * M1 Compensation Engine
 *
 * Automatic rollback and compensation management for distributed transactions
 *
 * Version: v1.0.0
 * Phase: 23 - Distributed Transactions & Saga Patterns
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Compensation action
 */
export interface CompensationAction {
  actionId: string;
  sourceStepId: string;
  action: (data: Record<string, unknown>) => Promise<void>;
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Compensation execution result
 */
export interface CompensationResult {
  actionId: string;
  stepId: string;
  success: boolean;
  error?: Error;
  durationMs: number;
  retryCount: number;
  timestamp: number;
}

/**
 * Compensation engine for managing rollback and recovery
 */
export class CompensationEngine {
  private compensationActions: Map<string, CompensationAction> = new Map();
  private executionHistory: CompensationResult[] = [];
  private compensationChains: Map<string, string[]> = new Map(); // instanceId -> compensation action IDs
  private compensationLocks: Map<string, boolean> = new Map();

  /**
   * Register compensation action
   */
  registerCompensation(
    sourceStepId: string,
    action: (data: Record<string, unknown>) => Promise<void>,
    options?: { timeout?: number; retryPolicy?: { maxAttempts: number; backoffMs: number } }
  ): string {
    const actionId = `comp_${generateUUID()}`;

    const compensation: CompensationAction = {
      actionId,
      sourceStepId,
      action,
      timeout: options?.timeout || 30000,
      retryPolicy: options?.retryPolicy || { maxAttempts: 1, backoffMs: 100 },
    };

    this.compensationActions.set(actionId, compensation);
    return actionId;
  }

  /**
   * Add compensation to chain (LIFO order)
   */
  addToChain(instanceId: string, compensationId: string): void {
    if (!this.compensationChains.has(instanceId)) {
      this.compensationChains.set(instanceId, []);
    }

    // Add to front (LIFO - Last In, First Out)
    this.compensationChains.get(instanceId)!.unshift(compensationId);
  }

  /**
   * Execute compensation chain (in reverse order)
   */
  async executeChain(instanceId: string, data: Record<string, unknown>): Promise<CompensationResult[]> {
    // Prevent concurrent compensation
    if (this.compensationLocks.get(instanceId)) {
      throw new Error(`Compensation already running for ${instanceId}`);
    }

    this.compensationLocks.set(instanceId, true);
    const results: CompensationResult[] = [];

    try {
      const chain = this.compensationChains.get(instanceId) || [];

      // Execute in LIFO order (compensations already in reverse order)
      for (const compensationId of chain) {
        const result = await this.executeCompensation(compensationId, data);
        results.push(result);
        this.executionHistory.push(result);

        // Continue even if compensation fails
      }

      return results;
    } finally {
      this.compensationLocks.delete(instanceId);
    }
  }

  /**
   * Execute single compensation with retry
   */
  private async executeCompensation(
    compensationId: string,
    data: Record<string, unknown>
  ): Promise<CompensationResult> {
    const compensation = this.compensationActions.get(compensationId);
    if (!compensation) {
      throw new Error(`Compensation ${compensationId} not found`);
    }

    const startTime = Date.now();
    let lastError: Error | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt < compensation.retryPolicy!.maxAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Compensation timeout after ${compensation.timeout}ms`)), compensation.timeout)
        );

        const actionPromise = Promise.resolve(compensation.action(data));
        await Promise.race([actionPromise, timeoutPromise]);

        const durationMs = Date.now() - startTime;
        return {
          actionId: compensationId,
          stepId: compensation.sourceStepId,
          success: true,
          durationMs,
          retryCount,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;

        // Backoff before retry
        if (attempt < compensation.retryPolicy!.maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, compensation.retryPolicy!.backoffMs));
        }
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      actionId: compensationId,
      stepId: compensation.sourceStepId,
      success: false,
      error: lastError,
      durationMs,
      retryCount,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute partial compensation (specific steps only)
   */
  async partialCompensate(
    instanceId: string,
    compensationIds: string[],
    data: Record<string, unknown>
  ): Promise<CompensationResult[]> {
    if (this.compensationLocks.get(instanceId)) {
      throw new Error(`Compensation already running for ${instanceId}`);
    }

    this.compensationLocks.set(instanceId, true);
    const results: CompensationResult[] = [];

    try {
      for (const compensationId of compensationIds) {
        const result = await this.executeCompensation(compensationId, data);
        results.push(result);
        this.executionHistory.push(result);
      }

      return results;
    } finally {
      this.compensationLocks.delete(instanceId);
    }
  }

  /**
   * Get compensation history
   */
  getHistory(filter?: { instanceId?: string; stepId?: string; success?: boolean }): CompensationResult[] {
    let history = [...this.executionHistory];

    if (filter?.stepId) {
      history = history.filter((r) => r.stepId === filter.stepId);
    }

    if (filter?.success !== undefined) {
      history = history.filter((r) => r.success === filter.success);
    }

    return history;
  }

  /**
   * Get compensation status
   */
  getStatus(instanceId: string): {
    isLocked: boolean;
    chainLength: number;
    pendingCompensations: number;
  } {
    return {
      isLocked: this.compensationLocks.get(instanceId) || false,
      chainLength: this.compensationChains.get(instanceId)?.length || 0,
      pendingCompensations: this.compensationChains.get(instanceId)?.length || 0,
    };
  }

  /**
   * Clear compensation chain
   */
  clearChain(instanceId: string): void {
    this.compensationChains.delete(instanceId);
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, unknown> {
    const successful = this.executionHistory.filter((r) => r.success);
    const failed = this.executionHistory.filter((r) => !r.success);

    const totalDuration = this.executionHistory.reduce((sum, r) => sum + r.durationMs, 0);
    const avgDuration = this.executionHistory.length > 0 ? totalDuration / this.executionHistory.length : 0;
    const avgRetries = this.executionHistory.length > 0 ? this.executionHistory.reduce((sum, r) => sum + r.retryCount, 0) / this.executionHistory.length : 0;

    return {
      totalCompensations: this.executionHistory.length,
      successful: successful.length,
      failed: failed.length,
      successRate: this.executionHistory.length > 0 ? (successful.length / this.executionHistory.length) * 100 : 0,
      avgDurationMs: Math.round(avgDuration * 100) / 100,
      avgRetries: Math.round(avgRetries * 100) / 100,
      registeredActions: this.compensationActions.size,
      activeChains: this.compensationChains.size,
    };
  }

  /**
   * Clear all history and chains
   */
  clear(): void {
    this.executionHistory = [];
    this.compensationChains.clear();
    this.compensationLocks.clear();
  }

  /**
   * Shutdown engine
   */
  shutdown(): void {
    this.compensationActions.clear();
    this.clear();
  }
}

// Export singleton
export const compensationEngine = new CompensationEngine();
