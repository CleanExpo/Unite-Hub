/**
 * Metrics Rollup Aggregation Service
 * Aggregates normalized events into 1-hour rollup buckets
 * Computes derived metrics (rates, engagement)
 */

import { createClient } from '@/lib/supabase/server';
import {
  type MetricsRollup,
  type RollupFilters,
  type NormalizedEvent,
  type MetricsEventType,
} from './metrics-types';

/**
 * Apply event to appropriate rollup bucket
 * Creates new rollup or updates existing
 */
export async function applyEventToRollups(
  workspaceId: string,
  circuitExecutionId: string,
  abTestId: string | undefined,
  variantId: string | undefined,
  channel: 'email' | 'social',
  platform: string,
  event: NormalizedEvent
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Determine time bucket (hourly)
    const eventDate = new Date(event.occurred_at);
    const timeBucket = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), eventDate.getHours());
    const timeBucketStr = timeBucket.toISOString();

    // Map event to rollup columns
    const rollupUpdate = mapEventToRollupColumns(event.event_type);

    // Check if rollup exists
    const { data: existing } = await supabase
      .from('metrics_rollups')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('circuit_execution_id', circuitExecutionId)
      .eq('ab_test_id', abTestId || '')
      .eq('variant_id', variantId || '')
      .eq('channel', channel)
      .eq('time_bucket', timeBucketStr)
      .single();

    if (existing) {
      // Update existing rollup
      const { error } = await supabase
        .from('metrics_rollups')
        .update({
          ...rollupUpdate,
          event_count: supabase.rpc('increment', { column: 'event_count' }),
          last_event_at: event.occurred_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Failed to update rollup:', error);
        return false;
      }

      return true;
    }

    // Create new rollup
    const { error } = await supabase.from('metrics_rollups').insert([
      {
        workspace_id: workspaceId,
        circuit_execution_id: circuitExecutionId,
        ab_test_id: abTestId,
        variant_id: variantId,
        channel,
        platform,
        time_bucket: timeBucketStr,
        ...rollupUpdate,
        event_count: 1,
        last_event_at: event.occurred_at,
      },
    ]);

    if (error) {
      console.error('Failed to create rollup:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to apply event to rollups:', error);
    return false;
  }
}

/**
 * Map normalized event to rollup column updates
 * Returns object with columns to increment
 */
function mapEventToRollupColumns(eventType: MetricsEventType): Record<string, number> {
  const updates: Record<string, number> = {};

  switch (eventType) {
    case 'email_delivered':
      updates.email_delivered = 1;
      break;

    case 'email_bounce':
      updates.email_bounced = 1;
      break;

    case 'email_open':
      updates.email_opened = 1;
      break;

    case 'email_click':
      updates.email_clicked = 1;
      break;

    case 'email_spamreport':
      updates.email_complained = 1;
      break;

    case 'email_unsubscribe':
      updates.email_unsubscribed = 1;
      break;

    case 'social_impression':
      updates.social_impressions = 1;
      break;

    case 'social_engagement':
      // Assume engagement means at least one interaction
      updates.social_likes = 1;
      break;

    case 'social_click':
      updates.social_clicks = 1;
      break;

    default:
      break;
  }

  return updates;
}

/**
 * Compute derived metrics for rollup
 * Calculates rates (delivery, open, click, etc.)
 */
export function computeDerivedMetrics(rollup: MetricsRollup): Partial<MetricsRollup> {
  const derived: Partial<MetricsRollup> = {};

  // Email metrics
  if (rollup.channel === 'email') {
    if (rollup.email_sent && rollup.email_sent > 0) {
      derived.delivery_rate = (rollup.email_delivered / rollup.email_sent) * 100;
      derived.bounce_rate = (rollup.email_bounced / rollup.email_sent) * 100;
      derived.complaint_rate = (rollup.email_complained / rollup.email_sent) * 100;
      derived.unsubscribe_rate = (rollup.email_unsubscribed / rollup.email_sent) * 100;
    }

    if (rollup.email_delivered && rollup.email_delivered > 0) {
      derived.open_rate = (rollup.email_opened / rollup.email_delivered) * 100;
      derived.click_rate = (rollup.email_clicked / rollup.email_delivered) * 100;
      derived.engagement_rate = ((rollup.email_opened + rollup.email_clicked) / rollup.email_delivered) * 100;
    }
  }

  // Social metrics
  if (rollup.channel === 'social') {
    if (rollup.social_impressions && rollup.social_impressions > 0) {
      const totalEngagement = rollup.social_likes + rollup.social_comments + rollup.social_shares + rollup.social_clicks;
      derived.social_engagement_rate = (totalEngagement / rollup.social_impressions) * 100;
    }
  }

  return derived;
}

/**
 * Get rollups with optional filtering
 * Returns latest data for dashboard/CX09 consumption
 */
export async function getRollups(filters: RollupFilters): Promise<MetricsRollup[]> {
  const supabase = await createClient();

  try {
    let query = supabase.from('metrics_rollup_latest').select('*').eq('workspace_id', filters.workspace_id);

    if (filters.circuit_execution_id) {
      query = query.eq('circuit_execution_id', filters.circuit_execution_id);
    }

    if (filters.ab_test_id) {
      query = query.eq('ab_test_id', filters.ab_test_id);
    }

    if (filters.variant_id) {
      query = query.eq('variant_id', filters.variant_id);
    }

    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }

    if (filters.time_start && filters.time_end) {
      query = query
        .gte('time_bucket', filters.time_start)
        .lte('time_bucket', filters.time_end);
    }

    query = query.order('time_bucket', { ascending: false }).limit(filters.limit || 100);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get rollups:', error);
      return [];
    }

    return (data || []) as MetricsRollup[];
  } catch (error) {
    console.error('Failed to get rollups:', error);
    return [];
  }
}

/**
 * Get rollup summary for specific test/variant
 * Aggregates across all time buckets
 */
export async function getRollupSummary(
  workspaceId: string,
  abTestId: string,
  variantId: string
): Promise<{
  total_events: number;
  email_stats?: Record<string, number>;
  social_stats?: Record<string, number>;
  last_updated?: string;
} | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('metrics_rollups')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', abTestId)
      .eq('variant_id', variantId);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Aggregate across all buckets
    const rollups = data as MetricsRollup[];

    const summary = {
      total_events: 0,
      email_stats: {
        sent: 0,
        delivered: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
        opened: 0,
        clicked: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
      },
      social_stats: {
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        engagement_rate: 0,
      },
      last_updated: rollups[0]?.updated_at,
    };

    for (const rollup of rollups) {
      summary.total_events += rollup.event_count;

      if (rollup.channel === 'email') {
        summary.email_stats!.sent += rollup.email_sent;
        summary.email_stats!.delivered += rollup.email_delivered;
        summary.email_stats!.bounced += rollup.email_bounced;
        summary.email_stats!.complained += rollup.email_complained;
        summary.email_stats!.unsubscribed += rollup.email_unsubscribed;
        summary.email_stats!.opened += rollup.email_opened;
        summary.email_stats!.clicked += rollup.email_clicked;
      }

      if (rollup.channel === 'social') {
        summary.social_stats!.impressions += rollup.social_impressions;
        summary.social_stats!.likes += rollup.social_likes;
        summary.social_stats!.comments += rollup.social_comments;
        summary.social_stats!.shares += rollup.social_shares;
        summary.social_stats!.clicks += rollup.social_clicks;
      }
    }

    // Recalculate rates for aggregated data
    if (summary.email_stats!.sent > 0) {
      summary.email_stats!.delivery_rate = (summary.email_stats!.delivered / summary.email_stats!.sent) * 100;
    }

    if (summary.email_stats!.delivered > 0) {
      summary.email_stats!.open_rate = (summary.email_stats!.opened / summary.email_stats!.delivered) * 100;
      summary.email_stats!.click_rate = (summary.email_stats!.clicked / summary.email_stats!.delivered) * 100;
    }

    if (summary.social_stats!.impressions > 0) {
      const totalEngagement =
        summary.social_stats!.likes + summary.social_stats!.comments + summary.social_stats!.shares + summary.social_stats!.clicks;
      summary.social_stats!.engagement_rate = (totalEngagement / summary.social_stats!.impressions) * 100;
    }

    return summary;
  } catch (error) {
    console.error('Failed to get rollup summary:', error);
    return null;
  }
}

/**
 * Recalculate all derived metrics for rollup
 * Called after bulk event ingestion to ensure accuracy
 */
export async function recalculateDerivedMetrics(rollupId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Fetch rollup
    const { data: rollup, error: fetchError } = await supabase
      .from('metrics_rollups')
      .select('*')
      .eq('id', rollupId)
      .single();

    if (fetchError || !rollup) {
      return false;
    }

    // Compute derived metrics
    const derived = computeDerivedMetrics(rollup);

    // Update rollup
    const { error: updateError } = await supabase
      .from('metrics_rollups')
      .update(derived)
      .eq('id', rollupId);

    if (updateError) {
      console.error('Failed to recalculate derived metrics:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to recalculate derived metrics:', error);
    return false;
  }
}

/**
 * Batch apply events to rollups
 */
export async function applyEventsToRollups(
  workspaceId: string,
  circuitExecutionId: string,
  abTestId: string | undefined,
  variantId: string | undefined,
  channel: 'email' | 'social',
  platform: string,
  events: NormalizedEvent[]
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (const event of events) {
    const result = await applyEventToRollups(
      workspaceId,
      circuitExecutionId,
      abTestId,
      variantId,
      channel,
      platform,
      event
    );

    if (result) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return { succeeded, failed };
}
