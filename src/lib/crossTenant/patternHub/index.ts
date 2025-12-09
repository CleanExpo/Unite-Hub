import { getSupabaseServer } from '@/lib/supabase';
import crypto from 'crypto';

export interface GlobalPattern {
  id: string;
  patternHash: string;
  category: string;
  description: string;
  anonymisedContext: Record<string, unknown>;
  submissionCount: number;
  confidence: number;
  uncertaintyNotes?: string;
  similarityTags: string[];
  isPublished: boolean;
  createdAt: string;
}

export async function getGlobalPatterns(category?: string): Promise<GlobalPattern[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('global_pattern_catalog')
    .select('*')
    .eq('is_published', true)
    .order('submission_count', { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    patternHash: row.pattern_hash,
    category: row.category,
    description: row.description,
    anonymisedContext: row.anonymised_context,
    submissionCount: row.submission_count,
    confidence: Math.min(row.confidence, 0.95),
    uncertaintyNotes: row.uncertainty_notes,
    similarityTags: row.similarity_tags,
    isPublished: row.is_published,
    createdAt: row.created_at
  }));
}

export async function submitPattern(
  category: string,
  description: string,
  context: Record<string, unknown>
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Anonymise context
  const anonymised = { ...context };
  delete anonymised.tenantId;
  delete anonymised.userId;
  delete anonymised.clientNames;

  const patternHash = crypto.createHash('sha256')
    .update(JSON.stringify({ category, description }))
    .digest('hex');

  // Check if pattern exists
  const { data: existing } = await supabase
    .from('global_pattern_catalog')
    .select('id, submission_count')
    .eq('pattern_hash', patternHash)
    .single();

  if (existing) {
    await supabase
      .from('global_pattern_catalog')
      .update({
        submission_count: existing.submission_count + 1,
        is_published: existing.submission_count + 1 >= 3
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('global_pattern_catalog').insert({
      pattern_hash: patternHash,
      category,
      description,
      anonymised_context: anonymised,
      confidence: 0.6,
      uncertainty_notes: 'Pattern requires minimum submissions before publishing',
      is_published: false
    });
  }

  return true;
}

export async function getSuggestionsForTenant(tenantId: string): Promise<GlobalPattern[]> {
  // Return published patterns as suggestions
  return getGlobalPatterns();
}
