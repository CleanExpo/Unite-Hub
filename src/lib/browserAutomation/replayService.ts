/**
 * Replay Service
 *
 * Manages replayable browser automation tasks.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ReplayTask,
  ReplayRun,
  ReplayStep,
  ReplayStatus,
  StepResult,
  ReplayVariable,
  ReplayAssertion,
} from './browserTypes';
import { browserAutomationConfig } from '../../../config/browserAutomationBoost.config';

export interface CreateTaskOptions {
  name: string;
  description?: string;
  startUrl: string;
  steps: ReplayStep[];
  variables?: Record<string, ReplayVariable>;
  assertions?: ReplayAssertion[];
  retryConfig?: ReplayTask['retryConfig'];
  scheduleConfig?: ReplayTask['scheduleConfig'];
  notifyOnComplete?: boolean;
  notifyOnFail?: boolean;
  createdBy?: string;
}

export interface RunTaskOptions {
  variables?: Record<string, unknown>;
  headless?: boolean;
  timeout?: number;
  triggeredBy?: 'manual' | 'schedule' | 'api';
}

export interface TaskFilters {
  search?: string;
  hasSchedule?: boolean;
  lastRunStatus?: ReplayStatus;
}

class ReplayService {
  private config = browserAutomationConfig.replayTasks;

  /**
   * Create a new replay task
   */
  async createTask(
    workspaceId: string,
    options: CreateTaskOptions
  ): Promise<ReplayTask> {
    const supabase = await getSupabaseServer();

    const { data: task, error } = await supabase
      .from('browser_replay_tasks')
      .insert({
        workspace_id: workspaceId,
        name: options.name,
        description: options.description,
        start_url: options.startUrl,
        steps: options.steps,
        variables: options.variables,
        assertions: options.assertions,
        retry_config: options.retryConfig || {
          maxRetries: this.config.maxRetries,
          retryDelayMs: 2000,
          continueOnFail: false,
        },
        schedule_config: options.scheduleConfig,
        notify_on_complete: options.notifyOnComplete ?? false,
        notify_on_fail: options.notifyOnFail ?? true,
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapTaskFromDb(task);
  }

  /**
   * Get a task by ID
   */
  async getTask(taskId: string): Promise<ReplayTask | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_replay_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapTaskFromDb(data);
  }

  /**
   * Get all tasks for a workspace
   */
  async getTasks(
    workspaceId: string,
    filters: TaskFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ tasks: ReplayTask[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('browser_replay_tasks')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.hasSchedule !== undefined) {
      if (filters.hasSchedule) {
        query = query.not('schedule_config', 'is', null);
      } else {
        query = query.is('schedule_config', null);
      }
    }

    if (filters.lastRunStatus) {
      query = query.eq('last_run_status', filters.lastRunStatus);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      tasks: (data || []).map(this.mapTaskFromDb),
      total: count || 0,
    };
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    updates: Partial<CreateTaskOptions>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) {
dbUpdates.name = updates.name;
}
    if (updates.description !== undefined) {
dbUpdates.description = updates.description;
}
    if (updates.startUrl) {
dbUpdates.start_url = updates.startUrl;
}
    if (updates.steps) {
dbUpdates.steps = updates.steps;
}
    if (updates.variables) {
dbUpdates.variables = updates.variables;
}
    if (updates.assertions) {
dbUpdates.assertions = updates.assertions;
}
    if (updates.retryConfig) {
dbUpdates.retry_config = updates.retryConfig;
}
    if (updates.scheduleConfig !== undefined) {
dbUpdates.schedule_config = updates.scheduleConfig;
}
    if (updates.notifyOnComplete !== undefined) {
dbUpdates.notify_on_complete = updates.notifyOnComplete;
}
    if (updates.notifyOnFail !== undefined) {
dbUpdates.notify_on_fail = updates.notifyOnFail;
}

    const { error } = await supabase
      .from('browser_replay_tasks')
      .update(dbUpdates)
      .eq('id', taskId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('browser_replay_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw error;
    }
  }

  /**
   * Execute a replay task
   */
  async runTask(
    taskId: string,
    options: RunTaskOptions = {}
  ): Promise<ReplayRun> {
    const supabase = await getSupabaseServer();
    const task = await this.getTask(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    // Create run record
    const { data: run, error: runError } = await supabase
      .from('browser_replay_runs')
      .insert({
        task_id: taskId,
        workspace_id: task.workspaceId,
        status: 'running' as ReplayStatus,
        started_at: new Date().toISOString(),
        step_results: [],
        retry_count: 0,
        triggered_by: options.triggeredBy || 'manual',
      })
      .select()
      .single();

    if (runError) {
      throw runError;
    }

    // In production, this would spawn a browser and execute steps
    // For now, simulate execution
    const stepResults: StepResult[] = [];
    const startTime = Date.now();

    try {
      for (const step of task.steps) {
        const stepStart = Date.now();

        // Simulate step execution
        const result: StepResult = {
          stepOrder: step.order,
          action: step.action,
          status: 'success',
          durationMs: Math.random() * 500 + 100,
        };

        stepResults.push(result);
      }

      // Run assertions
      const assertionsPassed = this.runAssertions(task.assertions || []);

      const completedAt = new Date();
      const status: ReplayStatus = assertionsPassed ? 'completed' : 'failed';

      await supabase
        .from('browser_replay_runs')
        .update({
          status,
          completed_at: completedAt.toISOString(),
          duration_ms: Date.now() - startTime,
          step_results: stepResults,
        })
        .eq('id', run.id);

      // Update task with last run info
      await supabase
        .from('browser_replay_tasks')
        .update({
          last_run_at: completedAt.toISOString(),
          last_run_status: status,
        })
        .eq('id', taskId);

      return this.mapRunFromDb({
        ...run,
        status,
        completed_at: completedAt.toISOString(),
        duration_ms: Date.now() - startTime,
        step_results: stepResults,
      });
    } catch (error) {
      const errorMessage = String(error);

      await supabase
        .from('browser_replay_runs')
        .update({
          status: 'failed' as ReplayStatus,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          step_results: stepResults,
          error_message: errorMessage,
          error_step: stepResults.length,
        })
        .eq('id', run.id);

      await supabase
        .from('browser_replay_tasks')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'failed' as ReplayStatus,
        })
        .eq('id', taskId);

      throw error;
    }
  }

  /**
   * Get run history for a task
   */
  async getRunHistory(
    taskId: string,
    limit = 50
  ): Promise<ReplayRun[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_replay_runs')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapRunFromDb);
  }

  /**
   * Get a specific run
   */
  async getRun(runId: string): Promise<ReplayRun | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_replay_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRunFromDb(data);
  }

  /**
   * Cancel a running task
   */
  async cancelRun(runId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('browser_replay_runs')
      .update({
        status: 'cancelled' as ReplayStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .eq('status', 'running');

    if (error) {
      throw error;
    }
  }

  /**
   * Duplicate a task
   */
  async duplicateTask(taskId: string, newName: string): Promise<ReplayTask> {
    const original = await this.getTask(taskId);

    if (!original) {
      throw new Error('Task not found');
    }

    return this.createTask(original.workspaceId, {
      name: newName,
      description: original.description,
      startUrl: original.startUrl,
      steps: original.steps,
      variables: original.variables,
      assertions: original.assertions,
      retryConfig: original.retryConfig,
      scheduleConfig: undefined, // Don't copy schedule
      notifyOnComplete: original.notifyOnComplete,
      notifyOnFail: original.notifyOnFail,
    });
  }

  /**
   * Export task as JSON
   */
  async exportTask(taskId: string): Promise<object> {
    const task = await this.getTask(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    return {
      name: task.name,
      description: task.description,
      startUrl: task.startUrl,
      steps: task.steps,
      variables: task.variables,
      assertions: task.assertions,
      retryConfig: task.retryConfig,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Import task from JSON
   */
  async importTask(
    workspaceId: string,
    taskData: {
      name: string;
      description?: string;
      startUrl: string;
      steps: ReplayStep[];
      variables?: Record<string, ReplayVariable>;
      assertions?: ReplayAssertion[];
      retryConfig?: ReplayTask['retryConfig'];
    },
    createdBy?: string
  ): Promise<ReplayTask> {
    return this.createTask(workspaceId, {
      ...taskData,
      createdBy,
    });
  }

  /**
   * Get scheduled tasks
   */
  async getScheduledTasks(workspaceId: string): Promise<ReplayTask[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('browser_replay_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('schedule_config', 'is', null)
      .eq('schedule_config->enabled', true);

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapTaskFromDb);
  }

  /**
   * Get run statistics
   */
  async getRunStats(
    workspaceId: string,
    days = 30
  ): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDurationMs: number;
    successRate: number;
    runsByDay: Array<{ date: string; count: number; successCount: number }>;
  }> {
    const supabase = await getSupabaseServer();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: runs } = await supabase
      .from('browser_replay_runs')
      .select('status, duration_ms, started_at')
      .eq('workspace_id', workspaceId)
      .gte('started_at', startDate.toISOString());

    if (!runs || runs.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgDurationMs: 0,
        successRate: 0,
        runsByDay: [],
      };
    }

    const successful = runs.filter((r) => r.status === 'completed');
    const failed = runs.filter((r) => r.status === 'failed');
    const durations = runs.filter((r) => r.duration_ms).map((r) => r.duration_ms);

    // Group by day
    const byDay = new Map<string, { count: number; successCount: number }>();
    for (const run of runs) {
      const date = run.started_at.split('T')[0];
      const current = byDay.get(date) || { count: 0, successCount: 0 };
      current.count++;
      if (run.status === 'completed') {
current.successCount++;
}
      byDay.set(date, current);
    }

    return {
      totalRuns: runs.length,
      successfulRuns: successful.length,
      failedRuns: failed.length,
      avgDurationMs: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      successRate: runs.length > 0 ? (successful.length / runs.length) * 100 : 0,
      runsByDay: Array.from(byDay.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // Private helper methods

  private runAssertions(assertions: ReplayAssertion[]): boolean {
    // In production, this would actually check assertions against browser state
    // For now, simulate success
    return true;
  }

  private mapTaskFromDb(data: Record<string, unknown>): ReplayTask {
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      startUrl: data.start_url as string,
      steps: data.steps as ReplayStep[],
      variables: data.variables as Record<string, ReplayVariable> | undefined,
      assertions: data.assertions as ReplayAssertion[] | undefined,
      retryConfig: data.retry_config as ReplayTask['retryConfig'] | undefined,
      scheduleConfig: data.schedule_config as ReplayTask['scheduleConfig'] | undefined,
      notifyOnComplete: data.notify_on_complete as boolean,
      notifyOnFail: data.notify_on_fail as boolean,
      createdBy: data.created_by as string | undefined,
      lastRunAt: data.last_run_at ? new Date(data.last_run_at as string) : undefined,
      lastRunStatus: data.last_run_status as ReplayStatus | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapRunFromDb(data: Record<string, unknown>): ReplayRun {
    return {
      id: data.id as string,
      taskId: data.task_id as string,
      workspaceId: data.workspace_id as string,
      status: data.status as ReplayStatus,
      startedAt: new Date(data.started_at as string),
      completedAt: data.completed_at ? new Date(data.completed_at as string) : undefined,
      durationMs: data.duration_ms as number | undefined,
      stepResults: data.step_results as StepResult[],
      extractedData: data.extracted_data as Record<string, unknown> | undefined,
      screenshotUrls: data.screenshot_urls as string[] | undefined,
      errorMessage: data.error_message as string | undefined,
      errorStep: data.error_step as number | undefined,
      retryCount: data.retry_count as number,
      triggeredBy: data.triggered_by as 'manual' | 'schedule' | 'api',
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const replayService = new ReplayService();
