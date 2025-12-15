/**
 * Metrics Backfill API Endpoint
 * POST /api/circuits/metrics/backfill?workspaceId=<uuid>
 *
 * Enqueue backfill jobs to retrieve historical metrics from providers
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { type MetricsProvider } from '@/lib/decision-circuits/metrics/metrics-types';
import { enqueueBackfill } from '@/lib/decision-circuits/metrics/metrics-ingestion';

/**
 * POST /api/circuits/metrics/backfill
 * Enqueue backfill job for provider historical data
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

  const input = body as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['provider', 'channel', 'date_start', 'date_end'];
  const missingFields = requiredFields.filter((field) => !(field in input));

  if (missingFields.length > 0) {
    return errorResponse(
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
  }

  // Validate provider
  const validProviders = ['sendgrid', 'resend', 'facebook', 'instagram', 'linkedin'];
  const provider = input.provider as string;

  if (!validProviders.includes(provider)) {
    return errorResponse(
      `Invalid provider. Supported: ${validProviders.join(', ')}`,
      400
    );
  }

  // Validate channel
  const channel = input.channel as string;
  if (!['email', 'social'].includes(channel)) {
    return errorResponse('channel must be "email" or "social"', 400);
  }

  // Validate date format
  const dateStart = input.date_start as string;
  const dateEnd = input.date_end as string;

  if (!isValidDateString(dateStart)) {
    return errorResponse('date_start must be YYYY-MM-DD format', 400);
  }

  if (!isValidDateString(dateEnd)) {
    return errorResponse('date_end must be YYYY-MM-DD format', 400);
  }

  if (dateStart > dateEnd) {
    return errorResponse('date_start must be before date_end', 400);
  }

  // Validate date range (max 30 days per job)
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 30) {
    return errorResponse('date range cannot exceed 30 days', 400);
  }

  // Enqueue backfill job
  const result = await enqueueBackfill(
    workspaceId,
    provider as MetricsProvider,
    channel as 'email' | 'social',
    dateStart,
    dateEnd
  );

  if (!result) {
    return errorResponse('Failed to enqueue backfill job', 500);
  }

  // Return success response
  return successResponse(
    {
      workspace_id: workspaceId,
      job_id: result.job_id,
      status: result.status,
      provider,
      channel,
      date_start: dateStart,
      date_end: dateEnd,
      message: 'Backfill job enqueued',
      note: 'Historical data will be fetched asynchronously. Check job status for progress.',
      timestamp: new Date().toISOString(),
    },
    202 // Accepted
  );
});

/**
 * GET /api/circuits/metrics/backfill
 * Get backfill job status
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  if (!jobId) {
    return errorResponse('jobId required for status check', 400);
  }

  // TODO: Implement job status retrieval
  // For now, return placeholder

  return successResponse(
    {
      workspace_id: workspaceId,
      job_id: jobId,
      message: 'Job status endpoint - implementation pending',
      timestamp: new Date().toISOString(),
    },
    200
  );
});

/**
 * Validate ISO date string (YYYY-MM-DD)
 */
function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}
