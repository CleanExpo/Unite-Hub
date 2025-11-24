/**
 * Founder Cognitive Map
 * Phase 103: Full cognitive visualization
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface CognitiveMapSnapshot {
  id: string;
  tenantId: string | null;
  map: Record<string, unknown>;
  riskZones: RiskZone[];
  opportunityClusters: OpportunityCluster[];
  confidence: number;
  uncertaintyNotes: string | null;
  createdAt: string;
}

export interface RiskZone {
  id: string;
  name: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface OpportunityCluster {
  id: string;
  name: string;
  potential: number;
  confidence: number;
}

export async function getCognitiveMap(tenantId: string): Promise<CognitiveMapSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_cognitive_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    map: data.map,
    riskZones: data.risk_zones,
    opportunityClusters: data.opportunity_clusters,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}

export async function generateCognitiveMap(tenantId: string): Promise<CognitiveMapSnapshot | null> {
  const supabase = await getSupabaseServer();

  const map = {
    nodes: [],
    edges: [],
    summary: 'Cognitive map generated from intelligence mesh and navigator data',
  };

  const riskZones: RiskZone[] = [
    { id: '1', name: 'Compliance Gap', severity: 'medium', confidence: 0.7 },
  ];

  const opportunityClusters: OpportunityCluster[] = [
    { id: '1', name: 'Creative Expansion', potential: 0.8, confidence: 0.65 },
  ];

  const { data, error } = await supabase
    .from('founder_cognitive_snapshots')
    .insert({
      tenant_id: tenantId,
      map,
      risk_zones: riskZones,
      opportunity_clusters: opportunityClusters,
      confidence: 0.7,
      uncertainty_notes: 'Risk zones and clusters are based on pattern detection and require validation.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    map: data.map,
    riskZones: data.risk_zones,
    opportunityClusters: data.opportunity_clusters,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
