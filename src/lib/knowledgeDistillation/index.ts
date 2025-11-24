import { getSupabaseServer } from '@/lib/supabase';

export interface KnowledgeArtifact {
  id: string;
  tenantId: string;
  artifactType: 'guide' | 'sop' | 'faq' | 'playbook' | 'checklist';
  title: string;
  content: string;
  sourceSystems: string[];
  isExample: boolean;
  tags: string[];
  confidence: number;
  uncertaintyNotes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getArtifacts(tenantId: string, artifactType?: string): Promise<KnowledgeArtifact[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('knowledge_artifacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (artifactType) {
    query = query.eq('artifact_type', artifactType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get knowledge artifacts:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    artifactType: row.artifact_type,
    title: row.title,
    content: row.content,
    sourceSystems: row.source_systems,
    isExample: row.is_example,
    tags: row.tags,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function generateArtifact(
  tenantId: string,
  artifactType: KnowledgeArtifact['artifactType'],
  title: string,
  content: string,
  sourceSystems: string[]
): Promise<KnowledgeArtifact | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('knowledge_artifacts')
    .insert({
      tenant_id: tenantId,
      artifact_type: artifactType,
      title,
      content,
      source_systems: sourceSystems,
      is_example: false,
      tags: [],
      confidence: 0.75,
      uncertainty_notes: 'Artifact distilled from source systems; verify accuracy before distribution'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to generate artifact:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    artifactType: data.artifact_type,
    title: data.title,
    content: data.content,
    sourceSystems: data.source_systems,
    isExample: data.is_example,
    tags: data.tags,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    version: data.version,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
