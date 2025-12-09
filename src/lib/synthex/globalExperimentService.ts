/**
 * Synthex Global Experiment Orchestrator Service
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * Cross-tenant experiment coordination with segment rollouts
 * and AI-powered analysis
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// LAZY ANTHROPIC CLIENT
// =====================================================

let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientCreatedAt > CLIENT_TTL_MS) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    clientCreatedAt = now;
  }
  return anthropicClient;
}

// =====================================================
// TYPES
// =====================================================

export type ExperimentScope =
  | "global"
  | "tenant"
  | "segment"
  | "cohort"
  | "channel"
  | "region"
  | "custom";

export type ExperimentStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived"
  | "rollback";

export type RolloutStrategy =
  | "immediate"
  | "gradual"
  | "canary"
  | "blue_green"
  | "feature_flag"
  | "time_based"
  | "manual";

export interface GlobalExperiment {
  id: string;
  tenant_id: string;
  experiment_key: string;
  experiment_name: string;
  description?: string;
  exp_scope: ExperimentScope;
  scope_config: Record<string, unknown>;
  exp_status: ExperimentStatus;
  config: Record<string, unknown>;
  variants: Array<{ key: string; name: string; weight: number }>;
  default_variant: string;
  rollout_strategy: RolloutStrategy;
  rollout_config: Record<string, unknown>;
  rollout_percentage: number;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  primary_metric?: string;
  success_criteria: Record<string, unknown>;
  ai_analysis: Record<string, unknown>;
  ai_recommendations: unknown[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentRollout {
  id: string;
  tenant_id: string;
  experiment_id: string;
  segment_key: string;
  segment_name?: string;
  segment_filter: Record<string, unknown>;
  allocation: number;
  variant_allocations: Record<string, number>;
  is_active: boolean;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentMetric {
  id: string;
  tenant_id: string;
  experiment_id: string;
  metric_name: string;
  metric_type: string;
  period_start: string;
  period_end: string;
  period_type: string;
  metric_values: Record<string, unknown>;
  sample_sizes: Record<string, number>;
  confidence_intervals: Record<string, unknown>;
  p_values: Record<string, number>;
  statistical_significance: boolean;
  ai_summary: Record<string, unknown>;
  ai_recommendations: unknown[];
  created_at: string;
}

export interface ExperimentEvent {
  id: string;
  tenant_id: string;
  experiment_id: string;
  event_type: string;
  variant_assigned?: string;
  profile_id?: string;
  anonymous_id?: string;
  session_id?: string;
  context: Record<string, unknown>;
  created_at: string;
}

export interface EvaluationResult {
  enrolled: boolean;
  experiment_id?: string;
  experiment_key?: string;
  variant?: string;
  config?: Record<string, unknown>;
  reason?: string;
}

export interface GlobalExperimentStats {
  total_experiments: number;
  active_experiments: number;
  draft_experiments: number;
  completed_experiments: number;
  experiments_by_scope: Record<string, number>;
  total_rollouts: number;
  total_events: number;
}

// =====================================================
// EXPERIMENT FUNCTIONS
// =====================================================

export async function createExperiment(
  tenantId: string,
  data: {
    experiment_key: string;
    experiment_name: string;
    description?: string;
    exp_scope?: ExperimentScope;
    scope_config?: Record<string, unknown>;
    config?: Record<string, unknown>;
    variants?: Array<{ key: string; name: string; weight: number }>;
    default_variant?: string;
    rollout_strategy?: RolloutStrategy;
    rollout_config?: Record<string, unknown>;
    rollout_percentage?: number;
    scheduled_start?: string;
    scheduled_end?: string;
    primary_metric?: string;
    success_criteria?: Record<string, unknown>;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<GlobalExperiment> {
  const supabase = await createClient();

  const { data: experiment, error } = await supabase
    .from("synthex_geo_experiments")
    .insert({
      tenant_id: tenantId,
      experiment_key: data.experiment_key,
      experiment_name: data.experiment_name,
      description: data.description,
      exp_scope: data.exp_scope || "tenant",
      scope_config: data.scope_config || {},
      exp_status: "draft",
      config: data.config || {},
      variants: data.variants || [
        { key: "control", name: "Control", weight: 50 },
        { key: "treatment", name: "Treatment", weight: 50 },
      ],
      default_variant: data.default_variant || "control",
      rollout_strategy: data.rollout_strategy || "gradual",
      rollout_config: data.rollout_config || {},
      rollout_percentage: data.rollout_percentage ?? 0,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      primary_metric: data.primary_metric,
      success_criteria: data.success_criteria || {},
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create experiment: ${error.message}`);
}
  return experiment as GlobalExperiment;
}

export async function updateExperiment(
  experimentId: string,
  updates: Partial<Omit<GlobalExperiment, "id" | "tenant_id" | "created_at">>
): Promise<GlobalExperiment> {
  const supabase = await createClient();

  const { data: experiment, error } = await supabase
    .from("synthex_geo_experiments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", experimentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update experiment: ${error.message}`);
}
  return experiment as GlobalExperiment;
}

export async function getExperiment(experimentId: string): Promise<GlobalExperiment | null> {
  const supabase = await createClient();

  const { data: experiment, error } = await supabase
    .from("synthex_geo_experiments")
    .select("*")
    .eq("id", experimentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get experiment: ${error.message}`);
  }
  return experiment as GlobalExperiment;
}

export async function getExperimentByKey(
  tenantId: string,
  experimentKey: string
): Promise<GlobalExperiment | null> {
  const supabase = await createClient();

  const { data: experiment, error } = await supabase
    .from("synthex_geo_experiments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("experiment_key", experimentKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get experiment: ${error.message}`);
  }
  return experiment as GlobalExperiment;
}

export async function listExperiments(
  tenantId: string,
  filters?: {
    exp_status?: ExperimentStatus;
    exp_scope?: ExperimentScope;
    search?: string;
    limit?: number;
  }
): Promise<GlobalExperiment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_geo_experiments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.exp_status) {
    query = query.eq("exp_status", filters.exp_status);
  }
  if (filters?.exp_scope) {
    query = query.eq("exp_scope", filters.exp_scope);
  }
  if (filters?.search) {
    query = query.or(
      `experiment_name.ilike.%${filters.search}%,experiment_key.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: experiments, error } = await query;

  if (error) {
throw new Error(`Failed to list experiments: ${error.message}`);
}
  return (experiments || []) as GlobalExperiment[];
}

export async function activateExperiment(experimentId: string): Promise<GlobalExperiment> {
  return updateExperiment(experimentId, {
    exp_status: "active",
    actual_start: new Date().toISOString(),
  } as Partial<GlobalExperiment>);
}

export async function pauseExperiment(experimentId: string): Promise<GlobalExperiment> {
  return updateExperiment(experimentId, {
    exp_status: "paused",
  } as Partial<GlobalExperiment>);
}

export async function completeExperiment(experimentId: string): Promise<GlobalExperiment> {
  return updateExperiment(experimentId, {
    exp_status: "completed",
    actual_end: new Date().toISOString(),
  } as Partial<GlobalExperiment>);
}

// =====================================================
// ROLLOUT FUNCTIONS
// =====================================================

export async function createRollout(
  tenantId: string,
  experimentId: string,
  data: {
    segment_key: string;
    segment_name?: string;
    segment_filter?: Record<string, unknown>;
    allocation?: number;
    variant_allocations?: Record<string, number>;
    metadata?: Record<string, unknown>;
  }
): Promise<ExperimentRollout> {
  const supabase = await createClient();

  const { data: rollout, error } = await supabase
    .from("synthex_geo_rollouts")
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      segment_key: data.segment_key,
      segment_name: data.segment_name,
      segment_filter: data.segment_filter || {},
      allocation: data.allocation ?? 0.5,
      variant_allocations: data.variant_allocations || {},
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create rollout: ${error.message}`);
}
  return rollout as ExperimentRollout;
}

export async function listRollouts(
  experimentId: string,
  filters?: {
    is_active?: boolean;
    limit?: number;
  }
): Promise<ExperimentRollout[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_geo_rollouts")
    .select("*")
    .eq("experiment_id", experimentId)
    .order("created_at", { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: rollouts, error } = await query;

  if (error) {
throw new Error(`Failed to list rollouts: ${error.message}`);
}
  return (rollouts || []) as ExperimentRollout[];
}

export async function updateRollout(
  rolloutId: string,
  updates: Partial<Omit<ExperimentRollout, "id" | "tenant_id" | "experiment_id" | "created_at">>
): Promise<ExperimentRollout> {
  const supabase = await createClient();

  const { data: rollout, error } = await supabase
    .from("synthex_geo_rollouts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rolloutId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update rollout: ${error.message}`);
}
  return rollout as ExperimentRollout;
}

// =====================================================
// EVALUATION FUNCTIONS
// =====================================================

export async function evaluateExperiment(
  tenantId: string,
  experimentKey: string,
  context?: Record<string, unknown>
): Promise<EvaluationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_geo_evaluate_experiment", {
    p_tenant_id: tenantId,
    p_experiment_key: experimentKey,
    p_context: context || {},
  });

  if (error) {
throw new Error(`Failed to evaluate experiment: ${error.message}`);
}
  return data as EvaluationResult;
}

export async function trackEvent(
  tenantId: string,
  data: {
    experiment_id: string;
    event_type: string;
    variant_assigned?: string;
    profile_id?: string;
    anonymous_id?: string;
    session_id?: string;
    context?: Record<string, unknown>;
  }
): Promise<ExperimentEvent> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("synthex_geo_events")
    .insert({
      tenant_id: tenantId,
      experiment_id: data.experiment_id,
      event_type: data.event_type,
      variant_assigned: data.variant_assigned,
      profile_id: data.profile_id,
      anonymous_id: data.anonymous_id,
      session_id: data.session_id,
      context: data.context || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to track event: ${error.message}`);
}
  return event as ExperimentEvent;
}

// =====================================================
// METRICS FUNCTIONS
// =====================================================

export async function recordMetric(
  tenantId: string,
  data: {
    experiment_id: string;
    metric_name: string;
    metric_type?: string;
    period_start: string;
    period_end: string;
    period_type?: string;
    metric_values: Record<string, unknown>;
    sample_sizes?: Record<string, number>;
    confidence_intervals?: Record<string, unknown>;
    p_values?: Record<string, number>;
    statistical_significance?: boolean;
  }
): Promise<ExperimentMetric> {
  const supabase = await createClient();

  const { data: metric, error } = await supabase
    .from("synthex_geo_metrics")
    .insert({
      tenant_id: tenantId,
      experiment_id: data.experiment_id,
      metric_name: data.metric_name,
      metric_type: data.metric_type || "conversion",
      period_start: data.period_start,
      period_end: data.period_end,
      period_type: data.period_type || "daily",
      metric_values: data.metric_values,
      sample_sizes: data.sample_sizes || {},
      confidence_intervals: data.confidence_intervals || {},
      p_values: data.p_values || {},
      statistical_significance: data.statistical_significance ?? false,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record metric: ${error.message}`);
}
  return metric as ExperimentMetric;
}

export async function listMetrics(
  experimentId: string,
  filters?: {
    metric_name?: string;
    period_type?: string;
    limit?: number;
  }
): Promise<ExperimentMetric[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_geo_metrics")
    .select("*")
    .eq("experiment_id", experimentId)
    .order("period_end", { ascending: false });

  if (filters?.metric_name) {
    query = query.eq("metric_name", filters.metric_name);
  }
  if (filters?.period_type) {
    query = query.eq("period_type", filters.period_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: metrics, error } = await query;

  if (error) {
throw new Error(`Failed to list metrics: ${error.message}`);
}
  return (metrics || []) as ExperimentMetric[];
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getStats(tenantId: string): Promise<GlobalExperimentStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_geo_get_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get stats: ${error.message}`);
}
  return data as GlobalExperimentStats;
}

// =====================================================
// AI FUNCTIONS
// =====================================================

export async function aiAnalyzeExperiment(
  tenantId: string,
  experimentId: string
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  winning_variant?: string;
  confidence: number;
}> {
  const supabase = await createClient();

  // Get experiment details
  const experiment = await getExperiment(experimentId);
  if (!experiment) {
    throw new Error("Experiment not found");
  }

  // Get metrics
  const metrics = await listMetrics(experimentId, { limit: 30 });

  // Get events summary
  const { data: eventsSummary } = await supabase
    .from("synthex_geo_events")
    .select("event_type, variant_assigned")
    .eq("experiment_id", experimentId)
    .limit(1000);

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze this A/B experiment and provide insights:

Experiment: ${JSON.stringify(experiment, null, 2)}

Metrics History: ${JSON.stringify(metrics, null, 2)}

Events Summary: ${JSON.stringify(eventsSummary?.slice(0, 100), null, 2)}

Provide analysis including:
1. Executive summary
2. Key insights (list)
3. Recommendations (list)
4. Winning variant (if statistically significant)
5. Confidence level (0-1)

Return JSON:
{
  "summary": "...",
  "insights": ["..."],
  "recommendations": ["..."],
  "winning_variant": "control" or "treatment" or null,
  "confidence": 0.95
}`,
      },
    ],
    system:
      "You are an expert in A/B testing and statistical analysis. Analyze experiments and provide actionable insights based on data.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Update experiment with AI analysis
      await updateExperiment(experimentId, {
        ai_analysis: parsed,
        ai_recommendations: parsed.recommendations || [],
      } as Partial<GlobalExperiment>);

      return {
        summary: parsed.summary || "Analysis complete",
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        winning_variant: parsed.winning_variant,
        confidence: parsed.confidence || 0.5,
      };
    }
  } catch {
    // Parse error
  }

  return {
    summary: "Unable to complete analysis",
    insights: [],
    recommendations: [],
    confidence: 0,
  };
}

export async function aiSuggestExperiments(
  tenantId: string,
  context: {
    goals?: string[];
    current_metrics?: Record<string, unknown>;
    past_experiments?: string[];
  }
): Promise<{
  suggestions: Array<{
    name: string;
    hypothesis: string;
    variants: string[];
    primary_metric: string;
    expected_lift: string;
  }>;
}> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Suggest A/B experiments based on this context:

Goals: ${JSON.stringify(context.goals || [], null, 2)}
Current Metrics: ${JSON.stringify(context.current_metrics || {}, null, 2)}
Past Experiments: ${JSON.stringify(context.past_experiments || [], null, 2)}

Suggest 3-5 experiments with:
- Name
- Hypothesis
- Variants to test
- Primary metric
- Expected lift

Return JSON:
{
  "suggestions": [
    {
      "name": "...",
      "hypothesis": "...",
      "variants": ["control", "variant_a"],
      "primary_metric": "conversion_rate",
      "expected_lift": "5-10%"
    }
  ]
}`,
      },
    ],
    system:
      "You are an experimentation strategist. Suggest high-impact A/B tests based on business goals and historical data.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parse error
  }

  return { suggestions: [] };
}
