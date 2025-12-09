/**
 * Simulation Engine
 *
 * Forecasts agent behavior and decision outcomes under different conditions.
 * Enables scenario testing before deploying governance policies.
 */

import { Scenario, SimulationResult } from './types';
import { assessRisk } from './riskEnvelope';
import { routeRequest } from './modelRoutingEngine';
import { getModelScoreForTask } from './modelRewardEngine';

export interface ScenarioConditions {
  name: string;
  description: string;
  agentLoad: 'light' | 'moderate' | 'heavy' | 'critical';
  costConstraint: number;
  latencyTarget: number;
  taskTypes: string[];
  modelAvailability: Record<string, number>; // model -> availability (0-1)
  founderPolicy: 'conservative' | 'balanced' | 'aggressive';
  durationMinutes: number;
}

export interface SimulationConfig {
  scenarioId: string;
  iterations: number;
  randomSeed?: number;
}

export interface SimulationMetrics {
  avgLatency: number;
  avgCost: number;
  totalCost: number;
  successRate: number;
  failureRate: number;
  riskIncidents: number;
  modelDistribution: Record<string, number>;
}

// Simulation history
const simulationHistory: SimulationResult[] = [];
const scenarios: Scenario[] = [];

/**
 * Create a scenario
 */
export function createScenario(conditions: ScenarioConditions): Scenario {
  const scenario: Scenario = {
    id: crypto.randomUUID(),
    name: conditions.name,
    description: conditions.description,
    conditions: {
      agentLoad: conditions.agentLoad,
      costConstraint: conditions.costConstraint,
      latencyTarget: conditions.latencyTarget,
      taskTypes: conditions.taskTypes,
      modelAvailability: conditions.modelAvailability,
      founderPolicy: conditions.founderPolicy,
    },
    expectedOutcome: {
      avgLatency: 0,
      avgCost: 0,
      successRate: 0,
      riskLevel: 'medium',
    },
    confidence: 0,
    probability: 0,
    timestamp: new Date().toISOString(),
  };

  scenarios.push(scenario);
  return scenario;
}

/**
 * Run simulation for a scenario
 */
export function runSimulation(scenarioId: string, config: Partial<SimulationConfig> = {}): SimulationResult {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  const iterations = config.iterations || 100;
  const seed = config.randomSeed || Math.random() * 1000000;

  // Initialize metrics
  const modelCounts: Record<string, number> = {};
  let totalLatency = 0;
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;
  let riskIncidents = 0;

  // Run iterations
  for (let i = 0; i < iterations; i++) {
    const taskType = selectRandomTaskType(scenario.conditions.taskTypes, seed + i);

    // Simulate routing decision
    const routingDecision = simulateRouting(
      scenario.conditions as any,
      taskType,
      seed + i
    );

    modelCounts[routingDecision.model] = (modelCounts[routingDecision.model] || 0) + 1;
    totalLatency += routingDecision.latency;
    totalCost += routingDecision.cost;

    // Simulate execution
    const execution = simulateExecution(
      taskType,
      routingDecision.model,
      scenario.conditions.modelAvailability[routingDecision.model] || 0.95,
      seed + i
    );

    if (execution.success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Assess risk
    const riskAssessment = assessRisk({
      estimatedCost: routingDecision.cost,
      estimatedLatency: routingDecision.latency,
      estimatedAccuracy: execution.accuracy,
      affectedContacts: 1000,
      operationType: taskType,
    });

    if (riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical') {
      riskIncidents++;
    }
  }

  const successRate = successCount / iterations;
  const failureRate = failureCount / iterations;
  const avgLatency = Math.round(totalLatency / iterations);
  const avgCost = totalCost / iterations;

  const result: SimulationResult = {
    scenarioId,
    timestamp: new Date().toISOString(),
    agentBehavior: {
      averageDecisionTime: avgLatency,
      failureRate,
      successRate,
      taskCompletionRate: successRate,
    },
    modelSelection: modelCounts,
    resourceUtilization: {
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalLatency: totalLatency,
      successRate: parseFloat((successRate * 100).toFixed(2)),
    },
    riskAssessment: {
      criticalRisks: [],
      warningsDetected: riskIncidents > iterations * 0.1
        ? [`${riskIncidents} risk incidents detected across ${iterations} iterations`]
        : [],
      overallRiskScore: (riskIncidents / iterations) * 100,
    },
  };

  // Analyze results
  analyzeSimulationResults(result, scenario);

  simulationHistory.push(result);
  return result;
}

/**
 * Select random task type from available types
 */
function selectRandomTaskType(taskTypes: string[], seed: number): string {
  if (taskTypes.length === 0) {
return 'general';
}
  const seededRandom = Math.sin(seed) * 10000;
  const index = Math.floor((seededRandom - Math.floor(seededRandom)) * taskTypes.length);
  return taskTypes[index];
}

/**
 * Simulate routing decision
 */
function simulateRouting(
  conditions: any,
  taskType: string,
  seed: number
): { model: string; latency: number; cost: number } {
  const models = Object.keys(conditions.modelAvailability || {});
  if (models.length === 0) {
    return { model: 'claude-sonnet-4-5-20250929', latency: 1200, cost: 0.003 };
  }

  // Seeded random selection
  const seededRandom = Math.sin(seed * 73) * 10000;
  const modelIndex = Math.floor((seededRandom - Math.floor(seededRandom)) * models.length);
  const selectedModel = models[modelIndex];

  // Simulate latency based on load
  let latency = 1000;
  if (conditions.agentLoad === 'heavy') {
latency *= 1.5;
}
  if (conditions.agentLoad === 'critical') {
latency *= 2;
}
  if (conditions.agentLoad === 'light') {
latency *= 0.7;
}

  // Simulate cost
  let cost = 0.003;
  if (selectedModel.includes('opus')) {
cost = 0.015;
}
  if (selectedModel.includes('haiku')) {
cost = 0.0004;
}

  return {
    model: selectedModel,
    latency: Math.round(latency),
    cost,
  };
}

/**
 * Simulate execution
 */
function simulateExecution(
  taskType: string,
  model: string,
  availability: number,
  seed: number
): { success: boolean; accuracy: number; latency: number } {
  const seededRandom = Math.sin(seed * 97) * 10000;
  const successChance = seededRandom - Math.floor(seededRandom);

  const success = successChance < availability;

  // Model-specific accuracy
  let accuracy = 80;
  if (model.includes('opus')) {
accuracy = 95;
}
  if (model.includes('sonnet')) {
accuracy = 88;
}
  if (model.includes('haiku')) {
accuracy = 75;
}

  const latency = Math.round(1000 + Math.random() * 500);

  return {
    success,
    accuracy,
    latency,
  };
}

/**
 * Analyze simulation results
 */
function analyzeSimulationResults(result: SimulationResult, scenario: Scenario): void {
  // Check if results meet expectations
  const metrics = result.resourceUtilization;

  scenario.expectedOutcome = {
    avgLatency: metrics.totalLatency,
    avgCost: metrics.totalCost,
    successRate: metrics.successRate,
    riskLevel: result.riskAssessment.overallRiskScore > 50 ? 'high' : 'medium',
  };

  // Calculate confidence based on consistency
  scenario.confidence = Math.min(100, 50 + result.resourceUtilization.successRate);

  // Calculate probability of success
  scenario.probability = result.resourceUtilization.successRate / 100;
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(scenarioIds: string[]): {
  scenario: Scenario;
  result: SimulationResult | null;
}[] {
  return scenarioIds.map(id => {
    const scenario = scenarios.find(s => s.id === id);
    const result = simulationHistory.find(r => r.scenarioId === id);
    return {
      scenario: scenario || { id, name: 'Unknown', description: '', conditions: {}, expectedOutcome: {}, confidence: 0, probability: 0, timestamp: '' },
      result: result || null,
    };
  });
}

/**
 * Forecast agent behavior
 */
export function forecastAgentBehavior(
  agentType: string,
  timeframe: number
): {
  expectedLoadIncrease: number;
  estimatedResourceNeeds: {
    computeHours: number;
    estimatedCost: number;
  };
  riskFactors: string[];
  recommendations: string[];
} {
  // Analyze historical data to forecast
  const recentResults = simulationHistory.slice(-10);

  const avgCost = recentResults.reduce((sum, r) => sum + r.resourceUtilization.totalCost, 0) / recentResults.length || 0;
  const avgLatency = recentResults.reduce((sum, r) => sum + r.resourceUtilization.totalLatency, 0) / recentResults.length || 0;

  const loadIncrease = Math.random() * 0.3; // 0-30% random increase for demonstration
  const projectedCost = avgCost * (1 + loadIncrease) * (timeframe / 60); // Scale by timeframe

  const riskFactors: string[] = [];
  if (loadIncrease > 0.2) {
riskFactors.push('Significant load increase expected');
}
  if (avgLatency > 2000) {
riskFactors.push('Latency may exceed targets');
}

  const recommendations: string[] = [];
  if (projectedCost > 100) {
recommendations.push('Consider cost optimization strategies');
}
  if (riskFactors.length > 0) {
recommendations.push('Review risk profiles proactively');
}

  return {
    expectedLoadIncrease: Math.round(loadIncrease * 100),
    estimatedResourceNeeds: {
      computeHours: Math.round((projectedCost / 0.003) / 1000),
      estimatedCost: Math.round(projectedCost * 100) / 100,
    },
    riskFactors,
    recommendations,
  };
}

/**
 * Get simulation history
 */
export function getSimulationHistory(limit = 50): SimulationResult[] {
  return simulationHistory.slice(-limit);
}

/**
 * Get scenario
 */
export function getScenario(scenarioId: string): Scenario | null {
  return scenarios.find(s => s.id === scenarioId) || null;
}

/**
 * List all scenarios
 */
export function listScenarios(): Scenario[] {
  return [...scenarios];
}

/**
 * Get simulation statistics
 */
export function getSimulationStats(): {
  totalSimulations: number;
  totalScenarios: number;
  averageSuccessRate: number;
  averageCost: number;
  highestRiskScenario: string;
} {
  const avgSuccessRate =
    simulationHistory.reduce((sum, r) => sum + r.resourceUtilization.successRate, 0) /
    simulationHistory.length || 0;
  const avgCost =
    simulationHistory.reduce((sum, r) => sum + r.resourceUtilization.totalCost, 0) /
    simulationHistory.length || 0;

  const highestRiskResult = simulationHistory.reduce((max, r) =>
    r.riskAssessment.overallRiskScore > (max?.riskAssessment.overallRiskScore || 0) ? r : max
  );

  return {
    totalSimulations: simulationHistory.length,
    totalScenarios: scenarios.length,
    averageSuccessRate: Math.round(avgSuccessRate * 100) / 100,
    averageCost: Math.round(avgCost * 100) / 100,
    highestRiskScenario: highestRiskResult?.scenarioId || 'none',
  };
}

/**
 * Export simulation data
 */
export function exportSimulationData() {
  return {
    scenarios,
    results: simulationHistory,
    stats: getSimulationStats(),
  };
}
