import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Rule Assistant (H01 + H05 Governance)
 *
 * Uses Anthropic Claude Sonnet 4.5 to generate rule suggestions, thresholds, and notification templates.
 * Reuses existing Anthropic client from lib/claude/client.ts (lazy singleton pattern).
 *
 * Design Principles:
 * - Privacy-friendly: No sensitive data in prompts
 * - Minimal telemetry: Only tokens, latency, status (no prompts/responses stored)
 * - Type-safe: Validated JSON responses
 * - Graceful degradation: Returns structured errors if AI unavailable
 * - Governed: Checks feature toggles and quotas (H05)
 */

export interface GuardianRuleCondition {
  field?: string;
  metric?: string;
  op: 'equals' | 'greater_than' | 'less_than' | 'exists';
  value?: unknown;
}

export interface GuardianThresholdHint {
  metric: string;
  suggestedValue: number | string;
  rationale: string;
}

export interface GuardianRuleSuggestionInput {
  tenantId: string;
  userId?: string | null;
  ruleId?: string | null;
  ruleName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'telemetry' | 'warehouse' | 'replay' | 'scenarios' | 'guardian';
  channel?: 'email' | 'slack' | 'webhook' | 'in_app';
  existingConditions?: unknown;
  existingDescription?: string;
  contextMeta?: Record<string, unknown>;
}

export interface GuardianRuleSuggestionOutput {
  suggestedConditions: GuardianRuleCondition[];
  suggestedThresholds?: GuardianThresholdHint[];
  suggestedNotificationTemplate?: string;
  explanationSummary?: string;
}

/**
 * Generate AI-assisted rule suggestions using Claude Sonnet 4.5
 *
 * @param input - Rule draft parameters
 * @returns Structured suggestions or throws error
 */
export async function generateRuleSuggestions(
  input: GuardianRuleSuggestionInput
): Promise<GuardianRuleSuggestionOutput> {
  const startTime = Date.now();

  try {
    // H05: Check if rule assistant feature is enabled
    await assertAiFeatureEnabled(input.tenantId, 'rule_assistant');

    // H05: Check daily quota
    const quota = await checkDailyQuota(input.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }
    // Build AI prompt
    const prompt = buildRuleSuggestionPrompt(input);

    // Call Claude Sonnet 4.5 via existing client
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildSystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        temperature: 0.3, // Low temperature for structured suggestions
      }
    );

    // Parse and validate JSON response
    const response = parseJSONResponse<GuardianRuleSuggestionOutput>(message);

    // Validate response structure
    if (!response.suggestedConditions || !Array.isArray(response.suggestedConditions)) {
      throw new Error('Invalid AI response: missing suggestedConditions array');
    }

    const latency = Date.now() - startTime;

    // Log telemetry (privacy-friendly: no prompts/responses)
    await logAISuggestionTelemetry({
      tenantId: input.tenantId,
      userId: input.userId,
      ruleId: input.ruleId,
      action: 'suggest',
      model: 'claude-sonnet-4-5-20250929',
      promptTokens: message.usage.input_tokens,
      completionTokens: message.usage.output_tokens,
      latencyMs: latency,
      status: 'success',
    });

    console.log('[Guardian H01] AI suggestion generated:', {
      tenantId: input.tenantId,
      latencyMs: latency,
      conditionsCount: response.suggestedConditions.length,
    });

    return response;
  } catch (error) {
    const latency = Date.now() - startTime;

    // Log error telemetry
    await logAISuggestionTelemetry({
      tenantId: input.tenantId,
      userId: input.userId,
      ruleId: input.ruleId,
      action: 'suggest',
      model: 'claude-sonnet-4-5-20250929',
      latencyMs: latency,
      status: 'error',
    });

    console.error('[Guardian H01] AI suggestion failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for Guardian AI assistant
 */
function buildSystemPrompt(): string {
  return `You are an expert Guardian alert rule designer for a SaaS observability platform.

Guardian monitors platform telemetry, warehouse metrics, replay sessions, and scenarios.

Your task: Generate structured alert rule suggestions in JSON format.

Available condition operators:
- equals: Exact match (strings, numbers, booleans)
- greater_than: Numeric comparison (>)
- less_than: Numeric comparison (<)
- exists: Presence check (not null/undefined)

Available data sources:
- telemetry: Real-time event streams (fields: status_code, duration_ms, error_message, etc.)
- warehouse: Aggregated hourly metrics (metrics: errors_per_minute, requests_per_hour, etc.)

Always respond with valid JSON matching this structure:
{
  "suggestedConditions": [
    {"field": "status_code", "op": "equals", "value": 500}
  ],
  "suggestedThresholds": [
    {"metric": "error_rate", "suggestedValue": 0.05, "rationale": "5% industry standard"}
  ],
  "suggestedNotificationTemplate": "High error rate detected: {{message}}",
  "explanationSummary": "This rule detects server errors in real-time"
}`;
}

/**
 * Build user prompt for rule suggestions
 */
function buildRuleSuggestionPrompt(input: GuardianRuleSuggestionInput): string {
  const parts = ['Generate Guardian alert rule suggestions based on:'];

  if (input.ruleName) {
    parts.push(`\nRule Name: ${input.ruleName}`);
  }

  if (input.severity) {
    parts.push(`Severity: ${input.severity}`);
  }

  if (input.source) {
    parts.push(`Data Source: ${input.source}`);
  }

  if (input.channel) {
    parts.push(`Notification Channel: ${input.channel}`);
  }

  if (input.existingDescription) {
    parts.push(`\nExisting Description: ${input.existingDescription}`);
  }

  if (input.existingConditions) {
    parts.push(
      `\nExisting Conditions: ${JSON.stringify(input.existingConditions, null, 2).slice(0, 500)}`
    );
  }

  parts.push(
    '\nProvide: 1-3 condition suggestions, threshold recommendations, and a notification template.'
  );
  parts.push('Respond ONLY with valid JSON. No markdown, no explanations outside JSON.');

  return parts.join('\n');
}

/**
 * Log AI suggestion telemetry (privacy-friendly: no prompts/responses)
 */
async function logAISuggestionTelemetry(args: {
  tenantId: string;
  userId?: string | null;
  ruleId?: string | null;
  action: 'suggest' | 'refine' | 'validate';
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
}): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('guardian_ai_rule_suggestions').insert({
      tenant_id: args.tenantId,
      user_id: args.userId ?? null,
      rule_id: args.ruleId ?? null,
      action: args.action,
      model: args.model,
      prompt_tokens: args.promptTokens ?? null,
      completion_tokens: args.completionTokens ?? null,
      latency_ms: args.latencyMs,
      status: args.status,
    });

    if (error) {
      console.error('[Guardian H01] Failed to log AI telemetry:', error);
      // Don't throw - telemetry is best-effort
    }
  } catch (err) {
    console.error('[Guardian H01] Unexpected telemetry logging error:', err);
    // Don't throw - telemetry is best-effort
  }
}
