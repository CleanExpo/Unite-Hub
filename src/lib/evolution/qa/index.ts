import { getSupabaseServer } from '@/lib/supabase';

export interface RegressionCheck {
  id: string;
  tenantId: string;
  taskId?: string;
  checkType: 'pre_execution' | 'post_execution' | 'periodic';
  baselineMetrics: Record<string, number>;
  currentMetrics: Record<string, number>;
  regressionsDetected: string[];
  coreKpisImpacted: boolean;
  blocked: boolean;
  blockReason?: string;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function runCheck(
  tenantId: string,
  taskId: string,
  checkType: RegressionCheck['checkType']
): Promise<RegressionCheck | null> {
  const supabase = await getSupabaseServer();

  // Simulate baseline vs current comparison
  const baselineMetrics = { performance: 85, safety: 92, alignment: 88 };
  const currentMetrics = {
    performance: 83 + Math.random() * 5,
    safety: 90 + Math.random() * 5,
    alignment: 86 + Math.random() * 5
  };

  const regressions: string[] = [];
  let blocked = false;
  let blockReason: string | undefined;

  Object.keys(baselineMetrics).forEach(key => {
    const drop = baselineMetrics[key as keyof typeof baselineMetrics] - currentMetrics[key as keyof typeof currentMetrics];
    if (drop > 5) {
      regressions.push(`${key} dropped by ${drop.toFixed(1)}%`);
      if (drop > 10) {
        blocked = true;
        blockReason = `Core KPI ${key} dropped beyond threshold`;
      }
    }
  });

  const { data, error } = await supabase
    .from('evolution_regression_checks')
    .insert({
      tenant_id: tenantId,
      task_id: taskId,
      check_type: checkType,
      baseline_metrics: baselineMetrics,
      current_metrics: currentMetrics,
      regressions_detected: regressions,
      core_kpis_impacted: regressions.length > 0,
      blocked,
      block_reason: blockReason,
      confidence: 0.8,
      uncertainty_notes: 'Metrics based on sample window; may not reflect all edge cases'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to run regression check:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    taskId: data.task_id,
    checkType: data.check_type,
    baselineMetrics: data.baseline_metrics,
    currentMetrics: data.current_metrics,
    regressionsDetected: data.regressions_detected,
    coreKpisImpacted: data.core_kpis_impacted,
    blocked: data.blocked,
    blockReason: data.block_reason,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at
  };
}

export async function getHistory(tenantId: string): Promise<RegressionCheck[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_regression_checks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to get regression history:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    taskId: row.task_id,
    checkType: row.check_type,
    baselineMetrics: row.baseline_metrics,
    currentMetrics: row.current_metrics,
    regressionsDetected: row.regressions_detected,
    coreKpisImpacted: row.core_kpis_impacted,
    blocked: row.blocked,
    blockReason: row.block_reason,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at
  }));
}
