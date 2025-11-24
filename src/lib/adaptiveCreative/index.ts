/**
 * Adaptive Creative Ecosystem
 * Phase 98: Self-adjusting creative intelligence
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface CreativeAdaptiveState {
  id: string;
  regionId: string | null;
  tenantId: string | null;
  fatigueIndex: number;
  styleBias: Record<string, number>;
  methodWeights: Record<string, number>;
  performanceOverlays: Record<string, unknown>;
  complianceAdjustments: Record<string, unknown>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeSuggestion {
  method: string;
  styleBias: string;
  fatigueAdjustment: string;
  confidence: number;
  rationale: string;
  uncertaintyNotes: string;
}

export async function getAdaptiveState(
  tenantId: string,
  regionId?: string
): Promise<CreativeAdaptiveState | null> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('creative_adaptive_states')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (regionId) {
    query = query.eq('region_id', regionId);
  }

  const { data } = await query.limit(1).single();

  if (!data) return null;

  return {
    id: data.id,
    regionId: data.region_id,
    tenantId: data.tenant_id,
    fatigueIndex: data.fatigue_index,
    styleBias: data.style_bias,
    methodWeights: data.method_weights,
    performanceOverlays: data.performance_overlays,
    complianceAdjustments: data.compliance_adjustments,
    confidence: data.confidence,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function generateSuggestion(
  tenantId: string,
  regionId?: string
): Promise<CreativeSuggestion> {
  const state = await getAdaptiveState(tenantId, regionId);

  const fatigueIndex = state?.fatigueIndex || 0.5;
  const methodWeights = state?.methodWeights || {};

  // Determine best method
  const methods = Object.entries(methodWeights);
  const bestMethod = methods.length > 0
    ? methods.sort(([, a], [, b]) => (b as number) - (a as number))[0][0]
    : 'standard';

  // Fatigue adjustment
  let fatigueAdjustment: string;
  if (fatigueIndex > 0.7) {
    fatigueAdjustment = 'Reduce posting frequency and introduce variety';
  } else if (fatigueIndex > 0.5) {
    fatigueAdjustment = 'Consider rotating content styles';
  } else {
    fatigueAdjustment = 'Current creative approach is sustainable';
  }

  // Style bias
  const styleBias = state?.styleBias || {};
  const topStyle = Object.entries(styleBias)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'neutral';

  return {
    method: bestMethod,
    styleBias: topStyle,
    fatigueAdjustment,
    confidence: state?.confidence || 0.5,
    rationale: `Based on ${fatigueIndex < 0.5 ? 'low' : 'elevated'} fatigue index and ${topStyle} style preference`,
    uncertaintyNotes: 'Creative suggestions are based on historical patterns and may not reflect current audience preferences.',
  };
}

export async function createAdaptiveState(
  tenantId: string,
  regionId: string | null,
  fatigueIndex: number,
  styleBias: Record<string, number>,
  methodWeights: Record<string, number>
): Promise<CreativeAdaptiveState | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('creative_adaptive_states')
    .insert({
      tenant_id: tenantId,
      region_id: regionId,
      fatigue_index: fatigueIndex,
      style_bias: styleBias,
      method_weights: methodWeights,
      confidence: 0.6,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    regionId: data.region_id,
    tenantId: data.tenant_id,
    fatigueIndex: data.fatigue_index,
    styleBias: data.style_bias,
    methodWeights: data.method_weights,
    performanceOverlays: data.performance_overlays,
    complianceAdjustments: data.compliance_adjustments,
    confidence: data.confidence,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
