import { getSupabaseServer } from '@/lib/supabase';

export interface Pattern {
  id: string;
  tenantId: string;
  name: string;
  category: 'campaign' | 'creative' | 'scaling' | 'automation' | 'workflow' | 'other';
  description: string;
  successContext?: Record<string, unknown>;
  failureReasons?: Record<string, unknown>;
  guardrails: string[];
  conditions: string[];
  isSuccess: boolean;
  confidence: number;
  uncertaintyNotes?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getPatterns(tenantId: string, category?: string): Promise<Pattern[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('pattern_library')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('usage_count', { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get patterns:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    description: row.description,
    successContext: row.success_context,
    failureReasons: row.failure_reasons,
    guardrails: row.guardrails,
    conditions: row.conditions,
    isSuccess: row.is_success,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function matchPattern(
  tenantId: string,
  context: Record<string, unknown>
): Promise<Pattern[]> {
  // Simple matching - in production would use more sophisticated matching
  const patterns = await getPatterns(tenantId);
  return patterns.filter(p => p.isSuccess).slice(0, 5);
}

export async function createPattern(
  tenantId: string,
  name: string,
  category: Pattern['category'],
  description: string,
  isSuccess: boolean,
  context?: Record<string, unknown>
): Promise<Pattern | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('pattern_library')
    .insert({
      tenant_id: tenantId,
      name,
      category,
      description,
      success_context: isSuccess ? context : null,
      failure_reasons: !isSuccess ? context : null,
      guardrails: [],
      conditions: [],
      is_success: isSuccess,
      confidence: 0.7,
      uncertainty_notes: 'Pattern success context-dependent; not universally applicable'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create pattern:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    category: data.category,
    description: data.description,
    successContext: data.success_context,
    failureReasons: data.failure_reasons,
    guardrails: data.guardrails,
    conditions: data.conditions,
    isSuccess: data.is_success,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    usageCount: data.usage_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
