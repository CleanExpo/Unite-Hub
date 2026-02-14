/**
 * Cognitive Twin Service
 *
 * Founder Cognitive Twin engine for domain-specific health scoring,
 * digest generation, and AI-assisted decision support.
 *
 * @module founderOS/cognitiveTwinService
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { listBusinesses, getBusiness, type FounderBusiness } from './founderBusinessRegistryService';
import { getSignals, type BusinessSignal } from './founderSignalInferenceService';
import { getRecentEntriesForContext } from './founderJournalService';
import { getInsights, type AiPhillInsight } from './aiPhillAdvisorService';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';

// ============================================================================
// Types
// ============================================================================

export type CognitiveDomain =
  | 'marketing'
  | 'sales'
  | 'delivery'
  | 'product'
  | 'clients'
  | 'engineering'
  | 'finance'
  | 'founder'
  | 'operations'
  | 'team'
  | 'legal'
  | 'compliance'
  | 'partnerships'
  | 'custom';

export type DigestType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'on_demand'
  | 'crisis'
  | 'milestone'
  | 'custom';

export type DecisionType =
  | 'strategic'
  | 'tactical'
  | 'operational'
  | 'financial'
  | 'hiring'
  | 'product'
  | 'pricing'
  | 'partnership'
  | 'investment'
  | 'expansion'
  | 'crisis'
  | 'pivot'
  | 'exit'
  | 'custom';

export interface Momentum {
  trend: 'improving' | 'stable' | 'declining';
  velocity: number; // -100 to +100
  key_drivers: string[];
  recent_changes: string[];
}

export interface DomainRisk {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'mitigated' | 'monitoring';
  description: string;
}

export interface DomainOpportunity {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'quick_win' | 'medium' | 'long_term';
  description: string;
}

export interface CognitiveTwinScore {
  id: string;
  owner_user_id: string;
  founder_business_id: string | null;
  domain: CognitiveDomain;
  momentum: Momentum;
  risks: DomainRisk[];
  opportunities: DomainOpportunity[];
  overall_health: number | null;
  created_at: string;
}

export interface ActionItem {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline?: string;
  owner?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CognitiveTwinDigest {
  id: string;
  owner_user_id: string;
  digest_type: DigestType;
  digest_md: string;
  key_metrics: Record<string, number | string>;
  action_items: ActionItem[];
  created_at: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  projected_outcome: string;
  confidence: number;
}

export interface DecisionScenario {
  title: string;
  context: string;
  constraints: string[];
  timeline?: string;
  budget?: string;
}

export interface CognitiveTwinDecision {
  id: string;
  owner_user_id: string;
  founder_business_id: string | null;
  decision_type: DecisionType;
  scenario: DecisionScenario;
  options: DecisionOption[];
  outcome: Record<string, unknown> | null;
  ai_recommendation: string | null;
  human_decision: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface CognitiveTwinServiceResult<T> {
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
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const DOMAIN_SIGNAL_MAPPING: Record<CognitiveDomain, string[]> = {
  marketing: ['marketing', 'seo', 'content', 'social'],
  sales: ['engagement', 'revenue', 'users'],
  delivery: ['performance', 'infrastructure'],
  product: ['performance', 'users', 'engagement'],
  clients: ['engagement', 'support'],
  engineering: ['infrastructure', 'performance'],
  finance: ['revenue'],
  founder: ['custom'],
  operations: ['infrastructure', 'performance'],
  team: ['custom'],
  legal: ['compliance'],
  compliance: ['compliance'],
  partnerships: ['custom'],
  custom: ['custom'],
};

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Compute domain health score using AI analysis
 *
 * @param ownerUserId - UUID of the founder user
 * @param domain - Business domain to score
 * @param businessId - Optional specific business ID
 * @returns Domain score with risks and opportunities
 */
export async function computeDomainScore(
  ownerUserId: string,
  domain: CognitiveDomain,
  businessId?: string
): Promise<CognitiveTwinServiceResult<CognitiveTwinScore>> {
  try {
    const anthropic = getAnthropicClient();
    const supabase = supabaseAdmin;

    // Get relevant signals
    let signals: BusinessSignal[] = [];
    let businessContext: FounderBusiness | null = null;

    if (businessId) {
      const businessResult = await getBusiness(businessId);
      if (businessResult.success) {
        businessContext = businessResult.data || null;
      }

      const signalFamilies = DOMAIN_SIGNAL_MAPPING[domain] || ['custom'];
      for (const family of signalFamilies) {
        const signalsResult = await getSignals(businessId, family as any, 50);
        if (signalsResult.success && signalsResult.data) {
          signals = [...signals, ...signalsResult.data];
        }
      }
    } else {
      // Portfolio-wide: aggregate from all businesses
      const businessesResult = await listBusinesses(ownerUserId);
      if (businessesResult.success && businessesResult.data) {
        for (const biz of businessesResult.data) {
          const signalFamilies = DOMAIN_SIGNAL_MAPPING[domain] || ['custom'];
          for (const family of signalFamilies) {
            const signalsResult = await getSignals(biz.id, family as any, 20);
            if (signalsResult.success && signalsResult.data) {
              signals = [...signals, ...signalsResult.data];
            }
          }
        }
      }
    }

    // Get recent journal entries for context
    const journalResult = await getRecentEntriesForContext(ownerUserId, 5);
    const journalContext = journalResult.success ? journalResult.data || [] : [];

    // Build AI prompt
    const systemPrompt = `You are the Cognitive Twin AI, providing domain-specific health analysis.
Analyze the ${domain} domain for a founder's business(es).
Be specific, actionable, and honest about uncertainties.`;

    const signalSummary = signals.slice(0, 50).map((s) => ({
      family: s.signal_family,
      key: s.signal_key,
      value: s.value_numeric ?? s.value_text,
      source: s.source,
    }));

    const userPrompt = `Analyze the ${domain.toUpperCase()} domain health:

${businessContext ? `BUSINESS: ${businessContext.display_name} (${businessContext.industry || 'Unknown industry'})` : 'PORTFOLIO-WIDE ANALYSIS'}

RELEVANT SIGNALS:
${JSON.stringify(signalSummary, null, 2)}

${journalContext.length > 0 ? `RECENT FOUNDER NOTES:\n${journalContext.join('\n---\n')}` : ''}

Generate a domain health assessment as JSON:
{
  "momentum": {
    "trend": "<improving|stable|declining>",
    "velocity": <-100 to +100>,
    "key_drivers": ["<driver 1>", "<driver 2>"],
    "recent_changes": ["<change 1>", "<change 2>"]
  },
  "risks": [
    {
      "id": "<unique_id>",
      "title": "<risk title>",
      "severity": "<critical|high|medium|low>",
      "status": "<active|mitigated|monitoring>",
      "description": "<brief description>"
    }
  ],
  "opportunities": [
    {
      "id": "<unique_id>",
      "title": "<opportunity title>",
      "impact": "<high|medium|low>",
      "effort": "<quick_win|medium|long_term>",
      "description": "<brief description>"
    }
  ],
  "overall_health": <0-100>
}

Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 3000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for 5 min (90% cost savings)
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Log cache performance
    const cacheStats = extractCacheStats(response, 'claude-opus-4-5-20251101');
    logCacheStats('CognitiveTwin:computeDomainScore', cacheStats);

    // Extract text content
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
        break;
      }
    }

    const parsedResponse = JSON.parse(responseText);

    // Store the score
    const { data: score, error } = await supabase
      .from('cognitive_twin_scores')
      .insert({
        owner_user_id: ownerUserId,
        founder_business_id: businessId || null,
        domain,
        momentum: parsedResponse.momentum,
        risks: parsedResponse.risks || [],
        opportunities: parsedResponse.opportunities || [],
        overall_health: parsedResponse.overall_health,
      })
      .select()
      .single();

    if (error) {
      console.error('[CognitiveTwin] Store score error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: score as CognitiveTwinScore };
  } catch (err) {
    console.error('[CognitiveTwin] Compute domain score error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error computing domain score',
    };
  }
}

/**
 * Generate a periodic digest (daily, weekly, monthly)
 *
 * @param ownerUserId - UUID of the founder user
 * @param digestType - Type of digest to generate
 * @returns Generated digest
 */
export async function generateDigest(
  ownerUserId: string,
  digestType: DigestType
): Promise<CognitiveTwinServiceResult<CognitiveTwinDigest>> {
  try {
    const anthropic = getAnthropicClient();
    const supabase = supabaseAdmin;

    // Get recent domain scores
    const { data: recentScores } = await supabase
      .from('cognitive_twin_scores')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get pending insights
    const insightsResult = await getInsights(ownerUserId, { reviewStatus: 'pending', limit: 10 });
    const pendingInsights = insightsResult.success ? insightsResult.data || [] : [];

    // Get businesses
    const businessesResult = await listBusinesses(ownerUserId);
    const businesses = businessesResult.success ? businessesResult.data || [] : [];

    // Get journal entries
    const journalResult = await getRecentEntriesForContext(ownerUserId, 5);
    const journalContext = journalResult.success ? journalResult.data || [] : [];

    // Determine time period based on digest type
    const timePeriod =
      digestType === 'daily'
        ? 'the past 24 hours'
        : digestType === 'weekly'
          ? 'the past week'
          : digestType === 'monthly'
            ? 'the past month'
            : 'the current period';

    const systemPrompt = `You are the Cognitive Twin AI, generating a ${digestType} briefing for a founder.
Create a concise, actionable digest that helps the founder start their ${digestType === 'daily' ? 'day' : 'period'} informed.`;

    const userPrompt = `Generate a ${digestType.toUpperCase()} digest for ${timePeriod}:

PORTFOLIO: ${businesses.length} businesses
${businesses.map((b) => `- ${b.display_name} (${b.code})`).join('\n')}

RECENT DOMAIN SCORES:
${JSON.stringify(
  (recentScores || []).slice(0, 10).map((s) => ({
    domain: s.domain,
    health: s.overall_health,
    trend: s.momentum?.trend,
  })),
  null,
  2
)}

PENDING INSIGHTS: ${pendingInsights.length}
${pendingInsights
  .slice(0, 5)
  .map((i) => `- [${i.priority}] ${i.title}`)
  .join('\n')}

${journalContext.length > 0 ? `RECENT NOTES:\n${journalContext.slice(0, 3).join('\n---\n')}` : ''}

Generate a digest as JSON:
{
  "digest_md": "<full digest in Markdown format, 2-4 paragraphs>",
  "key_metrics": {
    "portfolio_health": <0-100>,
    "pending_actions": <number>,
    "risks_active": <number>,
    "opportunities_identified": <number>
  },
  "action_items": [
    {
      "id": "<unique_id>",
      "action": "<specific action>",
      "priority": "<critical|high|medium|low>",
      "status": "pending"
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
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for 5 min (90% cost savings)
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Log cache performance
    const cacheStats = extractCacheStats(response, 'claude-opus-4-5-20251101');
    logCacheStats('CognitiveTwin:generateDigest', cacheStats);

    // Extract text content
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
        break;
      }
    }

    const parsedResponse = JSON.parse(responseText);

    // Store the digest
    const { data: digest, error } = await supabase
      .from('cognitive_twin_digests')
      .insert({
        owner_user_id: ownerUserId,
        digest_type: digestType,
        digest_md: parsedResponse.digest_md,
        key_metrics: parsedResponse.key_metrics || {},
        action_items: parsedResponse.action_items || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[CognitiveTwin] Store digest error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: digest as CognitiveTwinDigest };
  } catch (err) {
    console.error('[CognitiveTwin] Generate digest error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating digest',
    };
  }
}

/**
 * Simulate a decision scenario with AI analysis
 *
 * @param ownerUserId - UUID of the founder user
 * @param scenario - Decision scenario to analyze
 * @returns Decision analysis with options and recommendation
 */
export async function simulateDecision(
  ownerUserId: string,
  scenario: DecisionScenario & { decisionType: DecisionType; businessId?: string }
): Promise<CognitiveTwinServiceResult<CognitiveTwinDecision>> {
  try {
    const anthropic = getAnthropicClient();
    const supabase = supabaseAdmin;

    // Get business context if provided
    let businessContext: FounderBusiness | null = null;
    if (scenario.businessId) {
      const businessResult = await getBusiness(scenario.businessId);
      if (businessResult.success) {
        businessContext = businessResult.data || null;
      }
    }

    // Get relevant domain scores
    const { data: domainScores } = await supabase
      .from('cognitive_twin_scores')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    const systemPrompt = `You are the Cognitive Twin AI, providing decision support analysis.
Analyze the scenario and provide multiple options with honest assessments of pros, cons, and likely outcomes.
Be specific about uncertainties and assumptions.
This is ADVISORY ONLY - the founder will make the final decision.`;

    const userPrompt = `Analyze this decision scenario:

DECISION TYPE: ${scenario.decisionType}
${businessContext ? `BUSINESS: ${businessContext.display_name} (${businessContext.industry || 'Unknown'})` : ''}

SCENARIO:
Title: ${scenario.title}
Context: ${scenario.context}
Constraints: ${scenario.constraints.join(', ')}
${scenario.timeline ? `Timeline: ${scenario.timeline}` : ''}
${scenario.budget ? `Budget: ${scenario.budget}` : ''}

CURRENT BUSINESS HEALTH:
${JSON.stringify(
  (domainScores || []).slice(0, 5).map((s) => ({
    domain: s.domain,
    health: s.overall_health,
    risks: s.risks?.length || 0,
  })),
  null,
  2
)}

Generate decision analysis as JSON:
{
  "options": [
    {
      "id": "<unique_id>",
      "title": "<option title>",
      "description": "<detailed description>",
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"],
      "projected_outcome": "<what would likely happen>",
      "confidence": <0.0-1.0>
    }
  ],
  "ai_recommendation": "<clear recommendation with reasoning>"
}

Provide 2-4 distinct options. Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 6144,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for 5 min (90% cost savings)
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Log cache performance
    const cacheStats = extractCacheStats(response, 'claude-opus-4-5-20251101');
    logCacheStats('CognitiveTwin:simulateDecision', cacheStats);

    // Extract text content
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
        break;
      }
    }

    const parsedResponse = JSON.parse(responseText);

    // Store the decision
    const { data: decision, error } = await supabase
      .from('cognitive_twin_decisions')
      .insert({
        owner_user_id: ownerUserId,
        founder_business_id: scenario.businessId || null,
        decision_type: scenario.decisionType,
        scenario: {
          title: scenario.title,
          context: scenario.context,
          constraints: scenario.constraints,
          timeline: scenario.timeline,
          budget: scenario.budget,
        },
        options: parsedResponse.options || [],
        ai_recommendation: parsedResponse.ai_recommendation,
        outcome: null,
        human_decision: null,
        decided_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('[CognitiveTwin] Store decision error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: decision as CognitiveTwinDecision };
  } catch (err) {
    console.error('[CognitiveTwin] Simulate decision error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error simulating decision',
    };
  }
}

/**
 * Get domain scores for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @param domain - Optional domain filter
 * @param businessId - Optional business filter
 * @param limit - Maximum results
 * @returns List of domain scores
 */
export async function getDomainScores(
  ownerUserId: string,
  domain?: CognitiveDomain,
  businessId?: string,
  limit = 20
): Promise<CognitiveTwinServiceResult<CognitiveTwinScore[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('cognitive_twin_scores')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (domain) {
      query = query.eq('domain', domain);
    }
    if (businessId) {
      query = query.eq('founder_business_id', businessId);
    }

    const { data: scores, error } = await query;

    if (error) {
      console.error('[CognitiveTwin] Get domain scores error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (scores || []) as CognitiveTwinScore[] };
  } catch (err) {
    console.error('[CognitiveTwin] Get domain scores exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching domain scores',
    };
  }
}

/**
 * Get recent digests for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @param digestType - Optional type filter
 * @param limit - Maximum results
 * @returns List of digests
 */
export async function getDigests(
  ownerUserId: string,
  digestType?: DigestType,
  limit = 10
): Promise<CognitiveTwinServiceResult<CognitiveTwinDigest[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('cognitive_twin_digests')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (digestType) {
      query = query.eq('digest_type', digestType);
    }

    const { data: digests, error } = await query;

    if (error) {
      console.error('[CognitiveTwin] Get digests error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (digests || []) as CognitiveTwinDigest[] };
  } catch (err) {
    console.error('[CognitiveTwin] Get digests exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching digests',
    };
  }
}

/**
 * Get pending decisions for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @param limit - Maximum results
 * @returns List of pending decisions
 */
export async function getPendingDecisions(
  ownerUserId: string,
  limit = 10
): Promise<CognitiveTwinServiceResult<CognitiveTwinDecision[]>> {
  try {
    const supabase = supabaseAdmin;

    const { data: decisions, error } = await supabase
      .from('cognitive_twin_decisions')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .is('decided_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CognitiveTwin] Get pending decisions error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (decisions || []) as CognitiveTwinDecision[] };
  } catch (err) {
    console.error('[CognitiveTwin] Get pending decisions exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching pending decisions',
    };
  }
}

/**
 * Record a decision outcome
 *
 * @param decisionId - UUID of the decision
 * @param humanDecision - The decision made by the founder
 * @param outcome - Optional outcome data
 * @returns Updated decision
 */
export async function recordDecisionOutcome(
  decisionId: string,
  humanDecision: string,
  outcome?: Record<string, unknown>
): Promise<CognitiveTwinServiceResult<CognitiveTwinDecision>> {
  try {
    const supabase = supabaseAdmin;

    const { data: decision, error } = await supabase
      .from('cognitive_twin_decisions')
      .update({
        human_decision: humanDecision,
        outcome: outcome || null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) {
      console.error('[CognitiveTwin] Record decision outcome error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: decision as CognitiveTwinDecision };
  } catch (err) {
    console.error('[CognitiveTwin] Record decision outcome exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error recording decision outcome',
    };
  }
}

/**
 * Get portfolio health dashboard data
 *
 * @param ownerUserId - UUID of the founder user
 * @returns Dashboard data with latest scores per domain
 */
export async function getPortfolioHealthDashboard(
  ownerUserId: string
): Promise<CognitiveTwinServiceResult<Record<string, { health: number; trend: string; riskCount: number; opportunityCount: number }>>> {
  try {
    const supabase = supabaseAdmin;

    // Use the helper function if available, otherwise query directly
    const { data: scores, error } = await supabase
      .from('cognitive_twin_scores')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CognitiveTwin] Get portfolio health error:', error);
      return { success: false, error: error.message };
    }

    // Get latest score for each domain
    const latestByDomain: Record<string, CognitiveTwinScore> = {};
    for (const score of scores || []) {
      if (!latestByDomain[score.domain]) {
        latestByDomain[score.domain] = score;
      }
    }

    const dashboard: Record<string, { health: number; trend: string; riskCount: number; opportunityCount: number }> = {};
    for (const [domain, score] of Object.entries(latestByDomain)) {
      dashboard[domain] = {
        health: score.overall_health || 0,
        trend: score.momentum?.trend || 'stable',
        riskCount: Array.isArray(score.risks) ? score.risks.length : 0,
        opportunityCount: Array.isArray(score.opportunities) ? score.opportunities.length : 0,
      };
    }

    return { success: true, data: dashboard };
  } catch (err) {
    console.error('[CognitiveTwin] Get portfolio health dashboard exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching portfolio health',
    };
  }
}
