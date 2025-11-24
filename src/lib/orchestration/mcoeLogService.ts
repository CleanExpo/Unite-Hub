/**
 * MCOE Log Service
 * Phase 84: Orchestration action logging
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  OrchestrationAction,
  ActionType,
  RiskClass,
  ActionStatus,
  SourceSignals,
} from './mcoeTypes';

interface LogActionInput {
  schedule_id?: string;
  client_id: string;
  workspace_id: string;
  action_type: ActionType;
  decision_payload: Record<string, unknown>;
  source_signals: SourceSignals;
  risk_class: RiskClass;
  status?: ActionStatus;
  truth_notes?: string;
  confidence_score?: number;
  actor?: string;
}

/**
 * Log an orchestration action
 */
export async function logOrchestrationAction(
  input: LogActionInput
): Promise<OrchestrationAction> {
  const supabase = await getSupabaseServer();

  const actionData = {
    schedule_id: input.schedule_id || null,
    client_id: input.client_id,
    workspace_id: input.workspace_id,
    action_type: input.action_type,
    decision_payload: input.decision_payload,
    source_signals: input.source_signals,
    risk_class: input.risk_class,
    confidence_score: input.confidence_score || 0.8,
    truth_notes: input.truth_notes,
    truth_compliant: true,
    disclaimers: [],
    status: input.status || 'accepted',
    actor: input.actor || 'system',
  };

  const { data, error } = await supabase
    .from('campaign_orchestration_actions')
    .insert(actionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log action: ${error.message}`);
  }

  return normalizeAction(data);
}

/**
 * Add truth notes to an action
 */
export async function attachTruthNotes(
  actionId: string,
  notes: string,
  disclaimers?: string[]
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updates: Record<string, unknown> = {
    truth_notes: notes,
  };

  if (disclaimers) {
    updates.disclaimers = disclaimers;
  }

  await supabase
    .from('campaign_orchestration_actions')
    .update(updates)
    .eq('id', actionId);
}

/**
 * Get actions for a schedule
 */
export async function getScheduleActions(
  scheduleId: string
): Promise<OrchestrationAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_actions')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get actions: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get recent actions for a workspace
 */
export async function getRecentActions(
  workspaceId: string,
  limit = 50
): Promise<OrchestrationAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_actions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get actions: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get actions by type
 */
export async function getActionsByType(
  workspaceId: string,
  actionType: ActionType,
  limit = 50
): Promise<OrchestrationAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_actions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('action_type', actionType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get actions: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get conflict detections
 */
export async function getConflictActions(
  workspaceId: string,
  days = 7
): Promise<OrchestrationAction[]> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('campaign_orchestration_actions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('action_type', 'conflict_detected')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get conflicts: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get action statistics
 */
export async function getActionStats(
  workspaceId: string,
  days = 7
): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_risk: Record<string, number>;
}> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('campaign_orchestration_actions')
    .select('action_type, status, risk_class')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since);

  if (!data || data.length === 0) {
    return {
      total: 0,
      by_type: {},
      by_status: {},
      by_risk: {},
    };
  }

  const by_type: Record<string, number> = {};
  const by_status: Record<string, number> = {};
  const by_risk: Record<string, number> = {};

  for (const action of data) {
    by_type[action.action_type] = (by_type[action.action_type] || 0) + 1;
    by_status[action.status] = (by_status[action.status] || 0) + 1;
    by_risk[action.risk_class] = (by_risk[action.risk_class] || 0) + 1;
  }

  return {
    total: data.length,
    by_type,
    by_status,
    by_risk,
  };
}

/**
 * Normalize action from database
 */
function normalizeAction(row: Record<string, unknown>): OrchestrationAction {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    schedule_id: row.schedule_id as string | undefined,
    client_id: row.client_id as string,
    workspace_id: row.workspace_id as string,
    action_type: row.action_type as ActionType,
    decision_payload: row.decision_payload as Record<string, unknown>,
    source_signals: row.source_signals as SourceSignals,
    risk_class: row.risk_class as RiskClass,
    confidence_score: Number(row.confidence_score) || 0.8,
    truth_notes: row.truth_notes as string | undefined,
    truth_compliant: row.truth_compliant as boolean,
    disclaimers: row.disclaimers as string[],
    status: row.status as ActionStatus,
    executed_at: row.executed_at as string | undefined,
    execution_result: row.execution_result as OrchestrationAction['execution_result'],
    actor: row.actor as string,
  };
}
