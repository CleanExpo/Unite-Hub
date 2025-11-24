/**
 * AIDO Change Signals Database Access Layer
 * Algorithm shift detection for Google curve monitoring
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ChangeSignal {
  id: string;
  client_id: string | null;
  workspace_id: string;
  pillar_id: string;
  signal_type: string;
  severity: string;
  description: string;
  raw_evidence: Record<string, any> | null;
  detected_at: string;
  status: string;
  created_at: string;
}

export interface ChangeSignalInput {
  clientId?: string;
  workspaceId: string;
  pillarId: string;
  signalType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rawEvidence?: Record<string, any>;
}

/**
 * Create a new change signal
 */
export async function createChangeSignal(data: ChangeSignalInput): Promise<ChangeSignal> {
  const supabase = await getSupabaseServer();

  const { data: signal, error } = await supabase
    .from('change_signals')
    .insert({
      client_id: data.clientId || null,
      workspace_id: data.workspaceId,
      pillar_id: data.pillarId,
      signal_type: data.signalType,
      severity: data.severity,
      description: data.description,
      raw_evidence: data.rawEvidence || null,
      detected_at: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create change signal:', error);
    throw new Error(`Failed to create change signal: ${error.message}`);
  }

  return signal;
}

/**
 * Get change signals for a workspace
 * Optionally filter by client, severity, or status
 */
export async function getChangeSignals(
  workspaceId: string,
  filters?: { clientId?: string; severity?: string; status?: string; pillarId?: string }
): Promise<ChangeSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('change_signals')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.pillarId) {
    query = query.eq('pillar_id', filters.pillarId);
  }

  const { data, error } = await query
    .order('detected_at', { ascending: false })
    .order('severity', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch change signals:', error);
    throw new Error(`Failed to fetch change signals: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single change signal by ID
 */
export async function getChangeSignal(id: string, workspaceId: string): Promise<ChangeSignal> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('change_signals')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Change signal not found or access denied');
    }
    console.error('[AIDO] Failed to fetch change signal:', error);
    throw new Error(`Failed to fetch change signal: ${error.message}`);
  }

  return data;
}

/**
 * Update change signal status
 */
export async function updateChangeSignalStatus(
  id: string,
  workspaceId: string,
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
): Promise<ChangeSignal> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('change_signals')
    .update({ status })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Change signal not found or access denied');
    }
    console.error('[AIDO] Failed to update change signal:', error);
    throw new Error(`Failed to update change signal: ${error.message}`);
  }

  return data;
}

/**
 * Delete a change signal
 */
export async function deleteChangeSignal(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('change_signals')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete change signal:', error);
    throw new Error(`Failed to delete change signal: ${error.message}`);
  }
}

/**
 * Get active change signals
 * Only returns signals with status = 'active'
 */
export async function getActiveChangeSignals(
  workspaceId: string,
  clientId?: string
): Promise<ChangeSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('change_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query
    .order('severity', { ascending: false })
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch active change signals:', error);
    throw new Error(`Failed to fetch change signals: ${error.message}`);
  }

  return data || [];
}

/**
 * Get critical change signals
 * severity = 'critical'
 */
export async function getCriticalChangeSignals(
  workspaceId: string,
  clientId?: string
): Promise<ChangeSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('change_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('severity', 'critical')
    .eq('status', 'active');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('detected_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch critical change signals:', error);
    throw new Error(`Failed to fetch change signals: ${error.message}`);
  }

  return data || [];
}

/**
 * Get change signals by time range
 */
export async function getChangeSignalsByTimeRange(
  workspaceId: string,
  startDate: string,
  endDate: string,
  clientId?: string
): Promise<ChangeSignal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('change_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('detected_at', startDate)
    .lte('detected_at', endDate);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('detected_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch change signals by time range:', error);
    throw new Error(`Failed to fetch change signals: ${error.message}`);
  }

  return data || [];
}
