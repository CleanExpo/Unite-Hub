/**
 * Combat Round Service
 * Phase 88: Create, schedule, and manage combat rounds
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  CombatRound,
  CreateRoundInput,
  RoundStatus,
  CombatStats,
} from './combatTypes';

/**
 * Create a new combat round
 */
export async function createRound(input: CreateRoundInput): Promise<CombatRound> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_rounds')
    .insert({
      client_id: input.clientId,
      workspace_id: input.workspaceId,
      channel: input.channel,
      strategy: input.strategy || 'classic_ab',
      round_status: 'pending',
      min_confidence: input.minConfidence || 0.6,
      min_sample_size: input.minSampleSize || 100,
      metadata: {
        created_by: 'system',
        created_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create round: ${error.message}`);
  }

  return mapToRound(data);
}

/**
 * Start a combat round
 */
export async function startRound(roundId: string): Promise<CombatRound> {
  const supabase = await getSupabaseServer();

  // Check round has entries
  const { count } = await supabase
    .from('combat_entries')
    .select('*', { count: 'exact', head: true })
    .eq('round_id', roundId);

  if (!count || count < 2) {
    throw new Error('Round needs at least 2 entries to start');
  }

  // Update round status
  const { data, error } = await supabase
    .from('combat_rounds')
    .update({
      round_status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', roundId)
    .eq('round_status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start round: ${error.message}`);
  }

  // Update entries to active
  await supabase
    .from('combat_entries')
    .update({ entry_status: 'active' })
    .eq('round_id', roundId)
    .eq('entry_status', 'pending');

  return mapToRound(data);
}

/**
 * Complete a combat round
 */
export async function completeRound(
  roundId: string,
  status: 'complete' | 'inconclusive' = 'complete'
): Promise<CombatRound> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_rounds')
    .update({
      round_status: status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', roundId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to complete round: ${error.message}`);
  }

  return mapToRound(data);
}

/**
 * Get round by ID
 */
export async function getRoundById(roundId: string): Promise<CombatRound | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (error || !data) {
return null;
}

  return mapToRound(data);
}

/**
 * List rounds for workspace
 */
export async function listRounds(
  workspaceId: string,
  options?: {
    clientId?: string;
    status?: RoundStatus;
    channel?: string;
    limit?: number;
  }
): Promise<CombatRound[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('combat_rounds')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  if (options?.status) {
    query = query.eq('round_status', options.status);
  }

  if (options?.channel) {
    query = query.eq('channel', options.channel);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list rounds:', error);
    return [];
  }

  return (data || []).map(mapToRound);
}

/**
 * Get combat stats for workspace
 */
export async function getCombatStats(
  workspaceId: string,
  days: number = 30
): Promise<CombatStats> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('combat_rounds')
    .select('round_status')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since);

  const rounds = data || [];

  return {
    totalRounds: rounds.length,
    completed: rounds.filter(r => r.round_status === 'complete').length,
    running: rounds.filter(r => r.round_status === 'running').length,
    pending: rounds.filter(r => r.round_status === 'pending').length,
    inconclusive: rounds.filter(r => r.round_status === 'inconclusive').length,
  };
}

/**
 * Get rounds ready for winner determination
 */
export async function getReadyRounds(workspaceId?: string): Promise<CombatRound[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('combat_rounds')
    .select('*')
    .eq('round_status', 'running')
    .contains('metadata', { ready_for_winner: true });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get ready rounds:', error);
    return [];
  }

  return (data || []).map(mapToRound);
}

// Helper
function mapToRound(row: any): CombatRound {
  return {
    id: row.id,
    createdAt: row.created_at,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    channel: row.channel,
    roundStatus: row.round_status,
    strategy: row.strategy,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    minConfidence: parseFloat(row.min_confidence),
    minSampleSize: row.min_sample_size,
    truthNotes: row.truth_notes,
    metadata: row.metadata,
  };
}
