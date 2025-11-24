/**
 * Scaling Health Snapshot Service
 * Phase 86: Generate and retrieve scaling health snapshots
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ScalingHealthSnapshot,
  ScalingModeConfig,
  ScalingHealthInputs,
  ScalingHealthScores,
} from './scalingModeTypes';
import { getConfig } from './scalingModeConfigService';
import {
  collectHealthInputs,
  computeScores,
  calculateSafeCapacity,
  calculateConfidence,
} from './scalingHealthAggregationService';
import { decideNextMode } from './scalingModeDecisionService';
import { generateSnapshotSummary } from './scalingModeTruthAdapter';

/**
 * Generate a new health snapshot
 */
export async function generateSnapshot(
  environment: string = 'production'
): Promise<ScalingHealthSnapshot> {
  const supabase = await getSupabaseServer();

  // Get config
  const config = await getConfig(environment);
  if (!config) {
    throw new Error(`No config found for environment: ${environment}`);
  }

  // Collect inputs
  const inputs = await collectHealthInputs(environment);

  // Compute scores
  const scores = computeScores(inputs, config);

  // Calculate safe capacity
  const safeCapacity = calculateSafeCapacity(config, scores);

  // Calculate utilisation
  const utilisationRatio = safeCapacity > 0
    ? Math.round((inputs.active_clients / safeCapacity) * 1000) / 1000
    : 0;

  // Get decision
  const decision = decideNextMode(
    config,
    scores,
    inputs.active_clients,
    safeCapacity
  );

  // Calculate confidence
  const confidence = calculateConfidence(inputs.data_completeness);

  // Generate summary
  const summaryMarkdown = generateSnapshotSummary(
    config,
    inputs,
    scores,
    decision,
    safeCapacity,
    confidence
  );

  // Insert snapshot
  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .insert({
      environment,
      current_mode: config.current_mode,
      active_clients: inputs.active_clients,
      safe_capacity: safeCapacity,
      utilisation_ratio: utilisationRatio,
      infra_health_score: scores.infra_health_score,
      ai_cost_pressure_score: scores.ai_cost_pressure_score,
      warning_density_score: scores.warning_density_score,
      churn_risk_score: scores.churn_risk_score,
      overall_scaling_health_score: scores.overall_scaling_health_score,
      recommendation: decision.recommendation,
      summary_markdown: summaryMarkdown,
      confidence_score: confidence,
      data_completeness: inputs.data_completeness,
      metadata: {
        inputs,
        decision_reasons: decision.reasons,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create snapshot: ${error.message}`);
  }

  return data;
}

/**
 * List recent snapshots
 */
export async function listSnapshots(
  environment: string = 'production',
  limit: number = 30
): Promise<ScalingHealthSnapshot[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list snapshots: ${error.message}`);
  }

  return data || [];
}

/**
 * Get latest snapshot
 */
export async function getLatestSnapshot(
  environment: string = 'production'
): Promise<ScalingHealthSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('environment', environment)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get latest snapshot: ${error.message}`);
  }

  return data || null;
}

/**
 * Get snapshot by ID
 */
export async function getSnapshotById(
  snapshotId: string
): Promise<ScalingHealthSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get snapshots for a date range
 */
export async function getSnapshotsInRange(
  environment: string,
  startDate: string,
  endDate: string
): Promise<ScalingHealthSnapshot[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('environment', environment)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get snapshots: ${error.message}`);
  }

  return data || [];
}
