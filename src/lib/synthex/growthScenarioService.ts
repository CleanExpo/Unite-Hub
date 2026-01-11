/**
 * Synthex Growth Scenario Service
 *
 * Phase: D42 - Growth Scenario Planner + Simulation Engine
 * Tables: synthex_gsp_*
 *
 * Features:
 * - Scenario CRUD operations
 * - Variable management
 * - Monte Carlo simulation
 * - Scenario comparison
 * - AI-powered analysis
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type GSPScenarioStatus = 'draft' | 'active' | 'simulating' | 'completed' | 'archived';
export type GSPScenarioType = 'growth' | 'expansion' | 'optimization' | 'risk' | 'what_if' | 'custom';
export type GSPVariableType = 'revenue' | 'cost' | 'headcount' | 'customers' | 'market_share' | 'price' | 'volume' | 'conversion' | 'churn' | 'custom';
export type GSPSimulationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type GSPConfidence = 'high' | 'medium' | 'low' | 'uncertain';

export interface GSPScenario {
  id: string;
  tenant_id: string;
  business_id?: string;
  scenario_name: string;
  description?: string;
  scenario_type: GSPScenarioType;
  status: GSPScenarioStatus;
  start_date: string;
  end_date: string;
  time_granularity: string;
  base_values: Record<string, number>;
  target_values: Record<string, number>;
  monte_carlo_runs: number;
  confidence_interval: number;
  random_seed?: number;
  last_simulation_at?: string;
  simulation_results?: Record<string, unknown>;
  success_probability?: number;
  expected_outcome?: Record<string, unknown>;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GSPVariable {
  id: string;
  tenant_id: string;
  scenario_id: string;
  variable_name: string;
  variable_code: string;
  variable_type: GSPVariableType;
  description?: string;
  base_value: number;
  min_value?: number;
  max_value?: number;
  projected_value?: number;
  growth_type: string;
  growth_rate?: number;
  growth_formula?: string;
  distribution_type: string;
  distribution_params: Record<string, unknown>;
  confidence: GSPConfidence;
  data_source?: string;
  depends_on?: string[];
  dependency_formula?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GSPAssumption {
  id: string;
  tenant_id: string;
  scenario_id: string;
  assumption_name: string;
  description?: string;
  category?: string;
  confidence: GSPConfidence;
  evidence?: string;
  risk_factor?: string;
  impacts_variables?: string[];
  impact_magnitude?: string;
  created_at: string;
}

export interface GSPSimulation {
  id: string;
  tenant_id: string;
  scenario_id: string;
  simulation_name?: string;
  status: GSPSimulationStatus;
  num_runs: number;
  confidence_interval: number;
  random_seed?: number;
  variable_overrides: Record<string, unknown>;
  completed_runs: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results_summary?: SimulationResults;
  raw_results_url?: string;
  created_at: string;
}

export interface GSPSimulationResult {
  id: string;
  tenant_id: string;
  simulation_id: string;
  period_index: number;
  period_date: string;
  variable_results: Record<string, VariableResult>;
  total_revenue?: number;
  total_cost?: number;
  net_profit?: number;
  customer_count?: number;
  revenue_p10?: number;
  revenue_p50?: number;
  revenue_p90?: number;
  created_at: string;
}

export interface VariableResult {
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  std_dev: number;
}

export interface SimulationResults {
  periods: number;
  runs: number;
  final_values: Record<string, VariableResult>;
  success_probability: number;
  expected_roi?: number;
  risk_metrics: {
    var_95: number;
    max_drawdown: number;
    volatility: number;
  };
}

export interface GSPTemplate {
  id: string;
  tenant_id?: string;
  template_name: string;
  description?: string;
  scenario_type: GSPScenarioType;
  default_variables: Array<Partial<GSPVariable>>;
  default_assumptions: Array<Partial<GSPAssumption>>;
  recommended_horizon: string;
  recommended_granularity: string;
  industry?: string;
  business_stage?: string;
  is_public: boolean;
  use_count: number;
  created_at: string;
}

export interface GSPComparison {
  id: string;
  tenant_id: string;
  comparison_name: string;
  description?: string;
  scenario_ids: string[];
  comparison_metrics: string[];
  time_points: string[];
  comparison_results?: Record<string, unknown>;
  winner_scenario_id?: string;
  analysis_summary?: string;
  ai_recommendation?: string;
  ai_analysis_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GSPMilestone {
  id: string;
  tenant_id: string;
  scenario_id: string;
  milestone_name: string;
  description?: string;
  target_date: string;
  target_metric: string;
  target_value: number;
  current_value?: number;
  is_achieved: boolean;
  achieved_at?: string;
  probability_of_achievement?: number;
  created_at: string;
}

// Input types
export interface CreateScenarioInput {
  scenario_name: string;
  description?: string;
  business_id?: string;
  scenario_type?: GSPScenarioType;
  start_date: string;
  end_date: string;
  time_granularity?: string;
  base_values?: Record<string, number>;
  target_values?: Record<string, number>;
  monte_carlo_runs?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateVariableInput {
  variable_name: string;
  variable_code: string;
  variable_type?: GSPVariableType;
  description?: string;
  base_value: number;
  min_value?: number;
  max_value?: number;
  growth_type?: string;
  growth_rate?: number;
  distribution_type?: string;
  distribution_params?: Record<string, unknown>;
  confidence?: GSPConfidence;
  data_source?: string;
  depends_on?: string[];
  dependency_formula?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60-second TTL)
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
// Scenario CRUD Operations
// =============================================================================

/**
 * Create a new scenario
 */
export async function createScenario(
  tenantId: string,
  input: CreateScenarioInput
): Promise<GSPScenario> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_scenarios')
    .insert({
      tenant_id: tenantId,
      scenario_name: input.scenario_name,
      description: input.description,
      business_id: input.business_id,
      scenario_type: input.scenario_type || 'growth',
      status: 'draft',
      start_date: input.start_date,
      end_date: input.end_date,
      time_granularity: input.time_granularity || 'monthly',
      base_values: input.base_values || {},
      target_values: input.target_values || {},
      monte_carlo_runs: input.monte_carlo_runs || 1000,
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get scenario by ID
 */
export async function getScenario(scenarioId: string): Promise<GSPScenario | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * List scenarios
 */
export async function listScenarios(
  tenantId: string,
  filters?: {
    status?: GSPScenarioStatus;
    scenario_type?: GSPScenarioType;
    business_id?: string;
    limit?: number;
  }
): Promise<GSPScenario[]> {
  let query = supabaseAdmin
    .from('synthex_gsp_scenarios')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.scenario_type) {
    query = query.eq('scenario_type', filters.scenario_type);
  }
  if (filters?.business_id) {
    query = query.eq('business_id', filters.business_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update scenario
 */
export async function updateScenario(
  scenarioId: string,
  updates: Partial<CreateScenarioInput> & {
    status?: GSPScenarioStatus;
  }
): Promise<GSPScenario> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_scenarios')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete scenario
 */
export async function deleteScenario(scenarioId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_gsp_scenarios')
    .delete()
    .eq('id', scenarioId);

  if (error) throw error;
}

/**
 * Get scenario with all details
 */
export async function getScenarioWithDetails(scenarioId: string): Promise<{
  scenario: GSPScenario;
  variables: GSPVariable[];
  assumptions: GSPAssumption[];
  milestones: GSPMilestone[];
  simulations: GSPSimulation[];
} | null> {
  const scenario = await getScenario(scenarioId);
  if (!scenario) return null;

  const [variables, assumptions, milestones, simulations] = await Promise.all([
    listVariables(scenarioId),
    listAssumptions(scenarioId),
    listMilestones(scenarioId),
    listSimulations(scenarioId),
  ]);

  return { scenario, variables, assumptions, milestones, simulations };
}

// =============================================================================
// Variable Operations
// =============================================================================

/**
 * Add variable to scenario
 */
export async function addVariable(
  tenantId: string,
  scenarioId: string,
  input: CreateVariableInput
): Promise<GSPVariable> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_variables')
    .insert({
      tenant_id: tenantId,
      scenario_id: scenarioId,
      variable_name: input.variable_name,
      variable_code: input.variable_code.toLowerCase().replace(/\s+/g, '_'),
      variable_type: input.variable_type || 'custom',
      description: input.description,
      base_value: input.base_value,
      min_value: input.min_value,
      max_value: input.max_value,
      growth_type: input.growth_type || 'linear',
      growth_rate: input.growth_rate,
      distribution_type: input.distribution_type || 'normal',
      distribution_params: input.distribution_params || {},
      confidence: input.confidence || 'medium',
      data_source: input.data_source,
      depends_on: input.depends_on || [],
      dependency_formula: input.dependency_formula,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List variables for scenario
 */
export async function listVariables(scenarioId: string): Promise<GSPVariable[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_variables')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('variable_type')
    .order('variable_name');

  if (error) throw error;
  return data || [];
}

/**
 * Update variable
 */
export async function updateVariable(
  variableId: string,
  updates: Partial<CreateVariableInput>
): Promise<GSPVariable> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_variables')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', variableId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove variable
 */
export async function removeVariable(variableId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_gsp_variables')
    .delete()
    .eq('id', variableId);

  if (error) throw error;
}

// =============================================================================
// Assumption Operations
// =============================================================================

/**
 * Add assumption to scenario
 */
export async function addAssumption(
  tenantId: string,
  scenarioId: string,
  input: {
    assumption_name: string;
    description?: string;
    category?: string;
    confidence?: GSPConfidence;
    evidence?: string;
    risk_factor?: string;
    impacts_variables?: string[];
    impact_magnitude?: string;
  }
): Promise<GSPAssumption> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_assumptions')
    .insert({
      tenant_id: tenantId,
      scenario_id: scenarioId,
      ...input,
      confidence: input.confidence || 'medium',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List assumptions for scenario
 */
export async function listAssumptions(scenarioId: string): Promise<GSPAssumption[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_assumptions')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('category')
    .order('assumption_name');

  if (error) throw error;
  return data || [];
}

// =============================================================================
// Milestone Operations
// =============================================================================

/**
 * Add milestone to scenario
 */
export async function addMilestone(
  tenantId: string,
  scenarioId: string,
  input: {
    milestone_name: string;
    description?: string;
    target_date: string;
    target_metric: string;
    target_value: number;
  }
): Promise<GSPMilestone> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_milestones')
    .insert({
      tenant_id: tenantId,
      scenario_id: scenarioId,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List milestones for scenario
 */
export async function listMilestones(scenarioId: string): Promise<GSPMilestone[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_milestones')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('target_date');

  if (error) throw error;
  return data || [];
}

// =============================================================================
// Simulation Operations
// =============================================================================

/**
 * Create and run simulation
 */
export async function runSimulation(
  tenantId: string,
  scenarioId: string,
  options?: {
    num_runs?: number;
    variable_overrides?: Record<string, unknown>;
    simulation_name?: string;
  }
): Promise<GSPSimulation> {
  // Create simulation record
  const { data: simulation, error: createError } = await supabaseAdmin
    .from('synthex_gsp_simulations')
    .insert({
      tenant_id: tenantId,
      scenario_id: scenarioId,
      simulation_name: options?.simulation_name,
      num_runs: options?.num_runs || 1000,
      variable_overrides: options?.variable_overrides || {},
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) throw createError;

  try {
    // Get scenario and variables
    const scenario = await getScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const variables = await listVariables(scenarioId);

    // Run Monte Carlo simulation
    const results = runMonteCarloSimulation(scenario, variables, options?.num_runs || 1000);

    // Update simulation with results
    const { data: completed, error: updateError } = await supabaseAdmin
      .from('synthex_gsp_simulations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_runs: options?.num_runs || 1000,
        results_summary: results,
      })
      .eq('id', simulation.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update scenario with latest results
    await updateScenario(scenarioId, {
      status: 'completed',
    });

    await supabaseAdmin
      .from('synthex_gsp_scenarios')
      .update({
        last_simulation_at: new Date().toISOString(),
        simulation_results: results,
        success_probability: results.success_probability,
      })
      .eq('id', scenarioId);

    return completed;
  } catch (error) {
    // Update simulation with error
    await supabaseAdmin
      .from('synthex_gsp_simulations')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', simulation.id);

    throw error;
  }
}

/**
 * List simulations for scenario
 */
export async function listSimulations(scenarioId: string): Promise<GSPSimulation[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_simulations')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =============================================================================
// Monte Carlo Simulation Engine
// =============================================================================

/**
 * Run Monte Carlo simulation
 */
function runMonteCarloSimulation(
  scenario: GSPScenario,
  variables: GSPVariable[],
  numRuns: number
): SimulationResults {
  const startDate = new Date(scenario.start_date);
  const endDate = new Date(scenario.end_date);

  // Calculate number of periods based on granularity
  let numPeriods: number;
  switch (scenario.time_granularity) {
    case 'weekly':
      numPeriods = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      break;
    case 'quarterly':
      numPeriods = Math.ceil((endDate.getTime() - startDate.getTime()) / (90 * 24 * 60 * 60 * 1000));
      break;
    case 'yearly':
      numPeriods = Math.ceil((endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
      break;
    default: // monthly
      numPeriods = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  }

  // Initialize results storage
  const allResults: Record<string, number[][]> = {};
  variables.forEach(v => {
    allResults[v.variable_code] = [];
    for (let p = 0; p < numPeriods; p++) {
      allResults[v.variable_code].push([]);
    }
  });

  // Run simulations
  for (let run = 0; run < numRuns; run++) {
    variables.forEach(variable => {
      for (let period = 0; period < numPeriods; period++) {
        const value = projectValue(variable, period);
        const randomized = addRandomVariation(value, variable);
        allResults[variable.variable_code][period].push(randomized);
      }
    });
  }

  // Calculate statistics for final period
  const finalValues: Record<string, VariableResult> = {};
  variables.forEach(variable => {
    const values = allResults[variable.variable_code][numPeriods - 1];
    finalValues[variable.variable_code] = calculateStatistics(values);
  });

  // Calculate success probability (simplified - based on revenue targets)
  let successCount = 0;
  const revenueVar = variables.find(v => v.variable_type === 'revenue');
  if (revenueVar && scenario.target_values.revenue) {
    const revenueResults = allResults[revenueVar.variable_code][numPeriods - 1];
    successCount = revenueResults.filter(v => v >= scenario.target_values.revenue).length;
  } else {
    successCount = numRuns * 0.5; // Default 50%
  }

  // Calculate risk metrics
  const allFinalRevenue = revenueVar
    ? allResults[revenueVar.variable_code][numPeriods - 1]
    : [0];
  const sortedRevenue = [...allFinalRevenue].sort((a, b) => a - b);

  return {
    periods: numPeriods,
    runs: numRuns,
    final_values: finalValues,
    success_probability: successCount / numRuns,
    risk_metrics: {
      var_95: sortedRevenue[Math.floor(numRuns * 0.05)] || 0,
      max_drawdown: Math.max(...sortedRevenue) - Math.min(...sortedRevenue),
      volatility: calculateStatistics(sortedRevenue).std_dev,
    },
  };
}

/**
 * Project value for a period
 */
function projectValue(variable: GSPVariable, period: number): number {
  const growthRate = (variable.growth_rate || 0) / 100;

  switch (variable.growth_type) {
    case 'exponential':
    case 'compound':
      return variable.base_value * Math.pow(1 + growthRate, period);
    case 'linear':
    default:
      return variable.base_value * (1 + growthRate * period);
  }
}

/**
 * Add random variation based on distribution
 */
function addRandomVariation(value: number, variable: GSPVariable): number {
  const confidence = variable.confidence;
  let stdDevMultiplier: number;

  switch (confidence) {
    case 'high':
      stdDevMultiplier = 0.1;
      break;
    case 'low':
      stdDevMultiplier = 0.3;
      break;
    case 'uncertain':
      stdDevMultiplier = 0.5;
      break;
    default: // medium
      stdDevMultiplier = 0.2;
  }

  const stdDev = value * stdDevMultiplier;

  switch (variable.distribution_type) {
    case 'uniform':
      return value + (Math.random() - 0.5) * stdDev * 2;
    case 'triangular':
      const u = Math.random();
      return value + stdDev * (u < 0.5 ? Math.sqrt(2 * u) - 1 : 1 - Math.sqrt(2 * (1 - u)));
    default: // normal
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return value + z * stdDev;
  }
}

/**
 * Calculate statistics from array of values
 */
function calculateStatistics(values: number[]): VariableResult {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;

  return {
    mean,
    median: sorted[Math.floor(n / 2)],
    p10: sorted[Math.floor(n * 0.1)],
    p25: sorted[Math.floor(n * 0.25)],
    p75: sorted[Math.floor(n * 0.75)],
    p90: sorted[Math.floor(n * 0.9)],
    std_dev: Math.sqrt(variance),
  };
}

// =============================================================================
// Template Operations
// =============================================================================

/**
 * List templates
 */
export async function listTemplates(
  tenantId?: string,
  publicOnly: boolean = false
): Promise<GSPTemplate[]> {
  let query = supabaseAdmin
    .from('synthex_gsp_templates')
    .select('*')
    .order('use_count', { ascending: false });

  if (publicOnly) {
    query = query.eq('is_public', true);
  } else if (tenantId) {
    query = query.or(`is_public.eq.true,tenant_id.eq.${tenantId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Create scenario from template
 */
export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  overrides: Partial<CreateScenarioInput>
): Promise<GSPScenario> {
  // Get template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('synthex_gsp_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  // Calculate dates based on recommended horizon
  const startDate = new Date();
  const endDate = new Date();
  switch (template.recommended_horizon) {
    case '6m':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '2y':
      endDate.setFullYear(endDate.getFullYear() + 2);
      break;
    default: // 1y
      endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Create scenario
  const scenario = await createScenario(tenantId, {
    scenario_name: overrides.scenario_name || `${template.template_name} Scenario`,
    description: overrides.description || template.description,
    scenario_type: template.scenario_type,
    start_date: overrides.start_date || startDate.toISOString().split('T')[0],
    end_date: overrides.end_date || endDate.toISOString().split('T')[0],
    time_granularity: template.recommended_granularity,
    ...overrides,
  });

  // Add default variables
  for (const varDef of template.default_variables) {
    await addVariable(tenantId, scenario.id, {
      variable_name: varDef.variable_name!,
      variable_code: varDef.variable_code!,
      variable_type: varDef.variable_type as GSPVariableType,
      base_value: varDef.base_value || 0,
      growth_type: varDef.growth_type,
      growth_rate: varDef.growth_rate,
    });
  }

  // Add default assumptions
  for (const assDef of template.default_assumptions || []) {
    await addAssumption(tenantId, scenario.id, {
      assumption_name: assDef.assumption_name!,
      description: assDef.description,
      category: assDef.category,
      confidence: assDef.confidence as GSPConfidence,
    });
  }

  // Increment template use count
  await supabaseAdmin
    .from('synthex_gsp_templates')
    .update({ use_count: template.use_count + 1 })
    .eq('id', templateId);

  return scenario;
}

// =============================================================================
// Comparison Operations
// =============================================================================

/**
 * Create scenario comparison
 */
export async function createComparison(
  tenantId: string,
  input: {
    comparison_name: string;
    description?: string;
    scenario_ids: string[];
    comparison_metrics?: string[];
    time_points?: string[];
  }
): Promise<GSPComparison> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_comparisons')
    .insert({
      tenant_id: tenantId,
      ...input,
      comparison_metrics: input.comparison_metrics || ['revenue', 'profit', 'customers'],
      time_points: input.time_points || ['6m', '1y'],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List comparisons
 */
export async function listComparisons(tenantId: string): Promise<GSPComparison[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_gsp_comparisons')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =============================================================================
// AI Features
// =============================================================================

/**
 * AI-analyze scenario and provide recommendations
 */
export async function aiAnalyzeScenario(
  scenario: GSPScenario,
  variables: GSPVariable[],
  assumptions: GSPAssumption[]
): Promise<{
  risk_assessment: string;
  opportunities: string[];
  concerns: string[];
  recommendations: string[];
  suggested_variables: Array<{ name: string; reason: string }>;
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are a business strategist and financial analyst.
Analyze the growth scenario and provide:
1. Overall risk assessment
2. Key opportunities identified
3. Concerns or potential issues
4. Actionable recommendations
5. Suggested additional variables to track

Respond in JSON format:
{
  "risk_assessment": "Brief risk summary",
  "opportunities": ["opportunity 1", "opportunity 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "suggested_variables": [{"name": "variable", "reason": "why track this"}]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Scenario: ${scenario.scenario_name}
Type: ${scenario.scenario_type}
Duration: ${scenario.start_date} to ${scenario.end_date}
Description: ${scenario.description || 'N/A'}

Variables:
${variables.map(v => `- ${v.variable_name} (${v.variable_type}): Base=${v.base_value}, Growth=${v.growth_rate}% ${v.growth_type}`).join('\n')}

Assumptions:
${assumptions.map(a => `- ${a.assumption_name} [${a.confidence}]: ${a.description || 'N/A'}`).join('\n')}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}

/**
 * AI-compare scenarios and recommend best option
 */
export async function aiCompareScenarios(
  scenarios: GSPScenario[],
  results: SimulationResults[]
): Promise<{
  winner: string;
  reasoning: string;
  trade_offs: Array<{ scenario: string; pros: string[]; cons: string[] }>;
  recommendation: string;
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are a business strategist comparing growth scenarios.
Analyze the scenarios and their simulation results to:
1. Identify the best option
2. Explain your reasoning
3. List trade-offs for each scenario
4. Provide a final recommendation

Respond in JSON format:
{
  "winner": "scenario name",
  "reasoning": "Why this is the best option",
  "trade_offs": [{"scenario": "name", "pros": ["pro1"], "cons": ["con1"]}],
  "recommendation": "Final actionable recommendation"
}`;

  const scenarioData = scenarios.map((s, i) => ({
    name: s.scenario_name,
    type: s.scenario_type,
    success_probability: results[i]?.success_probability || 0,
    risk_var_95: results[i]?.risk_metrics?.var_95 || 0,
    volatility: results[i]?.risk_metrics?.volatility || 0,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Compare these scenarios:\n${JSON.stringify(scenarioData, null, 2)}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get growth planner stats
 */
export async function getGrowthPlannerStats(tenantId: string): Promise<{
  total_scenarios: number;
  active_scenarios: number;
  completed_simulations: number;
  avg_success_probability: number;
  templates_available: number;
}> {
  const [scenariosRes, simsRes, templatesRes] = await Promise.all([
    supabaseAdmin
      .from('synthex_gsp_scenarios')
      .select('id, status, success_probability')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_gsp_simulations')
      .select('id, status')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_gsp_templates')
      .select('id')
      .or(`is_public.eq.true,tenant_id.eq.${tenantId}`),
  ]);

  const scenarios = scenariosRes.data || [];
  const simulations = simsRes.data || [];
  const templates = templatesRes.data || [];

  const successProbs = scenarios
    .filter(s => s.success_probability !== null)
    .map(s => s.success_probability);

  return {
    total_scenarios: scenarios.length,
    active_scenarios: scenarios.filter(s => s.status === 'active' || s.status === 'draft').length,
    completed_simulations: simulations.filter(s => s.status === 'completed').length,
    avg_success_probability: successProbs.length > 0
      ? successProbs.reduce((a, b) => a + b, 0) / successProbs.length
      : 0,
    templates_available: templates.length,
  };
}
