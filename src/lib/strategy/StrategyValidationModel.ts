import { memoryStore } from '@/lib/memory';
import { StrategyHierarchy, StrategyItem } from './StrategyHierarchyEngine';

export interface ValidationRule {
  name: string;
  description: string;
  validate: (hierarchy: StrategyHierarchy) => ValidationResult;
}

export interface ValidationResult {
  ruleName: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  affectedItems?: string[];
  suggestedFix?: string;
}

export interface MultiAgentValidationResult {
  strategyId: string;
  validationTimestamp: Date;
  overallStatus: 'approved' | 'needs_revision' | 'rejected';
  validationScore: number; // 0-100
  agentValidations: AgentValidation[];
  consensusLevel: number; // 0-100: how much agreement between agents?
  conflictingViews: string[];
  recommendations: string[];
}

export interface AgentValidation {
  agentId: string;
  validationScore: number; // 0-100, agent's confidence in strategy
  riskAssessment: number; // 0-100, agent's perceived risk
  concerns: string[];
  supportingPoints: string[];
  recommendation: 'approve' | 'needs_revision' | 'reject';
  reasoning: string;
}

export interface StrategyConflict {
  type: 'contradiction' | 'circular_dependency' | 'resource_conflict' | 'timing_conflict' | 'capability_mismatch';
  level: number;
  items: string[]; // Item IDs involved
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class StrategyValidationModel {
  private memoryStore = memoryStore;

  /**
   * Run multi-agent validation across a coalition
   */
  async validateWithMultipleAgents(
    hierarchy: StrategyHierarchy,
    agentIds: string[]
  ): Promise<MultiAgentValidationResult> {
    const agentValidations: AgentValidation[] = [];

    // Simulate each agent's validation perspective
    for (const agentId of agentIds) {
      const validation = await this.agentValidatePerspective(hierarchy, agentId);
      agentValidations.push(validation);
    }

    // Calculate consensus
    const validationScores = agentValidations.map((v) => v.validationScore);
    const avgScore = validationScores.reduce((a, b) => a + b, 0) / validationScores.length;
    const variance = validationScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / validationScores.length;
    const consensusLevel = Math.max(0, 100 - Math.sqrt(variance)); // Lower variance = higher consensus

    // Determine overall status
    const overallStatus = this.deriveOverallStatus(agentValidations);

    // Find conflicting views
    const conflictingViews = this.identifyConflictingViews(agentValidations);

    // Generate recommendations
    const recommendations = this.synthesizeRecommendations(agentValidations);

    const result: MultiAgentValidationResult = {
      strategyId: hierarchy.id,
      validationTimestamp: new Date(),
      overallStatus,
      validationScore: avgScore,
      agentValidations,
      consensusLevel,
      conflictingViews,
      recommendations,
    };

    // Store result in memory
    await this.memoryStore.set(`validation:${hierarchy.id}`, result, { ttl: 86400 });

    return result;
  }

  /**
   * Simulate validation from a specific agent's perspective
   */
  private async agentValidatePerspective(hierarchy: StrategyHierarchy, agentId: string): Promise<AgentValidation> {
    // Different agents focus on different aspects
    let validationScore = 85;
    let riskAssessment = 25;
    const concerns: string[] = [];
    const supportingPoints: string[] = [];

    // Agent 1: focuses on feasibility
    if (agentId.includes('executor')) {
      const totalHours = this.estimateTotalHours(hierarchy);
      if (totalHours > 200) {
        validationScore -= 15;
        riskAssessment += 20;
        concerns.push('Strategy requires significant effort (200+ hours). May exceed capacity.');
      } else {
        supportingPoints.push(`Feasible effort estimate (${totalHours.toFixed(0)} hours). Achievable by coalition.`);
      }

      // Check dependencies are reasonable
      const criticalDeps = this.countCriticalDependencies(hierarchy);
      if (criticalDeps > 10) {
        concerns.push(`High dependency count (${criticalDeps}). Risk of bottlenecks.`);
        riskAssessment += 15;
      } else {
        supportingPoints.push(`Manageable dependencies (${criticalDeps}). Good parallelization possible.`);
      }
    }

    // Agent 2: focuses on quality and correctness
    if (agentId.includes('validator')) {
      const allItems = [
        ...hierarchy.L1_Strategic_Objective.items,
        ...hierarchy.L2_Strategic_Pillars.items,
        ...hierarchy.L3_Strategic_Tactics.items,
        ...hierarchy.L4_Operational_Tasks.items,
      ];

      const itemsWithoutDesc = allItems.filter((i) => !i.description || i.description.length < 10).length;
      if (itemsWithoutDesc > allItems.length * 0.2) {
        validationScore -= 20;
        concerns.push(`${itemsWithoutDesc} items lack clear descriptions. Need clarification.`);
      } else {
        supportingPoints.push('All items have clear descriptions. Quality standards met.');
      }

      // Check for circular dependencies
      const hasCircular = this.hasCircularDependencies(hierarchy);
      if (hasCircular) {
        validationScore -= 30;
        riskAssessment += 30;
        concerns.push('Circular dependencies detected. Execution order undefined.');
      } else {
        supportingPoints.push('No circular dependencies. Execution order well-defined.');
      }
    }

    // Agent 3: focuses on strategic alignment
    if (agentId.includes('planner')) {
      const l2Count = hierarchy.L2_Strategic_Pillars.items.length;
      if (l2Count < 3) {
        validationScore -= 15;
        concerns.push('Too few strategic pillars. Objective may not be fully addressed.');
      } else {
        supportingPoints.push(`Strong pillar diversity (${l2Count} pillars). Objective well-covered.`);
      }

      // Check risk distribution
      const riskLevels = [
        ...hierarchy.L2_Strategic_Pillars.items,
        ...hierarchy.L3_Strategic_Tactics.items,
        ...hierarchy.L4_Operational_Tasks.items,
      ].map((i) => i.riskLevel);

      const criticalRisks = riskLevels.filter((r) => r === 'critical').length;
      if (criticalRisks > 2) {
        validationScore -= 20;
        riskAssessment += 25;
        concerns.push(`Multiple critical risks (${criticalRisks}). May need mitigation planning.`);
      }
    }

    // Agent 4: focuses on resource efficiency
    if (agentId.includes('leader')) {
      const totalResources = this.countTotalResources(hierarchy);
      if (totalResources > 15) {
        validationScore -= 10;
        concerns.push(`Many different resources required (${totalResources}). Complex coordination needed.`);
      } else {
        supportingPoints.push(`Focused resource requirements (${totalResources}). Easy to coordinate.`);
      }

      // Check for resource reuse
      const reusedResources = this.identifyResourceReuse(hierarchy);
      if (reusedResources > totalResources * 0.3) {
        validationScore += 10;
        supportingPoints.push('Good resource reuse. Efficient allocation.');
      }
    }

    const recommendation = validationScore >= 80 ? 'approve' : validationScore >= 60 ? 'needs_revision' : 'reject';

    return {
      agentId,
      validationScore: Math.max(0, Math.min(100, validationScore)),
      riskAssessment: Math.max(0, Math.min(100, riskAssessment)),
      concerns,
      supportingPoints,
      recommendation,
      reasoning: this.generateValidationReasoning(validationScore, concerns, supportingPoints),
    };
  }

  /**
   * Detect various types of strategy conflicts
   */
  async detectConflicts(hierarchy: StrategyHierarchy): Promise<StrategyConflict[]> {
    const conflicts: StrategyConflict[] = [];

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(hierarchy);
    conflicts.push(
      ...circularDeps.map((items) => ({
        type: 'circular_dependency' as const,
        level: 4 as number,
        items,
        description: `Circular dependency detected: ${items.join(' -> ')}`,
        severity: 'critical' as const,
      }))
    );

    // Check for timing conflicts (overlapping critical path items)
    const timingConflicts = this.identifyTimingConflicts(hierarchy);
    conflicts.push(...timingConflicts);

    // Check for resource conflicts
    const resourceConflicts = this.identifyResourceConflicts(hierarchy);
    conflicts.push(...resourceConflicts);

    // Check for capability mismatches
    const capabilityIssues = this.identifyCapabilityMismatches(hierarchy);
    conflicts.push(...capabilityIssues);

    return conflicts;
  }

  /**
   * Detect circular dependencies (Depth-First Search)
   */
  private findCircularDependencies(hierarchy: StrategyHierarchy): string[][] {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    const adjacencyList = new Map<string, string[]>();
    for (const item of allItems) {
      adjacencyList.set(item.id, item.dependencies);
    }

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const item of allItems) {
      if (!visited.has(item.id)) {
        dfs(item.id, []);
      }
    }

    return cycles;
  }

  /**
   * Identify timing conflicts
   */
  private identifyTimingConflicts(hierarchy: StrategyHierarchy): StrategyConflict[] {
    const conflicts: StrategyConflict[] = [];
    const allItems = [
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    // Find items on critical path with tight timing
    const criticalPathItems = allItems.filter((i) => i.riskLevel === 'critical' || i.estimatedDuration > 480); // 8+ hours

    for (let i = 0; i < criticalPathItems.length; i++) {
      for (let j = i + 1; j < criticalPathItems.length; j++) {
        const item1 = criticalPathItems[i];
        const item2 = criticalPathItems[j];

        // Check if both items require same resources and don't have dependency
        const sameResources = item1.resourcesRequired.some((r) => item2.resourcesRequired.includes(r));
        const hasDependency =
          item1.dependencies.includes(item2.id) || item2.dependencies.includes(item1.id);

        if (sameResources && !hasDependency) {
          conflicts.push({
            type: 'timing_conflict',
            level: item1.estimatedDuration > item2.estimatedDuration ? 3 : 4,
            items: [item1.id, item2.id],
            description: `Items "${item1.title}" and "${item2.title}" may conflict (same resources, no dependency order).`,
            severity: 'high',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Identify resource conflicts
   */
  private identifyResourceConflicts(hierarchy: StrategyHierarchy): StrategyConflict[] {
    const conflicts: StrategyConflict[] = [];
    const allItems = [
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    // Count resource usage
    const resourceUsage = new Map<string, number>();
    for (const item of allItems) {
      for (const resource of item.resourcesRequired) {
        resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
      }
    }

    // Flag heavily-used resources that might be bottlenecks
    for (const [resource, count] of resourceUsage.entries()) {
      if (count > allItems.length * 0.4) {
        // Used by 40%+ of items
        const itemsUsingResource = allItems.filter((i) => i.resourcesRequired.includes(resource)).map((i) => i.id);
        conflicts.push({
          type: 'resource_conflict',
          level: 3,
          items: itemsUsingResource,
          description: `Resource "${resource}" is heavily used (${count} items). Potential bottleneck.`,
          severity: count > allItems.length * 0.6 ? 'high' : 'medium',
        });
      }
    }

    return conflicts;
  }

  /**
   * Identify capability mismatches
   */
  private identifyCapabilityMismatches(hierarchy: StrategyHierarchy): StrategyConflict[] {
    const conflicts: StrategyConflict[] = [];
    const l4Tasks = hierarchy.L4_Operational_Tasks.items;

    // Check if tasks require capabilities that seem mismatched
    for (const task of l4Tasks) {
      // Simple heuristic: high-risk tasks should have clear resource requirements
      if (task.riskLevel === 'critical' && task.resourcesRequired.length === 0) {
        conflicts.push({
          type: 'capability_mismatch',
          level: 4,
          items: [task.id],
          description: `Critical task "${task.title}" has no resource requirements specified. Capability unclear.`,
          severity: 'high',
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if hierarchy has circular dependencies
   */
  private hasCircularDependencies(hierarchy: StrategyHierarchy): boolean {
    return this.findCircularDependencies(hierarchy).length > 0;
  }

  /**
   * Count total hours across hierarchy
   */
  private estimateTotalHours(hierarchy: StrategyHierarchy): number {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];
    return allItems.reduce((sum, item) => sum + item.estimatedDuration / 60, 0);
  }

  /**
   * Count critical (high/critical severity) dependencies
   */
  private countCriticalDependencies(hierarchy: StrategyHierarchy): number {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];
    return allItems.reduce((sum, item) => sum + item.dependencies.length, 0);
  }

  /**
   * Count total unique resources
   */
  private countTotalResources(hierarchy: StrategyHierarchy): number {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];
    const resources = new Set<string>();
    for (const item of allItems) {
      for (const resource of item.resourcesRequired) {
        resources.add(resource);
      }
    }
    return resources.size;
  }

  /**
   * Count how many times resources are reused
   */
  private identifyResourceReuse(hierarchy: StrategyHierarchy): number {
    const allItems = [
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    const resourceUsage = new Map<string, number>();
    for (const item of allItems) {
      for (const resource of item.resourcesRequired) {
        resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
      }
    }

    // Count resources used more than once
    return [...resourceUsage.values()].filter((count) => count > 1).length;
  }

  /**
   * Derive overall validation status from agent validations
   */
  private deriveOverallStatus(agentValidations: AgentValidation[]): 'approved' | 'needs_revision' | 'rejected' {
    const approvals = agentValidations.filter((v) => v.recommendation === 'approve').length;
    const approvalRate = approvals / agentValidations.length;

    if (approvalRate >= 0.75) {
return 'approved';
}
    if (approvalRate >= 0.5) {
return 'needs_revision';
}
    return 'rejected';
  }

  /**
   * Identify conflicting views between agents
   */
  private identifyConflictingViews(agentValidations: AgentValidation[]): string[] {
    const conflicts: string[] = [];

    // Find agents with significantly different scores
    const scores = agentValidations.map((v) => v.validationScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length);

    if (stdDev > 20) {
      // High variance in scores
      const highScorers = agentValidations.filter((v) => v.validationScore > avgScore + 15).map((v) => v.agentId);
      const lowScorers = agentValidations.filter((v) => v.validationScore < avgScore - 15).map((v) => v.agentId);

      if (highScorers.length > 0 && lowScorers.length > 0) {
        conflicts.push(`Score disagreement: ${highScorers.join(', ')} vs ${lowScorers.join(', ')}`);
      }
    }

    // Find agents with different recommendations
    const recommendations = agentValidations.map((v) => v.recommendation);
    const uniqueRecs = new Set(recommendations);
    if (uniqueRecs.size > 1) {
      for (const rec of uniqueRecs) {
        const agents = agentValidations.filter((v) => v.recommendation === rec).map((v) => v.agentId);
        conflicts.push(`Different recommendations: ${agents.join(', ')} recommend ${rec}`);
      }
    }

    return conflicts;
  }

  /**
   * Synthesize recommendations from agent validations
   */
  private synthesizeRecommendations(agentValidations: AgentValidation[]): string[] {
    const recommendations: string[] = [];
    const allConcerns = agentValidations.flatMap((v) => v.concerns);
    const allPoints = agentValidations.flatMap((v) => v.supportingPoints);

    // Group concerns by frequency
    const concernCounts = new Map<string, number>();
    for (const concern of allConcerns) {
      concernCounts.set(concern, (concernCounts.get(concern) || 0) + 1);
    }

    // Return most common concerns as recommendations
    const sorted = [...concernCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [concern, count] of sorted.slice(0, 3)) {
      if (count >= 2) {
        recommendations.push(`Address: ${concern}`);
      }
    }

    return recommendations;
  }

  /**
   * Generate detailed validation reasoning
   */
  private generateValidationReasoning(validationScore: number, concerns: string[], supportingPoints: string[]): string {
    const scoreInterpretation = validationScore >= 80 ? 'Strong' : validationScore >= 60 ? 'Moderate' : 'Weak';
    const parts = [
      `${scoreInterpretation} validation (${validationScore.toFixed(0)}/100).`,
    ];

    if (supportingPoints.length > 0) {
      parts.push(`Strengths: ${supportingPoints[0]}`);
    }

    if (concerns.length > 0) {
      parts.push(`Concerns: ${concerns[0]}`);
    }

    return parts.join(' ');
  }
}

export const strategyValidationModel = new StrategyValidationModel();
