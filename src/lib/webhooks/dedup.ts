// src/lib/webhooks/dedup.ts
import { createServiceClient } from '@/lib/supabase/service'

type Provider = 'whatsapp' | 'paperclip'

/**
 * Returns true if this event has already been seen (duplicate).
 * Treats 'failed' status as retriable — not a duplicate.
 */
export async function isDuplicate(provider: Provider, eventId: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('provider', provider)
    .eq('event_id', eventId)
    .single()
  return !!data && data.status !== 'failed'
}

/**
 * Insert new webhook event record with status='processing'.
 * Returns the row id for later status updates.
 */
export async function insertEvent(
  provider: Provider,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<string> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('webhook_events')
    .insert({
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      status: 'processing',
      attempts: 1,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/**
 * Mark event as processed or failed after handling.
 */
export async function markEvent(
  id: string,
  status: 'processed' | 'failed',
  error?: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('webhook_events')
    .update({
      status,
      error: error ?? null,
      processed_at: status === 'processed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
}
