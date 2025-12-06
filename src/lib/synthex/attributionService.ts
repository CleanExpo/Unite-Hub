/**
 * Attribution Service for Synthex
 * Phase: B7 - Synthex Advanced Analytics + Attribution Engine
 *
 * Tracks user engagement events and calculates engagement scores.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// Types
export type EventType = 'impression' | 'open' | 'click' | 'conversion' | 'unsubscribe' | 'bounce' | 'reply';
export type Channel = 'email' | 'sms' | 'social' | 'push' | 'webhook' | 'web' | 'other';
export type EngagementTier = 'cold' | 'warming' | 'warm' | 'hot' | 'champion';

export interface AttributionEvent {
  tenantId: string;
  brandId?: string;
  campaignId?: string;
  scheduleId?: string;
  stepIndex?: number;
  eventType: EventType;
  channel: Channel;
  contactId?: string;
  email?: string;
  phone?: string;
  externalUserId?: string;
  source?: string;
  medium?: string;
  content?: string;
  term?: string;
  revenue?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  occurredAt?: Date;
}

export interface EngagementScore {
  tenantId: string;
  brandId?: string;
  contactId?: string;
  email?: string;
  externalUserId?: string;
  overallScore: number;
  emailScore: number;
  smsScore: number;
  socialScore: number;
  webScore: number;
  totalEvents: number;
  impressions: number;
  opens: number;
  clicks: number;
  conversions: number;
  totalRevenue: number;
  tier: EngagementTier;
  lastEventType?: string;
  lastEventAt?: Date;
}

// Event weights for scoring
const EVENT_WEIGHTS: Record<EventType, number> = {
  impression: 1,
  open: 3,
  click: 5,
  conversion: 20,
  reply: 10,
  unsubscribe: -10,
  bounce: -5,
};

// Tier thresholds
const TIER_THRESHOLDS: Record<EngagementTier, number> = {
  cold: 0,
  warming: 10,
  warm: 30,
  hot: 60,
  champion: 100,
};

/**
 * Record an attribution event
 */
export async function recordEvent(event: AttributionEvent): Promise<{
  data: unknown;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_attribution')
      .insert({
        tenant_id: event.tenantId,
        brand_id: event.brandId || null,
        campaign_id: event.campaignId || null,
        schedule_id: event.scheduleId || null,
        step_index: event.stepIndex,
        event_type: event.eventType,
        channel: event.channel,
        contact_id: event.contactId || null,
        email: event.email || null,
        phone: event.phone || null,
        external_user_id: event.externalUserId || null,
        source: event.source || null,
        medium: event.medium || null,
        content: event.content || null,
        term: event.term || null,
        revenue: event.revenue || 0,
        currency: event.currency || 'USD',
        metadata: event.metadata || {},
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null,
        occurred_at: event.occurredAt?.toISOString() || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update engagement score after recording event
    if (event.email || event.contactId) {
      await updateEngagementScore(
        event.tenantId,
        event.email,
        event.contactId,
        event.eventType,
        event.channel,
        event.revenue
      );
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get attribution events for a campaign
 */
export async function getEventsForCampaign(
  campaignId: string,
  options: {
    limit?: number;
    eventType?: EventType;
    channel?: Channel;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{ data: unknown[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_attribution')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('occurred_at', { ascending: false });

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    if (options.channel) {
      query = query.eq('channel', options.channel);
    }
    if (options.startDate) {
      query = query.gte('occurred_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('occurred_at', options.endDate.toISOString());
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get attribution events for a tenant
 */
export async function getEventsForTenant(
  tenantId: string,
  options: {
    limit?: number;
    days?: number;
    eventType?: EventType;
    channel?: Channel;
  } = {}
): Promise<{ data: unknown[] | null; error: Error | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (options.days || 30));

    let query = supabaseAdmin
      .from('synthex_attribution')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('occurred_at', startDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    if (options.channel) {
      query = query.eq('channel', options.channel);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Update engagement score for a contact
 */
async function updateEngagementScore(
  tenantId: string,
  email: string | undefined,
  contactId: string | undefined,
  eventType: EventType,
  channel: Channel,
  revenue?: number
): Promise<void> {
  if (!email && !contactId) return;

  const eventWeight = EVENT_WEIGHTS[eventType];
  const revenueValue = revenue || 0;

  // Find existing score record
  let query = supabaseAdmin
    .from('synthex_engagement_scores')
    .select('*')
    .eq('tenant_id', tenantId);

  if (email) {
    query = query.eq('email', email);
  } else if (contactId) {
    query = query.eq('contact_id', contactId);
  }

  const { data: existing } = await query.single();

  if (existing) {
    // Update existing record
    const newOverallScore = Math.max(0, (existing.overall_score || 0) + eventWeight);
    const channelScoreField = `${channel}_score` as keyof typeof existing;
    const newChannelScore = Math.max(0, (existing[channelScoreField] as number || 0) + eventWeight);

    const updates: Record<string, unknown> = {
      overall_score: newOverallScore,
      [channelScoreField]: newChannelScore,
      total_events: (existing.total_events || 0) + 1,
      total_revenue: (existing.total_revenue || 0) + revenueValue,
      last_event_type: eventType,
      last_event_at: new Date().toISOString(),
      tier: calculateTier(newOverallScore),
      updated_at: new Date().toISOString(),
    };

    // Update event counts
    if (eventType === 'impression') updates.impressions = (existing.impressions || 0) + 1;
    if (eventType === 'open') updates.opens = (existing.opens || 0) + 1;
    if (eventType === 'click') updates.clicks = (existing.clicks || 0) + 1;
    if (eventType === 'conversion') updates.conversions = (existing.conversions || 0) + 1;

    await supabaseAdmin
      .from('synthex_engagement_scores')
      .update(updates)
      .eq('id', existing.id);
  } else {
    // Create new record
    const newScore = Math.max(0, eventWeight);
    await supabaseAdmin.from('synthex_engagement_scores').insert({
      tenant_id: tenantId,
      email: email || null,
      contact_id: contactId || null,
      overall_score: newScore,
      [`${channel}_score`]: newScore,
      total_events: 1,
      impressions: eventType === 'impression' ? 1 : 0,
      opens: eventType === 'open' ? 1 : 0,
      clicks: eventType === 'click' ? 1 : 0,
      conversions: eventType === 'conversion' ? 1 : 0,
      total_revenue: revenueValue,
      tier: calculateTier(newScore),
      last_event_type: eventType,
      last_event_at: new Date().toISOString(),
    });
  }
}

/**
 * Calculate engagement tier from score
 */
function calculateTier(score: number): EngagementTier {
  if (score >= TIER_THRESHOLDS.champion) return 'champion';
  if (score >= TIER_THRESHOLDS.hot) return 'hot';
  if (score >= TIER_THRESHOLDS.warm) return 'warm';
  if (score >= TIER_THRESHOLDS.warming) return 'warming';
  return 'cold';
}

/**
 * Get engagement scores for a tenant
 */
export async function getEngagementScores(
  tenantId: string,
  options: {
    tier?: EngagementTier;
    minScore?: number;
    limit?: number;
    orderBy?: 'score' | 'recent';
  } = {}
): Promise<{ data: unknown[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_engagement_scores')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options.tier) {
      query = query.eq('tier', options.tier);
    }
    if (options.minScore) {
      query = query.gte('overall_score', options.minScore);
    }

    if (options.orderBy === 'recent') {
      query = query.order('last_event_at', { ascending: false });
    } else {
      query = query.order('overall_score', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get engagement summary by tier
 */
export async function getEngagementSummary(tenantId: string): Promise<{
  data: {
    cold: number;
    warming: number;
    warm: number;
    hot: number;
    champion: number;
    total: number;
  } | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_engagement_scores')
      .select('tier')
      .eq('tenant_id', tenantId);

    if (error) throw new Error(error.message);

    const summary = {
      cold: 0,
      warming: 0,
      warm: 0,
      hot: 0,
      champion: 0,
      total: data?.length || 0,
    };

    for (const record of data || []) {
      const tier = record.tier as EngagementTier;
      summary[tier]++;
    }

    return { data: summary, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Recalculate engagement score for a contact from scratch
 */
export async function recalculateEngagementScore(
  tenantId: string,
  email: string
): Promise<{ data: unknown; error: Error | null }> {
  try {
    // Get all events for this contact
    const { data: events, error } = await supabaseAdmin
      .from('synthex_attribution')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .order('occurred_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Calculate scores
    let overallScore = 0;
    const channelScores: Record<string, number> = {
      email: 0,
      sms: 0,
      social: 0,
      web: 0,
      push: 0,
      webhook: 0,
      other: 0,
    };
    let totalRevenue = 0;
    const counts = { impressions: 0, opens: 0, clicks: 0, conversions: 0 };

    for (const event of events || []) {
      const weight = EVENT_WEIGHTS[event.event_type as EventType] || 0;
      overallScore += weight;
      channelScores[event.channel] = (channelScores[event.channel] || 0) + weight;
      totalRevenue += event.revenue || 0;

      if (event.event_type === 'impression') counts.impressions++;
      if (event.event_type === 'open') counts.opens++;
      if (event.event_type === 'click') counts.clicks++;
      if (event.event_type === 'conversion') counts.conversions++;
    }

    overallScore = Math.max(0, overallScore);

    const lastEvent = events?.[events.length - 1];

    // Upsert the score
    const { data: result, error: upsertError } = await supabaseAdmin
      .from('synthex_engagement_scores')
      .upsert({
        tenant_id: tenantId,
        email,
        overall_score: overallScore,
        email_score: Math.max(0, channelScores.email),
        sms_score: Math.max(0, channelScores.sms),
        social_score: Math.max(0, channelScores.social),
        web_score: Math.max(0, channelScores.web),
        total_events: events?.length || 0,
        ...counts,
        total_revenue: totalRevenue,
        tier: calculateTier(overallScore),
        last_event_type: lastEvent?.event_type,
        last_event_at: lastEvent?.occurred_at,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,email',
      })
      .select()
      .single();

    if (upsertError) throw new Error(upsertError.message);
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}
