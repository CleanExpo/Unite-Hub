/**
 * GET /api/guardian/meta/automation/executions - List executions
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  const status = req.nextUrl.searchParams.get('status');

  let query = supabase
    .from('guardian_meta_automation_executions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', workspaceId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return successResponse({
    executions: data || [],
    total: count || 0,
    limit,
    offset,
  });
});
