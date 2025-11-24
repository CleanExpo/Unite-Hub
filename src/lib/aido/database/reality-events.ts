/**
 * AIDO Reality Events Database Access Layer
 * Real-world event capture for reality loop system
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface RealityEvent {
  id: string;
  client_id: string;
  workspace_id: string;
  event_type: string;
  source_system: string | null;
  source_id: string | null;
  timestamp: string;
  location: string | null;
  raw_payload: Record<string, any> | null;
  normalized_payload: Record<string, any> | null;
  linked_content_asset_ids: string[];
  processing_status: string;
  processing_log: string | null;
  created_at: string;
}

export interface RealityEventInput {
  clientId: string;
  workspaceId: string;
  eventType: string;
  sourceSystem?: string;
  sourceId?: string;
  timestamp: string;
  location?: string;
  rawPayload?: Record<string, any>;
  normalizedPayload?: Record<string, any>;
  linkedContentAssetIds?: string[];
}

/**
 * Create a new reality event
 */
export async function createRealityEvent(data: RealityEventInput): Promise<RealityEvent> {
  const supabase = await getSupabaseServer();

  const { data: event, error } = await supabase
    .from('reality_events')
    .insert({
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      event_type: data.eventType,
      source_system: data.sourceSystem || null,
      source_id: data.sourceId || null,
      timestamp: data.timestamp,
      location: data.location || null,
      raw_payload: data.rawPayload || null,
      normalized_payload: data.normalizedPayload || null,
      linked_content_asset_ids: data.linkedContentAssetIds || [],
      processing_status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create reality event:', error);
    throw new Error(`Failed to create reality event: ${error.message}`);
  }

  return event;
}

/**
 * Get reality events for a workspace
 * Optionally filter by client or event type
 */
export async function getRealityEvents(
  workspaceId: string,
  filters?: { clientId?: string; eventType?: string; processingStatus?: string }
): Promise<RealityEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('reality_events')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType);
  }

  if (filters?.processingStatus) {
    query = query.eq('processing_status', filters.processingStatus);
  }

  const { data, error} = await query.order('timestamp', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch reality events:', error);
    throw new Error(`Failed to fetch reality events: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single reality event by ID
 */
export async function getRealityEvent(id: string, workspaceId: string): Promise<RealityEvent> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('reality_events')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Reality event not found or access denied');
    }
    console.error('[AIDO] Failed to fetch reality event:', error);
    throw new Error(`Failed to fetch reality event: ${error.message}`);
  }

  return data;
}

/**
 * Update reality event processing status
 */
export async function updateRealityEventStatus(
  id: string,
  workspaceId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  processingLog?: string,
  normalizedPayload?: Record<string, any>,
  linkedContentAssetIds?: string[]
): Promise<RealityEvent> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    processing_status: status,
  };

  if (processingLog !== undefined) updateData.processing_log = processingLog;
  if (normalizedPayload !== undefined) updateData.normalized_payload = normalizedPayload;
  if (linkedContentAssetIds !== undefined) updateData.linked_content_asset_ids = linkedContentAssetIds;

  const { data, error } = await supabase
    .from('reality_events')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Reality event not found or access denied');
    }
    console.error('[AIDO] Failed to update reality event:', error);
    throw new Error(`Failed to update reality event: ${error.message}`);
  }

  return data;
}

/**
 * Delete a reality event
 */
export async function deleteRealityEvent(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('reality_events')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete reality event:', error);
    throw new Error(`Failed to delete reality event: ${error.message}`);
  }
}

/**
 * Get pending reality events for processing
 */
export async function getPendingRealityEvents(workspaceId: string, clientId?: string): Promise<RealityEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('reality_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('processing_status', 'pending');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('timestamp', { ascending: true }).limit(100);

  if (error) {
    console.error('[AIDO] Failed to fetch pending reality events:', error);
    throw new Error(`Failed to fetch reality events: ${error.message}`);
  }

  return data || [];
}

/**
 * Get reality events by time range
 */
export async function getRealityEventsByTimeRange(
  workspaceId: string,
  startDate: string,
  endDate: string,
  clientId?: string
): Promise<RealityEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('reality_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('timestamp', startDate)
    .lte('timestamp', endDate);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('timestamp', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch reality events by time range:', error);
    throw new Error(`Failed to fetch reality events: ${error.message}`);
  }

  return data || [];
}
