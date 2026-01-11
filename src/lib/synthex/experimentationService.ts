/**
 * Synthex Experimentation Service
 * Phase: D36 - Autonomous Experimentation Framework (AXF v1)
 *
 * Provides:
 * - A/B test management
 * - Variant configuration
 * - Traffic allocation
 * - Assignment tracking
 * - Results analysis
 * - Feature flags
 * - AI-powered optimization
 */

import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// =====================================================
// Types
// =====================================================

export type ExperimentType =
  | 'ab_test'
  | 'multivariate'
  | 'split_url'
  | 'bandit'
  | 'feature_flag'
  | 'personalization'
  | 'holdout'
  | 'sequential';

export type ExperimentStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'stopped_early';

export type VariantType = 'control' | 'treatment' | 'challenger' | 'champion';

export type SignificanceLevel =
  | 'not_significant'
  | 'marginally_significant'
  | 'significant'
  | 'highly_significant';

export interface Experiment {
  id: string;
  tenant_id: string;
  experiment_name: string;
  experiment_description?: string;
  experiment_type: ExperimentType;
  hypothesis?: string;
  status: ExperimentStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  traffic_percentage: number;
  targeting_rules?: Record<string, unknown>[];
  audience_segments?: string[];
  primary_metric: string;
  secondary_metrics?: string[];
  confidence_level: number;
  target_sample_size?: number;
  current_sample_size: number;
  winner_variant_id?: string;
  winning_probability?: number;
  estimated_lift?: number;
  statistical_significance: SignificanceLevel;
  ai_auto_optimize: boolean;
  ai_early_stopping: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_name: string;
  variant_description?: string;
  variant_type: VariantType;
  variant_key: string;
  traffic_weight: number;
  current_traffic_weight?: number;
  changes?: Record<string, unknown>;
  feature_flags?: Record<string, unknown>;
  content_overrides?: Record<string, unknown>;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  avg_order_value?: number;
  sample_size: number;
  lift_vs_control?: number;
  p_value?: number;
  is_winner: boolean;
  ai_performance_score?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  unified_profile_id?: string;
  anonymous_id?: string;
  session_id?: string;
  assignment_timestamp: string;
  assignment_method: string;
  has_converted: boolean;
  conversion_timestamp?: string;
  conversion_value?: number;
  attributes?: Record<string, unknown>;
  created_at: string;
}

export interface ExperimentEvent {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  assignment_id?: string;
  event_type: string;
  event_name?: string;
  event_timestamp: string;
  event_value: number;
  event_properties?: Record<string, unknown>;
  created_at: string;
}

export interface ExperimentResults {
  id: string;
  tenant_id: string;
  experiment_id: string;
  snapshot_timestamp: string;
  snapshot_type: string;
  total_sample_size: number;
  total_conversions: number;
  total_revenue: number;
  variant_results: Record<string, unknown>[];
  current_winner_id?: string;
  winner_probability?: number;
  significance_level: SignificanceLevel;
  should_stop_early: boolean;
  stop_reason?: string;
  ai_analysis?: Record<string, unknown>;
  ai_recommendations?: Record<string, unknown>[];
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  flag_key: string;
  flag_name: string;
  flag_description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  targeting_rules?: Record<string, unknown>[];
  user_segments?: string[];
  default_value: unknown;
  variant_values?: Record<string, unknown>;
  experiment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  template_description?: string;
  experiment_type: ExperimentType;
  category?: string;
  default_variants?: Record<string, unknown>[];
  default_metrics?: Record<string, unknown>;
  usage_count: number;
  is_public: boolean;
  created_at: string;
}

export interface ExperimentationStats {
  total_experiments: number;
  running_experiments: number;
  completed_experiments: number;
  total_variants: number;
  total_assignments: number;
  total_conversions: number;
  total_events: number;
  active_feature_flags: number;
  experiments_by_type: Record<string, number>;
  experiments_by_status: Record<string, number>;
  avg_conversion_rate: number;
  total_revenue_from_experiments: number;
}

// =====================================================
// Lazy Anthropic Client
// =====================================================

let anthropicClient: Anthropic | null = null;
let lastClientCreation = 0;
const CLIENT_TTL = 60_000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - lastClientCreation > CLIENT_TTL) {
    anthropicClient = new Anthropic();
    lastClientCreation = now;
  }
  return anthropicClient;
}

// =====================================================
// Experiment Functions
// =====================================================

export async function createExperiment(
  tenantId: string,
  data: {
    experiment_name: string;
    experiment_description?: string;
    experiment_type?: ExperimentType;
    hypothesis?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    traffic_percentage?: number;
    targeting_rules?: Record<string, unknown>[];
    audience_segments?: string[];
    exclusion_segments?: string[];
    primary_metric: string;
    secondary_metrics?: string[];
    minimum_detectable_effect?: number;
    confidence_level?: number;
    target_sample_size?: number;
    test_type?: string;
    ai_auto_optimize?: boolean;
    ai_early_stopping?: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  createdBy?: string
): Promise<Experiment> {
  const supabase = await createClient();

  const { data: experiment, error } = await supabase
    .from('synthex_axf_experiments')
    .insert({
      tenant_id: tenantId,
      experiment_name: data.experiment_name,
      experiment_description: data.experiment_description,
      exp_type: data.experiment_type || 'ab_test',
      hypothesis: data.hypothesis,
      exp_status: 'draft',
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      traffic_percentage: data.traffic_percentage ?? 100,
      targeting_rules: data.targeting_rules || [],
      audience_segments: data.audience_segments,
      exclusion_segments: data.exclusion_segments,
      primary_metric: data.primary_metric,
      secondary_metrics: data.secondary_metrics || [],
      minimum_detectable_effect: data.minimum_detectable_effect,
      confidence_level: data.confidence_level ?? 0.95,
      target_sample_size: data.target_sample_size,
      test_type: data.test_type || 'two_sided',
      ai_auto_optimize: data.ai_auto_optimize ?? false,
      ai_early_stopping: data.ai_early_stopping ?? true,
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create experiment: ${error.message}`);
}
  return experiment;
}

export async function getExperiment(experimentId: string): Promise<Experiment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_experiments')
    .select('*')
    .eq('id', experimentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get experiment: ${error.message}`);
  }
  return data;
}

export async function listExperiments(
  tenantId: string,
  filters?: {
    status?: ExperimentStatus;
    experiment_type?: ExperimentType;
    search?: string;
    limit?: number;
  }
): Promise<Experiment[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_experiments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('exp_status', filters.status);
  }
  if (filters?.experiment_type) {
    query = query.eq('exp_type', filters.experiment_type);
  }
  if (filters?.search) {
    query = query.ilike('experiment_name', `%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list experiments: ${error.message}`);
}
  return data || [];
}

export async function updateExperiment(
  experimentId: string,
  updates: Partial<Experiment>
): Promise<Experiment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_experiments')
    .update(updates)
    .eq('id', experimentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update experiment: ${error.message}`);
}
  return data;
}

export async function startExperiment(experimentId: string): Promise<Experiment> {
  return updateExperiment(experimentId, {
    exp_status: 'running',
    actual_start: new Date().toISOString(),
  } as unknown as Partial<Experiment>);
}

export async function pauseExperiment(experimentId: string): Promise<Experiment> {
  return updateExperiment(experimentId, { exp_status: 'paused' } as unknown as Partial<Experiment>);
}

export async function stopExperiment(
  experimentId: string,
  reason?: string
): Promise<Experiment> {
  return updateExperiment(experimentId, {
    exp_status: 'stopped_early',
    actual_end: new Date().toISOString(),
    metadata: { stop_reason: reason },
  } as unknown as Partial<Experiment>);
}

export async function completeExperiment(experimentId: string): Promise<Experiment> {
  return updateExperiment(experimentId, {
    exp_status: 'completed',
    actual_end: new Date().toISOString(),
  } as unknown as Partial<Experiment>);
}

// =====================================================
// Variant Functions
// =====================================================

export async function createVariant(
  tenantId: string,
  experimentId: string,
  data: {
    variant_name: string;
    variant_description?: string;
    variant_type?: VariantType;
    variant_key: string;
    traffic_weight?: number;
    changes?: Record<string, unknown>;
    feature_flags?: Record<string, unknown>;
    content_overrides?: Record<string, unknown>;
    display_order?: number;
  }
): Promise<Variant> {
  const supabase = await createClient();

  const { data: variant, error } = await supabase
    .from('synthex_axf_variants')
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      variant_name: data.variant_name,
      variant_description: data.variant_description,
      var_type: data.variant_type || 'treatment',
      variant_key: data.variant_key,
      traffic_weight: data.traffic_weight ?? 50,
      changes: data.changes || {},
      feature_flags: data.feature_flags || {},
      content_overrides: data.content_overrides || {},
      display_order: data.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create variant: ${error.message}`);
}
  return variant;
}

export async function getVariant(variantId: string): Promise<Variant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_variants')
    .select('*')
    .eq('id', variantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get variant: ${error.message}`);
  }
  return data;
}

export async function listVariants(
  experimentId: string,
  filters?: { variant_type?: VariantType }
): Promise<Variant[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('display_order', { ascending: true });

  if (filters?.variant_type) {
    query = query.eq('var_type', filters.variant_type);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list variants: ${error.message}`);
}
  return data || [];
}

export async function updateVariant(
  variantId: string,
  updates: Partial<Variant>
): Promise<Variant> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_variants')
    .update(updates)
    .eq('id', variantId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update variant: ${error.message}`);
}
  return data;
}

// =====================================================
// Assignment Functions
// =====================================================

export async function assignToExperiment(
  tenantId: string,
  experimentId: string,
  data: {
    profile_id?: string;
    anonymous_id?: string;
    session_id?: string;
  }
): Promise<string | null> {
  const supabase = await createClient();

  const { data: assignmentId, error } = await supabase.rpc('assign_to_experiment', {
    p_tenant_id: tenantId,
    p_experiment_id: experimentId,
    p_profile_id: data.profile_id,
    p_anonymous_id: data.anonymous_id,
    p_session_id: data.session_id,
  });

  if (error) {
throw new Error(`Failed to assign to experiment: ${error.message}`);
}
  return assignmentId;
}

export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get assignment: ${error.message}`);
  }
  return data;
}

export async function listAssignments(
  tenantId: string,
  filters?: {
    experiment_id?: string;
    variant_id?: string;
    has_converted?: boolean;
    limit?: number;
  }
): Promise<Assignment[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_assignments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('assignment_timestamp', { ascending: false });

  if (filters?.experiment_id) {
    query = query.eq('experiment_id', filters.experiment_id);
  }
  if (filters?.variant_id) {
    query = query.eq('variant_id', filters.variant_id);
  }
  if (filters?.has_converted !== undefined) {
    query = query.eq('has_converted', filters.has_converted);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list assignments: ${error.message}`);
}
  return data || [];
}

export async function recordConversion(
  assignmentId: string,
  conversionValue: number = 0
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('record_experiment_conversion', {
    p_assignment_id: assignmentId,
    p_conversion_value: conversionValue,
  });

  if (error) {
throw new Error(`Failed to record conversion: ${error.message}`);
}
  return data;
}

// =====================================================
// Event Functions
// =====================================================

export async function trackEvent(
  tenantId: string,
  data: {
    experiment_id: string;
    variant_id: string;
    assignment_id?: string;
    event_type: string;
    event_name?: string;
    event_value?: number;
    event_properties?: Record<string, unknown>;
    page_url?: string;
    element_id?: string;
    session_id?: string;
  }
): Promise<ExperimentEvent> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from('synthex_axf_events')
    .insert({
      tenant_id: tenantId,
      experiment_id: data.experiment_id,
      variant_id: data.variant_id,
      assignment_id: data.assignment_id,
      event_type: data.event_type,
      event_name: data.event_name,
      event_value: data.event_value ?? 0,
      event_properties: data.event_properties || {},
      page_url: data.page_url,
      element_id: data.element_id,
      session_id: data.session_id,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to track event: ${error.message}`);
}
  return event;
}

export async function listEvents(
  tenantId: string,
  filters?: {
    experiment_id?: string;
    variant_id?: string;
    event_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<ExperimentEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('event_timestamp', { ascending: false });

  if (filters?.experiment_id) {
    query = query.eq('experiment_id', filters.experiment_id);
  }
  if (filters?.variant_id) {
    query = query.eq('variant_id', filters.variant_id);
  }
  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type);
  }
  if (filters?.start_date) {
    query = query.gte('event_timestamp', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('event_timestamp', filters.end_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list events: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Results Functions
// =====================================================

export async function getExperimentResults(
  experimentId: string
): Promise<ExperimentResults | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_results')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('snapshot_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get results: ${error.message}`);
  }
  return data;
}

export async function listResults(
  experimentId: string,
  filters?: { snapshot_type?: string; limit?: number }
): Promise<ExperimentResults[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_results')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('snapshot_timestamp', { ascending: false });

  if (filters?.snapshot_type) {
    query = query.eq('snapshot_type', filters.snapshot_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list results: ${error.message}`);
}
  return data || [];
}

export async function calculateStats(
  experimentId: string
): Promise<Array<{ variant_id: string; variant_name: string; sample_size: number; conversions: number; conversion_rate: number; lift_vs_control: number; p_value: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('calculate_experiment_stats', {
    p_experiment_id: experimentId,
  });

  if (error) {
throw new Error(`Failed to calculate stats: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Feature Flag Functions
// =====================================================

export async function createFeatureFlag(
  tenantId: string,
  data: {
    flag_key: string;
    flag_name: string;
    flag_description?: string;
    is_enabled?: boolean;
    rollout_percentage?: number;
    targeting_rules?: Record<string, unknown>[];
    user_segments?: string[];
    default_value?: unknown;
    variant_values?: Record<string, unknown>;
    experiment_id?: string;
  },
  createdBy?: string
): Promise<FeatureFlag> {
  const supabase = await createClient();

  const { data: flag, error } = await supabase
    .from('synthex_axf_feature_flags')
    .insert({
      tenant_id: tenantId,
      flag_key: data.flag_key,
      flag_name: data.flag_name,
      flag_description: data.flag_description,
      is_enabled: data.is_enabled ?? false,
      rollout_percentage: data.rollout_percentage ?? 0,
      targeting_rules: data.targeting_rules || [],
      user_segments: data.user_segments,
      default_value: data.default_value ?? false,
      variant_values: data.variant_values || {},
      experiment_id: data.experiment_id,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create feature flag: ${error.message}`);
}
  return flag;
}

export async function getFeatureFlag(flagId: string): Promise<FeatureFlag | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_feature_flags')
    .select('*')
    .eq('id', flagId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get feature flag: ${error.message}`);
  }
  return data;
}

export async function getFeatureFlagByKey(
  tenantId: string,
  flagKey: string
): Promise<FeatureFlag | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('flag_key', flagKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get feature flag: ${error.message}`);
  }
  return data;
}

export async function listFeatureFlags(
  tenantId: string,
  filters?: { is_enabled?: boolean; limit?: number }
): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('flag_name', { ascending: true });

  if (filters?.is_enabled !== undefined) {
    query = query.eq('is_enabled', filters.is_enabled);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list feature flags: ${error.message}`);
}
  return data || [];
}

export async function updateFeatureFlag(
  flagId: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_axf_feature_flags')
    .update(updates)
    .eq('id', flagId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update feature flag: ${error.message}`);
}
  return data;
}

export async function toggleFeatureFlag(
  flagId: string,
  enabled: boolean
): Promise<FeatureFlag> {
  return updateFeatureFlag(flagId, { is_enabled: enabled } as Partial<FeatureFlag>);
}

// =====================================================
// Template Functions
// =====================================================

export async function listTemplates(
  tenantId: string,
  filters?: { experiment_type?: ExperimentType; is_public?: boolean; limit?: number }
): Promise<ExperimentTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_axf_templates')
    .select('*')
    .order('usage_count', { ascending: false });

  // Show public templates or tenant's own
  if (filters?.is_public) {
    query = query.eq('is_public', true);
  } else {
    query = query.or(`tenant_id.eq.${tenantId},is_public.eq.true`);
  }

  if (filters?.experiment_type) {
    query = query.eq('experiment_type', filters.experiment_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Stats Function
// =====================================================

export async function getExperimentationStats(tenantId: string): Promise<ExperimentationStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_experimentation_stats', {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get experimentation stats: ${error.message}`);
}
  return data;
}

// =====================================================
// AI Functions
// =====================================================

export async function aiAnalyzeExperiment(
  tenantId: string,
  experimentId: string
): Promise<{
  winner_recommendation: string;
  confidence: number;
  insights: Array<{ variant: string; insight: string }>;
  recommendations: string[];
  should_stop_early: boolean;
  stop_reason?: string;
  estimated_lift: number;
}> {
  const anthropic = getAnthropicClient();

  // Get experiment data
  const [experiment, variants, stats] = await Promise.all([
    getExperiment(experimentId),
    listVariants(experimentId),
    calculateStats(experimentId),
  ]);

  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Analyze this A/B test experiment and provide recommendations:

Experiment: ${experiment.experiment_name}
Hypothesis: ${experiment.hypothesis || 'Not specified'}
Primary Metric: ${experiment.primary_metric}
Confidence Level: ${experiment.confidence_level}
Current Sample Size: ${experiment.current_sample_size}

Variants and Stats:
${JSON.stringify(stats, null, 2)}

Full Variant Data:
${JSON.stringify(variants, null, 2)}

Provide:
1. Winner recommendation (variant name or "no clear winner")
2. Confidence score (0-1)
3. Per-variant insights
4. Strategic recommendations
5. Whether to stop early (boolean)
6. If stopping early, the reason
7. Estimated lift percentage

Return as JSON with keys: winner_recommendation, confidence, insights, recommendations, should_stop_early, stop_reason, estimated_lift`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    return {
      winner_recommendation: 'Unable to determine',
      confidence: 0.5,
      insights: [],
      recommendations: [],
      should_stop_early: false,
      estimated_lift: 0,
    };
  }
}

export async function aiOptimizeTraffic(
  tenantId: string,
  experimentId: string
): Promise<{
  variant_allocations: Array<{ variant_id: string; new_weight: number }>;
  reasoning: string;
  expected_improvement: number;
}> {
  const anthropic = getAnthropicClient();

  const [variants, stats] = await Promise.all([
    listVariants(experimentId),
    calculateStats(experimentId),
  ]);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Optimize traffic allocation for this experiment using multi-armed bandit principles:

Current Variants and Performance:
${JSON.stringify(stats, null, 2)}

Current Traffic Weights:
${variants.map((v) => `${v.variant_name}: ${v.traffic_weight}%`).join('\n')}

Provide new traffic allocations that:
1. Explore underperforming variants enough to gain statistical confidence
2. Exploit high-performing variants to maximize conversions
3. Maintain minimum viable traffic to all variants

Return as JSON with keys: variant_allocations (array of {variant_id, new_weight}), reasoning, expected_improvement (percentage)`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    return {
      variant_allocations: variants.map((v) => ({
        variant_id: v.id,
        new_weight: v.traffic_weight,
      })),
      reasoning: 'Unable to optimize',
      expected_improvement: 0,
    };
  }
}

export async function aiGenerateHypothesis(
  tenantId: string,
  context: {
    page_type?: string;
    current_metrics?: Record<string, number>;
    past_experiments?: Array<{ name: string; result: string }>;
    goals?: string[];
  }
): Promise<{
  hypotheses: Array<{
    hypothesis: string;
    expected_impact: string;
    priority: string;
    suggested_variants: string[];
  }>;
}> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Generate A/B test hypotheses based on this context:

Page Type: ${context.page_type || 'Not specified'}
Current Metrics: ${JSON.stringify(context.current_metrics || {})}
Past Experiments: ${JSON.stringify(context.past_experiments || [])}
Goals: ${context.goals?.join(', ') || 'Increase conversions'}

Generate 3-5 testable hypotheses. Each should have:
1. Clear hypothesis statement
2. Expected impact
3. Priority (high/medium/low)
4. Suggested variant ideas

Return as JSON with key: hypotheses (array of objects with hypothesis, expected_impact, priority, suggested_variants)`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    return {
      hypotheses: [],
    };
  }
}
