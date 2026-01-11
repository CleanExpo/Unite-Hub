/**
 * H01 AI Rule Suggestion Generator
 *
 * Uses Anthropic Claude to generate rule suggestions from PII-free signals.
 * Respects Z10 governance gating: if AI usage disabled, returns empty array.
 * All outputs are validated for prohibited fields before returning.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import type { RuleSuggestionSignals } from './ruleSuggestionSignals';
import { validateRuleDraft } from './heuristicRuleSuggester';

export interface AISuggestion {
  title: string;
  rationale: string;
  confidence: number;
  signals: Record<string, unknown>;
  ruleDraft: Record<string, unknown>;
  source: 'ai';
  safety: {
    promptRedacted: boolean;
    validationPassed: boolean;
    validationErrors: string[];
    prohibitedKeysFound: string[];
  };
}

// Lazy Anthropic client (same pattern as existing Guardian code)
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 1 minute

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Check if AI is allowed for this tenant (respects Z10 governance if present)
 */
export async function isAiAllowedForTenant(tenantId: string): Promise<boolean> {
  const supabase = getSupabaseServer();

  try {
    // Try to read Z10 governance preferences
    const { data: govPrefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('ai_usage_policy')
      .eq('tenant_id', tenantId)
      .single();

    if (govPrefs) {
      // Z10 governs AI usage
      return govPrefs.ai_usage_policy === 'on';
    }
  } catch (err) {
    // Z10 table doesn't exist yet, fall back to default
    console.warn('isAiAllowedForTenant: Z10 governance not available, defaulting to off');
  }

  // Default: AI disabled unless explicitly allowed
  return false;
}

/**
 * Generate AI-assisted rule suggestions from PII-free signals
 */
export async function generateAiSuggestions(
  tenantId: string,
  signals: RuleSuggestionSignals
): Promise<AISuggestion[]> {
  // Check governance gate
  const allowed = await isAiAllowedForTenant(tenantId);
  if (!allowed) {
    console.info('generateAiSuggestions: AI disabled for tenant', tenantId);
    return [];
  }

  try {
    const client = getAnthropicClient();

    // Build prompt with only PII-free signals
    const prompt = buildSuggestionPrompt(signals);

    // Call Claude Sonnet
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract and parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON array from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('generateAiSuggestions: No JSON array found in response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and transform suggestions
    const suggestions: AISuggestion[] = [];
    for (const item of parsed) {
      const validation = validateRuleDraft(item.rule_draft);
      const prohibitedKeys = findProhibitedKeys(item.rule_draft);

      if (validation.valid && prohibitedKeys.length === 0) {
        suggestions.push({
          title: item.title || 'Untitled suggestion',
          rationale: item.rationale || 'No explanation provided',
          confidence: Math.min(1, Math.max(0, item.confidence || 0.7)),
          signals: item.signals || signals,
          ruleDraft: item.rule_draft,
          source: 'ai',
          safety: {
            promptRedacted: true,
            validationPassed: true,
            validationErrors: [],
            prohibitedKeysFound: [],
          },
        });
      } else {
        // Log but skip invalid suggestions
        console.warn('generateAiSuggestions: Skipping invalid suggestion', {
          title: item.title,
          validationErrors: validation.errors,
          prohibitedKeys,
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('generateAiSuggestions: Error', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Build prompt with only PII-free signals
 */
function buildSuggestionPrompt(signals: RuleSuggestionSignals): string {
  return `You are an expert in alert rule engineering and system observability.

Given the following PII-free aggregate signals from a Guardian monitoring system, suggest 2-3 new alert rules that would improve detection and incident response.

Signals (aggregates only, no raw events or identifying data):
- Window: ${signals.window.hours} hours (${signals.window.startedAt} to ${signals.window.endedAt})
- Alert volume: ${signals.alertRates.count24h} in last 24h, avg ${signals.alertRates.avgPerHour24h.toFixed(1)}/hour
- Top alert sources: ${signals.topRules.slice(0, 3).map((r) => `${r.ruleKey} (${r.alertCount} alerts)`).join('; ')}
- Incidents created (24h): ${signals.incidentRates.createdCount24h}
- Correlation clusters: ${signals.correlationStats.clusterCount} clusters, avg size ${signals.correlationStats.avgClusterSize.toFixed(1)}
- Risk scores: max ${signals.riskSnapshot.maxScore}, avg ${signals.riskSnapshot.avgScore.toFixed(1)}
- Notification failures: ${signals.notificationFailureRates.failurePercent.toFixed(1)}% (${signals.notificationFailureRates.failureCount24h} failures)

For each suggestion:
1. Provide a clear title and rationale based on the signals.
2. Generate a rule_draft in the following Guardian rule schema:
{
  "name": "human-readable name",
  "type": "alert|suppression|correlation|threshold",
  "description": "explanation of what this rule does",
  "config": { /* type-specific config */ },
  "enabled": false  /* always false; never auto-enable */
}
3. Assign a confidence (0.0..1.0) based on signal strength.

CRITICAL CONSTRAINTS:
- Never include raw event payloads, email addresses, webhook URLs, API keys, tokens, or identifying data.
- Never suggest auto-enabling rules; always set "enabled": false.
- Suggestions must be compatible with existing rule creation APIs.
- Output ONLY a valid JSON array of suggestions, nothing else.

Example output format:
[
  {
    "title": "Suggestion title",
    "rationale": "Why this rule is needed based on signals",
    "confidence": 0.75,
    "signals": { "alertCount24h": 150, "avgPerHour": 6.25 },
    "rule_draft": { "name": "...", "type": "...", "description": "...", "config": {...}, "enabled": false }
  }
]

Now generate suggestions:`;
}

/**
 * Find prohibited keys in a rule draft
 */
function findProhibitedKeys(obj: unknown, path: string = ''): string[] {
  const prohibited = [
    'email',
    'phone',
    'webhook_url',
    'api_key',
    'secret',
    'token',
    'password',
    'raw_event',
    'payload_raw',
    'body_raw',
  ];

  const found: string[] = [];

  if (obj === null || obj === undefined) return found;

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const keyLower = key.toLowerCase();
      if (prohibited.some((p) => keyLower.includes(p))) {
        found.push(`${path}.${key}`);
      }
      found.push(...findProhibitedKeys((obj as Record<string, unknown>)[key], `${path}.${key}`));
    }
  }

  return found;
}
