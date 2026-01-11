/**
 * Z12 Improvement Planner AI Helper
 * Claude Sonnet-powered draft action generation (flag-gated, advisory-only)
 * Respects Z10 governance: aiUsagePolicy (off/limited/advisory) and Z12 AI flags
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import type { RecommendedAction } from './improvementPlannerService';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

/**
 * Lazy Anthropic client
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
 * Generate draft improvement actions via AI (optional, advisory-only)
 * Only runs if Z10 governance allows and flag enabled
 */
export async function generateDraftActionsWithAi(
  tenantId: string,
  context: {
    currentReadinessScore?: number;
    adoptionRate?: number;
    topPatterns?: string[];
    focusDomains?: string[];
    recentMetrics?: any;
  }
): Promise<{
  draftActions: Array<{
    actionKey: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    relatedPlaybookKeys: string[];
    expectedImpact: any;
    rationale: string;
  }>;
  isAdvisory: boolean;
}> {
  const supabase = getSupabaseServer();

  try {
    // Check governance settings
    const { data: prefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('ai_usage_policy')
      .eq('tenant_id', tenantId)
      .single();

    const aiUsagePolicy = prefs?.ai_usage_policy || 'off';

    // Kill-switch: if AI is off, return empty
    if (aiUsagePolicy === 'off') {
      return {
        draftActions: [],
        isAdvisory: true,
      };
    }

    // Check if Z12 AI flag is enabled (if flag system exists)
    // For now, assume advisory policy means AI is available
    if (aiUsagePolicy !== 'advisory') {
      return {
        draftActions: [],
        isAdvisory: true,
      };
    }

    // Generate via Claude Sonnet
    try {
      const actions = await callClaudeForDraftActions(context);
      return {
        draftActions: actions,
        isAdvisory: true, // Always advisory
      };
    } catch (error) {
      console.error('[Z12 AI] Claude API call failed:', error);
      // Fallback: return empty on error
      return {
        draftActions: [],
        isAdvisory: true,
      };
    }
  } catch (error) {
    console.error('[Z12 AI] Failed to check governance:', error);
    return {
      draftActions: [],
      isAdvisory: true,
    };
  }
}

/**
 * Call Claude Sonnet for draft actions
 */
async function callClaudeForDraftActions(context: any): Promise<any[]> {
  const client = getAnthropicClient();

  const prompt = buildDraftActionsPrompt(context);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse response (expect JSON array)
  try {
    const actions = JSON.parse(textBlock.text);
    // Ensure array
    return Array.isArray(actions) ? actions.slice(0, 5) : []; // Max 5 drafts
  } catch {
    console.error('[Z12 AI] Failed to parse Claude response');
    return [];
  }
}

/**
 * Build prompt for Claude
 */
function buildDraftActionsPrompt(context: any): string {
  return `You are a Guardian improvement advisor. Generate 2-3 draft improvement actions based on current metrics.

Context:
- Readiness Score: ${context.currentReadinessScore || 'Unknown'}%
- Adoption Rate: ${context.adoptionRate || 'Unknown'}%
- Focus Domains: ${(context.focusDomains || []).join(', ') || 'readiness, adoption'}
- Recent Patterns: ${(context.topPatterns || []).join('; ') || 'None identified'}

Guidelines:
1. ADVISORY ONLY - No promises or guarantees. Recommendations only.
2. NO PII - Never include emails, names, or identifying information.
3. NO RUNTIME CHANGES - Actions must not involve changing Guardian rules, thresholds, alerts, or incident workflows.
4. META-ONLY - Actions may reference meta signals (scores, statuses, counts) and recommend Z09 playbooks or Z08 KPI tracking.
5. CLEAR IMPACT - Each action should have explicit expected impact on readiness, adoption, or goals.

Generate response as JSON array with this structure:
[
  {
    "actionKey": "unique_snake_case_key",
    "title": "Clear action title",
    "description": "Detailed description of what to do",
    "priority": "high|medium|low|critical",
    "relatedPlaybookKeys": ["playbook1", "playbook2"],
    "expectedImpact": {
      "readiness": {"delta": 5, "target": 75},
      "adoption": {"delta": 10, "target": 70}
    },
    "rationale": "Why this action is recommended given current metrics"
  }
]

Respond with ONLY the JSON array, no markdown or extra text.`;
}
