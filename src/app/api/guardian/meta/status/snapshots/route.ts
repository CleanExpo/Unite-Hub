/**
 * GET /api/guardian/meta/status/snapshots - List snapshot history
 * Query params: viewType=operator|leadership|cs, period=last_7d|last_30d|quarter_to_date, limit=50
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const viewType = req.nextUrl.searchParams.get('viewType') as 'operator' | 'leadership' | 'cs' | null;
  const periodLabel = req.nextUrl.searchParams.get('period') as 'last_7d' | 'last_30d' | 'quarter_to_date' | null;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_status_snapshots')
    .select('id, view_type, period_label, overall_status, headline, captured_at, created_at')
    .eq('tenant_id', workspaceId)
    .order('captured_at', { ascending: false })
    .limit(limit);

  // Optional filtering
  if (viewType) {
    query = query.eq('view_type', viewType);
  }

  if (periodLabel) {
    query = query.eq('period_label', periodLabel);
  }

  const { data, error } = await query;

  if (error) throw error;

  return successResponse({
    snapshots: (data || []).map((s) => ({
      id: s.id,
      viewType: s.view_type,
      periodLabel: s.period_label,
      overallStatus: s.overall_status,
      headline: s.headline,
      capturedAt: s.captured_at,
      createdAt: s.created_at,
    })),
    total: data?.length || 0,
  });
});
