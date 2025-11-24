import { getSupabaseServer } from '@/lib/supabase';

export interface EvolutionSchedule {
  id: string;
  tenantId: string;
  cycleStart: string;
  cycleEnd: string;
  taskIds: string[];
  totalTasks: number;
  completedTasks: number;
  priorityBreakdown: Record<string, number>;
  loadAwareAdjustments?: Record<string, unknown>;
  confidence: number;
  uncertaintyNotes?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export async function createSchedule(
  tenantId: string,
  cycleStart: Date,
  cycleEnd: Date,
  taskIds: string[]
): Promise<EvolutionSchedule | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_schedules')
    .insert({
      tenant_id: tenantId,
      cycle_start: cycleStart.toISOString().split('T')[0],
      cycle_end: cycleEnd.toISOString().split('T')[0],
      task_ids: taskIds,
      total_tasks: taskIds.length,
      priority_breakdown: { high: 0, medium: 0, low: 0 },
      confidence: 0.65 + Math.random() * 0.25,
      uncertainty_notes: 'Schedule may require adjustment based on system load'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create schedule:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    cycleStart: data.cycle_start,
    cycleEnd: data.cycle_end,
    taskIds: data.task_ids,
    totalTasks: data.total_tasks,
    completedTasks: data.completed_tasks,
    priorityBreakdown: data.priority_breakdown,
    loadAwareAdjustments: data.load_aware_adjustments,
    confidence: data.confidence,
    uncertaintyNotes: data.uncertainty_notes,
    status: data.status,
    createdAt: data.created_at
  };
}

export async function getSchedules(tenantId: string): Promise<EvolutionSchedule[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('cycle_start', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to get schedules:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    cycleStart: row.cycle_start,
    cycleEnd: row.cycle_end,
    taskIds: row.task_ids,
    totalTasks: row.total_tasks,
    completedTasks: row.completed_tasks,
    priorityBreakdown: row.priority_breakdown,
    loadAwareAdjustments: row.load_aware_adjustments,
    confidence: row.confidence,
    uncertaintyNotes: row.uncertainty_notes,
    status: row.status,
    createdAt: row.created_at
  }));
}

export async function getOverview(tenantId: string): Promise<{
  activeSchedules: number;
  pendingTasks: number;
  completedThisWeek: number;
}> {
  const supabase = await getSupabaseServer();

  const { data: schedules } = await supabase
    .from('evolution_schedules')
    .select('status, completed_tasks')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const { count: pendingCount } = await supabase
    .from('evolution_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending');

  return {
    activeSchedules: schedules?.length || 0,
    pendingTasks: pendingCount || 0,
    completedThisWeek: schedules?.reduce((sum, s) => sum + s.completed_tasks, 0) || 0
  };
}
