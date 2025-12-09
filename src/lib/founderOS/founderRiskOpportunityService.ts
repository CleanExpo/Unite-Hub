/**
 * Founder Risk & Opportunity Service
 *
 * Derives risk/opportunity insights from business signals.
 * Calculates business health scores and pushes insights to AI Phill.
 *
 * @module founderOS/founderRiskOpportunityService
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSignals, getSignalSummary, type BusinessSignal } from './founderSignalInferenceService';
import { getBusiness, type FounderBusiness } from './founderBusinessRegistryService';

// ============================================================================
// Types
// ============================================================================

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type OpportunityImpact = 'high' | 'medium' | 'low';

export interface IdentifiedRisk {
  id: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  mitigation: string;
  signal_keys: string[];
  confidence: number;
}

export interface IdentifiedOpportunity {
  id: string;
  title: string;
  potential_impact: OpportunityImpact;
  description: string;
  recommended_action: string;
  signal_keys: string[];
  confidence: number;
}

export interface RiskAnalysisResult {
  risks: IdentifiedRisk[];
  total_risk_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface OpportunityAnalysisResult {
  opportunities: IdentifiedOpportunity[];
  total_opportunity_score: number;
  high_impact_count: number;
  medium_impact_count: number;
  low_impact_count: number;
}

export interface BusinessHealthScore {
  overall_score: number;
  component_scores: {
    seo_health: number;
    content_health: number;
    engagement_health: number;
    marketing_health: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  risk_factor: number;
  opportunity_factor: number;
  last_updated: string;
}

export interface RiskOpportunityServiceResult<T> {
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

function calculateComponentHealth(signals: BusinessSignal[], family: string): number {
  const familySignals = signals.filter((s) => s.signal_family === family);
  if (familySignals.length === 0) {
return 50;
} // Default neutral score

  // Get score-type signals
  const scoreSignals = familySignals.filter(
    (s) =>
      s.signal_key.includes('score') ||
      s.signal_key.includes('rate') ||
      s.signal_key.includes('health')
  );

  if (scoreSignals.length === 0) {
return 50;
}

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;

  for (const signal of scoreSignals) {
    const value = signal.value_numeric;
    if (value !== null) {
      // Normalize to 0-100 scale (assume rates are percentages, scores are 0-100)
      let normalizedValue = value;
      if (signal.signal_key.includes('rate') && value <= 1) {
        normalizedValue = value * 100;
      }
      // Cap at 100
      normalizedValue = Math.min(100, Math.max(0, normalizedValue));

      // Weight recent signals more heavily
      const age = Date.now() - new Date(signal.observed_at).getTime();
      const ageInDays = age / (1000 * 60 * 60 * 24);
      const weight = Math.max(0.1, 1 - ageInDays / 30); // Decay over 30 days

      weightedSum += normalizedValue * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}

function detectTrend(signals: BusinessSignal[]): 'improving' | 'stable' | 'declining' {
  // Look at score signals over time
  const scoreSignals = signals
    .filter((s) => s.signal_key.includes('score') && s.value_numeric !== null)
    .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime());

  if (scoreSignals.length < 2) {
return 'stable';
}

  // Compare recent vs older signals
  const midpoint = Math.floor(scoreSignals.length / 2);
  const olderAvg =
    scoreSignals.slice(0, midpoint).reduce((sum, s) => sum + (s.value_numeric || 0), 0) / midpoint;
  const recentAvg =
    scoreSignals.slice(midpoint).reduce((sum, s) => sum + (s.value_numeric || 0), 0) /
    (scoreSignals.length - midpoint);

  const change = recentAvg - olderAvg;
  const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0;

  if (changePercent > 5) {
return 'improving';
}
  if (changePercent < -5) {
return 'declining';
}
  return 'stable';
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Analyze risks from business signals using AI
 *
 * @param businessId - UUID of the founder business
 * @returns Risk analysis result
 */
export async function analyzeRisks(
  businessId: string
): Promise<RiskOpportunityServiceResult<RiskAnalysisResult>> {
  try {
    const anthropic = getAnthropicClient();

    // Get business and signals
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success || !businessResult.data) {
      return { success: false, error: businessResult.error || 'Business not found' };
    }

    const signalsResult = await getSignals(businessId);
    if (!signalsResult.success || !signalsResult.data) {
      return { success: false, error: signalsResult.error || 'Failed to fetch signals' };
    }

    const business = businessResult.data;
    const signals = signalsResult.data;

    // Build signal summary for AI
    const signalSummary = signals.slice(0, 100).map((s) => ({
      family: s.signal_family,
      key: s.signal_key,
      value: s.value_numeric ?? s.value_text,
      source: s.source,
    }));

    const systemPrompt = `You are AI Phill, a business risk analyst operating in HUMAN_GOVERNED mode.
Analyze business signals to identify potential risks.
Be specific and actionable. Focus on risks that can be mitigated.`;

    const userPrompt = `Analyze these business signals for risks:

BUSINESS: ${business.display_name} (${business.industry || 'Unknown industry'})
DOMAIN: ${business.primary_domain || 'Not specified'}

SIGNALS:
${JSON.stringify(signalSummary, null, 2)}

Identify potential business risks based on the signal data. Return JSON:
{
  "risks": [
    {
      "id": "<unique_id>",
      "title": "<short risk title>",
      "severity": "<critical|high|medium|low>",
      "description": "<detailed description>",
      "mitigation": "<recommended mitigation>",
      "signal_keys": ["<relevant signal keys>"],
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
        budget_tokens: 3000,
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
    const risks = (parsedResponse.risks || []).map((r: IdentifiedRisk) => ({
      ...r,
      id: r.id || generateId('risk'),
    }));

    // Calculate counts
    const result: RiskAnalysisResult = {
      risks,
      total_risk_score: calculateRiskScore(risks),
      critical_count: risks.filter((r: IdentifiedRisk) => r.severity === 'critical').length,
      high_count: risks.filter((r: IdentifiedRisk) => r.severity === 'high').length,
      medium_count: risks.filter((r: IdentifiedRisk) => r.severity === 'medium').length,
      low_count: risks.filter((r: IdentifiedRisk) => r.severity === 'low').length,
    };

    // Push risks as AI Phill insights
    await pushRisksAsInsights(business.owner_user_id, businessId, risks);

    return { success: true, data: result };
  } catch (err) {
    console.error('[RiskOpportunity] Analyze risks error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error analyzing risks',
    };
  }
}

/**
 * Analyze opportunities from business signals and gaps
 *
 * @param businessId - UUID of the founder business
 * @returns Opportunity analysis result
 */
export async function analyzeOpportunities(
  businessId: string
): Promise<RiskOpportunityServiceResult<OpportunityAnalysisResult>> {
  try {
    const anthropic = getAnthropicClient();

    // Get business and signals
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success || !businessResult.data) {
      return { success: false, error: businessResult.error || 'Business not found' };
    }

    const signalsResult = await getSignals(businessId);
    if (!signalsResult.success || !signalsResult.data) {
      return { success: false, error: signalsResult.error || 'Failed to fetch signals' };
    }

    const business = businessResult.data;
    const signals = signalsResult.data;

    // Build signal summary
    const signalSummary = signals.slice(0, 100).map((s) => ({
      family: s.signal_family,
      key: s.signal_key,
      value: s.value_numeric ?? s.value_text,
      source: s.source,
    }));

    // Also fetch competitor gaps if available
    const supabase = supabaseAdmin;
    const { data: competitorGaps } = await supabase
      .from('competitor_gaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    const systemPrompt = `You are AI Phill, a business opportunity analyst operating in HUMAN_GOVERNED mode.
Analyze business signals and gaps to identify growth opportunities.
Be specific and actionable. Focus on opportunities with clear ROI potential.`;

    const userPrompt = `Analyze these business signals for opportunities:

BUSINESS: ${business.display_name} (${business.industry || 'Unknown industry'})
DOMAIN: ${business.primary_domain || 'Not specified'}

SIGNALS:
${JSON.stringify(signalSummary, null, 2)}

${competitorGaps?.length ? `COMPETITOR GAPS:\n${JSON.stringify(competitorGaps[0], null, 2)}` : ''}

Identify growth opportunities based on the data. Return JSON:
{
  "opportunities": [
    {
      "id": "<unique_id>",
      "title": "<opportunity title>",
      "potential_impact": "<high|medium|low>",
      "description": "<detailed description>",
      "recommended_action": "<specific action to take>",
      "signal_keys": ["<relevant signal keys>"],
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
        budget_tokens: 3000,
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
    const opportunities = (parsedResponse.opportunities || []).map((o: IdentifiedOpportunity) => ({
      ...o,
      id: o.id || generateId('opp'),
    }));

    // Calculate counts
    const result: OpportunityAnalysisResult = {
      opportunities,
      total_opportunity_score: calculateOpportunityScore(opportunities),
      high_impact_count: opportunities.filter((o: IdentifiedOpportunity) => o.potential_impact === 'high').length,
      medium_impact_count: opportunities.filter((o: IdentifiedOpportunity) => o.potential_impact === 'medium').length,
      low_impact_count: opportunities.filter((o: IdentifiedOpportunity) => o.potential_impact === 'low').length,
    };

    // Push opportunities as AI Phill insights
    await pushOpportunitiesAsInsights(business.owner_user_id, businessId, opportunities);

    return { success: true, data: result };
  } catch (err) {
    console.error('[RiskOpportunity] Analyze opportunities error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error analyzing opportunities',
    };
  }
}

/**
 * Calculate composite business health score (0-100)
 *
 * @param businessId - UUID of the founder business
 * @returns Business health score
 */
export async function getBusinessHealthScore(
  businessId: string
): Promise<RiskOpportunityServiceResult<BusinessHealthScore>> {
  try {
    // Get signals
    const signalsResult = await getSignals(businessId, undefined, 200);
    if (!signalsResult.success || !signalsResult.data) {
      return { success: false, error: signalsResult.error || 'Failed to fetch signals' };
    }

    const signals = signalsResult.data;

    // Calculate component scores
    const seoHealth = calculateComponentHealth(signals, 'seo');
    const contentHealth = calculateComponentHealth(signals, 'content');
    const engagementHealth = calculateComponentHealth(signals, 'engagement');
    const marketingHealth = calculateComponentHealth(signals, 'marketing');

    // Detect trend
    const trend = detectTrend(signals);

    // Get risk analysis for risk factor
    const riskResult = await analyzeRisks(businessId);
    const riskFactor = riskResult.success && riskResult.data
      ? Math.min(100, riskResult.data.total_risk_score)
      : 0;

    // Get opportunity analysis for opportunity factor
    const opportunityResult = await analyzeOpportunities(businessId);
    const opportunityFactor = opportunityResult.success && opportunityResult.data
      ? Math.min(100, opportunityResult.data.total_opportunity_score)
      : 0;

    // Calculate overall score (weighted average with risk/opportunity adjustments)
    const baseScore =
      seoHealth * 0.25 + contentHealth * 0.25 + engagementHealth * 0.25 + marketingHealth * 0.25;

    // Risk penalty (up to -30 points)
    const riskPenalty = (riskFactor / 100) * 30;

    // Opportunity bonus (up to +10 points)
    const opportunityBonus = (opportunityFactor / 100) * 10;

    const overallScore = Math.round(
      Math.max(0, Math.min(100, baseScore - riskPenalty + opportunityBonus))
    );

    const healthScore: BusinessHealthScore = {
      overall_score: overallScore,
      component_scores: {
        seo_health: seoHealth,
        content_health: contentHealth,
        engagement_health: engagementHealth,
        marketing_health: marketingHealth,
      },
      trend,
      risk_factor: Math.round(riskFactor),
      opportunity_factor: Math.round(opportunityFactor),
      last_updated: new Date().toISOString(),
    };

    return { success: true, data: healthScore };
  } catch (err) {
    console.error('[RiskOpportunity] Get health score error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error calculating health score',
    };
  }
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

function calculateRiskScore(risks: IdentifiedRisk[]): number {
  let score = 0;
  for (const risk of risks) {
    const severityWeight =
      risk.severity === 'critical'
        ? 40
        : risk.severity === 'high'
          ? 25
          : risk.severity === 'medium'
            ? 15
            : 5;
    score += severityWeight * risk.confidence;
  }
  return Math.min(100, score);
}

function calculateOpportunityScore(opportunities: IdentifiedOpportunity[]): number {
  let score = 0;
  for (const opp of opportunities) {
    const impactWeight =
      opp.potential_impact === 'high' ? 35 : opp.potential_impact === 'medium' ? 20 : 10;
    score += impactWeight * opp.confidence;
  }
  return Math.min(100, score);
}

async function pushRisksAsInsights(
  ownerUserId: string,
  businessId: string,
  risks: IdentifiedRisk[]
): Promise<void> {
  const supabase = supabaseAdmin;

  for (const risk of risks) {
    await supabase.from('ai_phill_insights').insert({
      owner_user_id: ownerUserId,
      related_business_id: businessId,
      scope: 'business',
      scope_id: businessId,
      title: risk.title,
      body_md: `## Risk Description\n\n${risk.description}\n\n## Recommended Mitigation\n\n${risk.mitigation}`,
      priority: risk.severity,
      category: 'risk',
      recommended_actions: [
        {
          action: risk.mitigation,
          priority: risk.severity,
          confidence: risk.confidence,
        },
      ],
      governance_mode: 'HUMAN_GOVERNED',
      review_status: 'pending',
    });
  }
}

async function pushOpportunitiesAsInsights(
  ownerUserId: string,
  businessId: string,
  opportunities: IdentifiedOpportunity[]
): Promise<void> {
  const supabase = supabaseAdmin;

  for (const opp of opportunities) {
    const priority =
      opp.potential_impact === 'high' ? 'high' : opp.potential_impact === 'medium' ? 'medium' : 'low';

    await supabase.from('ai_phill_insights').insert({
      owner_user_id: ownerUserId,
      related_business_id: businessId,
      scope: 'business',
      scope_id: businessId,
      title: opp.title,
      body_md: `## Opportunity Description\n\n${opp.description}\n\n## Recommended Action\n\n${opp.recommended_action}`,
      priority,
      category: 'opportunity',
      recommended_actions: [
        {
          action: opp.recommended_action,
          impact: opp.potential_impact,
          confidence: opp.confidence,
        },
      ],
      governance_mode: 'HUMAN_GOVERNED',
      review_status: 'pending',
    });
  }
}
