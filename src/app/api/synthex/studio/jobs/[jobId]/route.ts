/**
 * GET /api/synthex/studio/jobs/:jobId
 * Get studio job status and results
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { getStudioJob } from '@/lib/agents/studio-pod';
import { withErrorBoundary } from '@/lib/error-boundary';

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export const GET = withErrorBoundary(
  async (req: NextRequest, context: RouteContext) => {
    const { jobId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return errorResponse('workspaceId required', 400);
    }

    await validateUserAndWorkspace(req, workspaceId);

    try {
      // Get job from database
      const supabase = getSupabaseServer();
      const { data: job, error } = await supabase
        .from('synthex_studio_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('workspace_id', workspaceId)
        .single();

      if (error || !job) {
        return errorResponse('Studio job not found', 404);
      }

      return successResponse({
        job: {
          id: job.id,
          topic: job.topic,
          platforms: job.platforms,
          status: job.status,
          current_stage: job.current_stage,
          processing_time_ms: job.processing_time_ms,
          created_at: job.created_at,
          completed_at: job.completed_at,
          final_output: job.final_output,
          error_message: job.error_message,
        },
      });
    } catch (error) {
      console.error('Error fetching studio job:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }
);
