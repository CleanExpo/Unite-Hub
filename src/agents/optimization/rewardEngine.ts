/**
 * Reward Engine
 *
 * Tracks and normalizes rewards across all agent dimensions.
 * Converts raw metrics into normalized reward signals (0–1) for learning.
 */

export type RewardDimension =
  | 'email_performance'
  | 'research_quality'
  | 'content_effectiveness'
  | 'scheduling_efficiency'
  | 'analysis_accuracy'
  | 'coordination_success';

export interface AgentRewardEvent {
  id: string;
  agent: string;
  dimension: RewardDimension;
  value: number; // Raw metric value
  reward: number; // Normalized 0–1
  context?: Record<string, any>;
  createdAt: string;
}

// In-memory reward buffer (would persist to database in production)
let rewardBuffer: AgentRewardEvent[] = [];

/**
 * Record a reward event
 */
export function recordReward(
  input: Omit<AgentRewardEvent, 'id' | 'createdAt' | 'reward'> & {
    maxExpected?: number;
  }
): AgentRewardEvent {
  // Normalize raw value to 0–1 range
  const max = input.maxExpected ?? 100;
  const normalized = Math.max(0, Math.min(1, input.value / max));

  const event: AgentRewardEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reward: normalized,
    ...input,
  };

  rewardBuffer.push(event);
  return event;
}

/**
 * Get recent rewards with optional filtering
 */
export function getRecentRewards(agent?: string, dimension?: RewardDimension, limit = 100): AgentRewardEvent[] {
  let items = rewardBuffer;

  if (agent) items = items.filter(r => r.agent === agent);
  if (dimension) items = items.filter(r => r.dimension === dimension);

  return items.slice(-limit).reverse();
}

/**
 * Get average reward for an agent
 */
export function getAverageReward(agent: string): number {
  const items = rewardBuffer.filter(r => r.agent === agent);
  if (!items.length) return 0;
  return items.reduce((sum, r) => sum + r.reward, 0) / items.length;
}

/**
 * Get average reward by dimension
 */
export function getRewardByDimension(dimension: RewardDimension): number {
  const items = rewardBuffer.filter(r => r.dimension === dimension);
  if (!items.length) return 0;
  return items.reduce((sum, r) => sum + r.reward, 0) / items.length;
}

/**
 * Get reward trend (comparing time windows)
 */
export function getRewardTrend(agent: string, windowMinutes = 60): { recent: number; historical: number; trend: string } | null {
  const now = new Date();
  const recentSince = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const historicalSince = new Date(recentSince.getTime() - windowMinutes * 60 * 1000);

  const recent = rewardBuffer.filter(
    r =>
      r.agent === agent &&
      new Date(r.createdAt).getTime() >= recentSince.getTime()
  );

  const historical = rewardBuffer.filter(
    r =>
      r.agent === agent &&
      new Date(r.createdAt).getTime() >= historicalSince.getTime() &&
      new Date(r.createdAt).getTime() < recentSince.getTime()
  );

  if (!recent.length || !historical.length) return null;

  const recentAvg = recent.reduce((sum, r) => sum + r.reward, 0) / recent.length;
  const historicalAvg = historical.reduce((sum, r) => sum + r.reward, 0) / historical.length;

  const change = historicalAvg !== 0 ? ((recentAvg - historicalAvg) / historicalAvg) * 100 : 0;

  return {
    recent: recentAvg,
    historical: historicalAvg,
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
  };
}

/**
 * Get reward statistics
 */
export function getRewardStats() {
  const agents = Array.from(new Set(rewardBuffer.map(r => r.agent)));
  const dimensions = Array.from(new Set(rewardBuffer.map(r => r.dimension)));

  return {
    totalRewardEvents: rewardBuffer.length,
    uniqueAgents: agents.length,
    uniqueDimensions: dimensions.length,
    byAgent: agents.reduce((acc, agent) => {
      acc[agent] = getAverageReward(agent);
      return acc;
    }, {} as Record<string, number>),
    byDimension: dimensions.reduce((acc, dim) => {
      acc[dim] = getRewardByDimension(dim);
      return acc;
    }, {} as Record<string, number>),
    overallAverage: rewardBuffer.length > 0 ? rewardBuffer.reduce((sum, r) => sum + r.reward, 0) / rewardBuffer.length : 0,
  };
}

/**
 * Clear reward buffer (for testing)
 */
export function clearRewardBuffer(): void {
  rewardBuffer = [];
}
