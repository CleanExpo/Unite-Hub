/**
 * Model Reward Engine
 *
 * Tracks performance metrics and reward signals across all models.
 * Implements multi-factor scoring to guide model selection decisions.
 */

import { ModelReward } from './types';

export interface TaskMetrics {
  taskId: string;
  taskType: string;
  modelId: string;
  executionTimeMs: number;
  tokenCost: number;
  outputQuality: number; // 0-100
  userSatisfaction: number; // 0-100
  successfulCompletion: boolean;
  errorMessage?: string;
}

export interface ModelScore {
  modelId: string;
  taskType: string;
  qualityScore: number; // 0-100
  costScore: number; // 0-100 (100 = cheapest)
  latencyScore: number; // 0-100 (100 = fastest)
  reliabilityScore: number; // 0-100 (100 = always succeeds)
  overallScore: number; // weighted average
  sampleSize: number;
  lastUpdated: string;
}

export interface ModelComparison {
  taskType: string;
  topModel: { model: string; score: number };
  alternatives: { model: string; score: number }[];
  recommendation: string;
  confidence: number;
}

// In-memory reward tracking
let rewardHistory: ModelReward[] = [];
let taskMetricsLog: TaskMetrics[] = [];

/**
 * Record task execution and reward
 */
export function recordTaskExecution(metrics: TaskMetrics): ModelReward {
  taskMetricsLog.push(metrics);

  // Calculate reward scores
  const qualityScore = metrics.outputQuality;
  const costScore = Math.max(0, 100 - (metrics.tokenCost * 10)); // Higher score for lower cost
  const latencyScore = Math.max(0, 100 - (metrics.executionTimeMs / 100)); // Higher score for faster
  const reliabilityScore = metrics.successfulCompletion ? 100 : 0;

  // Weighted average (40% quality, 25% cost, 20% latency, 15% reliability)
  const overallScore =
    qualityScore * 0.4 +
    costScore * 0.25 +
    latencyScore * 0.2 +
    reliabilityScore * 0.15;

  const reward: ModelReward = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    modelId: metrics.modelId,
    taskType: metrics.taskType,
    qualityScore,
    costScore,
    latencyScore: Math.round(latencyScore),
    overallScore: Math.round(overallScore),
    metadata: {
      executionTimeMs: metrics.executionTimeMs,
      tokenCost: metrics.tokenCost,
      successfulCompletion: metrics.successfulCompletion,
      userSatisfaction: metrics.userSatisfaction,
    },
  };

  rewardHistory.push(reward);
  return reward;
}

/**
 * Get reward history for a model
 */
export function getModelRewardHistory(
  modelId: string,
  taskType?: string,
  limit = 100
): ModelReward[] {
  let history = rewardHistory.filter(r => r.modelId === modelId);

  if (taskType) {
    history = history.filter(r => r.taskType === taskType);
  }

  return history.slice(-limit);
}

/**
 * Get average score for a model across all tasks
 */
export function getModelAverageScore(modelId: string): ModelScore | null {
  const rewards = rewardHistory.filter(r => r.modelId === modelId);

  if (rewards.length === 0) return null;

  const avgQualityScore =
    rewards.reduce((sum, r) => sum + r.qualityScore, 0) / rewards.length;
  const avgCostScore = rewards.reduce((sum, r) => sum + r.costScore, 0) / rewards.length;
  const avgLatencyScore =
    rewards.reduce((sum, r) => sum + r.latencyScore, 0) / rewards.length;
  const avgReliabilityScore = rewards.reduce((sum, r) => sum + (r.metadata?.successfulCompletion ? 100 : 0), 0) / rewards.length;

  const overallScore =
    avgQualityScore * 0.4 +
    avgCostScore * 0.25 +
    avgLatencyScore * 0.2 +
    avgReliabilityScore * 0.15;

  return {
    modelId,
    taskType: 'all',
    qualityScore: Math.round(avgQualityScore),
    costScore: Math.round(avgCostScore),
    latencyScore: Math.round(avgLatencyScore),
    reliabilityScore: Math.round(avgReliabilityScore),
    overallScore: Math.round(overallScore),
    sampleSize: rewards.length,
    lastUpdated: rewards[rewards.length - 1].timestamp,
  };
}

/**
 * Get model score for a specific task type
 */
export function getModelScoreForTask(modelId: string, taskType: string): ModelScore | null {
  const rewards = rewardHistory.filter(
    r => r.modelId === modelId && r.taskType === taskType
  );

  if (rewards.length === 0) return null;

  const avgQualityScore =
    rewards.reduce((sum, r) => sum + r.qualityScore, 0) / rewards.length;
  const avgCostScore = rewards.reduce((sum, r) => sum + r.costScore, 0) / rewards.length;
  const avgLatencyScore =
    rewards.reduce((sum, r) => sum + r.latencyScore, 0) / rewards.length;
  const avgReliabilityScore = rewards.reduce((sum, r) => sum + (r.metadata?.successfulCompletion ? 100 : 0), 0) / rewards.length;

  const overallScore =
    avgQualityScore * 0.4 +
    avgCostScore * 0.25 +
    avgLatencyScore * 0.2 +
    avgReliabilityScore * 0.15;

  return {
    modelId,
    taskType,
    qualityScore: Math.round(avgQualityScore),
    costScore: Math.round(avgCostScore),
    latencyScore: Math.round(avgLatencyScore),
    reliabilityScore: Math.round(avgReliabilityScore),
    overallScore: Math.round(overallScore),
    sampleSize: rewards.length,
    lastUpdated: rewards[rewards.length - 1].timestamp,
  };
}

/**
 * Compare models for a task type
 */
export function compareModelsForTask(taskType: string): ModelComparison {
  const rewards = rewardHistory.filter(r => r.taskType === taskType);

  if (rewards.length === 0) {
    return {
      taskType,
      topModel: { model: 'none', score: 0 },
      alternatives: [],
      recommendation: 'No performance data available for this task type',
      confidence: 0,
    };
  }

  // Group by model and calculate average scores
  const modelScores: Record<string, { score: number; count: number }> = {};

  for (const reward of rewards) {
    if (!modelScores[reward.modelId]) {
      modelScores[reward.modelId] = { score: 0, count: 0 };
    }
    modelScores[reward.modelId].score += reward.overallScore;
    modelScores[reward.modelId].count++;
  }

  // Calculate averages and sort
  const sorted = Object.entries(modelScores)
    .map(([model, data]) => ({
      model,
      score: data.score / data.count,
      sampleSize: data.count,
    }))
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return {
      taskType,
      topModel: { model: 'none', score: 0 },
      alternatives: [],
      recommendation: 'No models available',
      confidence: 0,
    };
  }

  const topModel = sorted[0];
  const alternatives = sorted.slice(1, 3).map(s => ({ model: s.model, score: Math.round(s.score) }));

  // Calculate confidence based on sample size and gap to next model
  let confidence = Math.min(100, topModel.sampleSize * 10);
  if (sorted.length > 1) {
    const gap = topModel.score - sorted[1].score;
    confidence = Math.min(confidence, gap * 10);
  }

  const recommendation =
    topModel.score > 75
      ? `${topModel.model} is the clear winner for ${taskType} tasks`
      : `${topModel.model} has a slight edge for ${taskType} tasks`;

  return {
    taskType,
    topModel: { model: topModel.model, score: Math.round(topModel.score) },
    alternatives,
    recommendation,
    confidence: Math.round(confidence),
  };
}

/**
 * Get all task types with performance data
 */
export function getTaskTypesWithData(): string[] {
  const types = new Set(rewardHistory.map(r => r.taskType));
  return Array.from(types);
}

/**
 * Get models with performance data
 */
export function getModelsWithData(): string[] {
  const models = new Set(rewardHistory.map(r => r.modelId));
  return Array.from(models);
}

/**
 * Get performance ranking across all models
 */
export function getModelPerformanceRanking(): (ModelScore & { rank: number })[] {
  const models = getModelsWithData();
  const scores = models
    .map(model => getModelAverageScore(model))
    .filter((score): score is ModelScore => score !== null)
    .sort((a, b) => b.overallScore - a.overallScore);

  return scores.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
}

/**
 * Find best model for a task type
 */
export function getBestModelForTask(taskType: string): string | null {
  const comparison = compareModelsForTask(taskType);
  return comparison.topModel.model !== 'none' ? comparison.topModel.model : null;
}

/**
 * Identify model weaknesses
 */
export function identifyModelWeaknesses(modelId: string): {
  modelId: string;
  weakAreas: string[];
  strengths: string[];
} {
  const rewards = rewardHistory.filter(r => r.modelId === modelId);

  if (rewards.length === 0) {
    return {
      modelId,
      weakAreas: [],
      strengths: [],
    };
  }

  const avgQuality = rewards.reduce((sum, r) => sum + r.qualityScore, 0) / rewards.length;
  const avgCost = rewards.reduce((sum, r) => sum + r.costScore, 0) / rewards.length;
  const avgLatency = rewards.reduce((sum, r) => sum + r.latencyScore, 0) / rewards.length;

  const weakAreas: string[] = [];
  const strengths: string[] = [];

  if (avgQuality < 60) weakAreas.push('output quality');
  else if (avgQuality > 80) strengths.push('output quality');

  if (avgCost < 60) weakAreas.push('cost efficiency');
  else if (avgCost > 80) strengths.push('cost efficiency');

  if (avgLatency < 60) weakAreas.push('latency performance');
  else if (avgLatency > 80) strengths.push('latency performance');

  return {
    modelId,
    weakAreas,
    strengths,
  };
}

/**
 * Get reward statistics
 */
export function getRewardStats(): {
  totalRewards: number;
  uniqueModels: number;
  uniqueTaskTypes: number;
  averageOverallScore: number;
  bestPerformingModel: string;
  mostTestedTaskType: string;
} {
  const avgScore = rewardHistory.reduce((sum, r) => sum + r.overallScore, 0) / rewardHistory.length || 0;

  const taskTypeCounts = new Map<string, number>();
  for (const reward of rewardHistory) {
    taskTypeCounts.set(reward.taskType, (taskTypeCounts.get(reward.taskType) || 0) + 1);
  }

  const mostTestedTaskType = Array.from(taskTypeCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] || 'none';

  const ranking = getModelPerformanceRanking();

  return {
    totalRewards: rewardHistory.length,
    uniqueModels: getModelsWithData().length,
    uniqueTaskTypes: getTaskTypesWithData().length,
    averageOverallScore: Math.round(avgScore),
    bestPerformingModel: ranking[0]?.modelId || 'none',
    mostTestedTaskType,
  };
}

/**
 * Clear old reward history (retention policy)
 */
export function pruneOldRewards(daysToKeep = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffIso = cutoffDate.toISOString();

  const beforeLength = rewardHistory.length;
  rewardHistory = rewardHistory.filter(r => r.timestamp >= cutoffIso);

  return beforeLength - rewardHistory.length;
}

/**
 * Export reward data for analysis
 */
export function exportRewardData() {
  return {
    rewards: rewardHistory,
    taskMetrics: taskMetricsLog,
    summary: getRewardStats(),
  };
}
