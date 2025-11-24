/**
 * Client Agent Policy Service
 * Phase 83: Manages agent policies and settings
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ClientAgentPolicy,
  PolicyInput,
  ActionType,
  RiskLevel,
} from './clientAgentTypes';

/**
 * Get policy for a specific client or workspace default
 */
export async function getPolicy(
  workspaceId: string,
  clientId?: string
): Promise<ClientAgentPolicy | null> {
  const supabase = await getSupabaseServer();

  // First try client-specific policy
  if (clientId) {
    const { data: clientPolicy } = await supabase
      .from('client_agent_policies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .single();

    if (clientPolicy) {
      return normalizePolicy(clientPolicy);
    }
  }

  // Fall back to workspace default (client_id is null)
  const { data: defaultPolicy } = await supabase
    .from('client_agent_policies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('client_id', null)
    .single();

  if (defaultPolicy) {
    return normalizePolicy(defaultPolicy);
  }

  // Return system defaults if no policy exists
  return getDefaultPolicy(workspaceId);
}

/**
 * Create or update a policy
 */
export async function upsertPolicy(
  input: PolicyInput,
  userId: string
): Promise<ClientAgentPolicy> {
  const supabase = await getSupabaseServer();

  const policyData = {
    workspace_id: input.workspace_id,
    client_id: input.client_id || null,
    agent_enabled: input.agent_enabled ?? true,
    allowed_actions: input.allowed_actions || getDefaultAllowedActions(),
    auto_exec_enabled: input.auto_exec_enabled ?? true,
    auto_exec_risk_threshold: input.auto_exec_risk_threshold || 'low',
    max_actions_per_day: input.max_actions_per_day ?? 10,
    require_human_review_above_score: input.require_human_review_above_score ?? 70,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from('client_agent_policies')
    .upsert(policyData, {
      onConflict: 'client_id,workspace_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert policy: ${error.message}`);
  }

  return normalizePolicy(data);
}

/**
 * List all policies for a workspace
 */
export async function listPolicies(
  workspaceId: string
): Promise<ClientAgentPolicy[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_policies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list policies: ${error.message}`);
  }

  return (data || []).map(normalizePolicy);
}

/**
 * Delete a policy
 */
export async function deletePolicy(
  policyId: string,
  workspaceId: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('client_agent_policies')
    .delete()
    .eq('id', policyId)
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Failed to delete policy: ${error.message}`);
  }
}

/**
 * Check if an action is allowed by policy
 */
export function isActionAllowed(
  policy: ClientAgentPolicy,
  actionType: ActionType
): boolean {
  if (!policy.agent_enabled) {
    return false;
  }

  return policy.allowed_actions.includes(actionType);
}

/**
 * Check if action can be auto-executed based on risk
 */
export function canAutoExecute(
  policy: ClientAgentPolicy,
  riskLevel: RiskLevel
): boolean {
  if (!policy.auto_exec_enabled) {
    return false;
  }

  const riskOrder: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return riskOrder[riskLevel] <= riskOrder[policy.auto_exec_risk_threshold];
}

/**
 * Get default allowed actions
 */
function getDefaultAllowedActions(): ActionType[] {
  return [
    'send_followup',
    'update_status',
    'add_tag',
    'schedule_task',
    'generate_content',
  ];
}

/**
 * Get system default policy
 */
function getDefaultPolicy(workspaceId: string): ClientAgentPolicy {
  return {
    id: 'default',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_id: null,
    workspace_id: workspaceId,
    agent_enabled: true,
    allowed_actions: getDefaultAllowedActions(),
    auto_exec_enabled: true,
    auto_exec_risk_threshold: 'low',
    low_risk_threshold: 0.3,
    medium_risk_threshold: 0.6,
    max_actions_per_day: 10,
    require_human_review_above_score: 70,
    respect_early_warnings: true,
    pause_on_high_severity_warning: true,
  };
}

/**
 * Normalize database row to typed policy
 */
function normalizePolicy(row: Record<string, unknown>): ClientAgentPolicy {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    client_id: row.client_id as string | null,
    workspace_id: row.workspace_id as string,
    agent_enabled: row.agent_enabled as boolean,
    allowed_actions: row.allowed_actions as ActionType[],
    auto_exec_enabled: row.auto_exec_enabled as boolean,
    auto_exec_risk_threshold: row.auto_exec_risk_threshold as RiskLevel,
    low_risk_threshold: Number(row.low_risk_threshold),
    medium_risk_threshold: Number(row.medium_risk_threshold),
    max_actions_per_day: row.max_actions_per_day as number,
    require_human_review_above_score: row.require_human_review_above_score as number,
    respect_early_warnings: row.respect_early_warnings as boolean,
    pause_on_high_severity_warning: row.pause_on_high_severity_warning as boolean,
    created_by: row.created_by as string | undefined,
    updated_by: row.updated_by as string | undefined,
  };
}

/**
 * Get policy summary for display
 */
export function getPolicySummary(policy: ClientAgentPolicy): string {
  const parts: string[] = [];

  if (!policy.agent_enabled) {
    return 'Agent disabled';
  }

  parts.push(`Auto-exec: ${policy.auto_exec_enabled ? policy.auto_exec_risk_threshold + ' risk' : 'off'}`);
  parts.push(`Max/day: ${policy.max_actions_per_day}`);
  parts.push(`Review above: ${policy.require_human_review_above_score}`);

  return parts.join(' | ');
}
