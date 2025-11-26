/**
 * Coalition Archive Bridge
 *
 * Stores coalition formation decisions, detects coalition patterns,
 * measures coalition effectiveness, and provides insights to calibration engine.
 */

import { memoryStore } from '@/lib/memory';

export interface CoalitionArchiveEntry {
  coalitionId: string;
  taskId: string;
  agentIds: string[];
  synergyScore: number;
  outcome: 'success' | 'partial_success' | 'failure';
  executionTime: number;
  completedAt: string;
  patternType: CoalitionPatternType;
  memberContributions: Record<string, number>;
  safetyVetoes: string[];
}

export type CoalitionPatternType =
  | 'high_synergy_coalition'
  | 'repeated_success_coalition'
  | 'role_conflict_coalition'
  | 'overloaded_coalition'
  | 'safety_filtered_coalition';

export interface CoalitionPattern {
  patternType: CoalitionPatternType;
  occurrenceCount: number;
  averageSynergy: number;
  successRate: number;
  averageExecutionTime: number;
  agentCombinations: string[][];
  insights: string[];
}

export interface CoalitionAnalytics {
  totalCoalitions: number;
  successfulCoalitions: number;
  failedCoalitions: number;
  averageSynergy: number;
  detectedPatterns: CoalitionPattern[];
  mostEffectiveAgentPairs: Array<{ agents: string[]; successRate: number }>;
  mostEffectiveLeaders: Array<{ agentId: string; coalitionCount: number; successRate: number }>;
}

/**
 * Coalition Archive Bridge - Pattern detection and analytics
 */
export class CoalitionArchiveBridge {
  private coalitionArchive: Map<string, CoalitionArchiveEntry> = new Map();
  private patterns: Map<CoalitionPatternType, CoalitionPattern> = new Map();

  /**
   * Archive a coalition formation decision and outcome
   */
  async archiveCoalition(entry: CoalitionArchiveEntry): Promise<void> {
    // Store in memory
    this.coalitionArchive.set(entry.coalitionId, entry);

    // Detect patterns
    await this.detectAndRecordPattern(entry);

    // Persist to memory store
    try {
      const archive = await memoryStore.retrieve('coalitions_archive', {});

      if (!archive.entries) {
        archive.entries = [];
      }

      archive.entries.push(entry);
      await memoryStore.store('coalitions_archive', archive);
    } catch (error) {
      console.error('Error archiving coalition to memory store:', error);
    }
  }

  /**
   * Detect coalition patterns
   */
  private async detectAndRecordPattern(entry: CoalitionArchiveEntry): Promise<void> {
    // Pattern 1: High Synergy Coalition
    if (entry.synergyScore >= 80) {
      this.recordPattern('high_synergy_coalition', entry);
    }

    // Pattern 2: Repeated Success Coalition
    const sameAgentCoalitions = Array.from(this.coalitionArchive.values()).filter(
      (c) =>
        c.agentIds.every((a) => entry.agentIds.includes(a)) ||
        entry.agentIds.every((a) => c.agentIds.includes(a))
    );

    if (sameAgentCoalitions.length >= 3) {
      const successCount = sameAgentCoalitions.filter((c) => c.outcome === 'success').length;
      if (successCount / sameAgentCoalitions.length >= 0.8) {
        this.recordPattern('repeated_success_coalition', entry);
      }
    }

    // Pattern 3: Role Conflict Coalition
    // Inferred from execution stats (would come from lifecycle manager)
    // Placeholder: flag if execution time was unexpectedly long
    if (entry.executionTime > 300000) {
      // > 5 minutes = potential role conflict
      this.recordPattern('role_conflict_coalition', entry);
    }

    // Pattern 4: Overloaded Coalition
    // If any member has very high contribution score, others are lagging
    const contributions = Object.values(entry.memberContributions);
    const maxContribution = Math.max(...contributions);
    const avgContribution = contributions.reduce((a, b) => a + b, 0) / contributions.length;

    if (maxContribution > avgContribution * 1.5) {
      this.recordPattern('overloaded_coalition', entry);
    }

    // Pattern 5: Safety Filtered Coalition
    if (entry.safetyVetoes.length > 0) {
      this.recordPattern('safety_filtered_coalition', entry);
    }
  }

  /**
   * Record pattern occurrence
   */
  private recordPattern(patternType: CoalitionPatternType, entry: CoalitionArchiveEntry): void {
    let pattern = this.patterns.get(patternType);

    if (!pattern) {
      pattern = {
        patternType,
        occurrenceCount: 0,
        averageSynergy: 0,
        successRate: 0,
        averageExecutionTime: 0,
        agentCombinations: [],
        insights: [],
      };
    }

    // Update statistics
    pattern.occurrenceCount++;
    pattern.averageSynergy = (pattern.averageSynergy * (pattern.occurrenceCount - 1) + entry.synergyScore) / pattern.occurrenceCount;

    const isSuccess = entry.outcome === 'success' ? 1 : entry.outcome === 'partial_success' ? 0.5 : 0;
    pattern.successRate = (pattern.successRate * (pattern.occurrenceCount - 1) + isSuccess) / pattern.occurrenceCount;

    pattern.averageExecutionTime = (pattern.averageExecutionTime * (pattern.occurrenceCount - 1) + entry.executionTime) / pattern.occurrenceCount;

    // Track agent combinations
    const agentKey = entry.agentIds.sort().join(',');
    if (!pattern.agentCombinations.find((c) => c.join(',') === agentKey)) {
      pattern.agentCombinations.push(entry.agentIds);
    }

    // Generate insights
    pattern.insights = this.generatePatternInsights(pattern, entry);

    this.patterns.set(patternType, pattern);
  }

  /**
   * Generate insights from pattern data
   */
  private generatePatternInsights(pattern: CoalitionPattern, latestEntry: CoalitionArchiveEntry): string[] {
    const insights: string[] = [];

    switch (pattern.patternType) {
      case 'high_synergy_coalition':
        if (pattern.successRate >= 0.9) {
          insights.push(
            `High synergy coalitions show ${(pattern.successRate * 100).toFixed(0)}% success rate - highly effective strategy`
          );
        }
        break;

      case 'repeated_success_coalition':
        insights.push(
          `This agent combination has succeeded ${pattern.occurrenceCount} times - recommend keeping together`
        );
        break;

      case 'role_conflict_coalition':
        insights.push(
          `Role conflicts detected (avg execution: ${(pattern.averageExecutionTime / 1000).toFixed(0)}s) - review role assignments`
        );
        break;

      case 'overloaded_coalition':
        insights.push(`Coalition shows uneven load distribution - consider redistributing responsibilities`);
        break;

      case 'safety_filtered_coalition':
        insights.push(
          `${latestEntry.safetyVetoes.length} agents were filtered for safety - consider higher-risk-tolerance coalition`
        );
        break;
    }

    return insights;
  }

  /**
   * Get analytics across all archived coalitions
   */
  async generateCoalitionAnalytics(): Promise<CoalitionAnalytics> {
    const entries = Array.from(this.coalitionArchive.values());

    if (entries.length === 0) {
      return {
        totalCoalitions: 0,
        successfulCoalitions: 0,
        failedCoalitions: 0,
        averageSynergy: 0,
        detectedPatterns: [],
        mostEffectiveAgentPairs: [],
        mostEffectiveLeaders: [],
      };
    }

    // Basic counts
    const successfulCoalitions = entries.filter((e) => e.outcome === 'success').length;
    const failedCoalitions = entries.filter((e) => e.outcome === 'failure').length;
    const averageSynergy = entries.reduce((sum, e) => sum + e.synergyScore, 0) / entries.length;

    // Most effective agent pairs
    const agentPairMap = new Map<string, { count: number; successes: number }>();

    for (const entry of entries) {
      for (let i = 0; i < entry.agentIds.length; i++) {
        for (let j = i + 1; j < entry.agentIds.length; j++) {
          const pairKey = [entry.agentIds[i], entry.agentIds[j]].sort().join('|');
          const current = agentPairMap.get(pairKey) || { count: 0, successes: 0 };

          current.count++;
          if (entry.outcome === 'success') current.successes++;

          agentPairMap.set(pairKey, current);
        }
      }
    }

    const mostEffectiveAgentPairs = Array.from(agentPairMap.entries())
      .map(([key, val]) => ({
        agents: key.split('|'),
        successRate: val.successes / val.count,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // Most effective leaders (agents that led successful coalitions)
    const leaderMap = new Map<string, { count: number; successes: number }>();

    for (const entry of entries) {
      if (entry.agentIds.length > 0) {
        const leader = entry.agentIds[0]; // First agent is leader
        const current = leaderMap.get(leader) || { count: 0, successes: 0 };

        current.count++;
        if (entry.outcome === 'success') current.successes++;

        leaderMap.set(leader, current);
      }
    }

    const mostEffectiveLeaders = Array.from(leaderMap.entries())
      .map(([agentId, val]) => ({
        agentId,
        coalitionCount: val.count,
        successRate: val.successes / val.count,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    return {
      totalCoalitions: entries.length,
      successfulCoalitions,
      failedCoalitions,
      averageSynergy,
      detectedPatterns: Array.from(this.patterns.values()),
      mostEffectiveAgentPairs,
      mostEffectiveLeaders,
    };
  }

  /**
   * Get pattern by type
   */
  getPattern(patternType: CoalitionPatternType): CoalitionPattern | undefined {
    return this.patterns.get(patternType);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): CoalitionPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get archive entry count
   */
  getArchiveSize(): number {
    return this.coalitionArchive.size;
  }
}

export const coalitionArchiveBridge = new CoalitionArchiveBridge();
