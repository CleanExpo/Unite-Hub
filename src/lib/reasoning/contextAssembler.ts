/**
 * Context Assembler - Builds contextual packets for reasoning passes
 *
 * Assembles memory, relationships, and metadata into structured context
 * for each pass of the reasoning engine.
 *
 * @module lib/reasoning/contextAssembler
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryRetriever } from '@/lib/memory';

export interface ContextPacket {
  /** Core memories for this pass */
  primaryMemories: Array<{
    id: string;
    type: string;
    content: Record<string, any>;
    importance: number;
    confidence: number;
  }>;

  /** Related memories through relationships */
  relatedMemories: Array<{
    id: string;
    relationship: string;
    strength: number;
  }>;

  /** Uncertainty indicators */
  uncertainties: string[];

  /** Risk factors */
  riskFactors: string[];

  /** Metadata */
  metadata: {
    assembledAt: string;
    memoryCount: number;
    averageConfidence: number;
    uncertaintyLevel: number;
  };
}

/**
 * ContextAssembler - Builds contextual packets for reasoning
 *
 * Combines memory retrieval, relationship traversal, uncertainty weighting,
 * and metadata to create rich context for each reasoning pass.
 */
export class ContextAssembler {
  private memoryRetriever: MemoryRetriever;

  constructor(retriever?: MemoryRetriever) {
    this.memoryRetriever = retriever || new MemoryRetriever();
  }

  /**
   * Assemble context packet for a reasoning pass
   *
   * Gathers memories, relationships, and quality metrics for a pass.
   */
  async assembleContext(
    workspaceId: string,
    query: string,
    passType: string
  ): Promise<ContextPacket> {
    const supabase = await getSupabaseServer();

    // Retrieve primary memories
    const retrieval = await this.memoryRetriever.retrieve({
      workspaceId,
      query,
      limit: 10,
      includeRelated: true,
    });

    // Extract uncertainty notes
    const uncertainties = retrieval.memories
      .filter(m => m.uncertaintyNotes)
      .map(m => m.uncertaintyNotes!);

    // Calculate average confidence
    const avgConfidence =
      retrieval.memories.length > 0
        ? retrieval.memories.reduce((sum, m) => sum + m.confidence, 0) / retrieval.memories.length
        : 0;

    // Extract risk factors from signals
    const riskFactors: string[] = [];

    for (const memory of retrieval.memories) {
      const { data: signals } = await supabase
        .from('ai_memory_signals')
        .select('signal_type, signal_value')
        .eq('memory_id', memory.id)
        .eq('is_resolved', false);

      if (signals) {
        signals.forEach(sig => {
          if (sig.signal_value >= 60) {
            riskFactors.push(`${sig.signal_type} (${sig.signal_value})`);
          }
        });
      }
    }

    // Compute uncertainty level
    const uncertaintyLevel = Math.max(
      0,
      100 - avgConfidence - (uncertainties.length > 0 ? 20 : 0)
    );

    return {
      primaryMemories: retrieval.memories.map(m => ({
        id: m.id,
        type: m.memoryType,
        content: m.content,
        importance: m.importance,
        confidence: m.confidence,
      })),
      relatedMemories: retrieval.relatedMemories.map(m => ({
        id: m.id,
        relationship: m.relationshipType,
        strength: m.relationshipStrength,
      })),
      uncertainties,
      riskFactors: Array.from(new Set(riskFactors)),
      metadata: {
        assembledAt: new Date().toISOString(),
        memoryCount: retrieval.memories.length,
        averageConfidence: Math.round(avgConfidence),
        uncertaintyLevel: Math.round(uncertaintyLevel),
      },
    };
  }
}

/**
 * Factory to create a ContextAssembler instance
 */
export function createContextAssembler(retriever?: MemoryRetriever): ContextAssembler {
  return new ContextAssembler(retriever);
}

/**
 * Singleton instance for direct imports
 */
export const contextAssembler = createContextAssembler();
