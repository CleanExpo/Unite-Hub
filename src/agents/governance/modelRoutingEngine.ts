/**
 * Model Routing Engine
 *
 * Intelligent model selection based on task requirements, cost constraints, and performance targets.
 * Implements multi-factor decision making with fallback chains.
 */

import {
  getRecommendedModels,
  getCheapestModel,
  getFastestModel,
  getMostReliableModel,
  getModelCapabilityById,
} from './modelCapabilityMap';
import { ModelRoutingDecision } from './types';

export interface RoutingConstraints {
  capability: string;
  maxCostPerToken?: number;
  maxLatencyMs?: number;
  minAvailabilityScore?: number;
  needsCaching?: boolean;
  needsBatching?: boolean;
  needsStreaming?: boolean;
  priority?: 'cost' | 'speed' | 'reliability' | 'balanced';
  fallbackStrategy?: 'cost-first' | 'speed-first' | 'reliability-first' | 'balanced';
}

export interface RoutingMetrics {
  modelSelection: Record<string, number>; // model -> selection count
  averageLatency: number;
  averageCost: number;
  totalRequests: number;
  successRate: number;
}

// Routing history and metrics
let routingHistory: ModelRoutingDecision[] = [];
let routingMetrics: Record<string, RoutingMetrics> = {};

/**
 * Route request to optimal model
 */
export function routeRequest(
  requestId: string,
  constraints: RoutingConstraints
): ModelRoutingDecision {
  // Get recommended models ranked by score
  const recommended = getRecommendedModels(constraints.capability, {
    maxCostPerToken: constraints.maxCostPerToken,
    maxLatencyMs: constraints.maxLatencyMs,
    minAvailabilityScore: constraints.minAvailabilityScore,
    needsCaching: constraints.needsCaching,
    needsBatching: constraints.needsBatching,
    needsStreaming: constraints.needsStreaming,
  });

  if (recommended.length === 0) {
    // Fallback to unconstrained recommendations
    return routeWithFallback(requestId, constraints);
  }

  // Select based on priority
  const selectedModel = selectByPriority(recommended, constraints.priority || 'balanced');

  const decision: ModelRoutingDecision = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    requestId,
    selectedModel: selectedModel.capability.model,
    alternatives: recommended.slice(1, 3).map(r => r.capability.model),
    routingReason: `Selected ${selectedModel.capability.model} for ${constraints.capability}`,
    estimatedLatency: selectedModel.capability.latencyMs,
    estimatedCost: selectedModel.capability.costPerToken,
    confidenceScore: selectedModel.score / 100,
  };

  recordRoutingDecision(decision);
  return decision;
}

/**
 * Select model based on priority strategy
 */
function selectByPriority(
  recommended: { capability: any; score: number }[],
  priority: string
): { capability: any; score: number } {
  if (recommended.length === 0) {
    throw new Error('No recommended models available');
  }

  // For most cases, use the highest-scored model
  if (priority === 'balanced') {
    return recommended[0];
  }

  // For cost-priority: find cheapest among recommended
  if (priority === 'cost') {
    return recommended.reduce((prev, current) =>
      prev.capability.costPerToken < current.capability.costPerToken ? prev : current
    );
  }

  // For speed-priority: find fastest among recommended
  if (priority === 'speed') {
    return recommended.reduce((prev, current) =>
      prev.capability.latencyMs < current.capability.latencyMs ? prev : current
    );
  }

  // For reliability-priority: find most available among recommended
  if (priority === 'reliability') {
    return recommended.reduce((prev, current) =>
      prev.capability.availabilityScore > current.capability.availabilityScore ? prev : current
    );
  }

  return recommended[0];
}

/**
 * Route with fallback when constraints can't be met
 */
function routeWithFallback(requestId: string, constraints: RoutingConstraints): ModelRoutingDecision {
  const fallbackStrategy = constraints.fallbackStrategy || 'balanced';

  let selectedCapability: any = null;
  let reason = '';

  if (fallbackStrategy === 'cost-first') {
    selectedCapability = getCheapestModel(constraints.capability);
    reason = 'Fallback: Selected cheapest model';
  } else if (fallbackStrategy === 'speed-first') {
    selectedCapability = getFastestModel(constraints.capability);
    reason = 'Fallback: Selected fastest model';
  } else if (fallbackStrategy === 'reliability-first') {
    selectedCapability = getMostReliableModel(constraints.capability);
    reason = 'Fallback: Selected most reliable model';
  } else {
    // balanced: pick the one that best balances all factors
    const candidates = getRecommendedModels(constraints.capability, {}, 10);
    selectedCapability = candidates[0]?.capability;
    reason = 'Fallback: Selected best-balanced model';
  }

  if (!selectedCapability) {
    throw new Error(`No models available for capability: ${constraints.capability}`);
  }

  const decision: ModelRoutingDecision = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    requestId,
    selectedModel: selectedCapability.model,
    alternatives: [],
    routingReason: reason,
    estimatedLatency: selectedCapability.latencyMs,
    estimatedCost: selectedCapability.costPerToken,
    confidenceScore: 0.7, // Lower confidence for fallback
  };

  recordRoutingDecision(decision);
  return decision;
}

/**
 * Record routing decision and update metrics
 */
function recordRoutingDecision(decision: ModelRoutingDecision): void {
  routingHistory.push(decision);

  // Update metrics
  if (!routingMetrics[decision.selectedModel]) {
    routingMetrics[decision.selectedModel] = {
      modelSelection: { [decision.selectedModel]: 1 },
      averageLatency: decision.estimatedLatency,
      averageCost: decision.estimatedCost,
      totalRequests: 1,
      successRate: 1,
    };
  } else {
    const metrics = routingMetrics[decision.selectedModel];
    metrics.modelSelection[decision.selectedModel] =
      (metrics.modelSelection[decision.selectedModel] || 0) + 1;
    metrics.totalRequests++;
    metrics.averageLatency =
      (metrics.averageLatency * (metrics.totalRequests - 1) + decision.estimatedLatency) /
      metrics.totalRequests;
    metrics.averageCost =
      (metrics.averageCost * (metrics.totalRequests - 1) + decision.estimatedCost) /
      metrics.totalRequests;
  }
}

/**
 * Get routing history
 */
export function getRoutingHistory(limit = 100): ModelRoutingDecision[] {
  return routingHistory.slice(-limit);
}

/**
 * Get routing metrics for a model
 */
export function getRoutingMetricsForModel(modelName: string): RoutingMetrics | null {
  return routingMetrics[modelName] || null;
}

/**
 * Get all routing metrics
 */
export function getAllRoutingMetrics(): Record<string, RoutingMetrics> {
  return { ...routingMetrics };
}

/**
 * Update routing decision success/failure
 */
export function recordRoutingOutcome(
  decisionId: string,
  success: boolean,
  actualLatencyMs: number,
  actualCostPerToken: number
): void {
  const decision = routingHistory.find(d => d.id === decisionId);
  if (!decision) {
return;
}

  const metrics = routingMetrics[decision.selectedModel];
  if (!metrics) {
return;
}

  // Update success rate
  const totalRuns = metrics.totalRequests;
  const currentSuccessCount = Math.round(metrics.successRate * totalRuns);
  metrics.successRate = success ? (currentSuccessCount + 1) / totalRuns : currentSuccessCount / totalRuns;

  // Update actual metrics
  metrics.averageLatency = (metrics.averageLatency + actualLatencyMs) / 2;
  metrics.averageCost = (metrics.averageCost + actualCostPerToken) / 2;
}

/**
 * Get routing statistics by capability
 */
export function getRoutingStatsByCapability(capability: string): {
  capability: string;
  totalRequests: number;
  modelsUsed: string[];
  avgLatency: number;
  avgCost: number;
  avgConfidence: number;
} {
  const relevant = routingHistory.filter(d => d.routingReason.includes(capability));

  if (relevant.length === 0) {
    return {
      capability,
      totalRequests: 0,
      modelsUsed: [],
      avgLatency: 0,
      avgCost: 0,
      avgConfidence: 0,
    };
  }

  const avgLatency = relevant.reduce((sum, d) => sum + d.estimatedLatency, 0) / relevant.length;
  const avgCost = relevant.reduce((sum, d) => sum + d.estimatedCost, 0) / relevant.length;
  const avgConfidence =
    relevant.reduce((sum, d) => sum + d.confidenceScore, 0) / relevant.length;
  const modelsUsed = Array.from(new Set(relevant.map(d => d.selectedModel)));

  return {
    capability,
    totalRequests: relevant.length,
    modelsUsed,
    avgLatency: Math.round(avgLatency),
    avgCost: parseFloat(avgCost.toFixed(6)),
    avgConfidence: parseFloat(avgConfidence.toFixed(2)),
  };
}

/**
 * Compare routing costs across models
 */
export function compareRoutingCosts(capability: string): {
  model: string;
  costPerRequest: number;
  selectionCount: number;
  percentageOfTotal: number;
  totalSpend: number;
}[] {
  const metrics = getAllRoutingMetrics();
  const capabilityMetrics = Object.entries(metrics).map(([model, m]) => {
    const routingsForModel = routingHistory.filter(d => d.selectedModel === model);
    const totalCost = routingsForModel.reduce(
      (sum, d) => sum + d.estimatedCost,
      0
    );

    return {
      model,
      costPerRequest: m.averageCost,
      selectionCount: m.totalRequests,
      percentageOfTotal: (m.totalRequests / routingHistory.length) * 100,
      totalSpend: totalCost,
    };
  });

  return capabilityMetrics.sort((a, b) => b.totalSpend - a.totalSpend);
}

/**
 * Get recommendation for optimizing routing costs
 */
export function getRoutingOptimizationRecommendations(): string[] {
  const recommendations: string[] = [];
  const allMetrics = getAllRoutingMetrics();

  // Find underutilized expensive models
  for (const [model, metrics] of Object.entries(allMetrics)) {
    const capData = getModelCapabilityById(model);
    if (capData && metrics.totalRequests < 10 && capData.costPerToken > 0.01) {
      recommendations.push(`Consider reducing usage of ${model} - low volume, high cost`);
    }
  }

  // Find overused models
  const sortedByUsage = Object.entries(allMetrics).sort(
    ([, a], [, b]) => b.totalRequests - a.totalRequests
  );
  if (sortedByUsage.length > 0) {
    const topModel = sortedByUsage[0];
    if (topModel[1].totalRequests > routingHistory.length * 0.7) {
      recommendations.push(`Model ${topModel[0]} used for >70% of requests - consider diversifying`);
    }
  }

  // Check for fallback patterns
  const fallbackDecisions = routingHistory.filter(d => d.confidenceScore < 0.75);
  if (fallbackDecisions.length > routingHistory.length * 0.2) {
    recommendations.push('High fallback rate detected - review capability requirements');
  }

  return recommendations;
}

/**
 * Reset routing metrics (for testing)
 */
export function resetRoutingMetrics(): void {
  routingHistory = [];
  routingMetrics = {};
}

/**
 * Export routing data for analysis
 */
export function exportRoutingData(): {
  history: ModelRoutingDecision[];
  metrics: Record<string, RoutingMetrics>;
  summary: {
    totalDecisions: number;
    uniqueModels: number;
    avgLatency: number;
    avgCost: number;
  };
} {
  const avgLatency =
    routingHistory.reduce((sum, d) => sum + d.estimatedLatency, 0) / routingHistory.length || 0;
  const avgCost =
    routingHistory.reduce((sum, d) => sum + d.estimatedCost, 0) / routingHistory.length || 0;
  const uniqueModels = new Set(routingHistory.map(d => d.selectedModel)).size;

  return {
    history: routingHistory,
    metrics: routingMetrics,
    summary: {
      totalDecisions: routingHistory.length,
      uniqueModels,
      avgLatency: Math.round(avgLatency),
      avgCost: parseFloat(avgCost.toFixed(6)),
    },
  };
}
