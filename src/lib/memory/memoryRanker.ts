/**
 * Memory Ranker - Relevance scoring and prioritization system
 *
 * Implements multi-factor relevance scoring for intelligent memory ranking
 * based on importance, confidence, temporal decay, frequency, and context.
 *
 * @module lib/memory/memoryRanker
 */

/**
 * Memory with computed ranking metadata
 */
export interface RankedMemory {
  /** UUID of memory */
  id: string;

  /** Memory type classification */
  memoryType: string;

  /** Core recall priority (importance * confidence / 10) */
  recallPriority: number;

  /** Importance score (0-100) */
  importance: number;

  /** Confidence score (0-100) */
  confidence: number;

  /** When memory was created */
  createdAt: string;

  /** How many times memory has been accessed */
  accessCount?: number;

  /** Computed relevance score (0-100) */
  relevanceScore: number;

  /** Breakdown of relevance score components */
  scoreBreakdown: {
    /** Contribution from importance and confidence */
    recallPriority: number;

    /** Contribution from temporal decay */
    temporalDecay: number;

    /** Contribution from access frequency */
    accessFrequency: number;

    /** Contribution from memory type priority */
    typeWeight: number;
  };

  /** Rank position in sorted list */
  rank: number;

  /** Percentile among similar memories (0-100) */
  percentile: number;
}

/**
 * Request to rank and score memories
 */
export interface RankingRequest {
  /** Memories to rank */
  memories: Array<{
    id: string;
    memoryType: string;
    importance: number;
    confidence: number;
    createdAt: string;
    accessCount?: number;
    recallPriority: number;
  }>;

  /** Context for ranking (affects type weighting) */
  context?: {
    /** Query being answered (affects type preference) */
    query?: string;

    /** Agent requesting ranking (affects type priority) */
    sourceAgent?: string;

    /** Preferred memory types for this context */
    preferredMemoryTypes?: string[];
  };

  /** Time now (for temporal calculations) */
  now?: Date;
}

/**
 * Response from ranking operation
 */
export interface RankingResponse {
  /** Ranked memories sorted by relevance score descending */
  rankedMemories: RankedMemory[];

  /** Scoring strategy explanation */
  strategy: string;

  /** Timestamp of ranking */
  timestamp: string;
}

/**
 * Configuration for memory type weighting
 *
 * Different memory types have different value for different agents.
 * These weights are adjustable for different use cases.
 */
interface MemoryTypeWeights {
  plan: number;
  step: number;
  reasoning_trace: number;
  decision: number;
  uncertainty: number;
  outcome: number;
  lesson: number;
  pattern: number;
  signal: number;
  contact_insight: number;
  campaign_result: number;
  content_performance: number;
  loyalty_transaction: number;
  monitoring_event: number;
  audit_log: number;
  [key: string]: number; // For custom types
}

/**
 * MemoryRanker - Multi-factor relevance scoring system
 *
 * Scores memories based on:
 * 1. Recall Priority (50%) - importance * confidence normalized
 * 2. Temporal Decay (20%) - exponential decay over time
 * 3. Access Frequency (15%) - how often the memory is used
 * 4. Memory Type Weight (15%) - contextual type importance
 */
export class MemoryRanker {
  /**
   * Default memory type weights
   *
   * Higher weights = more valuable type for general ranking.
   * These can be overridden per agent in context.
   */
  private defaultTypeWeights: MemoryTypeWeights = {
    lesson: 100, // Learned insights are most valuable
    pattern: 95, // Recognized patterns help avoid repeating mistakes
    decision: 90, // Past decisions provide context
    reasoning_trace: 85, // Reasoning traces explain decisions
    outcome: 80, // Actual outcomes validate memories
    plan: 75, // Plans show intent and strategy
    contact_insight: 70, // Contact intelligence drives personalization
    campaign_result: 65, // Campaign results guide strategy
    content_performance: 65, // Content performance informs generation
    uncertainty: 60, // Uncertainties flag items needing verification
    step: 50, // Individual steps are less valuable than outcomes
    loyalty_transaction: 45, // Loyalty events are transactional
    monitoring_event: 40, // System events are informational
    signal: 35, // Signals are flags (handled separately)
    audit_log: 25, // Audit logs are for compliance only
  };

  /**
   * Get memory type weights for a given context
   *
   * Allows different agents to prioritize different memory types.
   * For example, content-agent prioritizes content_performance,
   * while orchestrator prioritizes outcomes and lessons.
   */
  private getTypeWeights(sourceAgent?: string): MemoryTypeWeights {
    const weights = { ...this.defaultTypeWeights };

    // Agent-specific weights
    if (sourceAgent === 'content-agent') {
      weights.content_performance = 100;
      weights.contact_insight = 95;
      weights.lesson = 85;
    } else if (sourceAgent === 'email-agent') {
      weights.contact_insight = 100;
      weights.campaign_result = 95;
      weights.outcome = 85;
    } else if (sourceAgent === 'orchestrator') {
      weights.decision = 100;
      weights.outcome = 95;
      weights.pattern = 90;
      weights.lesson = 85;
    }

    return weights;
  }

  /**
   * Compute temporal decay score (0-100)
   *
   * Uses exponential decay with 30-day half-life:
   * - At 30 days: 50 points
   * - At 60 days: 25 points
   * - At 90 days: 12 points
   *
   * Never goes below 5 points (old memories still have some value)
   */
  private computeTemporalDecay(createdAtIso: string, now: Date): number {
    const createdAt = new Date(createdAtIso).getTime();
    const nowMs = now.getTime();
    const ageMs = nowMs - createdAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Exponential decay: score = 100 * 2^(-age/30)
    const decayScore = 100 * Math.pow(2, -ageDays / 30);

    // Minimum 5 to preserve old wisdom
    return Math.max(5, decayScore);
  }

  /**
   * Compute access frequency score (0-100)
   *
   * Normalizes access count to 0-100 scale using logarithmic scale
   * to avoid over-weighting frequently accessed memories.
   *
   * - 1 access: 33 points
   * - 10 accesses: 67 points
   * - 100 accesses: 100 points
   */
  private computeAccessFrequency(accessCount: number = 0): number {
    if (accessCount === 0) return 0;

    // Logarithmic scale: score = 33.3 * log10(accessCount + 1)
    // At accessCount=1: log10(2) ≈ 0.301 → ~10 points
    // At accessCount=10: log10(11) ≈ 1.041 → ~35 points
    // At accessCount=100: log10(101) ≈ 2.004 → ~67 points
    // At accessCount=1000: log10(1001) ≈ 3.0 → ~100 points

    const score = 33.3 * Math.log10(accessCount + 1);
    return Math.min(100, score);
  }

  /**
   * Compute memory type weight (0-100)
   *
   * Returns contextual weight for memory type.
   * Types not in weights map default to 50 (neutral).
   */
  private computeTypeWeight(
    memoryType: string,
    typeWeights: MemoryTypeWeights
  ): number {
    return typeWeights[memoryType] || 50;
  }

  /**
   * Compute final relevance score from components
   *
   * Weighted combination:
   * - Recall Priority: 50% (importance * confidence)
   * - Temporal Decay: 20%
   * - Access Frequency: 15%
   * - Type Weight: 15%
   */
  private computeFinalScore(
    recallPriority: number,
    temporalDecay: number,
    accessFrequency: number,
    typeWeight: number
  ): { score: number; breakdown: RankedMemory['scoreBreakdown'] } {
    const breakdown: RankedMemory['scoreBreakdown'] = {
      recallPriority: (recallPriority / 100) * 50,
      temporalDecay: (temporalDecay / 100) * 20,
      accessFrequency: (accessFrequency / 100) * 15,
      typeWeight: (typeWeight / 100) * 15,
    };

    const score =
      breakdown.recallPriority +
      breakdown.temporalDecay +
      breakdown.accessFrequency +
      breakdown.typeWeight;

    return {
      score: Math.min(100, Math.max(0, score)),
      breakdown,
    };
  }

  /**
   * Rank a collection of memories by relevance score
   *
   * Computes multi-factor relevance scores and returns ranked list
   * with detailed scoring breakdown for transparency.
   *
   * @example
   * ```typescript
   * const ranker = new MemoryRanker();
   * const result = await ranker.rank({
   *   memories: [
   *     { id: 'mem1', memoryType: 'lesson', importance: 90, confidence: 85, ... },
   *     { id: 'mem2', memoryType: 'step', importance: 60, confidence: 70, ... }
   *   ],
   *   context: {
   *     sourceAgent: 'content-agent',
   *     query: 'engagement strategies'
   *   }
   * });
   * ```
   */
  async rank(request: RankingRequest): Promise<RankingResponse> {
    if (!request.memories || request.memories.length === 0) {
      return {
        rankedMemories: [],
        strategy: 'empty_input',
        timestamp: new Date().toISOString(),
      };
    }

    const now = request.now || new Date();
    const typeWeights = this.getTypeWeights(request.context?.sourceAgent);

    // Compute scores for all memories
    const scored: RankedMemory[] = request.memories.map(mem => {
      const temporalDecay = this.computeTemporalDecay(mem.createdAt, now);
      const accessFrequency = this.computeAccessFrequency(mem.accessCount);
      const typeWeight = this.computeTypeWeight(mem.memoryType, typeWeights);

      const { score: relevanceScore, breakdown } = this.computeFinalScore(
        mem.recallPriority,
        temporalDecay,
        accessFrequency,
        typeWeight
      );

      return {
        id: mem.id,
        memoryType: mem.memoryType,
        recallPriority: mem.recallPriority,
        importance: mem.importance,
        confidence: mem.confidence,
        createdAt: mem.createdAt,
        accessCount: mem.accessCount,
        relevanceScore,
        scoreBreakdown: breakdown,
        rank: 0, // Will be set after sorting
        percentile: 0, // Will be computed after sorting
      };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Assign rank and percentile
    scored.forEach((mem, index) => {
      mem.rank = index + 1;
      mem.percentile = Math.round(((request.memories.length - index - 1) / request.memories.length) * 100);
    });

    return {
      rankedMemories: scored,
      strategy: 'multi_factor_ranking_50_20_15_15',
      timestamp: now.toISOString(),
    };
  }

  /**
   * Sort memories by a specific factor
   *
   * Useful for understanding which memories score high in specific dimensions.
   */
  sortByFactor(
    rankedMemories: RankedMemory[],
    factor: keyof RankedMemory['scoreBreakdown']
  ): RankedMemory[] {
    return [...rankedMemories].sort((a, b) => {
      const aScore = a.scoreBreakdown[factor];
      const bScore = b.scoreBreakdown[factor];
      return bScore - aScore;
    });
  }

  /**
   * Filter memories by relevance threshold
   *
   * Returns only memories scoring above the threshold.
   */
  filterByThreshold(memories: RankedMemory[], threshold: number): RankedMemory[] {
    return memories.filter(mem => mem.relevanceScore >= threshold);
  }

  /**
   * Get summary statistics about ranked memories
   */
  getStats(rankedMemories: RankedMemory[]): {
    totalMemories: number;
    averageScore: number;
    medianScore: number;
    maxScore: number;
    minScore: number;
    scoreDistribution: { [range: string]: number };
  } {
    if (rankedMemories.length === 0) {
      return {
        totalMemories: 0,
        averageScore: 0,
        medianScore: 0,
        maxScore: 0,
        minScore: 0,
        scoreDistribution: {},
      };
    }

    const scores = rankedMemories.map(m => m.relevanceScore);
    const sorted = [...scores].sort((a, b) => a - b);

    // Compute percentiles
    const distribution: { [range: string]: number } = {
      '0-20': 0,
      '20-40': 0,
      '40-60': 0,
      '60-80': 0,
      '80-100': 0,
    };

    scores.forEach(score => {
      if (score < 20) distribution['0-20']++;
      else if (score < 40) distribution['20-40']++;
      else if (score < 60) distribution['40-60']++;
      else if (score < 80) distribution['60-80']++;
      else distribution['80-100']++;
    });

    return {
      totalMemories: rankedMemories.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      medianScore: sorted[Math.floor(sorted.length / 2)],
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      scoreDistribution: distribution,
    };
  }
}

/**
 * Factory function to create a MemoryRanker instance
 */
export function createMemoryRanker(): MemoryRanker {
  return new MemoryRanker();
}

/**
 * Singleton instance for direct imports
 */
export const memoryRanker = createMemoryRanker();
