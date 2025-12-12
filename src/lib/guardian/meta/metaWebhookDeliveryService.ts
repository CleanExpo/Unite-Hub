import { getSupabaseServer } from '@/lib/supabase';

/**
 * GuardianWebhookDeliveryContext — Configuration for webhook delivery processing.
 */
export interface GuardianWebhookDeliveryContext {
  maxBatchSize?: number; // Default: 50
  maxAttempts?: number; // Default: 3
  timeoutMs?: number; // Default: 10000 (10 seconds)
}

/**
 * GuardianMetaWebhookEvent — Webhook event from database.
 */
export interface GuardianMetaWebhookEvent {
  id: string;
  tenant_id: string;
  created_at: string;
  integration_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'discarded';
  attempt_count: number;
  last_attempt_at?: string;
  last_error?: string;
}

/**
 * GuardianMetaIntegrationForDelivery — Integration record needed for delivery.
 */
export interface GuardianMetaIntegrationForDelivery {
  id: string;
  tenant_id: string;
  integration_key: string;
  config: {
    webhook_url?: string;
    headers?: Record<string, string>;
    [key: string]: any;
  };
}

/**
 * fetchPendingWebhookEvents — Load a batch of pending or retryable webhook events.
 * Returns events with status='pending' or 'failed' that haven't exceeded maxAttempts.
 */
export async function fetchPendingWebhookEvents(
  ctx?: GuardianWebhookDeliveryContext
): Promise<
  (GuardianMetaWebhookEvent & {
    integration?: GuardianMetaIntegrationForDelivery;
  })[]
> {
  const supabase = getSupabaseServer();
  const maxBatchSize = ctx?.maxBatchSize || 50;
  const maxAttempts = ctx?.maxAttempts || 3;

  // Query pending and failed events (below retry limit)
  const { data: events, error } = await supabase
    .from('guardian_meta_webhook_events')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempt_count', maxAttempts)
    .order('created_at', { ascending: true })
    .limit(maxBatchSize);

  if (error) {
    console.error('[metaWebhookDeliveryService] Failed to fetch pending events:', error);
    return [];
  }

  if (!events || events.length === 0) {
    return [];
  }

  // Join with integrations to get config
  const integrationIds = [...new Set((events as any[]).map((e) => e.integration_id))];
  const { data: integrations, error: integrationError } = await supabase
    .from('guardian_meta_integrations')
    .select('id, tenant_id, integration_key, config')
    .in('id', integrationIds);

  if (integrationError) {
    console.error('[metaWebhookDeliveryService] Failed to fetch integration configs:', integrationError);
    return (events as any[]).map((e) => ({ ...e, integration: undefined }));
  }

  // Map integrations by id
  const integrationsById = new Map(
    (integrations as any[]).map((i) => [i.id, i as GuardianMetaIntegrationForDelivery])
  );

  // Attach integrations to events
  return (events as any[]).map((e) => ({
    ...e,
    integration: integrationsById.get(e.integration_id),
  }));
}

/**
 * deliverWebhookEvent — Deliver a single webhook event to its integration endpoint.
 * Returns { success: boolean; error?: string } without throwing.
 */
export async function deliverWebhookEvent(
  event: GuardianMetaWebhookEvent,
  integration: GuardianMetaIntegrationForDelivery,
  timeoutMs?: number
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = integration.config?.webhook_url;
  if (!webhookUrl) {
    return { success: false, error: 'No webhook_url in integration config' };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Guardian-Event-Type': event.event_type,
    'X-Guardian-Event-ID': event.id,
    'X-Guardian-Timestamp': event.created_at,
  };

  // Add custom headers from config
  if (integration.config?.headers && typeof integration.config.headers === 'object') {
    Object.assign(headers, integration.config.headers);
  }

  // Build request body
  const requestBody = {
    event_id: event.id,
    event_type: event.event_type,
    tenant_id: event.tenant_id,
    timestamp: event.created_at,
    payload: event.payload,
  };

  try {
    const timeout = timeoutMs || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * processMetaWebhooks — Main webhook delivery loop.
 * 1. Fetches pending events
 * 2. Attempts delivery for each
 * 3. Updates status and error tracking
 * 4. Discards events that exceed max retries
 */
export async function processMetaWebhooks(ctx?: GuardianWebhookDeliveryContext): Promise<void> {
  const maxAttempts = ctx?.maxAttempts || 3;
  const supabase = getSupabaseServer();

  // Fetch pending events
  const events = await fetchPendingWebhookEvents(ctx);

  if (events.length === 0) {
    console.log('[metaWebhookDeliveryService] No pending webhook events to process');
    return;
  }

  console.log(`[metaWebhookDeliveryService] Processing ${events.length} webhook events`);

  // Process each event
  const results = await Promise.allSettled(
    events.map(async (event) => {
      if (!event.integration) {
        // Integration was deleted or not found; discard event
        return {
          eventId: event.id,
          tenantId: event.tenant_id,
          status: 'discarded',
          error: 'Integration not found',
        };
      }

      // Attempt delivery
      const { success, error } = await deliverWebhookEvent(
        event,
        event.integration,
        ctx?.timeoutMs
      );

      if (success) {
        return {
          eventId: event.id,
          tenantId: event.tenant_id,
          status: 'delivered',
          error: null,
        };
      }

      // Delivery failed; check if we should retry or discard
      const nextAttemptCount = event.attempt_count + 1;
      if (nextAttemptCount >= maxAttempts) {
        return {
          eventId: event.id,
          tenantId: event.tenant_id,
          status: 'discarded',
          error: error || 'Max retries exceeded',
        };
      }

      return {
        eventId: event.id,
        tenantId: event.tenant_id,
        status: 'failed',
        error: error || 'Delivery failed',
      };
    })
  );

  // Batch update results
  const updates: {
    id: string;
    status: 'delivered' | 'failed' | 'discarded';
    attempt_count: number;
    last_attempt_at: string;
    last_error: string | null;
  }[] = [];

  for (let i = 0; i < events.length; i++) {
    const result = results[i];
    const event = events[i];

    if (result.status === 'rejected') {
      console.error(
        `[metaWebhookDeliveryService] Unexpected error processing event ${event.id}:`,
        result.reason
      );
      updates.push({
        id: event.id,
        status: 'discarded',
        attempt_count: event.attempt_count + 1,
        last_attempt_at: new Date().toISOString(),
        last_error: 'Unexpected error during delivery',
      });
      continue;
    }

    const outcome = result.value;
    updates.push({
      id: outcome.eventId,
      status: outcome.status,
      attempt_count: event.attempt_count + 1,
      last_attempt_at: new Date().toISOString(),
      last_error: outcome.error,
    });
  }

  // Apply updates
  for (const update of updates) {
    const { error } = await supabase
      .from('guardian_meta_webhook_events')
      .update({
        status: update.status,
        attempt_count: update.attempt_count,
        last_attempt_at: update.last_attempt_at,
        last_error: update.last_error,
      })
      .eq('id', update.id);

    if (error) {
      console.error(`[metaWebhookDeliveryService] Failed to update event ${update.id}:`, error);
    }
  }

  // Log summary
  const delivered = updates.filter((u) => u.status === 'delivered').length;
  const failed = updates.filter((u) => u.status === 'failed').length;
  const discarded = updates.filter((u) => u.status === 'discarded').length;

  console.log(
    `[metaWebhookDeliveryService] Webhook processing complete: ${delivered} delivered, ${failed} failed, ${discarded} discarded`
  );
}

/**
 * getWebhookEventStats — Get webhook delivery statistics for a tenant or integration.
 */
export async function getWebhookEventStats(
  tenantId: string,
  integrationId?: string
): Promise<{
  total_events: number;
  pending: number;
  delivered: number;
  failed: number;
  discarded: number;
  last_delivered_at?: string;
  events_last_24h: number;
}> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_webhook_events')
    .select('status, created_at', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (integrationId) {
    query = query.eq('integration_id', integrationId);
  }

  const { data, count } = await query;

  if (!data) {
    return {
      total_events: 0,
      pending: 0,
      delivered: 0,
      failed: 0,
      discarded: 0,
      events_last_24h: 0,
    };
  }

  const statuses = data.reduce(
    (acc: Record<string, number>, event: any) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    },
    {}
  );

  // Get last delivered timestamp
  const { data: lastDelivered } = await supabase
    .from('guardian_meta_webhook_events')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Count events from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('guardian_meta_webhook_events')
    .select('id', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .gte('created_at', oneDayAgo);

  return {
    total_events: count || 0,
    pending: statuses.pending || 0,
    delivered: statuses.delivered || 0,
    failed: statuses.failed || 0,
    discarded: statuses.discarded || 0,
    last_delivered_at: lastDelivered?.created_at,
    events_last_24h: recentCount || 0,
  };
}
