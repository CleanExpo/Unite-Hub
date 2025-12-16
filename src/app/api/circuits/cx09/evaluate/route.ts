/**
 * CX09 A/B Testing Evaluation API
 * POST /api/circuits/cx09/evaluate
 * Evaluates variants and emits optimization signal to CX08
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { evaluateABTest, logABTestResults } from '@/lib/decision-circuits/circuits/cx09-evaluator';
import { ABTestEvaluationInput } from '@/lib/decision-circuits/circuits/cx09-ab-testing';

/**
 * POST /api/circuits/cx09/evaluate
 * Evaluate A/B test variants and emit optimization signal
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as ABTestEvaluationInput;

  // Validate required fields
  if (!body.circuit_execution_id || !body.test_id || !body.variants || body.variants.length < 2) {
    return errorResponse(
      'Missing required fields: circuit_execution_id, test_id, variants (minimum 2 required)',
      400
    );
  }

  // Validate variant schema
  for (const variant of body.variants) {
    if (!variant.variant_id || !variant.agent_execution_id || !variant.metrics_source) {
      return errorResponse(
        'Invalid variant schema: each variant must have variant_id, agent_execution_id, metrics_source',
        400
      );
    }
  }

  // Validate allocation percentages sum to 100
  const totalAllocation = body.variants.reduce((sum, v) => sum + (v.allocation_percentage || 0), 0);
  if (totalAllocation !== 100) {
    return errorResponse(`Variant allocations must sum to 100% (got ${totalAllocation}%)`, 400);
  }

  try {
    // Perform evaluation
    const evaluationResult = await evaluateABTest(body);

    // Log results to database
    await logABTestResults(workspaceId, body, evaluationResult);

    // Return result
    return successResponse({
      workspace_id: workspaceId,
      evaluation_result: {
        test_id: body.test_id,
        winning_variant_id: evaluationResult.winning_variant_id,
        runner_up_variant_id: evaluationResult.runner_up_variant_id,
        confidence_score: evaluationResult.confidence_score,
        performance_delta: evaluationResult.performance_delta,
        decision: evaluationResult.decision,
        recommendation: evaluationResult.recommendation,
        variants_evaluated: evaluationResult.variants_evaluated.map((v) => ({
          variant_id: v.variant_id,
          engagement_rate: v.engagement_rate,
          click_through_rate: v.click_through_rate,
          sample_size: v.sample_size,
        })),
        evaluated_at: evaluationResult.evaluated_at,
      },
      optimization_signal: evaluationResult.optimization_signal,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return errorResponse(
      {
        message: 'A/B test evaluation failed',
        error: errorMessage,
      },
      500
    );
  }
});
