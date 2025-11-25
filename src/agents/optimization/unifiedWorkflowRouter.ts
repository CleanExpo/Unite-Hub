/**
 * Unified Workflow Router
 *
 * Routes strategic plays into concrete workflows.
 * Coordinates multi-agent execution and tracks workflow outcomes.
 */

import { StrategyPlay } from './strategySynthesiser';

export interface RoutedWorkflow {
  id: string;
  playId: string;
  objective: string;
  workflowTemplate: string;
  priority: 'low' | 'medium' | 'high';
  agents: string[];
  estimatedDuration?: number;
  status?: 'pending' | 'active' | 'completed' | 'failed';
}

// In-memory workflow queue (would persist to database)
let workflowQueue: RoutedWorkflow[] = [];
let completedWorkflows: RoutedWorkflow[] = [];

/**
 * Build routed workflows from strategy plays
 */
export function buildRoutedWorkflows(plays: StrategyPlay[]): RoutedWorkflow[] {
  const routed: RoutedWorkflow[] = [];

  for (const play of plays) {
    for (const wf of play.recommendedWorkflows) {
      const workflow: RoutedWorkflow = {
        id: crypto.randomUUID(),
        playId: play.id,
        objective: `${play.name} – ${wf}`,
        workflowTemplate: wf,
        priority: play.priority,
        agents: play.agentsInvolved,
        estimatedDuration: getEstimatedDuration(wf),
        status: 'pending',
      };
      routed.push(workflow);
    }
  }

  return routed;
}

/**
 * Get estimated duration for a workflow template (in seconds)
 */
function getEstimatedDuration(template: string): number {
  const durations: Record<string, number> = {
    // Risk response workflows
    'rapid_risk_assessment': 300, // 5 minutes
    'crisis_communication': 600, // 10 minutes
    'stakeholder_briefing': 400, // 7 minutes

    // Opportunity workflows
    'content_blitz': 1800, // 30 minutes
    'multi_channel_launch': 2400, // 40 minutes
    'performance_monitoring': 900, // 15 minutes

    // Email optimization
    'expand_volume': 300,
    'increase_cadence': 300,
    'segment_testing': 1200,
    'diagnostic_analysis': 900,
    'ab_testing': 1500,
    'recovery_campaign': 600,

    // Content workflows
    'parallel_review': 600,
    'approval_optimization': 1200,
    'template_standardization': 1800,
    'quality_framework': 900,
    'brand_alignment_audit': 1200,
    'continuous_improvement': 900,

    // Scheduling workflows
    'availability_optimization': 300,
    'reminder_campaigns': 300,
    'follow_up_sequences': 600,

    // Capacity workflows
    'contractor_onboarding': 3600,
    'workload_analysis': 1200,
    'automation_roadmap': 1800,
    'workflow_optimization': 1200,
    'automation_sprint': 2400,
    'efficiency_training': 900,

    // Financial workflows
    'market_expansion': 1800,
    'upsell_campaign': 1200,
    'pricing_optimization': 900,
    'cost_analysis': 1200,
    'efficiency_drive': 1800,
    'margin_improvement': 900,
  };

  return durations[template] ?? 900; // Default 15 minutes
}

/**
 * Enqueue workflows for execution
 */
export function enqueueWorkflows(workflows: RoutedWorkflow[]): void {
  workflowQueue.push(...workflows);
  // Sort by priority (high first)
  workflowQueue.sort((a, b) => {
    const priorityOrder = { high: 2, medium: 1, low: 0 };
    return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
  });
}

/**
 * Get next workflow to execute
 */
export function getNextWorkflow(): RoutedWorkflow | null {
  if (workflowQueue.length === 0) return null;

  const workflow = workflowQueue.shift()!;
  workflow.status = 'active';
  return workflow;
}

/**
 * Mark workflow as completed
 */
export function completeWorkflow(workflowId: string): RoutedWorkflow | null {
  const workflow = workflowQueue.find(w => w.id === workflowId);
  if (!workflow) return null;

  workflow.status = 'completed';
  workflowQueue = workflowQueue.filter(w => w.id !== workflowId);
  completedWorkflows.push(workflow);

  return workflow;
}

/**
 * Mark workflow as failed
 */
export function failWorkflow(workflowId: string, reason?: string): RoutedWorkflow | null {
  const workflow = workflowQueue.find(w => w.id === workflowId);
  if (!workflow) return null;

  workflow.status = 'failed';
  workflowQueue = workflowQueue.filter(w => w.id !== workflowId);
  completedWorkflows.push(workflow);

  console.error(`Workflow ${workflowId} failed: ${reason ?? 'Unknown reason'}`);

  return workflow;
}

/**
 * Get pending workflows
 */
export function getPendingWorkflows(): RoutedWorkflow[] {
  return workflowQueue.filter(w => w.status === 'pending');
}

/**
 * Get active workflows
 */
export function getActiveWorkflows(): RoutedWorkflow[] {
  return workflowQueue.filter(w => w.status === 'active');
}

/**
 * Get workflow queue status
 */
export function getQueueStatus() {
  const total = workflowQueue.length + completedWorkflows.length;
  const pending = workflowQueue.filter(w => w.status === 'pending').length;
  const active = workflowQueue.filter(w => w.status === 'active').length;
  const completed = completedWorkflows.filter(w => w.status === 'completed').length;
  const failed = completedWorkflows.filter(w => w.status === 'failed').length;

  const estimatedTimeRemaining = workflowQueue.reduce((sum, w) => sum + (w.estimatedDuration ?? 900), 0);

  return {
    total,
    pending,
    active,
    completed,
    failed,
    successRate: total > 0 ? (completed / (completed + failed)) * 100 : 0,
    estimatedTimeRemaining: Math.ceil(estimatedTimeRemaining / 60), // Convert to minutes
    queueSize: workflowQueue.length,
  };
}

/**
 * Clear completed workflows history
 */
export function clearCompletedHistory(): number {
  const count = completedWorkflows.length;
  completedWorkflows = [];
  return count;
}

/**
 * Get workflow execution history
 */
export function getWorkflowHistory(limit = 100): RoutedWorkflow[] {
  return completedWorkflows.slice(-limit);
}
