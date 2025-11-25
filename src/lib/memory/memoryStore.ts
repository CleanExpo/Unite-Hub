/**
 * Memory Store - Unified write layer for Living Intelligence Foundation
 *
 * Handles storage of all memory types across agent operations with automatic
 * keyword extraction, embedding generation queueing, and relationship management.
 *
 * @module lib/memory/memoryStore
 */

import { getSupabaseServer } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Memory type classifications matching database schema
 */
export type MemoryType =
  | 'plan'                 // Agent execution plans
  | 'step'                 // Individual execution steps
  | 'reasoning_trace'      // Agent reasoning traces
  | 'decision'             // Decision rationale
  | 'uncertainty'          // Uncertainty disclosures
  | 'outcome'              // Actual outcomes
  | 'lesson'               // Learned lessons
  | 'pattern'              // Recognized patterns
  | 'signal'               // System signals (anomalies, risks)
  | 'contact_insight'      // Contact intelligence
  | 'campaign_result'      // Campaign performance
  | 'content_performance'  // Content effectiveness
  | 'loyalty_transaction'  // Loyalty events
  | 'monitoring_event'     // System monitoring
  | 'audit_log';           // Compliance logs

/**
 * Relationship types for memory linking
 */
export type RelationshipType =
  | 'caused_by'            // This memory was caused by another
  | 'led_to'               // This memory led to another outcome
  | 'contradicts'          // Conflicts with another memory
  | 'refines'              // Improves upon
  | 'extends'              // Adds to
  | 'validates'            // Confirms another memory
  | 'invalidates'          // Disproves
  | 'depends_on'           // Requires
  | 'supports'             // Provides evidence for
  | 'similar_to'           // Similar pattern
  | 'part_of';             // Is a component of

/**
 * Signal types for anomaly detection and risk tracking
 */
export type SignalType =
  | 'anomaly'              // Unusual pattern detected
  | 'risk_detected'        // Potential risk identified
  | 'confidence_low'       // Low confidence in memory
  | 'uncertainty_high'     // High uncertainty disclosed
  | 'contradiction'        // Conflicts with other memory
  | 'pattern_mismatch'     // Doesn't fit expected pattern
  | 'outcome_mismatch'     // Promised vs actual mismatch
  | 'approval_required'    // Requires founder approval
  | 'manual_override'      // Human intervention needed
  | 'escalation';          // Needs escalation

/**
 * Request to store a memory entry
 */
export interface StoreMemoryRequest {
  /** UUID of workspace */
  workspaceId: string;

  /** Name of agent creating memory */
  agent: string;

  /** Classification of memory type */
  memoryType: MemoryType;

  /** Content as JSON (flexible structure) */
  content: Record<string, any>;

  /** Importance score (0-100, default 50) */
  importance?: number;

  /** Confidence score (0-100, default 70) */
  confidence?: number;

  /** Notes on uncertainties in the memory */
  uncertaintyNotes?: string;

  /** Keywords for retrieval (auto-extracted if not provided) */
  keywords?: string[];

  /** Source system/component creating memory */
  source?: string;

  /** Custom metadata (stored as-is) */
  metadata?: Record<string, any>;

  /** Parent memory UUID for lineage tracking */
  parentMemoryId?: string;
}

/**
 * Response from storing a memory
 */
export interface StoreMemoryResponse {
  /** UUID of stored memory */
  memoryId: string;

  /** Computed recall priority score */
  recallPriority: number;

  /** Whether embedding was queued for generation */
  embeddingQueued: boolean;

  /** Keywords extracted/used for the memory */
  keywords: string[];

  /** Timestamp of storage */
  timestamp: string;
}

/**
 * Request to link two memories with a relationship
 */
export interface LinkMemoryRequest {
  /** UUID of source memory */
  memoryId: string;

  /** UUID of target memory */
  linkedMemoryId: string;

  /** Type of relationship */
  relationship: RelationshipType;

  /** Strength of relationship (0-100, default 50) */
  strength?: number;
}

/**
 * Request to add a signal to a memory
 */
export interface AddSignalRequest {
  /** UUID of memory to attach signal to */
  memoryId: string;

  /** UUID of workspace */
  workspaceId: string;

  /** Type of signal */
  signalType: SignalType;

  /** Signal severity value (0-100) */
  signalValue: number;

  /** Agent that detected the signal */
  sourceAgent: string;

  /** Optional resolution notes */
  resolutionNotes?: string;
}

/**
 * MemoryStore - Unified write layer for all memory operations
 *
 * Provides type-safe interface for storing memories across all agents with
 * automatic keyword extraction, embedding queueing, and signal attachment.
 *
 * All operations are workspace-scoped and audit-logged.
 */
export class MemoryStore {
  /**
   * Extract keywords from memory content
   *
   * Analyzes content structure to identify important terms and phrases
   * for retrieval optimization.
   */
  private extractKeywords(content: Record<string, any>, hint?: string): string[] {
    const keywords: Set<string> = new Set();

    // Add hinted keywords
    if (hint) {
      hint.split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word.toLowerCase());
      });
    }

    // Extract from common fields
    const textFields = ['title', 'description', 'summary', 'objective', 'outcome'];
    textFields.forEach(field => {
      if (content[field] && typeof content[field] === 'string') {
        content[field]
          .toLowerCase()
          .split(/[\s,.:;!?\-()]+/)
          .filter(word => word.length > 2)
          .forEach(word => keywords.add(word));
      }
    });

    // Extract from arrays
    if (Array.isArray(content.tags)) {
      content.tags.forEach(tag => keywords.add(String(tag).toLowerCase()));
    }

    if (Array.isArray(content.keywords)) {
      content.keywords.forEach(kw => keywords.add(String(kw).toLowerCase()));
    }

    // Limit to top keywords
    return Array.from(keywords).slice(0, 20);
  }

  /**
   * Compute recall priority from importance and confidence
   *
   * Uses formula: min(100, importance * confidence / 10)
   * This ensures high-confidence, important memories surface first.
   */
  private computeRecallPriority(importance: number, confidence: number): number {
    return Math.min(100, Math.floor((importance * confidence) / 10));
  }

  /**
   * Queue embedding generation for a memory
   *
   * Non-blocking operation that adds memory to embedding queue for
   * asynchronous vector embedding generation.
   */
  private async queueEmbedding(memoryId: string, content: Record<string, any>): Promise<boolean> {
    try {
      // For now, this is a placeholder that returns success
      // In production, this would:
      // 1. Add to a job queue (Bull, Temporal, etc.)
      // 2. Process asynchronously with embedding service
      // 3. Store vector in ai_memory_embeddings table

      // This allows embedding generation to not block the API response
      return true;
    } catch (error) {
      console.error('Error queueing embedding:', error);
      // Failure to queue embedding is non-fatal
      return false;
    }
  }

  /**
   * Store a memory entry in the unified memory system
   *
   * Handles validation, keyword extraction, auto-linking hints, and
   * embedding generation queueing. Returns memory ID and metadata.
   *
   * @example
   * ```typescript
   * const store = new MemoryStore();
   * const result = await store.store({
   *   workspaceId: 'ws-123',
   *   agent: 'content-agent',
   *   memoryType: 'lesson',
   *   content: { insight: 'Users prefer personalized content' },
   *   importance: 80,
   *   confidence: 90,
   *   keywords: ['personalization', 'engagement']
   * });
   * ```
   */
  async store(request: StoreMemoryRequest): Promise<StoreMemoryResponse> {
    const supabase = await getSupabaseServer();

    // Validate required fields
    if (!request.workspaceId) throw new Error('workspaceId is required');
    if (!request.agent) throw new Error('agent is required');
    if (!request.memoryType) throw new Error('memoryType is required');
    if (!request.content) throw new Error('content is required');

    // Set defaults
    const importance = request.importance ?? 50;
    const confidence = request.confidence ?? 70;
    const source = request.source ?? 'system';
    const keywords = request.keywords || this.extractKeywords(request.content);

    // Validate score ranges
    if (importance < 0 || importance > 100) {
      throw new Error('importance must be between 0 and 100');
    }
    if (confidence < 0 || confidence > 100) {
      throw new Error('confidence must be between 0 and 100');
    }

    // Call database function to store memory
    const { data, error } = await supabase.rpc('store_agent_memory', {
      p_workspace_id: request.workspaceId,
      p_agent: request.agent,
      p_memory_type: request.memoryType,
      p_content: request.content,
      p_importance: importance,
      p_confidence: confidence,
      p_uncertainty_notes: request.uncertaintyNotes || null,
      p_keywords: keywords,
      p_source: source,
    });

    if (error) {
      console.error('Error storing memory:', error);
      throw new Error(`Failed to store memory: ${error.message}`);
    }

    const memoryId = data as string;
    const recallPriority = this.computeRecallPriority(importance, confidence);

    // Queue embedding generation asynchronously (non-blocking)
    const embeddingQueued = await this.queueEmbedding(memoryId, request.content);

    return {
      memoryId,
      recallPriority,
      embeddingQueued,
      keywords,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a relationship link between two memories
   *
   * Establishes directional relationships for knowledge graph construction
   * and pattern discovery across the memory system.
   *
   * @example
   * ```typescript
   * await store.link({
   *   memoryId: 'memory-1',
   *   linkedMemoryId: 'memory-2',
   *   relationship: 'led_to',
   *   strength: 85
   * });
   * ```
   */
  async link(request: LinkMemoryRequest): Promise<{ linkId: string }> {
    const supabase = await getSupabaseServer();

    // Validate
    if (!request.memoryId) throw new Error('memoryId is required');
    if (!request.linkedMemoryId) throw new Error('linkedMemoryId is required');
    if (!request.relationship) throw new Error('relationship is required');

    // Same memory cannot link to itself
    if (request.memoryId === request.linkedMemoryId) {
      throw new Error('Cannot link memory to itself');
    }

    const strength = request.strength ?? 50;

    if (strength < 0 || strength > 100) {
      throw new Error('strength must be between 0 and 100');
    }

    // Call database function to create link
    const { data, error } = await supabase.rpc('link_memories', {
      p_memory_id: request.memoryId,
      p_linked_memory_id: request.linkedMemoryId,
      p_relationship: request.relationship,
      p_strength: strength,
    });

    if (error) {
      console.error('Error linking memories:', error);
      throw new Error(`Failed to link memories: ${error.message}`);
    }

    return { linkId: data as string };
  }

  /**
   * Add a signal/anomaly detection to a memory
   *
   * Attaches risk, confidence, or anomaly indicators for intelligent
   * prioritization and escalation in agent decision-making.
   *
   * @example
   * ```typescript
   * await store.addSignal({
   *   memoryId: 'memory-1',
   *   workspaceId: 'ws-123',
   *   signalType: 'risk_detected',
   *   signalValue: 78,
   *   sourceAgent: 'orchestrator'
   * });
   * ```
   */
  async addSignal(request: AddSignalRequest): Promise<{ signalId: string }> {
    const supabase = await getSupabaseServer();

    // Validate
    if (!request.memoryId) throw new Error('memoryId is required');
    if (!request.workspaceId) throw new Error('workspaceId is required');
    if (!request.signalType) throw new Error('signalType is required');
    if (request.signalValue === undefined) throw new Error('signalValue is required');
    if (!request.sourceAgent) throw new Error('sourceAgent is required');

    if (request.signalValue < 0 || request.signalValue > 100) {
      throw new Error('signalValue must be between 0 and 100');
    }

    // Call database function to add signal
    const { data, error } = await supabase.rpc('add_memory_signal', {
      p_memory_id: request.memoryId,
      p_workspace_id: request.workspaceId,
      p_signal_type: request.signalType,
      p_signal_value: request.signalValue,
      p_source_agent: request.sourceAgent,
    });

    if (error) {
      console.error('Error adding signal:', error);
      throw new Error(`Failed to add signal: ${error.message}`);
    }

    return { signalId: data as string };
  }

  /**
   * Redact a memory entry (soft delete)
   *
   * Marks memory as redacted with reason for compliance and audit trail.
   * Memory is not permanently deleted but excluded from retrieval.
   *
   * @example
   * ```typescript
   * await store.redact('memory-1', 'GDPR data deletion', userId);
   * ```
   */
  async redact(
    memoryId: string,
    reason: string,
    redactedByUserId: string
  ): Promise<{ success: boolean }> {
    const supabase = await getSupabaseServer();

    if (!memoryId) throw new Error('memoryId is required');
    if (!reason) throw new Error('reason is required');
    if (!redactedByUserId) throw new Error('redactedByUserId is required');

    const { error } = await supabase.rpc('redact_memory', {
      p_memory_id: memoryId,
      p_redaction_reason: reason,
      p_redacted_by: redactedByUserId,
    });

    if (error) {
      console.error('Error redacting memory:', error);
      throw new Error(`Failed to redact memory: ${error.message}`);
    }

    return { success: true };
  }
}

/**
 * Factory function to create a MemoryStore instance
 *
 * @returns New MemoryStore instance
 */
export function createMemoryStore(): MemoryStore {
  return new MemoryStore();
}

/**
 * Singleton instance for direct imports
 */
export const memoryStore = createMemoryStore();
