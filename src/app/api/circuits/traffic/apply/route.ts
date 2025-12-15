/**
 * Traffic Allocation Application Endpoint
 * POST /api/circuits/traffic/apply
 *
 * Apply guarded traffic allocation changes based on CX09 A/B test winner
 * with automatic guardrail validation, rate limiting, and reversibility
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  applyAllocation,
  ApplyAllocationInput,
  AllocationResult,
} from '@/lib/decision-circuits/traffic-allocation-engine';

/**
 * POST /api/circuits/traffic/apply
 * Apply traffic allocation based on CX09 winner
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  // Validate required fields
  const input = body as Record<string, unknown>;
  const requiredFields = [
    'ab_test_id',
    'winning_variant_id',
    'evaluation_id',
    'confidence_score',
    'performance_delta',
  ];

  const missingFields = requiredFields.filter((field) => !(field in input));
  if (missingFields.length > 0) {
    return errorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  // Validate field types and values
  if (typeof input.ab_test_id !== 'string' || !input.ab_test_id.trim()) {
    return errorResponse('ab_test_id must be a non-empty string', 400);
  }

  if (typeof input.winning_variant_id !== 'string' || !input.winning_variant_id.trim()) {
    return errorResponse('winning_variant_id must be a non-empty string', 400);
  }

  if (typeof input.evaluation_id !== 'string' || !input.evaluation_id.trim()) {
    return errorResponse('evaluation_id must be a non-empty string', 400);
  }

  if (typeof input.confidence_score !== 'number' || input.confidence_score < 0 || input.confidence_score > 1) {
    return errorResponse('confidence_score must be a number between 0 and 1', 400);
  }

  if (typeof input.performance_delta !== 'number') {
    return errorResponse('performance_delta must be a number', 400);
  }

  // Verify that the winning variant exists in the test
  const supabase = getSupabaseServer();
  const { data: testData } = await supabase
    .from('circuit_ab_tests')
    .select('variants')
    .eq('workspace_id', workspaceId)
    .eq('test_id', input.ab_test_id)
    .single();

  if (!testData) {
    return errorResponse('A/B test not found', 404);
  }

  // Verify variant exists in test definition
  const variants = (testData.variants as Array<{ variant_id: string }>) || [];
  const variantExists = variants.some((v) => v.variant_id === input.winning_variant_id);
  if (!variantExists) {
    return errorResponse(`Winning variant '${input.winning_variant_id}' not found in test`, 404);
  }

  // Verify evaluation result exists and matches
  const { data: evaluationData } = await supabase
    .from('circuit_ab_test_winners')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', input.evaluation_id)
    .single();

  if (!evaluationData) {
    return errorResponse('Evaluation result not found', 404);
  }

  if (evaluationData.winning_variant_id !== input.winning_variant_id) {
    return errorResponse(
      'winning_variant_id does not match evaluation result',
      400
    );
  }

  // Build allocation input
  const allocationInput: ApplyAllocationInput = {
    workspace_id: workspaceId,
    ab_test_id: input.ab_test_id as string,
    winning_variant_id: input.winning_variant_id as string,
    evaluation_id: input.evaluation_id as string,
    confidence_score: input.confidence_score as number,
    performance_delta: input.performance_delta as number,
  };

  // Apply allocation with guardrails
  const result: AllocationResult = await applyAllocation(allocationInput);

  // Return response
  if (result.success) {
    return successResponse(
      {
        workspace_id: workspaceId,
        allocation_result: result,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } else {
    return errorResponse(
      {
        error: result.error || result.reason,
        workspace_id: workspaceId,
        timestamp: new Date().toISOString(),
      },
      400
    );
  }
});
