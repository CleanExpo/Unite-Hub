import { getSupabaseServer } from '@/lib/supabase';

export interface ExperimentSandbox {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sandboxConfig: Record<string, unknown>;
  clonedFrom?: Record<string, unknown>;
  results: Record<string, unknown>;
  isActive: boolean;
  confidence?: number;
  uncertaintyNotes?: string;
  status: 'setup' | 'running' | 'completed' | 'archived';
  createdAt: string;
  completedAt?: string;
}

export async function createSandbox(
  tenantId: string,
  name: string,
  description?: string,
  config?: Record<string, unknown>
): Promise<ExperimentSandbox | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('experiment_sandboxes')
    .insert({
      tenant_id: tenantId,
      name,
      description,
      sandbox_config: config || {},
      uncertainty_notes: 'Sandbox results may not reflect live environment behavior'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create sandbox:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description,
    sandboxConfig: data.sandbox_config,
    clonedFrom: data.cloned_from,
    results: data.results,
    isActive: data.is_active,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    completedAt: data.completed_at
  };
}

export async function getSandboxes(tenantId: string): Promise<ExperimentSandbox[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('experiment_sandboxes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Failed to get sandboxes:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    sandboxConfig: row.sandbox_config,
    clonedFrom: row.cloned_from,
    results: row.results,
    isActive: row.is_active,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at
  }));
}

export async function getResults(sandboxId: string): Promise<Record<string, unknown> | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('experiment_sandboxes')
    .select('results')
    .eq('id', sandboxId)
    .single();

  if (error) {
    console.error('Failed to get sandbox results:', error);
    return null;
  }

  return data.results;
}
