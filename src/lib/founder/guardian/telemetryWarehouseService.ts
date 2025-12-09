import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guardian G26: Telemetry Warehouse Service
 * Long-term telemetry storage with hourly/daily rollups
 */

export interface WarehouseEvent {
  id: string;
  tenant_id: string;
  stream_key: string;
  occurred_at: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  payload: Record<string, any>;
  tags: string[];
  source_event_id: string | null;
  created_at: string;
}

export interface HourlyRollup {
  tenant_id: string;
  stream_key: string;
  hour_bucket: string;
  count_total: number;
  count_error: number;
  count_warn: number;
  count_critical: number;
  avg_payload_size: number | null;
  max_payload_size: number | null;
}

export interface DailyRollup {
  tenant_id: string;
  stream_key: string;
  day_bucket: string;
  count_total: number;
  count_error: number;
  count_warn: number;
  count_critical: number;
  avg_payload_size: number | null;
  max_payload_size: number | null;
  unique_tags_count: number | null;
}

/**
 * List warehouse events with optional filtering
 */
export async function listWarehouseEvents(
  tenantId: string,
  opts?: { streamKey?: string; limit?: number }
): Promise<WarehouseEvent[]> {
  const supabase = supabaseAdmin;
  let query = supabase
    .from('guardian_warehouse_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false })
    .limit(opts?.limit ?? 300);

  if (opts?.streamKey) {
    query = query.eq('stream_key', opts.streamKey);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as WarehouseEvent[];
}

/**
 * List hourly rollups (last 7 days by default)
 */
export async function listHourlyRollups(
  tenantId: string,
  streamKey?: string
): Promise<HourlyRollup[]> {
  const supabase = supabaseAdmin;
  let query = supabase
    .from('guardian_warehouse_hourly_rollups')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('hour_bucket', { ascending: false })
    .limit(168); // 7 days * 24 hours

  if (streamKey) {
    query = query.eq('stream_key', streamKey);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as HourlyRollup[];
}

/**
 * List daily rollups (last 30 days by default)
 */
export async function listDailyRollups(
  tenantId: string,
  streamKey?: string
): Promise<DailyRollup[]> {
  const supabase = supabaseAdmin;
  let query = supabase
    .from('guardian_warehouse_daily_rollups')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('day_bucket', { ascending: false })
    .limit(30); // 30 days

  if (streamKey) {
    query = query.eq('stream_key', streamKey);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DailyRollup[];
}

/**
 * Get total warehouse event count
 */
export async function getWarehouseEventCount(tenantId: string): Promise<number> {
  const supabase = supabaseAdmin;
  const { count, error } = await supabase
    .from('guardian_warehouse_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return count || 0;
}

/**
 * Get distinct stream keys in warehouse
 */
export async function getDistinctStreamKeys(tenantId: string): Promise<string[]> {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase
    .from('guardian_warehouse_events')
    .select('stream_key')
    .eq('tenant_id', tenantId)
    .limit(1000);

  if (error) throw error;

  const uniqueKeys = [...new Set(data?.map(row => row.stream_key) || [])];
  return uniqueKeys;
}
