/**
 * Memory Retriever - Hybrid recall engine for Living Intelligence Foundation
 *
 * Implements multi-modal memory retrieval combining keyword search, semantic
 * similarity, temporal decay, and relationship traversal for intelligent
 * context assembly across agent operations.
 *
 * @module lib/memory/memoryRetriever
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Retrieved memory entry with scoring metadata
 */
export interface RetrievedMemory {
  /** UUID of the memory */
  id: string;

  /** Classification of memory type */
  memoryType: string;

  /** Memory content as JSON */
  content: Record<string, any>;

  /** Computed recall priority (0-100) */
  recallPriority: number;

  /** Importance score (0-100) */
  importance: number;

  /** Confidence score (0-100) */
  confidence: number;

  /** Keywords associated with memory */
  keywords: string[];

  /** When memory was created */
  createdAt: string;

  /** When memory was last updated */
  updatedAt: string;

  /** Relevance score from retrieval query (0-100) */
  relevanceScore: number;

  /** Source system that created memory */
  source: string;

  /** Agent that created memory */
  agent: string;

  /** Uncertainty notes if any */
  uncertaintyNotes?: string;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Request to retrieve relevant memories
 */
export interface RetrieveRequest {
  /** UUID of workspace */
  workspaceId: string;

  /** Query string for keyword search */
  query: string;

  /** Memory types to filter by (optional) */
  memoryTypes?: string[];

  /** Maximum results to return (default 10, max 100) */
  limit?: number;

  /** Offset for pagination (default 0) */
  offset?: number;

  /** Minimum importance threshold (0-100) */
  minImportance?: number;

  /** Minimum confidence threshold (0-100) */
  minConfidence?: number;

  /** Whether to include related memories (default true) */
  includeRelated?: boolean;
}

/**
 * Related memory for connection analysis
 */
export interface RelatedMemory extends RetrievedMemory {
  /** Type of relationship to parent memory */
  relationshipType: string;

  /** Strength of relationship (0-100) */
  relationshipStrength: number;
}

/**
 * Response from memory retrieval
 */
export interface RetrieveResponse {
  /** Primary retrieved memories */
  memories: RetrievedMemory[];

  /** Related memories through relationship graph (if requested) */
  relatedMemories: RelatedMemory[];

  /** Total matching memories (for pagination) */
  totalCount: number;

  /** Query execution time in milliseconds */
  executionTimeMs: number;

  /** Retrieval strategy used */
  retrievalStrategy: string;
}

/**
 * Request to find memories by relationship
 */
export interface FindRelatedRequest {
  /** UUID of workspace */
  workspaceId: string;

  /** Memory UUID to find relationships from */
  memoryId: string;

  /** Relationship types to traverse (optional) */
  relationshipTypes?: string[];

  /** Maximum depth in relationship graph (default 2) */
  maxDepth?: number;

  /** Maximum results per depth level (default 5) */
  limitPerDepth?: number;
}

/**
 * Relationship graph traversal result
 */
export interface RelationshipGraph {
  /** Root memory being analyzed */
  rootMemoryId: string;

  /** Memories connected through relationships, grouped by depth */
  byDepth: {
    [depth: number]: RelatedMemory[];
  };

  /** Total related memories found */
  totalRelated: number;

  /** Relationship types discovered */
  relationshipTypesCovered: string[];
}

/**
 * MemoryRetriever - Hybrid recall engine with multiple retrieval modes
 *
 * Implements intelligent memory retrieval combining:
 * - Keyword-based search with full-text matching
 * - Semantic similarity (via embeddings when available)
 * - Temporal decay (older memories score lower)
 * - Relationship traversal (connected memories)
 * - Score-based filtering and ranking
 */
export class MemoryRetriever {
  /**
   * Normalize relevance score based on temporal decay
   *
   * Memories decay in relevance over time using exponential decay.
   * Half-life: 30 days (older memories have 50% relevance after 30 days)
   */
  private computeTemporalDecay(createdAtIso: string): number {
    const createdAt = new Date(createdAtIso).getTime();
    const now = Date.now();
    const ageMs = now - createdAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Exponential decay: decay = 2^(-age/30)
    // At 30 days: decay ≈ 0.5
    // At 60 days: decay ≈ 0.25
    const decay = Math.pow(2, -ageDays / 30);
    return Math.max(0.1, decay); // Don't go below 0.1 (10%)
  }

  /**
   * Combine multiple relevance signals into final score
   *
   * Weights:
   * - Recall priority: 50%
   * - Temporal decay: 20%
   * - Keyword match quality: 20%
   * - Confidence: 10%
   */
  private computeFinalRelevance(
    recallPriority: number,
    createdAt: string,
    keywordMatchScore: number,
    confidence: number
  ): number {
    const temporalDecay = this.computeTemporalDecay(createdAt);

    const final =
      recallPriority * 0.5 +
      temporalDecay * 100 * 0.2 +
      keywordMatchScore * 0.2 +
      confidence * 0.1;

    return Math.min(100, Math.max(0, final));
  }

  /**
   * Score keyword match quality
   *
   * Evaluates how well memory matches the query based on:
   * - Exact keyword matches
   * - Partial matches
   * - Content text matching
   */
  private scoreKeywordMatch(
    keywords: string[] | null,
    content: Record<string, any>,
    query: string
  ): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentText = JSON.stringify(content).toLowerCase();
    let matches = 0;

    // Check keyword matches
    if (keywords) {
      queryTerms.forEach(term => {
        if (keywords.some(kw => kw.includes(term) || term.includes(kw))) {
          matches += 2; // Exact/partial keyword match
        }
      });
    }

    // Check content text matches
    queryTerms.forEach(term => {
      if (contentText.includes(term)) {
        matches += 1; // Content text match
      }
    });

    // Normalize to 0-100
    const maxPossible = queryTerms.length * 3;
    return Math.min(100, (matches / maxPossible) * 100);
  }

  /**
   * Retrieve memories matching a query with hybrid ranking
   *
   * Uses combined scoring of recall priority, temporal decay, keyword matching,
   * and confidence to rank results intelligently.
   *
   * @example
   * ```typescript
   * const retriever = new MemoryRetriever();
   * const result = await retriever.retrieve({
   *   workspaceId: 'ws-123',
   *   query: 'user engagement strategies',
   *   memoryTypes: ['lesson', 'pattern'],
   *   limit: 10
   * });
   * ```
   */
  async retrieve(request: RetrieveRequest): Promise<RetrieveResponse> {
    const supabase = await getSupabaseServer();
    const startTime = Date.now();

    // Validate
    if (!request.workspaceId) throw new Error('workspaceId is required');
    if (!request.query) throw new Error('query is required');

    const limit = Math.min(request.limit || 10, 100);
    const offset = request.offset || 0;
    const minImportance = request.minImportance ?? 0;
    const minConfidence = request.minConfidence ?? 0;
    const includeRelated = request.includeRelated !== false;

    // Build query to get relevant memories
    let query = supabase
      .from('ai_memory')
      .select('*', { count: 'exact' })
      .eq('workspace_id', request.workspaceId)
      .eq('is_redacted', false)
      .gte('importance', minImportance)
      .gte('confidence', minConfidence)
      .order('recall_priority', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by memory types if specified
    if (request.memoryTypes && request.memoryTypes.length > 0) {
      query = query.in('memory_type', request.memoryTypes);
    }

    const { data: memories, count, error } = await query;

    if (error) {
      console.error('Error retrieving memories:', error);
      throw new Error(`Failed to retrieve memories: ${error.message}`);
    }

    // Post-process: compute final relevance scores
    const rankedMemories: RetrievedMemory[] = (memories || [])
      .map(mem => ({
        id: mem.id,
        memoryType: mem.memory_type,
        content: mem.content,
        recallPriority: mem.recall_priority,
        importance: mem.importance,
        confidence: mem.confidence,
        keywords: mem.keywords || [],
        createdAt: mem.created_at,
        updatedAt: mem.updated_at,
        source: mem.source,
        agent: mem.agent,
        uncertaintyNotes: mem.uncertainty_notes,
        metadata: mem.metadata,
        relevanceScore: this.computeFinalRelevance(
          mem.recall_priority,
          mem.created_at,
          this.scoreKeywordMatch(mem.keywords, mem.content, request.query),
          mem.confidence
        ),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Get related memories if requested
    let relatedMemories: RelatedMemory[] = [];
    if (includeRelated && rankedMemories.length > 0) {
      // Fetch memories related to top results
      const topMemoryIds = rankedMemories.slice(0, 3).map(m => m.id);

      const { data: links, error: linksError } = await supabase
        .from('ai_memory_links')
        .select(
          `
          id,
          relationship,
          strength,
          linked_memory_id,
          linked_memory:ai_memory!linked_memory_id(*)
        `
        )
        .in('memory_id', topMemoryIds)
        .order('strength', { ascending: false })
        .limit(10);

      if (!linksError && links) {
        relatedMemories = links
          .filter(link => link.linked_memory)
          .map(link => {
            const mem = link.linked_memory;
            return {
              id: mem.id,
              memoryType: mem.memory_type,
              content: mem.content,
              recallPriority: mem.recall_priority,
              importance: mem.importance,
              confidence: mem.confidence,
              keywords: mem.keywords || [],
              createdAt: mem.created_at,
              updatedAt: mem.updated_at,
              source: mem.source,
              agent: mem.agent,
              uncertaintyNotes: mem.uncertainty_notes,
              metadata: mem.metadata,
              relevanceScore: this.computeFinalRelevance(
                mem.recall_priority,
                mem.created_at,
                this.scoreKeywordMatch(mem.keywords, mem.content, request.query),
                mem.confidence
              ),
              relationshipType: link.relationship,
              relationshipStrength: link.strength || 50,
            };
          });
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      memories: rankedMemories,
      relatedMemories,
      totalCount: count || 0,
      executionTimeMs: executionTime,
      retrievalStrategy: 'hybrid_keyword_temporal_recall',
    };
  }

  /**
   * Find memories related to a specific memory through relationship graph
   *
   * Traverses the relationship graph to discover connected memories at
   * various depths, useful for context assembly and knowledge discovery.
   *
   * @example
   * ```typescript
   * const graph = await retriever.findRelated({
   *   workspaceId: 'ws-123',
   *   memoryId: 'mem-456',
   *   maxDepth: 2,
   *   limitPerDepth: 5
   * });
   * ```
   */
  async findRelated(request: FindRelatedRequest): Promise<RelationshipGraph> {
    const supabase = await getSupabaseServer();

    if (!request.workspaceId) throw new Error('workspaceId is required');
    if (!request.memoryId) throw new Error('memoryId is required');

    const maxDepth = request.maxDepth || 2;
    const limitPerDepth = request.limitPerDepth || 5;

    const byDepth: { [depth: number]: RelatedMemory[] } = {};
    const visited = new Set<string>();
    const relationshipTypes = new Set<string>();
    let totalRelated = 0;

    // BFS traversal of relationship graph
    const queue: Array<{ memoryId: string; depth: number }> = [
      { memoryId: request.memoryId, depth: 0 },
    ];

    visited.add(request.memoryId);

    while (queue.length > 0 && Object.keys(byDepth).length < maxDepth) {
      const current = queue.shift();
      if (!current || current.depth >= maxDepth) continue;

      const nextDepth = current.depth + 1;

      // Get related memories at this depth
      const { data: links, error } = await supabase
        .from('ai_memory_links')
        .select(
          `
          id,
          relationship,
          strength,
          linked_memory_id,
          linked_memory:ai_memory!linked_memory_id(*)
        `
        )
        .eq('memory_id', current.memoryId)
        .order('strength', { ascending: false })
        .limit(limitPerDepth);

      if (error || !links) continue;

      if (!byDepth[nextDepth]) {
        byDepth[nextDepth] = [];
      }

      links.forEach(link => {
        const memId = link.linked_memory_id;

        if (!visited.has(memId) && byDepth[nextDepth].length < limitPerDepth) {
          visited.add(memId);
          const mem = link.linked_memory;

          if (mem) {
            byDepth[nextDepth].push({
              id: mem.id,
              memoryType: mem.memory_type,
              content: mem.content,
              recallPriority: mem.recall_priority,
              importance: mem.importance,
              confidence: mem.confidence,
              keywords: mem.keywords || [],
              createdAt: mem.created_at,
              updatedAt: mem.updated_at,
              source: mem.source,
              agent: mem.agent,
              uncertaintyNotes: mem.uncertainty_notes,
              metadata: mem.metadata,
              relevanceScore: mem.recall_priority, // Use recall priority as relevance
              relationshipType: link.relationship,
              relationshipStrength: link.strength || 50,
            });

            relationshipTypes.add(link.relationship);
            totalRelated++;
            queue.push({ memoryId: memId, depth: nextDepth });
          }
        }
      });
    }

    return {
      rootMemoryId: request.memoryId,
      byDepth,
      totalRelated,
      relationshipTypesCovered: Array.from(relationshipTypes),
    };
  }

  /**
   * Find memories with unresolved signals requiring attention
   *
   * Returns memories that have been flagged with high-priority signals
   * such as risks, low confidence, or approval requirements.
   */
  async findWithSignals(
    workspaceId: string,
    signalTypes?: string[],
    limit: number = 20
  ): Promise<Array<RetrievedMemory & { signals: any[] }>> {
    const supabase = await getSupabaseServer();

    if (!workspaceId) throw new Error('workspaceId is required');

    // Get unresolved signals
    let query = supabase
      .from('ai_memory_signals')
      .select(
        `
        id,
        signal_type,
        signal_value,
        source_agent,
        created_at,
        memory:ai_memory(*)
      `
      )
      .eq('workspace_id', workspaceId)
      .eq('is_resolved', false)
      .order('signal_value', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (signalTypes && signalTypes.length > 0) {
      query = query.in('signal_type', signalTypes);
    }

    const { data: signals, error } = await query;

    if (error) {
      console.error('Error finding signals:', error);
      throw new Error(`Failed to find signals: ${error.message}`);
    }

    // Group by memory
    const memorySignals: { [memId: string]: any[] } = {};
    const memoryDetails: { [memId: string]: any } = {};

    (signals || []).forEach(sig => {
      const mem = sig.memory;
      if (!memorySignals[mem.id]) {
        memorySignals[mem.id] = [];
        memoryDetails[mem.id] = mem;
      }
      memorySignals[mem.id].push({
        id: sig.id,
        signalType: sig.signal_type,
        signalValue: sig.signal_value,
        sourceAgent: sig.source_agent,
        createdAt: sig.created_at,
      });
    });

    return Object.entries(memoryDetails).map(([memId, mem]) => ({
      id: mem.id,
      memoryType: mem.memory_type,
      content: mem.content,
      recallPriority: mem.recall_priority,
      importance: mem.importance,
      confidence: mem.confidence,
      keywords: mem.keywords || [],
      createdAt: mem.created_at,
      updatedAt: mem.updated_at,
      source: mem.source,
      agent: mem.agent,
      uncertaintyNotes: mem.uncertainty_notes,
      metadata: mem.metadata,
      relevanceScore: mem.recall_priority,
      signals: memorySignals[memId],
    }));
  }
}

/**
 * Factory function to create a MemoryRetriever instance
 */
export function createMemoryRetriever(): MemoryRetriever {
  return new MemoryRetriever();
}

/**
 * Singleton instance for direct imports
 */
export const memoryRetriever = createMemoryRetriever();
