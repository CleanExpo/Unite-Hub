import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * GET /api/guardian/meta/success/history
 *
 * Provides time-series data of Guardian health and adoption over a period.
 * Query params:
 *   - from: ISO8601 date (default: 90 days ago)
 *   - to: ISO8601 date (default: now)
 *   - granularity: 'daily' | 'weekly' | 'monthly' (default: 'weekly')
 *
 * Response: {
 *   periods: [
 *     {
 *       period_start,
 *       period_end,
 *       readiness_score,
 *       readiness_band,
 *       edition_fit_score,
 *       adoption_overall_status,
 *       adoption_score,
 *       uplift_tasks_done,
 *       uplift_tasks_total,
 *       report_count
 *     }
 *   ],
 *   granularity,
 *   as_of: timestamp
 * }
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const fromParam = req.nextUrl.searchParams.get('from');
  const toParam = req.nextUrl.searchParams.get('to');
  const granularityParam = req.nextUrl.searchParams.get('granularity') || 'weekly';

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  const supabase = getSupabaseServer();

  // Load readiness snapshots in date range
  const { data: readinessSnapshots } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select('computed_at, overall_score, band')
    .eq('tenant_id', workspaceId)
    .gte('computed_at', from.toISOString())
    .lte('computed_at', to.toISOString())
    .order('computed_at', { ascending: true });

  // Load adoption scores in date range
  const { data: adoptionSnapshots } = await supabase
    .from('guardian_adoption_scores')
    .select('computed_at, status, score')
    .eq('tenant_id', workspaceId)
    .gte('computed_at', from.toISOString())
    .lte('computed_at', to.toISOString())
    .order('computed_at', { ascending: true });

  // Load edition fit snapshots in date range
  const { data: editionSnapshots } = await supabase
    .from('guardian_tenant_edition_fits')
    .select('computed_at, fit_score')
    .eq('tenant_id', workspaceId)
    .gte('computed_at', from.toISOString())
    .lte('computed_at', to.toISOString())
    .order('computed_at', { ascending: true });

  // Load executive reports in date range
  const { data: reports } = await supabase
    .from('guardian_executive_reports')
    .select('created_at')
    .eq('tenant_id', workspaceId)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  // Load uplift tasks in date range
  const { data: upliftTasks } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('created_at, status')
    .eq('tenant_id', workspaceId)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  // Aggregate data by period
  const periods = generatePeriods(from, to, granularityParam as 'daily' | 'weekly' | 'monthly');

  const periodData = periods.map((period) => {
    // Find readiness snapshot closest to period end
    const readinessInPeriod = (readinessSnapshots || []).filter(
      (r: any) => new Date(r.computed_at) >= period.period_start && new Date(r.computed_at) <= period.period_end
    );
    const latestReadiness = readinessInPeriod.length > 0 ? readinessInPeriod[readinessInPeriod.length - 1] : null;

    // Aggregate adoption scores for period
    const adoptionInPeriod = (adoptionSnapshots || []).filter(
      (a: any) => new Date(a.computed_at) >= period.period_start && new Date(a.computed_at) <= period.period_end
    );
    const adoptionAvgScore =
      adoptionInPeriod.length > 0
        ? adoptionInPeriod.reduce((sum: number, a: any) => sum + a.score, 0) / adoptionInPeriod.length
        : 0;
    const adoptionStatus =
      adoptionInPeriod.length > 0
        ? adoptionInPeriod[adoptionInPeriod.length - 1].status
        : 'unknown';

    // Aggregate edition fit for period
    const editionInPeriod = (editionSnapshots || []).filter(
      (e: any) => new Date(e.computed_at) >= period.period_start && new Date(e.computed_at) <= period.period_end
    );
    const latestEditionFit = editionInPeriod.length > 0 ? editionInPeriod[editionInPeriod.length - 1] : null;

    // Count reports in period
    const reportsInPeriod = (reports || []).filter(
      (r: any) => new Date(r.created_at) >= period.period_start && new Date(r.created_at) <= period.period_end
    );

    // Count uplift tasks in period
    const tasksInPeriod = (upliftTasks || []).filter(
      (t: any) => new Date(t.created_at) >= period.period_start && new Date(t.created_at) <= period.period_end
    );
    const tasksDone = tasksInPeriod.filter((t: any) => t.status === 'completed').length;

    return {
      period_start: period.period_start.toISOString(),
      period_end: period.period_end.toISOString(),
      readiness_score: latestReadiness?.overall_score || 0,
      readiness_band: latestReadiness?.band || 'unknown',
      edition_fit_score: latestEditionFit?.fit_score || 0,
      adoption_overall_status: adoptionStatus,
      adoption_score: adoptionAvgScore,
      uplift_tasks_done: tasksDone,
      uplift_tasks_total: tasksInPeriod.length,
      report_count: reportsInPeriod.length,
    };
  });

  return successResponse({
    periods: periodData,
    granularity: granularityParam,
    as_of: new Date().toISOString(),
  });
});

/**
 * Generate period boundaries based on granularity.
 */
function generatePeriods(
  from: Date,
  to: Date,
  granularity: 'daily' | 'weekly' | 'monthly'
): { period_start: Date; period_end: Date }[] {
  const periods: { period_start: Date; period_end: Date }[] = [];
  let current = new Date(from);

  const increment = (date: Date) => {
    if (granularity === 'daily') {
      date.setDate(date.getDate() + 1);
    } else if (granularity === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else if (granularity === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    }
  };

  while (current < to) {
    const periodStart = new Date(current);
    const periodEnd = new Date(current);
    increment(periodEnd);

    // Cap to requested 'to' date
    if (periodEnd > to) {
      periodEnd.setTime(to.getTime());
    }

    periods.push({ period_start: periodStart, period_end: periodEnd });
    current = new Date(periodEnd);
  }

  return periods;
}
