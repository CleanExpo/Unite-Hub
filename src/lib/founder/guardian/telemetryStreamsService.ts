import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guardian G25: Telemetry Streams Service
 * Read-only access to telemetry streams and events
 */

export interface GuardianTelemetryStream {
  id: string;
  tenant_id: string;
  name: string;
  stream_key?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface GuardianTelemetryEvent {
  id: string;
  tenant_id: string;
  stream_id?: string | null;
  stream_key?: string | null;
  occurred_at: string;
  level?: string | null;
  payload: Record<string, any>;
  tags: string[];
  created_at?: string;
}

/**
 * List telemetry streams for a tenant
 */
export async function listTelemetryStreams(tenantId: string): Promise<GuardianTelemetryStream[]> {
  const { data, error } = await supabaseAdmin
    .from('guardian_telemetry_streams')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
throw error;
}
  return (data as GuardianTelemetryStream[]) || [];
}

/**
 * List telemetry events for a tenant
 */
export async function listTelemetryEvents(
  tenantId: string,
  opts?: { streamId?: string; limit?: number }
): Promise<GuardianTelemetryEvent[]> {
  let query = supabaseAdmin
    .from('guardian_telemetry_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.streamId) {
    query = query.eq('stream_id', opts.streamId);
  }

  const { data, error } = await query;
  if (error) {
throw error;
}
  return (data as GuardianTelemetryEvent[]) || [];
}
