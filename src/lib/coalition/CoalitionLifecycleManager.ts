/**
 * Coalition Lifecycle Manager
 *
 * Manages coalition lifecycle: creation, execution, monitoring, and dissolution.
 * Tracks coalition health and triggers reformation or dissolution as needed.
 */

import { memoryStore } from '@/lib/memory';

export interface CoalitionState {
  coalitionId: string;
  taskId: string;
  status: 'forming' | 'executing' | 'monitoring' | 'dissolved';
  agentIds: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  healthScore: number;
  activeMemberCount: number;
  failedMembers: string[];
}

export interface CoalitionHealthMetrics {
  coalitionId: string;
  agentHealthScores: Record<string, number>;
  overallHealth: number;
  responseTimeMs: number;
  lastHealthCheck: string;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  alertType: 'member_failure' | 'degraded_performance' | 'timeout' | 'communication_failure';
  agentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface CoalitionExecutionStats {
  coalitionId: string;
  totalDuration: number;
  checkpointsPassed: number;
  checkpointsFailed: number;
  memberContributions: Record<string, number>; // Agent contribution score
  syncCount: number;
  resyncRequired: boolean;
  outcome?: 'success' | 'partial_success' | 'failure';
}

/**
 * Coalition Lifecycle Manager
 */
export class CoalitionLifecycleManager {
  private activeCoalitions = new Map<string, CoalitionState>();
  private healthCheckInterval = 5000; // 5 seconds
  private maxHealthScore = 100;
  private minHealthThreshold = 40;
  private maxExecutionTime = 3600000; // 1 hour

  /**
   * Create new coalition
   */
  async createCoalition(
    coalitionId: string,
    taskId: string,
    agentIds: string[]
  ): Promise<CoalitionState> {
    const state: CoalitionState = {
      coalitionId,
      taskId,
      status: 'forming',
      agentIds,
      createdAt: new Date().toISOString(),
      healthScore: this.maxHealthScore,
      activeMemberCount: agentIds.length,
      failedMembers: [],
    };

    this.activeCoalitions.set(coalitionId, state);

    // Archive in memory
    await this.archiveCoalitionState(state);

    return state;
  }

  /**
   * Start coalition execution
   */
  async startExecution(coalitionId: string): Promise<CoalitionState | null> {
    const state = this.activeCoalitions.get(coalitionId);

    if (!state) {
      console.error(`Coalition not found: ${coalitionId}`);
      return null;
    }

    state.status = 'executing';
    state.startedAt = new Date().toISOString();
    this.activeCoalitions.set(coalitionId, state);

    return state;
  }

  /**
   * Monitor coalition health during execution
   */
  async monitorHealth(coalitionId: string): Promise<CoalitionHealthMetrics | null> {
    const state = this.activeCoalitions.get(coalitionId);

    if (!state || state.status === 'dissolved') {
      return null;
    }

    const healthMetrics: CoalitionHealthMetrics = {
      coalitionId,
      agentHealthScores: {},
      overallHealth: 0,
      responseTimeMs: 0,
      lastHealthCheck: new Date().toISOString(),
      alerts: [],
    };

    const startTime = Date.now();

    // Check each member
    for (const agentId of state.agentIds) {
      if (state.failedMembers.includes(agentId)) {
        healthMetrics.agentHealthScores[agentId] = 0;
        continue;
      }

      // Simulate health check (in production: actual agent health status)
      const agentHealth = Math.random() * this.maxHealthScore;
      healthMetrics.agentHealthScores[agentId] = agentHealth;

      if (agentHealth < 50) {
        healthMetrics.alerts.push({
          alertType: 'degraded_performance',
          agentId,
          severity: 'medium',
          message: `Agent ${agentId} showing degraded performance (health: ${agentHealth.toFixed(0)})`,
          timestamp: new Date().toISOString(),
        });
      } else if (agentHealth < 20) {
        healthMetrics.alerts.push({
          alertType: 'member_failure',
          agentId,
          severity: 'critical',
          message: `Agent ${agentId} at critical health level`,
          timestamp: new Date().toISOString(),
        });

        // Mark as failed
        if (!state.failedMembers.includes(agentId)) {
          state.failedMembers.push(agentId);
        }
      }
    }

    // Calculate overall health
    const activeMembers = state.agentIds.filter((a) => !state.failedMembers.includes(a));
    if (activeMembers.length === 0) {
      healthMetrics.overallHealth = 0;
    } else {
      const totalHealth = activeMembers.reduce((sum, a) => sum + (healthMetrics.agentHealthScores[a] || 0), 0);
      healthMetrics.overallHealth = totalHealth / activeMembers.length;
    }

    healthMetrics.responseTimeMs = Date.now() - startTime;

    // Update state
    state.healthScore = healthMetrics.overallHealth;
    state.activeMemberCount = activeMembers.length;

    // Check if coalition should be dissolved
    if (healthMetrics.overallHealth < this.minHealthThreshold) {
      healthMetrics.alerts.push({
        alertType: 'timeout',
        agentId: 'coalition',
        severity: 'high',
        message: `Coalition health below threshold (${healthMetrics.overallHealth.toFixed(0)}%), consider dissolution`,
        timestamp: new Date().toISOString(),
      });
    }

    this.activeCoalitions.set(coalitionId, state);

    return healthMetrics;
  }

  /**
   * Complete coalition execution with outcome
   */
  async completeExecution(
    coalitionId: string,
    outcome: 'success' | 'partial_success' | 'failure'
  ): Promise<CoalitionExecutionStats | null> {
    const state = this.activeCoalitions.get(coalitionId);

    if (!state) {
      return null;
    }

    state.status = 'dissolved';
    state.completedAt = new Date().toISOString();

    const executionDuration = state.startedAt
      ? new Date(state.completedAt).getTime() - new Date(state.startedAt).getTime()
      : 0;

    const stats: CoalitionExecutionStats = {
      coalitionId,
      totalDuration: executionDuration,
      checkpointsPassed: Math.floor(Math.random() * 10) + 5, // Simulated
      checkpointsFailed: Math.floor(Math.random() * 3),
      memberContributions: this.calculateMemberContributions(state),
      syncCount: Math.floor(executionDuration / 10000), // ~10s per sync
      resyncRequired: state.failedMembers.length > 0,
      outcome,
    };

    // Archive final state
    await this.archiveCoalitionExecution(state, stats);

    // Clean up
    this.activeCoalitions.delete(coalitionId);

    return stats;
  }

  /**
   * Get current coalition state
   */
  getCoalitionState(coalitionId: string): CoalitionState | null {
    return this.activeCoalitions.get(coalitionId) || null;
  }

  /**
   * List all active coalitions
   */
  getActiveCoalitions(): CoalitionState[] {
    return Array.from(this.activeCoalitions.values()).filter((c) => c.status !== 'dissolved');
  }

  /**
   * Dissolve coalition immediately
   */
  async dissolveCoalition(coalitionId: string, reason: string): Promise<void> {
    const state = this.activeCoalitions.get(coalitionId);

    if (!state) return;

    state.status = 'dissolved';
    state.completedAt = new Date().toISOString();

    // Archive dissolution
    await memoryStore.retrieve('coalition_dissolutions', {}).then(async (archive) => {
      if (!archive.dissolutions) {
        archive.dissolutions = [];
      }

      archive.dissolutions.push({
        coalitionId,
        agentIds: state.agentIds,
        reason,
        failedMembers: state.failedMembers,
        timestamp: state.completedAt,
      });

      await memoryStore.store('coalition_dissolutions', archive);
    });

    this.activeCoalitions.delete(coalitionId);
  }

  /**
   * Calculate member contributions to coalition outcome
   */
  private calculateMemberContributions(state: CoalitionState): Record<string, number> {
    const contributions: Record<string, number> = {};

    for (const agentId of state.agentIds) {
      if (state.failedMembers.includes(agentId)) {
        contributions[agentId] = 0;
      } else {
        // Simulate contribution score (0-100)
        contributions[agentId] = Math.random() * 100;
      }
    }

    return contributions;
  }

  /**
   * Archive coalition state to memory
   */
  private async archiveCoalitionState(state: CoalitionState): Promise<void> {
    try {
      const archive = await memoryStore.retrieve('coalition_states', {});

      if (!archive.states) {
        archive.states = [];
      }

      archive.states.push({
        coalitionId: state.coalitionId,
        taskId: state.taskId,
        agentIds: state.agentIds,
        status: state.status,
        createdAt: state.createdAt,
      });

      await memoryStore.store('coalition_states', archive);
    } catch (error) {
      console.error('Error archiving coalition state:', error);
    }
  }

  /**
   * Archive coalition execution results to memory
   */
  private async archiveCoalitionExecution(
    state: CoalitionState,
    stats: CoalitionExecutionStats
  ): Promise<void> {
    try {
      const archive = await memoryStore.retrieve('coalition_executions', {});

      if (!archive.executions) {
        archive.executions = [];
      }

      archive.executions.push({
        coalitionId: state.coalitionId,
        taskId: state.taskId,
        agentIds: state.agentIds,
        totalDuration: stats.totalDuration,
        outcome: stats.outcome,
        memberContributions: stats.memberContributions,
        completedAt: state.completedAt,
      });

      await memoryStore.store('coalition_executions', archive);
    } catch (error) {
      console.error('Error archiving coalition execution:', error);
    }
  }

  /**
   * Get lifecycle manager status
   */
  getStatus(): Record<string, any> {
    return {
      activeCoalitions: this.activeCoalitions.size,
      healthCheckInterval: this.healthCheckInterval,
      minHealthThreshold: this.minHealthThreshold,
      maxExecutionTime: this.maxExecutionTime,
      timestamp: new Date().toISOString(),
    };
  }
}

export const coalitionLifecycleManager = new CoalitionLifecycleManager();
