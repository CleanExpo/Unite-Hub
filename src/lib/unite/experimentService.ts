/**
 * Experiment Service
 * Phase: D69 - Experimentation & Feature Flag Engine
 *
 * Stable hash-based experiment assignment.
 * Integration with analytics for metric collection.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface Experiment {
  id: string;
  tenant_id?: string;
  experiment_key: string;
  name: string;
  description?: string;
  hypothesis?: string;
  variants: Array<{
    key: string;
    weight: number;
  }>;
  traffic_allocation: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  user_id?: string;
  anonymous_id?: string;
  variant_key: string;
  assignment_hash: string;
  assigned_at: string;
  metadata?: Record<string, unknown>;
}

export interface ExperimentMetric {
  id: string;
  experiment_id: string;
  variant_key: string;
  metric_key: string;
  metric_value: number;
  user_count: number;
  recorded_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EXPERIMENT MANAGEMENT
// ============================================================================

export async function createExperiment(
  input: Omit<Experiment, 'id' | 'created_at' | 'updated_at'>
): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('unite_experiments')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create experiment: ${error.message}`);
  return data as Experiment;
}

export async function listExperiments(filters?: {
  tenant_id?: string;
  status?: string;
  limit?: number;
}): Promise<Experiment[]> {
  let query = supabaseAdmin
    .from('unite_experiments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list experiments: ${error.message}`);
  return data as Experiment[];
}

export async function getExperiment(experimentKey: string): Promise<Experiment | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_experiments')
    .select('*')
    .eq('experiment_key', experimentKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get experiment: ${error.message}`);
  }

  return data as Experiment;
}

export async function updateExperiment(
  experimentKey: string,
  updates: Partial<Omit<Experiment, 'id' | 'created_at' | 'updated_at'>>
): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('unite_experiments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('experiment_key', experimentKey)
    .select()
    .single();

  if (error) throw new Error(`Failed to update experiment: ${error.message}`);
  return data as Experiment;
}

export async function deleteExperiment(experimentKey: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_experiments')
    .delete()
    .eq('experiment_key', experimentKey);

  if (error) throw new Error(`Failed to delete experiment: ${error.message}`);
}

// ============================================================================
// STABLE ASSIGNMENT (hash-based bucketing)
// ============================================================================

export async function assignVariant(
  experimentKey: string,
  userId?: string,
  anonymousId?: string
): Promise<{
  variant_key: string;
  assignment: ExperimentAssignment | null;
}> {
  if (!userId && !anonymousId) {
    throw new Error('Either userId or anonymousId must be provided');
  }

  const experiment = await getExperiment(experimentKey);
  if (!experiment) {
    throw new Error(`Experiment ${experimentKey} not found`);
  }

  if (experiment.status !== 'running') {
    // Return control variant for non-running experiments
    const controlVariant = experiment.variants.find((v) => v.key === 'control') || experiment.variants[0];
    return {
      variant_key: controlVariant.key,
      assignment: null,
    };
  }

  // Generate stable hash
  const identifier = userId || anonymousId!;
  const assignmentHash = createHash('sha256')
    .update(`${experimentKey}:${identifier}`)
    .digest('hex');

  // Check for existing assignment
  const { data: existingAssignment } = await supabaseAdmin
    .from('unite_experiment_assignments')
    .select('*')
    .eq('assignment_hash', assignmentHash)
    .single();

  if (existingAssignment) {
    return {
      variant_key: existingAssignment.variant_key,
      assignment: existingAssignment as ExperimentAssignment,
    };
  }

  // Check traffic allocation
  const trafficBucket = hashToBucket(assignmentHash, 100);
  if (trafficBucket >= experiment.traffic_allocation) {
    // User not in experiment - return control
    const controlVariant = experiment.variants.find((v) => v.key === 'control') || experiment.variants[0];
    return {
      variant_key: controlVariant.key,
      assignment: null,
    };
  }

  // Assign variant based on weights
  const variantKey = selectVariantByWeight(experiment.variants, assignmentHash);

  // Create assignment record
  const { data: newAssignment, error } = await supabaseAdmin
    .from('unite_experiment_assignments')
    .insert({
      experiment_id: experiment.id,
      user_id: userId,
      anonymous_id: anonymousId,
      variant_key: variantKey,
      assignment_hash: assignmentHash,
    })
    .select()
    .single();

  if (error) {
    console.error('[Experiment] Failed to create assignment:', error);
    return {
      variant_key: variantKey,
      assignment: null,
    };
  }

  return {
    variant_key: variantKey,
    assignment: newAssignment as ExperimentAssignment,
  };
}

function selectVariantByWeight(
  variants: Array<{ key: string; weight: number }>,
  hash: string
): string {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const bucket = hashToBucket(hash, totalWeight);

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.key;
    }
  }

  // Fallback to control
  return variants.find((v) => v.key === 'control')?.key || variants[0].key;
}

function hashToBucket(hash: string, buckets: number): number {
  // Use first 8 hex chars for numeric conversion
  const numericHash = parseInt(hash.substring(0, 8), 16);
  return numericHash % buckets;
}

// ============================================================================
// METRIC COLLECTION
// ============================================================================

export async function recordExperimentMetric(
  experimentKey: string,
  variantKey: string,
  metricKey: string,
  metricValue: number,
  userCount: number = 1
): Promise<ExperimentMetric> {
  const experiment = await getExperiment(experimentKey);
  if (!experiment) {
    throw new Error(`Experiment ${experimentKey} not found`);
  }

  const { data, error } = await supabaseAdmin
    .from('unite_experiment_metrics')
    .insert({
      experiment_id: experiment.id,
      variant_key: variantKey,
      metric_key: metricKey,
      metric_value: metricValue,
      user_count: userCount,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record metric: ${error.message}`);
  return data as ExperimentMetric;
}

export async function getExperimentMetrics(
  experimentKey: string,
  filters?: {
    variant_key?: string;
    metric_key?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<ExperimentMetric[]> {
  const experiment = await getExperiment(experimentKey);
  if (!experiment) {
    throw new Error(`Experiment ${experimentKey} not found`);
  }

  let query = supabaseAdmin
    .from('unite_experiment_metrics')
    .select('*')
    .eq('experiment_id', experiment.id)
    .order('recorded_at', { ascending: false });

  if (filters?.variant_key) query = query.eq('variant_key', filters.variant_key);
  if (filters?.metric_key) query = query.eq('metric_key', filters.metric_key);
  if (filters?.start_date) query = query.gte('recorded_at', filters.start_date);
  if (filters?.end_date) query = query.lte('recorded_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get experiment metrics: ${error.message}`);
  return data as ExperimentMetric[];
}

// ============================================================================
// ANALYTICS AGGREGATION
// ============================================================================

export async function getExperimentSummary(
  experimentKey: string
): Promise<{
  experiment: Experiment;
  variants: Array<{
    variant_key: string;
    assignment_count: number;
    metrics: Record<string, { avg: number; total: number; count: number }>;
  }>;
}> {
  const experiment = await getExperiment(experimentKey);
  if (!experiment) {
    throw new Error(`Experiment ${experimentKey} not found`);
  }

  // Get assignment counts per variant
  const { data: assignments } = await supabaseAdmin
    .from('unite_experiment_assignments')
    .select('variant_key')
    .eq('experiment_id', experiment.id);

  const assignmentCounts = (assignments || []).reduce(
    (acc, a) => {
      acc[a.variant_key] = (acc[a.variant_key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get metrics per variant
  const { data: metrics } = await supabaseAdmin
    .from('unite_experiment_metrics')
    .select('*')
    .eq('experiment_id', experiment.id);

  const variantMetrics: Record<
    string,
    Record<string, { values: number[]; users: number[] }>
  > = {};

  (metrics || []).forEach((m) => {
    if (!variantMetrics[m.variant_key]) {
      variantMetrics[m.variant_key] = {};
    }
    if (!variantMetrics[m.variant_key][m.metric_key]) {
      variantMetrics[m.variant_key][m.metric_key] = { values: [], users: [] };
    }
    variantMetrics[m.variant_key][m.metric_key].values.push(m.metric_value);
    variantMetrics[m.variant_key][m.metric_key].users.push(m.user_count);
  });

  const variantSummaries = experiment.variants.map((v) => {
    const metricsAgg: Record<string, { avg: number; total: number; count: number }> = {};

    if (variantMetrics[v.key]) {
      for (const [metricKey, data] of Object.entries(variantMetrics[v.key])) {
        const total = data.values.reduce((sum, val) => sum + val, 0);
        const count = data.values.length;
        const avg = count > 0 ? total / count : 0;
        metricsAgg[metricKey] = { avg, total, count };
      }
    }

    return {
      variant_key: v.key,
      assignment_count: assignmentCounts[v.key] || 0,
      metrics: metricsAgg,
    };
  });

  return {
    experiment,
    variants: variantSummaries,
  };
}
