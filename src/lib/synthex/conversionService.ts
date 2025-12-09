/**
 * Synthex Multi-Channel Conversion Engine Service
 *
 * Phase D27: AI-powered conversion predictions and optimization
 * across multiple channels with strategy generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
return null;
}
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export type ChannelType =
  | "email"
  | "sms"
  | "push"
  | "web"
  | "social"
  | "ads"
  | "phone"
  | "chat"
  | "in_app";

export type PredictionType =
  | "conversion"
  | "engagement"
  | "churn"
  | "upsell"
  | "reactivation";

export type StrategyStatus =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type ExperimentStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export interface ConversionChannel {
  id: string;
  tenant_id: string;
  channel_name: string;
  channel_type: ChannelType;
  channel_description: string | null;
  channel_config: Record<string, unknown>;
  baseline_conversion_rate: number | null;
  baseline_open_rate: number | null;
  baseline_click_rate: number | null;
  baseline_cost_per_conversion: number | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversionPrediction {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  lead_id: string | null;
  segment: string | null;
  channel: string;
  prediction_type: PredictionType;
  likelihood: number;
  confidence: number;
  urgency_score: number;
  reasoning: Record<string, unknown>;
  recommended_actions: RecommendedAction[];
  predicted_conversion_window_hours: number | null;
  optimal_contact_time: string | null;
  actual_outcome: string | null;
  outcome_recorded_at: string | null;
  prediction_accuracy: number | null;
  status: string;
  expires_at: string | null;
  model_version: string;
  created_at: string;
}

export interface RecommendedAction {
  action: string;
  template?: string;
  priority?: number;
  platform?: string;
  [key: string]: unknown;
}

export interface ConversionStrategy {
  id: string;
  tenant_id: string;
  strategy_name: string;
  strategy_description: string | null;
  strategy_type: string;
  target_segment: string | null;
  target_criteria: Record<string, unknown>;
  target_goal: string | null;
  channels: string[];
  channel_sequence: ChannelStep[];
  ai_generated: boolean;
  ai_reasoning: Record<string, unknown>;
  ai_confidence: number;
  predicted_conversion_rate: number | null;
  predicted_roi: number | null;
  actual_conversion_rate: number | null;
  actual_roi: number | null;
  total_contacts_targeted: number;
  total_conversions: number;
  total_revenue: number;
  is_optimized: boolean;
  optimization_history: unknown[];
  status: StrategyStatus;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelStep {
  channel: string;
  delay_hours: number;
  template?: string;
  condition?: string;
}

export interface ConversionTouchpoint {
  id: string;
  tenant_id: string;
  strategy_id: string | null;
  prediction_id: string | null;
  contact_id: string | null;
  channel: string;
  touchpoint_type: string;
  sequence_position: number;
  content_template: string | null;
  content_personalization: Record<string, unknown>;
  subject_line: string | null;
  message_preview: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  delay_from_previous_hours: number;
  trigger_condition: string | null;
  condition_met: boolean;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  converted_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  conversion_value: number | null;
  engagement_score: number | null;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export interface ConversionExperiment {
  id: string;
  tenant_id: string;
  experiment_name: string;
  experiment_description: string | null;
  hypothesis: string | null;
  variants: ExperimentVariant[];
  control_variant_id: string | null;
  target_segment: string | null;
  traffic_allocation: number;
  primary_metric: string;
  secondary_metrics: string[];
  min_sample_size: number;
  statistical_significance: number;
  results: Record<string, unknown>;
  winner_variant: string | null;
  lift_percentage: number | null;
  significance_achieved: boolean;
  status: ExperimentStatus;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  strategy_id?: string;
  allocation: number;
  [key: string]: unknown;
}

export interface GeneratePredictionInput {
  contact_id?: string;
  lead_id?: string;
  segment?: string;
  channel: string;
  prediction_type?: PredictionType;
  context?: Record<string, unknown>;
}

export interface CreateStrategyInput {
  strategy_name: string;
  strategy_description?: string;
  strategy_type?: string;
  target_segment?: string;
  target_criteria?: Record<string, unknown>;
  target_goal?: string;
  channels: string[];
  channel_sequence?: ChannelStep[];
  ai_generated?: boolean;
}

export interface CreateExperimentInput {
  experiment_name: string;
  experiment_description?: string;
  hypothesis?: string;
  variants: ExperimentVariant[];
  control_variant_id?: string;
  target_segment?: string;
  traffic_allocation?: number;
  primary_metric?: string;
  secondary_metrics?: string[];
  min_sample_size?: number;
  statistical_significance?: number;
}

export interface ConversionStats {
  total_predictions: number;
  active_predictions: number;
  total_strategies: number;
  active_strategies: number;
  total_conversions: number;
  avg_conversion_rate: number;
  avg_prediction_accuracy: number;
  total_revenue: number;
  channel_performance: { channel: string; conversions: number; rate: number }[];
  experiments_running: number;
}

// =====================================================
// Channel Functions
// =====================================================

export async function createChannel(
  tenantId: string,
  input: {
    channel_name: string;
    channel_type: ChannelType;
    channel_description?: string;
    channel_config?: Record<string, unknown>;
    is_default?: boolean;
  },
  userId?: string
): Promise<ConversionChannel> {
  const supabase = await createClient();

  if (input.is_default) {
    await supabase
      .from("synthex_library_conversion_channels")
      .update({ is_default: false })
      .eq("tenant_id", tenantId)
      .eq("channel_type", input.channel_type);
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_channels")
    .insert({
      tenant_id: tenantId,
      channel_name: input.channel_name,
      channel_type: input.channel_type,
      channel_description: input.channel_description,
      channel_config: input.channel_config || {},
      is_default: input.is_default || false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create channel: ${error.message}`);
}
  return data;
}

export async function listChannels(
  tenantId: string,
  filters?: { channel_type?: ChannelType; is_active?: boolean }
): Promise<ConversionChannel[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_conversion_channels")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.channel_type) {
    query = query.eq("channel_type", filters.channel_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list channels: ${error.message}`);
}
  return data || [];
}

export async function updateChannel(
  channelId: string,
  updates: Partial<ConversionChannel>
): Promise<ConversionChannel> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_conversion_channels")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", channelId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update channel: ${error.message}`);
}
  return data;
}

// =====================================================
// Prediction Functions
// =====================================================

export async function generatePrediction(
  tenantId: string,
  input: GeneratePredictionInput
): Promise<ConversionPrediction> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  let likelihood = 0.5;
  let confidence = 0.7;
  let reasoning: Record<string, unknown> = {};
  let recommendedActions: RecommendedAction[] = [];
  let optimalTime: string | null = null;

  if (client) {
    try {
      const prompt = `Generate a conversion prediction for a contact.

Contact ID: ${input.contact_id || "segment-based"}
Segment: ${input.segment || "general"}
Channel: ${input.channel}
Prediction Type: ${input.prediction_type || "conversion"}
Context: ${JSON.stringify(input.context || {})}

Respond with JSON only:
{
  "likelihood": 0.0-1.0,
  "confidence": 0.0-1.0,
  "reasoning": {
    "factors": [{ "name": "string", "weight": 0.0-1.0, "value": 0.0-1.0 }],
    "signals": ["string"],
    "best_time": "HH:MM",
    "best_day": "string"
  },
  "recommended_actions": [
    { "action": "string", "template": "string", "priority": 1 }
  ],
  "conversion_window_hours": number
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          const parsed = JSON.parse(content.text);
          likelihood = parsed.likelihood || 0.5;
          confidence = parsed.confidence || 0.7;
          reasoning = parsed.reasoning || {};
          recommendedActions = parsed.recommended_actions || [];
          if (parsed.reasoning?.best_time) {
            const now = new Date();
            const [hours, minutes] = parsed.reasoning.best_time.split(":");
            now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            if (now < new Date()) {
              now.setDate(now.getDate() + 1);
            }
            optimalTime = now.toISOString();
          }
        } catch {
          reasoning = { raw: content.text };
        }
      }
    } catch (error) {
      console.error("[conversionService] AI prediction failed:", error);
    }
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_predictions")
    .insert({
      tenant_id: tenantId,
      contact_id: input.contact_id,
      lead_id: input.lead_id,
      segment: input.segment,
      channel: input.channel,
      prediction_type: input.prediction_type || "conversion",
      likelihood,
      confidence,
      reasoning,
      recommended_actions: recommendedActions,
      optimal_contact_time: optimalTime,
      status: "active",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create prediction: ${error.message}`);
}
  return data;
}

export async function listPredictions(
  tenantId: string,
  filters?: {
    contact_id?: string;
    channel?: string;
    prediction_type?: PredictionType;
    min_likelihood?: number;
    status?: string;
    limit?: number;
  }
): Promise<ConversionPrediction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_conversion_predictions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("likelihood", { ascending: false });

  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.prediction_type) {
    query = query.eq("prediction_type", filters.prediction_type);
  }
  if (filters?.min_likelihood) {
    query = query.gte("likelihood", filters.min_likelihood);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list predictions: ${error.message}`);
}
  return data || [];
}

export async function recordPredictionOutcome(
  predictionId: string,
  outcome: string,
  accuracy?: number
): Promise<ConversionPrediction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_conversion_predictions")
    .update({
      actual_outcome: outcome,
      outcome_recorded_at: new Date().toISOString(),
      prediction_accuracy: accuracy,
      status: "validated",
    })
    .eq("id", predictionId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record outcome: ${error.message}`);
}
  return data;
}

// =====================================================
// Strategy Functions
// =====================================================

export async function generateStrategy(
  tenantId: string,
  input: CreateStrategyInput,
  userId?: string
): Promise<ConversionStrategy> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  let channelSequence = input.channel_sequence || [];
  let aiReasoning: Record<string, unknown> = {};
  let aiConfidence = 0.7;
  let predictedRate = 0.1;
  let predictedRoi = 1.5;

  if (client && input.ai_generated !== false) {
    try {
      const prompt = `Generate a multi-channel conversion strategy.

Strategy Name: ${input.strategy_name}
Target Segment: ${input.target_segment || "general"}
Target Goal: ${input.target_goal || "conversion"}
Available Channels: ${JSON.stringify(input.channels)}
Target Criteria: ${JSON.stringify(input.target_criteria || {})}

Respond with JSON only:
{
  "channel_sequence": [
    { "channel": "string", "delay_hours": number, "template": "string", "condition": "string" }
  ],
  "reasoning": {
    "strategy": "string",
    "rationale": ["string"],
    "expected_touchpoints": number
  },
  "confidence": 0.0-1.0,
  "predicted_conversion_rate": 0.0-1.0,
  "predicted_roi": number
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          const parsed = JSON.parse(content.text);
          channelSequence = parsed.channel_sequence || channelSequence;
          aiReasoning = parsed.reasoning || {};
          aiConfidence = parsed.confidence || 0.7;
          predictedRate = parsed.predicted_conversion_rate || 0.1;
          predictedRoi = parsed.predicted_roi || 1.5;
        } catch {
          aiReasoning = { raw: content.text };
        }
      }
    } catch (error) {
      console.error("[conversionService] AI strategy generation failed:", error);
    }
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_strategies")
    .insert({
      tenant_id: tenantId,
      strategy_name: input.strategy_name,
      strategy_description: input.strategy_description,
      strategy_type: input.strategy_type || "multi_channel",
      target_segment: input.target_segment,
      target_criteria: input.target_criteria || {},
      target_goal: input.target_goal,
      channels: input.channels,
      channel_sequence: channelSequence,
      ai_generated: input.ai_generated !== false,
      ai_reasoning: aiReasoning,
      ai_confidence: aiConfidence,
      predicted_conversion_rate: predictedRate,
      predicted_roi: predictedRoi,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create strategy: ${error.message}`);
}
  return data;
}

export async function getStrategy(
  tenantId: string,
  strategyId: string
): Promise<ConversionStrategy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_conversion_strategies")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", strategyId)
    .single();

  if (error) {
return null;
}
  return data;
}

export async function listStrategies(
  tenantId: string,
  filters?: { status?: StrategyStatus; target_segment?: string; limit?: number }
): Promise<ConversionStrategy[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_conversion_strategies")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.target_segment) {
    query = query.eq("target_segment", filters.target_segment);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list strategies: ${error.message}`);
}
  return data || [];
}

export async function updateStrategyStatus(
  strategyId: string,
  status: StrategyStatus
): Promise<ConversionStrategy> {
  const supabase = await createClient();

  const updates: Partial<ConversionStrategy> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "active") {
    updates.started_at = new Date().toISOString();
  } else if (status === "completed" || status === "archived") {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_strategies")
    .update(updates)
    .eq("id", strategyId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update strategy: ${error.message}`);
}
  return data;
}

// =====================================================
// Touchpoint Functions
// =====================================================

export async function createTouchpoint(
  tenantId: string,
  input: {
    strategy_id?: string;
    prediction_id?: string;
    contact_id?: string;
    channel: string;
    touchpoint_type?: string;
    sequence_position?: number;
    content_template?: string;
    subject_line?: string;
    message_preview?: string;
    scheduled_at?: string;
    delay_from_previous_hours?: number;
    trigger_condition?: string;
  }
): Promise<ConversionTouchpoint> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_conversion_touchpoints")
    .insert({
      tenant_id: tenantId,
      strategy_id: input.strategy_id,
      prediction_id: input.prediction_id,
      contact_id: input.contact_id,
      channel: input.channel,
      touchpoint_type: input.touchpoint_type || "initial",
      sequence_position: input.sequence_position || 1,
      content_template: input.content_template,
      subject_line: input.subject_line,
      message_preview: input.message_preview,
      scheduled_at: input.scheduled_at || new Date().toISOString(),
      delay_from_previous_hours: input.delay_from_previous_hours || 0,
      trigger_condition: input.trigger_condition,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create touchpoint: ${error.message}`);
}
  return data;
}

export async function listTouchpoints(
  tenantId: string,
  filters?: {
    strategy_id?: string;
    contact_id?: string;
    channel?: string;
    status?: string;
    limit?: number;
  }
): Promise<ConversionTouchpoint[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_conversion_touchpoints")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: false });

  if (filters?.strategy_id) {
    query = query.eq("strategy_id", filters.strategy_id);
  }
  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list touchpoints: ${error.message}`);
}
  return data || [];
}

export async function updateTouchpointStatus(
  touchpointId: string,
  status: string,
  additionalUpdates?: Partial<ConversionTouchpoint>
): Promise<ConversionTouchpoint> {
  const supabase = await createClient();

  const updates: Partial<ConversionTouchpoint> = { status, ...additionalUpdates };

  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  } else if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  } else if (status === "opened") {
    updates.opened_at = new Date().toISOString();
  } else if (status === "clicked") {
    updates.clicked_at = new Date().toISOString();
  } else if (status === "converted") {
    updates.converted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_touchpoints")
    .update(updates)
    .eq("id", touchpointId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update touchpoint: ${error.message}`);
}
  return data;
}

// =====================================================
// Experiment Functions
// =====================================================

export async function createExperiment(
  tenantId: string,
  input: CreateExperimentInput,
  userId?: string
): Promise<ConversionExperiment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_conversion_experiments")
    .insert({
      tenant_id: tenantId,
      experiment_name: input.experiment_name,
      experiment_description: input.experiment_description,
      hypothesis: input.hypothesis,
      variants: input.variants,
      control_variant_id: input.control_variant_id,
      target_segment: input.target_segment,
      traffic_allocation: input.traffic_allocation || 100,
      primary_metric: input.primary_metric || "conversion_rate",
      secondary_metrics: input.secondary_metrics || [],
      min_sample_size: input.min_sample_size || 100,
      statistical_significance: input.statistical_significance || 0.95,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create experiment: ${error.message}`);
}
  return data;
}

export async function listExperiments(
  tenantId: string,
  filters?: { status?: ExperimentStatus; limit?: number }
): Promise<ConversionExperiment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_conversion_experiments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
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

export async function updateExperimentStatus(
  experimentId: string,
  status: ExperimentStatus
): Promise<ConversionExperiment> {
  const supabase = await createClient();

  const updates: Partial<ConversionExperiment> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "running") {
    updates.started_at = new Date().toISOString();
  } else if (status === "completed" || status === "cancelled") {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("synthex_library_conversion_experiments")
    .update(updates)
    .eq("id", experimentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update experiment: ${error.message}`);
}
  return data;
}

// =====================================================
// Statistics Functions
// =====================================================

export async function getConversionStats(tenantId: string): Promise<ConversionStats> {
  const supabase = await createClient();

  const [predictions, strategies, touchpoints, experiments] = await Promise.all([
    supabase
      .from("synthex_library_conversion_predictions")
      .select("id, status, likelihood")
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_conversion_strategies")
      .select("id, status, total_conversions, total_revenue")
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_conversion_touchpoints")
      .select("id, channel, status, conversion_value")
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_conversion_experiments")
      .select("id, status")
      .eq("tenant_id", tenantId),
  ]);

  const totalPredictions = predictions.data?.length || 0;
  const activePredictions =
    predictions.data?.filter((p) => p.status === "active").length || 0;

  const totalStrategies = strategies.data?.length || 0;
  const activeStrategies =
    strategies.data?.filter((s) => s.status === "active").length || 0;
  const totalRevenue =
    strategies.data?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0;

  const totalConversions =
    touchpoints.data?.filter((t) => t.status === "converted").length || 0;
  const totalTouchpoints = touchpoints.data?.length || 0;
  const avgConversionRate =
    totalTouchpoints > 0 ? totalConversions / totalTouchpoints : 0;

  // Channel performance
  const channelMap = new Map<string, { conversions: number; total: number }>();
  touchpoints.data?.forEach((t) => {
    const current = channelMap.get(t.channel) || { conversions: 0, total: 0 };
    current.total++;
    if (t.status === "converted") {
      current.conversions++;
    }
    channelMap.set(t.channel, current);
  });

  const channelPerformance = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      conversions: data.conversions,
      rate: data.total > 0 ? data.conversions / data.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const experimentsRunning =
    experiments.data?.filter((e) => e.status === "running").length || 0;

  return {
    total_predictions: totalPredictions,
    active_predictions: activePredictions,
    total_strategies: totalStrategies,
    active_strategies: activeStrategies,
    total_conversions: totalConversions,
    avg_conversion_rate: avgConversionRate,
    avg_prediction_accuracy: 0, // Would calculate from validated predictions
    total_revenue: totalRevenue,
    channel_performance: channelPerformance,
    experiments_running: experimentsRunning,
  };
}

// =====================================================
// Initialization
// =====================================================

export async function initializeDefaultChannels(
  tenantId: string,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  const defaultChannels = [
    {
      channel_name: "Email",
      channel_type: "email",
      channel_description: "Email marketing channel",
      baseline_conversion_rate: 0.03,
      baseline_open_rate: 0.25,
      baseline_click_rate: 0.05,
      is_default: true,
    },
    {
      channel_name: "SMS",
      channel_type: "sms",
      channel_description: "SMS marketing channel",
      baseline_conversion_rate: 0.05,
      baseline_open_rate: 0.95,
      baseline_click_rate: 0.1,
      is_default: false,
    },
    {
      channel_name: "Push Notifications",
      channel_type: "push",
      channel_description: "Web and mobile push notifications",
      baseline_conversion_rate: 0.02,
      baseline_open_rate: 0.4,
      baseline_click_rate: 0.08,
      is_default: false,
    },
    {
      channel_name: "In-App Messages",
      channel_type: "in_app",
      channel_description: "In-app messaging and modals",
      baseline_conversion_rate: 0.08,
      baseline_open_rate: 0.9,
      baseline_click_rate: 0.15,
      is_default: false,
    },
  ];

  for (const channel of defaultChannels) {
    const { data: existing } = await supabase
      .from("synthex_library_conversion_channels")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("channel_name", channel.channel_name)
      .single();

    if (!existing) {
      await supabase.from("synthex_library_conversion_channels").insert({
        tenant_id: tenantId,
        ...channel,
        created_by: userId,
      });
    }
  }
}
