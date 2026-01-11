import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * GET /api/guardian/meta/success/overview
 *
 * Provides a high-level CS/BI-friendly overview of Guardian health and adoption.
 * Aggregates data from Z01–Z06 meta layers into a compact, PII-free JSON summary
 * suitable for customer success dashboards and executive reporting.
 *
 * Response: {
 *   readiness: { overall_score, band, last_computed_at, next_compute_at },
 *   editions: [{ key, label, fit_score, fit_status }],
 *   uplift: { active_plans, tasks_done, tasks_total, completion_percentage },
 *   adoption: { dimensions: [{ dimension, status, score }], overall_status },
 *   executive: { reports_last_90d, last_report_date, health_trend },
 *   as_of: timestamp
 * }
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Load latest readiness score (Z01)
  const { data: readinessData } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('overall_score, band, computed_at')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  const readiness = readinessData
    ? {
        overall_score: readinessData.overall_score,
        band: readinessData.band || 'unknown',
        last_computed_at: readinessData.computed_at,
      }
    : { overall_score: 0, band: 'unknown', last_computed_at: null };

  // Load active edition fits (Z03)
  const { data: editionFits } = await supabase
    .from('guardian_tenant_edition_fits')
    .select('edition_key, edition_label, fit_score, fit_status')
    .eq('tenant_id', workspaceId)
    .eq('is_active', true)
    .order('fit_score', { ascending: false });

  const editions = (editionFits || []).map((e: any) => ({
    key: e.edition_key,
    label: e.edition_label,
    fit_score: e.fit_score,
    fit_status: e.fit_status,
  }));

  // Load active uplift plans (Z02)
  const { data: upliftPlans } = await supabase
    .from('guardian_tenant_uplift_plans')
    .select('id, status')
    .eq('tenant_id', workspaceId)
    .in('status', ['draft', 'active']);

  const activePlansCount = upliftPlans?.length || 0;

  // Load uplift task summary
  const { data: upliftTasks } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('status')
    .eq('tenant_id', workspaceId);

  const tasksTotal = upliftTasks?.length || 0;
  const tasksDone = upliftTasks?.filter((t: any) => t.status === 'completed').length || 0;
  const completionPercentage = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const uplift = {
    active_plans: activePlansCount,
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
    completion_percentage: completionPercentage,
  };

  // Load latest adoption scores (Z05)
  const { data: adoptionScores } = await supabase
    .from('guardian_adoption_scores')
    .select('dimension, status, score')
    .eq('tenant_id', workspaceId)
    .order('computed_at', { ascending: false })
    .limit(6); // Get one per dimension

  const adoptionDimensions = (adoptionScores || []).map((a: any) => ({
    dimension: a.dimension,
    status: a.status,
    score: a.score,
  }));

  const overallAdoptionStatus =
    adoptionDimensions.length > 0
      ? adoptionDimensions.every((d: any) => d.status === 'power')
        ? 'power'
        : adoptionDimensions.some((d: any) => d.status === 'inactive')
          ? 'inactive'
          : adoptionDimensions.some((d: any) => d.status === 'light')
            ? 'light'
            : 'regular'
      : 'unknown';

  const adoption = {
    dimensions: adoptionDimensions,
    overall_status: overallAdoptionStatus,
  };

  // Load executive reports (Z04)
  const { data: reports } = await supabase
    .from('guardian_executive_reports')
    .select('created_at')
    .eq('tenant_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const reportsLast90d = reports?.length || 0;
  const lastReportDate = reports && reports.length > 0 ? reports[0].created_at : null;

  const executive = {
    reports_last_90d: reportsLast90d,
    last_report_date: lastReportDate,
  };

  return successResponse({
    readiness,
    editions,
    uplift,
    adoption,
    executive,
    as_of: new Date().toISOString(),
  });
});
