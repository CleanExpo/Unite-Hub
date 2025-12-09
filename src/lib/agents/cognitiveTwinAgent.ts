/**
 * Cognitive Twin Agent
 *
 * Founder cognitive twin for domain-specific health scoring, periodic digests,
 * and AI-assisted decision simulation. Provides strategic oversight across
 * marketing, sales, delivery, finance, and other business domains.
 *
 * @module agents/cognitiveTwinAgent
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { db } from '@/lib/db';
import {
  scoreDomain,
  generateDigest,
  simulateDecision,
  getRecentScores,
  getRecentDigests,
  getDecisions,
  type CognitiveDomain,
  type DigestType,
  type DecisionType,
  type CognitiveTwinScore,
  type CognitiveTwinDigest,
  type CognitiveTwinDecision,
  type DecisionScenario,
  type DecisionOption,
} from '@/lib/founderOS/cognitiveTwinService';

// ============================================================================
// Types & Interfaces
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

export interface DomainHealthSnapshot {
  domain: CognitiveDomain;
  score: CognitiveTwinScore;
  trend: 'improving' | 'stable' | 'declining';
  topRisks: Array<{ severity: string; title: string }>;
  topOpportunities: Array<{ impact: string; title: string }>;
  keyMetrics: Record<string, number | string>;
}

export interface ComprehensiveDigest {
  digest: CognitiveTwinDigest;
  domainScores: DomainHealthSnapshot[];
  criticalActions: Array<{
    domain: CognitiveDomain;
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    deadline?: string;
  }>;
  executiveSummary: string;
}

export interface DecisionGuidance {
  decision: CognitiveTwinDecision;
  recommendedOption: DecisionOption;
  alternativeOptions: DecisionOption[];
  riskAnalysis: string;
  implementationPlan: string[];
}

// ============================================================================
// Agent Functions
// ============================================================================

/**
 * Score a specific business domain
 */
export async function scoreDomainHealth(
  ownerUserId: string,
  domain: CognitiveDomain,
  businessId?: string
): Promise<CognitiveTwinScore> {
  const score = await scoreDomain(ownerUserId, domain, businessId);

  await db.auditLogs.create({
    workspace_id: ownerUserId,
    action: 'domain_health_scored',
    details: {
      domain,
      businessId,
      overallHealth: score.overall_health,
      risksCount: score.risks.length,
      opportunitiesCount: score.opportunities.length,
    },
  });

  return score;
}

/**
 * Generate comprehensive domain health snapshot
 */
export async function getDomainSnapshot(
  ownerUserId: string,
  domain: CognitiveDomain,
  businessId?: string
): Promise<DomainHealthSnapshot> {
  const score = await scoreDomainHealth(ownerUserId, domain, businessId);

  // Get historical scores to determine trend
  const recentScores = await getRecentScores(ownerUserId, domain, 3);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentScores.length >= 2) {
    const current = score.overall_health || 0;
    const previous = recentScores[1].overall_health || 0;

    if (current > previous + 5) {
trend = 'improving';
} else if (current < previous - 5) {
trend = 'declining';
}
  }

  // Extract top risks and opportunities
  const topRisks = score.risks
    .filter((r) => r.status === 'active')
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, 3)
    .map((r) => ({ severity: r.severity, title: r.title }));

  const topOpportunities = score.opportunities
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    })
    .slice(0, 3)
    .map((o) => ({ impact: o.impact, title: o.title }));

  // Build key metrics
  const keyMetrics: Record<string, number | string> = {
    overall_health: score.overall_health || 0,
    momentum_velocity: score.momentum.velocity,
    momentum_trend: score.momentum.trend,
    active_risks: score.risks.filter((r) => r.status === 'active').length,
    total_opportunities: score.opportunities.length,
  };

  return {
    domain,
    score,
    trend,
    topRisks,
    topOpportunities,
    keyMetrics,
  };
}

/**
 * Generate periodic digest (daily, weekly, monthly, etc.)
 */
export async function generatePeriodicDigest(
  ownerUserId: string,
  digestType: DigestType,
  businessId?: string
): Promise<ComprehensiveDigest> {
  const digest = await generateDigest(ownerUserId, digestType, businessId);

  // Get domain scores for all key domains
  const keyDomains: CognitiveDomain[] = [
    'marketing',
    'sales',
    'delivery',
    'finance',
    'product',
  ];

  const domainScores: DomainHealthSnapshot[] = [];

  for (const domain of keyDomains) {
    try {
      const snapshot = await getDomainSnapshot(ownerUserId, domain, businessId);
      domainScores.push(snapshot);
    } catch (error) {
      console.error(`[CognitiveTwinAgent] Failed to score ${domain}:`, error);
    }
  }

  // Extract critical actions from digest
  const criticalActions = digest.action_items
    .filter((item) => item.priority === 'critical' || item.priority === 'high')
    .map((item) => ({
      domain: 'founder' as CognitiveDomain,
      action: item.action,
      priority: item.priority,
      deadline: item.deadline,
    }));

  // Generate executive summary using AI
  const systemPrompt = `You are an executive assistant. Create a concise executive summary (3-5 sentences) from a business digest.

Focus on:
- Overall business health
- Critical priorities
- Key opportunities
- Immediate actions needed`;

  const userPrompt = `Digest Type: ${digestType}
Domain Health Scores:
${domainScores
  .map((ds) => `- ${ds.domain}: ${ds.score.overall_health || 'N/A'}/100 (${ds.trend})`)
  .join('\n')}

Critical Actions: ${criticalActions.length}
Key Metrics: ${JSON.stringify(digest.key_metrics)}

Generate executive summary.`;

  let executiveSummary = 'Executive summary generation in progress.';

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    executiveSummary =
      result.data.content[0].type === 'text'
        ? result.data.content[0].text
        : executiveSummary;
  } catch (error) {
    console.error('[CognitiveTwinAgent] Summary generation error:', error);
  }

  await db.auditLogs.create({
    workspace_id: ownerUserId,
    action: 'digest_generated',
    details: {
      digestType,
      businessId,
      domainsScored: domainScores.length,
      criticalActionsCount: criticalActions.length,
    },
  });

  return {
    digest,
    domainScores,
    criticalActions,
    executiveSummary,
  };
}

/**
 * Simulate a decision and provide guidance
 */
export async function getDecisionGuidance(
  ownerUserId: string,
  decisionType: DecisionType,
  scenario: DecisionScenario,
  businessId?: string
): Promise<DecisionGuidance> {
  const decision = await simulateDecision(ownerUserId, decisionType, scenario, businessId);

  // Rank options by projected outcome and confidence
  const rankedOptions = [...decision.options].sort((a, b) => {
    // Prioritize by confidence first, then by pros/cons ratio
    const scoreA = a.confidence * (a.pros.length / Math.max(a.cons.length, 1));
    const scoreB = b.confidence * (b.pros.length / Math.max(b.cons.length, 1));
    return scoreB - scoreA;
  });

  const recommendedOption = rankedOptions[0];
  const alternativeOptions = rankedOptions.slice(1);

  // Generate risk analysis using AI
  const systemPrompt = `You are a strategic advisor. Analyze decision risks and provide implementation guidance.

Return ONLY valid JSON with this structure:
{
  "riskAnalysis": "<2-3 sentences analyzing key risks>",
  "implementationPlan": ["<step 1>", "<step 2>", "<step 3>"]
}`;

  const userPrompt = `Decision: ${scenario.title}
Context: ${scenario.context}
Constraints: ${scenario.constraints.join(', ')}

Recommended Option: ${recommendedOption.title}
Pros: ${recommendedOption.pros.join(', ')}
Cons: ${recommendedOption.cons.join(', ')}
Confidence: ${recommendedOption.confidence}%

Provide risk analysis and 3-5 step implementation plan.`;

  let riskAnalysis = 'Risk analysis in progress.';
  let implementationPlan: string[] = [];

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    const guidance = JSON.parse(cleanJson);
    riskAnalysis = guidance.riskAnalysis || riskAnalysis;
    implementationPlan = guidance.implementationPlan || [];
  } catch (error) {
    console.error('[CognitiveTwinAgent] Guidance generation error:', error);
    implementationPlan = [
      'Review decision constraints',
      'Assess resource availability',
      'Create detailed execution plan',
      'Monitor progress and adjust',
    ];
  }

  await db.auditLogs.create({
    workspace_id: ownerUserId,
    action: 'decision_simulated',
    details: {
      decisionType,
      businessId,
      optionsCount: decision.options.length,
      recommendedOption: recommendedOption.title,
    },
  });

  return {
    decision,
    recommendedOption,
    alternativeOptions,
    riskAnalysis,
    implementationPlan,
  };
}

/**
 * Record human decision outcome
 */
export async function recordDecisionOutcome(
  decisionId: string,
  ownerUserId: string,
  selectedOptionId: string,
  actualOutcome: Record<string, unknown>,
  notes?: string
): Promise<void> {
  const supabase = await (await import('@/lib/supabase')).getSupabaseServer();

  await supabase
    .from('cognitive_twin_decisions')
    .update({
      human_decision: selectedOptionId,
      outcome: actualOutcome,
      decided_at: new Date().toISOString(),
    })
    .eq('id', decisionId);

  await db.auditLogs.create({
    workspace_id: ownerUserId,
    action: 'decision_outcome_recorded',
    details: {
      decisionId,
      selectedOptionId,
      notes,
    },
  });
}

/**
 * Get recent domain scores
 */
export async function getRecentDomainScores(
  ownerUserId: string,
  domain: CognitiveDomain,
  limit = 10
): Promise<CognitiveTwinScore[]> {
  return await getRecentScores(ownerUserId, domain, limit);
}

/**
 * Get recent digests
 */
export async function getRecentPeriodicDigests(
  ownerUserId: string,
  digestType?: DigestType,
  limit = 10
): Promise<CognitiveTwinDigest[]> {
  return await getRecentDigests(ownerUserId, digestType, limit);
}

/**
 * Get decision history
 */
export async function getDecisionHistory(
  ownerUserId: string,
  decisionType?: DecisionType,
  limit = 20
): Promise<CognitiveTwinDecision[]> {
  return await getDecisions(ownerUserId, decisionType, limit);
}

/**
 * Generate comprehensive business health report
 */
export async function generateHealthReport(
  ownerUserId: string,
  businessId?: string
): Promise<{
  allDomains: DomainHealthSnapshot[];
  overallHealth: number;
  criticalIssues: number;
  topPriorities: string[];
  summary: string;
}> {
  const allDomains: CognitiveDomain[] = [
    'marketing',
    'sales',
    'delivery',
    'product',
    'clients',
    'engineering',
    'finance',
    'operations',
    'team',
  ];

  const domainSnapshots: DomainHealthSnapshot[] = [];
  let totalHealth = 0;
  let domainsScored = 0;
  let criticalIssues = 0;

  for (const domain of allDomains) {
    try {
      const snapshot = await getDomainSnapshot(ownerUserId, domain, businessId);
      domainSnapshots.push(snapshot);

      if (snapshot.score.overall_health) {
        totalHealth += snapshot.score.overall_health;
        domainsScored++;
      }

      criticalIssues += snapshot.score.risks.filter(
        (r) => r.severity === 'critical'
      ).length;
    } catch (error) {
      console.error(`[CognitiveTwinAgent] Failed to score ${domain}:`, error);
    }
  }

  const overallHealth = domainsScored > 0 ? Math.round(totalHealth / domainsScored) : 0;

  // Identify top priorities
  const topPriorities: string[] = [];

  // Critical risks across all domains
  for (const snapshot of domainSnapshots) {
    for (const risk of snapshot.topRisks) {
      if (risk.severity === 'critical') {
        topPriorities.push(`[${snapshot.domain}] ${risk.title}`);
      }
    }
  }

  // High-impact opportunities
  for (const snapshot of domainSnapshots) {
    for (const opp of snapshot.topOpportunities) {
      if (opp.impact === 'high' && topPriorities.length < 10) {
        topPriorities.push(`[${snapshot.domain}] ${opp.title}`);
      }
    }
  }

  // Generate summary
  const systemPrompt = `You are a business health analyst. Summarize overall business health in 4-6 sentences.

Focus on:
- Overall health score interpretation
- Critical issues and risks
- Key strengths and opportunities
- Strategic recommendations`;

  const userPrompt = `Overall Health: ${overallHealth}/100
Domains Scored: ${domainsScored}
Critical Issues: ${criticalIssues}

Domain Breakdown:
${domainSnapshots
  .map(
    (ds) =>
      `- ${ds.domain}: ${ds.score.overall_health || 'N/A'}/100 (${ds.trend}, ${ds.topRisks.length} risks, ${ds.topOpportunities.length} opportunities)`
  )
  .join('\n')}

Top Priorities:
${topPriorities.slice(0, 5).join('\n')}

Generate comprehensive health summary.`;

  let summary = 'Health report summary in progress.';

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    summary =
      result.data.content[0].type === 'text' ? result.data.content[0].text : summary;
  } catch (error) {
    console.error('[CognitiveTwinAgent] Summary generation error:', error);
  }

  await db.auditLogs.create({
    workspace_id: ownerUserId,
    action: 'health_report_generated',
    details: {
      businessId,
      domainsScored,
      overallHealth,
      criticalIssues,
    },
  });

  return {
    allDomains: domainSnapshots,
    overallHealth,
    criticalIssues,
    topPriorities: topPriorities.slice(0, 10),
    summary,
  };
}

// Export singleton instance
export const cognitiveTwinAgent = {
  scoreDomainHealth,
  getDomainSnapshot,
  generatePeriodicDigest,
  getDecisionGuidance,
  recordDecisionOutcome,
  getRecentDomainScores,
  getRecentPeriodicDigests,
  getDecisionHistory,
  generateHealthReport,
};
