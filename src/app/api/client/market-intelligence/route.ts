/**
 * Market Intelligence API - Overview
 * GET /api/client/market-intelligence
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const clientId = req.nextUrl.searchParams.get('clientId');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!clientId || !workspaceId) {
    return errorResponse('clientId and workspaceId required', 400);
  }

  const supabase = getSupabaseServer();

  // Get summary stats
  const [
    { data: vacuums },
    { data: audits },
    { data: suburbData },
  ] = await Promise.all([
    supabase
      .from('information_vacuums')
      .select('vacuum_type, status, priority, gap_severity')
      .eq('client_id', clientId)
      .eq('workspace_id', workspaceId),

    supabase
      .from('synthex_visual_audits')
      .select('id, keyword, suburb, status, created_at')
      .eq('client_id', clientId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('suburb_authority_substrate')
      .select('*')
      .eq('workspace_id', workspaceId)
      .lte('authority_score', 50) // Gaps only
      .order('authority_score', { ascending: true })
      .limit(20),
  ]);

  const summary = {
    vacuums: {
      total: vacuums?.length || 0,
      geographic: vacuums?.filter(v => v.vacuum_type === 'geographic').length || 0,
      content: vacuums?.filter(v => v.vacuum_type === 'content').length || 0,
      highPriority: vacuums?.filter(v => v.priority >= 8).length || 0,
    },
    audits: {
      total: audits?.length || 0,
      recent: audits || [],
    },
    opportunities: {
      suburbs: suburbData || [],
      avgGapSeverity: suburbData?.length
        ? Math.round(suburbData.reduce((sum, s) => sum + (100 - s.authority_score), 0) / suburbData.length)
        : 0,
    },
  };

  return successResponse(summary);
});
