/**
 * Observability Service
 * Phase: D67 - Unite Observability & Event Timeline
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface EventType {
  id: string;
  key: string;
  name: string;
  category: string;
  severity: string;
  description?: string;
  schema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createEventType(
  input: Omit<EventType, 'id' | 'created_at' | 'updated_at'>
): Promise<EventType> {
  const { data, error } = await supabaseAdmin
    .from('unite_event_types')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create event type: ${error.message}`);
  return data as EventType;
}

export async function listEventTypes(filters?: {
  category?: string;
  severity?: string;
  limit?: number;
}): Promise<EventType[]> {
  let query = supabaseAdmin.from('unite_event_types').select('*').order('category');

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list event types: ${error.message}`);
  return data as EventType[];
}

// ============================================================================
// EVENTS
// ============================================================================

export interface Event {
  id: string;
  tenant_id?: string;
  source: string;
  event_type_key: string;
  severity: string;
  message?: string;
  payload?: Record<string, unknown>;
  correlation_id?: string;
  request_id?: string;
  actor_type?: string;
  actor_id?: string;
  context?: Record<string, unknown>;
  occurred_at: string;
  ingested_at: string;
}

export async function ingestEvent(
  tenantId: string | null,
  input: Omit<Event, 'id' | 'tenant_id' | 'ingested_at'>
): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('unite_events')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to ingest event: ${error.message}`);
  return data as Event;
}

export async function ingestBatch(
  tenantId: string | null,
  events: Array<Omit<Event, 'id' | 'tenant_id' | 'ingested_at'>>
): Promise<number> {
  const records = events.map((e) => ({ tenant_id: tenantId, ...e }));
  const { error, count } = await supabaseAdmin.from('unite_events').insert(records);
  if (error) throw new Error(`Failed to ingest batch: ${error.message}`);
  return count || 0;
}

export async function getEvents(
  tenantId: string | null,
  filters?: {
    event_type_key?: string;
    severity?: string;
    source?: string;
    correlation_id?: string;
    start_time?: string;
    end_time?: string;
    limit?: number;
  }
): Promise<Event[]> {
  let query = supabaseAdmin.from('unite_events').select('*').order('occurred_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.event_type_key) query = query.eq('event_type_key', filters.event_type_key);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.correlation_id) query = query.eq('correlation_id', filters.correlation_id);
  if (filters?.start_time) query = query.gte('occurred_at', filters.start_time);
  if (filters?.end_time) query = query.lte('occurred_at', filters.end_time);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get events: ${error.message}`);
  return data as Event[];
}

export async function getEventTimeline(
  tenantId: string | null,
  hours: number = 24
): Promise<
  Array<{
    hour: string;
    total: number;
    errors: number;
    warnings: number;
    info: number;
  }>
> {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabaseAdmin
    .from('unite_events')
    .select('occurred_at, severity')
    .eq('tenant_id', tenantId || '')
    .gte('occurred_at', startTime);

  if (!events) return [];

  // Group by hour
  const timeline: Record<
    string,
    { total: number; errors: number; warnings: number; info: number }
  > = {};

  events.forEach((event) => {
    const hour = new Date(event.occurred_at).toISOString().substring(0, 13) + ':00:00Z';
    if (!timeline[hour]) {
      timeline[hour] = { total: 0, errors: 0, warnings: 0, info: 0 };
    }
    timeline[hour].total++;
    if (event.severity === 'error' || event.severity === 'critical') {
      timeline[hour].errors++;
    } else if (event.severity === 'warning') {
      timeline[hour].warnings++;
    } else {
      timeline[hour].info++;
    }
  });

  return Object.entries(timeline)
    .map(([hour, counts]) => ({ hour, ...counts }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

// ============================================================================
// ANNOTATIONS
// ============================================================================

export interface EventAnnotation {
  id: string;
  event_id: string;
  author_id?: string;
  note: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export async function annotateEvent(
  eventId: string,
  input: Omit<EventAnnotation, 'id' | 'event_id' | 'created_at'>
): Promise<EventAnnotation> {
  const { data, error } = await supabaseAdmin
    .from('unite_event_annotations')
    .insert({ event_id: eventId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to annotate event: ${error.message}`);
  return data as EventAnnotation;
}

export async function getAnnotations(eventId: string): Promise<EventAnnotation[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_event_annotations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get annotations: ${error.message}`);
  return data as EventAnnotation[];
}

// ============================================================================
// CORRELATION
// ============================================================================

export async function getCorrelatedEvents(
  correlationId: string,
  limit: number = 100
): Promise<Event[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_events')
    .select('*')
    .eq('correlation_id', correlationId)
    .order('occurred_at')
    .limit(limit);

  if (error) throw new Error(`Failed to get correlated events: ${error.message}`);
  return data as Event[];
}
