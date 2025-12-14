/**
 * POST /api/synthex/studio/generate
 * Multi-stage content synthesis: Research → Script → Visual → Voice
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { createStudioJob, executeStudioPipeline } from '@/lib/agents/studio-pod';
import { withErrorBoundary } from '@/lib/error-boundary';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Validate workspace
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    // Parse request body
    const { topic, platforms } = await req.json();

    // Validate inputs
    if (!topic || typeof topic !== 'string') {
      return errorResponse('topic required and must be string', 400);
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return errorResponse('platforms required and must be non-empty array', 400);
    }

    // Create studio job
    const job = await createStudioJob(workspaceId, topic, platforms);
    if (!job) {
      return errorResponse('Failed to create studio job', 500);
    }

    // Start pipeline execution (non-blocking)
    // In production, this would be queued via Inngest or Bull
    executeStudioPipeline(job.id).catch((error) => {
      console.error(`Studio pipeline failed for job ${job.id}:`, error);
    });

    return successResponse(
      {
        jobId: job.id,
        status: 'pending',
        topic: job.topic,
        platforms: job.platforms,
        message: 'Studio job created. Check /api/synthex/studio/jobs/:jobId for status.',
      },
      { status: 202 } // Accepted
    );
  } catch (error) {
    console.error('Error in studio generate endpoint:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
