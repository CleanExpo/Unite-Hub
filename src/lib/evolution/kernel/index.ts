import { getSupabaseServer } from '@/lib/supabase';

export interface EvolutionTask {
  id: string;
  tenantId: string;
  taskType: 'optimization' | 'cleanup' | 'enhancement' | 'monitoring' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  sourceSignal: Record<string, unknown>;
  description: string;
  recommendedAction?: string;
  requiresApproval: boolean;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
}

export interface KernelRun {
  id: string;
  tenantId: string;
  tasksGenerated: number;
  signalsProcessed: number;
  runDurationMs?: number;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function runKernel(tenantId: string): Promise<KernelRun | null> {
  const supabase = await getSupabaseServer();
  const startTime = Date.now();

  // Simulate signal collection and task generation
  const tasksGenerated = Math.floor(Math.random() * 5) + 1;
  const signalsProcessed = Math.floor(Math.random() * 20) + 10;

  const { data, error } = await supabase
    .from('evolution_kernel_runs')
    .insert({
      tenant_id: tenantId,
      tasks_generated: tasksGenerated,
      signals_processed: signalsProcessed,
      run_duration_ms: Date.now() - startTime,
      confidence: 0.7 + Math.random() * 0.2,
      uncertainty_notes: 'Signal patterns may not capture all system states'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to run kernel:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    tasksGenerated: data.tasks_generated,
    signalsProcessed: data.signals_processed,
    runDurationMs: data.run_duration_ms,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at
  };
}

export async function getTasks(tenantId: string, status?: string): Promise<EvolutionTask[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('evolution_tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get tasks:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    taskType: row.task_type,
    priority: row.priority,
    sourceSignal: row.source_signal,
    description: row.description,
    recommendedAction: row.recommended_action,
    requiresApproval: row.requires_approval,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at,
    executedAt: row.executed_at
  }));
}

export async function createTask(
  tenantId: string,
  taskType: EvolutionTask['taskType'],
  description: string,
  sourceSignal: Record<string, unknown>,
  priority: EvolutionTask['priority'] = 'medium'
): Promise<EvolutionTask | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_tasks')
    .insert({
      tenant_id: tenantId,
      task_type: taskType,
      priority,
      source_signal: sourceSignal,
      description,
      requires_approval: priority === 'critical' || priority === 'high',
      confidence: 0.6 + Math.random() * 0.3,
      uncertainty_notes: 'Task classification based on heuristic signal matching'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create task:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    taskType: data.task_type,
    priority: data.priority,
    sourceSignal: data.source_signal,
    description: data.description,
    recommendedAction: data.recommended_action,
    requiresApproval: data.requires_approval,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at,
    executedAt: data.executed_at
  };
}
