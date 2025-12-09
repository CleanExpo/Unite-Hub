import { getSupabaseServer } from '@/lib/supabase';

export interface BenchmarkBand {
  id: string;
  metricType: string;
  cohortId: string;
  percentile10?: number;
  percentile25?: number;
  percentile50?: number;
  percentile75?: number;
  percentile90?: number;
  sampleSize: number;
  confidence: number;
  uncertaintyNotes?: string;
  isValid: boolean;
}

export interface TenantBenchmarkReport {
  id: string;
  tenantId: string;
  metricType: string;
  tenantValue: number;
  percentilePosition?: number;
  cohortId: string;
  comparisonNotes?: string;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function getBenchmarkBands(metricType: string, cohortId?: string): Promise<BenchmarkBand[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('benchmark_bands')
    .select('*')
    .eq('metric_type', metricType)
    .eq('is_valid', true);

  if (cohortId) {
    query = query.eq('cohort_id', cohortId);
  }

  const { data, error } = await query;
  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    metricType: row.metric_type,
    cohortId: row.cohort_id,
    percentile10: row.percentile_10,
    percentile25: row.percentile_25,
    percentile50: row.percentile_50,
    percentile75: row.percentile_75,
    percentile90: row.percentile_90,
    sampleSize: row.sample_size,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    isValid: row.is_valid
  }));
}

export async function getTenantBenchmarks(tenantId: string): Promise<TenantBenchmarkReport[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('tenant_benchmark_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
return [];
}

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    metricType: row.metric_type,
    tenantValue: row.tenant_value,
    percentilePosition: row.percentile_position,
    cohortId: row.cohort_id,
    comparisonNotes: row.comparison_notes,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at
  }));
}

export async function generateBenchmarkReport(
  tenantId: string,
  metricType: string,
  tenantValue: number,
  cohortId: string
): Promise<TenantBenchmarkReport | null> {
  const supabase = await getSupabaseServer();

  const bands = await getBenchmarkBands(metricType, cohortId);
  if (bands.length === 0) {
return null;
}

  const band = bands[0];
  let percentilePosition: number | undefined;

  if (band.percentile50) {
    if (tenantValue <= (band.percentile10 || 0)) {
percentilePosition = 10;
} else if (tenantValue <= (band.percentile25 || 0)) {
percentilePosition = 25;
} else if (tenantValue <= band.percentile50) {
percentilePosition = 50;
} else if (tenantValue <= (band.percentile75 || 100)) {
percentilePosition = 75;
} else {
percentilePosition = 90;
}
  }

  const { data, error } = await supabase
    .from('tenant_benchmark_reports')
    .insert({
      tenant_id: tenantId,
      metric_type: metricType,
      tenant_value: tenantValue,
      percentile_position: percentilePosition,
      cohort_id: cohortId,
      confidence: band.sampleSize >= 10 ? 0.8 : 0.5,
      uncertainty_notes: band.sampleSize < 10
        ? 'Small sample size reduces benchmark reliability'
        : 'Benchmark based on anonymised cohort data'
    })
    .select()
    .single();

  if (error) {
return null;
}

  return {
    id: data.id,
    tenantId: data.tenant_id,
    metricType: data.metric_type,
    tenantValue: data.tenant_value,
    percentilePosition: data.percentile_position,
    cohortId: data.cohort_id,
    comparisonNotes: data.comparison_notes,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at
  };
}
