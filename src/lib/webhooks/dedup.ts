// src/lib/webhooks/dedup.ts
import { createServiceClient } from '@/lib/supabase/service'

type Provider = 'whatsapp' | 'paperclip'

/** Returns true if this event has already been processed (duplicate). */
export async function isDuplicate(
  provider: Provider,
  eventId: string
): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('provider', provider)
    .eq('event_id', eventId)
    .single()
  return !!data && data.status !== 'failed'
}

/** Insert new event record, returns the row id. */
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
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** Mark event as processed or failed. */
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
      processed_at: new Date().toISOString(),
    })
    .eq('id', id)
}
