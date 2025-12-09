import { getSupabaseServer } from '@/lib/supabase';

export interface TenantCohort {
  id: string;
  cohortLabel: string;
  description?: string;
  clusteringCriteria: Record<string, unknown>;
  memberCount: number;
  minMembersRequired: number;
  similarityIndex?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CohortSummary {
  id: string;
  cohortId: string;
  summaryType: string;
  aggregatedData: Record<string, unknown>;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function getCohorts(): Promise<TenantCohort[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('tenant_cohorts')
    .select('*')
    .eq('is_active', true)
    .order('member_count', { ascending: false });

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    cohortLabel: row.cohort_label,
    description: row.description,
    clusteringCriteria: row.clustering_criteria,
    memberCount: row.member_count,
    minMembersRequired: row.min_members_required,
    similarityIndex: row.similarity_index,
    isActive: row.is_active,
    createdAt: row.created_at
  }));
}

export async function getCohortSummaries(cohortId: string): Promise<CohortSummary[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('cohort_intelligence_summaries')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    cohortId: row.cohort_id,
    summaryType: row.summary_type,
    aggregatedData: row.aggregated_data,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at
  }));
}

export async function getTenantCohort(tenantId: string): Promise<TenantCohort | null> {
  // This would lookup which cohort the tenant belongs to
  // Returns the cohort without revealing other members
  const cohorts = await getCohorts();
  return cohorts[0] || null;
}
