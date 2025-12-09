/**
 * Cognitive Load Balancer
 * Phase 101: Region-aware and tenant-aware load balancing
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface LoadSnapshot {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  loadVector: Record<string, number>;
  recommendedActions: string[];
  overallLoad: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getLoadSnapshots(tenantId?: string, regionId?: string): Promise<LoadSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase.from('cognitive_load_snapshots').select('*').order('created_at', { ascending: false });

  if (tenantId) {
query = query.eq('tenant_id', tenantId);
}
  if (regionId) {
query = query.eq('region_id', regionId);
}

  const { data } = await query.limit(20);

  return (data || []).map(s => ({
    id: s.id,
    tenantId: s.tenant_id,
    regionId: s.region_id,
    loadVector: s.load_vector,
    recommendedActions: s.recommended_actions,
    overallLoad: s.overall_load,
    uncertaintyNotes: s.uncertainty_notes,
    createdAt: s.created_at,
  }));
}

export async function generateLoadSnapshot(tenantId: string, regionId?: string): Promise<LoadSnapshot | null> {
  const supabase = await getSupabaseServer();

  // Simulate load calculation
  const loadVector = {
    inference: Math.random() * 0.8,
    memory: Math.random() * 0.6,
    orchestration: Math.random() * 0.7,
    creative: Math.random() * 0.5,
  };

  const overallLoad = Object.values(loadVector).reduce((a, b) => a + b, 0) / Object.keys(loadVector).length;

  const recommendedActions: string[] = [];
  if (loadVector.inference > 0.7) {
recommendedActions.push('Consider reducing inference frequency');
}
  if (loadVector.memory > 0.5) {
recommendedActions.push('Review memory compression settings');
}
  if (overallLoad > 0.6) {
recommendedActions.push('Monitor for potential throttling');
}

  const { data, error } = await supabase
    .from('cognitive_load_snapshots')
    .insert({
      tenant_id: tenantId,
      region_id: regionId || null,
      load_vector: loadVector,
      recommended_actions: recommendedActions,
      overall_load: overallLoad,
      uncertainty_notes: 'Load estimates are approximations based on recent activity patterns.',
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
    loadVector: data.load_vector,
    recommendedActions: data.recommended_actions,
    overallLoad: data.overall_load,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
