/**
 * Guardian Z14: Status Narrative AI Helper
 * Generates executive-friendly narrative summaries from status snapshots
 * Uses Claude Sonnet with governance gating
 */

import Anthropic from '@anthropic-ai/sdk';
import { StatusPageView, CardStatus } from './statusPageService';
import { loadMetaGovernancePrefsForTenant } from './metaGovernanceService';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Generate AI narrative for status view (governance-gated)
 * Returns fallback narrative if AI disabled
 */
export async function generateStatusNarrative(
  tenantId: string,
  statusView: StatusPageView,
  options?: {
    maxTokens?: number;
    fallbackNarrative?: string;
  }
): Promise<{
  narrative: string;
  source: 'ai' | 'fallback';
  warnings?: string[];
}> {
  try {
    // Check governance: AI usage policy
    const prefs = await loadMetaGovernancePrefsForTenant(tenantId);

    if (prefs?.aiUsagePolicy === 'off') {
      return {
        narrative: options?.fallbackNarrative || buildFallbackNarrative(statusView),
        source: 'fallback',
        warnings: ['AI disabled by governance policy'],
      };
    }

    // Build prompt
    const prompt = buildNarrativePrompt(statusView);

    // Call Claude Sonnet
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options?.maxTokens || 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: `You are an executive briefing assistant for a meta-governance system. Your role is to synthesize technical metrics into clear, concise narratives suitable for leadership.

Guidelines:
- Be concise (2-3 sentences max)
- Focus on business impact over technical detail
- Highlight critical blockers and trends
- Use neutral, professional tone
- Never speculate beyond provided data
- Never mention specific names, emails, or identifiers

Always respond with pure narrative text (no bullets, no headers).`,
    });

    const narrative = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim();

    if (!narrative) {
      return {
        narrative: options?.fallbackNarrative || buildFallbackNarrative(statusView),
        source: 'fallback',
        warnings: ['AI returned empty response'],
      };
    }

    return {
      narrative,
      source: 'ai',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Z14 Narrative AI] Error generating narrative:', error);

    return {
      narrative: options?.fallbackNarrative || buildFallbackNarrative(statusView),
      source: 'fallback',
      warnings: [`AI generation failed: ${errorMsg}`],
    };
  }
}

/**
 * Build prompt for narrative generation
 */
function buildNarrativePrompt(view: StatusPageView): string {
  const overallStatus = view.overallStatus.replace(/_/g, ' ').toUpperCase();
  const cardSummary = view.cards
    .map((c) => `- ${c.title}: ${c.status.toUpperCase()}${c.value ? ` (${c.value})` : ''}`)
    .join('\n');

  const blockersSummary = view.blockers && view.blockers.length > 0 ? `\nBlockers:\n${view.blockers.map((b) => `- ${b}`).join('\n')}` : '';

  const warningsSummary = view.warnings && view.warnings.length > 0 ? `\nWarnings:\n${view.warnings.map((w) => `- ${w}`).join('\n')}` : '';

  return `Generate a 2-3 sentence executive narrative for the following status snapshot:

Overall Status: ${overallStatus}
Period: ${view.periodLabel.replace(/_/g, ' ')}

Status Cards:
${cardSummary}
${blockersSummary}${warningsSummary}

Write a narrative that summarizes the key insights and concerns.`;
}

/**
 * Build fallback narrative when AI is disabled or fails
 */
function buildFallbackNarrative(view: StatusPageView): string {
  const scoreCount = view.cards.filter((c) => c.status === 'good').length;
  const concernCount = view.cards.filter((c) => c.status === 'warn' || c.status === 'bad').length;
  const total = view.cards.length;

  let narrative = '';

  if (view.blockers && view.blockers.length > 0) {
    narrative = `${view.cards[0]?.title || 'System'} has ${view.blockers.length} critical blocker(s) that require immediate attention. `;
  }

  if (scoreCount === total) {
    narrative += 'All system areas are performing well.';
  } else if (concernCount === 0) {
    narrative += 'System is operating within normal parameters with minor items to monitor.';
  } else {
    const concernPercentage = Math.round((concernCount / total) * 100);
    narrative += `${concernPercentage}% of system areas require attention. Recommend prioritizing ${view.blockers?.[0] || 'identified issues'}.`;
  }

  return narrative.trim();
}

/**
 * Format narrative for display
 */
export function formatNarrativeDisplay(result: {
  narrative: string;
  source: 'ai' | 'fallback';
  warnings?: string[];
}): string {
  let display = result.narrative;

  if (result.source === 'fallback') {
    display += '\n\n_[Generated with fallback logic]_';
  }

  if (result.warnings && result.warnings.length > 0) {
    display += `\n\n_Warnings: ${result.warnings.join('; ')}_`;
  }

  return display;
}
