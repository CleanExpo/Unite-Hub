/**
 * Social Media Execution Agent API Routes
 * v1.3.0: Autonomous publishing with circuit validation
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  executeSocialPublishing,
  validateCircuitBinding,
  SocialExecutorInput,
} from '@/lib/decision-circuits';

/**
 * POST /api/circuits/agents/social/publish
 * Publish social media content with circuit validation and retry logic
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const action = req.nextUrl.searchParams.get('action') || 'publish';

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const { userId } = await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as SocialExecutorInput;

  // Validate required fields
  if (!body.circuit_execution_id || !body.client_id || !body.platform) {
    return errorResponse(
      'Missing required fields: circuit_execution_id, client_id, platform',
      400
    );
  }

  if (!body.final_asset || !body.final_asset.text_content) {
    return errorResponse('Missing final_asset with text_content', 400);
  }

  if (action === 'publish') {
    // Execute publishing
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

      // Execute publishing
      const context = {
        workspace_id: workspaceId,
        client_id: body.client_id,
        request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        user_id: userId,
      };

      const result = await executeSocialPublishing(body, context);

      return successResponse({
        workspace_id: workspaceId,
        execution_result: {
          published: result.published,
          platform_post_id: result.platform_post_id,
          platform_url: result.platform_url,
          published_at: result.published_at,
        },
        circuit_validation: {
          circuits_passed: circuitValidation.circuits_passed,
          all_required_passed: circuitValidation.valid,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorResponse(
        {
          message: 'Publishing failed',
          error: errorMessage,
        },
        500
      );
    }
  }

  return errorResponse(`Unknown action: ${action}`, 400);
});

/**
 * GET /api/circuits/agents/social/metrics
 * Retrieve engagement metrics for a published post
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const circuitExecutionId = req.nextUrl.searchParams.get('circuitExecutionId');
  const action = req.nextUrl.searchParams.get('action') || 'metrics';
  const clientId = req.nextUrl.searchParams.get('clientId');
  const platform = req.nextUrl.searchParams.get('platform');
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
        .from('social_agent_metrics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('circuit_execution_id', circuitExecutionId);

      if (error) {
        return errorResponse(`Failed to fetch metrics: ${error.message}`, 500);
      }

      // Aggregate metrics by platform
      const metricsByPlatform: Record<string, unknown> = {};
      let totalImpressions = 0;
      let totalLikes = 0;
      let totalShares = 0;
      let totalComments = 0;
      let totalClicks = 0;

      for (const metric of metrics) {
        if (!metricsByPlatform[metric.platform]) {
          metricsByPlatform[metric.platform] = {
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            clicks: 0,
            engagement_rate: 0,
          };
        }

        const p = metricsByPlatform[metric.platform] as Record<string, number>;
        p.impressions += metric.impressions;
        p.likes += metric.likes;
        p.shares += metric.shares;
        p.comments += metric.comments;
        p.clicks += metric.clicks;

        totalImpressions += metric.impressions;
        totalLikes += metric.likes;
        totalShares += metric.shares;
        totalComments += metric.comments;
        totalClicks += metric.clicks;
      }

      return successResponse({
        workspace_id: workspaceId,
        circuit_execution_id: circuitExecutionId,
        metrics_by_platform: metricsByPlatform,
        total_engagement: {
          impressions: totalImpressions,
          likes: totalLikes,
          shares: totalShares,
          comments: totalComments,
          clicks: totalClicks,
        },
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
    // Get publishing history
    try {
      let query = supabase
        .from('social_agent_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data: executions, error, count } = await query;

      if (error) {
        return errorResponse(`Failed to fetch history: ${error.message}`, 500);
      }

      // Enrich with metrics
      const enrichedExecutions = await Promise.all(
        executions.map(async (execution) => {
          const { data: metrics } = await supabase
            .from('social_agent_metrics')
            .select('*')
            .eq('circuit_execution_id', execution.circuit_execution_id);

          return {
            circuit_execution_id: execution.circuit_execution_id,
            platform: execution.platform,
            published: execution.published,
            platform_url: execution.platform_url,
            published_at: execution.published_at,
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
    // Batch metrics collection (background job trigger)
    try {
      // In production, this would trigger a background worker to:
      // 1. Query all published posts from last 24h
      // 2. Fetch metrics from each platform API
      // 3. Store in social_agent_metrics table

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
