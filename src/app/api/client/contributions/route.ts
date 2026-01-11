import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse, paginateQuery } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getContributions, createContribution } from '@/lib/services/client-contribution';

/**
 * GET /api/client/contributions?workspaceId={id}&status={status}&type={type}&limit={limit}&offset={offset}
 *
 * Get client contributions with optional filtering
 *
 * Query parameters:
 *   - status: 'pending' | 'approved' | 'published' | 'rejected' (optional)
 *   - type: 'video' | 'photo' | 'voice' | 'text' | 'review' | 'faq' (optional)
 *   - limit: number (default: 10)
 *   - offset: number (default: 0)
 *
 * Response: { success: true, contributions: ClientContribution[], count: number }
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const status = req.nextUrl.searchParams.get('status');
  const type = req.nextUrl.searchParams.get('type');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  // Get contributions with filters
  const contributions = await getContributions(workspaceId, user.id, {
    status: status as any,
    type: type as any,
    limit,
    offset,
  });

  return successResponse({
    contributions,
    count: contributions.length,
    limit,
    offset,
  });
});

/**
 * POST /api/client/contributions?workspaceId={id}
 *
 * Create a new contribution (typically via media upload)
 *
 * Request body:
 *   - media_file_id: string (optional) - Reference to uploaded media file
 *   - contribution_type: string (required) - Type of contribution
 *   - content_text: string (optional) - Text content
 *
 * Response: { success: true, contribution: ClientContribution, points: number }
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  // Validate user and workspace
  const { user } = await validateUserAndWorkspace(req, workspaceId);

  // Parse request body
  const body = await req.json();
  const { media_file_id, contribution_type, content_text } = body;

  // Validate required fields
  if (!contribution_type) {
    return errorResponse('contribution_type is required', 400);
  }

  const validTypes = ['video', 'photo', 'voice', 'text', 'review', 'faq'];
  if (!validTypes.includes(contribution_type)) {
    return errorResponse(
      `Invalid contribution_type. Must be one of: ${validTypes.join(', ')}`,
      400
    );
  }

  // Create contribution
  const contribution = await createContribution(workspaceId, user.id, {
    media_file_id,
    contribution_type,
    content_text,
  });

  return successResponse({
    contribution,
    points: contribution.points_awarded,
  });
});
