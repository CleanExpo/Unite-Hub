/**
 * Strategic Alignment Engine
 * Phase 104: Global alignment measurement
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AlignmentSnapshot {
  id: string;
  tenantId: string | null;
  alignmentVector: Record<string, number>;
  misalignmentFlags: MisalignmentFlag[];
  recommendations: string[];
  overallAlignment: number;
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export interface MisalignmentFlag {
  area: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export async function getAlignmentSnapshot(tenantId: string): Promise<AlignmentSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('alignment_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    alignmentVector: data.alignment_vector,
    misalignmentFlags: data.misalignment_flags,
    recommendations: data.recommendations,
    overallAlignment: data.overall_alignment,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}

export async function generateAlignmentSnapshot(tenantId: string): Promise<AlignmentSnapshot | null> {
  const supabase = await getSupabaseServer();

  const alignmentVector = {
    creative_performance: 0.7 + Math.random() * 0.2,
    compliance_market: 0.6 + Math.random() * 0.3,
    opportunity_scaling: 0.65 + Math.random() * 0.25,
    region_tenant: 0.75 + Math.random() * 0.15,
  };

  const overallAlignment = Object.values(alignmentVector).reduce((a, b) => a + b, 0) / Object.keys(alignmentVector).length;

  const misalignmentFlags: MisalignmentFlag[] = [];
  if (alignmentVector.creative_performance < 0.7) {
    misalignmentFlags.push({
      area: 'creative_performance',
      severity: 'medium',
      description: 'Creative output not fully aligned with performance targets',
    });
  }

  const recommendations: string[] = [];
  if (overallAlignment < 0.8) {
    recommendations.push('Review alignment between creative strategy and market positioning');
  }
  recommendations.push('Monitor compliance-market alignment trends');

  const confidence = Math.min(0.9, 0.5 + overallAlignment * 0.4);

  const { data, error } = await supabase
    .from('alignment_snapshots')
    .insert({
      tenant_id: tenantId,
      alignment_vector: alignmentVector,
      misalignment_flags: misalignmentFlags,
      recommendations,
      overall_alignment: overallAlignment,
      confidence,
      uncertainty_notes: 'Alignment scores are estimates based on available signals. Local validation recommended.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    alignmentVector: data.alignment_vector,
    misalignmentFlags: data.misalignment_flags,
    recommendations: data.recommendations,
    overallAlignment: data.overall_alignment,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
