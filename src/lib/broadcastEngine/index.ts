/**
 * Multi-Agency Broadcast Engine
 * Phase 109: Broadcast intelligence to multiple agencies
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface BroadcastMessage {
  id: string;
  senderAgencyId: string;
  targetScope: {
    type: 'all' | 'regions' | 'agencies';
    ids?: string[];
  };
  messageType: 'intelligence' | 'warning' | 'asset' | 'playbook' | 'announcement';
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
  confidence: number | null;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export interface BroadcastReceipt {
  id: string;
  broadcastId: string;
  recipientAgencyId: string;
  status: 'pending' | 'delivered' | 'seen' | 'acknowledged';
  seenAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export async function getBroadcasts(senderAgencyId: string): Promise<BroadcastMessage[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('broadcast_messages')
    .select('*')
    .eq('sender_agency_id', senderAgencyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    senderAgencyId: row.sender_agency_id,
    targetScope: row.target_scope,
    messageType: row.message_type,
    payload: row.payload,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function createBroadcast(
  senderAgencyId: string,
  messageType: BroadcastMessage['messageType'],
  targetScope: BroadcastMessage['targetScope'],
  payload: BroadcastMessage['payload'],
  confidence?: number
): Promise<BroadcastMessage | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('broadcast_messages')
    .insert({
      sender_agency_id: senderAgencyId,
      target_scope: targetScope,
      message_type: messageType,
      payload,
      confidence,
      uncertainty_notes: messageType === 'intelligence'
        ? 'Intelligence based on available data. Local validation recommended.'
        : null,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    senderAgencyId: data.sender_agency_id,
    targetScope: data.target_scope,
    messageType: data.message_type,
    payload: data.payload,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}

export async function getReceipts(recipientAgencyId: string): Promise<BroadcastReceipt[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('broadcast_receipts')
    .select('*')
    .eq('recipient_agency_id', recipientAgencyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    broadcastId: row.broadcast_id,
    recipientAgencyId: row.recipient_agency_id,
    status: row.status,
    seenAt: row.seen_at,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  }));
}
