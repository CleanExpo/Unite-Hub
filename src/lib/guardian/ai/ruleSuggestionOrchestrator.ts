/**
 * H01 Rule Suggestion Orchestrator
 *
 * Coordinates signal collection, heuristic + AI suggestion generation, and persistence.
 * Handles deduplication, expiry, and audit logging.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { buildRuleSuggestionSignals } from './ruleSuggestionSignals';
import { deriveHeuristicSuggestions } from './heuristicRuleSuggester';
import { generateAiSuggestions } from './aiRuleSuggester';

export interface BuildSuggestionsOptions {
  windowHours?: number;
  maxSuggestions?: number;
  expiresInDays?: number;
  actor?: string;
}

export interface BuildSuggestionsResult {
  created: number;
  aiUsed: boolean;
  suggestions: Array<{
    id: string;
    title: string;
    source: 'ai' | 'heuristic';
    status: string;
  }>;
}

/**
 * Build and store suggestions for a tenant
 */
export async function buildAndStoreSuggestions(
  tenantId: string,
  options: BuildSuggestionsOptions = {}
): Promise<BuildSuggestionsResult> {
  const supabase = getSupabaseServer();
  const windowHours = options.windowHours || 24;
  const maxSuggestions = options.maxSuggestions || 10;
  const expiresInDays = options.expiresInDays || 30;
  const actor = options.actor || 'system';

  try {
    // 1. Collect signals
    const signals = await buildRuleSuggestionSignals(tenantId, { hours: windowHours });

    // 2. Generate heuristic suggestions
    const heuristicSuggestions = deriveHeuristicSuggestions(signals);

    // 3. Try to generate AI suggestions
    let aiSuggestions: any[] = [];
    let aiUsed = false;
    try {
      aiSuggestions = await generateAiSuggestions(tenantId, signals);
      aiUsed = aiSuggestions.length > 0;
    } catch (err) {
      console.warn('buildAndStoreSuggestions: AI generation failed, using heuristics only', err);
    }

    // 4. Merge and deduplicate (simple title-based dedup)
    const allSuggestions = [...heuristicSuggestions, ...aiSuggestions];
    const titleMap = new Map<string, any>();

    for (const sugg of allSuggestions) {
      if (!titleMap.has(sugg.title)) {
        titleMap.set(sugg.title, sugg);
      }
    }

    const dedupedSuggestions = Array.from(titleMap.values()).slice(0, maxSuggestions);

    // 5. Store suggestions
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const storedSuggestions: any[] = [];
    for (const sugg of dedupedSuggestions) {
      const { data, error } = await supabase
        .from('guardian_rule_suggestions')
        .insert({
          tenant_id: tenantId,
          status: 'new',
          source: sugg.source,
          title: sugg.title,
          rationale: sugg.rationale,
          confidence: sugg.confidence,
          signals: sugg.signals,
          rule_draft: sugg.ruleDraft,
          safety: sugg.safety || {
            promptRedacted: false,
            validationPassed: true,
            validationErrors: [],
            prohibitedKeysFound: [],
          },
          expires_at: expiresAt.toISOString(),
          created_by: actor,
        })
        .select('id, title, source, status');

      if (!error && data && data.length > 0) {
        storedSuggestions.push(data[0]);
      }
    }

    // 6. Log to audit (if Z10 audit exists)
    try {
      await logSuggestionAudit(tenantId, {
        action: 'suggestions_generated',
        summary: `Generated ${storedSuggestions.length} rule suggestions (${aiUsed ? 'AI+heuristic' : 'heuristic only'})`,
        details: {
          heuristicCount: heuristicSuggestions.length,
          aiCount: aiSuggestions.length,
          dedupedCount: storedSuggestions.length,
          windowHours,
        },
        actor,
      });
    } catch (err) {
      console.warn('buildAndStoreSuggestions: Audit logging failed', err);
    }

    return {
      created: storedSuggestions.length,
      aiUsed,
      suggestions: storedSuggestions,
    };
  } catch (error) {
    console.error('buildAndStoreSuggestions: Error', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * List suggestions for a tenant with optional filtering
 */
export async function listSuggestions(
  tenantId: string,
  filters?: {
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }
) {
  const supabase = getSupabaseServer();
  let query = supabase
    .from('guardian_rule_suggestions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    suggestions: data || [],
    total: count || 0,
  };
}

/**
 * Get a single suggestion
 */
export async function getSuggestion(tenantId: string, suggestionId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('guardian_rule_suggestions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', suggestionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update suggestion status
 */
export async function updateSuggestionStatus(
  tenantId: string,
  suggestionId: string,
  status: string,
  metadata?: Record<string, unknown>
) {
  const supabase = getSupabaseServer();
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (metadata) {
    updateData.metadata = metadata;
  }

  const { data, error } = await supabase
    .from('guardian_rule_suggestions')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', suggestionId)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Record feedback on a suggestion
 */
export async function addSuggestionFeedback(
  tenantId: string,
  suggestionId: string,
  feedback: {
    action: string;
    rating?: number;
    reason?: string;
    notes?: string;
    actor?: string;
  }
) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('guardian_rule_suggestion_feedback')
    .insert({
      tenant_id: tenantId,
      suggestion_id: suggestionId,
      action: feedback.action,
      rating: feedback.rating,
      reason: feedback.reason,
      notes: feedback.notes,
      actor: feedback.actor,
    })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Log suggestion activity to audit (Z10 if available, else server logs)
 */
async function logSuggestionAudit(
  tenantId: string,
  audit: {
    action: string;
    summary: string;
    details?: Record<string, unknown>;
    actor: string;
  }
) {
  const supabase = getSupabaseServer();

  try {
    // Try to log via Z10 audit if it exists
    await supabase.from('guardian_meta_audit_log').insert({
      tenant_id: tenantId,
      source: 'ai_rule_suggestions',
      action: audit.action,
      entity_type: 'rule_suggestion',
      summary: audit.summary,
      details: audit.details || {},
      actor: audit.actor,
    });
  } catch (err) {
    // Fall back to server logs if Z10 doesn't exist
    console.info('Suggestion audit:', audit);
  }
}
