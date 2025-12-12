import { getSupabaseServer } from '@/lib/supabase';

/**
 * Guardian Z08: KPI Evaluation Service
 *
 * Resolves KPI metrics from Z-series data (Z01-Z07) and evaluates
 * against target values to compute status (behind/on_track/ahead).
 *
 * Snapshots are persisted for audit trail and trend analysis.
 */

export type GuardianKpiSourceDomain =
  | 'readiness'
  | 'editions'
  | 'uplift'
  | 'adoption'
  | 'executive'
  | 'lifecycle';

export interface GuardianKpiDefinition {
  id: string;
  tenantId: string;
  okrId: string;
  kpiKey: string;
  label: string;
  description: string;
  targetValue: number;
  targetDirection: 'increase' | 'decrease' | 'maintain';
  unit: string;
  sourceMetric: string;
  sourcePath: {
    domain: GuardianKpiSourceDomain;
    metric: string;
    [key: string]: unknown;
  };
}

export interface GuardianKpiEvaluationContext {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  now: Date;
}

export interface GuardianKpiEvaluationResult {
  currentValue: number;
  status: 'behind' | 'on_track' | 'ahead';
  delta?: number;
}

/**
 * Resolve metric value from Z-series data based on source domain
 */
async function resolveKpiMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext
): Promise<number> {
  const { domain, metric } = kpi.sourcePath;
  const supabase = getSupabaseServer();

  switch (domain) {
    case 'readiness':
      return await resolveReadinessMetric(kpi, ctx, supabase);

    case 'adoption':
      return await resolveAdoptionMetric(kpi, ctx, supabase);

    case 'uplift':
      return await resolveUpliftMetric(kpi, ctx, supabase);

    case 'editions':
      return await resolveEditionsMetric(kpi, ctx, supabase);

    case 'executive':
      return await resolveExecutiveMetric(kpi, ctx, supabase);

    case 'lifecycle':
      return await resolveLifecycleMetric(kpi, ctx, supabase);

    default:
      return 0;
  }
}

/**
 * Z01 Readiness: Resolve overall_guardian_score, capability scores, etc.
 */
async function resolveReadinessMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;

  if (metric === 'overall_guardian_score') {
    const { data } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score')
      .eq('tenant_id', ctx.tenantId)
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.overall_guardian_score || 0;
  }

  // capability_score:capability_key (e.g., "capability_score:rules_engine")
  if (metric.startsWith('capability_score:')) {
    const capabilityKey = metric.split(':')[1];
    const { data } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('score')
      .eq('tenant_id', ctx.tenantId)
      .eq('capability_key', capabilityKey)
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.score || 0;
  }

  return 0;
}

/**
 * Z05 Adoption: Resolve core_score, network_score, dimension scores, etc.
 */
async function resolveAdoptionMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;
  const sourcePath = kpi.sourcePath as { dimension?: string; subdimension?: string };

  if (metric === 'core_score') {
    const { data } = await supabase
      .from('guardian_adoption_scores')
      .select('score')
      .eq('tenant_id', ctx.tenantId)
      .eq('dimension', 'core')
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.score || 0;
  }

  if (metric === 'network_score') {
    const { data } = await supabase
      .from('guardian_adoption_scores')
      .select('score')
      .eq('tenant_id', ctx.tenantId)
      .eq('dimension', 'network')
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.score || 0;
  }

  // dimension:dimension_key:subdimension (e.g., "dimension:core:rules_engine")
  if (metric.startsWith('dimension:')) {
    const parts = metric.split(':');
    const dimension = parts[1];
    const subdimension = parts[2];

    const { data } = await supabase
      .from('guardian_adoption_scores')
      .select('score')
      .eq('tenant_id', ctx.tenantId)
      .eq('dimension', dimension)
      .eq('sub_dimension', subdimension)
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.score || 0;
  }

  return 0;
}

/**
 * Z02 Uplift: Resolve task completion ratios, plan counts, etc.
 */
async function resolveUpliftMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;

  if (metric === 'tasks_done_ratio') {
    // Compute ratio of completed tasks to total tasks in period
    const { data: doneCount } = await supabase
      .from('guardian_tenant_uplift_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId)
      .eq('status', 'done')
      .gte('created_at', ctx.periodStart.toISOString())
      .lte('created_at', ctx.periodEnd.toISOString());

    const { data: totalCount } = await supabase
      .from('guardian_tenant_uplift_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId)
      .gte('created_at', ctx.periodStart.toISOString())
      .lte('created_at', ctx.periodEnd.toISOString());

    const total = totalCount?.length || 0;
    const done = doneCount?.length || 0;

    return total > 0 ? (done / total) * 100 : 0;
  }

  if (metric === 'active_plans_count') {
    const { count } = await supabase
      .from('guardian_tenant_uplift_plans')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId)
      .eq('status', 'active');

    return count || 0;
  }

  return 0;
}

/**
 * Z03 Editions: Resolve edition fit scores
 */
async function resolveEditionsMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;
  const sourcePath = kpi.sourcePath as { edition_key?: string };

  if (metric === 'avg_fit_score') {
    // Average fit score across all editions
    const { data } = await supabase
      .from('guardian_edition_fit_scores')
      .select('fit_score')
      .eq('tenant_id', ctx.tenantId)
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false });

    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + (row.fit_score || 0), 0);
    return sum / data.length;
  }

  if (metric === 'edition_fit' && sourcePath.edition_key) {
    // Fit score for specific edition
    const { data } = await supabase
      .from('guardian_edition_fit_scores')
      .select('fit_score')
      .eq('tenant_id', ctx.tenantId)
      .eq('edition_key', sourcePath.edition_key)
      .gte('computed_at', ctx.periodStart.toISOString())
      .lte('computed_at', ctx.periodEnd.toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return data?.fit_score || 0;
  }

  return 0;
}

/**
 * Z04 Executive: Resolve report counts, generation frequency, etc.
 */
async function resolveExecutiveMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;

  if (metric === 'reports_count') {
    const { count } = await supabase
      .from('guardian_executive_reports')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId)
      .gte('created_at', ctx.periodStart.toISOString())
      .lte('created_at', ctx.periodEnd.toISOString());

    return count || 0;
  }

  return 0;
}

/**
 * Z06 Lifecycle: Resolve data retention, archival rates, etc.
 */
async function resolveLifecycleMetric(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<number> {
  const { metric } = kpi.sourcePath;

  if (metric === 'lifecycle_policies_active') {
    const { count } = await supabase
      .from('guardian_meta_lifecycle_policies')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId)
      .eq('archive_enabled', true);

    return count || 0;
  }

  return 0;
}

/**
 * Evaluate a single KPI against its target
 *
 * Returns status classification (behind/on_track/ahead) based on:
 * - target_value and target_direction (increase/decrease/maintain)
 * - 10% tolerance window around target
 * - delta vs previous snapshot
 */
export async function evaluateKpi(
  kpi: GuardianKpiDefinition,
  ctx: GuardianKpiEvaluationContext
): Promise<GuardianKpiEvaluationResult> {
  const supabase = getSupabaseServer();
  const currentValue = await resolveKpiMetric(kpi, ctx);

  // Load previous snapshot for delta calculation
  const { data: prevSnapshot } = await supabase
    .from('guardian_program_kpi_snapshots')
    .select('current_value')
    .eq('kpi_id', kpi.id)
    .lt('period_start', ctx.periodStart.toISOString().split('T')[0])
    .order('period_start', { ascending: false })
    .limit(1)
    .single();

  const delta = prevSnapshot ? currentValue - prevSnapshot.current_value : undefined;

  // Determine status based on direction and tolerance
  let status: 'behind' | 'on_track' | 'ahead';
  const tolerance = 0.1; // 10% tolerance window
  const targetMin = kpi.targetValue * (1 - tolerance);
  const targetMax = kpi.targetValue * (1 + tolerance);

  if (kpi.targetDirection === 'increase') {
    if (currentValue >= kpi.targetValue) {
      status = 'ahead';
    } else if (currentValue >= targetMin) {
      status = 'on_track';
    } else {
      status = 'behind';
    }
  } else if (kpi.targetDirection === 'decrease') {
    if (currentValue <= kpi.targetValue) {
      status = 'ahead';
    } else if (currentValue <= targetMax) {
      status = 'on_track';
    } else {
      status = 'behind';
    }
  } else {
    // maintain
    if (currentValue >= targetMin && currentValue <= targetMax) {
      status = 'on_track';
    } else {
      status = currentValue < targetMin ? 'behind' : 'ahead';
    }
  }

  return { currentValue, status, delta };
}

/**
 * Evaluate all KPIs for a tenant in given period
 *
 * Loads KPIs, evaluates each against Z-series metrics, and persists
 * snapshots for trend analysis.
 */
export async function evaluateAllKpisForTenant(
  ctx: GuardianKpiEvaluationContext
): Promise<Array<{ kpiId: string; result: GuardianKpiEvaluationResult }>> {
  const supabase = getSupabaseServer();

  // Load all KPIs for tenant
  const { data: kpis } = await supabase
    .from('guardian_program_kpis')
    .select('*')
    .eq('tenant_id', ctx.tenantId);

  if (!kpis || kpis.length === 0) return [];

  const results = await Promise.all(
    kpis.map(async (kpiRow) => {
      const kpi: GuardianKpiDefinition = {
        id: kpiRow.id,
        tenantId: kpiRow.tenant_id,
        okrId: kpiRow.okr_id,
        kpiKey: kpiRow.kpi_key,
        label: kpiRow.label,
        description: kpiRow.description,
        targetValue: kpiRow.target_value,
        targetDirection: kpiRow.target_direction,
        unit: kpiRow.unit,
        sourceMetric: kpiRow.source_metric,
        sourcePath: kpiRow.source_path,
      };

      const result = await evaluateKpi(kpi, ctx);

      // Persist snapshot for audit trail
      await supabase.from('guardian_program_kpi_snapshots').insert([
        {
          tenant_id: ctx.tenantId,
          kpi_id: kpi.id,
          period_start: ctx.periodStart.toISOString().split('T')[0],
          period_end: ctx.periodEnd.toISOString().split('T')[0],
          computed_at: ctx.now.toISOString(),
          current_value: result.currentValue,
          target_value: kpi.targetValue,
          target_direction: kpi.targetDirection,
          unit: kpi.unit,
          status: result.status,
          delta: result.delta,
        },
      ]);

      return { kpiId: kpi.id, result };
    })
  );

  return results;
}

/**
 * Get KPI evaluation results for a specific goal
 *
 * Aggregates KPI snapshots by OKR to show progress toward goal
 */
export async function getGoalKpiResults(
  goalId: string,
  tenantId: string
): Promise<
  Array<{
    okrId: string;
    objective: string;
    kpis: Array<{
      kpiId: string;
      label: string;
      currentValue: number;
      targetValue: number;
      status: 'behind' | 'on_track' | 'ahead';
      unit: string;
    }>;
  }>
> {
  const supabase = getSupabaseServer();

  // Load OKRs for goal
  const { data: okrs } = await supabase
    .from('guardian_program_okrs')
    .select('*')
    .eq('goal_id', goalId)
    .eq('tenant_id', tenantId);

  if (!okrs || okrs.length === 0) return [];

  const results = await Promise.all(
    okrs.map(async (okr) => {
      // Load KPIs for OKR
      const { data: kpis } = await supabase
        .from('guardian_program_kpis')
        .select('*')
        .eq('okr_id', okr.id)
        .eq('tenant_id', tenantId);

      // Get latest snapshot for each KPI
      const kpiResults = await Promise.all(
        (kpis || []).map(async (kpi) => {
          const { data: latestSnapshot } = await supabase
            .from('guardian_program_kpi_snapshots')
            .select('*')
            .eq('kpi_id', kpi.id)
            .eq('tenant_id', tenantId)
            .order('computed_at', { ascending: false })
            .limit(1)
            .single();

          return {
            kpiId: kpi.id,
            label: kpi.label,
            currentValue: latestSnapshot?.current_value || 0,
            targetValue: kpi.target_value,
            status: latestSnapshot?.status || 'behind',
            unit: kpi.unit,
          };
        })
      );

      return {
        okrId: okr.id,
        objective: okr.objective,
        kpis: kpiResults,
      };
    })
  );

  return results;
}
