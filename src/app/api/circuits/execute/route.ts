/**
 * Circuit Execution API Endpoint
 * Execute decision circuits with full traceability
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  executeCircuit,
  chainCircuits,
  type CircuitExecutionContext,
  type CircuitInput,
} from '@/lib/decision-circuits';

interface ExecuteCircuitRequest {
  circuitId: string;
  inputs: CircuitInput;
  clientId: string;
}

interface ChainCircuitsRequest {
  circuits: Array<{
    circuitId: string;
    inputs: CircuitInput;
  }>;
  clientId: string;
}

/**
 * Execute a single circuit
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const { userId } = await validateUserAndWorkspace(req, workspaceId);
  const body = (await req.json()) as ExecuteCircuitRequest;

  const { circuitId, inputs, clientId } = body;

  if (!circuitId || !inputs || !clientId) {
    return errorResponse(
      'circuitId, inputs, and clientId required',
      400
    );
  }

  const context: CircuitExecutionContext = {
    workspace_id: workspaceId,
    client_id: clientId,
    request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user_id: userId,
  };

  try {
    // In a real implementation, you would have circuit-specific executors
    // This is a placeholder that demonstrates the pattern
    const result = await executeCircuit(
      circuitId,
      inputs,
      context,
      async (circuitInputs) => {
        // Circuit-specific logic would go here
        // For now, return the inputs as outputs (no-op)
        return circuitInputs as Record<string, unknown>;
      }
    );

    return successResponse({
      circuit_id: circuitId,
      execution_id: context.request_id,
      success: result.success,
      data: result.data,
      decision_trace: result.decision_trace,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Circuit execution failed',
      400
    );
  }
});

/**
 * Chain multiple circuits together
 */
export const PUT = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const { userId } = await validateUserAndWorkspace(req, workspaceId);
  const body = (await req.json()) as ChainCircuitsRequest;

  const { circuits, clientId } = body;

  if (!circuits || !Array.isArray(circuits) || !clientId) {
    return errorResponse('circuits array and clientId required', 400);
  }

  const context: CircuitExecutionContext = {
    workspace_id: workspaceId,
    client_id: clientId,
    request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user_id: userId,
  };

  try {
    const circuitChain = circuits.map(({ circuitId, inputs }) => ({
      circuitId,
      inputs,
      execute: async (circuitInputs: CircuitInput) => {
        // Circuit-specific logic would go here
        return circuitInputs as Record<string, unknown>;
      },
    }));

    const result = await chainCircuits(circuitChain, context);

    return successResponse({
      success: result.success,
      execution_id: context.request_id,
      results: result.results.map((r) => ({
        circuit_id: r.execution_log.circuit_id,
        success: r.success,
        decision_trace: r.decision_trace,
      })),
      final_output: result.final_output,
      total_decision_path: result.total_decision_path,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Circuit chain execution failed',
      400
    );
  }
});
