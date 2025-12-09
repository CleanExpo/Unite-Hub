/**
 * Market Comparator Engine
 * Phase 97: Anonymized aggregated benchmarking
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface MarketBaseline {
  id: string;
  metric: string;
  regionId: string | null;
  aggregatedValue: number;
  confidence: number;
  sampleSize: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface MarketTrend {
  id: string;
  regionId: string | null;
  trendType: 'engagement' | 'growth' | 'conversion' | 'retention' | 'cost';
  trendVector: number[];
  confidenceBand: 'high' | 'medium' | 'low' | 'insufficient';
  direction: 'up' | 'down' | 'stable' | 'volatile';
  magnitude: number | null;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getBaselines(regionId?: string): Promise<MarketBaseline[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('market_baselines')
    .select('*')
    .order('created_at', { ascending: false });

  if (regionId) {
    query = query.eq('region_id', regionId);
  }

  const { data } = await query.limit(50);

  return (data || []).map(b => ({
    id: b.id,
    metric: b.metric,
    regionId: b.region_id,
    aggregatedValue: b.aggregated_value,
    confidence: b.confidence,
    sampleSize: b.sample_size,
    periodStart: b.period_start,
    periodEnd: b.period_end,
    createdAt: b.created_at,
  }));
}

export async function getTrends(regionId?: string): Promise<MarketTrend[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('market_trends')
    .select('*')
    .order('created_at', { ascending: false });

  if (regionId) {
    query = query.eq('region_id', regionId);
  }

  const { data } = await query.limit(50);

  return (data || []).map(t => ({
    id: t.id,
    regionId: t.region_id,
    trendType: t.trend_type,
    trendVector: t.trend_vector,
    confidenceBand: t.confidence_band,
    direction: t.direction,
    magnitude: t.magnitude,
    uncertaintyNotes: t.uncertainty_notes,
    createdAt: t.created_at,
  }));
}

export async function generateBaseline(
  metric: string,
  regionId: string,
  values: number[]
): Promise<MarketBaseline | null> {
  if (values.length < 3) {
return null;
} // Minimum sample size

  const supabase = await getSupabaseServer();

  const aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
  const confidence = Math.min(0.95, 0.3 + (values.length / 100) * 0.65);

  const { data, error } = await supabase
    .from('market_baselines')
    .insert({
      metric,
      region_id: regionId,
      aggregated_value: aggregatedValue,
      confidence,
      sample_size: values.length,
      period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
return null;
}

  return {
    id: data.id,
    metric: data.metric,
    regionId: data.region_id,
    aggregatedValue: data.aggregated_value,
    confidence: data.confidence,
    sampleSize: data.sample_size,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    createdAt: data.created_at,
  };
}
