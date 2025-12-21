/**
 * M1 Intelligent Task Router
 *
 * Routes tasks to optimal agents and models based on requirements,
 * cost constraints, latency preferences, and historical performance
 *
 * Version: v1.0.0
 * Phase: 20 - OpenAI Agents SDK Integration
 */

import { v4 as generateUUID } from 'uuid';

export type RoutingStrategy = 'cost_optimized' | 'speed_optimized' | 'quality_optimized' | 'balanced';
export type TaskType = 'generation' | 'analysis' | 'reasoning' | 'coding' | 'research' | 'creative' | 'simple_query';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Task routing request
 */
export interface RoutingRequest {
  taskId: string;
  taskType: TaskType;
  goal: string;
  priority: Priority;
  strategy: RoutingStrategy;
  constraints?: {
    maxCost?: number;
    maxLatency?: number;
    minQuality?: number; // 0-1
    requiresReasoning?: boolean;
  };
  context?: Record<string, unknown>;
}

/**
 * Routing decision
 */
export interface RoutingDecision {
  taskId: string;
  selectedAgent: string;
  selectedModel: string;
  reasoning: string;
  estimatedCost: number;
  estimatedLatency: number;
  alternativeRoutes: AlternativeRoute[];
  timestamp: number;
}

/**
 * Alternative routing option
 */
export interface AlternativeRoute {
  agent: string;
  model: string;
  estimatedCost: number;
  estimatedLatency: number;
  qualityScore: number;
}

/**
 * Agent capability profile
 */
export interface AgentProfile {
  agentId: string;
  model: string;
  capabilities: Set<TaskType>;
  costPerMTok: number;
  averageLatency: number; // milliseconds
  qualityScore: number; // 0-1
  throughput: number; // tasks per second
  successRate: number; // 0-1
  lastUpdated: number;
}

/**
 * Routing policy
 */
export interface RoutingPolicy {
  name: string;
  taskType: TaskType;
  preferredAgent: string;
  fallbackAgents: string[];
  maxCost?: number;
  maxLatency?: number;
  minQuality?: number;
}

/**
 * Intelligent Task Router
 */
export class IntelligentTaskRouter {
  private agentProfiles: Map<string, AgentProfile> = new Map();
  private routingPolicies: Map<string, RoutingPolicy> = new Map();
  private routingHistory: RoutingDecision[] = [];
  private performanceMetrics: Map<string, unknown> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default agent profiles
   */
  private initializeDefaultProfiles(): void {
    // GPT-4o mini - Ultra fast, cheap
    this.registerAgentProfile({
      agentId: 'gpt-4o-mini-agent',
      model: 'gpt-4o-mini',
      capabilities: new Set(['simple_query', 'generation', 'coding']),
      costPerMTok: 0.075,
      averageLatency: 150,
      qualityScore: 0.75,
      throughput: 100,
      successRate: 0.92,
      lastUpdated: Date.now(),
    });

    // GPT-4o - Balanced
    this.registerAgentProfile({
      agentId: 'gpt-4o-agent',
      model: 'gpt-4o',
      capabilities: new Set(['generation', 'analysis', 'coding', 'reasoning']),
      costPerMTok: 5,
      averageLatency: 800,
      qualityScore: 0.88,
      throughput: 50,
      successRate: 0.96,
      lastUpdated: Date.now(),
    });

    // Claude Sonnet - Research specialist
    this.registerAgentProfile({
      agentId: 'claude-sonnet-agent',
      model: 'claude-sonnet',
      capabilities: new Set(['analysis', 'reasoning', 'research', 'creative']),
      costPerMTok: 3,
      averageLatency: 1200,
      qualityScore: 0.92,
      throughput: 30,
      successRate: 0.98,
      lastUpdated: Date.now(),
    });

    // Claude Opus - Expert researcher
    this.registerAgentProfile({
      agentId: 'claude-opus-agent',
      model: 'claude-opus',
      capabilities: new Set(['analysis', 'reasoning', 'research', 'creative']),
      costPerMTok: 15,
      averageLatency: 2000,
      qualityScore: 0.97,
      throughput: 10,
      successRate: 0.99,
      lastUpdated: Date.now(),
    });

    // Claude Haiku - Speed optimized
    this.registerAgentProfile({
      agentId: 'claude-haiku-agent',
      model: 'claude-haiku',
      capabilities: new Set(['simple_query', 'generation']),
      costPerMTok: 0.8,
      averageLatency: 100,
      qualityScore: 0.7,
      throughput: 200,
      successRate: 0.90,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Initialize default routing policies
   */
  private initializeDefaultPolicies(): void {
    this.registerRoutingPolicy({
      name: 'simple_query_policy',
      taskType: 'simple_query',
      preferredAgent: 'claude-haiku-agent',
      fallbackAgents: ['gpt-4o-mini-agent', 'gpt-4o-agent'],
      maxCost: 0.01,
      maxLatency: 500,
    });

    this.registerRoutingPolicy({
      name: 'generation_policy',
      taskType: 'generation',
      preferredAgent: 'gpt-4o-agent',
      fallbackAgents: ['gpt-4o-mini-agent', 'claude-sonnet-agent'],
      maxLatency: 5000,
    });

    this.registerRoutingPolicy({
      name: 'analysis_policy',
      taskType: 'analysis',
      preferredAgent: 'claude-sonnet-agent',
      fallbackAgents: ['claude-opus-agent', 'gpt-4o-agent'],
      minQuality: 0.85,
    });

    this.registerRoutingPolicy({
      name: 'research_policy',
      taskType: 'research',
      preferredAgent: 'claude-opus-agent',
      fallbackAgents: ['claude-sonnet-agent'],
      minQuality: 0.9,
    });

    this.registerRoutingPolicy({
      name: 'coding_policy',
      taskType: 'coding',
      preferredAgent: 'gpt-4o-agent',
      fallbackAgents: ['claude-sonnet-agent', 'gpt-4o-mini-agent'],
      minQuality: 0.8,
    });
  }

  /**
   * Register agent profile
   */
  registerAgentProfile(profile: AgentProfile): void {
    this.agentProfiles.set(profile.agentId, profile);
  }

  /**
   * Register routing policy
   */
  registerRoutingPolicy(policy: RoutingPolicy): void {
    this.routingPolicies.set(policy.name, policy);
  }

  /**
   * Route a task to optimal agent
   */
  routeTask(request: RoutingRequest): RoutingDecision {
    const decision: RoutingDecision = {
      taskId: request.taskId,
      selectedAgent: '',
      selectedModel: '',
      reasoning: '',
      estimatedCost: 0,
      estimatedLatency: 0,
      alternativeRoutes: [],
      timestamp: Date.now(),
    };

    // Get policy for task type
    const policyKey = `${request.taskType}_policy`;
    const policy = this.routingPolicies.get(policyKey);

    // Get candidate agents based on policy or task type
    const candidates = this.getCandidateAgents(request.taskType, policy);

    if (candidates.length === 0) {
      throw new Error(`No agents available for task type: ${request.taskType}`);
    }

    // Score and rank candidates based on strategy
    const scoredCandidates = this.scoreAndRank(candidates, request);

    // Select best candidate
    const selected = scoredCandidates[0];

    if (!selected) {
      throw new Error('No suitable agent found after scoring');
    }

    decision.selectedAgent = selected.agentId;
    decision.selectedModel = selected.model;
    decision.estimatedCost = this.estimateCost(selected, request);
    decision.estimatedLatency = this.estimateLatency(selected, request);

    // Generate reasoning
    decision.reasoning = this.generateReasoning(request, selected, decision);

    // Generate alternative routes
    decision.alternativeRoutes = scoredCandidates.slice(1, 4).map((candidate) => ({
      agent: candidate.agentId,
      model: candidate.model,
      estimatedCost: this.estimateCost(candidate, request),
      estimatedLatency: this.estimateLatency(candidate, request),
      qualityScore: candidate.qualityScore,
    }));

    // Record routing decision
    this.routingHistory.push(decision);

    return decision;
  }

  /**
   * Get candidate agents for task type
   */
  private getCandidateAgents(taskType: TaskType, policy?: RoutingPolicy): AgentProfile[] {
    const candidates: AgentProfile[] = [];

    if (policy) {
      // Use preferred agent from policy
      const preferred = this.agentProfiles.get(policy.preferredAgent);
      if (preferred) {
        candidates.push(preferred);
      }

      // Add fallback agents
      for (const agentId of policy.fallbackAgents) {
        const agent = this.agentProfiles.get(agentId);
        if (agent) {
          candidates.push(agent);
        }
      }
    } else {
      // Find all agents capable of task type
      for (const profile of this.agentProfiles.values()) {
        if (profile.capabilities.has(taskType)) {
          candidates.push(profile);
        }
      }
    }

    return candidates;
  }

  /**
   * Score and rank candidates based on routing strategy
   */
  private scoreAndRank(candidates: AgentProfile[], request: RoutingRequest): AgentProfile[] {
    const scored = candidates.map((candidate) => ({
      ...candidate,
      score: this.calculateScore(candidate, request),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored as AgentProfile[];
  }

  /**
   * Calculate routing score based on strategy
   */
  private calculateScore(candidate: AgentProfile, request: RoutingRequest): number {
    let score = 0;

    switch (request.strategy) {
      case 'cost_optimized':
        // Lower cost is better (inverted score)
        score = (1 - candidate.costPerMTok / 20) * 100; // Normalize to 0-100
        break;

      case 'speed_optimized':
        // Lower latency is better (inverted score)
        score = (1 - candidate.averageLatency / 5000) * 100;
        break;

      case 'quality_optimized':
        // Higher quality score is better
        score = candidate.qualityScore * 100;
        break;

      case 'balanced':
        // Weighted combination
        score = candidate.qualityScore * 40 + (1 - candidate.averageLatency / 5000) * 30 + (1 - candidate.costPerMTok / 20) * 30;
        break;
    }

    // Apply constraints
    if (request.constraints?.maxCost && this.estimateCost(candidate, request) > request.constraints.maxCost) {
      score -= 50; // Penalize cost violations
    }

    if (request.constraints?.maxLatency && candidate.averageLatency > request.constraints.maxLatency) {
      score -= 30; // Penalize latency violations
    }

    if (request.constraints?.minQuality && candidate.qualityScore < request.constraints.minQuality) {
      score -= 40; // Penalize quality violations
    }

    if (request.constraints?.requiresReasoning && !['claude-opus-agent', 'claude-sonnet-agent'].includes(candidate.agentId)) {
      score -= 20; // Penalize reasoning-incapable agents
    }

    return score;
  }

  /**
   * Estimate cost for a task
   */
  private estimateCost(candidate: AgentProfile, request: RoutingRequest): number {
    const estimatedTokens = request.goal.length / 4; // rough estimate
    return (estimatedTokens / 1000) * candidate.costPerMTok;
  }

  /**
   * Estimate latency for a task
   */
  private estimateLatency(candidate: AgentProfile, request: RoutingRequest): number {
    // Base latency + variable based on goal length
    const lengthFactor = request.goal.length / 100;
    return candidate.averageLatency + lengthFactor * 50;
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateReasoning(request: RoutingRequest, selected: AgentProfile, decision: RoutingDecision): string {
    const reasons: string[] = [];

    switch (request.strategy) {
      case 'cost_optimized':
        reasons.push(`Selected ${selected.agentId} for optimal cost efficiency (${decision.estimatedCost.toFixed(4)})`);
        break;

      case 'speed_optimized':
        reasons.push(`Selected ${selected.agentId} for minimal latency (${decision.estimatedLatency.toFixed(0)}ms)`);
        break;

      case 'quality_optimized':
        reasons.push(`Selected ${selected.agentId} for best quality (${(selected.qualityScore * 100).toFixed(1)}%)`);
        break;

      case 'balanced':
        reasons.push(`Selected ${selected.agentId} for balanced performance`);
        reasons.push(`Quality: ${(selected.qualityScore * 100).toFixed(1)}%, Latency: ${decision.estimatedLatency.toFixed(0)}ms, Cost: $${decision.estimatedCost.toFixed(4)}`);
        break;
    }

    if (request.priority === 'urgent') {
      reasons.push('Priority adjusted for urgent execution');
    }

    return reasons.join('. ');
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics(): Record<string, unknown> {
    const agentUsageCount: Record<string, number> = {};
    const strategyUsageCount: Record<RoutingStrategy, number> = {
      cost_optimized: 0,
      speed_optimized: 0,
      quality_optimized: 0,
      balanced: 0,
    };

    for (const decision of this.routingHistory) {
      agentUsageCount[decision.selectedAgent] = (agentUsageCount[decision.selectedAgent] || 0) + 1;
    }

    const avgCost = this.routingHistory.length > 0 ? this.routingHistory.reduce((sum, d) => sum + d.estimatedCost, 0) / this.routingHistory.length : 0;

    const avgLatency = this.routingHistory.length > 0 ? this.routingHistory.reduce((sum, d) => sum + d.estimatedLatency, 0) / this.routingHistory.length : 0;

    return {
      totalRoutingDecisions: this.routingHistory.length,
      agentUsageDistribution: agentUsageCount,
      averageEstimatedCost: avgCost,
      averageEstimatedLatency: avgLatency,
      availableAgents: this.agentProfiles.size,
      registeredPolicies: this.routingPolicies.size,
    };
  }

  /**
   * Update agent profile performance metrics
   */
  updateAgentPerformance(agentId: string, metrics: { latency: number; success: boolean; cost: number }): void {
    const profile = this.agentProfiles.get(agentId);

    if (!profile) {
      return;
    }

    // Update with exponential moving average
    const alpha = 0.3; // smoothing factor
    profile.averageLatency = alpha * metrics.latency + (1 - alpha) * profile.averageLatency;
    profile.lastUpdated = Date.now();

    // Update success rate
    const successAlpha = 0.1;
    profile.successRate = metrics.success ? Math.min(1, profile.successRate + successAlpha * (1 - profile.successRate)) : Math.max(0, profile.successRate - successAlpha);
  }

  /**
   * Get routing history
   */
  getRoutingHistory(limit?: number): RoutingDecision[] {
    if (limit) {
      return this.routingHistory.slice(-limit);
    }
    return this.routingHistory;
  }

  /**
   * Shutdown router
   */
  shutdown(): void {
    this.agentProfiles.clear();
    this.routingPolicies.clear();
    this.routingHistory = [];
    this.performanceMetrics.clear();
  }
}

// Export singleton
export const intelligentTaskRouter = new IntelligentTaskRouter();
