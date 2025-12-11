/**
 * Guardian I05: QA Baseline Manager
 *
 * Purpose:
 * Create, list, and manage baseline snapshots for drift detection
 * Baselines capture aggregate metrics from I-series runs
 *
 * Ensures tenant isolation and prevents mixing baselines across tenants
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  extractMetricsFromRegressionRun,
  extractMetricsFromSimulationRun,
  extractMetricsFromPlaybookSimulationRun,
  type GuardianQaMetrics,
} from './qaMetrics';

/**
 * Options for baseline creation
 */
export interface CreateBaselineOptions {
  description?: string;
  comparisonWindow?: string;
  isReference?: boolean;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Baseline record as returned from database
 */
export interface GuardianQaBaseline {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  scope: string;
  source_type: string;
  source_id: string;
  captured_at: string;
  metrics: GuardianQaMetrics;
  comparison_window?: string;
  is_reference: boolean;
  created_by?: string;
  metadata: Record<string, unknown>;
}

/**
 * Create baseline from a regression run (I03)
 */
export async function createBaselineFromRegressionRun(
  tenantId: string,
  name: string,
  regressionRunId: string,
  options: CreateBaselineOptions = {}
): Promise<GuardianQaBaseline> {
  const supabase = getSupabaseServer();

  // Verify regression run belongs to this tenant
  const { data: regressionRun, error: runError } = await supabase
    .from('guardian_regression_runs')
    .select('tenant_id, id')
    .eq('tenant_id', tenantId)
    .eq('id', regressionRunId)
    .single();

  if (runError || !regressionRun) {
    throw new Error(
      `Regression run ${regressionRunId} not found in tenant ${tenantId}: ${runError?.message}`
    );
  }

  // Extract metrics
  const metrics = await extractMetricsFromRegressionRun(tenantId, regressionRunId);

  // Insert baseline
  const { data, error } = await supabase
    .from('guardian_qa_baselines')
    .insert({
      tenant_id: tenantId,
      name,
      description: options.description,
      scope: 'regression_pack',
      source_type: 'regression_run',
      source_id: regressionRunId,
      captured_at: new Date().toISOString(),
      metrics,
      comparison_window: options.comparisonWindow,
      is_reference: options.isReference || false,
      created_by: options.createdBy,
      metadata: options.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create baseline: ${error.message}`);
  }

  return data as GuardianQaBaseline;
}

/**
 * Create baseline from a simulation run (I01/I02)
 */
export async function createBaselineFromSimulationRun(
  tenantId: string,
  name: string,
  simulationRunId: string,
  options: CreateBaselineOptions = {}
): Promise<GuardianQaBaseline> {
  const supabase = getSupabaseServer();

  // Verify simulation run belongs to this tenant
  const { data: simRun, error: runError } = await supabase
    .from('guardian_simulation_runs')
    .select('tenant_id, id')
    .eq('tenant_id', tenantId)
    .eq('id', simulationRunId)
    .single();

  if (runError || !simRun) {
    throw new Error(
      `Simulation run ${simulationRunId} not found in tenant ${tenantId}: ${runError?.message}`
    );
  }

  // Extract metrics
  const metrics = await extractMetricsFromSimulationRun(tenantId, simulationRunId);

  // Insert baseline
  const { data, error } = await supabase
    .from('guardian_qa_baselines')
    .insert({
      tenant_id: tenantId,
      name,
      description: options.description,
      scope: 'scenario',
      source_type: 'simulation_run',
      source_id: simulationRunId,
      captured_at: new Date().toISOString(),
      metrics,
      comparison_window: options.comparisonWindow,
      is_reference: options.isReference || false,
      created_by: options.createdBy,
      metadata: options.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create baseline: ${error.message}`);
  }

  return data as GuardianQaBaseline;
}

/**
 * Create baseline from a playbook simulation run (I04)
 */
export async function createBaselineFromPlaybookSimulationRun(
  tenantId: string,
  name: string,
  playbookSimRunId: string,
  options: CreateBaselineOptions = {}
): Promise<GuardianQaBaseline> {
  const supabase = getSupabaseServer();

  // Verify playbook sim run belongs to this tenant
  const { data: pbSimRun, error: runError } = await supabase
    .from('guardian_playbook_simulation_runs')
    .select('tenant_id, id')
    .eq('tenant_id', tenantId)
    .eq('id', playbookSimRunId)
    .single();

  if (runError || !pbSimRun) {
    throw new Error(
      `Playbook simulation run ${playbookSimRunId} not found in tenant ${tenantId}: ${runError?.message}`
    );
  }

  // Extract metrics
  const metrics = await extractMetricsFromPlaybookSimulationRun(tenantId, playbookSimRunId);

  // Insert baseline
  const { data, error } = await supabase
    .from('guardian_qa_baselines')
    .insert({
      tenant_id: tenantId,
      name,
      description: options.description,
      scope: 'playbook',
      source_type: 'playbook_simulation_run',
      source_id: playbookSimRunId,
      captured_at: new Date().toISOString(),
      metrics,
      comparison_window: options.comparisonWindow,
      is_reference: options.isReference || false,
      created_by: options.createdBy,
      metadata: options.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create baseline: ${error.message}`);
  }

  return data as GuardianQaBaseline;
}

/**
 * Mark a baseline as reference (for drift comparisons)
 */
export async function markBaselineAsReference(
  tenantId: string,
  baselineId: string,
  isReference: boolean
): Promise<GuardianQaBaseline> {
  const supabase = getSupabaseServer();

  // Verify baseline belongs to tenant
  const { data: baseline, error: getError } = await supabase
    .from('guardian_qa_baselines')
    .select('id, tenant_id')
    .eq('tenant_id', tenantId)
    .eq('id', baselineId)
    .single();

  if (getError || !baseline) {
    throw new Error(
      `Baseline ${baselineId} not found in tenant ${tenantId}: ${getError?.message}`
    );
  }

  // Update
  const { data, error } = await supabase
    .from('guardian_qa_baselines')
    .update({ is_reference: isReference, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', baselineId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update baseline: ${error.message}`);
  }

  return data as GuardianQaBaseline;
}

/**
 * List baselines for a tenant
 */
export async function listBaselines(
  tenantId: string,
  filters?: {
    scope?: string;
    isReference?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<GuardianQaBaseline[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_qa_baselines')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('captured_at', { ascending: false });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.isReference !== undefined) {
    query = query.eq('is_reference', filters.isReference);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list baselines: ${error.message}`);
  }

  return (data || []) as GuardianQaBaseline[];
}

/**
 * Get a single baseline
 */
export async function getBaseline(
  tenantId: string,
  baselineId: string
): Promise<GuardianQaBaseline> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_baselines')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', baselineId)
    .single();

  if (error) {
    throw new Error(`Failed to get baseline: ${error.message}`);
  }

  return data as GuardianQaBaseline;
}

/**
 * Find reference baseline for a given scope and name pattern
 */
export async function findReferenceBaseline(
  tenantId: string,
  scope: string,
  nameLike?: string
): Promise<GuardianQaBaseline | null> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_qa_baselines')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', scope)
    .eq('is_reference', true)
    .order('captured_at', { ascending: false })
    .limit(1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to find reference baseline: ${error.message}`);
  }

  return data && data.length > 0 ? (data[0] as GuardianQaBaseline) : null;
}

/**
 * Delete a baseline (soft or hard delete, depending on preferences)
 */
export async function deleteBaseline(tenantId: string, baselineId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_qa_baselines')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', baselineId);

  if (error) {
    throw new Error(`Failed to delete baseline: ${error.message}`);
  }
}
