/**
 * Client Agent Log Service
 * Phase 83: Action logging and session management
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ClientAgentSession,
  ClientAgentAction,
  SessionMessage,
  ActionProposal,
  ApprovalStatus,
  RiskLevel,
  ContextSnapshot,
} from './clientAgentTypes';
import { assessRisk } from './clientAgentGuardrailsService';

/**
 * Create a new agent session
 */
export async function createSession(
  workspaceId: string,
  clientId?: string,
  userId?: string,
  context?: ContextSnapshot
): Promise<ClientAgentSession> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_sessions')
    .insert({
      workspace_id: workspaceId,
      client_id: clientId || null,
      session_type: 'operational',
      status: 'active',
      context_snapshot: context || {},
      messages: [],
      initiated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return normalizeSession(data);
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<ClientAgentSession | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeSession(data);
}

/**
 * Add message to session
 */
export async function addMessage(
  sessionId: string,
  message: SessionMessage
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get current messages
  const { data: session } = await supabase
    .from('client_agent_sessions')
    .select('messages')
    .eq('id', sessionId)
    .single();

  const messages = session?.messages || [];
  messages.push(message);

  await supabase
    .from('client_agent_sessions')
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * End a session
 */
export async function endSession(
  sessionId: string,
  status: 'completed' | 'error' = 'completed',
  errorMessage?: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { data: session } = await supabase
    .from('client_agent_sessions')
    .select('created_at')
    .eq('id', sessionId)
    .single();

  const duration = session
    ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 1000)
    : 0;

  await supabase
    .from('client_agent_sessions')
    .update({
      status,
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * Log a proposed action
 */
export async function logAction(
  sessionId: string,
  clientId: string | undefined,
  workspaceId: string,
  proposal: ActionProposal,
  context: ContextSnapshot,
  approvalStatus: ApprovalStatus = 'awaiting_approval'
): Promise<ClientAgentAction> {
  const supabase = await getSupabaseServer();

  const riskAssessment = assessRisk(proposal, context);

  const { data, error } = await supabase
    .from('client_agent_actions')
    .insert({
      session_id: sessionId,
      client_id: clientId || null,
      workspace_id: workspaceId,
      action_type: proposal.action_type,
      action_payload: proposal.action_payload,
      risk_level: riskAssessment.level,
      risk_score: riskAssessment.score,
      risk_factors: riskAssessment.factors,
      approval_status: approvalStatus,
      truth_compliant: true,
      truth_disclaimers: [],
      confidence_score: proposal.confidence_score || 0.8,
      data_sources: proposal.data_sources || [],
      agent_reasoning: proposal.agent_reasoning,
      proposed_by: 'agent',
      execution_mode: approvalStatus === 'auto_executed' ? 'auto' : 'manual',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log action: ${error.message}`);
  }

  return normalizeAction(data);
}

/**
 * Update action status
 */
export async function updateActionStatus(
  actionId: string,
  status: ApprovalStatus,
  userId?: string,
  rejectionReason?: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updates: Record<string, unknown> = {
    approval_status: status,
  };

  if (status === 'approved_executed' || status === 'rejected') {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }

  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason;
  }

  await supabase
    .from('client_agent_actions')
    .update(updates)
    .eq('id', actionId);
}

/**
 * Get actions for a session
 */
export async function getSessionActions(
  sessionId: string
): Promise<ClientAgentAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_actions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get actions: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get pending actions for approval
 */
export async function getPendingActions(
  workspaceId: string,
  limit = 50
): Promise<ClientAgentAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_actions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('approval_status', 'awaiting_approval')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending actions: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(
  workspaceId: string,
  limit = 20
): Promise<ClientAgentSession[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get sessions: ${error.message}`);
  }

  return (data || []).map(normalizeSession);
}

/**
 * Get action history for a client
 */
export async function getClientActionHistory(
  clientId: string,
  workspaceId: string,
  limit = 50
): Promise<ClientAgentAction[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_agent_actions')
    .select('*')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get action history: ${error.message}`);
  }

  return (data || []).map(normalizeAction);
}

/**
 * Normalize session from database
 */
function normalizeSession(row: Record<string, unknown>): ClientAgentSession {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    client_id: row.client_id as string | null,
    workspace_id: row.workspace_id as string,
    session_type: row.session_type as ClientAgentSession['session_type'],
    status: row.status as ClientAgentSession['status'],
    context_snapshot: row.context_snapshot as ContextSnapshot,
    messages: row.messages as SessionMessage[],
    actions_proposed: row.actions_proposed as number,
    actions_executed: row.actions_executed as number,
    actions_rejected: row.actions_rejected as number,
    risk_score_avg: Number(row.risk_score_avg) || 0,
    truth_compliance_score: Number(row.truth_compliance_score) || 1,
    ended_at: row.ended_at as string | undefined,
    duration_seconds: row.duration_seconds as number | undefined,
    error_message: row.error_message as string | undefined,
    initiated_by: row.initiated_by as string | undefined,
  };
}

/**
 * Normalize action from database
 */
function normalizeAction(row: Record<string, unknown>): ClientAgentAction {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    session_id: row.session_id as string,
    client_id: row.client_id as string | null,
    workspace_id: row.workspace_id as string,
    action_type: row.action_type as ClientAgentAction['action_type'],
    action_payload: row.action_payload as Record<string, unknown>,
    risk_level: row.risk_level as RiskLevel,
    risk_score: Number(row.risk_score),
    risk_factors: row.risk_factors as ClientAgentAction['risk_factors'],
    approval_status: row.approval_status as ApprovalStatus,
    approved_by: row.approved_by as string | undefined,
    approved_at: row.approved_at as string | undefined,
    rejection_reason: row.rejection_reason as string | undefined,
    executed_at: row.executed_at as string | undefined,
    execution_result: row.execution_result as ClientAgentAction['execution_result'],
    truth_compliant: row.truth_compliant as boolean,
    truth_disclaimers: row.truth_disclaimers as string[],
    confidence_score: Number(row.confidence_score),
    data_sources: row.data_sources as ClientAgentAction['data_sources'],
    triggered_by_warning: row.triggered_by_warning as string | undefined,
    warning_severity: row.warning_severity as string | undefined,
    agent_reasoning: row.agent_reasoning as string | undefined,
    proposed_by: row.proposed_by as string,
    execution_mode: row.execution_mode as ClientAgentAction['execution_mode'],
  };
}
