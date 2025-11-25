import { memoryStore } from '@/lib/memory';
import { StrategyHierarchy, StrategyItem, StrategyLevel } from './StrategyHierarchyEngine';

export interface DecompositionRule {
  sourceLevel: 1 | 2 | 3;
  targetLevel: 2 | 3 | 4;
  rule: (sourceItem: StrategyItem, index: number) => StrategyItem[];
  expectedRatio: { min: number; max: number }; // Expected items per source item
}

export interface DecompositionMetrics {
  completeness: number; // 0-100: are all levels properly decomposed?
  balance: number; // 0-100: is decomposition ratio balanced across levels?
  coherence: number; // 0-100: do decomposed items logically relate to parent?
  clarity: number; // 0-100: are descriptions clear and specific?
  overall: number; // 0-100: weighted average
}

export interface DecompositionAnalysis {
  hierarchyId: string;
  metrics: DecompositionMetrics;
  issues: DecompositionIssue[];
  recommendations: string[];
  decompositionMap: Map<string, string[]>; // parentId -> [childIds]
}

export interface DecompositionIssue {
  level: 1 | 2 | 3 | 4;
  itemId: string;
  itemTitle: string;
  issueType: 'missing_children' | 'too_many_children' | 'unclear_description' | 'broken_dependency' | 'orphaned_item';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export class StrategicDecompositionModel {
  private memoryStore = memoryStore;

  /**
   * Analyze a hierarchy for decomposition quality
   */
  async analyzeDecomposition(hierarchy: StrategyHierarchy): Promise<DecompositionAnalysis> {
    const issues: DecompositionIssue[] = [];
    const decompositionMap = new Map<string, string[]>();

    // Check L1 -> L2 decomposition
    this.validateL1ToL2(hierarchy, issues, decompositionMap);

    // Check L2 -> L3 decomposition
    this.validateL2ToL3(hierarchy, issues, decompositionMap);

    // Check L3 -> L4 decomposition
    this.validateL3ToL4(hierarchy, issues, decompositionMap);

    // Check for orphaned items and broken dependencies
    this.validateDependencies(hierarchy, issues, decompositionMap);

    // Calculate metrics
    const metrics = this.calculateDecompositionMetrics(hierarchy, issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, metrics);

    const analysis: DecompositionAnalysis = {
      hierarchyId: hierarchy.id,
      metrics,
      issues,
      recommendations,
      decompositionMap,
    };

    // Store analysis in memory
    await this.memoryStore.set(`analysis:${hierarchy.id}`, analysis, { ttl: 86400 });

    return analysis;
  }

  /**
   * Validate L1 -> L2 decomposition
   */
  private validateL1ToL2(hierarchy: StrategyHierarchy, issues: DecompositionIssue[], map: Map<string, string[]>): void {
    const l1Items = hierarchy.L1_Strategic_Objective.items;
    const l2Items = hierarchy.L2_Strategic_Pillars.items;

    // Each L1 item should have 3-5 L2 children
    for (const l1Item of l1Items) {
      const l2Children = l2Items; // All L2 items are "children" of the single L1 objective
      map.set(l1Item.id, l2Children.map((item) => item.id));

      if (l2Children.length < 3) {
        issues.push({
          level: 2,
          itemId: l1Item.id,
          itemTitle: l1Item.title,
          issueType: 'missing_children',
          severity: 'medium',
          message: `L1 objective "${l1Item.title}" has only ${l2Children.length} pillars (expected 3-5). May be under-decomposed.`,
        });
      }

      if (l2Children.length > 7) {
        issues.push({
          level: 2,
          itemId: l1Item.id,
          itemTitle: l1Item.title,
          issueType: 'too_many_children',
          severity: 'medium',
          message: `L1 objective "${l1Item.title}" has ${l2Children.length} pillars (expected 3-5). May be over-decomposed.`,
        });
      }

      // Check L2 descriptions mention L1 objective
      for (const l2Item of l2Children) {
        const relatedTerms = this.findRelatedTerms(l1Item.title, l2Item.description);
        if (relatedTerms < 0.3) {
          issues.push({
            level: 2,
            itemId: l2Item.id,
            itemTitle: l2Item.title,
            issueType: 'unclear_description',
            severity: 'low',
            message: `L2 pillar "${l2Item.title}" description may not clearly relate to objective "${l1Item.title}".`,
          });
        }
      }
    }
  }

  /**
   * Validate L2 -> L3 decomposition
   */
  private validateL2ToL3(hierarchy: StrategyHierarchy, issues: DecompositionIssue[], map: Map<string, string[]>): void {
    const l2Items = hierarchy.L2_Strategic_Pillars.items;
    const l3Items = hierarchy.L3_Strategic_Tactics.items;

    for (const l2Item of l2Items) {
      // Find L3 items that depend on this L2 item
      const l3Children = l3Items.filter((l3) => l3.dependencies.includes(l2Item.id));
      map.set(l2Item.id, l3Children.map((item) => item.id));

      if (l3Children.length < 2) {
        issues.push({
          level: 3,
          itemId: l2Item.id,
          itemTitle: l2Item.title,
          issueType: 'missing_children',
          severity: 'medium',
          message: `L2 pillar "${l2Item.title}" has only ${l3Children.length} tactics (expected 2-4). May be under-decomposed.`,
        });
      }

      if (l3Children.length > 6) {
        issues.push({
          level: 3,
          itemId: l2Item.id,
          itemTitle: l2Item.title,
          issueType: 'too_many_children',
          severity: 'medium',
          message: `L2 pillar "${l2Item.title}" has ${l3Children.length} tactics (expected 2-4). May be over-decomposed.`,
        });
      }
    }
  }

  /**
   * Validate L3 -> L4 decomposition
   */
  private validateL3ToL4(hierarchy: StrategyHierarchy, issues: DecompositionIssue[], map: Map<string, string[]>): void {
    const l3Items = hierarchy.L3_Strategic_Tactics.items;
    const l4Items = hierarchy.L4_Operational_Tasks.items;

    for (const l3Item of l3Items) {
      // Find L4 items that depend on this L3 item
      const l4Children = l4Items.filter((l4) => l4.dependencies.includes(l3Item.id));
      map.set(l3Item.id, l4Children.map((item) => item.id));

      if (l4Children.length < 2) {
        issues.push({
          level: 4,
          itemId: l3Item.id,
          itemTitle: l3Item.title,
          issueType: 'missing_children',
          severity: 'low',
          message: `L3 tactic "${l3Item.title}" has only ${l4Children.length} tasks (expected 2-3). May lack detail.`,
        });
      }

      if (l4Children.length > 5) {
        issues.push({
          level: 4,
          itemId: l3Item.id,
          itemTitle: l3Item.title,
          issueType: 'too_many_children',
          severity: 'low',
          message: `L3 tactic "${l3Item.title}" has ${l4Children.length} tasks (expected 2-3). May be over-detailed.`,
        });
      }
    }
  }

  /**
   * Validate dependencies and identify orphaned items
   */
  private validateDependencies(hierarchy: StrategyHierarchy, issues: DecompositionIssue[], map: Map<string, string[]>): void {
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];

    const itemIds = new Set(allItems.map((item) => item.id));

    for (const item of allItems) {
      // Check for broken dependencies
      for (const depId of item.dependencies) {
        if (!itemIds.has(depId)) {
          issues.push({
            level: item.estimatedDuration > 0 ? (4 as any) : (1 as any), // Rough level estimate
            itemId: item.id,
            itemTitle: item.title,
            issueType: 'broken_dependency',
            severity: 'high',
            message: `Item "${item.title}" depends on non-existent item "${depId}". Broken reference.`,
          });
        }
      }
    }

    // Find orphaned items (no incoming or outgoing dependencies, not L1)
    const itemsWithDeps = new Set<string>();
    for (const item of allItems) {
      itemsWithDeps.add(item.id);
      for (const depId of item.dependencies) {
        itemsWithDeps.add(depId);
      }
    }

    for (const item of allItems) {
      if (item.id !== hierarchy.L1_Strategic_Objective.items[0]?.id && !itemsWithDeps.has(item.id)) {
        issues.push({
          level: 4 as any, // Orphaned items are typically low-level
          itemId: item.id,
          itemTitle: item.title,
          issueType: 'orphaned_item',
          severity: 'medium',
          message: `Item "${item.title}" appears orphaned (no dependencies to/from other items).`,
        });
      }
    }
  }

  /**
   * Calculate decomposition metrics
   */
  private calculateDecompositionMetrics(hierarchy: StrategyHierarchy, issues: DecompositionIssue[]): DecompositionMetrics {
    // Completeness: all levels exist and have items
    let completeness = 100;
    if (hierarchy.L2_Strategic_Pillars.items.length === 0) completeness -= 25;
    if (hierarchy.L3_Strategic_Tactics.items.length === 0) completeness -= 25;
    if (hierarchy.L4_Operational_Tasks.items.length === 0) completeness -= 25;

    // Balance: decomposition ratios are within expected ranges
    let balance = 100;
    const l2Ratio = hierarchy.L2_Strategic_Pillars.items.length / (hierarchy.L1_Strategic_Objective.items.length || 1);
    const l3Ratio = hierarchy.L3_Strategic_Tactics.items.length / (hierarchy.L2_Strategic_Pillars.items.length || 1);
    const l4Ratio = hierarchy.L4_Operational_Tasks.items.length / (hierarchy.L3_Strategic_Tactics.items.length || 1);

    if (l2Ratio < 3 || l2Ratio > 5) balance -= 15;
    if (l3Ratio < 2 || l3Ratio > 4) balance -= 15;
    if (l4Ratio < 2 || l4Ratio > 3) balance -= 15;

    // Coherence: deduct for issues indicating poor logical relationship
    let coherence = 100;
    const unclaarDescIssues = issues.filter((i) => i.issueType === 'unclear_description').length;
    coherence -= unclaarDescIssues * 5;

    // Clarity: deduct for items without descriptions
    let clarity = 100;
    const allItems = [
      ...hierarchy.L1_Strategic_Objective.items,
      ...hierarchy.L2_Strategic_Pillars.items,
      ...hierarchy.L3_Strategic_Tactics.items,
      ...hierarchy.L4_Operational_Tasks.items,
    ];
    const itemsWithoutDesc = allItems.filter((i) => !i.description || i.description.length < 10).length;
    clarity -= (itemsWithoutDesc / allItems.length) * 30;

    return {
      completeness: Math.max(0, completeness),
      balance: Math.max(0, balance),
      coherence: Math.max(0, coherence),
      clarity: Math.max(0, clarity),
      overall: Math.max(0, (completeness + balance + coherence + clarity) / 4),
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: DecompositionIssue[], metrics: DecompositionMetrics): string[] {
    const recommendations: string[] = [];

    // Low completeness
    if (metrics.completeness < 75) {
      recommendations.push(
        'Completeness is low. Ensure all hierarchy levels (L2, L3, L4) have items. Consider adding missing decomposition levels.'
      );
    }

    // Low balance
    if (metrics.balance < 75) {
      recommendations.push(
        'Decomposition ratios are unbalanced. Aim for L2: 3-5 per L1, L3: 2-4 per L2, L4: 2-3 per L3. Rebalance by merging or splitting items.'
      );
    }

    // Low coherence
    if (metrics.coherence < 75) {
      const unclearIssues = issues.filter((i) => i.issueType === 'unclear_description').length;
      if (unclearIssues > 0) {
        recommendations.push(
          `${unclearIssues} items have unclear relationships to their parents. Review and clarify descriptions to show logical flow.`
        );
      }
    }

    // Low clarity
    if (metrics.clarity < 75) {
      recommendations.push('Several items lack clear descriptions. Add specific, actionable descriptions for all items to improve clarity.');
    }

    // Broken dependencies
    const brokenDeps = issues.filter((i) => i.issueType === 'broken_dependency').length;
    if (brokenDeps > 0) {
      recommendations.push(`Fix ${brokenDeps} broken dependency references. Remove invalid dependencies or add missing items.`);
    }

    // Orphaned items
    const orphaned = issues.filter((i) => i.issueType === 'orphaned_item').length;
    if (orphaned > 0) {
      recommendations.push(
        `${orphaned} items appear orphaned. Either connect them to the hierarchy via dependencies or remove if unnecessary.`
      );
    }

    return recommendations;
  }

  /**
   * Calculate semantic relatedness between two text strings (0-1)
   * Simple implementation: shared word count / total words
   */
  private findRelatedTerms(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Suggest rebalancing actions
   */
  suggestRebalancing(hierarchy: StrategyHierarchy): Array<{ action: string; target: string; reason: string }> {
    const suggestions: Array<{ action: string; target: string; reason: string }> = [];

    const l2Count = hierarchy.L2_Strategic_Pillars.items.length;
    const l3Count = hierarchy.L3_Strategic_Tactics.items.length;
    const l4Count = hierarchy.L4_Operational_Tasks.items.length;

    // Suggest merging if too many L2 items
    if (l2Count > 5) {
      suggestions.push({
        action: 'merge',
        target: 'L2_Strategic_Pillars',
        reason: `Too many pillars (${l2Count}). Consider merging related pillars to simplify hierarchy.`,
      });
    }

    // Suggest adding if too few L3 items
    if (l3Count < l2Count * 2) {
      suggestions.push({
        action: 'add',
        target: 'L3_Strategic_Tactics',
        reason: `Not enough tactics (${l3Count}). Each pillar should decompose into 2-4 tactics. Add more tactics.`,
      });
    }

    // Suggest adding if too few L4 items
    if (l4Count < l3Count * 1.5) {
      suggestions.push({
        action: 'add',
        target: 'L4_Operational_Tasks',
        reason: `Not enough tasks (${l4Count}). Each tactic should decompose into 2-3 tasks. Add more tasks.`,
      });
    }

    // Suggest splitting if L4 items are too many
    if (l4Count > l3Count * 4) {
      suggestions.push({
        action: 'split',
        target: 'L3_Strategic_Tactics',
        reason: `Too many tasks per tactic. Consider splitting some L3 tactics to better distribute work.`,
      });
    }

    return suggestions;
  }

  /**
   * Calculate decomposition cost estimate (effort across all levels)
   */
  estimateDecompositionCost(hierarchy: StrategyHierarchy): {
    totalHours: number;
    byLevel: { level: number; hours: number }[];
  } {
    const byLevel: { level: number; hours: number }[] = [];

    [hierarchy.L1_Strategic_Objective, hierarchy.L2_Strategic_Pillars, hierarchy.L3_Strategic_Tactics, hierarchy.L4_Operational_Tasks].forEach(
      (level, idx) => {
        const hours = level.items.reduce((sum, item) => sum + item.estimatedDuration / 60, 0);
        byLevel.push({
          level: idx + 1,
          hours,
        });
      }
    );

    const totalHours = byLevel.reduce((sum, item) => sum + item.hours, 0);

    return {
      totalHours,
      byLevel,
    };
  }
}

export const strategicDecompositionModel = new StrategicDecompositionModel();
