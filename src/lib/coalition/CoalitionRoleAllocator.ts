/**
 * Coalition Role Allocator
 *
 * Assigns roles (leader, planner, executor, validator) to coalition members
 * based on capabilities, success patterns, and conflict resolution.
 */

import { memoryStore } from '@/lib/memory';

export type CoalitionRole = 'leader' | 'planner' | 'executor' | 'validator';

export interface RoleAssignment {
  agentId: string;
  primaryRole: CoalitionRole;
  secondaryRoles: CoalitionRole[];
  capabilityMatch: number;
  successRate: number;
  conflictsWith?: string[];
  fallbackAgents?: string[];
}

export interface RoleAllocationResult {
  coalitionId: string;
  assignments: RoleAssignment[];
  conflictsDetected: number;
  conflictResolutions: ConflictResolution[];
  allocationScore: number;
  timestamp: string;
}

export interface ConflictResolution {
  conflictType: string;
  agents: string[];
  resolution: string;
  arbitrationUsed: boolean;
}

interface AgentProfile {
  agentId: string;
  capabilities: string[];
  successRate: number;
  leadershipScore: number;
  planningScore: number;
  executionScore: number;
  validationScore: number;
  pastRolePerformance: Record<CoalitionRole, number[]>;
}

/**
 * Coalition Role Allocator
 */
export class CoalitionRoleAllocator {
  private minCapabilityMatchForRole = 60; // Minimum % to qualify for a role

  /**
   * Allocate roles to coalition members
   */
  async allocateRoles(
    coalitionId: string,
    agentProfiles: AgentProfile[]
  ): Promise<RoleAllocationResult> {
    const assignments: RoleAssignment[] = [];
    const conflictResolutions: ConflictResolution[] = [];
    let conflictCount = 0;

    // Phase 1: Identify role candidates
    const rolePreferences = this.identifyRolePreferences(agentProfiles);

    // Phase 2: Assign primary roles with conflict detection
    for (const role of ['leader', 'planner', 'executor', 'validator'] as const) {
      const candidates = rolePreferences[role];

      if (candidates.length === 0) {
        console.warn(`No qualified candidates for role: ${role}`);
        continue;
      }

      // Assign top candidate
      const assigned = candidates[0];

      // Check for conflicts with already assigned agents
      const conflicts = this.detectRoleConflicts(assigned, assignments);

      if (conflicts.length > 0) {
        conflictCount++;

        // Resolve conflicts
        const resolution = await this.resolveRoleConflict(assigned, conflicts, rolePreferences);
        if (resolution) {
          conflictResolutions.push(resolution);
        }
      }

      // Add assignment
      assignments.push({
        agentId: assigned.agentId,
        primaryRole: role,
        secondaryRoles: this.identifySecondaryRoles(assigned, role, rolePreferences),
        capabilityMatch: assigned.capabilityMatch,
        successRate: assigned.successRate,
        conflictsWith: conflicts.map((c) => c.agentId),
        fallbackAgents: this.identifyFallbackAgents(role, assigned, rolePreferences),
      });
    }

    // Phase 3: Calculate allocation score
    const allocationScore = this.calculateAllocationScore(assignments, conflictCount);

    const result: RoleAllocationResult = {
      coalitionId,
      assignments,
      conflictsDetected: conflictCount,
      conflictResolutions,
      allocationScore,
      timestamp: new Date().toISOString(),
    };

    // Archive to memory
    await this.archiveRoleAllocation(result);

    return result;
  }

  /**
   * Identify best agents for each role
   */
  private identifyRolePreferences(
    agentProfiles: AgentProfile[]
  ): Record<CoalitionRole, Array<AgentProfile & { capabilityMatch: number; successRate: number }>> {
    const roleScores: Record<CoalitionRole, any[]> = {
      leader: [],
      planner: [],
      executor: [],
      validator: [],
    };

    for (const agent of agentProfiles) {
      // Leader: highest overall success + leadership score
      const leaderScore = agent.leadershipScore * 0.5 + agent.successRate * 0.5;
      if (leaderScore >= this.minCapabilityMatchForRole) {
        roleScores.leader.push({
          ...agent,
          score: leaderScore,
          capabilityMatch: leaderScore,
          successRate: agent.successRate,
        });
      }

      // Planner: planning score + task breakdown capability
      const plannerScore = agent.planningScore * 0.6 + agent.successRate * 0.4;
      if (plannerScore >= this.minCapabilityMatchForRole) {
        roleScores.planner.push({
          ...agent,
          score: plannerScore,
          capabilityMatch: plannerScore,
          successRate: agent.successRate,
        });
      }

      // Executor: execution score + availability
      const executorScore = agent.executionScore * 0.6 + agent.successRate * 0.4;
      if (executorScore >= this.minCapabilityMatchForRole) {
        roleScores.executor.push({
          ...agent,
          score: executorScore,
          capabilityMatch: executorScore,
          successRate: agent.successRate,
        });
      }

      // Validator: validation score + success rate (critical role)
      const validatorScore = agent.validationScore * 0.5 + agent.successRate * 0.5;
      if (validatorScore >= this.minCapabilityMatchForRole) {
        roleScores.validator.push({
          ...agent,
          score: validatorScore,
          capabilityMatch: validatorScore,
          successRate: agent.successRate,
        });
      }
    }

    // Sort by score
    for (const role in roleScores) {
      roleScores[role as CoalitionRole].sort((a, b) => b.score - a.score);
    }

    return roleScores as any;
  }

  /**
   * Detect role conflicts between agents
   */
  private detectRoleConflicts(candidate: AgentProfile, assignments: RoleAssignment[]): RoleAssignment[] {
    const conflicts: RoleAssignment[] = [];

    // Same agent can't have two primary roles
    if (assignments.some((a) => a.agentId === candidate.agentId)) {
      const existing = assignments.find((a) => a.agentId === candidate.agentId);
      if (existing) {
        conflicts.push(existing);
      }
    }

    // Check for capability-based conflicts (rare in well-designed coalitions)
    // Example: two leaders might conflict, or leader + executor might have unclear authority

    return conflicts;
  }

  /**
   * Resolve role conflicts via fallback strategies
   */
  private async resolveRoleConflict(
    candidate: AgentProfile,
    conflicts: RoleAssignment[],
    rolePreferences: Record<CoalitionRole, any[]>
  ): Promise<ConflictResolution | null> {
    // Strategy 1: Assign to secondary role
    const availableRoles = Object.keys(rolePreferences).filter(
      (role) =>
        !conflicts.some((c) =>
          [c.primaryRole, ...c.secondaryRoles].includes(role as CoalitionRole)
        )
    ) as CoalitionRole[];

    if (availableRoles.length > 0) {
      return {
        conflictType: 'duplicate_assignment',
        agents: [candidate.agentId, ...conflicts.map((c) => c.agentId)],
        resolution: `Assigned ${candidate.agentId} to secondary role: ${availableRoles[0]}`,
        arbitrationUsed: false,
      };
    }

    // Strategy 2: Use arbitration via negotiation layer
    return {
      conflictType: 'role_unavailable',
      agents: [candidate.agentId, ...conflicts.map((c) => c.agentId)],
      resolution: 'Conflict requires arbitration - escalated to negotiation layer',
      arbitrationUsed: true,
    };
  }

  /**
   * Identify secondary roles agent can support
   */
  private identifySecondaryRoles(
    agent: AgentProfile,
    primaryRole: CoalitionRole,
    rolePreferences: Record<CoalitionRole, any[]>
  ): CoalitionRole[] {
    const secondary: CoalitionRole[] = [];
    const roleScoreMap: Record<CoalitionRole, number> = {
      leader: agent.leadershipScore,
      planner: agent.planningScore,
      executor: agent.executionScore,
      validator: agent.validationScore,
    };

    for (const [role, score] of Object.entries(roleScoreMap)) {
      if (role !== primaryRole && score >= this.minCapabilityMatchForRole * 0.8) {
        secondary.push(role as CoalitionRole);
      }
    }

    return secondary.slice(0, 2); // Max 2 secondary roles
  }

  /**
   * Identify fallback agents for a role (in case of failure)
   */
  private identifyFallbackAgents(
    role: CoalitionRole,
    assignedAgent: AgentProfile,
    rolePreferences: Record<CoalitionRole, any[]>
  ): string[] {
    const candidates = rolePreferences[role];
    const fallbacks = candidates
      .filter((c) => c.agentId !== assignedAgent.agentId)
      .slice(0, 2) // 2 fallback options
      .map((c) => c.agentId);

    return fallbacks;
  }

  /**
   * Calculate overall allocation quality score
   */
  private calculateAllocationScore(assignments: RoleAssignment[], conflictCount: number): number {
    if (assignments.length === 0) {
return 0;
}

    // Base score from capability matches
    const avgCapabilityMatch =
      assignments.reduce((sum, a) => sum + a.capabilityMatch, 0) / assignments.length;

    // Bonus for successful conflict resolution
    const conflictPenalty = Math.max(0, conflictCount * 5);

    // Bonus for diversity of success rates (no single weak link)
    const successRates = assignments.map((a) => a.successRate);
    const variance =
      successRates.length > 1
        ? successRates.reduce((sum, sr) => sum + Math.pow(sr - avgCapabilityMatch / 100, 2), 0) /
          successRates.length
        : 0;
    const diversityBonus = Math.min(variance * 10, 10);

    return Math.min(avgCapabilityMatch + diversityBonus - conflictPenalty, 100);
  }

  /**
   * Archive role allocation to memory
   */
  private async archiveRoleAllocation(result: RoleAllocationResult): Promise<void> {
    try {
      const archive = await memoryStore.retrieve('role_allocations_archive', {});

      if (!archive.allocations) {
        archive.allocations = [];
      }

      archive.allocations.push({
        coalitionId: result.coalitionId,
        assignmentCount: result.assignments.length,
        conflictsDetected: result.conflictsDetected,
        allocationScore: result.allocationScore,
        timestamp: result.timestamp,
      });

      await memoryStore.store('role_allocations_archive', archive);
    } catch (error) {
      console.error('Error archiving role allocation:', error);
    }
  }
}

export const coalitionRoleAllocator = new CoalitionRoleAllocator();
