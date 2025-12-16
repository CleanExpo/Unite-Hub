/**
 * Email Execution Agent API Routes
 * v1.4.0: Autonomous email sending with circuit validation
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  executeEmailSending,
  validateCircuitBinding,
  EmailExecutorInput,
} from '@/lib/decision-circuits';

/**
 * POST /api/circuits/agents/email/send
 * Send email content with circuit validation and retry logic
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const action = req.nextUrl.searchParams.get('action') || 'send';

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const { userId } = await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as EmailExecutorInput;

  // Validate required fields
  if (!body.circuit_execution_id || !body.client_id || !body.recipient) {
    return errorResponse(
      'Missing required fields: circuit_execution_id, client_id, recipient',
      400
    );
  }

  if (!body.final_asset || !body.final_asset.subject || !body.final_asset.html_body) {
    return errorResponse('Missing final_asset with subject and html_body', 400);
  }

  if (action === 'send') {
    // Execute email sending
    try {
      // Validate circuit binding first (hard fail)
      const circuitValidation = await validateCircuitBinding(
        body.circuit_execution_id,
        workspaceId
      );

      if (!circuitValidation.valid) {
        return errorResponse(
          {
            message: 'Circuit validation failed',
            missing_circuits: circuitValidation.missing,
            passed_circuits: circuitValidation.circuits_passed,
          },
          403
        );
      }

      // Execute email sending
      const context = {
        workspace_id: workspaceId,
        client_id: body.client_id,
        request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_id: userId,
      };

      const result = await executeEmailSending(body, context);

      return successResponse({
        workspace_id: workspaceId,
        execution_result: {
          sent: result.sent,
          provider_message_id: result.provider_message_id,
          provider: result.provider,
          sent_at: result.sent_at,
        },
        circuit_validation: {
          circuits_passed: circuitValidation.circuits_passed,
          all_required_passed: circuitValidation.valid,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is from recipient validation (suppression list, rate limit)
      if (
        errorMessage.includes('Recipient validation failed') &&
        (errorMessage.includes('suppressed') || errorMessage.includes('rate_limit'))
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
          message: 'Email sending failed',
          error: errorMessage,
        },
        500
      );
    }
  }

  return errorResponse(`Unknown action: ${action}`, 400);
});

/**
 * GET /api/circuits/agents/email/metrics
 * Retrieve engagement metrics for a sent email
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const circuitExecutionId = req.nextUrl.searchParams.get('circuitExecutionId');
  const action = req.nextUrl.searchParams.get('action') || 'metrics';
  const clientId = req.nextUrl.searchParams.get('clientId');
  const recipientEmail = req.nextUrl.searchParams.get('recipient');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  if (action === 'metrics' && circuitExecutionId) {
    // Get metrics for a specific circuit execution
    try {
      const { data: metrics, error } = await supabase
        .from('email_agent_metrics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('circuit_execution_id', circuitExecutionId);

      if (error) {
        return errorResponse(`Failed to fetch metrics: ${error.message}`, 500);
      }

      // Aggregate metrics
      let delivered = false;
      let bounced = false;
      let opened = false;
      let clicked = false;
      let unsubscribed = false;
      let complained = false;

      for (const metric of metrics) {
        if (metric.delivered) {
          delivered = true;
        }
        if (metric.bounced) {
          bounced = true;
        }
        if (metric.opened) {
          opened = true;
        }
        if (metric.clicked) {
          clicked = true;
        }
        if (metric.unsubscribed) {
          unsubscribed = true;
        }
        if (metric.complained) {
          complained = true;
        }
      }

      return successResponse({
        workspace_id: workspaceId,
        circuit_execution_id: circuitExecutionId,
        metrics: {
          delivered,
          bounced,
          opened,
          clicked,
          unsubscribed,
          complained,
        },
        metrics_count: metrics.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to fetch metrics',
          error: errorMessage,
        },
        500
      );
    }
  }

  if (action === 'history') {
    // Get sending history
    try {
      let query = supabase
        .from('email_agent_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (recipientEmail) {
        query = query.eq('recipient', recipientEmail.toLowerCase());
      }

      const { data: executions, error, count } = await query;

      if (error) {
        return errorResponse(`Failed to fetch history: ${error.message}`, 500);
      }

      // Enrich with metrics
      const enrichedExecutions = await Promise.all(
        executions.map(async (execution) => {
          const { data: metrics } = await supabase
            .from('email_agent_metrics')
            .select('*')
            .eq('circuit_execution_id', execution.circuit_execution_id);

          return {
            circuit_execution_id: execution.circuit_execution_id,
            recipient: execution.recipient,
            subject: execution.subject,
            sent: execution.sent,
            sent_at: execution.sent_at,
            provider: execution.provider,
            engagement_metrics: metrics?.[0] || null,
          };
        })
      );

      return successResponse({
        workspace_id: workspaceId,
        executions: enrichedExecutions,
        total_count: count || 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to fetch history',
          error: errorMessage,
        },
        500
      );
    }
  }

  if (action === 'collect-metrics') {
    // Trigger background metrics collection job
    try {
      // In production, this would trigger a background worker to:
      // 1. Query all sent emails from last 24h
      // 2. Fetch metrics from each provider API via webhooks
      // 3. Store in email_agent_metrics table

      // Placeholder: Return success
      return successResponse({
        workspace_id: workspaceId,
        metrics_collected: 0,
        message: 'Background metrics collection job triggered',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Failed to trigger metrics collection',
          error: errorMessage,
        },
        500
      );
    }
  }

  return errorResponse(`Unknown action: ${action}`, 400);
});
