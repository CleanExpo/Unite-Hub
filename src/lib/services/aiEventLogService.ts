/**
 * AI Event Log Service
 * Phase 35: Integrity Framework
 *
 * Tracks all AI-generated events for full transparency
 */

import { getSupabaseServer } from "@/lib/supabase";

export type EventType =
  | "concept_generated"
  | "video_generated"
  | "audio_generated"
  | "copy_generated"
  | "image_generated"
  | "approval_requested"
  | "item_approved"
  | "item_rejected";

export interface AIEvent {
  id: string;
  client_id: string;
  model_used: string;
  event_type: EventType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Log an AI event
 */
export async function logEvent(
  clientId: string,
  modelUsed: string,
  eventType: EventType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<AIEvent | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("ai_event_log")
    .insert({
      client_id: clientId,
      model_used: modelUsed,
      event_type: eventType,
      description,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging AI event:", error);
    return null;
  }

  return data as AIEvent;
}

/**
 * Get timeline for a client
 */
export async function getTimelineForClient(
  clientId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventType?: EventType;
    modelUsed?: string;
  }
): Promise<AIEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("ai_event_log")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }

  if (options?.modelUsed) {
    query = query.eq("model_used", options.modelUsed);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timeline:", error);
    return [];
  }

  return data as AIEvent[];
}

/**
 * Get event counts by type
 */
export async function getEventCounts(
  clientId: string
): Promise<Record<EventType, number>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("ai_event_log")
    .select("event_type")
    .eq("client_id", clientId);

  if (error) {
    console.error("Error fetching event counts:", error);
    return {} as Record<EventType, number>;
  }

  const counts: Partial<Record<EventType, number>> = {};
  data.forEach((item) => {
    const type = item.event_type as EventType;
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts as Record<EventType, number>;
}

/**
 * Get events by model
 */
export async function getEventsByModel(
  clientId: string
): Promise<Record<string, number>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("ai_event_log")
    .select("model_used")
    .eq("client_id", clientId);

  if (error) {
    console.error("Error fetching events by model:", error);
    return {};
  }

  const counts: Record<string, number> = {};
  data.forEach((item) => {
    counts[item.model_used] = (counts[item.model_used] || 0) + 1;
  });

  return counts;
}
