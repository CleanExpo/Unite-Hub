import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guardian G28: Scenario Simulator Service
 * Manage scenario definitions and inspect logged simulation runs
 */

export interface GuardianScenario {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: 'outage' | 'schema_drift' | 'agent_failure' | 'traffic_spike' | 'security' | 'compliance' | 'custom';
  config: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface GuardianScenarioRun {
  id: string;
  tenant_id: string;
  scenario_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  summary: string | null;
  metrics: Record<string, any>;
  created_at: string;
}

export interface GuardianScenarioRunEvent {
  id: string;
  tenant_id: string;
  run_id: string;
  step_index: number;
  phase: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  payload: Record<string, any>;
  created_at: string;
}

/**
 * List scenario definitions for a tenant
 */
export async function listScenarios(tenantId: string): Promise<GuardianScenario[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenarios')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
throw error;
}
  return data as GuardianScenario[];
}

/**
 * Get a specific scenario
 */
export async function getScenario(
  tenantId: string,
  scenarioId: string
): Promise<GuardianScenario | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenarios')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', scenarioId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw error;
  }
  return data as GuardianScenario;
}

/**
 * List scenario runs for a given scenario
 */
export async function listScenarioRuns(
  tenantId: string,
  scenarioId: string
): Promise<GuardianScenarioRun[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenario_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
throw error;
}
  return data as GuardianScenarioRun[];
}

/**
 * Get a specific scenario run
 */
export async function getScenarioRun(
  tenantId: string,
  runId: string
): Promise<GuardianScenarioRun | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenario_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw error;
  }
  return data as GuardianScenarioRun;
}

/**
 * List scenario run events (step-by-step timeline)
 */
export async function listScenarioRunEvents(
  tenantId: string,
  runId: string
): Promise<GuardianScenarioRunEvent[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenario_run_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('run_id', runId)
    .order('step_index', { ascending: true })
    .limit(500);

  if (error) {
throw error;
}
  return data as GuardianScenarioRunEvent[];
}

/**
 * Get active scenarios count
 */
export async function getActiveScenariosCount(tenantId: string): Promise<number> {
  const supabase = supabaseAdmin;

  const { count, error } = await supabase
    .from('guardian_scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
throw error;
}
  return count || 0;
}

/**
 * Get scenario runs by status
 */
export async function getScenarioRunsByStatus(
  tenantId: string,
  status: GuardianScenarioRun['status']
): Promise<GuardianScenarioRun[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('guardian_scenario_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
throw error;
}
  return data as GuardianScenarioRun[];
}
