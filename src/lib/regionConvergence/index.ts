/**
 * Cross-Region Knowledge Convergence Engine
 * Phase 99: Safe transfer of learnings across regions
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface LearningPacket {
  id: string;
  sourceRegionId: string;
  targetRegionId: string;
  patternSummary: PatternSummary;
  adjustmentNotes: string | null;
  transferabilityScore: number;
  confidence: number;
  culturalDistance: number;
  complianceCompatible: boolean;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
  uncertaintyNotes: string | null;
  createdAt: string;
}

export interface PatternSummary {
  type: string;
  description: string;
  metrics: Record<string, number>;
  context: string;
}

export async function getPackets(options: {
  sourceRegionId?: string;
  targetRegionId?: string;
  status?: string;
  limit?: number;
} = {}): Promise<LearningPacket[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('regional_learning_packets')
    .select('*')
    .order('transferability_score', { ascending: false });

  if (options.sourceRegionId) {
    query = query.eq('source_region_id', options.sourceRegionId);
  }
  if (options.targetRegionId) {
    query = query.eq('target_region_id', options.targetRegionId);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  }

  const { data } = await query.limit(options.limit || 50);

  return (data || []).map(transformPacket);
}

export async function generatePacket(
  sourceRegionId: string,
  targetRegionId: string,
  patternSummary: PatternSummary
): Promise<LearningPacket | null> {
  const supabase = await getSupabaseServer();

  // Calculate cultural distance
  const { data: distanceData } = await supabase.rpc('calculate_cultural_distance', {
    source_region: sourceRegionId,
    target_region: targetRegionId,
  });

  const culturalDistance = distanceData || 0.5;

  // Calculate transferability (higher distance = lower transferability)
  const baseTransferability = 0.7;
  const transferabilityScore = Math.max(0.1, baseTransferability - culturalDistance * 0.5);

  // Calculate confidence with cultural penalty
  const confidence = Math.max(0.3, 0.8 - culturalDistance * 0.3);

  // Generate adjustment notes
  const adjustmentNotes = generateAdjustmentNotes(culturalDistance, patternSummary.type);

  // Check compliance compatibility (simplified)
  const complianceCompatible = culturalDistance < 0.5;

  const uncertaintyNotes = `Pattern applicability may vary due to ${
    culturalDistance > 0.3 ? 'significant' : 'moderate'
  } cultural differences between regions. Local validation recommended.`;

  const { data, error } = await supabase
    .from('regional_learning_packets')
    .insert({
      source_region_id: sourceRegionId,
      target_region_id: targetRegionId,
      pattern_summary: patternSummary,
      adjustment_notes: adjustmentNotes,
      transferability_score: transferabilityScore,
      confidence,
      cultural_distance: culturalDistance,
      compliance_compatible: complianceCompatible,
      status: 'pending',
      uncertainty_notes: uncertaintyNotes,
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return transformPacket(data);
}

export async function updatePacketStatus(
  packetId: string,
  status: 'applied' | 'rejected' | 'expired'
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('regional_learning_packets')
    .update({ status })
    .eq('id', packetId);
}

function generateAdjustmentNotes(culturalDistance: number, patternType: string): string {
  const notes: string[] = [];

  if (culturalDistance > 0.4) {
    notes.push('Consider significant localization adjustments.');
  } else if (culturalDistance > 0.2) {
    notes.push('Minor cultural adaptations recommended.');
  }

  if (patternType === 'creative') {
    notes.push('Review creative tone for local audience preferences.');
  } else if (patternType === 'compliance') {
    notes.push('Verify compliance requirements differ between regions.');
  }

  return notes.join(' ') || 'Pattern appears directly applicable.';
}

function transformPacket(row: Record<string, unknown>): LearningPacket {
  return {
    id: row.id as string,
    sourceRegionId: row.source_region_id as string,
    targetRegionId: row.target_region_id as string,
    patternSummary: row.pattern_summary as PatternSummary,
    adjustmentNotes: row.adjustment_notes as string | null,
    transferabilityScore: row.transferability_score as number,
    confidence: row.confidence as number,
    culturalDistance: row.cultural_distance as number,
    complianceCompatible: row.compliance_compatible as boolean,
    status: row.status as LearningPacket['status'],
    uncertaintyNotes: row.uncertainty_notes as string | null,
    createdAt: row.created_at as string,
  };
}
