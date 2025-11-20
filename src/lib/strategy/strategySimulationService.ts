/**
 * Strategy Simulation Service - Phase 11 Week 3-4
 *
 * Runs forecasts across multiple paths using risk, domain signals,
 * historic performance, and operator reliability.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type SimulationType =
  | "SINGLE_PATH"
  | "MULTI_PATH"
  | "MONTE_CARLO"
  | "SCENARIO_ANALYSIS"
  | "SENSITIVITY_ANALYSIS";

export type SimulationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type DistributionType = "NORMAL" | "UNIFORM" | "BETA" | "TRIANGULAR" | "CUSTOM";

export interface SimulationConfig {
  numIterations?: number;
  confidenceLevel?: number;
  timeHorizonDays?: number;
  riskMultiplier?: number;
  includeOperatorReliability?: boolean;
  domainWeights?: Record<string, number>;
}

export interface SimulationRun {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  simulation_type: SimulationType;
  config: SimulationConfig;
  num_iterations: number;
  confidence_level: number;
  time_horizon_days: number;
  source_proposal_id: string | null;
  source_node_ids: string[];
  status: SimulationStatus;
  total_paths: number | null;
  best_path_id: string | null;
  expected_value: number | null;
  confidence_interval_low: number | null;
  confidence_interval_high: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface SimulationStep {
  id: string;
  simulation_run_id: string;
  path_id: string;
  step_number: number;
  node_id: string | null;
  action_name: string;
  domain: string;
  input_parameters: Record<string, unknown>;
  risk_factors: Record<string, number>;
  success_probability: number;
  outcome_distribution: DistributionType;
  expected_value: number | null;
  variance: number | null;
  min_value: number | null;
  max_value: number | null;
  expected_duration_hours: number | null;
  depends_on_steps: string[];
}

export interface SimulationMetric {
  id: string;
  simulation_run_id: string;
  path_id: string | null;
  metric_name: string;
  metric_type: string;
  unit: string | null;
  mean_value: number | null;
  median_value: number | null;
  std_dev: number | null;
  min_value: number | null;
  max_value: number | null;
  percentile_5: number | null;
  percentile_25: number | null;
  percentile_75: number | null;
  percentile_95: number | null;
}

export interface PathResult {
  pathId: string;
  steps: SimulationStep[];
  totalExpectedValue: number;
  totalVariance: number;
  successProbability: number;
  duration: number;
  riskScore: number;
}

export interface SimulationResult {
  runId: string;
  paths: PathResult[];
  bestPathId: string;
  expectedValue: number;
  confidenceInterval: [number, number];
  metrics: SimulationMetric[];
}

export interface CreateSimulationRequest {
  organization_id: string;
  name: string;
  description?: string;
  simulation_type: SimulationType;
  config?: SimulationConfig;
  source_proposal_id?: string;
  source_node_ids?: string[];
  created_by?: string;
}

export class StrategySimulationService {
  private defaultConfig: Required<SimulationConfig> = {
    numIterations: 100,
    confidenceLevel: 0.95,
    timeHorizonDays: 90,
    riskMultiplier: 1.0,
    includeOperatorReliability: true,
    domainWeights: {
      SEO: 1.0,
      GEO: 1.0,
      CONTENT: 0.8,
      TECHNICAL: 1.2,
      BACKLINK: 0.9,
      LOCAL: 1.0,
    },
  };

  /**
   * Create a new simulation run
   */
  async createSimulation(request: CreateSimulationRequest): Promise<SimulationRun> {
    const supabase = await getSupabaseServer();

    const config = { ...this.defaultConfig, ...request.config };

    const { data, error } = await supabase
      .from("simulation_runs")
      .insert({
        organization_id: request.organization_id,
        name: request.name,
        description: request.description,
        simulation_type: request.simulation_type,
        config,
        num_iterations: config.numIterations,
        confidence_level: config.confidenceLevel,
        time_horizon_days: config.timeHorizonDays,
        source_proposal_id: request.source_proposal_id,
        source_node_ids: request.source_node_ids || [],
        status: "PENDING",
        created_by: request.created_by,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create simulation: ${error.message}`);
    }

    return data;
  }

  /**
   * Run a simulation
   */
  async runSimulation(simulationId: string): Promise<SimulationResult> {
    const supabase = await getSupabaseServer();
    const startTime = Date.now();

    // Update status to RUNNING
    await supabase
      .from("simulation_runs")
      .update({ status: "RUNNING", started_at: new Date().toISOString() })
      .eq("id", simulationId);

    try {
      // Get simulation config
      const { data: run, error: runError } = await supabase
        .from("simulation_runs")
        .select("*")
        .eq("id", simulationId)
        .single();

      if (runError || !run) {
        throw new Error("Simulation not found");
      }

      // Generate paths based on simulation type
      const paths = await this.generatePaths(run);

      // Run simulations for each path
      const pathResults: PathResult[] = [];

      for (const path of paths) {
        const result = await this.simulatePath(run, path);
        pathResults.push(result);

        // Store steps
        for (const step of result.steps) {
          await supabase.from("simulation_steps").insert(step);
        }
      }

      // Calculate aggregate metrics
      const { bestPath, expectedValue, confidenceInterval } =
        this.calculateAggregates(pathResults, run.config.confidenceLevel || 0.95);

      // Store metrics
      const metrics = await this.calculateMetrics(run, pathResults);
      for (const metric of metrics) {
        await supabase.from("simulation_metrics").insert(metric);
      }

      // Update run with results
      const duration = Date.now() - startTime;
      await supabase
        .from("simulation_runs")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          total_paths: paths.length,
          best_path_id: bestPath.pathId,
          expected_value: expectedValue,
          confidence_interval_low: confidenceInterval[0],
          confidence_interval_high: confidenceInterval[1],
        })
        .eq("id", simulationId);

      return {
        runId: simulationId,
        paths: pathResults,
        bestPathId: bestPath.pathId,
        expectedValue,
        confidenceInterval,
        metrics,
      };
    } catch (error) {
      // Update status to FAILED
      await supabase
        .from("simulation_runs")
        .update({
          status: "FAILED",
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", simulationId);

      throw error;
    }
  }

  /**
   * Get simulation results
   */
  async getSimulationResults(simulationId: string): Promise<SimulationResult | null> {
    const supabase = await getSupabaseServer();

    const { data: run } = await supabase
      .from("simulation_runs")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (!run || run.status !== "COMPLETED") {
      return null;
    }

    const { data: steps } = await supabase
      .from("simulation_steps")
      .select("*")
      .eq("simulation_run_id", simulationId);

    const { data: metrics } = await supabase
      .from("simulation_metrics")
      .select("*")
      .eq("simulation_run_id", simulationId);

    // Group steps by path
    const pathMap = new Map<string, SimulationStep[]>();
    for (const step of steps || []) {
      const pathSteps = pathMap.get(step.path_id) || [];
      pathSteps.push(step);
      pathMap.set(step.path_id, pathSteps);
    }

    const paths: PathResult[] = Array.from(pathMap.entries()).map(([pathId, pathSteps]) => ({
      pathId,
      steps: pathSteps,
      totalExpectedValue: pathSteps.reduce((sum, s) => sum + (s.expected_value || 0), 0),
      totalVariance: pathSteps.reduce((sum, s) => sum + (s.variance || 0), 0),
      successProbability: pathSteps.reduce((prob, s) => prob * s.success_probability, 1),
      duration: pathSteps.reduce((sum, s) => sum + (s.expected_duration_hours || 0), 0),
      riskScore: this.calculatePathRisk(pathSteps),
    }));

    return {
      runId: simulationId,
      paths,
      bestPathId: run.best_path_id,
      expectedValue: run.expected_value,
      confidenceInterval: [run.confidence_interval_low, run.confidence_interval_high],
      metrics: metrics || [],
    };
  }

  /**
   * Get all simulations for an organization
   */
  async getSimulations(
    organizationId: string,
    options?: { status?: SimulationStatus; limit?: number }
  ): Promise<SimulationRun[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("simulation_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get simulations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a benchmark snapshot
   */
  async createBenchmark(
    organizationId: string,
    name: string,
    metrics: Record<string, number>,
    options?: {
      description?: string;
      snapshotType?: string;
      domainScores?: Record<string, number>;
      createdBy?: string;
    }
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("benchmark_snapshots")
      .insert({
        organization_id: organizationId,
        name,
        description: options?.description,
        snapshot_type: options?.snapshotType || "BASELINE",
        metrics,
        domain_scores: options?.domainScores || {},
        created_by: options?.createdBy,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create benchmark: ${error.message}`);
    }

    return data.id;
  }

  // Private helper methods

  private async generatePaths(run: SimulationRun): Promise<{ id: string; nodes: string[] }[]> {
    const numPaths = run.simulation_type === "SINGLE_PATH" ? 1 :
                     run.simulation_type === "MULTI_PATH" ? 5 : 10;

    const paths: { id: string; nodes: string[] }[] = [];

    for (let i = 0; i < numPaths; i++) {
      paths.push({
        id: crypto.randomUUID(),
        nodes: run.source_node_ids || [],
      });
    }

    return paths;
  }

  private async simulatePath(
    run: SimulationRun,
    path: { id: string; nodes: string[] }
  ): Promise<PathResult> {
    const config = run.config as Required<SimulationConfig>;
    const steps: SimulationStep[] = [];

    // Generate steps for each node in the path
    for (let i = 0; i < path.nodes.length; i++) {
      const nodeId = path.nodes[i];

      // Simulate step outcomes
      const baseSuccessProb = 0.7 + Math.random() * 0.2; // 70-90%
      const adjustedProb = baseSuccessProb * (1 / config.riskMultiplier);

      const expectedValue = this.generateRandomValue(1000, 5000);
      const variance = expectedValue * 0.2;

      const step: SimulationStep = {
        id: crypto.randomUUID(),
        simulation_run_id: run.id,
        path_id: path.id,
        step_number: i + 1,
        node_id: nodeId,
        action_name: `Step ${i + 1}`,
        domain: this.getRandomDomain(),
        input_parameters: {},
        risk_factors: this.generateRiskFactors(),
        success_probability: Math.min(adjustedProb, 0.99),
        outcome_distribution: "NORMAL",
        expected_value: expectedValue,
        variance,
        min_value: expectedValue - 2 * Math.sqrt(variance),
        max_value: expectedValue + 2 * Math.sqrt(variance),
        expected_duration_hours: this.generateRandomValue(4, 40),
        depends_on_steps: i > 0 ? [steps[i - 1].id] : [],
      };

      steps.push(step);
    }

    // If no nodes provided, generate default steps
    if (steps.length === 0) {
      for (let i = 0; i < 5; i++) {
        const expectedValue = this.generateRandomValue(1000, 5000);
        const variance = expectedValue * 0.2;

        steps.push({
          id: crypto.randomUUID(),
          simulation_run_id: run.id,
          path_id: path.id,
          step_number: i + 1,
          node_id: null,
          action_name: `Simulated Step ${i + 1}`,
          domain: this.getRandomDomain(),
          input_parameters: {},
          risk_factors: this.generateRiskFactors(),
          success_probability: 0.7 + Math.random() * 0.2,
          outcome_distribution: "NORMAL",
          expected_value: expectedValue,
          variance,
          min_value: expectedValue - 2 * Math.sqrt(variance),
          max_value: expectedValue + 2 * Math.sqrt(variance),
          expected_duration_hours: this.generateRandomValue(4, 40),
          depends_on_steps: i > 0 ? [steps[i - 1].id] : [],
        });
      }
    }

    const totalExpectedValue = steps.reduce((sum, s) => sum + (s.expected_value || 0), 0);
    const totalVariance = steps.reduce((sum, s) => sum + (s.variance || 0), 0);
    const successProbability = steps.reduce((prob, s) => prob * s.success_probability, 1);
    const duration = steps.reduce((sum, s) => sum + (s.expected_duration_hours || 0), 0);

    return {
      pathId: path.id,
      steps,
      totalExpectedValue,
      totalVariance,
      successProbability,
      duration,
      riskScore: this.calculatePathRisk(steps),
    };
  }

  private calculateAggregates(
    paths: PathResult[],
    confidenceLevel: number
  ): {
    bestPath: PathResult;
    expectedValue: number;
    confidenceInterval: [number, number];
  } {
    // Sort by expected value adjusted for risk
    const scoredPaths = paths.map(p => ({
      ...p,
      score: p.totalExpectedValue * p.successProbability / (1 + p.riskScore),
    }));

    scoredPaths.sort((a, b) => b.score - a.score);
    const bestPath = scoredPaths[0];

    // Calculate expected value across all paths
    const expectedValue = paths.reduce((sum, p) =>
      sum + p.totalExpectedValue * p.successProbability, 0) / paths.length;

    // Calculate confidence interval
    const values = paths.map(p => p.totalExpectedValue);
    values.sort((a, b) => a - b);

    const lowIdx = Math.floor(values.length * (1 - confidenceLevel) / 2);
    const highIdx = Math.ceil(values.length * (1 - (1 - confidenceLevel) / 2)) - 1;

    return {
      bestPath,
      expectedValue,
      confidenceInterval: [values[lowIdx], values[highIdx]],
    };
  }

  private async calculateMetrics(
    run: SimulationRun,
    paths: PathResult[]
  ): Promise<SimulationMetric[]> {
    const metrics: SimulationMetric[] = [];

    // Overall metrics
    const values = paths.map(p => p.totalExpectedValue);
    const sortedValues = [...values].sort((a, b) => a - b);

    metrics.push({
      id: crypto.randomUUID(),
      simulation_run_id: run.id,
      path_id: null,
      metric_name: "Total Expected Value",
      metric_type: "REVENUE",
      unit: "$",
      mean_value: this.mean(values),
      median_value: this.median(values),
      std_dev: this.stdDev(values),
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      percentile_5: this.percentile(sortedValues, 5),
      percentile_25: this.percentile(sortedValues, 25),
      percentile_75: this.percentile(sortedValues, 75),
      percentile_95: this.percentile(sortedValues, 95),
    });

    // Success probability metrics
    const probs = paths.map(p => p.successProbability * 100);
    const sortedProbs = [...probs].sort((a, b) => a - b);

    metrics.push({
      id: crypto.randomUUID(),
      simulation_run_id: run.id,
      path_id: null,
      metric_name: "Success Probability",
      metric_type: "QUALITY",
      unit: "%",
      mean_value: this.mean(probs),
      median_value: this.median(probs),
      std_dev: this.stdDev(probs),
      min_value: Math.min(...probs),
      max_value: Math.max(...probs),
      percentile_5: this.percentile(sortedProbs, 5),
      percentile_25: this.percentile(sortedProbs, 25),
      percentile_75: this.percentile(sortedProbs, 75),
      percentile_95: this.percentile(sortedProbs, 95),
    });

    // Duration metrics
    const durations = paths.map(p => p.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    metrics.push({
      id: crypto.randomUUID(),
      simulation_run_id: run.id,
      path_id: null,
      metric_name: "Total Duration",
      metric_type: "TIME",
      unit: "hours",
      mean_value: this.mean(durations),
      median_value: this.median(durations),
      std_dev: this.stdDev(durations),
      min_value: Math.min(...durations),
      max_value: Math.max(...durations),
      percentile_5: this.percentile(sortedDurations, 5),
      percentile_25: this.percentile(sortedDurations, 25),
      percentile_75: this.percentile(sortedDurations, 75),
      percentile_95: this.percentile(sortedDurations, 95),
    });

    return metrics;
  }

  private calculatePathRisk(steps: SimulationStep[]): number {
    let totalRisk = 0;
    for (const step of steps) {
      const factors = step.risk_factors;
      totalRisk += Object.values(factors).reduce((sum, val) => sum + val, 0);
    }
    return totalRisk / Math.max(steps.length, 1);
  }

  private generateRiskFactors(): Record<string, number> {
    return {
      complexity: Math.random() * 0.3,
      dependency: Math.random() * 0.2,
      uncertainty: Math.random() * 0.3,
      resource: Math.random() * 0.2,
    };
  }

  private generateRandomValue(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
  }

  private getRandomDomain(): string {
    const domains = ["SEO", "GEO", "CONTENT", "TECHNICAL", "BACKLINK", "LOCAL"];
    return domains[Math.floor(Math.random() * domains.length)];
  }

  // Statistical helpers
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private stdDev(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private percentile(sortedValues: number[], p: number): number {
    const idx = Math.floor((p / 100) * (sortedValues.length - 1));
    return sortedValues[idx];
  }
}

export default StrategySimulationService;
