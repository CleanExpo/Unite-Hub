/**
 * Coordination Agent
 *
 * Master orchestrator for all platform agents. Responsible for:
 * - Decomposing high-level objectives into actionable agent tasks
 * - Routing tasks to appropriate specialists (Email, Research, Content, Scheduling, Analysis)
 * - Managing task dependencies and execution sequencing
 * - Coordinating multi-agent workflows with state management
 * - Handling failures, retries, and fallbacks
 * - Founder-governed execution with risk-based approval
 *
 * Architecture:
 * Objective → Decomposition → Sequencing → Routing → Execution → Monitoring → Aggregation → Approval
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import { scoreRisk } from '@/lib/founder/founderRiskEngine';
import { evaluateApproval } from '@/lib/founder/founderApprovalEngine';
import { logFounderEvent } from '@/lib/founder/founderEventLog';
import { decomposeObjective } from './workflowEngine';
import { sequenceTasks, resolveDependencies } from './taskSequencer';
import { executeWorkflowStep, monitorExecution, handleFailure } from './executionMonitor';

export interface WorkflowObjective {
  id: string;
  brand: BrandId;
  objective: string;
  description?: string;
  requiredOutcomes?: string[];
  constraints?: Record<string, any>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
}

export interface WorkflowTask {
  id: string;
  agent: 'email' | 'research' | 'content' | 'scheduling' | 'analysis' | 'coordination';
  action: string;
  params: Record<string, any>;
  dependencies?: string[]; // Task IDs that must complete first
  priority: number; // 0-100, higher = more urgent
  estimatedDuration?: number; // seconds
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  fallbackActions?: string[];
}

export interface TaskExecution {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  duration?: number; // milliseconds
}

export interface WorkflowExecution {
  id: string;
  objective: WorkflowObjective;
  tasks: WorkflowTask[];
  executions: Map<string, TaskExecution>;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  progressPercent: number;
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
  };
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'pending_review';
  results: {
    taskResults: Map<string, any>;
    aggregatedInsights: string[];
    recommendations: string[];
  };
}

/**
 * Execute a high-level objective through multi-agent workflow orchestration
 */
export async function executeObjective(objective: WorkflowObjective): Promise<WorkflowExecution> {
  const executionId = crypto.randomUUID();

  // Step 1: Decompose objective into agent tasks
  const decomposedTasks = decomposeObjective(objective);

  // Step 2: Sequence tasks respecting dependencies
  const sequencedTasks = sequenceTasks(decomposedTasks);

  // Step 3: Resolve task dependencies and build execution graph
  const dependencyGraph = resolveDependencies(sequencedTasks);

  // Step 4: Initial risk assessment
  const initialRisk = scoreRisk({
    brand: objective.brand,
    claim: `Workflow: ${objective.objective} (${sequencedTasks.length} tasks, complexity: ${calculateWorkflowComplexity(sequencedTasks)})`,
    context: 'internal',
  });

  // Step 5: Check if founder approval required before execution
  const requiresApproval = initialRisk.score >= 50 || objective.urgency === 'critical';

  const execution: WorkflowExecution = {
    id: executionId,
    objective,
    tasks: sequencedTasks,
    executions: new Map(),
    startedAt: new Date(),
    status: requiresApproval ? 'pending' : 'in_progress',
    progressPercent: 0,
    riskAssessment: initialRisk,
    approvalStatus: requiresApproval ? 'pending_review' : 'approved',
    results: {
      taskResults: new Map(),
      aggregatedInsights: [],
      recommendations: [],
    },
  };

  // Step 6: Request founder approval if needed
  if (requiresApproval) {
    const approval = evaluateApproval({
      id: executionId,
      createdAt: new Date().toISOString(),
      riskLevel: initialRisk.level,
      itemType: 'workflow_execution',
      brand: objective.brand,
      summary: objective.objective,
      createdByAgent: 'coordination',
      details: {
        objective: objective.objective,
        taskCount: sequencedTasks.length,
        riskScore: initialRisk.score,
      },
    });

    // Handle pending_founder_review case (string literal)
    if (approval === 'pending_founder_review') {
      execution.approvalStatus = 'pending_review';
      execution.status = 'blocked';
      logFounderEvent(
        'agent_action',
        'coordination_agent',
        {
          executionId,
          objective: objective.objective,
          reason: 'Pending founder review',
          action: 'workflow_blocked',
        }
      );
      return execution;
    }

    // Now TypeScript knows approval is ApprovalDecision
    execution.approvalStatus = approval.approved ? 'approved' : 'rejected';

    if (!approval.approved) {
      execution.status = 'blocked';
      logFounderEvent(
        'agent_action',
        'coordination_agent',
        {
          executionId,
          objective: objective.objective,
          reason: 'Founder rejected workflow',
          action: 'workflow_blocked',
        }
      );
      return execution;
    }

    execution.status = 'in_progress';
  }

  // Step 7: Execute workflow with monitoring
  return await executeWorkflow(execution);
}

/**
 * Execute workflow with task-by-task monitoring
 */
async function executeWorkflow(execution: WorkflowExecution): Promise<WorkflowExecution> {
  const executionMap = execution.executions;
  const taskResults = execution.results.taskResults;

  // Execute tasks in dependency order
  for (const task of execution.tasks) {
    // Check if dependencies are satisfied
    if (task.dependencies && task.dependencies.length > 0) {
      const depsSatisfied = task.dependencies.every((depId) => {
        const depExecution = executionMap.get(depId);
        return depExecution && depExecution.status === 'completed';
      });

      if (!depsSatisfied) {
        const failedDeps = task.dependencies.filter(
          (depId) => executionMap.get(depId)?.status !== 'completed'
        );
        await handleFailure(
          task,
          execution,
          `Dependency failure: ${failedDeps.join(', ')}`
        );
        continue;
      }
    }

    // Execute task with retry logic
    let attempts = 0;
    const maxAttempts = task.retryPolicy?.maxAttempts || 1;
    let lastError: string | undefined;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const taskExecution: TaskExecution = {
          taskId: task.id,
          status: 'in_progress',
          attempts,
          startedAt: new Date(),
        };

        executionMap.set(task.id, taskExecution);

        // Execute task
        const result = await executeWorkflowStep(task, execution.objective.brand);

        taskExecution.status = 'completed';
        taskExecution.result = result;
        taskExecution.completedAt = new Date();
        taskExecution.duration = taskExecution.completedAt.getTime() - (taskExecution.startedAt?.getTime() || 0);

        executionMap.set(task.id, taskExecution);
        taskResults.set(task.id, result);

        logFounderEvent(
          'agent_action',
          'coordination_agent',
          {
            executionId: execution.id,
            taskId: task.id,
            taskAgent: task.agent,
            duration: taskExecution.duration,
            action: 'workflow_task_completed',
          }
        );

        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempts < maxAttempts) {
          const backoffMs = (task.retryPolicy?.backoffMs || 1000) *
            Math.pow(task.retryPolicy?.backoffMultiplier || 2, attempts - 1);

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        } else {
          // All retries exhausted
          await handleFailure(task, execution, lastError);
        }
      }
    }

    // Update progress
    const completedCount = Array.from(executionMap.values()).filter(
      (e) => e.status === 'completed'
    ).length;
    execution.progressPercent = (completedCount / execution.tasks.length) * 100;
  }

  // Step 8: Aggregate results
  execution.results.aggregatedInsights = aggregateInsights(Array.from(taskResults.values()));
  execution.results.recommendations = generateRecommendations(
    execution.objective,
    Array.from(taskResults.values())
  );

  // Step 9: Final risk assessment
  const failedTasks = Array.from(executionMap.values()).filter((e) => e.status === 'failed');
  const completedTasks = Array.from(executionMap.values()).filter((e) => e.status === 'completed').length;
  const finalRisk = scoreRisk({
    brand: execution.objective.brand,
    claim: `Workflow completed with ${failedTasks.length} failures, ${completedTasks} successful tasks`,
    context: 'internal',
  });

  execution.riskAssessment = finalRisk;
  execution.status = failedTasks.length === 0 ? 'completed' : 'failed';
  execution.completedAt = new Date();

  // Step 10: Log final event
  logFounderEvent(
    'agent_action',
    'coordination_agent',
    {
      executionId: execution.id,
      objective: execution.objective.objective,
      status: execution.status,
      completedTasks: Array.from(executionMap.values()).filter((e) => e.status === 'completed').length,
      failedTasks: failedTasks.length,
      duration: execution.completedAt.getTime() - execution.startedAt.getTime(),
      insights: execution.results.aggregatedInsights,
      action: 'workflow_completed',
    }
  );

  return execution;
}

/**
 * Calculate workflow complexity score
 */
function calculateWorkflowComplexity(tasks: WorkflowTask[]): number {
  let complexity = 0;

  // Factor 1: Task count
  complexity += tasks.length * 5;

  // Factor 2: Dependencies
  const tasksWithDeps = tasks.filter((t) => t.dependencies && t.dependencies.length > 0).length;
  complexity += tasksWithDeps * 10;

  // Factor 3: Agent diversity
  const agentTypes = new Set(tasks.map((t) => t.agent));
  complexity += agentTypes.size * 15;

  // Factor 4: Average priority
  const avgPriority = tasks.reduce((sum, t) => sum + t.priority, 0) / tasks.length;
  complexity += avgPriority * 0.5;

  return Math.min(complexity, 100);
}

/**
 * Aggregate insights from multiple task results
 */
function aggregateInsights(results: any[]): string[] {
  const insights: string[] = [];

  for (const result of results) {
    if (result.insights && Array.isArray(result.insights)) {
      insights.push(...result.insights.map((i: any) => i.title || i));
    }
    if (result.recommendations && Array.isArray(result.recommendations)) {
      insights.push(...result.recommendations);
    }
  }

  return Array.from(new Set(insights)).slice(0, 10); // Top 10 unique insights
}

/**
 * Generate workflow recommendations
 */
function generateRecommendations(objective: WorkflowObjective, results: any[]): string[] {
  const recommendations: string[] = [];

  // Analyze results for patterns
  const allInsights = aggregateInsights(results);

  if (allInsights.some((i) => i.toLowerCase().includes('risk'))) {
    recommendations.push('Review risk items before proceeding');
  }

  if (allInsights.some((i) => i.toLowerCase().includes('opportunity'))) {
    recommendations.push('Consider expanding scope to capture identified opportunities');
  }

  if (results.some((r) => r.riskLevel === 'high')) {
    recommendations.push('Schedule founder review for high-risk items');
  }

  if (recommendations.length === 0) {
    recommendations.push('Workflow executed successfully. Ready for next steps.');
  }

  return recommendations;
}
