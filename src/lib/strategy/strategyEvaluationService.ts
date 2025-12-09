/**
 * Strategy Evaluation Service - Phase 11 Week 3-4
 *
 * Computes expected-value scores, confidence intervals, and
 * alternative-path comparisons.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { SimulationResult, PathResult, SimulationMetric } from "./strategySimulationService";

// Types
export interface PathEvaluation {
  pathId: string;
  expectedValue: number;
  riskAdjustedValue: number;
  confidenceInterval: [number, number];
  successProbability: number;
  duration: number;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonResult {
  id: string;
  paths: PathEvaluation[];
  recommendedPathId: string;
  recommendationConfidence: number;
  rationale: string;
  tradeoffs: TradeoffAnalysis[];
}

export interface TradeoffAnalysis {
  metric: string;
  pathA: { id: string; value: number };
  pathB: { id: string; value: number };
  winner: string;
  difference: number;
  differencePercent: number;
}

export interface EvaluationConfig {
  riskTolerance?: number; // 0-1, higher = more risk tolerant
  timePreference?: number; // 0-1, higher = prefer faster
  valueWeight?: number; // 0-1, weight on expected value
  probabilityWeight?: number; // 0-1, weight on success probability
}

export interface SensitivityResult {
  parameter: string;
  baselineValue: number;
  range: { value: number; outcome: number }[];
  sensitivity: number; // derivative at baseline
  breakeven: number | null; // value where outcome = 0
}

export class StrategyEvaluationService {
  private defaultConfig: Required<EvaluationConfig> = {
    riskTolerance: 0.5,
    timePreference: 0.3,
    valueWeight: 0.5,
    probabilityWeight: 0.3,
  };

  /**
   * Evaluate all paths from a simulation result
   */
  evaluatePaths(
    result: SimulationResult,
    config?: EvaluationConfig
  ): PathEvaluation[] {
    const cfg = { ...this.defaultConfig, ...config };
    const evaluations: PathEvaluation[] = [];

    for (const path of result.paths) {
      const evaluation = this.evaluatePath(path, cfg);
      evaluations.push(evaluation);
    }

    // Rank paths by score
    evaluations.sort((a, b) => b.score - a.score);
    evaluations.forEach((e, i) => {
      e.rank = i + 1;
    });

    return evaluations;
  }

  /**
   * Evaluate a single path
   */
  private evaluatePath(
    path: PathResult,
    config: Required<EvaluationConfig>
  ): PathEvaluation {
    // Calculate risk-adjusted value
    const riskPenalty = (1 - config.riskTolerance) * path.riskScore;
    const riskAdjustedValue = path.totalExpectedValue * (1 - riskPenalty);

    // Calculate confidence interval using variance
    const stdDev = Math.sqrt(path.totalVariance);
    const z = 1.96; // 95% confidence
    const confidenceInterval: [number, number] = [
      path.totalExpectedValue - z * stdDev,
      path.totalExpectedValue + z * stdDev,
    ];

    // Calculate composite score
    const normalizedValue = path.totalExpectedValue / 10000; // Assume max ~10k
    const normalizedDuration = 1 - Math.min(path.duration / 200, 1); // Assume max ~200h
    const normalizedProb = path.successProbability;

    const score =
      config.valueWeight * normalizedValue +
      config.probabilityWeight * normalizedProb +
      config.timePreference * normalizedDuration +
      (1 - config.valueWeight - config.probabilityWeight - config.timePreference) *
        (1 - path.riskScore);

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (path.successProbability > 0.8) {
      strengths.push("High success probability");
    } else if (path.successProbability < 0.5) {
      weaknesses.push("Low success probability");
    }

    if (path.riskScore < 0.3) {
      strengths.push("Low risk profile");
    } else if (path.riskScore > 0.6) {
      weaknesses.push("High risk exposure");
    }

    if (path.duration < 50) {
      strengths.push("Fast execution");
    } else if (path.duration > 150) {
      weaknesses.push("Long timeline");
    }

    if (path.totalExpectedValue > 5000) {
      strengths.push("High value potential");
    }

    return {
      pathId: path.pathId,
      expectedValue: path.totalExpectedValue,
      riskAdjustedValue,
      confidenceInterval,
      successProbability: path.successProbability,
      duration: path.duration,
      score: score * 100, // Convert to 0-100 scale
      rank: 0, // Will be set after sorting
      strengths,
      weaknesses,
    };
  }

  /**
   * Compare multiple paths and generate recommendation
   */
  async comparePaths(
    organizationId: string,
    simulationRunIds: string[],
    pathIds: string[],
    config?: EvaluationConfig
  ): Promise<ComparisonResult> {
    const supabase = await getSupabaseServer();
    const cfg = { ...this.defaultConfig, ...config };

    // Fetch path data
    const pathResults: PathResult[] = [];

    for (const pathId of pathIds) {
      const { data: steps } = await supabase
        .from("simulation_steps")
        .select("*")
        .eq("path_id", pathId);

      if (steps && steps.length > 0) {
        pathResults.push({
          pathId,
          steps,
          totalExpectedValue: steps.reduce((sum, s) => sum + (s.expected_value || 0), 0),
          totalVariance: steps.reduce((sum, s) => sum + (s.variance || 0), 0),
          successProbability: steps.reduce((prob, s) => prob * s.success_probability, 1),
          duration: steps.reduce((sum, s) => sum + (s.expected_duration_hours || 0), 0),
          riskScore: this.calculateRiskScore(steps),
        });
      }
    }

    // Evaluate all paths
    const evaluations = pathResults.map(p => this.evaluatePath(p, cfg));
    evaluations.sort((a, b) => b.score - a.score);
    evaluations.forEach((e, i) => {
      e.rank = i + 1;
    });

    // Calculate tradeoffs between top paths
    const tradeoffs = this.analyzeTradeoffs(pathResults);

    // Generate recommendation
    const recommended = evaluations[0];
    const rationale = this.generateRationale(recommended, evaluations);

    // Store comparison
    const comparisonId = crypto.randomUUID();
    await supabase.from("simulation_comparisons").insert({
      id: comparisonId,
      organization_id: organizationId,
      name: `Comparison ${new Date().toISOString()}`,
      simulation_run_ids: simulationRunIds,
      path_ids: pathIds,
      ranking: evaluations.map(e => e.pathId),
      scores: Object.fromEntries(evaluations.map(e => [e.pathId, e.score])),
      tradeoffs,
      recommended_path_id: recommended.pathId,
      recommendation_confidence: recommended.score / 100,
      recommendation_rationale: rationale,
    });

    return {
      id: comparisonId,
      paths: evaluations,
      recommendedPathId: recommended.pathId,
      recommendationConfidence: recommended.score / 100,
      rationale,
      tradeoffs,
    };
  }

  /**
   * Perform sensitivity analysis on a path
   */
  performSensitivityAnalysis(
    path: PathResult,
    parameters: string[] = ["success_probability", "expected_value", "duration"]
  ): SensitivityResult[] {
    const results: SensitivityResult[] = [];

    for (const param of parameters) {
      const result = this.analyzeParameter(path, param);
      results.push(result);
    }

    return results;
  }

  /**
   * Calculate expected value with confidence intervals
   */
  calculateExpectedValueWithCI(
    paths: PathResult[],
    confidenceLevel: number = 0.95
  ): {
    expectedValue: number;
    confidenceInterval: [number, number];
    variance: number;
    standardError: number;
  } {
    const values = paths.map(p => p.totalExpectedValue * p.successProbability);
    const n = values.length;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const standardError = Math.sqrt(variance / n);

    // z-score for confidence level
    const z = this.getZScore(confidenceLevel);

    return {
      expectedValue: mean,
      confidenceInterval: [
        mean - z * standardError,
        mean + z * standardError,
      ],
      variance,
      standardError,
    };
  }

  /**
   * Rank paths using multiple criteria (TOPSIS method)
   */
  rankPathsTOPSIS(paths: PathResult[]): { pathId: string; score: number; rank: number }[] {
    if (paths.length === 0) {
return [];
}

    // Criteria: value (max), probability (max), duration (min), risk (min)
    const criteria = paths.map(p => [
      p.totalExpectedValue,
      p.successProbability,
      -p.duration, // Negative because we want to minimize
      -p.riskScore, // Negative because we want to minimize
    ]);

    // Normalize
    const normalized = this.normalizeMatrix(criteria);

    // Apply weights
    const weights = [0.4, 0.3, 0.15, 0.15];
    const weighted = normalized.map(row =>
      row.map((val, i) => val * weights[i])
    );

    // Find ideal and anti-ideal solutions
    const ideal = weighted[0].map((_, i) =>
      Math.max(...weighted.map(row => row[i]))
    );
    const antiIdeal = weighted[0].map((_, i) =>
      Math.min(...weighted.map(row => row[i]))
    );

    // Calculate distances and scores
    const scores = weighted.map((row, idx) => {
      const distIdeal = Math.sqrt(
        row.reduce((sum, val, i) => sum + Math.pow(val - ideal[i], 2), 0)
      );
      const distAntiIdeal = Math.sqrt(
        row.reduce((sum, val, i) => sum + Math.pow(val - antiIdeal[i], 2), 0)
      );
      return {
        pathId: paths[idx].pathId,
        score: distAntiIdeal / (distIdeal + distAntiIdeal),
        rank: 0,
      };
    });

    // Rank
    scores.sort((a, b) => b.score - a.score);
    scores.forEach((s, i) => {
      s.rank = i + 1;
    });

    return scores;
  }

  /**
   * Get evaluation metrics for display
   */
  async getEvaluationMetrics(simulationRunId: string): Promise<SimulationMetric[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("simulation_metrics")
      .select("*")
      .eq("simulation_run_id", simulationRunId);

    if (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }

    return data || [];
  }

  // Private helper methods

  private calculateRiskScore(steps: { risk_factors: Record<string, number> }[]): number {
    let totalRisk = 0;
    for (const step of steps) {
      totalRisk += Object.values(step.risk_factors || {}).reduce((sum, val) => sum + val, 0);
    }
    return totalRisk / Math.max(steps.length, 1);
  }

  private analyzeTradeoffs(paths: PathResult[]): TradeoffAnalysis[] {
    const tradeoffs: TradeoffAnalysis[] = [];

    if (paths.length < 2) {
return tradeoffs;
}

    const metrics = [
      { name: "Expected Value", getter: (p: PathResult) => p.totalExpectedValue },
      { name: "Success Probability", getter: (p: PathResult) => p.successProbability },
      { name: "Duration", getter: (p: PathResult) => p.duration },
      { name: "Risk Score", getter: (p: PathResult) => p.riskScore },
    ];

    // Compare top 2 paths
    const pathA = paths[0];
    const pathB = paths[1];

    for (const metric of metrics) {
      const valueA = metric.getter(pathA);
      const valueB = metric.getter(pathB);
      const difference = valueA - valueB;
      const differencePercent = Math.abs(difference / valueB) * 100;

      // Determine winner based on metric
      let winner = pathA.pathId;
      if (metric.name === "Duration" || metric.name === "Risk Score") {
        winner = valueA < valueB ? pathA.pathId : pathB.pathId;
      } else {
        winner = valueA > valueB ? pathA.pathId : pathB.pathId;
      }

      tradeoffs.push({
        metric: metric.name,
        pathA: { id: pathA.pathId, value: valueA },
        pathB: { id: pathB.pathId, value: valueB },
        winner,
        difference,
        differencePercent,
      });
    }

    return tradeoffs;
  }

  private generateRationale(
    recommended: PathEvaluation,
    all: PathEvaluation[]
  ): string {
    const parts: string[] = [];

    parts.push(`Path ${recommended.pathId.slice(0, 8)} is recommended with a score of ${recommended.score.toFixed(1)}/100.`);

    if (recommended.strengths.length > 0) {
      parts.push(`Key strengths: ${recommended.strengths.join(", ")}.`);
    }

    if (all.length > 1) {
      const margin = recommended.score - all[1].score;
      parts.push(`It outperforms the second-best option by ${margin.toFixed(1)} points.`);
    }

    parts.push(`Expected value: $${recommended.expectedValue.toFixed(0)} with ${(recommended.successProbability * 100).toFixed(0)}% success probability.`);

    return parts.join(" ");
  }

  private analyzeParameter(path: PathResult, parameter: string): SensitivityResult {
    const range: { value: number; outcome: number }[] = [];
    let baselineValue = 0;

    // Get baseline value
    switch (parameter) {
      case "success_probability":
        baselineValue = path.successProbability;
        break;
      case "expected_value":
        baselineValue = path.totalExpectedValue;
        break;
      case "duration":
        baselineValue = path.duration;
        break;
      default:
        baselineValue = 0.5;
    }

    // Generate range of values
    for (let i = 0; i <= 10; i++) {
      const value = baselineValue * (0.5 + i * 0.1); // 50% to 150% of baseline
      const outcome = this.calculateOutcome(path, parameter, value);
      range.push({ value, outcome });
    }

    // Calculate sensitivity (approximate derivative)
    const midIdx = 5;
    const sensitivity =
      (range[midIdx + 1].outcome - range[midIdx - 1].outcome) /
      (range[midIdx + 1].value - range[midIdx - 1].value);

    // Find breakeven
    let breakeven: number | null = null;
    for (let i = 1; i < range.length; i++) {
      if (
        (range[i - 1].outcome <= 0 && range[i].outcome > 0) ||
        (range[i - 1].outcome >= 0 && range[i].outcome < 0)
      ) {
        // Linear interpolation
        breakeven =
          range[i - 1].value +
          ((0 - range[i - 1].outcome) * (range[i].value - range[i - 1].value)) /
            (range[i].outcome - range[i - 1].outcome);
        break;
      }
    }

    return {
      parameter,
      baselineValue,
      range,
      sensitivity,
      breakeven,
    };
  }

  private calculateOutcome(path: PathResult, parameter: string, value: number): number {
    // Simplified outcome calculation
    switch (parameter) {
      case "success_probability":
        return path.totalExpectedValue * value;
      case "expected_value":
        return value * path.successProbability;
      case "duration":
        return path.totalExpectedValue / value * 100; // Inverse relationship
      default:
        return path.totalExpectedValue * path.successProbability;
    }
  }

  private normalizeMatrix(matrix: number[][]): number[][] {
    if (matrix.length === 0) {
return [];
}

    const numCols = matrix[0].length;
    const norms = Array(numCols).fill(0);

    // Calculate column norms
    for (let j = 0; j < numCols; j++) {
      let sumSquares = 0;
      for (let i = 0; i < matrix.length; i++) {
        sumSquares += matrix[i][j] ** 2;
      }
      norms[j] = Math.sqrt(sumSquares);
    }

    // Normalize
    return matrix.map(row =>
      row.map((val, j) => (norms[j] > 0 ? val / norms[j] : 0))
    );
  }

  private getZScore(confidenceLevel: number): number {
    // Approximate z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    return zScores[confidenceLevel] || 1.96;
  }
}

export default StrategyEvaluationService;
