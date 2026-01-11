/**
 * Guardian I04: Remediation Orchestrator
 *
 * Orchestrates end-to-end remediation simulation workflow:
 * 1. Load playbook from DB
 * 2. Create simulation run record
 * 3. Call remediation simulator
 * 4. Persist results to DB
 * 5. Handle errors gracefully
 *
 * All operations are tenant-scoped and simulation-only (no production writes).
 */

import { getSupabaseServer } from '@/lib/supabase';
import { simulateRemediation } from './remediationSimulator';
import { GuardianRemediationPlaybookConfig } from './remediationPlaybookTypes';

export interface RemediationSimulationRunRequest {
  tenantId: string;
  playbookId: string;
  windowDays?: number;
  actor?: string;
}

export interface RemediationSimulationRunResponse {
  runId: string;
  playbookId: string;
  status: 'completed' | 'failed';
  baselineMetrics?: {
    alerts_total: number;
    alerts_by_severity: Record<string, number>;
    incidents_total: number;
    incidents_by_status: Record<string, number>;
    correlations_total: number;
    notifications_total: number;
    avg_risk_score: number;
    window_days: number;
  };
  simulatedMetrics?: {
    alerts_total: number;
    alerts_by_severity: Record<string, number>;
    incidents_total: number;
    incidents_by_status: Record<string, number>;
    correlations_total: number;
    notifications_total: number;
    avg_risk_score: number;
    window_days: number;
    computed_at: string;
  };
  deltaMetrics?: {
    alerts_delta: number;
    alerts_pct: number;
    incidents_delta: number;
    incidents_pct: number;
    correlations_delta: number;
    correlations_pct: number;
    notifications_delta: number;
    notifications_pct: number;
    avg_risk_score_delta: number;
    avg_risk_score_pct: number;
  };
  overall_effect?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  error_message?: string;
  finished_at: string;
}

/**
 * Run a remediation simulation: load playbook, simulate, and persist results
 */
export async function runRemediationSimulation(
  req: RemediationSimulationRunRequest
): Promise<RemediationSimulationRunResponse> {
  const supabase = getSupabaseServer();
  const windowDays = req.windowDays || 30;

  let runId = '';
  const startedAt = new Date().toISOString();

  try {
    // Step 1: Load playbook from DB
    const { data: playbook, error: playbookError } = await supabase
      .from('guardian_remediation_playbooks')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .eq('id', req.playbookId)
      .single();

    if (playbookError || !playbook) {
      throw new Error(`Playbook not found: ${req.playbookId}`);
    }

    if (!playbook.is_active) {
      throw new Error(`Playbook is not active: ${playbook.name}`);
    }

    // Step 2: Create simulation run record (status='running')
    const { data: run, error: createRunError } = await supabase
      .from('guardian_remediation_simulation_runs')
      .insert({
        tenant_id: req.tenantId,
        playbook_id: req.playbookId,
        status: 'running',
        started_at: startedAt,
        actor: req.actor || 'system',
      })
      .select('id')
      .single();

    if (createRunError || !run) {
      throw createRunError || new Error('Failed to create simulation run record');
    }

    runId = run.id;

    // Step 3: Call remediation simulator
    const playbookConfig: GuardianRemediationPlaybookConfig = playbook.config;

    const simulationResult = await simulateRemediation(req.tenantId, playbookConfig, windowDays);

    // Step 4: Update run with results and mark status='completed'
    const { error: updateError } = await supabase
      .from('guardian_remediation_simulation_runs')
      .update({
        status: 'completed',
        baseline_metrics: simulationResult.baseline,
        simulated_metrics: simulationResult.simulated,
        delta_metrics: simulationResult.delta,
        overall_effect: simulationResult.overall_effect,
        summary: simulationResult.summary,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Error updating simulation run:', updateError);
      throw updateError;
    }

    return {
      runId,
      playbookId: req.playbookId,
      status: 'completed',
      baselineMetrics: simulationResult.baseline,
      simulatedMetrics: simulationResult.simulated,
      deltaMetrics: simulationResult.delta,
      overall_effect: simulationResult.overall_effect,
      summary: simulationResult.summary,
      finished_at: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during simulation';

    // If run was created, mark as failed
    if (runId) {
      try {
        await supabase
          .from('guardian_remediation_simulation_runs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            finished_at: new Date().toISOString(),
          })
          .eq('id', runId);
      } catch (updateErr) {
        console.error('Error marking run as failed:', updateErr);
      }
    }

    return {
      runId: runId || 'unknown',
      playbookId: req.playbookId,
      status: 'failed',
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
    };
  }
}

/**
 * Get simulation run by ID (tenant-scoped via RLS)
 */
export async function getSimulationRun(tenantId: string, runId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_remediation_simulation_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * List simulation runs for a playbook (tenant-scoped, paginated)
 */
export async function listSimulationRuns(
  tenantId: string,
  playbookId: string,
  limit: number = 10,
  offset: number = 0
) {
  const supabase = getSupabaseServer();

  const { data, error, count } = await supabase
    .from('guardian_remediation_simulation_runs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('playbook_id', playbookId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
throw error;
}
  return { runs: data || [], total: count || 0 };
}

/**
 * List all simulation runs for tenant (tenant-scoped, paginated)
 */
export async function listAllSimulationRuns(
  tenantId: string,
  limit: number = 20,
  offset: number = 0
) {
  const supabase = getSupabaseServer();

  const { data, error, count } = await supabase
    .from('guardian_remediation_simulation_runs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
throw error;
}
  return { runs: data || [], total: count || 0 };
}
