/**
 * Guardian Z10: Meta Governance AI Helper
 * Optional Claude Sonnet integration for Z-series rollout recommendations
 * Flag-gated, strictly advisory-only, no side effects
 */

import Anthropic from '@anthropic-ai/sdk';
import type { GuardianMetaStackReadiness } from './metaStackReadinessService';

// ===== TYPE DEFINITIONS =====

export interface GuardianMetaGovernanceContext {
  riskPosture: string;
  aiUsagePolicy: string;
  externalSharingPolicy: string;
  readiness: GuardianMetaStackReadiness;
  metaUsageSummary: {
    metaPagesVisitedLast30d: number;
    execReportsCreatedLast90d: number;
    adoptionScoreCore?: number;
  };
  timeframeLabel: string;
}

export interface GuardianMetaGovernanceAdvice {
  headline: string;
  recommendations: string[];
  cautions: string[];
}

// ===== LAZY ANTHROPIC CLIENT =====

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

/**
 * Get Anthropic client with TTL-based refresh
 */
function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    anthropicClient = new Anthropic({ apiKey });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// ===== AI GOVERNANCE ADVISOR =====

/**
 * Generate meta governance advice using Claude Sonnet
 * Analyzes Z-series readiness and provides rollout recommendations
 * Strictly advisory-only, no side effects
 */
export async function generateMetaGovernanceAdvice(
  ctx: GuardianMetaGovernanceContext
): Promise<GuardianMetaGovernanceAdvice> {
  const client = getAnthropicClient();

  // Build readiness summary for context
  const componentSummary = ctx.readiness.components
    .map((c) => `- ${c.label}: ${c.status}${c.notes ? ` (${c.notes})` : ''}`)
    .join('\n');

  const blockersText = ctx.readiness.blockers.length > 0
    ? `\n\nBlockers:\n${ctx.readiness.blockers.map((b) => `- ${b}`).join('\n')}`
    : '';

  const warningsText = ctx.readiness.warnings.length > 0
    ? `\n\nWarnings:\n${ctx.readiness.warnings.map((w) => `- ${w}`).join('\n')}`
    : '';

  const prompt = `You are a Guardian meta governance advisor. Analyze the following Z-series stack readiness and provide practical, actionable advice for rolling out Guardian features safely and effectively.

**Governance Profile:**
- Risk Posture: ${ctx.riskPosture}
- AI Usage Policy: ${ctx.aiUsagePolicy}
- External Sharing: ${ctx.externalSharingPolicy}

**Z-Series Stack Status:**
Overall Status: ${ctx.readiness.overallStatus.toUpperCase()}
Ready: ${ctx.readiness.readyCount}/${ctx.readiness.components.length} components

Components:
${componentSummary}
${blockersText}
${warningsText}

**Usage Summary (${ctx.timeframeLabel}):**
- Meta pages visited: ${ctx.metaUsageSummary.metaPagesVisitedLast30d}
- Executive reports created: ${ctx.metaUsageSummary.execReportsCreatedLast90d}
${ctx.metaUsageSummary.adoptionScoreCore !== undefined ? `- Core adoption score: ${ctx.metaUsageSummary.adoptionScoreCore}` : ''}

**CRITICAL GUIDELINES:**
1. This is ADVISORY ONLY. Do NOT promise outcomes or suggest automatic configuration.
2. Use ONLY aggregated meta scores, statuses, counts. NO PII, NO tenant identifiers.
3. Recommend which Z-series components to focus on next based on readiness gaps.
4. Suggest whether to keep AI helpers 'limited' vs 'advisory' based on risk posture.
5. Advise on preparing for exec/CS-facing use based on external sharing policy.
6. Keep recommendations concrete, actionable, and focused on next steps.

Provide your response as valid JSON only (no markdown, no explanation text):
{
  "headline": "Concise 1-sentence recommendation headline",
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3"
  ],
  "cautions": [
    "Important caution or limitation 1",
    "Important caution or limitation 2"
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!parsed.headline || !Array.isArray(parsed.recommendations) || !Array.isArray(parsed.cautions)) {
      throw new Error('Invalid AI response structure (missing headline, recommendations, or cautions)');
    }

    return {
      headline: String(parsed.headline).slice(0, 200), // Truncate to 200 chars
      recommendations: (parsed.recommendations as string[])
        .slice(0, 5) // Max 5 recommendations
        .map((r) => String(r).slice(0, 300)), // Truncate each to 300 chars
      cautions: (parsed.cautions as string[])
        .slice(0, 3) // Max 3 cautions
        .map((c) => String(c).slice(0, 300)), // Truncate each to 300 chars
    };
  } catch (error) {
    console.error('Failed to generate meta governance advice:', error);
    throw error;
  }
}

/**
 * Fallback advice when AI is disabled or errors occur
 */
export function getFallbackMetaGovernanceAdvice(
  riskPosture: string
): GuardianMetaGovernanceAdvice {
  const baseAdvice = {
    headline: 'Focus on core Z-series components for safe rollout',
    recommendations: [
      'Ensure Z01 (Readiness) is fully configured before enabling AI helpers',
      'Use limited AI usage policy initially, upgrade to advisory after validation',
      'Review Z04 (Executive) and Z05 (Adoption) regularly to track engagement',
    ],
    cautions: [
      'AI helpers are advisory-only and do not automatically configure Guardian',
      'Validate all AI-generated recommendations before implementation',
      'Regularly review audit logs for Z01-Z09 configuration changes',
    ],
  };

  if (riskPosture === 'conservative') {
    return {
      ...baseAdvice,
      recommendations: [
        'Start with Z01 (Readiness) and Z02 (Uplift) only',
        'Keep ai_usage_policy set to "limited" until 80%+ readiness',
        'Review all recommendations manually before implementation',
        'Establish governance review cadence (weekly) during rollout',
      ],
    };
  }

  if (riskPosture === 'experimental') {
    return {
      ...baseAdvice,
      recommendations: [
        'Enable advisory AI helpers to accelerate Z-series rollout',
        'Run A/B test on AI-generated recommendations vs manual',
        'Gather feedback from teams on AI suggestion quality',
        'Iterate on governance preferences based on learnings',
      ],
    };
  }

  return baseAdvice;
}
