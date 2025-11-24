/**
 * Networked Intelligence Exchange
 * Phase 120: Message bus for engine intelligence sharing
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ExchangeMessage {
  id: string;
  producerEngine: string;
  consumerEngine: string;
  payload: Record<string, unknown>;
  confidence: number;
  tenantId: string | null;
  createdAt: string;
}

export async function getMessages(
  producerEngine?: string,
  consumerEngine?: string
): Promise<ExchangeMessage[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intelligence_exchange_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (producerEngine) query = query.eq('producer_engine', producerEngine);
  if (consumerEngine) query = query.eq('consumer_engine', consumerEngine);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    producerEngine: row.producer_engine,
    consumerEngine: row.consumer_engine,
    payload: row.payload,
    confidence: row.confidence,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
  }));
}

export async function publishMessage(
  producerEngine: string,
  consumerEngine: string,
  payload: Record<string, unknown>,
  confidence: number,
  tenantId?: string
): Promise<ExchangeMessage | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_exchange_messages')
    .insert({
      producer_engine: producerEngine,
      consumer_engine: consumerEngine,
      payload,
      confidence,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    producerEngine: data.producer_engine,
    consumerEngine: data.consumer_engine,
    payload: data.payload,
    confidence: data.confidence,
    tenantId: data.tenant_id,
    createdAt: data.created_at,
  };
}
