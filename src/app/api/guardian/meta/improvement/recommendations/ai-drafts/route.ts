import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { generateDraftActionsWithAi } from '@/lib/guardian/meta/improvementPlannerAiHelper';

/**
 * GET /api/guardian/meta/improvement/recommendations/ai-drafts
 * Generate AI-powered draft actions (flag-gated, advisory-only)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const supabase = getSupabaseServer();

    // Get current readiness and adoption scores for context
    const { data: readiness } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score')
      .eq('tenant_id', workspaceId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()
      .catch(() => ({ data: null }));

    const { data: adoption } = await supabase
      .from('guardian_tenant_adoption_scores')
      .select('adoption_rate')
      .eq('tenant_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .catch(() => ({ data: null }));

    const { draftActions, isAdvisory } = await generateDraftActionsWithAi(workspaceId, {
      currentReadinessScore: readiness?.overall_guardian_score,
      adoptionRate: adoption?.adoption_rate,
    });

    return successResponse({
      draftActions,
      count: draftActions.length,
      isAdvisory,
      message: isAdvisory ? 'AI-generated recommendations are advisory only. Review before using.' : undefined,
    });
  } catch (error) {
    console.error('[Z12 AI Drafts API] Failed to generate drafts:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to generate AI drafts', 500);
  }
});
