/**
 * Workflow Scheduler
 *
 * Background worker that processes waiting workflows
 * Run this as a cron job or background process
 *
 * @module lib/workflows/WorkflowScheduler
 */

import { createApiLogger } from '@/lib/logger';
import { WorkflowEngine } from './WorkflowEngine';
import { StateManager } from './StateManager';

const logger = createApiLogger({ service: 'WorkflowScheduler' });

export interface SchedulerConfig {
  batchSize?: number;
  pollingInterval?: number; // milliseconds
  maxConcurrency?: number;
  enableAutoRetry?: boolean;
}

export class WorkflowScheduler {
  private engine: WorkflowEngine;
  private stateManager: StateManager;
  private config: Required<SchedulerConfig>;
  private isRunning: boolean = false;
  private activePromises: Set<Promise<void>> = new Set();

  constructor(config: SchedulerConfig = {}) {
    this.config = {
      batchSize: config.batchSize ?? 100,
      pollingInterval: config.pollingInterval ?? 60000, // 1 minute
      maxConcurrency: config.maxConcurrency ?? 10,
      enableAutoRetry: config.enableAutoRetry ?? true,
    };

    this.engine = new WorkflowEngine({
      maxRetries: 3,
      retryDelayMs: 1000,
    });

    this.stateManager = new StateManager();
  }

  /**
   * Start scheduler (continuous polling)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Workflow scheduler started', {
      pollingInterval: this.config.pollingInterval,
      batchSize: this.config.batchSize,
    });

    while (this.isRunning) {
      try {
        await this.processWaitingWorkflows();
        await this.sleep(this.config.pollingInterval);
      } catch (error) {
        logger.error('Scheduler error', { error });
        await this.sleep(this.config.pollingInterval);
      }
    }
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    logger.info('Stopping workflow scheduler');
    this.isRunning = false;

    // Wait for active workflows to complete
    if (this.activePromises.size > 0) {
      logger.info('Waiting for active workflows to complete', {
        count: this.activePromises.size,
      });

      await Promise.all(Array.from(this.activePromises));
    }

    logger.info('Workflow scheduler stopped');
  }

  /**
   * Process waiting workflows (single run)
   */
  async processWaitingWorkflows(): Promise<void> {
    try {
      // Get workflows ready for execution
      const readyWorkflows = await this.stateManager.getReadyWorkflows(this.config.batchSize);

      if (readyWorkflows.length === 0) {
        logger.debug('No ready workflows found');
        return;
      }

      logger.info('Processing ready workflows', { count: readyWorkflows.length });

      // Process in batches based on concurrency limit
      const batches = this.chunk(readyWorkflows, this.config.maxConcurrency);

      for (const batch of batches) {
        await Promise.all(
          batch.map((workflow) => this.processWorkflow(workflow.id))
        );
      }

      logger.info('Batch processing complete', {
        processed: readyWorkflows.length,
      });
    } catch (error) {
      logger.error('Failed to process waiting workflows', { error });
      throw error;
    }
  }

  /**
   * Process single workflow
   */
  private async processWorkflow(workflowStateId: string): Promise<void> {
    const promise = this._processWorkflow(workflowStateId);
    this.activePromises.add(promise);

    try {
      await promise;
    } finally {
      this.activePromises.delete(promise);
    }
  }

  /**
   * Internal workflow processing
   */
  private async _processWorkflow(workflowStateId: string): Promise<void> {
    try {
      logger.info('Resuming workflow', { workflowStateId });

      await this.engine.resumeWorkflow(workflowStateId);

      logger.info('Workflow resumed successfully', { workflowStateId });
    } catch (error) {
      logger.error('Failed to resume workflow', {
        error,
        workflowStateId,
      });

      if (this.config.enableAutoRetry) {
        // Update workflow state to retry later
        const workflow = await this.stateManager.getWorkflowState(workflowStateId);

        if (workflow && workflow.retry_count < workflow.max_retries) {
          logger.info('Scheduling workflow for retry', {
            workflowStateId,
            retryCount: workflow.retry_count + 1,
          });

          // Set next execution time with exponential backoff
          const backoffMs = Math.pow(2, workflow.retry_count) * 60 * 1000; // Minutes
          const nextExecutionAt = new Date(Date.now() + backoffMs);

          await this.stateManager.updateWorkflowState(workflowStateId, {
            retry_count: workflow.retry_count + 1,
            next_execution_at: nextExecutionAt,
          });
        } else {
          logger.error('Workflow max retries exceeded', { workflowStateId });

          await this.stateManager.updateWorkflowState(workflowStateId, {
            workflow_status: 'failed',
            workflow_variables: {
              ...workflow?.workflow_variables,
              last_error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    activeWorkflows: number;
    config: SchedulerConfig;
  } {
    return {
      running: this.isRunning,
      activeWorkflows: this.activePromises.size,
      config: this.config,
    };
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// For direct execution as a worker process
if (require.main === module) {
  const scheduler = new WorkflowScheduler({
    batchSize: 100,
    pollingInterval: 60000, // 1 minute
    maxConcurrency: 10,
  });

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await scheduler.stop();
    process.exit(0);
  });

  // Start scheduler
  scheduler.start().catch((error) => {
    logger.error('Scheduler crashed', { error });
    process.exit(1);
  });
}
