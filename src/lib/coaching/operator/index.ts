import { getSupabaseServer } from '@/lib/supabase';

export interface CoachingPrompt {
  id: string;
  tenantId: string;
  userId?: string;
  promptType: 'suggestion' | 'warning' | 'opportunity' | 'reminder';
  message: string;
  contextDashboards: string[];
  actionRecommended?: string;
  confidence: number;
  uncertaintyNotes?: string;
  isAcknowledged: boolean;
  createdAt: string;
}

export async function getPrompts(tenantId: string, userId?: string): Promise<CoachingPrompt[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('operator_coaching_prompts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get coaching prompts:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    promptType: row.prompt_type,
    message: row.message,
    contextDashboards: row.context_dashboards,
    actionRecommended: row.action_recommended,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    isAcknowledged: row.is_acknowledged,
    createdAt: row.created_at
  }));
}

export async function createPrompt(
  tenantId: string,
  promptType: CoachingPrompt['promptType'],
  message: string,
  contextDashboards: string[],
  actionRecommended?: string,
  userId?: string
): Promise<CoachingPrompt | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('operator_coaching_prompts')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      prompt_type: promptType,
      message,
      context_dashboards: contextDashboards,
      action_recommended: actionRecommended,
      confidence: 0.7,
      uncertainty_notes: 'Suggestion based on current dashboard state; outcomes not guaranteed'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create coaching prompt:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    promptType: data.prompt_type,
    message: data.message,
    contextDashboards: data.context_dashboards,
    actionRecommended: data.action_recommended,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    isAcknowledged: data.is_acknowledged,
    createdAt: data.created_at
  };
}

export async function acknowledgePrompt(promptId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('operator_coaching_prompts')
    .update({ is_acknowledged: true })
    .eq('id', promptId);

  return !error;
}
