import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Optimization Assistant (H10)
 * Analyzes Guardian config and suggests improvements (advisory only)
 */

export interface GuardianOptimizationSuggestion {
  category: 'rule_tuning' | 'noise_reduction' | 'coverage_gap' | 'routing' | 'other';
  targetType: 'rule' | 'rule_group' | 'global' | 'notification_channel';
  targetId?: string;
  suggestionMarkdown: string;
  impactScore: number;
  confidence?: number;
  rationaleSummary?: string;
  metadata: Record<string, unknown>;
}

export async function generateOptimizationSuggestions(input: {
  tenantId: string;
  analysisWindowHours?: number;
  maxSuggestions?: number;
}): Promise<GuardianOptimizationSuggestion[]> {
  await assertAiFeatureEnabled(input.tenantId, 'optimization');
  const quota = await checkDailyQuota(input.tenantId);
  if (quota.exceeded) throw new Error('QUOTA_EXCEEDED');

  const windowHours = input.analysisWindowHours ?? 168;
  const supabase = await createClient();
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const [rules, alerts] = await Promise.all([
    supabase.from('guardian_alert_rules').select('id, name, severity').eq('tenant_id', input.tenantId),
    supabase.from('guardian_alert_events').select('rule_id, severity').eq('tenant_id', input.tenantId).gte('created_at', since),
  ]);

  const context = {
    rulesCount: rules.data?.length ?? 0,
    alertsCount: alerts.data?.length ?? 0,
  };

  const message = await createMessage(
    [{ role: 'user', content: `Analyze Guardian config: ${JSON.stringify(context)}. Suggest optimizations. JSON only.` }],
    'Guardian optimization expert. Respond: {suggestions: [...]}',
    { model: 'claude-sonnet-4-5-20250929', max_tokens: 2048, temperature: 0.3 }
  );

  const response = parseJSONResponse<{ suggestions: GuardianOptimizationSuggestion[] }>(message);

  for (const sug of response.suggestions.slice(0, input.maxSuggestions || 20)) {
    await supabase.from('guardian_ai_optimization_suggestions').insert({
      tenant_id: input.tenantId,
      category: sug.category,
      target_type: sug.targetType,
      target_id: sug.targetId || null,
      model: 'claude-sonnet-4-5-20250929',
      suggestion_markdown: sug.suggestionMarkdown.slice(0, 5000),
      impact_score: sug.impactScore,
      confidence: sug.confidence || null,
      rationale_summary: sug.rationaleSummary?.slice(0, 500) || null,
      status: 'proposed',
      metadata: sug.metadata || {},
    });
  }

  return response.suggestions;
}
