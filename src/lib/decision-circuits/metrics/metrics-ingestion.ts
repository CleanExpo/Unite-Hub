/**
 * Metrics Ingestion Service
 * Main orchestrator for webhook processing: normalize, attribute, rollup, persist
 */

import { createClient } from '@/lib/supabase/server';
import { type MetricsProvider, type NormalizedEvent } from './metrics-types';
import { normalizeProviderEvent, upsertAttributionMap, findAttributionMapping } from './metrics-attribution';
import { applyEventToRollups } from './metrics-rollup';

/**
 * Main webhook ingestion handler
 * 1. Persist raw webhook
 * 2. Normalize event
 * 3. Find or create attribution
 * 4. Apply to rollups
 */
export async function ingestWebhookEvent(
  workspaceId: string,
  provider: MetricsProvider,
  rawPayload: Record<string, unknown>,
  signatureVerified: boolean
): Promise<{
  success: boolean;
  event_id?: string;
  normalized_event?: NormalizedEvent;
  reason?: string;
}> {
  const supabase = await createClient();

  try {
    // Step 1: Normalize the event
    const normalizedEvent = await normalizeProviderEvent(provider, rawPayload);

    if (!normalizedEvent) {
      return {
        success: false,
        reason: `Failed to normalize ${provider} event`,
      };
    }

    // Step 2: Persist raw webhook event (idempotent)
    const { data: webhookEvent, error: persistError } = await supabase
      .from('metrics_webhook_events')
      .upsert(
        {
          workspace_id: workspaceId,
          provider,
          provider_event_id: normalizedEvent.provider_event_id,
          event_type: normalizedEvent.event_type,
          raw_payload: rawPayload,
          signature_verified: signatureVerified,
          occurred_at: normalizedEvent.occurred_at,
          received_at: new Date().toISOString(),
          processed: false,
        },
        {
          onConflict: 'workspace_id,provider,provider_event_id',
        }
      )
      .select()
      .single();

    if (persistError || !webhookEvent) {
      console.error('Failed to persist webhook event:', persistError);
      return {
        success: false,
        reason: 'Failed to persist webhook event',
      };
    }

    // Step 3: Find or create attribution mapping
    // Note: Attribution context should be provided by client or found in event metadata
    // For now, we mark as unmapped and let async job find context
    const attribution = await upsertAttributionMap({
      workspace_id: workspaceId,
      provider,
      provider_object_id: normalizedEvent.provider_object_id,
      circuit_execution_id: 'UNMAPPED',
      channel: provider === 'sendgrid' || provider === 'resend' ? 'email' : 'social',
      platform: provider,
      recipient_hash: normalizedEvent.recipient_hash,
      recipient_identifier: normalizedEvent.recipient_identifier,
    });

    // Step 4: Apply to rollups if attribution found
    if (attribution && attribution.circuit_execution_id !== 'UNMAPPED') {
      const rollupApplied = await applyEventToRollups(
        workspaceId,
        attribution.circuit_execution_id,
        attribution.ab_test_id,
        attribution.variant_id,
        provider === 'sendgrid' || provider === 'resend' ? 'email' : 'social',
        provider,
        normalizedEvent
      );

      if (!rollupApplied) {
        console.warn('Failed to apply event to rollups');
      }
    }

    // Step 5: Mark webhook as processed
    await supabase
      .from('metrics_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookEvent.id);

    return {
      success: true,
      event_id: webhookEvent.id,
      normalized_event: normalizedEvent,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Webhook ingestion error:', message);
    return {
      success: false,
      reason: `Ingestion error: ${message}`,
    };
  }
}

/**
 * Batch ingest multiple events
 * Used for backfill operations
 */
export async function ingestWebhookEvents(
  workspaceId: string,
  provider: MetricsProvider,
  payloads: Record<string, unknown>[],
  signatureVerified: boolean = true
): Promise<{
  succeeded: number;
  failed: number;
  events: Array<{ success: boolean; event_id?: string; reason?: string }>;
}> {
  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const payload of payloads) {
    const result = await ingestWebhookEvent(workspaceId, provider, payload, signatureVerified);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    results.push(result);
  }

  return {
    succeeded,
    failed,
    events: results,
  };
}

/**
 * Reprocess unprocessed webhook events
 * Called when initial attribution wasn't available
 */
export async function reprocessUnprocessedWebhooks(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  try {
    const { data: unprocessed, error: fetchError } = await supabase
      .from('metrics_webhook_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('processed', false)
      .limit(100);

    if (fetchError || !unprocessed) {
      return 0;
    }

    let processed = 0;

    for (const webhook of unprocessed) {
      // Check if we can now find attribution
      const attribution = await findAttributionMapping(
        workspaceId,
        webhook.provider,
        webhook.raw_payload?.provider_object_id as string
      );

      if (attribution && attribution.circuit_execution_id !== 'UNMAPPED') {
        // Normalize and apply to rollups
        const normalizedEvent = await normalizeProviderEvent(webhook.provider, webhook.raw_payload);

        if (normalizedEvent) {
          await applyEventToRollups(
            workspaceId,
            attribution.circuit_execution_id,
            attribution.ab_test_id,
            attribution.variant_id,
            webhook.provider === 'sendgrid' || webhook.provider === 'resend' ? 'email' : 'social',
            webhook.provider,
            normalizedEvent
          );

          // Mark as processed
          await supabase
            .from('metrics_webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .eq('id', webhook.id);

          processed++;
        }
      }
    }

    return processed;
  } catch (error) {
    console.error('Failed to reprocess webhooks:', error);
    return 0;
  }
}

/**
 * Enqueue backfill job
 * Creates a backfill job record for async processing
 */
export async function enqueueBackfill(
  workspaceId: string,
  provider: MetricsProvider,
  channel: 'email' | 'social',
  dateStart: string,
  dateEnd: string
): Promise<{ job_id: string; status: string } | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('metrics_backfill_jobs')
      .insert([
        {
          workspace_id: workspaceId,
          provider,
          channel,
          date_start: dateStart,
          date_end: dateEnd,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to enqueue backfill:', error);
      return null;
    }

    return {
      job_id: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('Backfill enqueue error:', error);
    return null;
  }
}

/**
 * Mark webhook event as reprocessable
 * Increments reprocessing_count
 */
export async function markForReprocessing(eventId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('metrics_webhook_events')
      .update({
        processed: false,
        reprocessing_count: supabase.rpc('increment', { column: 'reprocessing_count' }),
      })
      .eq('id', eventId);

    if (error) {
      console.error('Failed to mark for reprocessing:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Reprocessing mark error:', error);
    return false;
  }
}

/**
 * Get ingestion health stats
 */
export async function getIngestionHealth(workspaceId: string): Promise<{
  total_events: number;
  processed_events: number;
  unprocessed_events: number;
  unmapped_attributions: number;
  last_ingest_at?: string;
} | null> {
  const supabase = await createClient();

  try {
    const [{ data: totalEvents }, { data: processedEvents }, { data: unmappedAttribution }] = await Promise.all([
      supabase
        .from('metrics_webhook_events')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('metrics_webhook_events')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('processed', true),
      supabase
        .from('metrics_attribution_map')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'unmapped'),
    ]);

    const { data: latestEvent } = await supabase
      .from('metrics_webhook_events')
      .select('received_at')
      .eq('workspace_id', workspaceId)
      .order('received_at', { ascending: false })
      .limit(1)
      .single();

    return {
      total_events: totalEvents?.count || 0,
      processed_events: processedEvents?.count || 0,
      unprocessed_events: (totalEvents?.count || 0) - (processedEvents?.count || 0),
      unmapped_attributions: unmappedAttribution?.count || 0,
      last_ingest_at: latestEvent?.received_at,
    };
  } catch (error) {
    console.error('Failed to get ingestion health:', error);
    return null;
  }
}
