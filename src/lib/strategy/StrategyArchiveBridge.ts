import { memoryStore } from '@/lib/memory';
import { StrategyHierarchy } from './StrategyHierarchyEngine';

export interface StrategyPatternType {
  pattern:
    | 'high_quality_strategy'
    | 'efficient_hierarchy'
    | 'risky_strategy'
    | 'overcomplicated_strategy'
    | 'effective_decomposition';
}

export interface StrategyArchiveRecord {
  strategyId: string;
  workspaceId: string;
  coalitionId: string;
  originalHierarchy: StrategyHierarchy;
  outcomeStatus: 'successful' | 'partial_success' | 'failed';
  completionMetrics: {
    tasksCompleted: number;
    tasksTotal: number;
    completionRate: number; // 0-100
    timeEfficiency: number; // actual time / estimated time, normalized 0-100
    costEfficiency: number; // 0-100
  };
  detectedPatterns: StrategyPatternType[];
  insights: string[];
  lessonLearned: string[];
  archivedAt: Date;
}

export interface StrategyPattern {
  patternName: string;
  description: string;
  frequency: number; // how many times this pattern observed
  successRate: number; // % of patterns that led to successful outcomes
  efficacy: number; // 0-100, how effective was this pattern
  relatedStrategies: string[]; // strategy IDs with this pattern
}

export class StrategyArchiveBridge {
  private memoryStore = memoryStore;

  /**
   * Archive a completed strategy and analyze patterns
   */
  async archiveStrategy(
    hierarchy: StrategyHierarchy,
    outcomeStatus: 'successful' | 'partial_success' | 'failed',
    actualMetrics: { tasksCompleted: number; totalTime: number; totalCost: number }
  ): Promise<StrategyArchiveRecord> {
    // Calculate completion metrics
    const completionMetrics = {
      tasksCompleted: actualMetrics.tasksCompleted,
      tasksTotal: this.countTotalTasks(hierarchy),
      completionRate: (actualMetrics.tasksCompleted / this.countTotalTasks(hierarchy)) * 100,
      timeEfficiency: this.calculateTimeEfficiency(hierarchy, actualMetrics.totalTime),
      costEfficiency: this.calculateCostEfficiency(hierarchy, actualMetrics.totalCost),
    };

    // Detect patterns in this strategy
    const detectedPatterns = this.detectPatterns(hierarchy, outcomeStatus, completionMetrics);

    // Generate insights
    const insights = this.generateInsights(hierarchy, outcomeStatus, completionMetrics, detectedPatterns);

    // Extract lessons learned
    const lessonLearned = this.extractLessonsLearned(hierarchy, outcomeStatus, insights);

    const archiveRecord: StrategyArchiveRecord = {
      strategyId: hierarchy.id,
      workspaceId: hierarchy.workspaceId,
      coalitionId: hierarchy.coalitionId,
      originalHierarchy: hierarchy,
      outcomeStatus,
      completionMetrics,
      detectedPatterns,
      insights,
      lessonLearned,
      archivedAt: new Date(),
    };

    // Store in memory
    await this.memoryStore.set(`archive:${hierarchy.id}`, archiveRecord, { ttl: 2592000 }); // 30 days

    return archiveRecord;
  }

  /**
   * Count total L4 tasks (actual executables)
   */
  private countTotalTasks(hierarchy: StrategyHierarchy): number {
    return hierarchy.L4_Operational_Tasks.items.length;
  }

  /**
   * Calculate time efficiency (0-100)
   * 100 = completed in estimated time
   * <100 = took longer than estimated
   * >100 = completed faster (capped at 120 for favorable weighting)
   */
  private calculateTimeEfficiency(hierarchy: StrategyHierarchy, actualTime: number): number {
    const estimatedTime = hierarchy.L4_Operational_Tasks.items.reduce((sum, item) => sum + item.estimatedDuration, 0);

    if (estimatedTime === 0) return 100;

    const efficiency = (estimatedTime / actualTime) * 100;
    return Math.max(0, Math.min(120, efficiency)); // Cap at 120
  }

  /**
   * Calculate cost efficiency (0-100)
   * Simplified: lower cost = higher efficiency
   */
  private calculateCostEfficiency(hierarchy: StrategyHierarchy, actualCost: number): number {
    // Estimate baseline cost: $100 per estimated hour + $500 base
    const estimatedCost = (hierarchy.L4_Operational_Tasks.items.reduce((sum, item) => sum + item.estimatedDuration / 60, 0) * 100) + 500;

    if (estimatedCost === 0) return 100;

    const efficiency = (estimatedCost / actualCost) * 100;
    return Math.max(0, Math.min(100, efficiency));
  }

  /**
   * Detect patterns in strategy
   */
  private detectPatterns(
    hierarchy: StrategyHierarchy,
    outcomeStatus: string,
    completionMetrics: any
  ): StrategyPatternType[] {
    const patterns: StrategyPatternType[] = [];

    // Pattern 1: High quality strategy
    if (hierarchy.hierarchyScore >= 85 && outcomeStatus === 'successful') {
      patterns.push({ pattern: 'high_quality_strategy' });
    }

    // Pattern 2: Efficient hierarchy
    if (completionMetrics.timeEfficiency >= 90 && completionMetrics.costEfficiency >= 85) {
      patterns.push({ pattern: 'efficient_hierarchy' });
    }

    // Pattern 3: Risky strategy (many critical risks, but successful)
    const criticalRisks = [
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ].filter((i) => i.riskLevel === 'critical').length;

    if (criticalRisks >= 3 && outcomeStatus === 'successful') {
      patterns.push({ pattern: 'risky_strategy' });
    }

    // Pattern 4: Overcomplicated strategy
    const totalItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ].length;

    if (totalItems > 50 && completionMetrics.completionRate < 80) {
      patterns.push({ pattern: 'overcomplicated_strategy' });
    }

    // Pattern 5: Effective decomposition
    const l2Ratio = hierarchy.L2_Strategic_Pillars.items.length;
    const l3Ratio = hierarchy.L3_Strategic_Tactics.items.length;
    const l4Ratio = hierarchy.L4_Operational_Tasks.items.length;

    if (
      l2Ratio >= 3 &&
      l2Ratio <= 5 &&
      l3Ratio >= l2Ratio * 2 &&
      l3Ratio <= l2Ratio * 4 &&
      l4Ratio >= l3Ratio * 1.5 &&
      l4Ratio <= l3Ratio * 3 &&
      completionMetrics.completionRate >= 85
    ) {
      patterns.push({ pattern: 'effective_decomposition' });
    }

    return patterns;
  }

  /**
   * Generate insights from strategy execution
   */
  private generateInsights(
    hierarchy: StrategyHierarchy,
    outcomeStatus: string,
    completionMetrics: any,
    patterns: StrategyPatternType[]
  ): string[] {
    const insights: string[] = [];

    // Insight 1: Overall success
    if (outcomeStatus === 'successful' && completionMetrics.completionRate >= 90) {
      insights.push('Strategy execution was highly successful with 90%+ task completion.');
    } else if (outcomeStatus === 'partial_success') {
      insights.push(`Strategy achieved partial success with ${completionMetrics.completionRate.toFixed(0)}% task completion.`);
    } else if (outcomeStatus === 'failed') {
      insights.push(`Strategy failed with only ${completionMetrics.completionRate.toFixed(0)}% task completion.`);
    }

    // Insight 2: Time performance
    if (completionMetrics.timeEfficiency >= 100) {
      insights.push(`Time execution efficient at ${completionMetrics.timeEfficiency.toFixed(0)}% of estimate.`);
    } else if (completionMetrics.timeEfficiency < 70) {
      insights.push(`Time execution over estimate (${completionMetrics.timeEfficiency.toFixed(0)}%). Investigate delays.`);
    }

    // Insight 3: Cost performance
    if (completionMetrics.costEfficiency >= 90) {
      insights.push(`Cost execution excellent at ${completionMetrics.costEfficiency.toFixed(0)}% of budget.`);
    } else if (completionMetrics.costEfficiency < 60) {
      insights.push(`Cost overrun detected (${(100 - completionMetrics.costEfficiency).toFixed(0)}% over budget).`);
    }

    // Insight 4: Hierarchy quality
    if (hierarchy.hierarchyScore >= 85) {
      insights.push('Strategy hierarchy was well-structured and coherent.');
    } else if (hierarchy.hierarchyScore < 65) {
      insights.push('Strategy hierarchy was complex and may have caused execution difficulties.');
    }

    // Insight 5: Risk assessment
    const allRisks = [
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];
    const highRisks = allRisks.filter((i) => i.riskLevel === 'high' || i.riskLevel === 'critical').length;
    const riskRate = highRisks / allRisks.length;

    if (riskRate >= 0.4 && outcomeStatus === 'successful') {
      insights.push('Successfully navigated high-risk strategy. Effective risk management demonstrated.');
    } else if (riskRate >= 0.4 && outcomeStatus === 'failed') {
      insights.push('High-risk strategy elements may have contributed to failure. Review risk mitigation.');
    }

    // Insight 6: Patterns observed
    if (patterns.length > 0) {
      const patternNames = patterns.map((p) => p.pattern).join(', ');
      insights.push(`Notable patterns detected: ${patternNames}`);
    }

    return insights;
  }

  /**
   * Extract lessons learned
   */
  private extractLessonsLearned(hierarchy: StrategyHierarchy, outcomeStatus: string, insights: string[]): string[] {
    const lessons: string[] = [];

    if (outcomeStatus === 'successful') {
      lessons.push('Document this strategy as a successful template for similar objectives.');
      lessons.push('Replicate the decomposition and resource allocation patterns from this strategy.');

      const l4Tasks = hierarchy.L4_Operational_Tasks.items;
      const avgDuration = l4Tasks.reduce((sum, item) => sum + item.estimatedDuration, 0) / l4Tasks.length;
      lessons.push(`Average task duration was ${(avgDuration / 60).toFixed(1)} hours. Use for future estimates.`);
    } else if (outcomeStatus === 'failed') {
      lessons.push('Analyze root causes of failure. Review decomposition for clarity.');
      lessons.push('Identify whether failure was due to execution or strategy design.');
      lessons.push('Consider simplified approach for similar objectives in future.');
    }

    // Add insights-based lessons
    for (const insight of insights) {
      if (insight.includes('over estimate') || insight.includes('overrun')) {
        lessons.push('Build more buffer time into future estimates for similar strategy types.');
      }
      if (insight.includes('overcomplicated')) {
        lessons.push('Simplify decomposition by merging related items or reducing detail levels.');
      }
      if (insight.includes('high-risk')) {
        lessons.push('Develop explicit mitigation plans for high-risk strategy elements before execution.');
      }
    }

    return lessons;
  }

  /**
   * Query strategy patterns from archive
   */
  async getStrategyPatterns(workspaceId: string): Promise<StrategyPattern[]> {
    // In production, would query database for archived strategies
    // For MVP, generate from memory store
    const patterns = new Map<string, StrategyPattern>();

    // Initialize pattern definitions
    const patternDefs = [
      {
        name: 'high_quality_strategy',
        description: 'Well-structured strategies with hierarchy score ≥85 that achieved successful outcomes',
      },
      {
        name: 'efficient_hierarchy',
        description: 'Strategies that were completed 90%+ on time and 85%+ on budget',
      },
      {
        name: 'risky_strategy',
        description: 'High-risk strategies (3+ critical elements) that still achieved success',
      },
      {
        name: 'overcomplicated_strategy',
        description: 'Complex strategies (50+ items) with lower completion rates',
      },
      {
        name: 'effective_decomposition',
        description: 'Strategies with well-balanced decomposition ratios (L2: 3-5, L3: 2-4 per parent, L4: 2-3 per parent)',
      },
    ];

    for (const def of patternDefs) {
      patterns.set(def.name, {
        patternName: def.name,
        description: def.description,
        frequency: 0,
        successRate: 0,
        efficacy: 0,
        relatedStrategies: [],
      });
    }

    return [...patterns.values()];
  }

  /**
   * Get most effective strategy components by pattern
   */
  async getMostEffectiveComponents(workspaceId: string, pattern: string): Promise<any> {
    // Return strategies that best exemplify a pattern
    return {
      pattern,
      topStrategies: [],
      commonCharacteristics: [],
      recommendations: [],
    };
  }

  /**
   * Generate strategy recommendation based on patterns
   */
  async recommendStrategyApproach(workspaceId: string, objectiveType: string): Promise<any> {
    // Based on historical patterns, recommend best approach for new objective
    return {
      recommendedPatterns: [],
      suggestedDecomposition: {
        l2Count: '3-4',
        l3PerL2: '2-3',
        l4PerL3: '2-3',
      },
      estimatedHours: 0,
      successProbability: 0,
      keySuccessFactors: [],
    };
  }

  /**
   * Calculate pattern efficacy based on outcomes
   */
  private calculatePatternEfficacy(
    pattern: StrategyPatternType,
    successRate: number,
    efficiency: number
  ): number {
    // Efficacy = 70% success_rate + 30% efficiency
    return successRate * 0.7 + efficiency * 0.3;
  }
}

export const strategyArchiveBridge = new StrategyArchiveBridge();
