/**
 * Optimization Engine
 *
 * Analyzes rewards, metrics, and insights to generate optimization suggestions.
 * Considers agent performance, latency, resource usage, and global risks.
 */

import { getRecentRewards, getAverageReward, getRewardTrend } from './rewardEngine';
import { getMetrics, getAverageMetric } from '@/lib/intelligence/intelligenceTelemetry';
import { listGlobalInsights } from '@/lib/intelligence/globalInsightHub';

export interface OptimizationSuggestion {
  id: string;
  createdAt: string;
  agent: string;
  area: 'reward' | 'performance' | 'risk_response' | 'efficiency';
  suggestion: string;
  expectedImpact: 'low' | 'medium' | 'high';
  confidence: number; // 0–1
  requiresFounderApproval: boolean;
  actionItems?: string[];
}

/**
 * Generate optimization suggestions based on all available data
 */
export function generateOptimizationSuggestions(): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const agents = ['email', 'research', 'content', 'scheduling', 'analysis', 'coordination'];
  const insights = listGlobalInsights({ limit: 50 });

  // ========== AGENT-LEVEL OPTIMIZATION ==========
  for (const agent of agents) {
    const avgReward = getAverageReward(agent);
    const trend = getRewardTrend(agent, 60);
    const latency = getAverageMetric(agent, 'latency_ms', 60);
    const errorRate = getAverageMetric(agent, 'error_rate', 60);

    // Low reward detection
    if (avgReward < 0.4) {
      suggestions.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        agent,
        area: 'reward',
        suggestion: `Reward signal low (${(avgReward * 100).toFixed(1)}%). Consider parameter tuning or prompt optimization.`,
        expectedImpact: 'high',
        confidence: 0.85,
        requiresFounderApproval: false,
        actionItems: [
          'Review recent failures and error logs',
          'Adjust prompt templates or thresholds',
          'Increase context window or batch size',
        ],
      });
    }

    // Declining reward trend
    if (trend && trend.trend === 'declining') {
      suggestions.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        agent,
        area: 'reward',
        suggestion: `Reward declining: ${trend.recent.toFixed(2)} vs ${trend.historical.toFixed(2)}. Investigate regression.`,
        expectedImpact: 'high',
        confidence: 0.9,
        requiresFounderApproval: true,
        actionItems: ['Review recent changes', 'Compare with historical patterns', 'Check for data quality issues'],
      });
    }

    // High latency detection
    if (latency && latency > 1200) {
      suggestions.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        agent,
        area: 'performance',
        suggestion: `Latency high (${latency.toFixed(0)}ms). Reduce concurrency, batch size, or enable caching.`,
        expectedImpact: 'medium',
        confidence: 0.8,
        requiresFounderApproval: false,
        actionItems: [
          'Reduce parallel workflows',
          'Implement request batching',
          'Enable/increase cache TTL',
        ],
      });
    }

    // High error rate
    if (errorRate && errorRate > 0.05) {
      suggestions.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        agent,
        area: 'reward',
        suggestion: `Error rate elevated (${(errorRate * 100).toFixed(1)}%). Review error logs and retry logic.`,
        expectedImpact: 'high',
        confidence: 0.9,
        requiresFounderApproval: false,
        actionItems: ['Review recent error logs', 'Increase retry budget', 'Add fallback paths'],
      });
    }
  }

  // ========== GLOBAL RISK RESPONSE ==========
  const criticalInsights = insights.filter(i => i.severity === 'critical');
  for (const ci of criticalInsights.slice(0, 3)) {
    // Limit to top 3
    suggestions.push({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      agent: 'coordination',
      area: 'risk_response',
      suggestion: `CRITICAL: ${ci.summary} (theme: ${ci.theme}). Synthesise emergency workflow.`,
      expectedImpact: 'high',
      confidence: ci.confidence,
      requiresFounderApproval: true,
      actionItems: ci.actionItems ?? ['Founder review required', 'Deploy targeted response'],
    });
  }

  // ========== COORDINATION OPTIMIZATION ==========
  const avgCoordReward = getAverageReward('coordination');
  if (avgCoordReward < 0.5) {
    suggestions.push({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      agent: 'coordination',
      area: 'efficiency',
      suggestion: 'Coordination reward low. Review task dependencies and critical path analysis.',
      expectedImpact: 'medium',
      confidence: 0.75,
      requiresFounderApproval: false,
      actionItems: [
        'Analyse bottleneck tasks',
        'Increase parallelization',
        'Optimize task sequencing',
      ],
    });
  }

  return suggestions;
}

/**
 * Score an agent's overall optimization potential
 */
export function getOptimizationPotential(agent: string): number {
  const reward = getAverageReward(agent);
  const latency = getAverageMetric(agent, 'latency_ms', 60) ?? 500;
  const errorRate = getAverageMetric(agent, 'error_rate', 60) ?? 0;

  // Potential = how much improvement is possible
  // Low reward = high potential (can improve a lot)
  // High latency = high potential
  // High errors = high potential

  const rewardPotential = 1 - reward; // 1 means 100% improvement possible
  const latencyPotential = Math.min(1, latency / 2000); // Normalize by 2s threshold
  const errorPotential = errorRate; // Raw error rate

  return (rewardPotential + latencyPotential + errorPotential) / 3;
}

/**
 * Rank agents by optimization potential
 */
export function rankAgentsByPotential(): Array<{ agent: string; potential: number }> {
  const agents = ['email', 'research', 'content', 'scheduling', 'analysis', 'coordination'];
  return agents
    .map(agent => ({
      agent,
      potential: getOptimizationPotential(agent),
    }))
    .sort((a, b) => b.potential - a.potential);
}
