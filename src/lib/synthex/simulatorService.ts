/**
 * Synthex AI-Powered Outcome Simulator Service
 *
 * Phase: D33 - Outcome Simulator
 *
 * Simulation runs for Campaign, SEO, and Audience outcomes
 * with scenario modeling, Monte Carlo simulation, and AI analysis
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

export type SimulationType =
  | "campaign"
  | "seo"
  | "audience"
  | "revenue"
  | "engagement"
  | "churn"
  | "conversion"
  | "content"
  | "pricing"
  | "ab_test"
  | "custom";

export type SimulationStatus =
  | "draft"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "archived";

export type ScenarioType =
  | "baseline"
  | "optimistic"
  | "pessimistic"
  | "conservative"
  | "aggressive"
  | "custom";

export type PredictionConfidence =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export interface SimulationRun {
  id: string;
  tenant_id: string;
  simulation_name: string;
  simulation_description?: string;
  simulation_type: SimulationType;
  target_entity_type?: string;
  target_entity_id?: string;
  time_horizon_days: number;
  start_date?: string;
  end_date?: string;
  input_parameters: Record<string, unknown>;
  baseline_metrics: Record<string, unknown>;
  assumptions: Record<string, unknown>;
  constraints: Record<string, unknown>;
  monte_carlo_iterations: number;
  confidence_level: number;
  model_type: string;
  status: SimulationStatus;
  status_message?: string;
  progress_percent: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  primary_outcome?: Record<string, unknown>;
  outcome_distribution?: Record<string, unknown>;
  key_insights?: string[];
  recommendations?: string[];
  risk_factors: unknown[];
  ai_narrative?: string;
  ai_confidence?: number;
  tokens_used: number;
  compute_cost: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SimulationScenario {
  id: string;
  tenant_id: string;
  simulation_id: string;
  scenario_name: string;
  scenario_description?: string;
  scenario_type: ScenarioType;
  parameter_overrides: Record<string, unknown>;
  assumption_overrides: Record<string, unknown>;
  multipliers: Record<string, unknown>;
  probability_weight: number;
  predicted_outcomes: Record<string, unknown>;
  outcome_range?: Record<string, unknown>;
  confidence_interval?: Record<string, unknown>;
  delta_from_baseline?: Record<string, unknown>;
  percentage_change?: Record<string, unknown>;
  positive_factors?: string[];
  negative_factors?: string[];
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SimulationPrediction {
  id: string;
  tenant_id: string;
  simulation_id: string;
  scenario_id?: string;
  metric_name: string;
  metric_category?: string;
  predicted_value?: number;
  predicted_min?: number;
  predicted_max?: number;
  predicted_mean?: number;
  predicted_median?: number;
  standard_deviation?: number;
  p5?: number;
  p10?: number;
  p25?: number;
  p75?: number;
  p90?: number;
  p95?: number;
  confidence: PredictionConfidence;
  confidence_score?: number;
  confidence_reasoning?: string;
  prediction_date?: string;
  prediction_period?: string;
  baseline_value?: number;
  absolute_change?: number;
  percentage_change?: number;
  distribution_type: string;
  distribution_params?: Record<string, unknown>;
  top_positive_factors?: Record<string, unknown>;
  top_negative_factors?: Record<string, unknown>;
  created_at: string;
}

export interface SimulationTemplate {
  id: string;
  tenant_id?: string;
  template_name: string;
  template_description?: string;
  template_type: SimulationType;
  default_parameters: Record<string, unknown>;
  default_assumptions: Record<string, unknown>;
  default_constraints: Record<string, unknown>;
  default_scenarios: unknown[];
  recommended_model: string;
  recommended_iterations: number;
  recommended_horizon_days: number;
  is_public: boolean;
  is_featured: boolean;
  use_count: number;
  category?: string;
  industry?: string;
  tags: string[];
  created_at: string;
}

export interface SimulationValidation {
  id: string;
  tenant_id: string;
  simulation_id: string;
  prediction_id?: string;
  metric_name: string;
  predicted_value?: number;
  actual_value?: number;
  validation_date: string;
  absolute_error?: number;
  percentage_error?: number;
  within_confidence_interval: boolean;
  error_category?: string;
  error_magnitude?: string;
  contributing_factors?: Record<string, unknown>;
  improvement_suggestions?: string[];
  validated_at: string;
}

export interface SimulationStats {
  total_simulations: number;
  completed_simulations: number;
  running_simulations: number;
  queued_simulations: number;
  failed_simulations: number;
  avg_accuracy: number;
  total_predictions: number;
  total_validations: number;
  simulation_types: Record<string, number>;
}

// =====================================================
// SIMULATION RUN FUNCTIONS
// =====================================================

export async function createSimulation(
  tenantId: string,
  data: {
    simulation_name: string;
    simulation_description?: string;
    simulation_type: SimulationType;
    target_entity_type?: string;
    target_entity_id?: string;
    time_horizon_days?: number;
    start_date?: string;
    end_date?: string;
    input_parameters?: Record<string, unknown>;
    baseline_metrics?: Record<string, unknown>;
    assumptions?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    monte_carlo_iterations?: number;
    confidence_level?: number;
    model_type?: string;
    tags?: string[];
  },
  userId?: string
): Promise<SimulationRun> {
  const supabase = await createClient();

  const { data: simulation, error } = await supabase
    .from("synthex_simulation_runs")
    .insert({
      tenant_id: tenantId,
      simulation_name: data.simulation_name,
      simulation_description: data.simulation_description,
      simulation_type: data.simulation_type,
      target_entity_type: data.target_entity_type,
      target_entity_id: data.target_entity_id,
      time_horizon_days: data.time_horizon_days || 30,
      start_date: data.start_date,
      end_date: data.end_date,
      input_parameters: data.input_parameters || {},
      baseline_metrics: data.baseline_metrics || {},
      assumptions: data.assumptions || {},
      constraints: data.constraints || {},
      monte_carlo_iterations: data.monte_carlo_iterations || 1000,
      confidence_level: data.confidence_level || 0.95,
      model_type: data.model_type || "bayesian",
      tags: data.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create simulation: ${error.message}`);
}
  return simulation as SimulationRun;
}

export async function updateSimulation(
  simulationId: string,
  updates: Partial<Omit<SimulationRun, "id" | "tenant_id" | "created_at">>
): Promise<SimulationRun> {
  const supabase = await createClient();

  const { data: simulation, error } = await supabase
    .from("synthex_simulation_runs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", simulationId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update simulation: ${error.message}`);
}
  return simulation as SimulationRun;
}

export async function getSimulation(simulationId: string): Promise<SimulationRun | null> {
  const supabase = await createClient();

  const { data: simulation, error } = await supabase
    .from("synthex_simulation_runs")
    .select("*")
    .eq("id", simulationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get simulation: ${error.message}`);
  }
  return simulation as SimulationRun;
}

export async function listSimulations(
  tenantId: string,
  filters?: {
    simulation_type?: SimulationType;
    status?: SimulationStatus;
    target_entity_type?: string;
    limit?: number;
  }
): Promise<SimulationRun[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_simulation_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.simulation_type) {
    query = query.eq("simulation_type", filters.simulation_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.target_entity_type) {
    query = query.eq("target_entity_type", filters.target_entity_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: simulations, error } = await query;

  if (error) {
throw new Error(`Failed to list simulations: ${error.message}`);
}
  return (simulations || []) as SimulationRun[];
}

export async function startSimulation(simulationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("start_simulation", {
    p_simulation_id: simulationId,
  });

  if (error) {
throw new Error(`Failed to start simulation: ${error.message}`);
}
  return data as boolean;
}

export async function completeSimulation(
  simulationId: string,
  results: {
    primary_outcome: Record<string, unknown>;
    outcome_distribution: Record<string, unknown>;
    key_insights: string[];
    recommendations: string[];
    ai_narrative: string;
    ai_confidence: number;
    tokens_used: number;
    compute_cost: number;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("complete_simulation", {
    p_simulation_id: simulationId,
    p_primary_outcome: results.primary_outcome,
    p_outcome_distribution: results.outcome_distribution,
    p_key_insights: results.key_insights,
    p_recommendations: results.recommendations,
    p_ai_narrative: results.ai_narrative,
    p_ai_confidence: results.ai_confidence,
    p_tokens_used: results.tokens_used,
    p_compute_cost: results.compute_cost,
  });

  if (error) {
throw new Error(`Failed to complete simulation: ${error.message}`);
}
  return data as boolean;
}

export async function cancelSimulation(simulationId: string): Promise<SimulationRun> {
  return updateSimulation(simulationId, {
    status: "cancelled",
    status_message: "Cancelled by user",
  });
}

// =====================================================
// SCENARIO FUNCTIONS
// =====================================================

export async function createScenario(
  tenantId: string,
  simulationId: string,
  data: {
    scenario_name: string;
    scenario_description?: string;
    scenario_type: ScenarioType;
    parameter_overrides?: Record<string, unknown>;
    assumption_overrides?: Record<string, unknown>;
    multipliers?: Record<string, unknown>;
    probability_weight?: number;
    is_primary?: boolean;
    display_order?: number;
  }
): Promise<SimulationScenario> {
  const supabase = await createClient();

  const { data: scenario, error } = await supabase
    .from("synthex_simulation_scenarios")
    .insert({
      tenant_id: tenantId,
      simulation_id: simulationId,
      scenario_name: data.scenario_name,
      scenario_description: data.scenario_description,
      scenario_type: data.scenario_type,
      parameter_overrides: data.parameter_overrides || {},
      assumption_overrides: data.assumption_overrides || {},
      multipliers: data.multipliers || {},
      probability_weight: data.probability_weight || 0.2,
      is_primary: data.is_primary || false,
      display_order: data.display_order || 0,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create scenario: ${error.message}`);
}
  return scenario as SimulationScenario;
}

export async function updateScenario(
  scenarioId: string,
  updates: Partial<Omit<SimulationScenario, "id" | "tenant_id" | "simulation_id" | "created_at">>
): Promise<SimulationScenario> {
  const supabase = await createClient();

  const { data: scenario, error } = await supabase
    .from("synthex_simulation_scenarios")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scenarioId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update scenario: ${error.message}`);
}
  return scenario as SimulationScenario;
}

export async function listScenarios(
  simulationId: string,
  filters?: {
    scenario_type?: ScenarioType;
    limit?: number;
  }
): Promise<SimulationScenario[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_simulation_scenarios")
    .select("*")
    .eq("simulation_id", simulationId)
    .order("display_order", { ascending: true });

  if (filters?.scenario_type) {
    query = query.eq("scenario_type", filters.scenario_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: scenarios, error } = await query;

  if (error) {
throw new Error(`Failed to list scenarios: ${error.message}`);
}
  return (scenarios || []) as SimulationScenario[];
}

// =====================================================
// PREDICTION FUNCTIONS
// =====================================================

export async function createPrediction(
  tenantId: string,
  simulationId: string,
  data: {
    scenario_id?: string;
    metric_name: string;
    metric_category?: string;
    predicted_value?: number;
    predicted_min?: number;
    predicted_max?: number;
    predicted_mean?: number;
    predicted_median?: number;
    standard_deviation?: number;
    confidence?: PredictionConfidence;
    confidence_score?: number;
    confidence_reasoning?: string;
    prediction_date?: string;
    prediction_period?: string;
    baseline_value?: number;
    distribution_type?: string;
    distribution_params?: Record<string, unknown>;
    top_positive_factors?: Record<string, unknown>;
    top_negative_factors?: Record<string, unknown>;
  }
): Promise<SimulationPrediction> {
  const supabase = await createClient();

  // Calculate changes from baseline
  let absolute_change: number | undefined;
  let percentage_change: number | undefined;
  if (data.baseline_value && data.predicted_value) {
    absolute_change = data.predicted_value - data.baseline_value;
    percentage_change = (absolute_change / data.baseline_value) * 100;
  }

  const { data: prediction, error } = await supabase
    .from("synthex_simulation_predictions")
    .insert({
      tenant_id: tenantId,
      simulation_id: simulationId,
      scenario_id: data.scenario_id,
      metric_name: data.metric_name,
      metric_category: data.metric_category,
      predicted_value: data.predicted_value,
      predicted_min: data.predicted_min,
      predicted_max: data.predicted_max,
      predicted_mean: data.predicted_mean,
      predicted_median: data.predicted_median,
      standard_deviation: data.standard_deviation,
      confidence: data.confidence || "medium",
      confidence_score: data.confidence_score,
      confidence_reasoning: data.confidence_reasoning,
      prediction_date: data.prediction_date,
      prediction_period: data.prediction_period,
      baseline_value: data.baseline_value,
      absolute_change,
      percentage_change,
      distribution_type: data.distribution_type || "normal",
      distribution_params: data.distribution_params,
      top_positive_factors: data.top_positive_factors,
      top_negative_factors: data.top_negative_factors,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create prediction: ${error.message}`);
}
  return prediction as SimulationPrediction;
}

export async function listPredictions(
  simulationId: string,
  filters?: {
    scenario_id?: string;
    metric_category?: string;
    prediction_period?: string;
    limit?: number;
  }
): Promise<SimulationPrediction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_simulation_predictions")
    .select("*")
    .eq("simulation_id", simulationId)
    .order("created_at", { ascending: false });

  if (filters?.scenario_id) {
    query = query.eq("scenario_id", filters.scenario_id);
  }
  if (filters?.metric_category) {
    query = query.eq("metric_category", filters.metric_category);
  }
  if (filters?.prediction_period) {
    query = query.eq("prediction_period", filters.prediction_period);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: predictions, error } = await query;

  if (error) {
throw new Error(`Failed to list predictions: ${error.message}`);
}
  return (predictions || []) as SimulationPrediction[];
}

// =====================================================
// TEMPLATE FUNCTIONS
// =====================================================

export async function getTemplate(templateId: string): Promise<SimulationTemplate | null> {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("synthex_simulation_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get template: ${error.message}`);
  }
  return template as SimulationTemplate;
}

export async function listTemplates(
  tenantId: string,
  filters?: {
    template_type?: SimulationType;
    is_public?: boolean;
    category?: string;
    limit?: number;
  }
): Promise<SimulationTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_simulation_templates")
    .select("*")
    .or(`tenant_id.eq.${tenantId},is_public.eq.true`)
    .order("use_count", { ascending: false });

  if (filters?.template_type) {
    query = query.eq("template_type", filters.template_type);
  }
  if (filters?.is_public !== undefined) {
    query = query.eq("is_public", filters.is_public);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: templates, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return (templates || []) as SimulationTemplate[];
}

export async function createTemplate(
  tenantId: string,
  data: {
    template_name: string;
    template_description?: string;
    template_type: SimulationType;
    default_parameters?: Record<string, unknown>;
    default_assumptions?: Record<string, unknown>;
    default_constraints?: Record<string, unknown>;
    default_scenarios?: unknown[];
    recommended_model?: string;
    recommended_iterations?: number;
    recommended_horizon_days?: number;
    is_public?: boolean;
    category?: string;
    industry?: string;
    tags?: string[];
  },
  userId?: string
): Promise<SimulationTemplate> {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("synthex_simulation_templates")
    .insert({
      tenant_id: tenantId,
      template_name: data.template_name,
      template_description: data.template_description,
      template_type: data.template_type,
      default_parameters: data.default_parameters || {},
      default_assumptions: data.default_assumptions || {},
      default_constraints: data.default_constraints || {},
      default_scenarios: data.default_scenarios || [],
      recommended_model: data.recommended_model || "bayesian",
      recommended_iterations: data.recommended_iterations || 1000,
      recommended_horizon_days: data.recommended_horizon_days || 30,
      is_public: data.is_public || false,
      category: data.category,
      industry: data.industry,
      tags: data.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create template: ${error.message}`);
}
  return template as SimulationTemplate;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

export async function createValidation(
  tenantId: string,
  simulationId: string,
  data: {
    prediction_id?: string;
    metric_name: string;
    predicted_value?: number;
    actual_value?: number;
    validation_date: string;
  },
  userId?: string
): Promise<SimulationValidation> {
  const supabase = await createClient();

  // Calculate errors
  let absolute_error: number | undefined;
  let percentage_error: number | undefined;
  let error_category: string | undefined;
  let error_magnitude: string | undefined;
  let within_confidence_interval = false;

  if (data.predicted_value !== undefined && data.actual_value !== undefined) {
    absolute_error = Math.abs(data.actual_value - data.predicted_value);
    percentage_error = data.predicted_value !== 0
      ? (absolute_error / Math.abs(data.predicted_value)) * 100
      : 0;

    // Determine error category
    if (data.actual_value > data.predicted_value) {
      error_category = "underestimate";
    } else if (data.actual_value < data.predicted_value) {
      error_category = "overestimate";
    } else {
      error_category = "accurate";
    }

    // Determine error magnitude
    if (percentage_error <= 5) {
      error_magnitude = "minor";
      within_confidence_interval = true;
    } else if (percentage_error <= 15) {
      error_magnitude = "moderate";
    } else {
      error_magnitude = "significant";
    }
  }

  const { data: validation, error } = await supabase
    .from("synthex_simulation_validations")
    .insert({
      tenant_id: tenantId,
      simulation_id: simulationId,
      prediction_id: data.prediction_id,
      metric_name: data.metric_name,
      predicted_value: data.predicted_value,
      actual_value: data.actual_value,
      validation_date: data.validation_date,
      absolute_error,
      percentage_error,
      within_confidence_interval,
      error_category,
      error_magnitude,
      validated_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create validation: ${error.message}`);
}
  return validation as SimulationValidation;
}

export async function listValidations(
  simulationId: string,
  filters?: {
    metric_name?: string;
    error_category?: string;
    limit?: number;
  }
): Promise<SimulationValidation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_simulation_validations")
    .select("*")
    .eq("simulation_id", simulationId)
    .order("validation_date", { ascending: false });

  if (filters?.metric_name) {
    query = query.eq("metric_name", filters.metric_name);
  }
  if (filters?.error_category) {
    query = query.eq("error_category", filters.error_category);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: validations, error } = await query;

  if (error) {
throw new Error(`Failed to list validations: ${error.message}`);
}
  return (validations || []) as SimulationValidation[];
}

// =====================================================
// AI SIMULATION FUNCTIONS
// =====================================================

export async function runAISimulation(
  tenantId: string,
  simulationId: string
): Promise<{
  success: boolean;
  predictions: SimulationPrediction[];
  insights: string[];
  recommendations: string[];
  narrative: string;
}> {
  const supabase = await createClient();

  // Get simulation details
  const simulation = await getSimulation(simulationId);
  if (!simulation) {
    throw new Error("Simulation not found");
  }

  // Start the simulation
  await startSimulation(simulationId);

  // Get scenarios
  const scenarios = await listScenarios(simulationId);

  const anthropic = getAnthropicClient();

  try {
    // Generate predictions using AI
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Run a simulation analysis for this configuration:

Simulation: ${JSON.stringify(simulation, null, 2)}

Scenarios: ${JSON.stringify(scenarios, null, 2)}

Generate predictions with:
1. For each metric in the baseline_metrics, predict values for each scenario
2. Include confidence intervals (p10, p50, p90)
3. Provide key insights about the simulation outcomes
4. Give specific recommendations based on the analysis

Return JSON with:
{
  "predictions": [
    {
      "metric_name": "string",
      "metric_category": "string",
      "scenario_type": "baseline|optimistic|pessimistic",
      "predicted_value": number,
      "predicted_min": number,
      "predicted_max": number,
      "confidence": "very_low|low|medium|high|very_high",
      "confidence_score": number (0-1),
      "confidence_reasoning": "string",
      "positive_factors": ["string"],
      "negative_factors": ["string"]
    }
  ],
  "insights": ["string"],
  "recommendations": ["string"],
  "narrative": "string (2-3 paragraph executive summary)"
}`,
        },
      ],
      system:
        "You are an expert business analyst specializing in predictive modeling and scenario analysis. Provide realistic, data-driven predictions with clear confidence levels and actionable insights.",
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    // Parse response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Create predictions in database
    const createdPredictions: SimulationPrediction[] = [];
    for (const pred of result.predictions) {
      const scenario = scenarios.find((s) => s.scenario_type === pred.scenario_type);

      const prediction = await createPrediction(tenantId, simulationId, {
        scenario_id: scenario?.id,
        metric_name: pred.metric_name,
        metric_category: pred.metric_category,
        predicted_value: pred.predicted_value,
        predicted_min: pred.predicted_min,
        predicted_max: pred.predicted_max,
        predicted_mean: pred.predicted_value,
        confidence: pred.confidence,
        confidence_score: pred.confidence_score,
        confidence_reasoning: pred.confidence_reasoning,
        baseline_value: simulation.baseline_metrics[pred.metric_name] as number | undefined,
        top_positive_factors: { factors: pred.positive_factors },
        top_negative_factors: { factors: pred.negative_factors },
      });

      createdPredictions.push(prediction);
    }

    // Complete the simulation
    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    await completeSimulation(simulationId, {
      primary_outcome: result.predictions[0] || {},
      outcome_distribution: { predictions: result.predictions },
      key_insights: result.insights,
      recommendations: result.recommendations,
      ai_narrative: result.narrative,
      ai_confidence: 0.85,
      tokens_used: tokensUsed,
      compute_cost: tokensUsed * 0.000003, // Approximate cost
    });

    return {
      success: true,
      predictions: createdPredictions,
      insights: result.insights,
      recommendations: result.recommendations,
      narrative: result.narrative,
    };
  } catch (error) {
    // Mark simulation as failed
    await updateSimulation(simulationId, {
      status: "failed",
      status_message: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

export async function generateScenarioAnalysis(
  tenantId: string,
  simulationId: string,
  scenarioType: ScenarioType
): Promise<{
  scenario: SimulationScenario;
  analysis: string;
}> {
  const simulation = await getSimulation(simulationId);
  if (!simulation) {
    throw new Error("Simulation not found");
  }

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Create a ${scenarioType} scenario for this simulation:

Simulation: ${JSON.stringify(simulation, null, 2)}

Generate scenario with:
1. Parameter multipliers/adjustments appropriate for ${scenarioType} scenario
2. Key assumptions for this scenario
3. Probability weight (how likely is this scenario)

Return JSON with:
{
  "scenario_name": "string",
  "scenario_description": "string",
  "parameter_overrides": {},
  "assumption_overrides": {},
  "multipliers": { "metric_name": multiplier_value },
  "probability_weight": number (0-1),
  "analysis": "string (detailed scenario analysis)"
}`,
      },
    ],
    system:
      "You are an expert scenario planner. Create realistic scenarios with appropriate parameter adjustments based on the scenario type.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse scenario response");
  }

  const result = JSON.parse(jsonMatch[0]);

  const scenario = await createScenario(tenantId, simulationId, {
    scenario_name: result.scenario_name,
    scenario_description: result.scenario_description,
    scenario_type: scenarioType,
    parameter_overrides: result.parameter_overrides,
    assumption_overrides: result.assumption_overrides,
    multipliers: result.multipliers,
    probability_weight: result.probability_weight,
  });

  return {
    scenario,
    analysis: result.analysis,
  };
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getSimulationStats(tenantId: string): Promise<SimulationStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_simulation_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get simulation stats: ${error.message}`);
}
  return data as SimulationStats;
}

export async function getPredictionAccuracy(
  simulationId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("calculate_prediction_accuracy", {
    p_simulation_id: simulationId,
  });

  if (error) {
throw new Error(`Failed to get prediction accuracy: ${error.message}`);
}
  return data as Record<string, unknown>;
}
