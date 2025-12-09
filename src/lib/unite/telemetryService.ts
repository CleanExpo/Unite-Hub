/**
 * Stability Telemetry Service
 * Phase: D74 - Unite Stability Telemetry Engine
 *
 * Record system events and state snapshots for stability monitoring.
 * CRITICAL: Must not degrade runtime performance - uses async non-blocking writes.
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type TelemetrySeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryEvent {
  id: string;
  component: string;
  severity: TelemetrySeverity;
  payload?: {
    message?: string;
    stack_trace?: string;
    metrics?: Record<string, number>;
    context?: Record<string, unknown>;
  };
  tenant_id?: string;
  recorded_at: string;
}

export interface TelemetrySnapshot {
  id: string;
  state: {
    cpu_usage?: number;
    memory_usage?: number;
    active_tasks?: number;
    queue_depth?: number;
    error_rate?: number;
    uptime?: number;
  };
  metadata?: {
    trigger?: string;
    version?: string;
    environment?: string;
  };
  tenant_id?: string;
  captured_at: string;
}

// ============================================================================
// EVENT RECORDING
// ============================================================================

/**
 * Record telemetry event (non-blocking)
 * Uses fire-and-forget pattern to avoid performance impact
 */
export function recordEvent(
  component: string,
  severity: TelemetrySeverity,
  payload?: TelemetryEvent['payload'],
  tenantId?: string | null
): void {
  // Fire-and-forget: don't await, don't block
  setImmediate(async () => {
    try {
      await supabaseAdmin.from('unite_telemetry_events').insert({
        component,
        severity,
        payload,
        tenant_id: tenantId,
      });
    } catch (error) {
      // Silent failure - telemetry shouldn't crash the app
      console.error('[Telemetry] Failed to record event:', error);
    }
  });
}

/**
 * Record telemetry event (async, awaitable for critical events)
 */
export async function recordEventAsync(
  component: string,
  severity: TelemetrySeverity,
  payload?: TelemetryEvent['payload'],
  tenantId?: string | null
): Promise<TelemetryEvent | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('unite_telemetry_events')
      .insert({
        component,
        severity,
        payload,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TelemetryEvent;
  } catch (error) {
    console.error('[Telemetry] Failed to record event:', error);
    return null;
  }
}

/**
 * Batch record multiple events (performance optimized)
 */
export async function recordEventBatch(
  events: Array<{
    component: string;
    severity: TelemetrySeverity;
    payload?: TelemetryEvent['payload'];
    tenant_id?: string | null;
  }>
): Promise<number> {
  if (events.length === 0) return 0;

  try {
    const { data, error } = await supabaseAdmin
      .from('unite_telemetry_events')
      .insert(events)
      .select();

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('[Telemetry] Failed to record event batch:', error);
    return 0;
  }
}

export async function listEvents(filters?: {
  tenant_id?: string;
  component?: string;
  severity?: TelemetrySeverity;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<TelemetryEvent[]> {
  let query = supabaseAdmin
    .from('unite_telemetry_events')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.component) query = query.eq('component', filters.component);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.start_date) query = query.gte('recorded_at', filters.start_date);
  if (filters?.end_date) query = query.lte('recorded_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list telemetry events: ${error.message}`);
  return data as TelemetryEvent[];
}

export async function getEventStats(filters?: {
  tenant_id?: string;
  component?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{
  total_events: number;
  by_severity: Record<TelemetrySeverity, number>;
  by_component: Record<string, number>;
}> {
  const events = await listEvents({
    ...filters,
    limit: 10000, // Analyze last 10k events
  });

  const bySeverity: Record<TelemetrySeverity, number> = {
    debug: 0,
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };

  const byComponent: Record<string, number> = {};

  events.forEach((event) => {
    bySeverity[event.severity]++;
    byComponent[event.component] = (byComponent[event.component] || 0) + 1;
  });

  return {
    total_events: events.length,
    by_severity: bySeverity,
    by_component: byComponent,
  };
}

// ============================================================================
// SNAPSHOT MANAGEMENT
// ============================================================================

/**
 * Capture system state snapshot (non-blocking)
 */
export function captureSnapshot(
  state: TelemetrySnapshot['state'],
  metadata?: TelemetrySnapshot['metadata'],
  tenantId?: string | null
): void {
  // Fire-and-forget: don't await, don't block
  setImmediate(async () => {
    try {
      await supabaseAdmin.from('unite_telemetry_snapshots').insert({
        state,
        metadata,
        tenant_id: tenantId,
      });
    } catch (error) {
      console.error('[Telemetry] Failed to capture snapshot:', error);
    }
  });
}

/**
 * Capture system state snapshot (async, awaitable)
 */
export async function captureSnapshotAsync(
  state: TelemetrySnapshot['state'],
  metadata?: TelemetrySnapshot['metadata'],
  tenantId?: string | null
): Promise<TelemetrySnapshot | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('unite_telemetry_snapshots')
      .insert({
        state,
        metadata,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TelemetrySnapshot;
  } catch (error) {
    console.error('[Telemetry] Failed to capture snapshot:', error);
    return null;
  }
}

export async function listSnapshots(filters?: {
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<TelemetrySnapshot[]> {
  let query = supabaseAdmin
    .from('unite_telemetry_snapshots')
    .select('*')
    .order('captured_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.start_date) query = query.gte('captured_at', filters.start_date);
  if (filters?.end_date) query = query.lte('captured_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list telemetry snapshots: ${error.message}`);
  return data as TelemetrySnapshot[];
}

export async function getLatestSnapshot(tenantId?: string | null): Promise<TelemetrySnapshot | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_telemetry_snapshots')
    .select('*')
    .eq('tenant_id', tenantId || '')
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get latest snapshot: ${error.message}`);
  }

  return data as TelemetrySnapshot;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current system metrics
 * Note: This is a simplified version. In production, use proper monitoring tools.
 */
export function getCurrentSystemMetrics(): TelemetrySnapshot['state'] {
  // Simplified metrics - in production, use proper monitoring
  const memoryUsage = process.memoryUsage();

  return {
    cpu_usage: 0, // Placeholder - use os.cpus() in production
    memory_usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    active_tasks: 0, // Placeholder - track from orchestrator
    queue_depth: 0, // Placeholder - track from queue system
    error_rate: 0, // Placeholder - calculate from recent errors
    uptime: Math.round(process.uptime()),
  };
}

/**
 * Auto-capture snapshot at interval (use with caution)
 */
export function startPeriodicSnapshots(
  intervalMs: number = 60000, // Default: 1 minute
  tenantId?: string | null
): NodeJS.Timeout {
  return setInterval(() => {
    const state = getCurrentSystemMetrics();
    captureSnapshot(state, { trigger: 'periodic' }, tenantId);
  }, intervalMs);
}

/**
 * Stop periodic snapshots
 */
export function stopPeriodicSnapshots(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
