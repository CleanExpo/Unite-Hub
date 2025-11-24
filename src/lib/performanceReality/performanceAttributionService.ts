/**
 * Performance Attribution Service
 * Phase 81: Computes attribution across factors from VIF, marketing, archive, ORM
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AttributionFactor,
  AttributionBreakdown,
  PerformanceRealitySnapshot,
} from './performanceRealityTypes';

/**
 * Default attribution factors with weights
 */
export const DEFAULT_ATTRIBUTION_FACTORS: Omit<AttributionFactor, 'contribution' | 'confidence'>[] = [
  {
    name: 'creative_quality',
    description: 'Quality and relevance of creative assets',
    weight: 0.20,
    direction: 'neutral',
  },
  {
    name: 'audience_match',
    description: 'How well targeting matches ideal audience',
    weight: 0.15,
    direction: 'neutral',
  },
  {
    name: 'channel_performance',
    description: 'Effectiveness of distribution channels',
    weight: 0.15,
    direction: 'neutral',
  },
  {
    name: 'timing_relevance',
    description: 'Timing alignment with audience behavior',
    weight: 0.10,
    direction: 'neutral',
  },
  {
    name: 'message_resonance',
    description: 'How well messaging resonates with audience',
    weight: 0.10,
    direction: 'neutral',
  },
  {
    name: 'competitive_context',
    description: 'Market competition impact',
    weight: 0.10,
    direction: 'neutral',
  },
  {
    name: 'frequency_saturation',
    description: 'Audience exposure frequency',
    weight: 0.08,
    direction: 'neutral',
  },
  {
    name: 'brand_equity',
    description: 'Existing brand recognition effect',
    weight: 0.07,
    direction: 'neutral',
  },
  {
    name: 'technical_delivery',
    description: 'Technical delivery and load performance',
    weight: 0.05,
    direction: 'neutral',
  },
];

/**
 * Compute attribution factors for a given scope
 */
export async function computeAttributionFactors(
  scope: string,
  clientId?: string,
  timeframeStart?: Date,
  timeframeEnd?: Date
): Promise<AttributionBreakdown> {
  const supabase = await getSupabaseServer();

  // Load factor definitions from database
  const { data: factorDefs } = await supabase
    .from('performance_attribution_factors')
    .select('*')
    .eq('is_active', true);

  // Build time filter for archive queries
  const startDate = timeframeStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = timeframeEnd || new Date();

  // Compute each factor based on available data
  const factors: AttributionFactor[] = [];

  for (const def of factorDefs || DEFAULT_ATTRIBUTION_FACTORS) {
    const factor = await computeSingleFactor(
      supabase,
      def.name,
      def.description || '',
      def.default_weight || def.weight || 0.1,
      scope,
      clientId,
      startDate,
      endDate
    );
    factors.push(factor);
  }

  // Calculate total contribution
  const totalContribution = factors.reduce(
    (sum, f) => sum + Math.abs(f.contribution * f.weight),
    0
  );

  // Identify primary driver
  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight)
  );
  const primaryDriver = sorted[0]?.name || 'unknown';

  return {
    factors,
    total_contribution: totalContribution,
    primary_driver: primaryDriver,
  };
}

/**
 * Compute a single attribution factor
 */
async function computeSingleFactor(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  name: string,
  description: string,
  weight: number,
  scope: string,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<AttributionFactor> {
  let contribution = 0;
  let confidence = 0.5;
  let direction: 'positive' | 'negative' | 'neutral' = 'neutral';

  switch (name) {
    case 'creative_quality':
      ({ contribution, confidence, direction } = await analyzeCreativeQuality(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'audience_match':
      ({ contribution, confidence, direction } = await analyzeAudienceMatch(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'channel_performance':
      ({ contribution, confidence, direction } = await analyzeChannelPerformance(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'timing_relevance':
      ({ contribution, confidence, direction } = await analyzeTimingRelevance(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'message_resonance':
      ({ contribution, confidence, direction } = await analyzeMessageResonance(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'competitive_context':
      ({ contribution, confidence, direction } = await analyzeCompetitiveContext(
        supabase,
        clientId
      ));
      break;

    case 'frequency_saturation':
      ({ contribution, confidence, direction } = await analyzeFrequencySaturation(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    case 'brand_equity':
      ({ contribution, confidence, direction } = await analyzeBrandEquity(
        supabase,
        clientId
      ));
      break;

    case 'technical_delivery':
      ({ contribution, confidence, direction } = await analyzeTechnicalDelivery(
        supabase,
        clientId,
        startDate,
        endDate
      ));
      break;

    default:
      // Unknown factor - neutral contribution
      contribution = 0;
      confidence = 0.3;
      direction = 'neutral';
  }

  return {
    name,
    description,
    weight,
    contribution,
    confidence,
    direction,
  };
}

/**
 * Analyze creative quality from VIF and archive data
 */
async function analyzeCreativeQuality(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query VIF events for creative performance
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data')
    .in('event_type', ['vif_creative_analysis', 'vif_brand_analysis', 'content_created'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events, error } = await query.limit(100);

  if (error || !events || events.length === 0) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Calculate average quality score from events
  let totalScore = 0;
  let count = 0;

  for (const event of events) {
    const data = event.event_data as Record<string, unknown>;
    if (data?.quality_score) {
      totalScore += Number(data.quality_score);
      count++;
    }
    if (data?.brand_consistency) {
      totalScore += Number(data.brand_consistency);
      count++;
    }
  }

  if (count === 0) {
    return { contribution: 0, confidence: 0.4, direction: 'neutral' };
  }

  const avgScore = totalScore / count;
  const contribution = (avgScore - 0.5) * 2; // Normalize to -1 to 1
  const confidence = Math.min(0.9, 0.5 + count * 0.02);
  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Analyze audience match from targeting data
 */
async function analyzeAudienceMatch(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query campaign and engagement data
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data')
    .in('event_type', ['campaign_sent', 'email_opened', 'email_clicked', 'contact_engaged'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query.limit(200);

  if (!events || events.length === 0) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Calculate engagement rate
  const sent = events.filter(e => (e.event_data as Record<string, unknown>)?.event_type === 'campaign_sent').length;
  const engaged = events.filter(e =>
    ['email_opened', 'email_clicked', 'contact_engaged'].includes(
      (e.event_data as Record<string, unknown>)?.event_type as string || ''
    )
  ).length;

  if (sent === 0) {
    return { contribution: 0, confidence: 0.4, direction: 'neutral' };
  }

  const engagementRate = engaged / Math.max(sent, 1);
  const contribution = (engagementRate - 0.25) * 2; // 25% is baseline
  const confidence = Math.min(0.85, 0.4 + events.length * 0.01);
  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Analyze channel performance
 */
async function analyzeChannelPerformance(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query channel-specific events
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, event_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query.limit(150);

  if (!events || events.length === 0) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Analyze channel distribution and performance
  const channelCounts: Record<string, number> = {};
  for (const event of events) {
    const channel = (event.event_data as Record<string, unknown>)?.channel as string || 'unknown';
    channelCounts[channel] = (channelCounts[channel] || 0) + 1;
  }

  // More diverse channels = better performance
  const channelCount = Object.keys(channelCounts).length;
  const contribution = (channelCount - 2) * 0.15; // 2 channels is baseline
  const confidence = Math.min(0.8, 0.5 + events.length * 0.01);
  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Analyze timing relevance
 */
async function analyzeTimingRelevance(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query engagement timing patterns
  let query = supabase
    .from('living_intelligence_archive')
    .select('created_at, event_data')
    .in('event_type', ['email_opened', 'email_clicked'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query.limit(100);

  if (!events || events.length < 5) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Analyze time-of-day distribution
  const hourCounts: number[] = new Array(24).fill(0);
  for (const event of events) {
    const hour = new Date(event.created_at).getHours();
    hourCounts[hour]++;
  }

  // Peak hours (9-11am, 2-4pm) get bonus
  const peakHours = [9, 10, 11, 14, 15, 16];
  const peakEngagement = peakHours.reduce((sum, h) => sum + hourCounts[h], 0);
  const totalEngagement = hourCounts.reduce((sum, c) => sum + c, 0);
  const peakRatio = totalEngagement > 0 ? peakEngagement / totalEngagement : 0;

  const contribution = (peakRatio - 0.4) * 1.5; // 40% in peak hours is baseline
  const confidence = Math.min(0.75, 0.4 + events.length * 0.02);
  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Analyze message resonance from sentiment and engagement
 */
async function analyzeMessageResonance(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query sentiment and response data
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data')
    .in('event_type', ['email_received', 'email_replied', 'sentiment_analyzed'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query.limit(100);

  if (!events || events.length === 0) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Calculate average sentiment
  let totalSentiment = 0;
  let count = 0;

  for (const event of events) {
    const data = event.event_data as Record<string, unknown>;
    if (typeof data?.sentiment === 'number') {
      totalSentiment += Number(data.sentiment);
      count++;
    }
  }

  if (count === 0) {
    return { contribution: 0, confidence: 0.4, direction: 'neutral' };
  }

  const avgSentiment = totalSentiment / count;
  const contribution = avgSentiment * 0.8; // Sentiment is already -1 to 1
  const confidence = Math.min(0.8, 0.5 + count * 0.02);
  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Analyze competitive context
 */
async function analyzeCompetitiveContext(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // This would ideally come from ORM or external competitive intelligence
  // For now, return neutral with low confidence
  return { contribution: 0, confidence: 0.3, direction: 'neutral' };
}

/**
 * Analyze frequency saturation
 */
async function analyzeFrequencySaturation(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query send frequency
  let query = supabase
    .from('living_intelligence_archive')
    .select('created_at')
    .eq('event_type', 'campaign_sent')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query;

  if (!events || events.length < 2) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Calculate sends per week
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const sendsPerWeek = (events.length / daysDiff) * 7;

  // 2-3 per week is optimal, more or less reduces effectiveness
  let contribution = 0;
  if (sendsPerWeek < 1) {
    contribution = -0.3; // Too infrequent
  } else if (sendsPerWeek > 5) {
    contribution = -0.4; // Over-saturation
  } else if (sendsPerWeek >= 2 && sendsPerWeek <= 3) {
    contribution = 0.2; // Optimal
  }

  const direction = contribution > 0.1 ? 'positive' : contribution < -0.1 ? 'negative' : 'neutral';

  return { contribution, confidence: 0.6, direction };
}

/**
 * Analyze brand equity
 */
async function analyzeBrandEquity(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // This would come from ORM brand monitoring
  // For now, return neutral with low confidence
  return { contribution: 0, confidence: 0.3, direction: 'neutral' };
}

/**
 * Analyze technical delivery
 */
async function analyzeTechnicalDelivery(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ contribution: number; confidence: number; direction: 'positive' | 'negative' | 'neutral' }> {
  // Query delivery and bounce data
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, event_type')
    .in('event_type', ['campaign_sent', 'email_bounced', 'email_delivered'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: events } = await query.limit(200);

  if (!events || events.length === 0) {
    return { contribution: 0, confidence: 0.3, direction: 'neutral' };
  }

  // Calculate delivery rate
  const sent = events.filter(e => e.event_type === 'campaign_sent').length;
  const bounced = events.filter(e => e.event_type === 'email_bounced').length;

  if (sent === 0) {
    return { contribution: 0, confidence: 0.4, direction: 'neutral' };
  }

  const deliveryRate = 1 - (bounced / sent);
  const contribution = (deliveryRate - 0.95) * 5; // 95% delivery is baseline
  const confidence = Math.min(0.85, 0.5 + sent * 0.01);
  const direction = contribution > 0.05 ? 'positive' : contribution < -0.05 ? 'negative' : 'neutral';

  return { contribution, confidence, direction };
}

/**
 * Get attribution factors for an existing snapshot
 */
export async function getSnapshotAttribution(
  snapshotId: string
): Promise<AttributionBreakdown | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('performance_reality_snapshots')
    .select('attribution_breakdown')
    .eq('id', snapshotId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.attribution_breakdown as AttributionBreakdown;
}
