/**
 * Health Check Analysis API
 * POST /api/health-check/analyze
 *
 * Triggers comprehensive website health analysis
 * Returns job ID for polling or results if already cached
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { executeHealthCheck, getHealthCheckJob } from '@/lib/health-check/orchestrator';
import { getSupabaseServer } from '@/lib/supabase';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // 1. Validate workspace
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // 2. Parse request body
  const body = await req.json();
  const { url, includeCompetitors = true, analyzeThreats = true } = body;

  if (!url || typeof url !== 'string') {
    return errorResponse('url is required and must be a string', 400);
  }

  // 3. Validate URL format
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return errorResponse('Invalid URL format', 400);
  }

  // 4. Check for recent analysis (cache result within 1 hour)
  const supabase = getSupabaseServer();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const { data: recentJob } = await supabase
    .from('health_check_jobs')
    .select('id, status, created_at')
    .eq('workspace_id', workspaceId)
    .eq('url', url)
    .eq('status', 'completed')
    .gt('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If recent cached result exists, return it
  if (recentJob) {
    const cachedJob = await getHealthCheckJob(recentJob.id, workspaceId);
    return successResponse(
      {
        jobId: cachedJob.id,
        status: 'cached',
        cached: true,
        results: cachedJob.results,
      },
      200
    );
  }

  // 5. Execute new health check
  try {
    const result = await executeHealthCheck(url, workspaceId, includeCompetitors, analyzeThreats);

    return successResponse(
      {
        jobId: result.jobId,
        status: result.status,
        cached: false,
        message: 'Health check analysis started. Poll the job endpoint for results.',
      },
      202 // 202 Accepted - async processing
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start health check';
    return errorResponse(message, 400);
  }
});

/**
 * GET /api/health-check/analyze?jobId={jobId}
 * Poll for health check results
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Validate workspace
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!workspaceId || !jobId) {
    return errorResponse('workspaceId and jobId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Get job status
  try {
    const job = await getHealthCheckJob(jobId, workspaceId);

    if (job.status === 'completed' && job.results) {
      return successResponse(
        {
          jobId: job.id,
          status: 'completed',
          url: job.url,
          completedAt: job.completed_at,
          durationMs: job.duration_ms,
          results: job.results,
        },
        200
      );
    }

    return successResponse(
      {
        jobId: job.id,
        status: job.status,
        url: job.url,
        createdAt: job.created_at,
        startedAt: job.started_at,
        message:
          job.status === 'running'
            ? 'Analysis in progress, check back in 30-60 seconds'
            : 'Job is queued, processing will begin shortly',
      },
      202 // Still processing
    );
  } catch (error) {
    return errorResponse('Job not found', 404);
  }
});
