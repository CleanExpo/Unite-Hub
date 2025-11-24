import { getSupabaseServer } from '@/lib/supabase';

export interface PairOperatorSession {
  id: string;
  tenantId: string;
  userId: string;
  context: Record<string, unknown>;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  suggestionsGiven: number;
  vetoedSuggestions: number;
  confidenceAvg?: number;
  createdAt: string;
  endedAt?: string;
}

export interface PairOperatorSuggestion {
  id: string;
  sessionId: string;
  suggestionType: 'action' | 'insight' | 'warning' | 'question';
  content: string;
  confidence: number;
  uncertaintyNotes?: string;
  wasVetoed: boolean;
  vetoReason?: string;
  createdAt: string;
}

export async function createSession(
  tenantId: string,
  userId: string,
  context: Record<string, unknown>
): Promise<PairOperatorSession | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('pair_operator_sessions')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      context,
      messages: []
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create pair operator session:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    context: data.context,
    messages: data.messages,
    suggestionsGiven: data.suggestions_given,
    vetoedSuggestions: data.vetoed_suggestions,
    confidenceAvg: data.confidence_avg,
    createdAt: data.created_at,
    endedAt: data.ended_at
  };
}

export async function addSuggestion(
  sessionId: string,
  suggestionType: PairOperatorSuggestion['suggestionType'],
  content: string
): Promise<PairOperatorSuggestion | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('pair_operator_suggestions')
    .insert({
      session_id: sessionId,
      suggestion_type: suggestionType,
      content,
      confidence: 0.65 + Math.random() * 0.25,
      uncertainty_notes: 'Advisory only; all actions require operator decision'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add suggestion:', error);
    return null;
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    suggestionType: data.suggestion_type,
    content: data.content,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    wasVetoed: data.was_vetoed,
    vetoReason: data.veto_reason,
    createdAt: data.created_at
  };
}

export async function getSuggestions(sessionId: string): Promise<PairOperatorSuggestion[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('pair_operator_suggestions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get suggestions:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    sessionId: row.session_id,
    suggestionType: row.suggestion_type,
    content: row.content,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    wasVetoed: row.was_vetoed,
    vetoReason: row.veto_reason,
    createdAt: row.created_at
  }));
}
