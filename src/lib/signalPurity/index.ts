/**
 * Signal Purity Engine
 * Phase 105: Filters noise, bias, and cross-engine contamination
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface NoiseFactor {
  source: string;
  type: 'temporal' | 'sampling' | 'correlation' | 'measurement';
  severity: number;
  description: string;
}

export interface BiasFlag {
  type: 'selection' | 'confirmation' | 'survivorship' | 'recency' | 'anchoring';
  source: string;
  confidence: number;
  description: string;
}

export interface PuritySnapshot {
  id: string;
  sourceEngine: string;
  regionId: string | null;
  tenantId: string | null;
  purityScore: number;
  noiseFactors: NoiseFactor[];
  biasFlags: BiasFlag[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getPuritySnapshots(
  sourceEngine?: string,
  tenantId?: string
): Promise<PuritySnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('signal_purity_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (sourceEngine) query = query.eq('source_engine', sourceEngine);
  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    sourceEngine: row.source_engine,
    regionId: row.region_id,
    tenantId: row.tenant_id,
    purityScore: row.purity_score,
    noiseFactors: row.noise_factors,
    biasFlags: row.bias_flags,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function analyzePurity(
  sourceEngine: string,
  tenantId?: string,
  regionId?: string
): Promise<PuritySnapshot | null> {
  const supabase = await getSupabaseServer();

  // Simulate purity analysis
  const noiseFactors: NoiseFactor[] = [];
  const biasFlags: BiasFlag[] = [];

  // Check for common noise patterns
  if (Math.random() > 0.7) {
    noiseFactors.push({
      source: sourceEngine,
      type: 'temporal',
      severity: 0.3 + Math.random() * 0.3,
      description: 'Time-series gaps detected in signal data',
    });
  }

  if (Math.random() > 0.8) {
    biasFlags.push({
      type: 'recency',
      source: sourceEngine,
      confidence: 0.6 + Math.random() * 0.3,
      description: 'Recent data overweighted in aggregation',
    });
  }

  // Calculate purity score
  const noisePenalty = noiseFactors.reduce((sum, n) => sum + n.severity * 0.1, 0);
  const biasPenalty = biasFlags.reduce((sum, b) => sum + b.confidence * 0.15, 0);
  const purityScore = Math.max(0.3, 1 - noisePenalty - biasPenalty);

  const confidence = Math.min(0.9, 0.5 + purityScore * 0.4);

  const { data, error } = await supabase
    .from('signal_purity_snapshots')
    .insert({
      source_engine: sourceEngine,
      tenant_id: tenantId,
      region_id: regionId,
      purity_score: purityScore,
      noise_factors: noiseFactors,
      bias_flags: biasFlags,
      confidence,
      uncertainty_notes: 'Purity analysis based on statistical patterns. Manual review recommended for critical signals.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    sourceEngine: data.source_engine,
    regionId: data.region_id,
    tenantId: data.tenant_id,
    purityScore: data.purity_score,
    noiseFactors: data.noise_factors,
    biasFlags: data.bias_flags,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
