import { getSupabaseServer } from '@/lib/supabase';

export interface LearningLoopRun {
  id: string;
  runType: 'daily' | 'weekly' | 'manual';
  patternsCollected: number;
  benchmarksUpdated: number;
  cohortsProcessed: number;
  insightsDistributed: number;
  tibeValidationsPassed: number;
  tibeValidationsFailed: number;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

export interface TenantInsightPacket {
  id: string;
  tenantId: string;
  runId: string;
  insights: Array<{ type: string; content: string }>;
  patternSuggestions: string[];
  benchmarkUpdates: string[];
  confidence: number;
  uncertaintyNotes?: string;
  wasDelivered: boolean;
  createdAt: string;
}

export async function getLearningRuns(): Promise<LearningLoopRun[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('learning_loop_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(30);

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    runType: row.run_type,
    patternsCollected: row.patterns_collected,
    benchmarksUpdated: row.benchmarks_updated,
    cohortsProcessed: row.cohorts_processed,
    insightsDistributed: row.insights_distributed,
    tibeValidationsPassed: row.tibe_validations_passed,
    tibeValidationsFailed: row.tibe_validations_failed,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at
  }));
}

export async function getTenantInsightPackets(tenantId: string): Promise<TenantInsightPacket[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('tenant_insight_packets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    runId: row.run_id,
    insights: row.insights,
    patternSuggestions: row.pattern_suggestions,
    benchmarkUpdates: row.benchmark_updates,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    wasDelivered: row.was_delivered,
    createdAt: row.created_at
  }));
}

export async function startLearningRun(runType: LearningLoopRun['runType']): Promise<string | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('learning_loop_runs')
    .insert({
      run_type: runType,
      confidence: 0.7,
      uncertainty_notes: 'Learning loop results depend on cross-tenant data availability'
    })
    .select('id')
    .single();

  return error ? null : data.id;
}
