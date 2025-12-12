/**
 * Z11 Export Narrative AI Helper
 * Generates Claude Sonnet executive summaries from bundle manifests
 * Strict guardrails: no PII, advisory-only, respects governance settings
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import type { GuardianExportBundleManifest } from './exportBundleService';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

/**
 * Lazy Anthropic client with TTL
 */
function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Context for AI narrative generation
 */
export interface GuardianExportNarrativeContext {
  bundleKey: string;
  timeframeLabel: string;
  readinessScore?: number;
  adoptionRate?: number;
  activePlansCount?: number;
  governanceRiskPosture?: 'conservative' | 'standard' | 'experimental';
  externalSharingPolicy?: 'internal_only' | 'cs_safe' | 'exec_ready';
}

/**
 * AI-generated narrative response
 */
export interface GuardianExportNarrative {
  headline: string;
  bullets: string[];
  nextSteps: string[];
  cautions?: string[];
}

/**
 * Generate executive summary narrative (Claude Sonnet powered)
 * Respects governance settings, especially externalSharingPolicy
 *
 * Policies:
 * - internal_only: Narrative redacted, basic placeholder
 * - cs_safe: Customer success friendly, safe for handoff
 * - exec_ready: Executive friendly, strategic focus
 */
export async function generateExportNarrative(
  tenantId: string,
  ctx: GuardianExportNarrativeContext
): Promise<GuardianExportNarrative> {
  const supabase = getSupabaseServer();

  // Check if AI is enabled for exports
  try {
    const { data: prefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('ai_usage_policy, external_sharing_policy')
      .eq('tenant_id', tenantId)
      .single();

    const aiUsagePolicy = prefs?.ai_usage_policy || 'off';
    const externalSharingPolicy = prefs?.external_sharing_policy || 'internal_only';

    // Kill-switch: if AI is off, return fallback
    if (aiUsagePolicy === 'off') {
      return getFallbackNarrative(ctx);
    }

    // If sharing policy is internal_only, don't generate AI narrative
    if (externalSharingPolicy === 'internal_only') {
      return getFallbackNarrative(ctx);
    }

    // Generate AI narrative
    try {
      const narrative = await callClaudeForNarrative(ctx, externalSharingPolicy);
      return narrative;
    } catch (error) {
      console.error('[Z11 Narrative] Claude API call failed:', error);
      // Fallback on error
      return getFallbackNarrative(ctx);
    }
  } catch (error) {
    console.error('[Z11 Narrative] Failed to check governance prefs:', error);
    // Fallback on error
    return getFallbackNarrative(ctx);
  }
}

/**
 * Call Claude Sonnet for narrative generation
 */
async function callClaudeForNarrative(
  ctx: GuardianExportNarrativeContext,
  sharingPolicy: 'cs_safe' | 'exec_ready'
): Promise<GuardianExportNarrative> {
  const client = getAnthropicClient();

  const prompt = buildNarrativePrompt(ctx, sharingPolicy);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse response (expect JSON)
  try {
    const parsed = JSON.parse(textBlock.text);
    return {
      headline: parsed.headline || 'Export Ready',
      bullets: parsed.bullets || [],
      nextSteps: parsed.nextSteps || [],
      cautions: parsed.cautions,
    };
  } catch {
    // Fallback if parsing fails
    return {
      headline: 'Export Ready',
      bullets: [textBlock.text.substring(0, 200)],
      nextSteps: [],
    };
  }
}

/**
 * Build prompt for Claude (strict guardrails)
 */
function buildNarrativePrompt(
  ctx: GuardianExportNarrativeContext,
  sharingPolicy: 'cs_safe' | 'exec_ready'
): string {
  const policyGuidance =
    sharingPolicy === 'cs_safe'
      ? 'Tailor for Customer Success teams (practical, handoff-focused).'
      : 'Tailor for executives (strategic, high-level insights).';

  return `You are an expert in business intelligence and Guardian meta insights. Generate a brief, professional executive summary for a Guardian bundle export.

Input:
- Bundle Type: ${ctx.bundleKey}
- Timeframe: ${ctx.timeframeLabel}
- Readiness Score: ${ctx.readinessScore !== undefined ? `${ctx.readinessScore}%` : 'Not available'}
- Adoption Rate: ${ctx.adoptionRate !== undefined ? `${ctx.adoptionRate}%` : 'Not available'}
- Active Plans: ${ctx.activePlansCount || 0}

Constraints:
1. NO PII - Never include emails, names, contact info, or system details
2. NO promises or commitments - Only descriptive, advisory language
3. CONCISE - Keep bullets to 2-3 sentences max
4. SAFE - Avoid technical jargon, assume non-technical audience
5. POLICY: ${policyGuidance}

Generate response as JSON with this exact structure:
{
  "headline": "One-line summary of readiness status",
  "bullets": ["Bullet 1 insight", "Bullet 2 insight", "Bullet 3 insight"],
  "nextSteps": ["Action 1 if applicable", "Action 2 if applicable"],
  "cautions": ["Any notable cautions or risks (optional)"]
}

Respond with ONLY the JSON, no markdown or extra text.`;
}

/**
 * Fallback narrative when AI is disabled or policy blocks generation
 */
function getFallbackNarrative(ctx: GuardianExportNarrativeContext): GuardianExportNarrative {
  const baseHeadline = `${ctx.bundleKey.replace(/_/g, ' ').toUpperCase()} - ${ctx.timeframeLabel}`;

  return {
    headline: baseHeadline,
    bullets: [
      `Readiness Score: ${ctx.readinessScore !== undefined ? `${ctx.readinessScore}%` : 'Not available'}`,
      `Active Plans: ${ctx.activePlansCount || 0}`,
      'AI-assisted narrative disabled per governance settings',
    ],
    nextSteps: ['Review manifest items for detailed breakdown', 'Consult documentation for scope definitions'],
    cautions: ['AI narratives are advisory only - confirm all insights independently'],
  };
}
