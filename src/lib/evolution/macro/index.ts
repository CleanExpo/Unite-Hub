import { getSupabaseServer } from '@/lib/supabase';

export interface MacroEvolutionProposal {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  scope: 'tenant' | 'region' | 'global';
  affectedEngines: string[];
  affectedRegions: string[];
  impactEstimate: Record<string, unknown>;
  riskMatrix: Record<string, unknown>;
  truthLayerValidation?: Record<string, unknown>;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'proposed' | 'under_review' | 'approved' | 'rejected' | 'executed';
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export async function getProposals(tenantId: string, status?: string): Promise<MacroEvolutionProposal[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('macro_evolution_proposals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    scope: row.scope,
    affectedEngines: row.affected_engines,
    affectedRegions: row.affected_regions,
    impactEstimate: row.impact_estimate,
    riskMatrix: row.risk_matrix,
    truthLayerValidation: row.truth_layer_validation,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  }));
}

export async function createProposal(
  tenantId: string,
  title: string,
  description: string,
  scope: MacroEvolutionProposal['scope'],
  affectedEngines: string[]
): Promise<MacroEvolutionProposal | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('macro_evolution_proposals')
    .insert({
      tenant_id: tenantId,
      title,
      description,
      scope,
      affected_engines: affectedEngines,
      affected_regions: [],
      impact_estimate: { estimated: true, details: 'Requires detailed analysis' },
      risk_matrix: { overall: 'medium', factors: [] },
      confidence: 0.6,
      uncertainty_notes: 'Macro proposals require thorough human review before execution'
    })
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    title: data.title,
    description: data.description,
    scope: data.scope,
    affectedEngines: data.affected_engines,
    affectedRegions: data.affected_regions,
    impactEstimate: data.impact_estimate,
    riskMatrix: data.risk_matrix,
    truthLayerValidation: data.truth_layer_validation,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    reviewedBy: data.reviewed_by,
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at
  };
}

export async function reviewProposal(
  proposalId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected'
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('macro_evolution_proposals')
    .update({
      status: decision,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', proposalId);

  return !error;
}
