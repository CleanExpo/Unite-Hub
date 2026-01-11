/**
 * Synthex Experiment Lab Service
 *
 * Phase: D44 - Experiment Lab OS (Growth Experiments & A/B Engine)
 * Tables: synthex_exp_*
 *
 * Features:
 * - Experiment management
 * - Variant configuration
 * - Assignment tracking
 * - Statistical analysis
 * - AI-powered insights
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type EXPStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type EXPType = 'ab_test' | 'multivariate' | 'feature_flag' | 'holdout' | 'rollout';
export type EXPMetricType = 'conversion' | 'revenue' | 'engagement' | 'retention' | 'click_rate' | 'bounce_rate' | 'time_on_page' | 'custom';
export type EXPSignificance = 'not_significant' | 'trending' | 'significant' | 'highly_significant';

export interface EXPExperiment {
  id: string;
  tenant_id: string;
  business_id?: string;
  name: string;
  description?: string;
  hypothesis: string;
  experiment_type: EXPType;
  status: EXPStatus;
  primary_metric: string;
  metric_type: EXPMetricType;
  target_value?: number;
  minimum_detectable_effect: number;
  secondary_metrics: unknown[];
  target_audience: Record<string, unknown>;
  traffic_allocation: number;
  scheduled_start?: string;
  scheduled_end?: string;
  started_at?: string;
  ended_at?: string;
  min_sample_size: number;
  confidence_level: number;
  allow_early_stopping: boolean;
  winner_variant_id?: string;
  statistical_significance: EXPSignificance;
  final_p_value?: number;
  final_lift_percent?: number;
  ai_conclusion?: Record<string, unknown>;
  owner_user_id?: string;
  team_ids: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EXPVariant {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_key: string;
  label: string;
  description?: string;
  is_control: boolean;
  allocation: number;
  config: Record<string, unknown>;
  total_participants: number;
  total_conversions: number;
  conversion_rate: number;
  total_revenue: number;
  avg_revenue_per_user: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EXPResult {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  snapshot_date: string;
  sample_size: number;
  conversions: number;
  conversion_rate?: number;
  revenue: number;
  avg_order_value?: number;
  metric_value?: number;
  metric_variance?: number;
  p_value?: number;
  confidence_interval_low?: number;
  confidence_interval_high?: number;
  lift_percent?: number;
  lift_confidence?: number;
  is_winner: boolean;
  significance: EXPSignificance;
  ai_commentary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EXPAssignment {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  entity_type: string;
  entity_id: string;
  assigned_at: string;
  first_exposure_at?: string;
  last_exposure_at?: string;
  converted: boolean;
  converted_at?: string;
  conversion_value?: number;
  metadata: Record<string, unknown>;
}

export interface EXPTemplate {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  category: string;
  experiment_type: EXPType;
  default_hypothesis?: string;
  suggested_metrics: unknown[];
  suggested_variants: unknown[];
  is_public: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateExperimentInput {
  name: string;
  description?: string;
  hypothesis: string;
  experiment_type?: EXPType;
  primary_metric: string;
  metric_type?: EXPMetricType;
  target_value?: number;
  minimum_detectable_effect?: number;
  secondary_metrics?: unknown[];
  target_audience?: Record<string, unknown>;
  traffic_allocation?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  min_sample_size?: number;
  confidence_level?: number;
  allow_early_stopping?: boolean;
  owner_user_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateVariantInput {
  variant_key: string;
  label: string;
  description?: string;
  is_control?: boolean;
  allocation?: number;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Experiment Operations
// =============================================================================

export async function createExperiment(
  tenantId: string,
  businessId: string | undefined,
  input: CreateExperimentInput
): Promise<EXPExperiment> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_experiments')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      experiment_type: input.experiment_type || 'ab_test',
      primary_metric: input.primary_metric,
      metric_type: input.metric_type || 'conversion',
      target_value: input.target_value,
      minimum_detectable_effect: input.minimum_detectable_effect || 0.05,
      secondary_metrics: input.secondary_metrics || [],
      target_audience: input.target_audience || {},
      traffic_allocation: input.traffic_allocation || 100,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      min_sample_size: input.min_sample_size || 1000,
      confidence_level: input.confidence_level || 0.95,
      allow_early_stopping: input.allow_early_stopping !== false,
      owner_user_id: input.owner_user_id,
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create experiment: ${error.message}`);
  return data;
}

export async function listExperiments(
  tenantId: string,
  options?: {
    businessId?: string;
    status?: EXPStatus;
    type?: EXPType;
    limit?: number;
  }
): Promise<EXPExperiment[]> {
  let query = supabaseAdmin
    .from('synthex_exp_experiments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.type) {
    query = query.eq('experiment_type', options.type);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list experiments: ${error.message}`);
  return data || [];
}

export async function getExperiment(experimentId: string): Promise<EXPExperiment | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_experiments')
    .select('*')
    .eq('id', experimentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get experiment: ${error.message}`);
  }
  return data;
}

export async function updateExperiment(
  experimentId: string,
  updates: Partial<CreateExperimentInput> & { status?: EXPStatus }
): Promise<EXPExperiment> {
  const updateData: Record<string, unknown> = { ...updates };

  // Handle status transitions
  if (updates.status === 'running' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }
  if ((updates.status === 'completed' || updates.status === 'cancelled') && !updateData.ended_at) {
    updateData.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_exp_experiments')
    .update(updateData)
    .eq('id', experimentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update experiment: ${error.message}`);
  return data;
}

export async function deleteExperiment(experimentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_exp_experiments')
    .delete()
    .eq('id', experimentId);

  if (error) throw new Error(`Failed to delete experiment: ${error.message}`);
}

// =============================================================================
// Variant Operations
// =============================================================================

export async function createVariant(
  tenantId: string,
  experimentId: string,
  input: CreateVariantInput
): Promise<EXPVariant> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_variants')
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      variant_key: input.variant_key,
      label: input.label,
      description: input.description,
      is_control: input.is_control || false,
      allocation: input.allocation || 50,
      config: input.config || {},
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create variant: ${error.message}`);
  return data;
}

export async function listVariants(experimentId: string): Promise<EXPVariant[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('is_control', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list variants: ${error.message}`);
  return data || [];
}

export async function updateVariant(
  variantId: string,
  updates: Partial<CreateVariantInput>
): Promise<EXPVariant> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_variants')
    .update(updates)
    .eq('id', variantId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update variant: ${error.message}`);
  return data;
}

export async function deleteVariant(variantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_exp_variants')
    .delete()
    .eq('id', variantId);

  if (error) throw new Error(`Failed to delete variant: ${error.message}`);
}

// =============================================================================
// Assignment Operations
// =============================================================================

export async function assignToVariant(
  tenantId: string,
  experimentId: string,
  entityType: string,
  entityId: string
): Promise<EXPAssignment> {
  // Get experiment and variants
  const experiment = await getExperiment(experimentId);
  if (!experiment || experiment.status !== 'running') {
    throw new Error('Experiment not running');
  }

  const variants = await listVariants(experimentId);
  if (variants.length === 0) {
    throw new Error('No variants configured');
  }

  // Check if already assigned
  const { data: existing } = await supabaseAdmin
    .from('synthex_exp_assignments')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();

  if (existing) {
    return existing;
  }

  // Weighted random assignment
  const totalAllocation = variants.reduce((sum, v) => sum + v.allocation, 0);
  const random = Math.random() * totalAllocation;
  let cumulative = 0;
  let selectedVariant = variants[0];

  for (const variant of variants) {
    cumulative += variant.allocation;
    if (random <= cumulative) {
      selectedVariant = variant;
      break;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_exp_assignments')
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      variant_id: selectedVariant.id,
      entity_type: entityType,
      entity_id: entityId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to assign variant: ${error.message}`);
  return data;
}

export async function recordConversion(
  assignmentId: string,
  conversionValue?: number
): Promise<EXPAssignment> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_assignments')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
      conversion_value: conversionValue,
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to record conversion: ${error.message}`);
  return data;
}

export async function getAssignment(
  experimentId: string,
  entityType: string,
  entityId: string
): Promise<EXPAssignment | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_exp_assignments')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get assignment: ${error.message}`);
  }
  return data;
}

// =============================================================================
// Results & Analysis
// =============================================================================

export async function calculateResults(experimentId: string): Promise<EXPResult[]> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const variants = await listVariants(experimentId);
  if (variants.length < 2) {
    throw new Error('Need at least 2 variants to calculate results');
  }

  const controlVariant = variants.find(v => v.is_control) || variants[0];
  const today = new Date().toISOString().split('T')[0];
  const results: EXPResult[] = [];

  for (const variant of variants) {
    // Calculate statistical significance vs control
    let pValue = 1;
    let significance: EXPSignificance = 'not_significant';
    let liftPercent = 0;

    if (variant.id !== controlVariant.id && controlVariant.total_participants > 0) {
      // Simple z-test calculation
      const p1 = controlVariant.conversion_rate;
      const p2 = variant.conversion_rate;
      const n1 = controlVariant.total_participants;
      const n2 = variant.total_participants;

      if (n1 > 0 && n2 > 0) {
        const pooledP = (controlVariant.total_conversions + variant.total_conversions) / (n1 + n2);
        if (pooledP > 0 && pooledP < 1) {
          const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
          if (se > 0) {
            const zScore = Math.abs(p2 - p1) / se;
            // Approximate two-tailed p-value
            pValue = 2 * (1 - 0.5 * (1 + erf(zScore / Math.sqrt(2))));
            liftPercent = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

            if (pValue < 0.01) significance = 'highly_significant';
            else if (pValue < 0.05) significance = 'significant';
            else if (pValue < 0.10) significance = 'trending';
          }
        }
      }
    }

    // Insert or update result
    const { data, error } = await supabaseAdmin
      .from('synthex_exp_results')
      .upsert({
        tenant_id: experiment.tenant_id,
        experiment_id: experimentId,
        variant_id: variant.id,
        snapshot_date: today,
        sample_size: variant.total_participants,
        conversions: variant.total_conversions,
        conversion_rate: variant.conversion_rate,
        revenue: variant.total_revenue,
        avg_order_value: variant.total_conversions > 0
          ? variant.total_revenue / variant.total_conversions
          : 0,
        p_value: pValue,
        lift_percent: liftPercent,
        is_winner: false,
        significance,
      }, {
        onConflict: 'experiment_id,variant_id,snapshot_date',
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to save result for variant ${variant.id}:`, error);
    } else if (data) {
      results.push(data);
    }
  }

  // Determine winner if significant
  const significantResults = results.filter(r => r.significance === 'significant' || r.significance === 'highly_significant');
  if (significantResults.length > 0) {
    const winner = significantResults.reduce((best, r) =>
      (r.conversion_rate || 0) > (best.conversion_rate || 0) ? r : best
    );

    await supabaseAdmin
      .from('synthex_exp_results')
      .update({ is_winner: true })
      .eq('id', winner.id);

    winner.is_winner = true;
  }

  return results;
}

// Error function approximation for z-test
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

export async function listResults(
  experimentId: string,
  options?: { limit?: number }
): Promise<EXPResult[]> {
  let query = supabaseAdmin
    .from('synthex_exp_results')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('snapshot_date', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list results: ${error.message}`);
  return data || [];
}

// =============================================================================
// Templates
// =============================================================================

export async function listTemplates(
  tenantId?: string,
  category?: string
): Promise<EXPTemplate[]> {
  let query = supabaseAdmin
    .from('synthex_exp_templates')
    .select('*')
    .order('name');

  if (tenantId) {
    query = query.or(`is_public.eq.true,tenant_id.eq.${tenantId}`);
  } else {
    query = query.eq('is_public', true);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list templates: ${error.message}`);
  return data || [];
}

export async function createFromTemplate(
  tenantId: string,
  businessId: string | undefined,
  templateId: string,
  overrides: Partial<CreateExperimentInput>
): Promise<{ experiment: EXPExperiment; variants: EXPVariant[] }> {
  // Get template
  const { data: template } = await supabaseAdmin
    .from('synthex_exp_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  // Create experiment
  const experiment = await createExperiment(tenantId, businessId, {
    name: overrides.name || template.name,
    description: overrides.description || template.description,
    hypothesis: overrides.hypothesis || template.default_hypothesis || '',
    experiment_type: template.experiment_type,
    primary_metric: overrides.primary_metric || (template.suggested_metrics as Array<{ name: string }>)?.[0]?.name || 'conversion',
    ...overrides,
  });

  // Create suggested variants
  const variants: EXPVariant[] = [];
  const suggestedVariants = template.suggested_variants as Array<{ key: string; label: string }>;

  for (const sv of suggestedVariants || []) {
    const variant = await createVariant(tenantId, experiment.id, {
      variant_key: sv.key,
      label: sv.label,
      is_control: sv.key === 'control',
      allocation: 100 / (suggestedVariants?.length || 2),
    });
    variants.push(variant);
  }

  return { experiment, variants };
}

// =============================================================================
// AI Analysis
// =============================================================================

export async function aiAnalyzeExperiment(
  experiment: EXPExperiment,
  variants: EXPVariant[],
  results: EXPResult[]
): Promise<{
  summary: string;
  winner: string | null;
  confidence: string;
  recommendations: string[];
  next_steps: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze this A/B test experiment and provide insights:

EXPERIMENT:
- Name: ${experiment.name}
- Hypothesis: ${experiment.hypothesis}
- Primary Metric: ${experiment.primary_metric}
- Status: ${experiment.status}
- Min Sample Size: ${experiment.min_sample_size}
- Confidence Level: ${experiment.confidence_level * 100}%

VARIANTS:
${variants.map(v => `- ${v.label} (${v.variant_key}${v.is_control ? ', control' : ''}):
  - Participants: ${v.total_participants}
  - Conversions: ${v.total_conversions}
  - Conversion Rate: ${(v.conversion_rate * 100).toFixed(2)}%
  - Revenue: $${v.total_revenue.toFixed(2)}`).join('\n')}

LATEST RESULTS:
${results.slice(0, 2).map(r => `- Variant ${r.variant_id}:
  - P-value: ${r.p_value?.toFixed(4) || 'N/A'}
  - Lift: ${r.lift_percent?.toFixed(2) || 0}%
  - Significance: ${r.significance}`).join('\n')}

Provide analysis in JSON format:
{
  "summary": "2-3 sentence summary of results",
  "winner": "variant_key of winner or null if no clear winner",
  "confidence": "high/medium/low/insufficient_data",
  "recommendations": ["array of 2-3 actionable recommendations"],
  "next_steps": ["array of 2-3 suggested next steps"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: content.text.slice(0, 500),
      winner: null,
      confidence: 'insufficient_data',
      recommendations: [],
      next_steps: [],
    };
  }
}

export async function aiSuggestExperiments(
  tenantId: string,
  context: {
    business_type?: string;
    current_metrics?: Record<string, number>;
    recent_experiments?: string[];
  }
): Promise<Array<{
  name: string;
  hypothesis: string;
  metric: string;
  priority: string;
}>> {
  const client = getAnthropicClient();

  const prompt = `Suggest A/B test experiments for this business:

CONTEXT:
- Business Type: ${context.business_type || 'Unknown'}
- Current Metrics: ${JSON.stringify(context.current_metrics || {})}
- Recent Experiments: ${context.recent_experiments?.join(', ') || 'None'}

Suggest 3-5 high-impact experiments in JSON format:
{
  "experiments": [
    {
      "name": "Experiment name",
      "hypothesis": "Clear hypothesis statement",
      "metric": "Primary metric to track",
      "priority": "high/medium/low"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return [];
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.experiments || [];
  } catch {
    return [];
  }
}

// =============================================================================
// Experiment Statistics
// =============================================================================

export async function getExperimentStats(tenantId: string): Promise<{
  total: number;
  by_status: Record<EXPStatus, number>;
  by_type: Record<EXPType, number>;
  avg_sample_size: number;
  win_rate: number;
}> {
  const experiments = await listExperiments(tenantId);

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalSampleSize = 0;
  let experimentsWithWinner = 0;
  let completedExperiments = 0;

  for (const exp of experiments) {
    byStatus[exp.status] = (byStatus[exp.status] || 0) + 1;
    byType[exp.experiment_type] = (byType[exp.experiment_type] || 0) + 1;

    if (exp.status === 'completed') {
      completedExperiments++;
      if (exp.winner_variant_id) {
        experimentsWithWinner++;
      }
    }
  }

  // Get sample sizes from variants
  for (const exp of experiments) {
    const variants = await listVariants(exp.id);
    totalSampleSize += variants.reduce((sum, v) => sum + v.total_participants, 0);
  }

  return {
    total: experiments.length,
    by_status: byStatus as Record<EXPStatus, number>,
    by_type: byType as Record<EXPType, number>,
    avg_sample_size: experiments.length > 0 ? Math.round(totalSampleSize / experiments.length) : 0,
    win_rate: completedExperiments > 0 ? experimentsWithWinner / completedExperiments : 0,
  };
}
