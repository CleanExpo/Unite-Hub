/**
 * Synthex A/B Testing Service
 *
 * Phase: D50 - A/B Testing & Experimentation Engine
 * Tables: synthex_experiments (existing from 444), synthex_experiment_variants, synthex_experiment_metrics
 *
 * Features:
 * - Experiment and variant management (uses existing B41 schema)
 * - Metrics tracking and aggregation
 * - AI-powered experiment analysis
 * - Statistical significance testing
 *
 * Note: This service extends the existing experiment system from migration 444
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types (adapted to existing schema)
// =============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
export type ExperimentObjectType = 'subject_line' | 'email_body' | 'cta' | 'content_block' | 'send_time' | 'landing_page' | 'form';
export type EventType = 'impression' | 'open' | 'click' | 'conversion';

export interface Experiment {
  id: string;
  tenant_id: string;
  business_id?: string;
  name: string;
  description?: string;
  object_type: ExperimentObjectType;
  object_ref: string;
  primary_metric: string;
  secondary_metrics?: string[];
  hypothesis?: string;
  segment_id?: string;
  traffic_percentage: number;
  status: ExperimentStatus;
  start_at?: string;
  end_at?: string;
  winning_variant_id?: string;
  decided_at?: string;
  decision_reason?: string;
  created_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  description?: string;
  is_control: boolean;
  weight: number;
  config: Record<string, unknown>;
  created_at: string;
}

export interface ExperimentMetrics {
  id: string;
  experiment_id: string;
  variant_id: string;
  event_type: EventType;
  count: number;
  value_sum: number;
  last_event_at?: string;
  period: string; // date
}

export interface CreateExperimentInput {
  name: string;
  description?: string;
  object_type: ExperimentObjectType;
  object_ref: string;
  primary_metric: string;
  business_id?: string;
  hypothesis?: string;
  segment_id?: string;
  traffic_percentage?: number;
  start_at?: string;
  end_at?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateVariantInput {
  experiment_id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  is_control?: boolean;
  weight?: number;
}

export interface RecordMetricsInput {
  experiment_id: string;
  variant_id: string;
  period: string; // date
  event_type: EventType;
  count?: number;
  value_sum?: number;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Experiments
// =============================================================================

/**
 * Create an experiment
 */
export async function createExperiment(
  tenantId: string,
  input: CreateExperimentInput
): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiments')
    .insert({
      tenant_id: tenantId,
      business_id: input.business_id,
      name: input.name,
      description: input.description,
      object_type: input.object_type,
      object_ref: input.object_ref,
      primary_metric: input.primary_metric,
      hypothesis: input.hypothesis,
      segment_id: input.segment_id,
      traffic_percentage: input.traffic_percentage ?? 100,
      start_at: input.start_at,
      end_at: input.end_at,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create experiment: ${error.message}`);
  return data as Experiment;
}

/**
 * Get experiment by ID
 */
export async function getExperiment(experimentId: string): Promise<Experiment | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiments')
    .select('*')
    .eq('id', experimentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get experiment: ${error.message}`);
  return data as Experiment | null;
}

/**
 * List experiments
 */
export async function listExperiments(
  tenantId: string,
  filters?: {
    businessId?: string;
    status?: ExperimentStatus;
    limit?: number;
  }
): Promise<Experiment[]> {
  let query = supabaseAdmin
    .from('synthex_experiments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list experiments: ${error.message}`);
  return data as Experiment[];
}

/**
 * Update experiment
 */
export async function updateExperiment(
  experimentId: string,
  updates: Partial<Omit<Experiment, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiments')
    .update(updates)
    .eq('id', experimentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update experiment: ${error.message}`);
  return data as Experiment;
}

/**
 * Delete experiment
 */
export async function deleteExperiment(experimentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_experiments')
    .delete()
    .eq('id', experimentId);

  if (error) throw new Error(`Failed to delete experiment: ${error.message}`);
}

// =============================================================================
// Experiment Variants
// =============================================================================

/**
 * Create a variant
 */
export async function createVariant(
  input: CreateVariantInput
): Promise<ExperimentVariant> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .insert({
      experiment_id: input.experiment_id,
      name: input.name,
      description: input.description,
      config: input.config ?? {},
      is_control: input.is_control ?? false,
      weight: input.weight ?? 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create variant: ${error.message}`);
  return data as ExperimentVariant;
}

/**
 * List variants for an experiment
 */
export async function listVariants(
  experimentId: string
): Promise<ExperimentVariant[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('is_control', { ascending: false }) // Control first
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list variants: ${error.message}`);
  return data as ExperimentVariant[];
}

/**
 * Delete variant
 */
export async function deleteVariant(variantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .delete()
    .eq('id', variantId);

  if (error) throw new Error(`Failed to delete variant: ${error.message}`);
}

// =============================================================================
// Experiment Metrics
// =============================================================================

/**
 * Record metrics for a variant
 */
export async function recordMetrics(
  input: RecordMetricsInput
): Promise<ExperimentMetrics> {
  // Upsert: update if exists, insert if not
  const { data, error } = await supabaseAdmin
    .from('synthex_experiment_metrics')
    .upsert({
      experiment_id: input.experiment_id,
      variant_id: input.variant_id,
      period: input.period,
      event_type: input.event_type,
      count: input.count ?? 0,
      value_sum: input.value_sum ?? 0,
      last_event_at: new Date().toISOString(),
    }, {
      onConflict: 'experiment_id,variant_id,event_type,period',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record metrics: ${error.message}`);
  return data as ExperimentMetrics;
}

/**
 * Get experiment summary (aggregated metrics per variant)
 */
export async function getExperimentSummary(
  experimentId: string
): Promise<Array<{
  variant_id: string;
  variant_key: string;
  variant_name: string;
  is_control: boolean;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  ctr: number;
  conversion_rate: number;
  revenue_per_impression: number;
}>> {
  const { data, error } = await supabaseAdmin.rpc('synthex_get_d50_experiment_summary', {
    p_experiment_id: experimentId,
  });

  if (error) throw new Error(`Failed to get experiment summary: ${error.message}`);
  return data;
}

/**
 * List metrics for an experiment
 */
export async function listMetrics(
  experimentId: string,
  filters?: {
    variantId?: string;
    eventType?: EventType;
    startPeriod?: string;
    endPeriod?: string;
  }
): Promise<ExperimentMetrics[]> {
  let query = supabaseAdmin
    .from('synthex_experiment_metrics')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('period', { ascending: false });

  if (filters?.variantId) {
    query = query.eq('variant_id', filters.variantId);
  }

  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType);
  }

  if (filters?.startPeriod) {
    query = query.gte('period', filters.startPeriod);
  }

  if (filters?.endPeriod) {
    query = query.lte('period', filters.endPeriod);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list metrics: ${error.message}`);
  return data as ExperimentMetrics[];
}

// =============================================================================
// AI-Powered Analysis
// =============================================================================

/**
 * AI analysis of experiment results
 */
export async function aiAnalyzeExperiment(
  experiment: Experiment,
  variants: ExperimentVariant[],
  summary: Array<{
    variant_id: string;
    variant_key: string;
    variant_name: string;
    is_control: boolean;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_revenue: number;
    ctr: number;
    conversion_rate: number;
    revenue_per_impression: number;
  }>
): Promise<{
  winner?: string;
  confidence: number;
  statistical_significance: string;
  insights: string[];
  recommendations: string[];
  next_actions: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `You are an A/B testing expert analyzing experiment results. Provide insights and recommendations.

Experiment: ${experiment.name}
Hypothesis: ${experiment.hypothesis || 'N/A'}
Primary Metric: ${experiment.primary_metric}
Duration: ${experiment.start_at} to ${experiment.end_at || 'ongoing'}

Variants:
${variants.map(v => `- ${v.name}: ${v.is_control ? 'CONTROL' : 'VARIANT'} (weight: ${v.weight})`).join('\n')}

Performance Summary:
${JSON.stringify(summary, null, 2)}

Provide analysis in JSON format:
{
  "winner": "variant_id or null if inconclusive",
  "confidence": 0.85,
  "statistical_significance": "significant|trending|inconclusive",
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "next_actions": [
    "Action to take based on results"
  ]
}

Consider:
- Sample size (impressions)
- CTR, conversion rate, and revenue differences
- Statistical significance (use rough estimation based on sample size and variance)
- Whether to continue, stop, or scale the winner`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      confidence: 0,
      statistical_significance: 'inconclusive',
      insights: ['Unable to parse AI response'],
      recommendations: [],
      next_actions: [],
    };
  }
}

/**
 * Calculate statistical significance (simplified z-test for proportions)
 */
export function calculateSignificance(
  control: { conversions: number; impressions: number },
  variant: { conversions: number; impressions: number }
): {
  p_value: number;
  is_significant: boolean;
  confidence_level: number;
} {
  if (control.impressions === 0 || variant.impressions === 0) {
    return {
      p_value: 1,
      is_significant: false,
      confidence_level: 0,
    };
  }

  const p1 = control.conversions / control.impressions;
  const p2 = variant.conversions / variant.impressions;

  const pooled_p = (control.conversions + variant.conversions) / (control.impressions + variant.impressions);

  const se = Math.sqrt(pooled_p * (1 - pooled_p) * (1 / control.impressions + 1 / variant.impressions));

  if (se === 0) {
    return {
      p_value: 1,
      is_significant: false,
      confidence_level: 0,
    };
  }

  const z = (p2 - p1) / se;

  // Simplified p-value approximation
  const p_value = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    p_value,
    is_significant: p_value < 0.05,
    confidence_level: (1 - p_value) * 100,
  };
}

/**
 * Normal CDF approximation (for z-test)
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}
