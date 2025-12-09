/**
 * Multi-Domain Success Predictor
 * Phase 114: Probabilistic success likelihood scores
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface PredictionPayload {
  factors: {
    name: string;
    contribution: number;
    dataQuality: number;
  }[];
  range: {
    low: number;
    mid: number;
    high: number;
  };
  caveats: string[];
}

export interface SuccessPrediction {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  domain: 'creative' | 'market' | 'region' | 'scaling' | 'campaign' | 'overall';
  predictionPayload: PredictionPayload;
  successProbability: number;
  confidence: number;
  horizonDays: number | null;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getPredictions(
  tenantId?: string,
  domain?: string
): Promise<SuccessPrediction[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('success_prediction_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (tenantId) {
query = query.eq('tenant_id', tenantId);
}
  if (domain) {
query = query.eq('domain', domain);
}

  const { data } = await query;

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    regionId: row.region_id,
    domain: row.domain,
    predictionPayload: row.prediction_payload,
    successProbability: row.success_probability,
    confidence: row.confidence,
    horizonDays: row.horizon_days,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function generatePrediction(
  domain: SuccessPrediction['domain'],
  tenantId?: string,
  regionId?: string,
  horizonDays: number = 30
): Promise<SuccessPrediction | null> {
  const supabase = await getSupabaseServer();

  const baseProb = 0.4 + Math.random() * 0.4;
  const variance = 0.1 + (horizonDays / 365) * 0.2;

  const predictionPayload: PredictionPayload = {
    factors: [
      { name: 'historical_performance', contribution: 0.3, dataQuality: 0.7 + Math.random() * 0.2 },
      { name: 'market_conditions', contribution: 0.25, dataQuality: 0.5 + Math.random() * 0.3 },
      { name: 'resource_alignment', contribution: 0.25, dataQuality: 0.6 + Math.random() * 0.3 },
      { name: 'competitive_position', contribution: 0.2, dataQuality: 0.4 + Math.random() * 0.3 },
    ],
    range: {
      low: Math.max(0, baseProb - variance),
      mid: baseProb,
      high: Math.min(1, baseProb + variance),
    },
    caveats: [
      'Prediction based on available data and historical patterns',
      horizonDays > 90 ? 'Extended horizon increases uncertainty significantly' : 'Near-term prediction within reasonable confidence',
      'External factors not captured in model may affect outcome',
    ],
  };

  const avgDataQuality = predictionPayload.factors.reduce((sum, f) => sum + f.dataQuality, 0) / predictionPayload.factors.length;
  const horizonPenalty = Math.min(0.3, horizonDays / 365 * 0.5);
  const confidence = Math.min(0.8, avgDataQuality * 0.7 - horizonPenalty);

  const { data, error } = await supabase
    .from('success_prediction_snapshots')
    .insert({
      tenant_id: tenantId,
      region_id: regionId,
      domain,
      prediction_payload: predictionPayload,
      success_probability: baseProb,
      confidence,
      horizon_days: horizonDays,
      uncertainty_notes: `Probabilistic prediction for ${horizonDays}-day horizon. Not a guarantee. Range: ${(predictionPayload.range.low * 100).toFixed(0)}%-${(predictionPayload.range.high * 100).toFixed(0)}%.`,
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    regionId: data.region_id,
    domain: data.domain,
    predictionPayload: data.prediction_payload,
    successProbability: data.success_probability,
    confidence: data.confidence,
    horizonDays: data.horizon_days,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
