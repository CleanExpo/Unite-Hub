/**
 * Execution Monitor
 *
 * Monitors workflow task execution, manages retries, handles failures,
 * and tracks performance metrics.
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import type { WorkflowTask, WorkflowExecution } from './coordinationAgent';

export interface ExecutionMetrics {
  taskId: string;
  startTime: number; // timestamp
  endTime?: number;
  duration?: number; // milliseconds
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  success: boolean;
}

/**
 * Route task to appropriate agent and execute
 */
export async function executeWorkflowStep(
  task: WorkflowTask,
  brand: BrandId
): Promise<any> {
  const startTime = Date.now();

  try {
    let result;

    switch (task.agent) {
      case 'email':
        result = await executeEmailTask(task, brand);
        break;

      case 'research':
        result = await executeResearchTask(task, brand);
        break;

      case 'content':
        result = await executeContentTask(task, brand);
        break;

      case 'scheduling':
        result = await executeSchedulingTask(task, brand);
        break;

      case 'analysis':
        result = await executeAnalysisTask(task, brand);
        break;

      case 'coordination':
        result = await executeCoordinationTask(task, brand);
        break;

      default:
        throw new Error(`Unknown agent type: ${task.agent}`);
    }

    return {
      success: true,
      result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    throw {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute email agent task
 */
async function executeEmailTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  // In production, this would call the actual emailAgent
  // For now, return simulated result
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        email: {
          to: task.params.recipient || 'prospect@example.com',
          subject: task.params.subject || 'Update',
          body: 'Email content generated successfully',
        },
        sentAt: new Date().toISOString(),
      });
    }, Math.random() * 2000 + 500);
  });
}

/**
 * Execute research agent task
 */
async function executeResearchTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        research: {
          query: task.params.query,
          category: task.params.category,
          insights: [
            { source: 'Market Report', insight: 'Key finding 1', confidence: 0.85 },
            { source: 'Industry Analysis', insight: 'Key finding 2', confidence: 0.78 },
          ],
          totalSources: 5,
        },
        completedAt: new Date().toISOString(),
      });
    }, Math.random() * 3000 + 1000);
  });
}

/**
 * Execute content agent task
 */
async function executeContentTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        content: {
          intent: task.params.intent,
          topic: task.params.topic,
          text: 'Generated content that aligns with brand voice and positioning',
          riskLevel: 'low',
          autoApproved: true,
          wordCount: Math.floor(Math.random() * 500) + 200,
        },
        generatedAt: new Date().toISOString(),
      });
    }, Math.random() * 2000 + 500);
  });
}

/**
 * Execute scheduling agent task
 */
async function executeSchedulingTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        scheduling: {
          meetingsProposed: 3,
          availableSlots: [
            { date: '2025-12-02T10:00:00Z', duration: 30, confidence: 0.95 },
            { date: '2025-12-03T14:00:00Z', duration: 30, confidence: 0.88 },
            { date: '2025-12-04T11:00:00Z', duration: 30, confidence: 0.82 },
          ],
          proposalSent: true,
        },
        proposedAt: new Date().toISOString(),
      });
    }, Math.random() * 2000 + 800);
  });
}

/**
 * Execute analysis agent task
 */
async function executeAnalysisTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        analysis: {
          timeframe: task.params.timeframe,
          kpis: {
            emailEngagement: 72,
            contentQuality: 85,
            staffUtilization: 68,
          },
          anomalies: [
            { type: 'spike', source: 'email', severity: 'medium', description: 'Unusual open rate increase' },
          ],
          insights: [
            { title: 'Strong Email Performance', priority: 'high', category: 'opportunity' },
            { title: 'Content Approval Process Optimization', priority: 'medium', category: 'recommendation' },
          ],
        },
        analyzedAt: new Date().toISOString(),
      });
    }, Math.random() * 3000 + 1500);
  });
}

/**
 * Execute coordination agent task (nested workflow)
 */
async function executeCoordinationTask(task: WorkflowTask, brand: BrandId): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: task.id,
        action: task.action,
        status: 'completed',
        coordination: {
          objective: task.params.objective,
          subtasksExecuted: 5,
          successRate: 100,
        },
        completedAt: new Date().toISOString(),
      });
    }, Math.random() * 4000 + 2000);
  });
}

/**
 * Monitor execution progress and performance
 */
export async function monitorExecution(
  execution: WorkflowExecution
): Promise<{
  progressPercent: number;
  completedTasks: number;
  failedTasks: number;
  estimatedTimeRemaining: number;
  performanceMetrics: Record<string, any>;
}> {
  const executions = Array.from(execution.executions.values());
  const completed = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;

  const progressPercent = (completed / execution.tasks.length) * 100;

  // Calculate performance metrics
  const completedExecutions = executions.filter((e) => e.duration);
  const avgDuration = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
    : 0;

  const remaining = execution.tasks.length - completed;
  const estimatedTimeRemaining = avgDuration * remaining;

  return {
    progressPercent,
    completedTasks: completed,
    failedTasks: failed,
    estimatedTimeRemaining,
    performanceMetrics: {
      avgTaskDuration: avgDuration,
      successRate: (completed / (completed + failed)) * 100,
      failureRate: (failed / (completed + failed)) * 100,
      totalDuration: Date.now() - execution.startedAt.getTime(),
    },
  };
}

/**
 * Handle task failure with retry logic
 */
export async function handleFailure(
  task: WorkflowTask,
  execution: WorkflowExecution,
  error: string
): Promise<void> {
  const taskExecution = execution.executions.get(task.id);

  if (!taskExecution) {
    return;
  }

  taskExecution.status = 'failed';
  taskExecution.error = error;
  taskExecution.completedAt = new Date();

  // Check if fallback actions exist
  if (task.fallbackActions && task.fallbackActions.length > 0) {
    console.log(
      `Task ${task.id} failed: ${error}. Executing fallback actions: ${task.fallbackActions.join(', ')}`
    );

    // In production, would execute fallback actions
    // For now, just log
    for (const fallbackAction of task.fallbackActions) {
      console.log(`Executing fallback action: ${fallbackAction}`);
    }
  } else {
    console.error(`Task ${task.id} failed with no fallback: ${error}`);

    // Block any dependent tasks
    const dependentTasks = execution.tasks.filter((t) =>
      t.dependencies?.includes(task.id)
    );

    for (const depTask of dependentTasks) {
      const depExecution = execution.executions.get(depTask.id) || {
        taskId: depTask.id,
        status: 'pending',
        attempts: 0,
      };

      depExecution.status = 'blocked';
      depExecution.error = `Dependency failed: ${task.id}`;
      execution.executions.set(depTask.id, depExecution);
    }
  }
}

/**
 * Collect execution metrics for reporting
 */
export function collectExecutionMetrics(execution: WorkflowExecution): ExecutionMetrics[] {
  const metrics: ExecutionMetrics[] = [];

  for (const [taskId, taskExecution] of execution.executions) {
    metrics.push({
      taskId,
      startTime: taskExecution.startedAt?.getTime() || 0,
      endTime: taskExecution.completedAt?.getTime(),
      duration: taskExecution.duration,
      status: taskExecution.status as any,
      attempts: taskExecution.attempts,
      success: taskExecution.status === 'completed',
    });
  }

  return metrics;
}

/**
 * Estimate remaining workflow time
 */
export function estimateRemainingTime(execution: WorkflowExecution): number {
  const executions = Array.from(execution.executions.values());
  const completedExecutions = executions.filter(
    (e) => e.status === 'completed' && e.duration
  );

  if (completedExecutions.length === 0) {
    return execution.tasks.reduce((sum, t) => sum + (t.estimatedDuration || 60), 0);
  }

  const avgDuration =
    completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
    completedExecutions.length;

  const pendingCount = execution.tasks.length - executions.length;
  return Math.round(avgDuration * pendingCount);
}

/**
 * Generate execution report
 */
export function generateExecutionReport(execution: WorkflowExecution): string {
  const metrics = collectExecutionMetrics(execution);
  const completedCount = metrics.filter((m) => m.success).length;
  const failedCount = metrics.filter((m) => !m.success).length;
  const avgDuration = metrics.filter((m) => m.duration).length > 0
    ? metrics.filter((m) => m.duration).reduce((sum, m) => sum + (m.duration || 0), 0) /
      metrics.filter((m) => m.duration).length
    : 0;

  return `
Workflow Execution Report
========================
Objective: ${execution.objective.objective}
Status: ${execution.status}
Progress: ${execution.progressPercent.toFixed(1)}%

Results:
- Completed: ${completedCount}/${execution.tasks.length}
- Failed: ${failedCount}
- Average Task Duration: ${(avgDuration / 1000).toFixed(2)}s
- Total Duration: ${((Date.now() - execution.startedAt.getTime()) / 1000).toFixed(2)}s

Insights:
${execution.results.aggregatedInsights.map((i) => `- ${i}`).join('\n')}

Recommendations:
${execution.results.recommendations.map((r) => `- ${r}`).join('\n')}
`;
}
