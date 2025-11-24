/**
 * Scaling History Service
 * Phase 86: Log and retrieve scaling history events
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ScalingHistoryEvent,
  ScalingEventType,
  ScalingActor,
  ScalingMode,
} from './scalingModeTypes';

/**
 * Log a mode change event
 */
export async function logModeChange(
  environment: string,
  oldMode: ScalingMode,
  newMode: ScalingMode,
  reason: string,
  actor: ScalingActor,
  snapshotId?: string,
  metadata?: Record<string, unknown>
): Promise<ScalingHistoryEvent> {
  return logEvent(
    environment,
    'mode_change',
    reason,
    actor,
    snapshotId,
    {
      ...metadata,
      old_mode: oldMode,
      new_mode: newMode,
    }
  );
}

/**
 * Log a generic event
 */
export async function logEvent(
  environment: string,
  eventType: ScalingEventType,
  reason: string,
  actor: ScalingActor,
  snapshotId?: string,
  metadata?: Record<string, unknown>
): Promise<ScalingHistoryEvent> {
  const supabase = await getSupabaseServer();

  const eventData: any = {
    environment,
    event_type: eventType,
    reason_markdown: reason,
    actor,
    snapshot_id: snapshotId,
    metadata: metadata || {},
  };

  // Extract mode fields if present in metadata
  if (metadata?.old_mode) {
    eventData.old_mode = metadata.old_mode;
  }
  if (metadata?.new_mode) {
    eventData.new_mode = metadata.new_mode;
  }

  const { data, error } = await supabase
    .from('scaling_history')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log event: ${error.message}`);
  }

  return data;
}

/**
 * Log a freeze event
 */
export async function logFreeze(
  environment: string,
  reason: string,
  actor: ScalingActor,
  snapshotId?: string
): Promise<ScalingHistoryEvent> {
  return logEvent(environment, 'freeze', reason, actor, snapshotId);
}

/**
 * Log an unfreeze event
 */
export async function logUnfreeze(
  environment: string,
  reason: string,
  actor: ScalingActor
): Promise<ScalingHistoryEvent> {
  return logEvent(environment, 'unfreeze', reason, actor);
}

/**
 * Log a note
 */
export async function logNote(
  environment: string,
  note: string,
  actor: ScalingActor
): Promise<ScalingHistoryEvent> {
  return logEvent(environment, 'note', note, actor);
}

/**
 * Log a capacity update
 */
export async function logCapacityUpdate(
  environment: string,
  oldCapacity: number,
  newCapacity: number,
  reason: string,
  actor: ScalingActor
): Promise<ScalingHistoryEvent> {
  return logEvent(
    environment,
    'capacity_update',
    reason,
    actor,
    undefined,
    {
      old_capacity: oldCapacity,
      new_capacity: newCapacity,
    }
  );
}

/**
 * List history events
 */
export async function listHistory(
  environment: string,
  limit: number = 50
): Promise<ScalingHistoryEvent[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_history')
    .select('*')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list history: ${error.message}`);
  }

  return data || [];
}

/**
 * List history by event type
 */
export async function listHistoryByType(
  environment: string,
  eventType: ScalingEventType,
  limit: number = 20
): Promise<ScalingHistoryEvent[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_history')
    .select('*')
    .eq('environment', environment)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list history by type: ${error.message}`);
  }

  return data || [];
}

/**
 * Get event display text
 */
export function getEventTypeDisplayText(eventType: ScalingEventType): string {
  const texts: Record<ScalingEventType, string> = {
    mode_change: 'Mode Change',
    capacity_update: 'Capacity Update',
    freeze: 'Onboarding Frozen',
    unfreeze: 'Onboarding Resumed',
    note: 'Note',
    config_update: 'Config Update',
  };
  return texts[eventType] || eventType;
}

/**
 * Get actor display text
 */
export function getActorDisplayText(actor: ScalingActor): string {
  const texts: Record<ScalingActor, string> = {
    founder: 'Founder',
    system: 'System',
    admin: 'Admin',
  };
  return texts[actor] || actor;
}
