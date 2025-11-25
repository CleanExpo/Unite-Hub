/**
 * Strategy Execution Engine
 * Phase 4: Task 1 - Backend Architecture
 *
 * Core engine for autonomous strategy execution with:
 * - L4 task decomposition to agent steps
 * - Multi-agent orchestration
 * - Real-time health monitoring
 * - Execution state management
 * - Failure recovery and retry logic
 *
 * @module lib/strategy/execution-engine
 */

import { supabaseAdmin } from '@/lib/supabase';
import { AgentTaskPropagator } from './agent-task-propagator';
import { ExecutionHealthMonitor } from './execution-health-monitor';
import type { Database } from '@/lib/types/database';

// Type definitions
export type ExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type AgentType = 'email' | 'content' | 'research' | 'scheduling' | 'analysis' | 'coordination';

export interface ExecutionConfig {
  strategyId: string;
  workspaceId: string;
  userId: string;
  autoRetry?: boolean;
  maxRetries?: number;
  executionTimeoutMs?: number;
  healthCheckIntervalMs?: number;
}

export interface ExecutionContext {
  executionId: string;
  strategyId: string;
  workspaceId: string;
  userId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  health: {
    score: number;
    lastChecked: Date;
    issues: string[];
  };
}

export interface AgentTask {
  taskId: string;
  l4ItemId: string;
  agentType: AgentType;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  description: string;
  dependencies: string[];
  assignedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionMetrics {
  executionId: string;
  totalDuration: number;
  tasksPerAgent: Record<AgentType, number>;
  averageTaskDuration: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  healthScore: number;
}

/**
 * Main Strategy Execution Engine
 * Orchestrates autonomous execution of strategy L4 tasks
 */
export class StrategyExecutionEngine {
  private config: ExecutionConfig;
  private context?: ExecutionContext;
  private propagator: AgentTaskPropagator;
  private healthMonitor: ExecutionHealthMonitor;
  private activeExecutions: Map<string, ExecutionContext> = new Map();

  constructor(config: ExecutionConfig) {
    this.config = {
      autoRetry: true,
      maxRetries: 3,
      executionTimeoutMs: 3600000, // 1 hour
      healthCheckIntervalMs: 30000, // 30 seconds
      ...config,
    };

    this.propagator = new AgentTaskPropagator(config.workspaceId);
    this.healthMonitor = new ExecutionHealthMonitor(config.workspaceId);
  }

  /**
   * Initialize and start strategy execution
   * @throws {Error} If strategy not found or already executing
   */
  async initializeExecution(): Promise<ExecutionContext> {
    try {
      // Fetch strategy details
      const { data: strategy, error: strategyError } = await supabaseAdmin
        .from('hierarchical_strategies')
        .select('id, title, status, l4_tasks')
        .eq('id', this.config.strategyId)
        .eq('workspace_id', this.config.workspaceId)
        .single();

      if (strategyError || !strategy) {
        throw new Error(`Strategy not found: ${this.config.strategyId}`);
      }

      // Check if already executing
      if (this.activeExecutions.has(this.config.strategyId)) {
        throw new Error(`Execution already in progress for strategy: ${this.config.strategyId}`);
      }

      // Create execution record
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.context = {
        executionId,
        strategyId: this.config.strategyId,
        workspaceId: this.config.workspaceId,
        userId: this.config.userId,
        status: 'pending',
        startedAt: new Date(),
        totalTasks: strategy.l4_tasks?.length || 0,
        completedTasks: 0,
        failedTasks: 0,
        health: {
          score: 100,
          lastChecked: new Date(),
          issues: [],
        },
      };

      // Store in database
      const { error: insertError } = await supabaseAdmin
        .from('strategy_executions')
        .insert({
          id: executionId,
          strategy_id: this.config.strategyId,
          workspace_id: this.config.workspaceId,
          user_id: this.config.userId,
          status: 'pending',
          started_at: this.context.startedAt,
          total_tasks: this.context.totalTasks,
          completed_tasks: 0,
          failed_tasks: 0,
          metrics: {},
        });

      if (insertError) throw insertError;

      this.activeExecutions.set(this.config.strategyId, this.context);

      return this.context;
    } catch (error) {
      console.error('Execution initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start execution of strategy
   */
  async startExecution(): Promise<void> {
    if (!this.context) {
      throw new Error('Execution not initialized. Call initializeExecution() first');
    }

    try {
      // Update status to running
      this.context.status = 'running';

      const { error: updateError } = await supabaseAdmin
        .from('strategy_executions')
        .update({ status: 'running' })
        .eq('id', this.context.executionId);

      if (updateError) throw updateError;

      // Propagate L4 tasks to agent tasks
      const tasks = await this.propagator.propagateTasks(
        this.config.strategyId,
        this.context.executionId
      );

      console.log(`[Execution ${this.context.executionId}] Propagated ${tasks.length} tasks for execution`);

      // Start health monitoring
      this.startHealthMonitoring();

      // Process tasks in order
      await this.processTaskQueue();
    } catch (error) {
      this.context.status = 'failed';
      console.error('Execution failed:', error);
      throw error;
    }
  }

  /**
   * Process task queue in dependency order
   */
  private async processTaskQueue(): Promise<void> {
    if (!this.context) return;

    try {
      // Fetch all tasks for this execution
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('agent_tasks')
        .select('*')
        .eq('execution_id', this.context.executionId)
        .order('priority', { ascending: false });

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return;

      // Build dependency graph
      const taskMap = new Map(tasks.map((t) => [t.id, t]));
      const processed = new Set<string>();

      // Process tasks respecting dependencies
      for (const task of tasks) {
        await this.processTask(task, taskMap, processed);
      }

      // Update execution status
      this.context.status = 'completed';
      this.context.completedAt = new Date();

      const { error: updateError } = await supabaseAdmin
        .from('strategy_executions')
        .update({
          status: 'completed',
          completed_at: this.context.completedAt,
          completed_tasks: this.context.completedTasks,
        })
        .eq('id', this.context.executionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Task queue processing failed:', error);
      throw error;
    }
  }

  /**
   * Process individual task with dependency checking
   */
  private async processTask(
    task: any,
    taskMap: Map<string, any>,
    processed: Set<string>
  ): Promise<void> {
    if (!this.context) return;

    // Check if already processed
    if (processed.has(task.id)) return;

    // Check dependencies
    const dependencies = task.dependencies || [];
    for (const depId of dependencies) {
      const depTask = taskMap.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        // Wait for dependency or skip
        console.warn(`[${this.context.executionId}] Dependency ${depId} not completed for task ${task.id}`);
        return;
      }
    }

    try {
      // Update task status
      await supabaseAdmin
        .from('agent_tasks')
        .update({ status: 'in_progress', assigned_at: new Date() })
        .eq('id', task.id);

      // Execute task based on agent type
      const result = await this.executeAgentTask(task);

      // Update task with result
      await supabaseAdmin
        .from('agent_tasks')
        .update({
          status: 'completed',
          result,
          completed_at: new Date(),
        })
        .eq('id', task.id);

      this.context.completedTasks++;
      processed.add(task.id);

      console.log(`[${this.context.executionId}] Task ${task.id} completed`);
    } catch (error) {
      // Handle task failure
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (this.config.autoRetry && task.retry_count < (task.max_retries || this.config.maxRetries!)) {
        console.log(
          `[${this.context.executionId}] Retrying task ${task.id} (attempt ${task.retry_count + 1}/${task.max_retries})`
        );

        // Increment retry count
        await supabaseAdmin
          .from('agent_tasks')
          .update({ retry_count: (task.retry_count || 0) + 1 })
          .eq('id', task.id);

        // Retry task
        await new Promise((resolve) => setTimeout(resolve, 1000 * (task.retry_count + 1)));
        return this.processTask(
          { ...task, retry_count: (task.retry_count || 0) + 1 },
          taskMap,
          processed
        );
      } else {
        // Mark as failed
        await supabaseAdmin
          .from('agent_tasks')
          .update({
            status: 'failed',
            error: errorMessage,
            completed_at: new Date(),
          })
          .eq('id', task.id);

        this.context.failedTasks++;
        this.context.health.issues.push(`Task ${task.id} failed: ${errorMessage}`);

        console.error(`[${this.context.executionId}] Task ${task.id} failed:`, errorMessage);
      }
    }
  }

  /**
   * Execute agent task based on type
   */
  private async executeAgentTask(task: any): Promise<unknown> {
    const { agent_type: agentType } = task;

    switch (agentType) {
      case 'email':
        return this.executeEmailAgent(task);
      case 'content':
        return this.executeContentAgent(task);
      case 'research':
        return this.executeResearchAgent(task);
      case 'scheduling':
        return this.executeSchedulingAgent(task);
      case 'analysis':
        return this.executeAnalysisAgent(task);
      case 'coordination':
        return this.executeCoordinationAgent(task);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  private async executeEmailAgent(task: any): Promise<unknown> {
    // Delegate to email agent
    console.log(`[EmailAgent] Processing task ${task.id}: ${task.description}`);
    // Implementation in Phase 4 Task 2
    return { status: 'executed', agentType: 'email' };
  }

  private async executeContentAgent(task: any): Promise<unknown> {
    // Delegate to content agent
    console.log(`[ContentAgent] Processing task ${task.id}: ${task.description}`);
    // Implementation in Phase 4 Task 2
    return { status: 'executed', agentType: 'content' };
  }

  private async executeResearchAgent(task: any): Promise<unknown> {
    console.log(`[ResearchAgent] Processing task ${task.id}: ${task.description}`);
    return { status: 'executed', agentType: 'research' };
  }

  private async executeSchedulingAgent(task: any): Promise<unknown> {
    console.log(`[SchedulingAgent] Processing task ${task.id}: ${task.description}`);
    return { status: 'executed', agentType: 'scheduling' };
  }

  private async executeAnalysisAgent(task: any): Promise<unknown> {
    console.log(`[AnalysisAgent] Processing task ${task.id}: ${task.description}`);
    return { status: 'executed', agentType: 'analysis' };
  }

  private async executeCoordinationAgent(task: any): Promise<unknown> {
    console.log(`[CoordinationAgent] Processing task ${task.id}: ${task.description}`);
    return { status: 'executed', agentType: 'coordination' };
  }

  /**
   * Start health monitoring loop
   */
  private startHealthMonitoring(): void {
    if (!this.context) return;

    const monitoringInterval = setInterval(async () => {
      if (!this.context || this.context.status !== 'running') {
        clearInterval(monitoringInterval);
        return;
      }

      const health = await this.healthMonitor.checkHealth(this.context.executionId);
      this.context.health = health;

      // Update in database
      await supabaseAdmin
        .from('strategy_executions')
        .update({ health_metrics: health })
        .eq('id', this.context.executionId);
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Pause execution
   */
  async pauseExecution(): Promise<void> {
    if (!this.context) throw new Error('No execution in progress');

    this.context.status = 'paused';

    const { error } = await supabaseAdmin
      .from('strategy_executions')
      .update({ status: 'paused' })
      .eq('id', this.context.executionId);

    if (error) throw error;
  }

  /**
   * Resume paused execution
   */
  async resumeExecution(): Promise<void> {
    if (!this.context) throw new Error('No execution in progress');

    this.context.status = 'running';

    const { error } = await supabaseAdmin
      .from('strategy_executions')
      .update({ status: 'running' })
      .eq('id', this.context.executionId);

    if (error) throw error;

    // Continue processing
    await this.processTaskQueue();
  }

  /**
   * Cancel execution
   */
  async cancelExecution(): Promise<void> {
    if (!this.context) throw new Error('No execution in progress');

    this.context.status = 'cancelled';
    this.context.completedAt = new Date();

    const { error } = await supabaseAdmin
      .from('strategy_executions')
      .update({
        status: 'cancelled',
        completed_at: this.context.completedAt,
      })
      .eq('id', this.context.executionId);

    if (error) throw error;

    this.activeExecutions.delete(this.config.strategyId);
  }

  /**
   * Get current execution metrics
   */
  async getMetrics(): Promise<ExecutionMetrics> {
    if (!this.context) {
      throw new Error('No execution in progress');
    }

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('agent_tasks')
      .select('*')
      .eq('execution_id', this.context.executionId);

    if (tasksError) throw tasksError;

    const startTime = this.context.startedAt.getTime();
    const endTime = this.context.completedAt?.getTime() || Date.now();
    const totalDuration = endTime - startTime;

    // Calculate metrics by agent type
    const tasksPerAgent: Record<AgentType, number> = {
      email: 0,
      content: 0,
      research: 0,
      scheduling: 0,
      analysis: 0,
      coordination: 0,
    };

    let totalTaskDuration = 0;

    for (const task of tasks || []) {
      tasksPerAgent[task.agent_type as AgentType]++;

      if (task.completed_at) {
        const taskStart = new Date(task.assigned_at).getTime();
        const taskEnd = new Date(task.completed_at).getTime();
        totalTaskDuration += taskEnd - taskStart;
      }
    }

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
    const failedTasks = tasks?.filter((t) => t.status === 'failed').length || 0;
    const retriedTasks = tasks?.filter((t) => (t.retry_count || 0) > 0).length || 0;

    return {
      executionId: this.context.executionId,
      totalDuration,
      tasksPerAgent,
      averageTaskDuration: totalTasks > 0 ? totalTaskDuration / totalTasks : 0,
      successRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      failureRate: totalTasks > 0 ? failedTasks / totalTasks : 0,
      retryRate: totalTasks > 0 ? retriedTasks / totalTasks : 0,
      healthScore: this.context.health.score,
    };
  }

  /**
   * Get execution status
   */
  getStatus(): ExecutionContext | undefined {
    return this.context;
  }

  /**
   * Cleanup execution
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      this.activeExecutions.delete(this.config.strategyId);
    }
  }
}

export default StrategyExecutionEngine;
