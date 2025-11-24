/**
 * Autopilot Playbook Service
 * Phase 89: CRUD for playbooks and actions
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AutopilotPlaybook,
  AutopilotAction,
  CreatePlaybookInput,
  CreateActionInput,
  AutopilotStats,
} from './autopilotTypes';
import { collectSignalsForPeriod } from './autopilotSignalCollectorService';
import { transformSignalsToActions, prioritiseActions } from './autopilotPlannerService';

/**
 * Create playbook with actions
 */
export async function createPlaybookWithActions(
  input: CreatePlaybookInput
): Promise<AutopilotPlaybook> {
  const supabase = await getSupabaseServer();

  // Calculate meta scores
  const actions = input.actions;
  const metaScores = {
    risk_mix: calculateRiskMix(actions),
    effort_total: actions.reduce((sum, a) => sum + a.effortEstimate, 0),
    impact_total: actions.reduce((sum, a) => sum + a.impactEstimate, 0),
    coverage_percent: calculateCoverage(actions),
  };

  // Generate summary
  const summaryMarkdown = generatePlaybookSummary(actions, input.periodStart, input.periodEnd);

  // Create playbook
  const { data: playbook, error: playbookError } = await supabase
    .from('autopilot_playbooks')
    .insert({
      workspace_id: input.workspaceId,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      status: 'active',
      summary_markdown: summaryMarkdown,
      meta_scores: metaScores,
      total_actions: actions.length,
    })
    .select()
    .single();

  if (playbookError) {
    throw new Error(`Failed to create playbook: ${playbookError.message}`);
  }

  // Create actions
  if (actions.length > 0) {
    const actionRecords = actions.map((action, index) => ({
      playbook_id: playbook.id,
      workspace_id: input.workspaceId,
      client_id: action.clientId,
      category: action.category,
      source_engine: action.sourceEngine,
      action_type: action.actionType,
      risk_class: action.riskClass,
      impact_estimate: action.impactEstimate,
      effort_estimate: action.effortEstimate,
      priority_score: (actions.length - index) * 10, // Simple priority
      state: 'suggested',
      title: action.title,
      description: action.description,
      payload: action.payload,
      truth_notes: action.truthNotes,
    }));

    const { error: actionsError } = await supabase
      .from('autopilot_actions')
      .insert(actionRecords);

    if (actionsError) {
      console.error('Failed to create actions:', actionsError);
    }
  }

  return mapToPlaybook(playbook);
}

/**
 * Generate playbook for current period
 */
export async function generatePlaybook(
  workspaceId: string
): Promise<AutopilotPlaybook> {
  // Calculate period (this week)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - dayOfWeek);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);

  // Collect signals
  const signals = await collectSignalsForPeriod(
    workspaceId,
    periodStart.toISOString(),
    periodEnd.toISOString()
  );

  // Transform to actions
  const actions = transformSignalsToActions(signals, workspaceId);
  const prioritised = prioritiseActions(actions);

  // Create playbook
  return createPlaybookWithActions({
    workspaceId,
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: periodEnd.toISOString().split('T')[0],
    actions: prioritised,
  });
}

/**
 * Get playbook by ID
 */
export async function getPlaybook(playbookId: string): Promise<AutopilotPlaybook | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('autopilot_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (error || !data) return null;

  return mapToPlaybook(data);
}

/**
 * List recent playbooks
 */
export async function listPlaybooks(
  workspaceId: string,
  limit: number = 10
): Promise<AutopilotPlaybook[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('autopilot_playbooks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('period_start', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to list playbooks:', error);
    return [];
  }

  return (data || []).map(mapToPlaybook);
}

/**
 * Get actions for playbook
 */
export async function getPlaybookActions(
  playbookId: string
): Promise<AutopilotAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('autopilot_actions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Failed to get actions:', error);
    return [];
  }

  return (data || []).map(mapToAction);
}

/**
 * Update action state
 */
export async function updateActionState(
  actionId: string,
  state: string,
  executionResult?: any,
  executedBy?: string
): Promise<AutopilotAction | null> {
  const supabase = await getSupabaseServer();

  const updates: any = { state };

  if (state === 'auto_executed' || state === 'approved_executed') {
    updates.executed_at = new Date().toISOString();
    updates.execution_result = executionResult;
    if (executedBy) updates.executed_by = executedBy;
  }

  const { data, error } = await supabase
    .from('autopilot_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update action:', error);
    return null;
  }

  return mapToAction(data);
}

/**
 * Get autopilot stats
 */
export async function getAutopilotStats(
  workspaceId: string,
  days: number = 30
): Promise<AutopilotStats> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [playbooks, actions] = await Promise.all([
    supabase
      .from('autopilot_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', since),

    supabase
      .from('autopilot_actions')
      .select('state')
      .eq('workspace_id', workspaceId)
      .gte('created_at', since),
  ]);

  const actionData = actions.data || [];

  return {
    totalPlaybooks: playbooks.count || 0,
    totalActions: actionData.length,
    autoExecuted: actionData.filter(a => a.state === 'auto_executed').length,
    approvedExecuted: actionData.filter(a => a.state === 'approved_executed').length,
    awaitingApproval: actionData.filter(a => a.state === 'suggested').length,
  };
}

// Helper functions

function calculateRiskMix(actions: CreateActionInput[]): number {
  if (actions.length === 0) return 0;

  const riskScores = actions.map(a =>
    a.riskClass === 'high' ? 3 : a.riskClass === 'medium' ? 2 : 1
  );

  return riskScores.reduce((sum, s) => sum + s, 0) / actions.length;
}

function calculateCoverage(actions: CreateActionInput[]): number {
  const categories = new Set(actions.map(a => a.category));
  return (categories.size / 8) * 100; // 8 categories
}

function generatePlaybookSummary(
  actions: CreateActionInput[],
  periodStart: string,
  periodEnd: string
): string {
  const lines: string[] = [];

  lines.push(`# Weekly Autopilot Playbook`);
  lines.push(`**Period**: ${periodStart} to ${periodEnd}`);
  lines.push('');

  // Summary stats
  const highRisk = actions.filter(a => a.riskClass === 'high').length;
  const mediumRisk = actions.filter(a => a.riskClass === 'medium').length;
  const lowRisk = actions.filter(a => a.riskClass === 'low').length;

  lines.push('## Overview');
  lines.push(`- **Total Actions**: ${actions.length}`);
  lines.push(`- **High Risk**: ${highRisk} (require approval)`);
  lines.push(`- **Medium Risk**: ${mediumRisk} (require approval)`);
  lines.push(`- **Low Risk**: ${lowRisk} (auto-executable)`);
  lines.push('');

  // By category
  const byCategory = actions.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  lines.push('## Actions by Category');
  for (const [cat, count] of Object.entries(byCategory)) {
    lines.push(`- **${cat}**: ${count}`);
  }
  lines.push('');

  // Top priorities
  lines.push('## Top Priorities');
  const top5 = actions.slice(0, 5);
  for (const action of top5) {
    lines.push(`1. ${action.title} (${action.riskClass} risk)`);
  }

  return lines.join('\n');
}

function mapToPlaybook(row: any): AutopilotPlaybook {
  return {
    id: row.id,
    createdAt: row.created_at,
    workspaceId: row.workspace_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    summaryMarkdown: row.summary_markdown,
    metaScores: row.meta_scores,
    totalActions: row.total_actions,
    autoExecuted: row.auto_executed,
    awaitingApproval: row.awaiting_approval,
    completed: row.completed,
    truthComplete: row.truth_complete,
    truthNotes: row.truth_notes,
    metadata: row.metadata,
  };
}

function mapToAction(row: any): AutopilotAction {
  return {
    id: row.id,
    createdAt: row.created_at,
    playbookId: row.playbook_id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    category: row.category,
    sourceEngine: row.source_engine,
    actionType: row.action_type,
    riskClass: row.risk_class,
    impactEstimate: parseFloat(row.impact_estimate),
    effortEstimate: parseFloat(row.effort_estimate),
    priorityScore: parseFloat(row.priority_score),
    state: row.state,
    title: row.title,
    description: row.description,
    payload: row.payload,
    executionResult: row.execution_result,
    executedAt: row.executed_at,
    executedBy: row.executed_by,
    truthNotes: row.truth_notes,
    metadata: row.metadata,
  };
}
