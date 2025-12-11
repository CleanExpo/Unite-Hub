import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guardian G27: Replay Engine Service
 * Reconstruct past system state using captured telemetry slices
 */

export interface GuardianReplaySession {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  source_kind: 'telemetry' | 'warehouse' | 'mixed';
  status: 'pending' | 'ready' | 'running' | 'completed' | 'failed';
  range_start: string;
  range_end: string;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface GuardianReplayEvent {
  id: string;
  tenant_id: string;
  session_id: string;
  source_table: string;
  source_id: string;
  occurred_at: string;
  level: string | null;
  stream_key: string | null;
  payload: Record<string, any>;
  tags: string[];
  created_at: string;
}

/**
 * List replay sessions for a tenant
 */
export async function listReplaySessions(tenantId: string): Promise<GuardianReplaySession[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_replay_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
throw error;
}
  return data as GuardianReplaySession[];
}

/**
 * Get a specific replay session
 */
export async function getReplaySession(
  tenantId: string,
  sessionId: string
): Promise<GuardianReplaySession | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_replay_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
} // Not found
    throw error;
  }
  return data as GuardianReplaySession;
}

/**
 * List replay events for a session
 */
export async function listReplayEvents(
  tenantId: string,
  sessionId: string,
  limit = 400
): Promise<GuardianReplayEvent[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_replay_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('session_id', sessionId)
    .order('occurred_at', { ascending: true })
    .limit(limit);

  if (error) {
throw error;
}
  return data as GuardianReplayEvent[];
}

/**
 * Get replay event count for a session
 */
export async function getReplayEventCount(
  tenantId: string,
  sessionId: string
): Promise<number> {
  const supabase = supabaseAdmin;

  const { count, error } = await supabase
    .from('guardian_replay_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('session_id', sessionId);

  if (error) {
throw error;
}
  return count || 0;
}

/**
 * Get replay sessions by status
 */
export async function getReplaySessionsByStatus(
  tenantId: string,
  status: GuardianReplaySession['status']
): Promise<GuardianReplaySession[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_replay_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
throw error;
}
  return data as GuardianReplaySession[];
}
