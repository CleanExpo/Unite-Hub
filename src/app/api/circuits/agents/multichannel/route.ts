/**
 * Multi-Channel Coordinator API Routes
 * v1.5.0: Orchestration endpoints for coordinating Email and Social execution agents
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  executeMultiChannelWorkflow,
  aggregateMetrics,
  type MultiChannelInput,
} from '@/lib/decision-circuits';

/**
 * POST /api/circuits/agents/multichannel/execute
 * Execute multi-channel workflow with circuit validation and suppression checks
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const action = req.nextUrl.searchParams.get('action') || 'execute';

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const { userId } = await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as MultiChannelInput;

  // Validate required fields
  if (!body.circuit_execution_id || !body.client_id || !body.flow_id) {
    return errorResponse(
      'Missing required fields: circuit_execution_id, client_id, flow_id',
      400
    );
  }

  // Validate flow_id
  const validFlows = ['EMAIL_THEN_SOCIAL', 'SOCIAL_THEN_EMAIL', 'EMAIL_ONLY', 'SOCIAL_ONLY'];
  if (!validFlows.includes(body.flow_id)) {
    return errorResponse(`Invalid flow_id: ${body.flow_id}`, 400);
  }

  // Validate that at least one channel is provided
  if (!body.email && !body.social) {
    return errorResponse('At least one channel (email or social) must be provided', 400);
  }

  // Validate email channel if provided
  if (body.email) {
    if (!body.email.recipient || !body.email.final_asset) {
      return errorResponse('Email channel missing recipient or final_asset', 400);
    }
    if (!body.email.final_asset.subject || !body.email.final_asset.html_body) {
      return errorResponse('Email final_asset missing subject or html_body', 400);
    }
  }

  // Validate social channel if provided
  if (body.social) {
    if (!body.social.platform || !body.social.final_asset) {
      return errorResponse('Social channel missing platform or final_asset', 400);
    }
    if (!body.social.final_asset.text_content) {
      return errorResponse('Social final_asset missing text_content', 400);
    }
    if (!['facebook', 'instagram', 'linkedin'].includes(body.social.platform)) {
      return errorResponse(`Invalid platform: ${body.social.platform}`, 400);
    }
  }

  if (action === 'execute') {
    // Execute multi-channel workflow
    try {
      const context = {
        workspace_id: workspaceId,
        client_id: body.client_id,
        request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_id: userId,
      };

      const result = await executeMultiChannelWorkflow(body, context);

      if (!result.success) {
        return errorResponse(
          {
            message: 'Multi-channel workflow failed',
            error: result.error,
            flow_id: result.flow_id,
          },
          400
        );
      }

      return successResponse({
        workspace_id: workspaceId,
        execution_result: {
          success: result.success,
          flow_id: result.flow_id,
          email_result: result.email_result,
          social_result: result.social_result,
          metrics_summary: result.metrics_summary,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is from circuit validation or suppression
      if (
        errorMessage.includes('Circuit validation failed') ||
        errorMessage.includes('Unified suppression')
      ) {
        return errorResponse(
          {
            message: errorMessage,
          },
          403
        );
      }

      return errorResponse(
        {
          message: 'Multi-channel workflow execution failed',
          error: errorMessage,
        },
        500
      );
    }
  }

  return errorResponse(`Unknown action: ${action}`, 400);
});

/**
 * GET /api/circuits/agents/multichannel/status
 * Retrieve execution status for a multi-channel workflow
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const circuitExecutionId = req.nextUrl.searchParams.get('circuitExecutionId');
  const action = req.nextUrl.searchParams.get('action') || 'status';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  if (action === 'status' && circuitExecutionId) {
    // Get status for a specific multi-channel execution
    try {
      const { data: execution, error } = await supabase
        .from('multichannel_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('circuit_execution_id', circuitExecutionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse('Execution not found', 404);
        }
        return errorResponse(`Failed to fetch status: ${error.message}`, 500);
      }

      return successResponse({
        workspace_id: workspaceId,
        circuit_execution_id: circuitExecutionId,
        execution: {
          flow_id: execution.flow_id,
          agent_sequence: execution.agent_sequence,
          execution_status: execution.execution_status,
          started_at: execution.started_at,
          completed_at: execution.completed_at,
          failure_reason: execution.failure_reason,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to fetch execution status',
          error: errorMessage,
        },
        500
      );
    }
  }

  if (action === 'history') {
    // Get execution history
    try {
      const { data: executions, error, count } = await supabase
        .from('multichannel_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        return errorResponse(`Failed to fetch history: ${error.message}`, 500);
      }

      return successResponse({
        workspace_id: workspaceId,
        executions: executions || [],
        total_count: count || 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to fetch execution history',
          error: errorMessage,
        },
        500
      );
    }
  }

  if (action === 'metrics' && circuitExecutionId) {
    // Get aggregated metrics for a multi-channel execution
    try {
      const metrics = await aggregateMetrics(circuitExecutionId, workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        circuit_execution_id: circuitExecutionId,
        aggregated_metrics: metrics,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to fetch aggregated metrics',
          error: errorMessage,
        },
        500
      );
    }
  }

  return errorResponse(`Unknown action: ${action}`, 400);
});
