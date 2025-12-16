/**
 * Content Regeneration Endpoint
 * POST /api/circuits/content/regenerate
 *
 * Safely regenerate underperforming variants using CX08 approval,
 * CX06 generation, and CX05 brand validation
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  runContentRegeneration,
  checkEligibility,
  type RegenerationInput,
} from '@/lib/decision-circuits/content-regeneration-engine';

/**
 * POST /api/circuits/content/regenerate
 * Regenerate a terminated losing variant
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
    'losing_variant_id',
    'circuit_execution_id',
    'termination_reason',
    'confidence_score',
    'performance_delta',
  ];

  const missingFields = requiredFields.filter((field) => !(field in input));
  if (missingFields.length > 0) {
    return errorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  // Validate field types
  if (typeof input.ab_test_id !== 'string' || !input.ab_test_id.trim()) {
    return errorResponse('ab_test_id must be a non-empty string', 400);
  }

  if (typeof input.losing_variant_id !== 'string' || !input.losing_variant_id.trim()) {
    return errorResponse('losing_variant_id must be a non-empty string', 400);
  }

  if (typeof input.circuit_execution_id !== 'string' || !input.circuit_execution_id.trim()) {
    return errorResponse('circuit_execution_id must be a non-empty string', 400);
  }

  if (typeof input.termination_reason !== 'string' || !input.termination_reason.trim()) {
    return errorResponse('termination_reason must be a non-empty string', 400);
  }

  if (typeof input.confidence_score !== 'number' || input.confidence_score < 0 || input.confidence_score > 1) {
    return errorResponse('confidence_score must be a number between 0 and 1', 400);
  }

  if (typeof input.performance_delta !== 'number') {
    return errorResponse('performance_delta must be a number', 400);
  }

  // Check eligibility first
  const eligibility = await checkEligibility(
    workspaceId,
    input.ab_test_id as string,
    input.losing_variant_id as string
  );

  if (!eligibility.eligible) {
    return errorResponse(
      {
        error: `Not eligible for regeneration: ${eligibility.reason}`,
        violations: eligibility.violations,
        workspace_id: workspaceId,
        timestamp: new Date().toISOString(),
      },
      403
    );
  }

  // Build regeneration input
  const regenerationInput: RegenerationInput = {
    workspace_id: workspaceId,
    circuit_execution_id: input.circuit_execution_id as string,
    ab_test_id: input.ab_test_id as string,
    losing_variant_id: input.losing_variant_id as string,
    termination_reason: input.termination_reason as string,
    confidence_score: input.confidence_score as number,
    performance_delta: input.performance_delta as number,
    regeneration_instructions: (input.regeneration_instructions as string) || undefined,
    generated_by: (input.generated_by as 'automated' | 'manual') || 'automated',
  };

  // Run regeneration
  const result = await runContentRegeneration(regenerationInput);

  // Return response
  if (result.success) {
    return successResponse(
      {
        workspace_id: workspaceId,
        regeneration_result: result,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } else {
    return errorResponse(
      {
        error: result.error || result.reason,
        status: result.status,
        workspace_id: workspaceId,
        timestamp: new Date().toISOString(),
      },
      400
    );
  }
});
