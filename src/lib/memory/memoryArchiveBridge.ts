/**
 * Memory Archive Bridge - Cross-system integration and synchronization
 *
 * Bridges memory system with other components (agents, orchestrator, monitoring)
 * to ensure unified intelligence substrate and knowledge continuity across
 * all operations.
 *
 * @module lib/memory/memoryArchiveBridge
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore, StoreMemoryRequest } from './memoryStore';
import { MemoryRetriever } from './memoryRetriever';
import { MemoryRanker } from './memoryRanker';

/**
 * Event from an agent operation to be recorded
 */
export interface AgentEvent {
  /** Workspace UUID */
  workspaceId: string;

  /** Name of agent generating event */
  agent: string;

  /** Type of event (outcome, decision, uncertainty, etc) */
  eventType: 'outcome' | 'decision' | 'uncertainty' | 'error' | 'lesson' | 'warning';

  /** Event description */
  description: string;

  /** Structured data for the event */
  data: Record<string, any>;

  /** Importance for this workspace (0-100) */
  importance: number;

  /** Agent's confidence in this event (0-100) */
  confidence: number;

  /** Optional uncertainty disclosure */
  uncertaintyNotes?: string;

  /** Related memory UUIDs for linking */
  relatedMemories?: string[];

  /** Keywords for retrieval */
  keywords?: string[];

  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Request to link agent event to existing memory
 */
export interface LinkEventToMemoryRequest {
  /** Workspace UUID */
  workspaceId: string;

  /** Memory to link to */
  memoryId: string;

  /** Event to link from */
  eventData: AgentEvent;

  /** Type of relationship */
  relationshipType:
    | 'caused_by'
    | 'led_to'
    | 'validates'
    | 'invalidates'
    | 'extends'
    | 'refines';

  /** Relationship strength (0-100) */
  relationshipStrength?: number;
}

/**
 * Checkpoint for workflow resumption
 */
export interface WorkflowCheckpoint {
  /** Unique checkpoint ID */
  checkpointId: string;

  /** Workspace UUID */
  workspaceId: string;

  /** Workflow/orchestrator instance ID */
  workflowId: string;

  /** Current step in workflow */
  currentStep: number;

  /** Total steps in workflow */
  totalSteps: number;

  /** Workflow state (JSON) */
  state: Record<string, any>;

  /** Memories created during workflow */
  memoryIds: string[];

  /** When checkpoint was created */
  createdAt: string;

  /** Optional context about checkpoint */
  context?: Record<string, any>;
}

/**
 * Request to save workflow checkpoint
 */
export interface SaveCheckpointRequest {
  workspaceId: string;
  workflowId: string;
  currentStep: number;
  totalSteps: number;
  state: Record<string, any>;
  memoryIds?: string[];
  context?: Record<string, any>;
}

/**
 * MemoryArchiveBridge - Cross-system integration layer
 *
 * Provides:
 * 1. Event recording from agents to memory system
 * 2. Automatic memory linking and relationship creation
 * 3. Workflow checkpoint management for resumption
 * 4. Intelligence synchronization across systems
 * 5. Historical context assembly for decision-making
 */
export class MemoryArchiveBridge {
  private memoryStore: MemoryStore;
  private memoryRetriever: MemoryRetriever;
  private memoryRanker: MemoryRanker;

  constructor(
    store?: MemoryStore,
    retriever?: MemoryRetriever,
    ranker?: MemoryRanker
  ) {
    this.memoryStore = store || new MemoryStore();
    this.memoryRetriever = retriever || new MemoryRetriever();
    this.memoryRanker = ranker || new MemoryRanker();
  }

  /**
   * Record an agent event to the unified memory system
   *
   * Automatically determines memory type based on event type,
   * extracts keywords, and queues related memory linking.
   *
   * @example
   * ```typescript
   * const bridge = new MemoryArchiveBridge();
   * const result = await bridge.recordEvent({
   *   workspaceId: 'ws-123',
   *   agent: 'content-agent',
   *   eventType: 'outcome',
   *   description: 'Generated 5 personalized emails with 87% relevance',
   *   data: { emailCount: 5, avgRelevance: 0.87 },
   *   importance: 75,
   *   confidence: 90
   * });
   * ```
   */
  async recordEvent(event: AgentEvent): Promise<{
    memoryId: string;
    linkedMemories: string[];
    timestamp: string;
  }> {
    // Map event type to memory type
    const memoryTypeMap: { [key: string]: string } = {
      outcome: 'outcome',
      decision: 'decision',
      uncertainty: 'uncertainty',
      error: 'signal',
      lesson: 'lesson',
      warning: 'signal',
    };

    const memoryType = memoryTypeMap[event.eventType] || 'outcome';

    // Create memory entry
    const storeRequest: StoreMemoryRequest = {
      workspaceId: event.workspaceId,
      agent: event.agent,
      memoryType,
      content: {
        eventType: event.eventType,
        description: event.description,
        data: event.data,
        timestamp: new Date().toISOString(),
      },
      importance: event.importance,
      confidence: event.confidence,
      uncertaintyNotes: event.uncertaintyNotes,
      keywords: event.keywords,
      source: event.agent,
      metadata: event.metadata,
    };

    // Store the memory
    const storeResult = await this.memoryStore.store(storeRequest);
    const memoryId = storeResult.memoryId;

    // Link to related memories if specified
    const linkedMemories: string[] = [];

    if (event.relatedMemories && event.relatedMemories.length > 0) {
      for (const relatedId of event.relatedMemories) {
        try {
          await this.memoryStore.link({
            memoryId,
            linkedMemoryId: relatedId,
            relationship: 'supports',
            strength: 70,
          });
          linkedMemories.push(relatedId);
        } catch (error) {
          console.error(`Failed to link to memory ${relatedId}:`, error);
          // Continue linking others
        }
      }
    }

    // Add signal if this is an error or warning
    if (event.eventType === 'error' || event.eventType === 'warning') {
      const signalValue = event.eventType === 'error' ? 85 : 60;
      await this.memoryStore.addSignal({
        memoryId,
        workspaceId: event.workspaceId,
        signalType: event.eventType === 'error' ? 'anomaly' : 'uncertainty_high',
        signalValue,
        sourceAgent: event.agent,
      });
    }

    return {
      memoryId,
      linkedMemories,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Link an agent event to an existing memory with relationship
   *
   * Useful for establishing connections between new observations
   * and historical patterns or prior decisions.
   *
   * @example
   * ```typescript
   * await bridge.linkEventToMemory({
   *   workspaceId: 'ws-123',
   *   memoryId: 'pattern-123',
   *   eventData: { ... },
   *   relationshipType: 'validates',
   *   relationshipStrength: 90
   * });
   * ```
   */
  async linkEventToMemory(request: LinkEventToMemoryRequest): Promise<{
    newMemoryId: string;
    linkId: string;
  }> {
    // First record the event
    const eventResult = await this.recordEvent(request.eventData);

    // Then create explicit link
    const linkResult = await this.memoryStore.link({
      memoryId: eventResult.memoryId,
      linkedMemoryId: request.memoryId,
      relationship: request.relationshipType,
      strength: request.relationshipStrength || 70,
    });

    return {
      newMemoryId: eventResult.memoryId,
      linkId: linkResult.linkId,
    };
  }

  /**
   * Assemble historical context for agent decision-making
   *
   * Retrieves and ranks relevant memories to build context for
   * the agent to consider when making decisions.
   *
   * @example
   * ```typescript
   * const context = await bridge.getHistoricalContext({
   *   workspaceId: 'ws-123',
   *   query: 'engagement strategies for B2B',
   *   sourceAgent: 'content-agent'
   * });
   * ```
   */
  async getHistoricalContext(request: {
    workspaceId: string;
    query: string;
    sourceAgent?: string;
    limit?: number;
  }): Promise<{
    context: Array<{
      memory: any;
      rank: number;
      relevanceScore: number;
    }>;
    summary: string;
    timestamp: string;
  }> {
    // Retrieve relevant memories
    const retrieveResult = await this.memoryRetriever.retrieve({
      workspaceId: request.workspaceId,
      query: request.query,
      limit: request.limit || 10,
      minImportance: 40,
      minConfidence: 50,
    });

    // Rank the retrieved memories
    const rankingResult = await this.memoryRanker.rank({
      memories: retrieveResult.memories.map(m => ({
        id: m.id,
        memoryType: m.memoryType,
        importance: m.importance,
        confidence: m.confidence,
        createdAt: m.createdAt,
        recallPriority: m.recallPriority,
      })),
      context: {
        query: request.query,
        sourceAgent: request.sourceAgent,
      },
    });

    // Combine with original memory data
    const contextMemories = rankingResult.rankedMemories.map(ranked => {
      const original = retrieveResult.memories.find(m => m.id === ranked.id);
      return {
        memory: original,
        rank: ranked.rank,
        relevanceScore: ranked.relevanceScore,
      };
    });

    // Generate summary
    const summary =
      contextMemories.length > 0
        ? `Found ${contextMemories.length} relevant memories (avg relevance: ${(
            contextMemories.reduce((sum, m) => sum + m.relevanceScore, 0) / contextMemories.length
          ).toFixed(1)}/100)`
        : 'No relevant historical context found';

    return {
      context: contextMemories,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Save workflow checkpoint for resumption
   *
   * Records current workflow state with associated memories for
   * later resumption or analysis.
   *
   * @example
   * ```typescript
   * const checkpoint = await bridge.saveCheckpoint({
   *   workspaceId: 'ws-123',
   *   workflowId: 'orchestrator-run-456',
   *   currentStep: 5,
   *   totalSteps: 10,
   *   state: { ... },
   *   memoryIds: ['mem-1', 'mem-2']
   * });
   * ```
   */
  async saveCheckpoint(request: SaveCheckpointRequest): Promise<WorkflowCheckpoint> {
    const supabase = await getSupabaseServer();

    // For now, store as audit log memory to preserve checkpoint state
    const checkpointMemory = await this.memoryStore.store({
      workspaceId: request.workspaceId,
      agent: 'orchestrator',
      memoryType: 'plan',
      content: {
        checkpointId: `checkpoint-${Date.now()}`,
        workflowId: request.workflowId,
        currentStep: request.currentStep,
        totalSteps: request.totalSteps,
        state: request.state,
        memoryIds: request.memoryIds || [],
        context: request.context,
      },
      importance: 95, // Checkpoints are very important
      confidence: 100, // We have full confidence in saved state
      source: 'orchestrator',
    });

    const checkpoint: WorkflowCheckpoint = {
      checkpointId: checkpointMemory.memoryId,
      workspaceId: request.workspaceId,
      workflowId: request.workflowId,
      currentStep: request.currentStep,
      totalSteps: request.totalSteps,
      state: request.state,
      memoryIds: request.memoryIds || [],
      createdAt: new Date().toISOString(),
      context: request.context,
    };

    return checkpoint;
  }

  /**
   * Retrieve workflow checkpoint for resumption
   *
   * Loads a saved checkpoint to resume workflow from last known state.
   *
   * @example
   * ```typescript
   * const checkpoint = await bridge.resumeCheckpoint(
   *   'ws-123',
   *   'checkpoint-memory-uuid'
   * );
   * ```
   */
  async resumeCheckpoint(
    workspaceId: string,
    checkpointId: string
  ): Promise<WorkflowCheckpoint | null> {
    // Query the checkpoint memory
    const retrieveResult = await this.memoryRetriever.retrieve({
      workspaceId,
      query: checkpointId,
      memoryTypes: ['plan'],
      limit: 1,
    });

    if (retrieveResult.memories.length === 0) {
      return null;
    }

    const memory = retrieveResult.memories[0];
    const content = memory.content as any;

    return {
      checkpointId: memory.id,
      workspaceId,
      workflowId: content.workflowId,
      currentStep: content.currentStep,
      totalSteps: content.totalSteps,
      state: content.state,
      memoryIds: content.memoryIds || [],
      createdAt: memory.createdAt,
      context: content.context,
    };
  }

  /**
   * Sync memory statistics for monitoring
   *
   * Returns metrics about memory system usage for observability.
   */
  async getMemoryMetrics(workspaceId: string): Promise<{
    totalMemories: number;
    memoryTypeDistribution: { [type: string]: number };
    averageImportance: number;
    averageConfidence: number;
    unresignedSignals: number;
    timestamp: string;
  }> {
    const supabase = await getSupabaseServer();

    const { data: memories, error: memError } = await supabase
      .from('ai_memory')
      .select('memory_type, importance, confidence', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('is_redacted', false);

    const { data: signals, error: sigError } = await supabase
      .from('ai_memory_signals')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('is_resolved', false);

    if (memError) throw new Error(`Failed to fetch memory metrics: ${memError.message}`);

    const distribution: { [type: string]: number } = {};
    let totalImportance = 0;
    let totalConfidence = 0;

    (memories || []).forEach(mem => {
      distribution[mem.memory_type] = (distribution[mem.memory_type] || 0) + 1;
      totalImportance += mem.importance || 0;
      totalConfidence += mem.confidence || 0;
    });

    return {
      totalMemories: memories?.length || 0,
      memoryTypeDistribution: distribution,
      averageImportance: memories && memories.length > 0 ? totalImportance / memories.length : 0,
      averageConfidence: memories && memories.length > 0 ? totalConfidence / memories.length : 0,
      unresignedSignals: signals?.length || 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create a MemoryArchiveBridge instance
 */
export function createMemoryArchiveBridge(
  store?: MemoryStore,
  retriever?: MemoryRetriever,
  ranker?: MemoryRanker
): MemoryArchiveBridge {
  return new MemoryArchiveBridge(store, retriever, ranker);
}

/**
 * Singleton instance for direct imports
 */
export const memoryArchiveBridge = createMemoryArchiveBridge();
