import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Latest readiness snapshot for a tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Get the most recent readiness snapshot
  const { data: latestScores, error } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('*, guardian_capability_manifest(key, label, category, description)')
    .eq('workspace_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(50); // Get up to 50 most recent entries (one per capability per snapshot)

  if (error) {
    return errorResponse('Failed to retrieve readiness scores', 500);
  }

  if (!latestScores || latestScores.length === 0) {
    return successResponse({
      computedAt: null,
      overall: { score: 0, status: 'baseline' },
      capabilities: [],
    });
  }

  // Find the most recent computed_at timestamp
  const latestComputedAt = latestScores[0].computed_at;

  // Get all scores from that snapshot
  const snapshot = latestScores.filter((score: any) => score.computed_at === latestComputedAt);

  // Extract overall score and status from first entry (same for all in snapshot)
  const overallScore = snapshot[0].overall_guardian_score ?? 0;
  const overallStatus = snapshot[0].overall_status ?? 'baseline';

  // Build capabilities response
  const capabilities = snapshot.map((score: any) => ({
    key: score.capability_key,
    label: score.guardian_capability_manifest?.label ?? score.capability_key,
    category: score.guardian_capability_manifest?.category ?? 'unknown',
    description: score.guardian_capability_manifest?.description ?? '',
    score: score.score,
    status: score.status,
    details: score.details,
  }));

  return successResponse({
    computedAt: latestComputedAt,
    overall: {
      score: overallScore,
      status: overallStatus,
    },
    capabilities,
  });
});
