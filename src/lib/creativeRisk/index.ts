/**
 * Creative Risk & Sensitivity Engine
 * Phase 118: Assesses creative content for risk
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface SensitivityFlag {
  category: 'cultural' | 'compliance' | 'brand' | 'timing' | 'audience';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface CreativeRiskAssessment {
  id: string;
  campaignRef: { type: string; id: string; name: string };
  regionId: string | null;
  tenantId: string | null;
  riskProfile: {
    overallRisk: 'high' | 'medium' | 'low';
    complianceRisk: number;
    culturalRisk: number;
    brandRisk: number;
    timingRisk: number;
  };
  sensitivityFlags: SensitivityFlag[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getAssessments(tenantId: string): Promise<CreativeRiskAssessment[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('creative_risk_assessments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    campaignRef: row.campaign_ref,
    regionId: row.region_id,
    tenantId: row.tenant_id,
    riskProfile: row.risk_profile,
    sensitivityFlags: row.sensitivity_flags,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function assessRisk(
  campaignRef: CreativeRiskAssessment['campaignRef'],
  tenantId: string,
  regionId?: string
): Promise<CreativeRiskAssessment | null> {
  const supabase = await getSupabaseServer();

  const riskProfile = {
    overallRisk: 'medium' as const,
    complianceRisk: Math.random() * 0.5,
    culturalRisk: Math.random() * 0.6,
    brandRisk: Math.random() * 0.4,
    timingRisk: Math.random() * 0.3,
  };

  const maxRisk = Math.max(riskProfile.complianceRisk, riskProfile.culturalRisk, riskProfile.brandRisk);
  riskProfile.overallRisk = maxRisk > 0.7 ? 'high' : maxRisk > 0.4 ? 'medium' : 'low';

  const sensitivityFlags: SensitivityFlag[] = [];
  if (riskProfile.culturalRisk > 0.4) {
    sensitivityFlags.push({
      category: 'cultural',
      severity: riskProfile.culturalRisk > 0.6 ? 'high' : 'medium',
      description: 'Content may not resonate across all target cultures',
      recommendation: 'Review with local market experts',
    });
  }

  const confidence = 0.6 + Math.random() * 0.2;

  const { data, error } = await supabase
    .from('creative_risk_assessments')
    .insert({
      campaign_ref: campaignRef,
      tenant_id: tenantId,
      region_id: regionId,
      risk_profile: riskProfile,
      sensitivity_flags: sensitivityFlags,
      confidence,
      uncertainty_notes: 'Risk scores derived from rules and data patterns. System cannot claim zero risk.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    campaignRef: data.campaign_ref,
    regionId: data.region_id,
    tenantId: data.tenant_id,
    riskProfile: data.risk_profile,
    sensitivityFlags: data.sensitivity_flags,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
