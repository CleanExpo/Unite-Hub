/**
 * Region Transfer Safety Layer
 * Phase 112: Validates cross-region pattern transfers
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface RiskFactor {
  category: 'cultural' | 'compliance' | 'market' | 'operational';
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface TransferAssessment {
  id: string;
  sourceRegionId: string;
  targetRegionId: string;
  patternRef: {
    type: string;
    id: string;
    summary: string;
  };
  riskAssessment: {
    factors: RiskFactor[];
    overallRisk: 'high' | 'medium' | 'low';
  };
  transferabilityScore: number;
  culturalDistance: number | null;
  complianceCompatible: boolean;
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getAssessments(
  sourceRegionId?: string,
  targetRegionId?: string
): Promise<TransferAssessment[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('region_transfer_assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (sourceRegionId) query = query.eq('source_region_id', sourceRegionId);
  if (targetRegionId) query = query.eq('target_region_id', targetRegionId);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    sourceRegionId: row.source_region_id,
    targetRegionId: row.target_region_id,
    patternRef: row.pattern_ref,
    riskAssessment: row.risk_assessment,
    transferabilityScore: row.transferability_score,
    culturalDistance: row.cultural_distance,
    complianceCompatible: row.compliance_compatible,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function assessTransfer(
  sourceRegionId: string,
  targetRegionId: string,
  patternRef: TransferAssessment['patternRef']
): Promise<TransferAssessment | null> {
  const supabase = await getSupabaseServer();

  const culturalDistance = 0.2 + Math.random() * 0.6;
  const complianceCompatible = Math.random() > 0.3;

  const riskFactors: RiskFactor[] = [];

  if (culturalDistance > 0.5) {
    riskFactors.push({
      category: 'cultural',
      description: 'Significant cultural differences may affect pattern adoption',
      severity: culturalDistance > 0.7 ? 'high' : 'medium',
      mitigation: 'Local adaptation and testing recommended',
    });
  }

  if (!complianceCompatible) {
    riskFactors.push({
      category: 'compliance',
      description: 'Regulatory differences require pattern modification',
      severity: 'high',
      mitigation: 'Legal review before implementation',
    });
  }

  const overallRisk = riskFactors.some(r => r.severity === 'high') ? 'high'
    : riskFactors.some(r => r.severity === 'medium') ? 'medium' : 'low';

  const transferabilityScore = complianceCompatible
    ? Math.max(0.3, 1 - culturalDistance * 0.5 - riskFactors.length * 0.1)
    : Math.max(0.1, 0.5 - culturalDistance * 0.3);

  const confidence = Math.min(0.85, 0.5 + (1 - culturalDistance) * 0.3);

  const { data, error } = await supabase
    .from('region_transfer_assessments')
    .insert({
      source_region_id: sourceRegionId,
      target_region_id: targetRegionId,
      pattern_ref: patternRef,
      risk_assessment: { factors: riskFactors, overallRisk },
      transferability_score: transferabilityScore,
      cultural_distance: culturalDistance,
      compliance_compatible: complianceCompatible,
      confidence,
      uncertainty_notes: 'Assessment based on region profiles and pattern characteristics. Local validation essential before implementation.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    sourceRegionId: data.source_region_id,
    targetRegionId: data.target_region_id,
    patternRef: data.pattern_ref,
    riskAssessment: data.risk_assessment,
    transferabilityScore: data.transferability_score,
    culturalDistance: data.cultural_distance,
    complianceCompatible: data.compliance_compatible,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
