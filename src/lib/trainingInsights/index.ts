import { getSupabaseServer } from '@/lib/supabase';

export interface TrainingInsight {
  id: string;
  tenantId: string;
  topic: string;
  audienceType: 'founder' | 'agency_owner' | 'operator' | 'all';
  sourceSignals: string[];
  capabilityGap?: string;
  recommendedModules: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  uncertaintyNotes?: string;
  status: 'pending' | 'acknowledged' | 'addressed' | 'dismissed';
  createdAt: string;
}

export async function getInsights(tenantId: string): Promise<TrainingInsight[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('training_insights')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to get training insights:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    topic: row.topic,
    audienceType: row.audience_type,
    sourceSignals: row.source_signals,
    capabilityGap: row.capability_gap,
    recommendedModules: row.recommended_modules,
    priority: row.priority,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at
  }));
}

export async function createInsight(
  tenantId: string,
  topic: string,
  audienceType: TrainingInsight['audienceType'],
  sourceSignals: string[],
  capabilityGap?: string
): Promise<TrainingInsight | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('training_insights')
    .insert({
      tenant_id: tenantId,
      topic,
      audience_type: audienceType,
      source_signals: sourceSignals,
      capability_gap: capabilityGap,
      recommended_modules: [],
      confidence: 0.7,
      uncertainty_notes: 'Training recommendations based on pattern analysis; individual needs may vary'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create training insight:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    topic: data.topic,
    audienceType: data.audience_type,
    sourceSignals: data.source_signals,
    capabilityGap: data.capability_gap,
    recommendedModules: data.recommended_modules,
    priority: data.priority,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at
  };
}

export async function getRecommendations(tenantId: string, audienceType?: string): Promise<TrainingInsight[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('training_insights')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending');

  if (audienceType) {
    query = query.or(`audience_type.eq.${audienceType},audience_type.eq.all`);
  }

  const { data, error } = await query.order('priority', { ascending: true }).limit(20);

  if (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    topic: row.topic,
    audienceType: row.audience_type,
    sourceSignals: row.source_signals,
    capabilityGap: row.capability_gap,
    recommendedModules: row.recommended_modules,
    priority: row.priority,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at
  }));
}
