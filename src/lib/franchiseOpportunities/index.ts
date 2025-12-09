/**
 * Franchise Opportunity Propagation Engine
 * Phase 113: Propagates opportunities to child agencies
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface FranchiseOpportunity {
  id: string;
  parentAgencyId: string;
  scope: 'growth' | 'risk' | 'market' | 'compliance' | 'creative';
  opportunityPayload: {
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
  };
  targetRegions: string[];
  targetAgencies: string[];
  confidence: number;
  uncertaintyNotes: string | null;
  propagatedAt: string | null;
  createdAt: string;
}

export async function getOpportunities(parentAgencyId: string): Promise<FranchiseOpportunity[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('franchise_opportunity_windows')
    .select('*')
    .eq('parent_agency_id', parentAgencyId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (!data) {
return [];
}

  return data.map(row => ({
    id: row.id,
    parentAgencyId: row.parent_agency_id,
    scope: row.scope,
    opportunityPayload: row.opportunity_payload,
    targetRegions: row.target_regions,
    targetAgencies: row.target_agencies,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    propagatedAt: row.propagated_at,
    createdAt: row.created_at,
  }));
}

export async function createOpportunity(
  parentAgencyId: string,
  scope: FranchiseOpportunity['scope'],
  payload: FranchiseOpportunity['opportunityPayload'],
  targetRegions: string[],
  targetAgencies: string[]
): Promise<FranchiseOpportunity | null> {
  const supabase = await getSupabaseServer();

  const confidence = 0.5 + Math.random() * 0.35;

  const { data, error } = await supabase
    .from('franchise_opportunity_windows')
    .insert({
      parent_agency_id: parentAgencyId,
      scope,
      opportunity_payload: payload,
      target_regions: targetRegions,
      target_agencies: targetAgencies,
      confidence,
      uncertainty_notes: 'Opportunity identified at franchise level. Local conditions may affect applicability. Child agencies should evaluate independently.',
    })
    .select()
    .single();

  if (error || !data) {
return null;
}

  return {
    id: data.id,
    parentAgencyId: data.parent_agency_id,
    scope: data.scope,
    opportunityPayload: data.opportunity_payload,
    targetRegions: data.target_regions,
    targetAgencies: data.target_agencies,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    propagatedAt: data.propagated_at,
    createdAt: data.created_at,
  };
}
