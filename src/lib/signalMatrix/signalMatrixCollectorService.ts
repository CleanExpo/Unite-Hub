/**
 * Signal Matrix Collector Service
 * Phase 82: Collects and normalises signals from all engines
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  SignalScope,
  SignalJson,
  SignalCategory,
  EngineSignal,
  UnifiedSignalMatrix,
} from './signalMatrixTypes';

/**
 * Collect signals for a given scope and timeframe
 */
export async function collectSignalsForScope(
  scope: SignalScope,
  clientId?: string,
  timeframeDays: number = 7
): Promise<UnifiedSignalMatrix | null> {
  const supabase = await getSupabaseServer();

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

  // Collect raw signals from each engine
  const [
    creativeSignals,
    performanceSignals,
    realitySignals,
    ormSignals,
    alignmentSignals,
    scalingSignals,
    campaignSignals,
    vifSignals,
    storySignals,
    externalSignals,
  ] = await Promise.all([
    collectCreativeSignals(supabase, clientId, startDate, endDate),
    collectPerformanceSignals(supabase, clientId, startDate, endDate),
    collectRealitySignals(supabase, clientId, startDate, endDate),
    collectOrmSignals(supabase, clientId, startDate, endDate),
    collectAlignmentSignals(supabase, clientId, startDate, endDate),
    collectScalingSignals(supabase, clientId, startDate, endDate),
    collectCampaignSignals(supabase, clientId, startDate, endDate),
    collectVifSignals(supabase, clientId, startDate, endDate),
    collectStorySignals(supabase, clientId, startDate, endDate),
    collectExternalSignals(supabase, startDate, endDate),
  ]);

  // Build signal JSON
  const signalJson: SignalJson = {
    creative: normaliseCategory(creativeSignals),
    performance: normaliseCategory(performanceSignals),
    reality: normaliseCategory(realitySignals),
    orm: normaliseCategory(ormSignals),
    alignment: normaliseCategory(alignmentSignals),
    scaling: normaliseCategory(scalingSignals),
    campaign: normaliseCategory(campaignSignals),
    vif: normaliseCategory(vifSignals),
    story: normaliseCategory(storySignals),
    external: normaliseCategory(externalSignals),
    errors: [],
  };

  // Compute matrix scores
  const completenessScore = computeCompletenessScore(signalJson);
  const confidenceScore = computeConfidenceScore(signalJson);
  const anomalyScore = computeAnomalyScore(signalJson);
  const trendShiftScore = computeTrendShiftScore(signalJson);
  const fatigueScore = computeFatigueScore(signalJson);

  // Insert into database
  const { data, error } = await supabase
    .from('unified_signal_matrix')
    .insert({
      client_id: clientId || null,
      scope,
      signal_json: signalJson,
      completeness_score: completenessScore,
      confidence_score: confidenceScore,
      anomaly_score: anomalyScore,
      trend_shift_score: trendShiftScore,
      fatigue_score: fatigueScore,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting signal matrix:', error);
    return null;
  }

  return data as UnifiedSignalMatrix;
}

/**
 * Normalise a category from raw signals
 */
function normaliseCategory(signals: EngineSignal[]): SignalCategory {
  if (signals.length === 0) {
    return {
      score: 0,
      confidence: 0,
      trend: 'stable',
      signals: [],
    };
  }

  const avgScore = signals.reduce((sum, s) => sum + s.normalised, 0) / signals.length;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  // Determine overall trend
  const upCount = signals.filter(s => s.trend === 'up').length;
  const downCount = signals.filter(s => s.trend === 'down').length;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (upCount > downCount && upCount > signals.length / 3) trend = 'up';
  if (downCount > upCount && downCount > signals.length / 3) trend = 'down';

  return {
    score: Math.round(avgScore * 100) / 100,
    confidence: Math.round(avgConfidence * 100) / 100,
    trend,
    signals,
  };
}

/**
 * Compute data completeness score
 */
function computeCompletenessScore(signalJson: SignalJson): number {
  const categories = Object.entries(signalJson).filter(([key]) => key !== 'errors');
  const nonEmpty = categories.filter(([, cat]) => (cat as SignalCategory).signals.length > 0);
  return nonEmpty.length / categories.length;
}

/**
 * Compute overall confidence score
 */
function computeConfidenceScore(signalJson: SignalJson): number {
  const categories = Object.entries(signalJson)
    .filter(([key]) => key !== 'errors')
    .map(([, cat]) => cat as SignalCategory)
    .filter(cat => cat.signals.length > 0);

  if (categories.length === 0) return 0;

  return categories.reduce((sum, cat) => sum + cat.confidence, 0) / categories.length;
}

/**
 * Compute anomaly score
 */
function computeAnomalyScore(signalJson: SignalJson): number {
  // Look for significant deviations from expected values
  let anomalySum = 0;
  let count = 0;

  Object.entries(signalJson)
    .filter(([key]) => key !== 'errors')
    .forEach(([, cat]) => {
      const category = cat as SignalCategory;
      category.signals.forEach(signal => {
        // Anomaly if normalised value is very high or very low
        if (signal.normalised > 0.85 || signal.normalised < 0.15) {
          anomalySum += Math.abs(signal.normalised - 0.5) * 2;
        }
        count++;
      });
    });

  return count > 0 ? Math.min(1, anomalySum / count) : 0;
}

/**
 * Compute trend shift score
 */
function computeTrendShiftScore(signalJson: SignalJson): number {
  const categories = Object.entries(signalJson)
    .filter(([key]) => key !== 'errors')
    .map(([, cat]) => cat as SignalCategory)
    .filter(cat => cat.signals.length > 0);

  if (categories.length === 0) return 0;

  // Count categories with non-stable trends
  const shifting = categories.filter(cat => cat.trend !== 'stable').length;
  return shifting / categories.length;
}

/**
 * Compute fatigue score
 */
function computeFatigueScore(signalJson: SignalJson): number {
  // Fatigue indicators: declining creative, declining performance, declining campaign
  let fatigueIndicators = 0;
  let totalIndicators = 0;

  if (signalJson.creative.signals.length > 0) {
    totalIndicators++;
    if (signalJson.creative.trend === 'down') fatigueIndicators++;
  }

  if (signalJson.performance.signals.length > 0) {
    totalIndicators++;
    if (signalJson.performance.trend === 'down') fatigueIndicators++;
  }

  if (signalJson.campaign.signals.length > 0) {
    totalIndicators++;
    if (signalJson.campaign.trend === 'down') fatigueIndicators++;
  }

  return totalIndicators > 0 ? fatigueIndicators / totalIndicators : 0;
}

// Signal collection functions for each engine

async function collectCreativeSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, created_at')
    .in('event_type', ['vif_creative_analysis', 'content_created', 'vif_brand_analysis'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) query = query.eq('client_id', clientId);

  const { data } = await query.limit(50);
  if (!data || data.length === 0) return [];

  return data.map(row => {
    const eventData = row.event_data as Record<string, unknown>;
    const score = Number(eventData?.quality_score || eventData?.score || 0.5);
    return {
      engine: 'creative',
      metric: 'quality',
      value: score,
      normalised: score,
      confidence: 0.7,
      trend: 'stable' as const,
      timestamp: row.created_at,
    };
  });
}

async function collectPerformanceSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  const { data } = await supabase
    .from('campaigns')
    .select('open_rate, click_rate, sent_at')
    .eq('status', 'sent')
    .gte('sent_at', startDate.toISOString())
    .lte('sent_at', endDate.toISOString())
    .limit(50);

  if (!data || data.length === 0) return [];

  return data.flatMap(row => [
    {
      engine: 'performance',
      metric: 'open_rate',
      value: row.open_rate || 0,
      normalised: Math.min(1, (row.open_rate || 0) / 0.5),
      confidence: 0.8,
      trend: 'stable' as const,
      timestamp: row.sent_at,
    },
    {
      engine: 'performance',
      metric: 'click_rate',
      value: row.click_rate || 0,
      normalised: Math.min(1, (row.click_rate || 0) / 0.1),
      confidence: 0.8,
      trend: 'stable' as const,
      timestamp: row.sent_at,
    },
  ]);
}

async function collectRealitySignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  let query = supabase
    .from('performance_reality_snapshots')
    .select('true_score, perceived_score, confidence_low, confidence_high, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) query = query.eq('client_id', clientId);

  const { data } = await query.limit(10);
  if (!data || data.length === 0) return [];

  return data.map(row => ({
    engine: 'reality',
    metric: 'true_score',
    value: row.true_score,
    normalised: row.true_score / 100,
    confidence: 1 - (row.confidence_high - row.confidence_low) / 100,
    trend: row.true_score > row.perceived_score ? 'up' as const : 'down' as const,
    timestamp: row.created_at,
  }));
}

async function collectOrmSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, created_at')
    .eq('event_type', 'task_completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) query = query.eq('client_id', clientId);

  const { data } = await query.limit(50);
  if (!data || data.length === 0) return [];

  return [{
    engine: 'orm',
    metric: 'task_completion',
    value: data.length,
    normalised: Math.min(1, data.length / 20),
    confidence: 0.6,
    trend: 'stable' as const,
    timestamp: new Date().toISOString(),
  }];
}

async function collectAlignmentSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  // Alignment from contacts and scoring
  let query = supabase
    .from('contacts')
    .select('ai_score, updated_at')
    .not('ai_score', 'is', null);

  if (clientId) query = query.eq('id', clientId);

  const { data } = await query.limit(50);
  if (!data || data.length === 0) return [];

  const avgScore = data.reduce((sum, c) => sum + (c.ai_score || 0), 0) / data.length;

  return [{
    engine: 'alignment',
    metric: 'contact_score',
    value: avgScore,
    normalised: avgScore / 100,
    confidence: 0.7,
    trend: 'stable' as const,
    timestamp: new Date().toISOString(),
  }];
}

async function collectScalingSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  // Scaling from campaign volume and contact growth
  const { count: campaignCount } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { count: contactCount } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return [
    {
      engine: 'scaling',
      metric: 'campaign_volume',
      value: campaignCount || 0,
      normalised: Math.min(1, (campaignCount || 0) / 10),
      confidence: 0.8,
      trend: 'stable' as const,
      timestamp: new Date().toISOString(),
    },
    {
      engine: 'scaling',
      metric: 'contact_growth',
      value: contactCount || 0,
      normalised: Math.min(1, (contactCount || 0) / 50),
      confidence: 0.8,
      trend: (contactCount || 0) > 10 ? 'up' as const : 'stable' as const,
      timestamp: new Date().toISOString(),
    },
  ];
}

async function collectCampaignSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  const { data } = await supabase
    .from('campaigns')
    .select('status, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .limit(50);

  if (!data || data.length === 0) return [];

  const sent = data.filter(c => c.status === 'sent').length;
  const total = data.length;

  return [{
    engine: 'campaign',
    metric: 'completion_rate',
    value: total > 0 ? sent / total : 0,
    normalised: total > 0 ? sent / total : 0,
    confidence: 0.9,
    trend: 'stable' as const,
    timestamp: new Date().toISOString(),
  }];
}

async function collectVifSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, created_at')
    .like('event_type', 'vif_%')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) query = query.eq('client_id', clientId);

  const { data } = await query.limit(50);
  if (!data || data.length === 0) return [];

  return [{
    engine: 'vif',
    metric: 'activity',
    value: data.length,
    normalised: Math.min(1, data.length / 20),
    confidence: 0.7,
    trend: data.length > 10 ? 'up' as const : 'stable' as const,
    timestamp: new Date().toISOString(),
  }];
}

async function collectStorySignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  clientId: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  let query = supabase
    .from('living_intelligence_archive')
    .select('event_data, created_at')
    .in('event_type', ['story_arc_created', 'touchpoint_created'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (clientId) query = query.eq('client_id', clientId);

  const { data } = await query.limit(50);
  if (!data || data.length === 0) return [];

  return [{
    engine: 'story',
    metric: 'momentum',
    value: data.length,
    normalised: Math.min(1, data.length / 10),
    confidence: 0.6,
    trend: data.length > 5 ? 'up' as const : 'stable' as const,
    timestamp: new Date().toISOString(),
  }];
}

async function collectExternalSignals(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  startDate: Date,
  endDate: Date
): Promise<EngineSignal[]> {
  const { data } = await supabase
    .from('performance_external_signals')
    .select('*')
    .gte('start_date', startDate.toISOString())
    .lte('end_date', endDate.toISOString())
    .eq('is_active', true)
    .limit(20);

  if (!data || data.length === 0) return [];

  return data.map(row => ({
    engine: 'external',
    metric: row.signal_type,
    value: (row.impact_hint as Record<string, number>)?.magnitude || 0.1,
    normalised: (row.impact_hint as Record<string, number>)?.magnitude || 0.1,
    confidence: 0.8,
    trend: 'stable' as const,
    timestamp: row.created_at,
  }));
}

/**
 * Get latest matrix for a scope
 */
export async function getLatestMatrix(
  scope: SignalScope,
  clientId?: string
): Promise<UnifiedSignalMatrix | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('unified_signal_matrix')
    .select('*')
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .limit(1);

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query.single();

  if (error) return null;

  return data as UnifiedSignalMatrix;
}
