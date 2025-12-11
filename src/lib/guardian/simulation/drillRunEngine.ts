/**
 * Guardian I07: Drill Run Engine
 *
 * Runtime engine that drives drill execution and records operator responses.
 * Never triggers real notifications or writes to real incident/alert tables.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianDrillRunContext {
  tenantId: string;
  drillId: string;
  mode: 'guided' | 'freeform';
  operatorId?: string;
  teamName?: string;
  maxDurationSeconds?: number;
  now: Date;
}

export interface GuardianDrillRunState {
  runId: string;
  startedAt: Date;
  status: 'running' | 'completed' | 'cancelled';
  totalEvents: number;
  respondedEvents: number;
}

export interface GuardianDrillTimelineEvent {
  id: string;
  sequenceIndex: number;
  occurredOffsetSeconds: number;
  eventType: string;
  severity?: string;
  message: string;
  details: Record<string, unknown>;
}

export interface GuardianDrillTimeline {
  events: GuardianDrillTimelineEvent[];
  run: GuardianDrillRunState;
}

/**
 * Start a new drill run
 */
export async function startDrillRun(context: GuardianDrillRunContext): Promise<GuardianDrillRunState> {
  const supabase = getSupabaseServer();

  // Count total events in the drill
  const { count: totalEvents, error: countError } = await supabase
    .from('guardian_incident_drill_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', context.tenantId)
    .eq('drill_id', context.drillId);

  if (countError) {
    throw new Error(`Failed to count drill events: ${countError.message}`);
  }

  // Create run record
  const { data: run, error: runError } = await supabase
    .from('guardian_incident_drill_runs')
    .insert({
      tenant_id: context.tenantId,
      drill_id: context.drillId,
      status: 'running',
      mode: context.mode,
      operator_id: context.operatorId,
      team_name: context.teamName,
      max_duration_seconds: context.maxDurationSeconds,
      total_events: totalEvents || 0,
      responded_events: 0,
      started_at: context.now.toISOString(),
    })
    .select('id, started_at')
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create drill run: ${runError?.message || 'Unknown error'}`);
  }

  return {
    runId: run.id,
    startedAt: new Date(run.started_at),
    status: 'running',
    totalEvents: totalEvents || 0,
    respondedEvents: 0,
  };
}

/**
 * Get drill timeline with events and current run state
 */
export async function getDrillTimeline(
  tenantId: string,
  runId: string
): Promise<GuardianDrillTimeline> {
  const supabase = getSupabaseServer();

  // Load run
  const { data: run, error: runError } = await supabase
    .from('guardian_incident_drill_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Drill run not found: ${runError?.message || 'Unknown error'}`);
  }

  // Load drill events
  const { data: events, error: eventsError } = await supabase
    .from('guardian_incident_drill_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('drill_id', run.drill_id)
    .order('sequence_index', { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to load drill events: ${eventsError.message}`);
  }

  const timelineEvents: GuardianDrillTimelineEvent[] = (events || []).map((evt) => ({
    id: evt.id,
    sequenceIndex: evt.sequence_index,
    occurredOffsetSeconds: evt.occurred_offset_seconds,
    eventType: evt.event_type,
    severity: evt.severity,
    message: evt.message,
    details: evt.details || {},
  }));

  return {
    events: timelineEvents,
    run: {
      runId: run.id,
      startedAt: new Date(run.started_at),
      status: run.status,
      totalEvents: run.total_events,
      respondedEvents: run.responded_events,
    },
  };
}

export interface GuardianDrillResponsePayload {
  responseText: string;
  responseType: 'decision' | 'note' | 'command' | 'classification';
  respondedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Record an operator response to a drill event
 */
export async function recordDrillResponse(
  tenantId: string,
  runId: string,
  eventId: string,
  operatorId: string | undefined,
  payload: GuardianDrillResponsePayload
): Promise<void> {
  const supabase = getSupabaseServer();

  // Verify run exists and is running
  const { data: run, error: runError } = await supabase
    .from('guardian_incident_drill_runs')
    .select('status')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Drill run not found: ${runError?.message || 'Unknown error'}`);
  }

  if (run.status !== 'running') {
    throw new Error(`Drill run is not running (status: ${run.status})`);
  }

  // Verify event exists
  const { data: event, error: eventError } = await supabase
    .from('guardian_incident_drill_events')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error(`Drill event not found: ${eventError?.message || 'Unknown error'}`);
  }

  const respondedAt = payload.respondedAt || new Date();

  // Insert response
  const { error: responseError } = await supabase
    .from('guardian_incident_drill_responses')
    .insert({
      tenant_id: tenantId,
      drill_run_id: runId,
      event_id: eventId,
      operator_id: operatorId,
      responded_at: respondedAt.toISOString(),
      response_text: payload.responseText,
      response_type: payload.responseType,
      metadata: payload.metadata,
    });

  if (responseError) {
    throw new Error(`Failed to record response: ${responseError.message}`);
  }

  // Update responded_events counter
  const { error: updateError } = await supabase.rpc(
    'increment_drill_responded_events',
    { p_run_id: runId, p_tenant_id: tenantId }
  );

  // If RPC doesn't exist, do it manually
  if (updateError) {
    const { data: currentRun } = await supabase
      .from('guardian_incident_drill_runs')
      .select('responded_events')
      .eq('id', runId)
      .eq('tenant_id', tenantId)
      .single();

    if (currentRun) {
      await supabase
        .from('guardian_incident_drill_runs')
        .update({ responded_events: (currentRun.responded_events || 0) + 1 })
        .eq('id', runId)
        .eq('tenant_id', tenantId);
    }
  }
}

export interface CompleteDrillRunOptions {
  finalScore?: Record<string, unknown>;
  summary?: string;
}

/**
 * Mark a drill run as completed
 */
export async function completeDrillRun(
  tenantId: string,
  runId: string,
  options?: CompleteDrillRunOptions
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_incident_drill_runs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      score: options?.finalScore,
      summary: options?.summary,
    })
    .eq('tenant_id', tenantId)
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to complete drill run: ${error.message}`);
  }
}

/**
 * Cancel a drill run
 */
export async function cancelDrillRun(
  tenantId: string,
  runId: string,
  reason?: string
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_incident_drill_runs')
    .update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
      error_message: reason,
    })
    .eq('tenant_id', tenantId)
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to cancel drill run: ${error.message}`);
  }
}

/**
 * Get drill responses for a run
 */
export async function getDrillResponses(
  tenantId: string,
  runId: string
): Promise<
  Array<{
    id: string;
    eventId: string;
    operatorId?: string;
    respondedAt: Date;
    responseText: string;
    responseType: string;
    qualityScore?: number;
    latencyMs?: number;
  }>
> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_incident_drill_responses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('drill_run_id', runId)
    .order('responded_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load responses: ${error.message}`);
  }

  return (data || []).map((r) => ({
    id: r.id,
    eventId: r.event_id,
    operatorId: r.operator_id,
    respondedAt: new Date(r.responded_at),
    responseText: r.response_text,
    responseType: r.response_type,
    qualityScore: r.quality_score,
    latencyMs: r.latency_ms,
  }));
}
