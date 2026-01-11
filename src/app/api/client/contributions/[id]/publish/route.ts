import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { publishContribution, getContributions } from '@/lib/services/client-contribution';
import { notifyContributionPublished } from '@/lib/services/notification-service';

/**
 * POST /api/client/contributions/[id]/publish?workspaceId={id}
 *
 * Publish a client contribution and send notification
 *
 * Request body:
 *   - published_url: string (optional) - URL where content is published
 *   - schema_generated: object (optional) - Generated schema markup
 *
 * Response: { success: true, contribution: ClientContribution }
 */
export const POST = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const { published_url, schema_generated } = body;

  // Publish contribution
  const contribution = await publishContribution(
    workspaceId,
    id,
    published_url,
    schema_generated
  );

  // Verify ownership (contribution belongs to requesting user)
  if (contribution.client_user_id !== user.id) {
    return errorResponse('Unauthorized: You do not own this contribution', 403);
  }

  // Send notification
  try {
    await notifyContributionPublished(workspaceId, user.id, contribution.contribution_type);
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't fail the request if notification fails
  }

  return successResponse(contribution);
});

/**
 * GET /api/client/contributions/[id]?workspaceId={id}
 *
 * Get a specific contribution
 *
 * Response: { success: true, contribution: ClientContribution }
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Get contribution
  const { data: contribution, error } = await supabase
    .from('client_contributions')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !contribution) {
    return errorResponse('Contribution not found', 404);
  }

  // Verify ownership
  if (contribution.client_user_id !== user.id) {
    return errorResponse('Unauthorized: You do not own this contribution', 403);
  }

  return successResponse(contribution);
});
