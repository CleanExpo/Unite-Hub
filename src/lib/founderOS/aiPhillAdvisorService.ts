/**
 * AI Phill Advisor Service
 *
 * Cognitive advisor operating in HUMAN_GOVERNED mode.
 * Generates insights, recommendations, and strategic advice for founders.
 * All outputs are advisory-only and stored in ai_phill_insights table.
 *
 * @module founderOS/aiPhillAdvisorService
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { listBusinesses, getBusiness, type FounderBusiness } from './founderBusinessRegistryService';
import { getSignals, type BusinessSignal } from './founderSignalInferenceService';

// ============================================================================
// Types
// ============================================================================

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type InsightCategory =
  | 'opportunity'
  | 'risk'
  | 'anomaly'
  | 'milestone'
  | 'recommendation'
  | 'alert'
  | 'trend'
  | 'benchmark'
  | 'custom';
export type GovernanceMode = 'HUMAN_GOVERNED' | 'AUTO_APPROVED' | 'AUTO_EXECUTED';
export type ReviewStatus = 'pending' | 'acknowledged' | 'actioned' | 'dismissed' | 'deferred';
export type InsightScope = 'portfolio' | 'business' | 'project' | 'campaign' | 'custom';

export interface RecommendedAction {
  action: string;
  priority?: string;
  effort?: 'quick_win' | 'medium' | 'long_term';
  expected_outcome?: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface AiPhillInsight {
  id: string;
  owner_user_id: string;
  related_business_id: string | null;
  scope: InsightScope | null;
  scope_id: string | null;
  title: string;
  body_md: string;
  priority: InsightPriority;
  category: InsightCategory;
  recommended_actions: RecommendedAction[];
  governance_mode: GovernanceMode;
  created_at: string;
  reviewed_at: string | null;
  review_status: ReviewStatus;
}

export interface GenerateInsightContext {
  topic?: string;
  signals?: Record<string, unknown>[];
  journal_entries?: string[];
  custom_context?: string;
}

export interface InsightFilters {
  category?: InsightCategory;
  priority?: InsightPriority;
  reviewStatus?: ReviewStatus;
  businessId?: string;
  limit?: number;
  offset?: number;
}

export interface AiPhillServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Anthropic Client
// ============================================================================

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Generate an AI-powered insight for the founder
 *
 * All insights operate in HUMAN_GOVERNED mode - they are advisory-only
 * and require human review before any action is taken.
 *
 * @param ownerUserId - UUID of the founder user
 * @param scope - Scope of the insight (portfolio, business, project, campaign)
 * @param scopeId - Optional scope ID (e.g., businessId)
 * @param context - Additional context for insight generation
 * @returns Generated insight
 */
export async function generateInsight(
  ownerUserId: string,
  scope: InsightScope,
  scopeId: string | null,
  context: GenerateInsightContext
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  try {
    const anthropic = getAnthropicClient();
    const supabase = supabaseAdmin;

    // Build context based on scope
    let businessContext: FounderBusiness | null = null;
    let signalContext: BusinessSignal[] = [];
    let portfolioContext: FounderBusiness[] = [];

    if (scope === 'business' && scopeId) {
      const businessResult = await getBusiness(scopeId);
      if (businessResult.success) {
        businessContext = businessResult.data || null;
      }

      const signalsResult = await getSignals(scopeId);
      if (signalsResult.success) {
        signalContext = signalsResult.data || [];
      }
    } else if (scope === 'portfolio') {
      const businessesResult = await listBusinesses(ownerUserId);
      if (businessesResult.success) {
        portfolioContext = businessesResult.data || [];
      }
    }

    // Build the prompt
    const systemPrompt = `You are AI Phill, a trusted strategic advisor for founders.

GOVERNANCE MODE: HUMAN_GOVERNED
- All insights are ADVISORY ONLY
- No actions are auto-executed
- Founder must review and approve all recommendations
- Be transparent about uncertainty and assumptions

Your role is to provide clear, actionable insights based on business data.
Focus on practical advice that can drive real business outcomes.`;

    let contextSection = '';

    if (businessContext) {
      contextSection += `\nBUSINESS:\n- Name: ${businessContext.display_name}\n- Industry: ${businessContext.industry || 'Not specified'}\n- Domain: ${businessContext.primary_domain || 'Not specified'}\n`;
    }

    if (portfolioContext.length > 0) {
      contextSection += `\nPORTFOLIO (${portfolioContext.length} businesses):\n${portfolioContext.map((b) => `- ${b.display_name} (${b.code})`).join('\n')}\n`;
    }

    if (signalContext.length > 0) {
      const signalSummary = signalContext.slice(0, 50).map((s) => ({
        family: s.signal_family,
        key: s.signal_key,
        value: s.value_numeric ?? s.value_text,
      }));
      contextSection += `\nRECENT SIGNALS:\n${JSON.stringify(signalSummary, null, 2)}\n`;
    }

    if (context.signals && context.signals.length > 0) {
      contextSection += `\nADDITIONAL SIGNALS:\n${JSON.stringify(context.signals, null, 2)}\n`;
    }

    if (context.journal_entries && context.journal_entries.length > 0) {
      contextSection += `\nRECENT JOURNAL ENTRIES:\n${context.journal_entries.join('\n---\n')}\n`;
    }

    if (context.custom_context) {
      contextSection += `\nADDITIONAL CONTEXT:\n${context.custom_context}\n`;
    }

    const userPrompt = `Generate a strategic insight based on the following context:
${contextSection}

${context.topic ? `FOCUS TOPIC: ${context.topic}` : 'Generate a general strategic insight based on available data.'}

Return a JSON object with this structure:
{
  "title": "<concise insight title>",
  "body_md": "<detailed insight in Markdown format>",
  "priority": "<critical|high|medium|low|info>",
  "category": "<opportunity|risk|anomaly|milestone|recommendation|alert|trend|benchmark>",
  "recommended_actions": [
    {
      "action": "<specific action to take>",
      "effort": "<quick_win|medium|long_term>",
      "expected_outcome": "<what success looks like>",
      "confidence": <0.0-1.0>
    }
  ]
}

Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 5000,
      },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text content
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
        break;
      }
    }

    const parsedResponse = JSON.parse(responseText);

    // Store the insight
    const { data: insight, error } = await supabase
      .from('ai_phill_insights')
      .insert({
        owner_user_id: ownerUserId,
        related_business_id: scope === 'business' ? scopeId : null,
        scope,
        scope_id: scopeId,
        title: parsedResponse.title,
        body_md: parsedResponse.body_md,
        priority: parsedResponse.priority as InsightPriority,
        category: parsedResponse.category as InsightCategory,
        recommended_actions: parsedResponse.recommended_actions || [],
        governance_mode: 'HUMAN_GOVERNED' as GovernanceMode,
        review_status: 'pending' as ReviewStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('[AiPhillAdvisor] Store insight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: insight as AiPhillInsight };
  } catch (err) {
    console.error('[AiPhillAdvisor] Generate insight error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating insight',
    };
  }
}

/**
 * Get insights for a founder with optional filters
 *
 * @param ownerUserId - UUID of the founder user
 * @param filters - Optional filters for the query
 * @returns List of insights
 */
export async function getInsights(
  ownerUserId: string,
  filters?: InsightFilters
): Promise<AiPhillServiceResult<AiPhillInsight[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('ai_phill_insights')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.reviewStatus) {
      query = query.eq('review_status', filters.reviewStatus);
    }
    if (filters?.businessId) {
      query = query.eq('related_business_id', filters.businessId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error('[AiPhillAdvisor] Get insights error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (insights || []) as AiPhillInsight[] };
  } catch (err) {
    console.error('[AiPhillAdvisor] Get insights exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching insights',
    };
  }
}

/**
 * Get a single insight by ID
 *
 * @param insightId - UUID of the insight
 * @returns Insight data
 */
export async function getInsight(
  insightId: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  try {
    const supabase = supabaseAdmin;

    const { data: insight, error } = await supabase
      .from('ai_phill_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Insight not found' };
      }
      console.error('[AiPhillAdvisor] Get insight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: insight as AiPhillInsight };
  } catch (err) {
    console.error('[AiPhillAdvisor] Get insight exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching insight',
    };
  }
}

/**
 * Update the review status of an insight
 *
 * @param insightId - UUID of the insight
 * @param status - New review status
 * @param reviewedAt - Optional review timestamp (defaults to now)
 * @returns Updated insight
 */
export async function reviewInsight(
  insightId: string,
  status: ReviewStatus,
  reviewedAt?: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  try {
    const supabase = supabaseAdmin;

    const { data: insight, error } = await supabase
      .from('ai_phill_insights')
      .update({
        review_status: status,
        reviewed_at: reviewedAt || new Date().toISOString(),
      })
      .eq('id', insightId)
      .select()
      .single();

    if (error) {
      console.error('[AiPhillAdvisor] Review insight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: insight as AiPhillInsight };
  } catch (err) {
    console.error('[AiPhillAdvisor] Review insight exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error reviewing insight',
    };
  }
}

/**
 * Acknowledge an insight (mark as seen)
 *
 * @param insightId - UUID of the insight
 * @returns Updated insight
 */
export async function acknowledgeInsight(
  insightId: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  return reviewInsight(insightId, 'acknowledged');
}

/**
 * Mark an insight as actioned
 *
 * @param insightId - UUID of the insight
 * @returns Updated insight
 */
export async function actionInsight(
  insightId: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  return reviewInsight(insightId, 'actioned');
}

/**
 * Dismiss an insight
 *
 * @param insightId - UUID of the insight
 * @returns Updated insight
 */
export async function dismissInsight(
  insightId: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  return reviewInsight(insightId, 'dismissed');
}

/**
 * Defer an insight for later review
 *
 * @param insightId - UUID of the insight
 * @returns Updated insight
 */
export async function deferInsight(
  insightId: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  return reviewInsight(insightId, 'deferred');
}

/**
 * Get pending insights count for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @returns Count of pending insights
 */
export async function getPendingInsightsCount(
  ownerUserId: string
): Promise<AiPhillServiceResult<number>> {
  try {
    const supabase = supabaseAdmin;

    const { count, error } = await supabase
      .from('ai_phill_insights')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .eq('review_status', 'pending');

    if (error) {
      console.error('[AiPhillAdvisor] Get pending count error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: count || 0 };
  } catch (err) {
    console.error('[AiPhillAdvisor] Get pending count exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error counting pending insights',
    };
  }
}

/**
 * Get insights summary by category
 *
 * @param ownerUserId - UUID of the founder user
 * @returns Summary of insights by category
 */
export async function getInsightsSummary(
  ownerUserId: string
): Promise<AiPhillServiceResult<Record<string, { total: number; pending: number }>>> {
  try {
    const supabase = supabaseAdmin;

    const { data: insights, error } = await supabase
      .from('ai_phill_insights')
      .select('category, review_status')
      .eq('owner_user_id', ownerUserId);

    if (error) {
      console.error('[AiPhillAdvisor] Get insights summary error:', error);
      return { success: false, error: error.message };
    }

    const summary: Record<string, { total: number; pending: number }> = {};

    for (const insight of insights || []) {
      const cat = insight.category;
      if (!summary[cat]) {
        summary[cat] = { total: 0, pending: 0 };
      }
      summary[cat].total++;
      if (insight.review_status === 'pending') {
        summary[cat].pending++;
      }
    }

    return { success: true, data: summary };
  } catch (err) {
    console.error('[AiPhillAdvisor] Get insights summary exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching insights summary',
    };
  }
}

/**
 * Delete an insight
 *
 * @param insightId - UUID of the insight
 * @returns Success/failure result
 */
export async function deleteInsight(
  insightId: string
): Promise<AiPhillServiceResult<void>> {
  try {
    const supabase = supabaseAdmin;

    const { error } = await supabase.from('ai_phill_insights').delete().eq('id', insightId);

    if (error) {
      console.error('[AiPhillAdvisor] Delete insight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[AiPhillAdvisor] Delete insight exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error deleting insight',
    };
  }
}

/**
 * Create a manual insight (not AI-generated)
 *
 * @param ownerUserId - UUID of the founder user
 * @param title - Insight title
 * @param bodyMd - Insight body in Markdown
 * @param priority - Priority level
 * @param category - Insight category
 * @param businessId - Optional related business ID
 * @returns Created insight
 */
export async function createManualInsight(
  ownerUserId: string,
  title: string,
  bodyMd: string,
  priority: InsightPriority,
  category: InsightCategory,
  businessId?: string
): Promise<AiPhillServiceResult<AiPhillInsight>> {
  try {
    const supabase = supabaseAdmin;

    const { data: insight, error } = await supabase
      .from('ai_phill_insights')
      .insert({
        owner_user_id: ownerUserId,
        related_business_id: businessId || null,
        scope: businessId ? 'business' : 'portfolio',
        scope_id: businessId || null,
        title,
        body_md: bodyMd,
        priority,
        category,
        recommended_actions: [],
        governance_mode: 'HUMAN_GOVERNED' as GovernanceMode,
        review_status: 'pending' as ReviewStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('[AiPhillAdvisor] Create manual insight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: insight as AiPhillInsight };
  } catch (err) {
    console.error('[AiPhillAdvisor] Create manual insight exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating manual insight',
    };
  }
}
