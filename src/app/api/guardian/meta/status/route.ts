/**
 * GET /api/guardian/meta/status - Fetch live or snapshot status view
 * Query params: viewType=operator|leadership|cs, period=last_7d|last_30d|quarter_to_date, live=1|0
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { loadMetaStateForStatus, buildStatusCards, loadMetaGovernancePrefsForTenant } from '@/lib/guardian/meta/statusPageService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const viewType = (req.nextUrl.searchParams.get('viewType') || 'operator') as 'operator' | 'leadership' | 'cs';
  const periodLabel = (req.nextUrl.searchParams.get('period') || 'last_30d') as 'last_7d' | 'last_30d' | 'quarter_to_date';
  const live = req.nextUrl.searchParams.get('live') === '1';

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Load governance prefs for redaction
  const { data: prefs } = await supabase
    .from('guardian_meta_governance_prefs')
    .select('external_sharing_policy')
    .eq('tenant_id', workspaceId)
    .single();

  // Determine period range
  const end = new Date();
  const start = new Date();

  if (periodLabel === 'last_7d') {
    start.setDate(start.getDate() - 7);
  } else if (periodLabel === 'last_30d') {
    start.setDate(start.getDate() - 30);
  } else if (periodLabel === 'quarter_to_date') {
    const q = Math.floor((end.getMonth() + 1) / 3);
    start.setMonth((q - 1) * 3, 1);
  }

  if (live) {
    // Compute live status (no persistence)
    const metaState = await loadMetaStateForStatus(workspaceId, { start, end });
    const view = buildStatusCards(viewType, metaState, prefs);

    return successResponse({
      status: 'live',
      source: 'computed',
      data: view,
    });
  }

  // Fetch latest snapshot for viewType + periodLabel
  const { data: snapshot } = await supabase
    .from('guardian_meta_status_snapshots')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('view_type', viewType)
    .eq('period_label', periodLabel)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (snapshot) {
    return successResponse({
      status: 'snapshot',
      source: 'persisted',
      capturedAt: snapshot.captured_at,
      data: {
        overallStatus: snapshot.overall_status,
        headline: snapshot.headline,
        cards: snapshot.cards,
        blockers: snapshot.blockers,
        warnings: snapshot.warnings,
        periodLabel,
        viewType,
        capturedAt: new Date(snapshot.captured_at),
      },
    });
  }

  // Fallback: compute live if no snapshot exists
  const metaState = await loadMetaStateForStatus(workspaceId, { start, end });
  const view = buildStatusCards(viewType, metaState, prefs);

  return successResponse({
    status: 'live',
    source: 'computed_fallback',
    data: view,
  });
});
