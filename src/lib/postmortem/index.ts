import { getSupabaseServer } from '@/lib/supabase';

export interface Postmortem {
  id: string;
  tenantId: string;
  incidentType: 'regression' | 'campaign_failure' | 'system_error' | 'safety_breach' | 'other';
  title: string;
  summary: string;
  facts: string[];
  hypotheses: string[];
  rootCauses: string[];
  lessons: string[];
  linkedPatterns: string[];
  linkedTraining: string[];
  confidence: number;
  uncertaintyNotes?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
}

export async function getPostmortems(tenantId: string): Promise<Postmortem[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('incident_postmortems')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to get postmortems:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    incidentType: row.incident_type,
    title: row.title,
    summary: row.summary,
    facts: row.facts,
    hypotheses: row.hypotheses,
    rootCauses: row.root_causes,
    lessons: row.lessons,
    linkedPatterns: row.linked_patterns,
    linkedTraining: row.linked_training,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at
  }));
}

export async function createPostmortem(
  tenantId: string,
  incidentType: Postmortem['incidentType'],
  title: string,
  summary: string,
  facts: string[]
): Promise<Postmortem | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('incident_postmortems')
    .insert({
      tenant_id: tenantId,
      incident_type: incidentType,
      title,
      summary,
      facts,
      hypotheses: [],
      root_causes: [],
      lessons: [],
      linked_patterns: [],
      linked_training: [],
      confidence: 0.7,
      uncertainty_notes: 'Facts separated from hypotheses; root cause analysis in progress'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create postmortem:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    incidentType: data.incident_type,
    title: data.title,
    summary: data.summary,
    facts: data.facts,
    hypotheses: data.hypotheses,
    rootCauses: data.root_causes,
    lessons: data.lessons,
    linkedPatterns: data.linked_patterns,
    linkedTraining: data.linked_training,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    publishedAt: data.published_at
  };
}

export async function getReport(postmortemId: string): Promise<Postmortem | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('incident_postmortems')
    .select('*')
    .eq('id', postmortemId)
    .single();

  if (error) {
    console.error('Failed to get postmortem report:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    incidentType: data.incident_type,
    title: data.title,
    summary: data.summary,
    facts: data.facts,
    hypotheses: data.hypotheses,
    rootCauses: data.root_causes,
    lessons: data.lessons,
    linkedPatterns: data.linked_patterns,
    linkedTraining: data.linked_training,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    publishedAt: data.published_at
  };
}
