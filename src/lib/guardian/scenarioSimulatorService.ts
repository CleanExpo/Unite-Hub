import { supabaseAdmin } from '@/lib/supabase/admin';

export interface GuardianScenario {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  severity?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface GuardianScenarioRun {
  id: string;
  tenant_id: string;
  scenario_id: string;
  status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
  metadata?: Record<string, any> | null;
}

export interface GuardianScenarioRunEvent {
  id: string;
  tenant_id: string;
  run_id: string;
  occurred_at: string;
  level?: string | null;
  category?: string | null;
  payload: Record<string, any>;
  created_at?: string;
}

export async function listScenarios(tenantId: string): Promise<GuardianScenario[]> {
  const { data, error } = await supabaseAdmin
    .from('guardian_scenarios')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data as GuardianScenario[]) || [];
}

export async function listScenarioRuns(
  tenantId: string,
  scenarioId: string
): Promise<GuardianScenarioRun[]> {
  const { data, error } = await supabaseAdmin
    .from('guardian_scenario_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data as GuardianScenarioRun[]) || [];
}

export async function listScenarioRunEvents(
  tenantId: string,
  runId: string,
  limit = 400
): Promise<GuardianScenarioRunEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('guardian_scenario_run_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('run_id', runId)
    .order('occurred_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as GuardianScenarioRunEvent[]) || [];
}
