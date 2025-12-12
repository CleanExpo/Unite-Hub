import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { generateGoalAndKpiSuggestions } from '@/lib/guardian/meta/kpiAiHelper';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * POST /api/guardian/meta/goals/suggestions
 * Generate AI-powered goal and KPI suggestions based on Z-series context
 *
 * Builds context from Z01-Z07 metrics and uses Claude Sonnet to generate
 * advisory goal/OKR/KPI suggestions.
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { enableAiSuggestions = false } = body;

  if (!enableAiSuggestions) {
    return errorResponse('AI suggestions are not enabled. Set enableAiSuggestions: true to proceed.', 400);
  }

  const supabase = getSupabaseServer();

  // Load latest readiness snapshot (Z01)
  const { data: readinessData } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('overall_guardian_score')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  const readinessScore = readinessData?.overall_guardian_score || 0;

  // Load edition fit scores (Z03)
  const { data: editionData } = await supabase
    .from('guardian_edition_fit_scores')
    .select('edition_key, fit_score, status')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(10);

  const editionSummary = (editionData || []).map((e) => ({
    key: e.edition_key,
    fitScore: e.fit_score || 0,
    status: e.status || 'unknown',
  }));

  // Load adoption scores (Z05)
  const { data: adoptionData } = await supabase
    .from('guardian_adoption_scores')
    .select('dimension, status')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(10);

  const adoptionSummary = (adoptionData || []).map((a) => ({
    dimension: a.dimension,
    status: a.status || 'unknown',
  }));

  // Load uplift plans (Z02)
  const { count: activePlans } = await supabase
    .from('guardian_tenant_uplift_plans')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', workspaceId)
    .eq('status', 'active');

  const { count: totalTasks } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', workspaceId);

  const { count: doneTasks } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', workspaceId)
    .eq('status', 'done');

  const upliftSummary = {
    activePlans: activePlans || 0,
    tasksDone: doneTasks || 0,
    tasksTotal: totalTasks || 0,
  };

  // Load executive reports (Z04)
  const { count: reportsCount } = await supabase
    .from('guardian_executive_reports')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  // Determine readiness trend (simplified: assume flat if only one data point)
  const readinessTrend: 'up' | 'down' | 'flat' = 'flat';

  // Generate suggestions via AI
  try {
    const suggestions = await generateGoalAndKpiSuggestions({
      readinessSummary: { score: readinessScore, trend: readinessTrend },
      editionSummary,
      adoptionSummary,
      upliftSummary,
      executiveSummary: { reportsLast90d: reportsCount || 0 },
      timeframeLabel: 'Q1 2025',
    });

    return successResponse({
      suggestions,
      context: {
        readiness_score: readinessScore,
        edition_count: editionSummary.length,
        adoption_dimensions: adoptionSummary.length,
        active_uplift_plans: activePlans,
        executive_reports_90d: reportsCount,
      },
    });
  } catch (error) {
    return errorResponse(
      `Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});
