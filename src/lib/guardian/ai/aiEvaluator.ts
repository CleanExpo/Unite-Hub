import { createClient } from '@/lib/supabase/server';
import { generateRuleSuggestions } from '@/lib/guardian/ai/ruleAssistant';
import { generateAnomalyDetection } from '@/lib/guardian/ai/anomalyEngine';
import { generateCorrelationRecommendations } from '@/lib/guardian/ai/correlationRefiner';

/**
 * Guardian AI Evaluator (H06)
 *
 * Executes evaluation scenarios against Guardian AI features.
 * Computes quality scores by comparing outputs with expected behavior.
 *
 * Design Principles:
 * - Scenario-based testing (synthetic + tenant-specific)
 * - Automated quality scoring
 * - Respects governance (H05) - checks feature toggles
 * - Privacy-friendly (synthetic data preferred)
 */

export type GuardianAiFeatureKey =
  | 'rule_assistant'
  | 'anomaly_detection'
  | 'correlation_refinement'
  | 'predictive_scoring';

export interface GuardianAiEvalScenario {
  id: string;
  tenant_id: string | null;
  feature: GuardianAiFeatureKey;
  label: string;
  description: string | null;
  input_payload: unknown;
  expected_behavior: unknown;
  is_synthetic: boolean;
  created_at: string;
  created_by: string | null;
}

export interface GuardianAiEvalResult {
  status: 'success' | 'error' | 'timeout';
  score?: number; // 0-1
  metrics?: Record<string, unknown>;
  rawOutput?: unknown;
  errorMessage?: string;
}

/**
 * Run a single evaluation scenario
 */
export async function runScenario(
  scenario: GuardianAiEvalScenario,
  tenantId?: string
): Promise<GuardianAiEvalResult> {
  const effectiveTenantId = tenantId || scenario.tenant_id || 'synthetic-eval-tenant';

  try {
    let output: unknown;

    // Dispatch to appropriate AI service based on feature
    switch (scenario.feature) {
      case 'rule_assistant':
        output = await generateRuleSuggestions({
          tenantId: effectiveTenantId,
          ...(scenario.input_payload as any),
        });
        break;

      case 'anomaly_detection':
        output = await generateAnomalyDetection({
          tenantId: effectiveTenantId,
          ...(scenario.input_payload as any),
        });
        break;

      case 'correlation_refinement':
        output = await generateCorrelationRecommendations({
          tenantId: effectiveTenantId,
          ...(scenario.input_payload as any),
        });
        break;

      case 'predictive_scoring':
        // H04 not yet implemented
        throw new Error('Predictive scoring not yet implemented');

      default:
        throw new Error(`Unknown feature: ${scenario.feature}`);
    }

    // Compute quality score
    const score = computeQualityScore(scenario, output);

    return {
      status: 'success',
      score,
      metrics: {
        hasOutput: !!output,
        outputType: typeof output,
      },
      rawOutput: output,
    };
  } catch (error: unknown) {
    const message = String(error);

    return {
      status: 'error',
      errorMessage: message.slice(0, 500),
    };
  }
}

/**
 * Compute quality score by comparing output with expected behavior
 *
 * Simple scoring for H06 MVP:
 * - If expected behavior not defined: score = 1.0 (success = good)
 * - If expected behavior defined: basic field matching
 */
function computeQualityScore(scenario: GuardianAiEvalScenario, output: unknown): number {
  if (!scenario.expected_behavior) {
    // No expected behavior defined - success is scored as 1.0
    return 1.0;
  }

  const expected = scenario.expected_behavior as any;
  const actual = output as any;

  let matchCount = 0;
  let totalChecks = 0;

  // Simple field matching (can be extended in future)
  if (expected.hasOwnProperty('suggestedConditions') && actual.hasOwnProperty('suggestedConditions')) {
    totalChecks++;
    if (Array.isArray(actual.suggestedConditions) && actual.suggestedConditions.length > 0) {
      matchCount++;
    }
  }

  if (expected.hasOwnProperty('anomaly_score') && actual.hasOwnProperty('anomaly_score')) {
    totalChecks++;
    if (typeof actual.anomaly_score === 'number') {
      matchCount++;
    }
  }

  if (expected.hasOwnProperty('recommendations') && actual.hasOwnProperty('recommendations')) {
    totalChecks++;
    if (Array.isArray(actual.recommendations)) {
      matchCount++;
    }
  }

  if (totalChecks === 0) {
    return 1.0; // No specific checks defined
  }

  return matchCount / totalChecks;
}

/**
 * Run evaluation batch for multiple scenarios
 */
export async function runEvaluationBatch(options: {
  scenarioIds?: string[];
  feature?: GuardianAiFeatureKey;
  tenantId?: string;
  triggeredBy?: string;
}): Promise<{ runIds: string[]; summary: { total: number; success: number; error: number } }> {
  const supabase = await createClient();

  // Load scenarios
  let query = supabase.from('guardian_ai_eval_scenarios').select('*');

  if (options.scenarioIds && options.scenarioIds.length > 0) {
    query = query.in('id', options.scenarioIds);
  }

  if (options.feature) {
    query = query.eq('feature', options.feature);
  }

  if (options.tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${options.tenantId}`);
  }

  const { data: scenarios, error: scenariosError } = await query.limit(100);

  if (scenariosError) throw scenariosError;

  if (!scenarios || scenarios.length === 0) {
    return { runIds: [], summary: { total: 0, success: 0, error: 0 } };
  }

  const runIds: string[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Execute each scenario
  for (const scenario of scenarios as GuardianAiEvalScenario[]) {
    const startTime = new Date().toISOString();

    const result = await runScenario(scenario, options.tenantId);

    const completedAt = new Date().toISOString();

    // Store run result
    const { data: run, error: insertError } = await supabase
      .from('guardian_ai_eval_runs')
      .insert({
        tenant_id: options.tenantId ?? null,
        scenario_id: scenario.id,
        feature: scenario.feature,
        model: 'claude-sonnet-4-5-20250929',
        status: result.status,
        score: result.score ?? null,
        metrics: result.metrics ?? null,
        raw_output: result.rawOutput ?? null,
        error_message: result.errorMessage ?? null,
        started_at: startTime,
        completed_at: completedAt,
        triggered_by: options.triggeredBy ?? null,
      })
      .select('id')
      .single();

    if (!insertError && run) {
      runIds.push(run.id);
    }

    if (result.status === 'success') {
      successCount++;
    } else {
      errorCount++;
    }
  }

  return {
    runIds,
    summary: {
      total: scenarios.length,
      success: successCount,
      error: errorCount,
    },
  };
}
