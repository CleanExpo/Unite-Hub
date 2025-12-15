/**
 * CX09 A/B Testing Evaluator
 * Core logic for variant evaluation and winner selection
 */

import { createClient } from '@/lib/supabase/server';
import {
  ABTestVariant,
  ABTestEvaluationInput,
  ABTestEvaluationResult,
  MetricsSnapshot,
  StatisticalTestResult,
} from './cx09-ab-testing';

/**
 * Perform two-proportion z-test for statistical significance
 */
function performZTest(variant1: MetricsSnapshot, variant2: MetricsSnapshot): StatisticalTestResult {
  // Z-test for two proportions
  const p1 = variant1.engagement_rate / 100;
  const p2 = variant2.engagement_rate / 100;
  const n1 = variant1.sample_size;
  const n2 = variant2.sample_size;

  // Pooled proportion
  const pooled = (n1 * p1 + n2 * p2) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));

  // Z-score
  const z_score = se !== 0 ? (p1 - p2) / se : 0;

  // P-value (two-tailed)
  const p_value = 2 * (1 - normalCDF(Math.abs(z_score)));

  // Confidence interval for difference
  const margin_of_error = 1.96 * se; // 95% CI
  const diff = (p1 - p2) * 100;

  return {
    z_score,
    p_value,
    confidence_interval: [diff - margin_of_error * 100, diff + margin_of_error * 100],
    significant_at_threshold: p_value < 0.05,
  };
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Fetch metrics for a specific variant
 */
async function fetchVariantMetrics(
  workspaceId: string,
  variant: ABTestVariant,
  evaluationWindowHours: number
): Promise<MetricsSnapshot | null> {
  const supabase = await createClient();

  try {
    const evaluationWindowStart = new Date(
      Date.now() - evaluationWindowHours * 60 * 60 * 1000
    ).toISOString();

    if (variant.metrics_source === 'email_agent_metrics') {
      const { data: metrics } = await supabase
        .from('email_agent_metrics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('provider_message_id', variant.agent_execution_id)
        .gte('collected_at', evaluationWindowStart)
        .single();

      if (!metrics) {
        return null;
      }

      // Calculate metrics
      const sample_size = 1; // One execution record
      const engagement_rate = metrics.opened ? 100 : 0;
      const click_through_rate = metrics.clicked ? 100 : 0;

      return {
        variant_id: variant.variant_id,
        engagement_rate,
        click_through_rate,
        sample_size,
        collected_at: metrics.collected_at || new Date().toISOString(),
      };
    } else {
      // social_agent_metrics
      const { data: metrics } = await supabase
        .from('social_agent_metrics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform_post_id', variant.agent_execution_id)
        .gte('collected_at', evaluationWindowStart)
        .single();

      if (!metrics) {
        return null;
      }

      const sample_size = 1;
      const engagement_rate =
        metrics.impressions && metrics.impressions > 0
          ? ((metrics.likes || 0 + metrics.shares || 0 + metrics.comments || 0) /
              metrics.impressions) *
            100
          : 0;
      const click_through_rate = metrics.clicks && metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0;

      return {
        variant_id: variant.variant_id,
        engagement_rate,
        click_through_rate,
        sample_size,
        collected_at: metrics.collected_at || new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`Failed to fetch metrics for variant ${variant.variant_id}:`, error);
    return null;
  }
}

/**
 * Evaluate all variants and determine winner
 */
export async function evaluateABTest(
  input: ABTestEvaluationInput
): Promise<ABTestEvaluationResult> {
  const evaluationWindow = input.evaluation_window_hours || 72;
  const confidenceThreshold = input.confidence_threshold || 0.95;
  const primaryMetric = input.primary_metric || 'engagement_rate';

  // Fetch metrics for all variants
  const variantMetrics: MetricsSnapshot[] = [];

  for (const variant of input.variants) {
    const metrics = await fetchVariantMetrics(input.workspace_id, variant, evaluationWindow);
    if (metrics) {
      variantMetrics.push(metrics);
    }
  }

  // Check if we have enough data
  if (variantMetrics.length < 2) {
    return {
      ab_test_id: input.test_id,
      winning_variant_id: null,
      confidence_score: 0,
      performance_delta: 0,
      decision: 'continue_test',
      recommendation: `Insufficient data: Only ${variantMetrics.length} variant(s) have metrics. Waiting for more data.`,
      variants_evaluated: variantMetrics,
      evaluated_at: new Date().toISOString(),
      optimization_signal: {
        winning_variant_id: '',
        confidence_score: 0,
        performance_delta: 0,
        recommendation: 'Insufficient data',
        test_id: input.test_id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Sort variants by primary metric (descending)
  const sorted = [...variantMetrics].sort((a, b) => {
    const aMetric = a[primaryMetric as keyof MetricsSnapshot] || 0;
    const bMetric = b[primaryMetric as keyof MetricsSnapshot] || 0;
    return (bMetric as number) - (aMetric as number);
  });

  const winner = sorted[0];
  const runnerUp = sorted.length > 1 ? sorted[1] : null;

  // Perform statistical test if we have at least 2 variants
  let zTestResult: StatisticalTestResult | null = null;
  if (runnerUp) {
    zTestResult = performZTest(winner, runnerUp);
  }

  // Determine decision based on confidence
  const performanceDelta =
    runnerUp && runnerUp[primaryMetric as keyof MetricsSnapshot]
      ? (((winner[primaryMetric as keyof MetricsSnapshot] as number) -
          (runnerUp[primaryMetric as keyof MetricsSnapshot] as number)) /
          (runnerUp[primaryMetric as keyof MetricsSnapshot] as number)) *
        100
      : 0;

  let decision: 'promote' | 'continue_test' | 'terminate' = 'continue_test';
  let confidenceScore = 0;
  let recommendation = '';

  if (zTestResult) {
    confidenceScore = 1 - zTestResult.p_value;

    if (confidenceScore >= confidenceThreshold && performanceDelta > 0) {
      decision = 'promote';
      recommendation = `Winner: ${winner.variant_id} with ${confidenceScore * 100}% confidence and ${performanceDelta.toFixed(2)}% improvement`;
    } else if (performanceDelta < 0) {
      decision = 'terminate';
      recommendation = `Terminating: Winner shows ${Math.abs(performanceDelta).toFixed(2)}% decline. Recommend reverting to baseline.`;
    } else {
      recommendation = `Continue testing: ${confidenceScore * 100}% confidence (need ${confidenceThreshold * 100}% to promote)`;
    }
  } else {
    recommendation = 'Insufficient variants for statistical comparison';
  }

  return {
    ab_test_id: input.test_id,
    winning_variant_id: decision === 'promote' ? winner.variant_id : null,
    runner_up_variant_id: runnerUp?.variant_id,
    confidence_score: confidenceScore,
    performance_delta: performanceDelta,
    decision,
    recommendation,
    variants_evaluated: sorted,
    evaluated_at: new Date().toISOString(),
    optimization_signal: {
      winning_variant_id: decision === 'promote' ? winner.variant_id : '',
      confidence_score: confidenceScore,
      performance_delta: performanceDelta,
      recommendation,
      test_id: input.test_id,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Log A/B test and results to database
 */
export async function logABTestResults(
  workspaceId: string,
  input: ABTestEvaluationInput,
  result: ABTestEvaluationResult
): Promise<void> {
  const supabase = await createClient();

  try {
    // Insert test record
    const { data: testData, error: testError } = await supabase
      .from('circuit_ab_tests')
      .insert([
        {
          workspace_id: workspaceId,
          circuit_execution_id: input.circuit_execution_id,
          test_id: input.test_id,
          test_name: input.test_name,
          channel: input.channel,
          variants: input.variants,
          evaluation_window_hours: input.evaluation_window_hours || 72,
          minimum_sample_size: input.minimum_sample_size || 100,
          confidence_threshold: input.confidence_threshold || 0.95,
          primary_metric: input.primary_metric || 'engagement_rate',
          secondary_metric: input.secondary_metric,
          tie_breaker_metric: input.tie_breaker_metric,
          evaluation_window_end_at: new Date(
            Date.now() + (input.evaluation_window_hours || 72) * 60 * 60 * 1000
          ).toISOString(),
        },
      ])
      .select('id')
      .single();

    if (testError) {
      console.error('Failed to insert test record:', testError);
      return;
    }

    // Insert results for each variant
    const resultRecords = result.variants_evaluated.map((variant) => ({
      workspace_id: workspaceId,
      ab_test_id: testData.id,
      variant_id: variant.variant_id,
      agent_execution_id: input.variants.find((v) => v.variant_id === variant.variant_id)
        ?.agent_execution_id,
      metrics_snapshot: {
        engagement_rate: variant.engagement_rate,
        click_through_rate: variant.click_through_rate,
        time_to_first_engagement: variant.time_to_first_engagement,
        conversion_assist_score: variant.conversion_assist_score,
      },
      engagement_rate: variant.engagement_rate,
      click_through_rate: variant.click_through_rate,
      sample_size: variant.sample_size,
    }));

    const { error: resultsError } = await supabase
      .from('circuit_ab_test_results')
      .insert(resultRecords);

    if (resultsError) {
      console.error('Failed to insert results:', resultsError);
      return;
    }

    // Insert winner if decision is promote
    if (result.decision === 'promote' && result.winning_variant_id) {
      const { error: winnerError } = await supabase
        .from('circuit_ab_test_winners')
        .insert([
          {
            workspace_id: workspaceId,
            ab_test_id: testData.id,
            winning_variant_id: result.winning_variant_id,
            confidence_score: result.confidence_score,
            performance_delta: result.performance_delta,
            decision: result.decision,
            optimization_signal: result.optimization_signal,
            evaluated_at: result.evaluated_at,
          },
        ]);

      if (winnerError) {
        console.error('Failed to insert winner:', winnerError);
      }
    }
  } catch (error) {
    console.error('Failed to log A/B test results:', error);
  }
}
