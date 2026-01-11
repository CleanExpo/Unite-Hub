import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Historical readiness snapshots for a tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const since = req.nextUrl.searchParams.get('since');
  const capabilityKey = req.nextUrl.searchParams.get('capability_key');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '100'), 500);

  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_tenant_readiness_scores')
    .select('computed_at, capability_key, score, status, overall_guardian_score, overall_status')
    .eq('workspace_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte('computed_at', since);
  }

  if (capabilityKey) {
    query = query.eq('capability_key', capabilityKey);
  }

  const { data: scores, error } = await query;

  if (error) {
    return errorResponse('Failed to retrieve readiness history', 500);
  }

  // Group by computed_at to get snapshots
  const snapshots = new Map<string, any[]>();
  (scores || []).forEach((score: any) => {
    const key = score.computed_at;
    if (!snapshots.has(key)) {
      snapshots.set(key, []);
    }
    snapshots.get(key)!.push(score);
  });

  // Build response
  const history = Array.from(snapshots.entries())
    .map(([computedAt, scores]) => ({
      computedAt,
      overallScore: scores[0]?.overall_guardian_score ?? 0,
      overallStatus: scores[0]?.overall_status ?? 'baseline',
      capabilities: scores.map((s: any) => ({
        key: s.capability_key,
        score: s.score,
        status: s.status,
      })),
    }))
    .sort((a, b) => new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime());

  return successResponse({
    history,
    count: history.length,
  });
});
