/**
 * Metrics Attribution and Normalization Service
 * Maps provider events to circuit execution context
 * Normalizes provider-specific event payloads
 */

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import {
  type MetricsProvider,
  type NormalizedEvent,
  type AttributionInput,
  type AttributionMap,
  type AttributionStatus,
  PROVIDER_EVENT_MAPPINGS,
} from './metrics-types';

/**
 * Normalize provider event payload to standard format
 * Extracts common fields from provider-specific formats
 */
export async function normalizeProviderEvent(
  provider: MetricsProvider,
  payload: Record<string, unknown>
): Promise<NormalizedEvent | null> {
  try {
    switch (provider) {
      case 'sendgrid':
        return normalizeSendGridEvent(payload);

      case 'resend':
        return normalizeResendEvent(payload);

      case 'facebook':
        return normalizeMetaEvent(payload, 'facebook');

      case 'instagram':
        return normalizeMetaEvent(payload, 'instagram');

      case 'linkedin':
        return normalizeLinkedInEvent(payload);

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to normalize ${provider} event:`, error);
    return null;
  }
}

/**
 * Normalize SendGrid event
 * SendGrid sends array of events
 */
function normalizeSendGridEvent(payload: Record<string, unknown>): NormalizedEvent | null {
  const events = Array.isArray(payload) ? payload : [payload];
  if (events.length === 0) {
    return null;
  }

  const event = events[0] as Record<string, unknown>;
  const eventType = (event.event as string) || '';
  const messageId = event.sg_message_id as string;
  const timestamp = event.timestamp as number;

  const mappedType = PROVIDER_EVENT_MAPPINGS.sendgrid[eventType];
  if (!mappedType || !messageId || !timestamp) {
    return null;
  }

  const email = event.email as string;
  const recipientHash = email ? hashEmail(email) : undefined;

  return {
    provider: 'sendgrid',
    event_type: mappedType,
    provider_event_id: `${messageId}-${eventType}-${timestamp}`,
    provider_object_id: messageId,
    occurred_at: new Date(timestamp * 1000).toISOString(),
    recipient_hash: recipientHash,
    recipient_identifier: email,
    metadata: {
      email,
      event_type: eventType,
      url: event.url,
      useragent: event.useragent,
    },
  };
}

/**
 * Normalize Resend event
 */
function normalizeResendEvent(payload: Record<string, unknown>): NormalizedEvent | null {
  const eventType = (payload.type as string) || '';
  const messageId = payload.message_id as string;
  const timestamp = payload.created_at as string;

  const mappedType = PROVIDER_EVENT_MAPPINGS.resend[eventType];
  if (!mappedType || !messageId || !timestamp) {
    return null;
  }

  const email = payload.email as string;
  const recipientHash = email ? hashEmail(email) : undefined;

  return {
    provider: 'resend',
    event_type: mappedType,
    provider_event_id: `${messageId}-${eventType}-${timestamp}`,
    provider_object_id: messageId,
    occurred_at: new Date(timestamp).toISOString(),
    recipient_hash: recipientHash,
    recipient_identifier: email,
    metadata: {
      email,
      event_type: eventType,
      bounce_type: payload.bounce_type,
      complaint_feedback_type: payload.complaint_feedback_type,
    },
  };
}

/**
 * Normalize Meta (Facebook/Instagram) event
 * Meta sends events array
 */
function normalizeMetaEvent(
  payload: Record<string, unknown>,
  platform: 'facebook' | 'instagram'
): NormalizedEvent | null {
  const entry = (payload.entry as Record<string, unknown>[]) || [];
  if (entry.length === 0) {
    return null;
  }

  const messaging = ((entry[0]?.messaging as Record<string, unknown>[]) || [])[0];
  if (!messaging) {
    return null;
  }

  const sender = messaging.sender as Record<string, unknown>;
  const senderId = sender?.id as string;
  const timestamp = messaging.timestamp as number;

  if (!senderId || !timestamp) {
    return null;
  }

  // Meta events are complex; simplify to engagement events
  const message = messaging.message as Record<string, unknown>;
  const postback = messaging.postback as Record<string, unknown>;
  const delivery = messaging.delivery as Record<string, unknown>;

  let eventType: MetricsEventType = 'social_engagement';
  if (delivery) {
    eventType = 'social_impression';
  }
  if (postback) {
    eventType = 'social_click';
  }

  return {
    provider: platform,
    event_type: eventType,
    provider_event_id: `${senderId}-${timestamp}`,
    provider_object_id: senderId,
    occurred_at: new Date(timestamp * 1000).toISOString(),
    metadata: {
      sender_id: senderId,
      message: message,
      postback: postback,
      delivery: delivery,
    },
  };
}

/**
 * Normalize LinkedIn event
 */
function normalizeLinkedInEvent(payload: Record<string, unknown>): NormalizedEvent | null {
  const eventType = (payload.action as string) || '';
  const campaignId = payload.campaignId as string;
  const timestamp = payload.timestamp as number;

  if (!campaignId || !timestamp) {
    return null;
  }

  const mappedType = PROVIDER_EVENT_MAPPINGS.linkedin[eventType] || 'social_engagement';

  return {
    provider: 'linkedin',
    event_type: mappedType,
    provider_event_id: `${campaignId}-${eventType}-${timestamp}`,
    provider_object_id: campaignId,
    occurred_at: new Date(timestamp).toISOString(),
    metadata: {
      campaign_id: campaignId,
      action: eventType,
      impressions: payload.impressions,
      clicks: payload.clicks,
      conversions: payload.conversions,
    },
  };
}

/**
 * Create or update attribution mapping
 * Links provider object ID to circuit execution context
 */
export async function upsertAttributionMap(
  mapping: AttributionInput
): Promise<AttributionMap | null> {
  const supabase = await createClient();

  try {
    // Check if mapping exists
    const { data: existing } = await supabase
      .from('metrics_attribution_map')
      .select('id')
      .eq('workspace_id', mapping.workspace_id)
      .eq('provider', mapping.provider)
      .eq('provider_object_id', mapping.provider_object_id)
      .single();

    if (existing) {
      // Update existing mapping
      const { data, error } = await supabase
        .from('metrics_attribution_map')
        .update({
          circuit_execution_id: mapping.circuit_execution_id,
          ab_test_id: mapping.ab_test_id,
          variant_id: mapping.variant_id,
          client_id: mapping.client_id,
          status: 'mapped' as AttributionStatus,
          mapped_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update attribution mapping:', error);
        return null;
      }

      return data as AttributionMap;
    }

    // Create new mapping
    const { data, error } = await supabase
      .from('metrics_attribution_map')
      .insert([
        {
          workspace_id: mapping.workspace_id,
          provider: mapping.provider,
          provider_object_id: mapping.provider_object_id,
          circuit_execution_id: mapping.circuit_execution_id,
          ab_test_id: mapping.ab_test_id,
          variant_id: mapping.variant_id,
          client_id: mapping.client_id,
          channel: mapping.channel,
          platform: mapping.platform,
          recipient_hash: mapping.recipient_hash,
          recipient_identifier: mapping.recipient_identifier,
          status: 'mapped' as AttributionStatus,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create attribution mapping:', error);
      return null;
    }

    return data as AttributionMap;
  } catch (error) {
    console.error('Attribution mapping error:', error);
    return null;
  }
}

/**
 * Find attribution mapping by provider object ID
 * Returns null if not found (attribution_status='unmapped')
 */
export async function findAttributionMapping(
  workspaceId: string,
  provider: MetricsProvider,
  providerObjectId: string
): Promise<AttributionMap | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('metrics_attribution_map')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', provider)
      .eq('provider_object_id', providerObjectId)
      .single();

    if (error) {
      return null;
    }

    return data as AttributionMap;
  } catch (error) {
    console.error('Failed to find attribution mapping:', error);
    return null;
  }
}

/**
 * Get attribution health summary for provider
 */
export async function getAttributionHealth(
  workspaceId: string,
  provider: MetricsProvider
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('metrics_attribution_health')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', provider)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get attribution health:', error);
    return null;
  }
}

/**
 * Hash email for secure storage
 * Uses SHA256 with workspace salt
 */
export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Batch normalize events
 */
export async function normalizeProviderEvents(
  provider: MetricsProvider,
  payloads: Record<string, unknown>[]
): Promise<NormalizedEvent[]> {
  const normalized: NormalizedEvent[] = [];

  for (const payload of payloads) {
    const event = await normalizeProviderEvent(provider, payload);
    if (event) {
      normalized.push(event);
    }
  }

  return normalized;
}
