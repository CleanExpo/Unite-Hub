// src/lib/webhooks/dedup.ts
import { createServiceClient } from '@/lib/supabase/service'

export type Provider = 'whatsapp' | 'paperclip'

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
 * Returns the row id for later status updates, or null if a concurrent
 * request already inserted the same event (PostgreSQL unique_violation 23505).
 */
export async function insertEvent(
  provider: Provider,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<string | null> {
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

  if (error) {
    // 23505 = unique_violation — concurrent request already inserted this event
    if (error.code === '23505') return null
    throw error
  }
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
  const { error: updateError } = await supabase
    .from('webhook_events')
    .update({
      status,
      error: error ?? null,
      processed_at: status === 'processed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (updateError) throw updateError
}
