/**
 * Get Visual Audit Details
 * GET /api/client/market-intelligence/audits/[id]
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('synthex_visual_audits')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return errorResponse('Visual audit not found', 404);
  }

  return successResponse(data);
});
