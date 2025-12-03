/**
 * Reasoning Archive Bridge - Writes reasoning traces to memory system
 *
 * Bridges the reasoning engine with the Living Intelligence Foundation,
 * storing all passes and final decisions for historical analysis and learning.
 *
 * @module lib/reasoning/reasoningArchiveBridge
 */

import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MemoryStore } from '@/lib/memory';

export interface ArchiveRequest {
  runId: string;
  objective: string;
  agent: string;
  passes: any[];
  finalDecision: Record<string, any>;
  riskScore: number;
  uncertaintyScore: number;
  totalTimeMs: number;
}

/**
 * ReasoningArchiveBridge - Archives reasoning to memory system
 *
 * Stores reasoning runs and passes in the unified memory system for:
 * - Historical context and precedent
 * - Learning from past decisions
 * - Audit trail for compliance
 * - Pattern recognition across reasoning sessions
 */
export class ReasoningArchiveBridge {
  private memoryStore: MemoryStore;

  constructor(memoryStore?: MemoryStore) {
    this.memoryStore = memoryStore || new MemoryStore();
  }

  /**
   * Archive complete reasoning run to memory system
   *
   * Stores reasoning trace with all passes and decision for future reference.
   */
  async archiveReasoningRun(request: ArchiveRequest): Promise<{
    primaryMemoryId: string;
    passMemoryIds: string[];
  }> {
    const supabase = await getSupabaseServer();

    // Store main reasoning trace as lesson memory
    const traceMemory = await this.memoryStore.store({
      workspaceId: (await supabaseAdmin.auth.getUser()).data.user?.user_metadata?.workspace_id,
      agent: request.agent,
      memoryType: 'reasoning_trace',
      content: {
        objective: request.objective,
        finalDecision: request.finalDecision,
        riskScore: request.riskScore,
        uncertaintyScore: request.uncertaintyScore,
        totalTimeMs: request.totalTimeMs,
        passCount: request.passes.length,
      },
      importance: Math.min(95, 60 + request.riskScore / 2), // Higher importance for riskier decisions
      confidence: Math.max(30, 100 - request.uncertaintyScore),
      source: 'reasoning_engine',
      metadata: {
        runId: request.runId,
        passSummary: request.passes.map(p => ({
          number: p.passNumber,
          type: p.passType,
          uncertainty: p.uncertainty,
          risk: p.risk,
        })),
      },
    });

    // Store individual passes as step memories
    const passMemoryIds: string[] = [];

    for (const pass of request.passes) {
      const passMemory = await this.memoryStore.store({
        workspaceId: (await supabaseAdmin.auth.getUser()).data.user?.user_metadata?.workspace_id,
        agent: request.agent,
        memoryType: 'step',
        content: {
          passNumber: pass.passNumber,
          passType: pass.passType,
          generatedContent: pass.generatedContent,
          uncertainty: pass.uncertainty,
          risk: pass.risk,
          confidence: pass.confidence,
        },
        importance: 50 + (5 - pass.passNumber) * 10, // Earlier passes slightly more important
        confidence: pass.confidence,
        source: 'reasoning_engine',
        metadata: {
          runId: request.runId,
          processingTimeMs: pass.processingTimeMs,
          tokenCount: pass.tokenCount,
        },
      });

      passMemoryIds.push(passMemory.memoryId);
    }

    // Create relationships between passes
    for (let i = 0; i < passMemoryIds.length - 1; i++) {
      await this.memoryStore.link({
        memoryId: passMemoryIds[i],
        linkedMemoryId: passMemoryIds[i + 1],
        relationship: 'led_to',
        strength: 80,
      });
    }

    // Link trace memory to all passes
    for (const passId of passMemoryIds) {
      await this.memoryStore.link({
        memoryId: traceMemory.memoryId,
        linkedMemoryId: passId,
        relationship: 'part_of',
        strength: 90,
      });
    }

    return {
      primaryMemoryId: traceMemory.memoryId,
      passMemoryIds,
    };
  }

  /**
   * Extract lesson from successful reasoning
   *
   * Identifies and stores key insights and patterns from a reasoning run.
   */
  async extractLesson(
    workspaceId: string,
    agent: string,
    objective: string,
    decision: Record<string, any>,
    riskScore: number,
    uncertaintyScore: number
  ): Promise<string> {
    if (riskScore > 70 || uncertaintyScore > 60) {
      return ''; // Skip lesson extraction for high-risk or uncertain decisions
    }

    // Extract key insight
    const insight = `Successfully reasoned through "${objective.substring(0, 50)}..." with ${
      100 - uncertaintyScore
    }% confidence`;

    const lessonMemory = await this.memoryStore.store({
      workspaceId,
      agent,
      memoryType: 'lesson',
      content: {
        objective,
        keyInsight: insight,
        approach: 'multi-pass reasoning with memory integration',
        confidence: 100 - uncertaintyScore,
      },
      importance: Math.min(95, 70 + (100 - uncertaintyScore) / 10),
      confidence: 95,
      source: 'reasoning_engine',
      keywords: ['reasoning', 'lesson', agent],
    });

    return lessonMemory.memoryId;
  }

  /**
   * Record reasoning decision for audit trail
   *
   * Stores decision in audit log format for compliance.
   */
  async recordDecisionAudit(
    workspaceId: string,
    agent: string,
    objective: string,
    decision: Record<string, any>,
    riskScore: number
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    // Store in audit_logs table
    const { data, error } = await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      action: 'reasoning_decision',
      resource_type: 'reasoning_run',
      resource_id: objective,
      details: {
        agent,
        objective,
        decision,
        riskScore,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Failed to record decision audit:', error);
      return '';
    }

    // Also store as audit_log memory type
    const auditMemory = await this.memoryStore.store({
      workspaceId,
      agent,
      memoryType: 'audit_log',
      content: decision,
      importance: 80,
      confidence: 100,
      source: 'reasoning_engine',
    });

    return auditMemory.memoryId;
  }

  /**
   * Retrieve similar past reasoning runs
   *
   * Finds previous reasoning sessions with similar objectives.
   */
  async findSimilarReasonings(
    workspaceId: string,
    objective: string,
    limit: number = 5
  ): Promise<
    Array<{
      id: string;
      objective: string;
      risk: number;
      uncertainty: number;
      similarity: number;
    }>
  > {
    const supabase = await getSupabaseServer();

    // Search for reasoning traces with similar objectives
    const { data: memories } = await supabase
      .from('ai_memory')
      .select('id, content, recall_priority')
      .eq('memory_type', 'reasoning_trace')
      .eq('workspace_id', workspaceId)
      .order('recall_priority', { ascending: false })
      .limit(limit);

    if (!memories) return [];

    // Score similarity based on keyword overlap
    const objectiveKeywords = new Set(objective.toLowerCase().split(/\s+/));

    return memories
      .map(m => {
        const memoKeywords = new Set(
          (m.content?.objective || '').toLowerCase().split(/\s+/)
        );
        const intersection = Array.from(objectiveKeywords).filter(k => memoKeywords.has(k)).length;
        const union = new Set([...objectiveKeywords, ...memoKeywords]).size;
        const similarity = (intersection / Math.max(1, union)) * 100;

        return {
          id: m.id,
          objective: m.content?.objective || 'Unknown',
          risk: m.content?.riskScore || 0,
          uncertainty: m.content?.uncertaintyScore || 0,
          similarity: Math.round(similarity),
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .filter(r => r.similarity > 20); // Only return moderately similar
  }
}

/**
 * Factory to create a ReasoningArchiveBridge instance
 */
export function createReasoningArchiveBridge(memoryStore?: MemoryStore): ReasoningArchiveBridge {
  return new ReasoningArchiveBridge(memoryStore);
}

/**
 * Singleton instance for direct imports
 */
export const reasoningArchiveBridge = createReasoningArchiveBridge();
