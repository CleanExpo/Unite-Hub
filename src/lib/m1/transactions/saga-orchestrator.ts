/**
 * M1 Saga Orchestrator
 *
 * Orchestrates distributed workflows with step execution,
 * compensation chains, and state persistence
 *
 * Version: v1.0.0
 * Phase: 23 - Distributed Transactions & Saga Patterns
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Saga step definition
 */
export interface SagaStep {
  stepId: string;
  name: string;
  action: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  compensation?: (data: Record<string, unknown>) => Promise<void>;
  timeout?: number; // milliseconds
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Saga definition with steps and compensations
 */
export interface SagaDefinition {
  sagaId: string;
  name: string;
  steps: SagaStep[];
  parallelSteps?: string[][]; // groups of step IDs that can run in parallel
  compensationOrder?: 'lifo' | 'custom'; // LIFO = Last In, First Out
  timeout?: number;
}

/**
 * Saga execution state
 */
export interface SagaInstanceState {
  instanceId: string;
  sagaId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated';
  executedSteps: string[];
  failedStep?: string;
  data: Record<string, unknown>;
  error?: Error;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: Error;
  durationMs: number;
  retryCount: number;
}

/**
 * Saga orchestrator for managing distributed workflows
 */
export class SagaOrchestrator {
  private sagaDefinitions: Map<string, SagaDefinition> = new Map();
  private sagaInstances: Map<string, SagaInstanceState> = new Map();
  private executionResults: Map<string, StepExecutionResult[]> = new Map();
  private compensationLocks: Map<string, boolean> = new Map();

  /**
   * Register saga definition
   */
  registerSaga(saga: SagaDefinition): string {
    this.sagaDefinitions.set(saga.sagaId, saga);
    return saga.sagaId;
  }

  /**
   * Get saga definition
   */
  getSagaDefinition(sagaId: string): SagaDefinition | null {
    return this.sagaDefinitions.get(sagaId) || null;
  }

  /**
   * Start saga execution
   */
  async startSaga(sagaId: string, initialData: Record<string, unknown> = {}): Promise<string> {
    const saga = this.sagaDefinitions.get(sagaId);
    if (!saga) {
      throw new Error(`Saga ${sagaId} not registered`);
    }

    const instanceId = `saga_${generateUUID()}`;
    const instance: SagaInstanceState = {
      instanceId,
      sagaId,
      status: 'running',
      executedSteps: [],
      data: { ...initialData },
      startedAt: Date.now(),
    };

    this.sagaInstances.set(instanceId, instance);
    this.executionResults.set(instanceId, []);

    // Execute saga steps
    await this.executeSagaSteps(instanceId, saga);

    return instanceId;
  }

  /**
   * Execute saga steps sequentially or in parallel
   */
  private async executeSagaSteps(instanceId: string, saga: SagaDefinition): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)!;
    const results = this.executionResults.get(instanceId)!;

    try {
      const stepMap = new Map(saga.steps.map((s) => [s.stepId, s]));

      // If no parallel groups defined, execute sequentially
      const executionGroups = saga.parallelSteps || saga.steps.map((s) => [s.stepId]);

      for (const group of executionGroups) {
        const groupPromises = group.map((stepId) => {
          const step = stepMap.get(stepId);
          if (!step) {
throw new Error(`Step ${stepId} not found`);
}

          return this.executeStep(instanceId, step, instance, results);
        });

        // Wait for all steps in group to complete
        await Promise.all(groupPromises);

        // Check for failures
        const failedResult = results.find((r) => !r.success);
        if (failedResult) {
          throw new Error(`Step ${failedResult.stepId} failed: ${failedResult.error?.message}`);
        }
      }

      instance.status = 'completed';
      instance.completedAt = Date.now();
      instance.durationMs = instance.completedAt - (instance.startedAt || 0);
    } catch (error) {
      instance.status = 'failed';
      instance.error = error instanceof Error ? error : new Error(String(error));
      instance.failedStep = results.find((r) => !r.success)?.stepId;

      // Trigger compensation
      await this.compensateSaga(instanceId, saga);
    }
  }

  /**
   * Execute single step with retry logic
   */
  private async executeStep(
    instanceId: string,
    step: SagaStep,
    instance: SagaInstanceState,
    results: StepExecutionResult[]
  ): Promise<void> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let retryCount = 0;
    const maxAttempts = step.retryPolicy?.maxAttempts || 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Apply timeout if specified
        const timeout = step.timeout || 30000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Step ${step.stepId} timeout after ${timeout}ms`)), timeout)
        );

        const resultPromise = Promise.resolve(step.action(instance.data));
        const result = await Promise.race([resultPromise, timeoutPromise]);

        // Merge result data
        instance.data = { ...instance.data, ...result };
        instance.executedSteps.push(step.stepId);

        const durationMs = Date.now() - startTime;
        results.push({
          stepId: step.stepId,
          success: true,
          result,
          durationMs,
          retryCount,
        });

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;

        // Apply backoff before retry
        if (attempt < maxAttempts - 1 && step.retryPolicy) {
          await new Promise((resolve) => setTimeout(resolve, step.retryPolicy!.backoffMs));
        }
      }
    }

    const durationMs = Date.now() - startTime;
    results.push({
      stepId: step.stepId,
      success: false,
      error: lastError,
      durationMs,
      retryCount,
    });

    throw lastError;
  }

  /**
   * Compensate saga on failure
   */
  private async compensateSaga(instanceId: string, saga: SagaDefinition): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)!;

    // Prevent concurrent compensation
    if (this.compensationLocks.get(instanceId)) {
      return;
    }
    this.compensationLocks.set(instanceId, true);

    try {
      instance.status = 'compensating';

      // Determine compensation order
      let compensationSteps = saga.steps.filter((s) => instance.executedSteps.includes(s.stepId));

      if (saga.compensationOrder === 'lifo') {
        // LIFO: reverse the order of executed steps
        compensationSteps = compensationSteps.reverse();
      }

      // Execute compensations
      for (const step of compensationSteps) {
        if (step.compensation) {
          try {
            await Promise.resolve(step.compensation(instance.data));
          } catch (error) {
            console.error(`Compensation for step ${step.stepId} failed:`, error);
            // Continue with other compensations
          }
        }
      }

      instance.status = 'compensated';
    } finally {
      this.compensationLocks.delete(instanceId);
    }
  }

  /**
   * Get saga instance state
   */
  getSagaInstance(instanceId: string): SagaInstanceState | null {
    return this.sagaInstances.get(instanceId) || null;
  }

  /**
   * Get execution results for saga
   */
  getExecutionResults(instanceId: string): StepExecutionResult[] {
    return this.executionResults.get(instanceId) || [];
  }

  /**
   * Get all saga instances
   */
  getAllInstances(filter?: { status?: SagaInstanceState['status']; sagaId?: string }): SagaInstanceState[] {
    let instances = Array.from(this.sagaInstances.values());

    if (filter?.status) {
      instances = instances.filter((i) => i.status === filter.status);
    }

    if (filter?.sagaId) {
      instances = instances.filter((i) => i.sagaId === filter.sagaId);
    }

    return instances;
  }

  /**
   * Get saga statistics
   */
  getStatistics(): Record<string, unknown> {
    const instances = Array.from(this.sagaInstances.values());
    const completed = instances.filter((i) => i.status === 'completed');
    const failed = instances.filter((i) => i.status === 'failed');
    const compensated = instances.filter((i) => i.status === 'compensated');

    const totalDuration = instances
      .filter((i) => i.durationMs)
      .reduce((sum, i) => sum + (i.durationMs || 0), 0);

    return {
      totalSagas: instances.length,
      completed: completed.length,
      failed: failed.length,
      compensated: compensated.length,
      successRate: instances.length > 0 ? (completed.length / instances.length) * 100 : 0,
      compensationRate: instances.length > 0 ? (compensated.length / instances.length) * 100 : 0,
      avgDurationMs: instances.length > 0 ? totalDuration / instances.length : 0,
      registeredSagas: this.sagaDefinitions.size,
    };
  }

  /**
   * Clear all instances
   */
  clear(): void {
    this.sagaInstances.clear();
    this.executionResults.clear();
    this.compensationLocks.clear();
  }

  /**
   * Shutdown orchestrator
   */
  shutdown(): void {
    this.sagaDefinitions.clear();
    this.clear();
  }
}

// Export singleton
export const sagaOrchestrator = new SagaOrchestrator();
