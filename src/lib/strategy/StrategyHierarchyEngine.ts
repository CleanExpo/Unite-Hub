import { memoryStore } from '@/lib/memory';

export interface StrategicObjective {
  id: string;
  workspaceId: string;
  coalitionId: string;
  title: string;
  description: string;
  context: string;
  successCriteria: string[];
  constraints: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface StrategyLevel {
  level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  items: StrategyItem[];
}

export interface StrategyItem {
  id: string;
  title: string;
  description: string;
  resourcesRequired: string[];
  estimatedDuration: number; // in minutes
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[]; // IDs of other strategy items
  owner?: string; // agent ID
}

export interface StrategyHierarchy {
  id: string;
  workspaceId: string;
  coalitionId: string;
  objectiveId: string;
  L1_Strategic_Objective: StrategyLevel;
  L2_Strategic_Pillars: StrategyLevel;
  L3_Strategic_Tactics: StrategyLevel;
  L4_Operational_Tasks: StrategyLevel;
  hierarchyScore: number; // 0-100, consistency and coherence
  createdAt: Date;
  lastValidated: Date;
  status: 'draft' | 'validated' | 'executing' | 'completed';
}

export class StrategyHierarchyEngine {
  private memoryStore = memoryStore;

  /**
   * Generate a complete 4-level strategy hierarchy from an objective
   */
  async generateHierarchy(objective: StrategicObjective): Promise<StrategyHierarchy> {
    // L1: Strategic Objective (the goal itself)
    const l1 = this.generateL1Strategic(objective);

    // L2: Strategic Pillars (major pillars to achieve objective)
    const l2 = await this.generateL2Pillars(objective, l1);

    // L3: Strategic Tactics (specific approaches under each pillar)
    const l3 = await this.generateL3Tactics(objective, l2);

    // L4: Operational Tasks (concrete tasks to execute)
    const l4 = await this.generateL4Tasks(objective, l3);

    // Calculate hierarchy coherence score
    const hierarchyScore = this.calculateHierarchyCoherence(l1, l2, l3, l4);

    const hierarchy: StrategyHierarchy = {
      id: `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: objective.workspaceId,
      coalitionId: objective.coalitionId,
      objectiveId: objective.id,
      L1_Strategic_Objective: l1,
      L2_Strategic_Pillars: l2,
      L3_Strategic_Tactics: l3,
      L4_Operational_Tasks: l4,
      hierarchyScore,
      createdAt: new Date(),
      lastValidated: new Date(),
      status: 'draft',
    };

    // Store in memory for later retrieval
    await this.memoryStore.set(`strategy:${hierarchy.id}`, hierarchy, { ttl: 86400 });

    return hierarchy;
  }

  /**
   * L1: Generate the strategic objective level
   */
  private generateL1Strategic(objective: StrategicObjective): StrategyLevel {
    const item: StrategyItem = {
      id: `l1-${objective.id}`,
      title: objective.title,
      description: objective.description,
      resourcesRequired: [],
      estimatedDuration: 0, // Placeholder, not applicable for L1
      riskLevel: objective.priority === 'critical' ? 'high' : 'medium',
      dependencies: [],
      owner: undefined,
    };

    return {
      level: 1,
      title: 'Strategic Objective',
      description: `Top-level strategic goal: ${objective.title}`,
      items: [item],
    };
  }

  /**
   * L2: Decompose objective into strategic pillars (3-5 major categories)
   */
  private async generateL2Pillars(objective: StrategicObjective, l1: StrategyLevel): Promise<StrategyLevel> {
    // Parse objective to identify major pillar categories
    const pillars = this.identifyStrategicPillars(objective);

    const items: StrategyItem[] = pillars.map((pillar, idx) => ({
      id: `l2-pillar-${objective.id}-${idx}`,
      title: pillar.name,
      description: pillar.description,
      resourcesRequired: pillar.requiredResources,
      estimatedDuration: pillar.estimatedWeeks * 7 * 24 * 60, // Convert weeks to minutes
      riskLevel: this.assessPillarRisk(pillar, objective),
      dependencies: idx > 0 ? [`l2-pillar-${objective.id}-${idx - 1}`] : [], // Sequential by default
      owner: undefined,
    }));

    return {
      level: 2,
      title: 'Strategic Pillars',
      description: 'Major pillars required to achieve the objective',
      items,
    };
  }

  /**
   * L3: Decompose each pillar into specific tactics (2-4 per pillar)
   */
  private async generateL3Tactics(objective: StrategicObjective, l2: StrategyLevel): Promise<StrategyLevel> {
    const items: StrategyItem[] = [];

    for (let pillarIdx = 0; pillarIdx < l2.items.length; pillarIdx++) {
      const pillar = l2.items[pillarIdx];
      const tactics = this.generateTacticsForPillar(pillar, objective, pillarIdx);

      items.push(
        ...tactics.map((tactic, tacticIdx) => ({
          id: `l3-tactic-${objective.id}-${pillarIdx}-${tacticIdx}`,
          title: tactic.name,
          description: tactic.description,
          resourcesRequired: tactic.resources,
          estimatedDuration: tactic.durationDays * 24 * 60, // Convert days to minutes
          riskLevel: tactic.riskLevel,
          dependencies: [
            pillar.id, // Depends on parent pillar
            ...(tacticIdx > 0 ? [`l3-tactic-${objective.id}-${pillarIdx}-${tacticIdx - 1}`] : []), // Sequential within pillar
          ],
          owner: undefined,
        }))
      );
    }

    return {
      level: 3,
      title: 'Strategic Tactics',
      description: 'Specific approaches under each strategic pillar',
      items,
    };
  }

  /**
   * L4: Decompose each tactic into concrete operational tasks (2-3 per tactic)
   */
  private async generateL4Tasks(objective: StrategicObjective, l3: StrategyLevel): Promise<StrategyLevel> {
    const items: StrategyItem[] = [];

    for (let tacticIdx = 0; tacticIdx < l3.items.length; tacticIdx++) {
      const tactic = l3.items[tacticIdx];
      const tasks = this.generateTasksForTactic(tactic, objective, tacticIdx);

      items.push(
        ...tasks.map((task, taskIdx) => ({
          id: `l4-task-${objective.id}-${tacticIdx}-${taskIdx}`,
          title: task.name,
          description: task.description,
          resourcesRequired: task.resources,
          estimatedDuration: task.durationHours * 60, // Convert hours to minutes
          riskLevel: task.riskLevel,
          dependencies: [
            tactic.id, // Depends on parent tactic
            ...(taskIdx > 0 ? [`l4-task-${objective.id}-${tacticIdx}-${taskIdx - 1}`] : []), // Sequential within tactic
          ],
          owner: undefined,
        }))
      );
    }

    return {
      level: 4,
      title: 'Operational Tasks',
      description: 'Concrete, actionable tasks to execute',
      items,
    };
  }

  /**
   * Identify 3-5 strategic pillars from objective
   */
  private identifyStrategicPillars(
    objective: StrategicObjective
  ): Array<{ name: string; description: string; requiredResources: string[]; estimatedWeeks: number }> {
    // Simple heuristic: common pillars for objectives
    const defaultPillars = [
      {
        name: 'Planning & Preparation',
        description: 'Define scope, timeline, and resource allocation',
        requiredResources: ['Planning tools', 'Domain expertise'],
        estimatedWeeks: 2,
      },
      {
        name: 'Infrastructure & Setup',
        description: 'Establish necessary infrastructure and prerequisites',
        requiredResources: ['Infrastructure', 'Integration capabilities'],
        estimatedWeeks: 2,
      },
      {
        name: 'Core Execution',
        description: 'Execute primary strategy activities',
        requiredResources: ['Specialized skills', 'Operational resources'],
        estimatedWeeks: 4,
      },
      {
        name: 'Validation & Optimization',
        description: 'Validate outputs and optimize performance',
        requiredResources: ['Quality assurance', 'Testing tools'],
        estimatedWeeks: 2,
      },
      {
        name: 'Completion & Handoff',
        description: 'Finalize and transition to operational phase',
        requiredResources: ['Documentation', 'Knowledge transfer'],
        estimatedWeeks: 1,
      },
    ];

    // Parse objective context to potentially customize pillars
    // For MVP, use default pillars
    return defaultPillars;
  }

  /**
   * Assess risk level for a pillar
   */
  private assessPillarRisk(
    pillar: { name: string; description: string; requiredResources: string[]; estimatedWeeks: number },
    objective: StrategicObjective
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (objective.priority === 'critical') return 'high';
    if (pillar.estimatedWeeks > 4) return 'medium';
    return 'low';
  }

  /**
   * Generate 2-4 tactics for a pillar
   */
  private generateTacticsForPillar(
    pillar: StrategyItem,
    objective: StrategicObjective,
    pillarIdx: number
  ): Array<{ name: string; description: string; resources: string[]; durationDays: number; riskLevel: string }> {
    // Simplified tactic generation based on pillar
    const tacticTemplates = [
      { name: 'Define approach', description: 'Define specific approach and methodology', resources: [], durationDays: 2 },
      { name: 'Resource allocation', description: 'Allocate required resources', resources: [], durationDays: 1 },
      { name: 'Execution preparation', description: 'Prepare for execution phase', resources: [], durationDays: 2 },
    ];

    return tacticTemplates.slice(0, 2 + (pillarIdx % 2)).map((t) => ({
      ...t,
      riskLevel: 'low',
    }));
  }

  /**
   * Generate 2-3 tasks for a tactic
   */
  private generateTasksForTactic(
    tactic: StrategyItem,
    objective: StrategicObjective,
    tacticIdx: number
  ): Array<{ name: string; description: string; resources: string[]; durationHours: number; riskLevel: string }> {
    // Simplified task generation based on tactic
    const taskTemplates = [
      { name: 'Analyze requirements', description: 'Gather and analyze all requirements', resources: [], durationHours: 2 },
      { name: 'Develop plan', description: 'Create detailed execution plan', resources: [], durationHours: 4 },
      { name: 'Coordinate resources', description: 'Ensure all resources are available', resources: [], durationHours: 1 },
    ];

    return taskTemplates.slice(0, 2 + (tacticIdx % 2)).map((t) => ({
      ...t,
      riskLevel: 'low',
    }));
  }

  /**
   * Calculate hierarchy coherence score (0-100)
   * Measures how well L2/L3/L4 support L1
   */
  private calculateHierarchyCoherence(
    l1: StrategyLevel,
    l2: StrategyLevel,
    l3: StrategyLevel,
    l4: StrategyLevel
  ): number {
    let score = 100;

    // Deduct points for missing levels
    if (l2.items.length === 0) score -= 25;
    if (l3.items.length === 0) score -= 25;
    if (l4.items.length === 0) score -= 25;

    // Deduct points for poor decomposition ratio
    const l2ToL1Ratio = l2.items.length / (l1.items.length || 1);
    const l3ToL2Ratio = l3.items.length / (l2.items.length || 1);
    const l4ToL3Ratio = l4.items.length / (l3.items.length || 1);

    // Ideal ratio: 1:3-5, 1:2-4, 1:2-3
    if (l2ToL1Ratio < 3 || l2ToL1Ratio > 5) score -= 10;
    if (l3ToL2Ratio < 2 || l3ToL2Ratio > 4) score -= 10;
    if (l4ToL3Ratio < 2 || l4ToL3Ratio > 3) score -= 10;

    // Bonus for strong dependency chains
    const allItems = [...l2.items, ...l3.items, ...l4.items];
    const itemsWithDeps = allItems.filter((item) => item.dependencies.length > 0).length;
    if (itemsWithDeps / allItems.length > 0.7) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Refine an existing hierarchy based on feedback
   */
  async refineHierarchy(hierarchy: StrategyHierarchy, feedback: { level: 1 | 2 | 3 | 4; issues: string[] }): Promise<StrategyHierarchy> {
    const refined = { ...hierarchy };

    // Apply feedback-driven refinements
    if (feedback.level === 2 && refined.L2_Strategic_Pillars.items.length < 3) {
      // Add missing pillars
      refined.L2_Strategic_Pillars.items.push({
        id: `l2-pillar-new-${Date.now()}`,
        title: 'Additional Strategic Pillar',
        description: 'Added based on feedback',
        resourcesRequired: [],
        estimatedDuration: 0,
        riskLevel: 'medium',
        dependencies: [],
        owner: undefined,
      });
    }

    // Recalculate score
    refined.hierarchyScore = this.calculateHierarchyCoherence(
      refined.L1_Strategic_Objective,
      refined.L2_Strategic_Pillars,
      refined.L3_Strategic_Tactics,
      refined.L4_Operational_Tasks
    );

    refined.lastValidated = new Date();

    // Update memory store
    await this.memoryStore.set(`strategy:${hierarchy.id}`, refined, { ttl: 86400 });

    return refined;
  }

  /**
   * Estimate total effort (in person-hours) for strategy
   */
  estimateTotalEffort(hierarchy: StrategyHierarchy): number {
    const allLevels = [
      hierarchy.L1_Strategic_Objective,
      hierarchy.L2_Strategic_Pillars,
      hierarchy.L3_Strategic_Tactics,
      hierarchy.L4_Operational_Tasks,
    ];

    return allLevels.reduce((total, level) => {
      const levelEffort = level.items.reduce((sum, item) => sum + (item.estimatedDuration / 60), 0); // Convert to hours
      return total + levelEffort;
    }, 0);
  }

  /**
   * Identify critical path through strategy
   */
  identifyCriticalPath(hierarchy: StrategyHierarchy): StrategyItem[] {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    // Simple critical path: items with longest estimated duration + deepest dependencies
    return allItems
      .sort((a, b) => {
        const aScore = a.estimatedDuration + (a.dependencies.length * 10);
        const bScore = b.estimatedDuration + (b.dependencies.length * 10);
        return bScore - aScore;
      })
      .slice(0, Math.ceil(allItems.length * 0.3)); // Top 30% by criticality
  }
}

export const strategyHierarchyEngine = new StrategyHierarchyEngine();
