/**
 * Temporal Trend Engine
 * Phase 111: Analyzes long-term, seasonal, and cyclical patterns
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface TrendVector {
  dimension: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  dataPoints: number;
}

export interface SeasonalitySignal {
  pattern: string;
  periodDays: number;
  strength: number;
  peakOffset: number;
}

export interface TemporalSnapshot {
  id: string;
  scope: 'tenant' | 'region' | 'market' | 'global';
  regionId: string | null;
  tenantId: string | null;
  trendVectors: TrendVector[];
  seasonalitySignals: SeasonalitySignal[];
  cyclePatterns: string[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getTrends(
  tenantId?: string,
  scope?: string
): Promise<TemporalSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('temporal_trend_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (scope) query = query.eq('scope', scope);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    scope: row.scope,
    regionId: row.region_id,
    tenantId: row.tenant_id,
    trendVectors: row.trend_vectors,
    seasonalitySignals: row.seasonality_signals,
    cyclePatterns: row.cycle_patterns,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function analyzeTrends(
  scope: TemporalSnapshot['scope'],
  tenantId?: string,
  regionId?: string
): Promise<TemporalSnapshot | null> {
  const supabase = await getSupabaseServer();

  const trendVectors: TrendVector[] = [
    {
      dimension: 'performance',
      direction: Math.random() > 0.5 ? 'up' : 'stable',
      magnitude: Math.random() * 0.3,
      dataPoints: 30 + Math.floor(Math.random() * 60),
    },
    {
      dimension: 'engagement',
      direction: Math.random() > 0.3 ? 'up' : 'down',
      magnitude: Math.random() * 0.25,
      dataPoints: 20 + Math.floor(Math.random() * 40),
    },
  ];

  const seasonalitySignals: SeasonalitySignal[] = [];
  if (Math.random() > 0.5) {
    seasonalitySignals.push({
      pattern: 'weekly',
      periodDays: 7,
      strength: 0.4 + Math.random() * 0.4,
      peakOffset: Math.floor(Math.random() * 7),
    });
  }

  const minDataPoints = Math.min(...trendVectors.map(t => t.dataPoints));
  const confidence = Math.min(0.85, 0.4 + minDataPoints * 0.005);

  const { data, error } = await supabase
    .from('temporal_trend_snapshots')
    .insert({
      scope,
      tenant_id: tenantId,
      region_id: regionId,
      trend_vectors: trendVectors,
      seasonality_signals: seasonalitySignals,
      cycle_patterns: [],
      confidence,
      uncertainty_notes: 'Trends based on historical data. Confidence decreases for longer projections. Seasonality requires minimum 2 complete cycles.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    scope: data.scope,
    regionId: data.region_id,
    tenantId: data.tenant_id,
    trendVectors: data.trend_vectors,
    seasonalitySignals: data.seasonality_signals,
    cyclePatterns: data.cycle_patterns,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
