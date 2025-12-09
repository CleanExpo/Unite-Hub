/**
 * Orchestrator Archive Bridge - Memory System Integration
 *
 * Archives orchestrator runs, steps, patterns, and outcomes into ai_memory
 * system with relationship graph links for future reference and learning.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface OrchestratorRunArchive {
  taskId: string;
  objective: string;
  status: string;
  steps: Array<{
    stepIndex: number;
    assignedAgent: string;
    outputPayload?: Record<string, any>;
    riskScore?: number;
    uncertaintyScore?: number;
  }>;
  finalRisk: number;
  finalUncertainty: number;
}

export class OrchestratorArchiveBridge {
  private memoryStore: MemoryStore;

  constructor() {
    this.memoryStore = new MemoryStore();
  }

  /**
   * Archive a complete orchestrator run to memory system
   */
  async archiveOrchestratorRun(archive: OrchestratorRunArchive): Promise<{
    orchestratorMemoryId: string;
    stepMemories: string[];
  }> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Create main orchestrator run memory
      const orchestratorMemory = await this.memoryStore.store({
        workspaceId: (await supabase.auth.getUser()).data.user?.id || 'system',
        agent: 'orchestrator',
        memoryType: 'orchestrator_run',
        content: {
          objective: archive.objective,
          status: archive.status,
          stepCount: archive.steps.length,
          finalRisk: archive.finalRisk,
          finalUncertainty: archive.finalUncertainty,
          timestamp: new Date().toISOString(),
        },
        importance: this.calculateImportance(archive.finalRisk, archive.finalUncertainty),
        confidence: 85,
        keywords: this.extractKeywords(archive.objective),
      });

      // 2. Create individual step memories
      const stepMemoryIds: string[] = [];

      for (const step of archive.steps) {
        const stepMemory = await this.memoryStore.store({
          workspaceId: (await supabase.auth.getUser()).data.user?.id || 'system',
          agent: 'orchestrator',
          memoryType: 'orchestrator_step',
          content: {
            stepIndex: step.stepIndex,
            agent: step.assignedAgent,
            output: step.outputPayload,
            riskScore: step.riskScore,
            uncertaintyScore: step.uncertaintyScore,
            timestamp: new Date().toISOString(),
          },
          importance: 60,
          confidence: 80,
          keywords: [step.assignedAgent, 'orchestrator', 'step'],
          parentMemoryId: orchestratorMemory.memoryId,
        });

        stepMemoryIds.push(stepMemory.memoryId);

        // Link step to orchestrator run
        await this.memoryStore.link(
          orchestratorMemory.memoryId,
          stepMemory.memoryId,
          'contains_step',
          0.9
        );
      }

      // 3. Extract and archive patterns if applicable
      if (archive.status === 'completed' && archive.finalRisk < 50) {
        await this.extractAndArchivePattern(
          archive.objective,
          archive.steps,
          orchestratorMemory.memoryId
        );
      }

      return {
        orchestratorMemoryId: orchestratorMemory.memoryId,
        stepMemories: stepMemoryIds,
      };
    } catch (error) {
      console.error('Error archiving orchestrator run:', error);
      throw error;
    }
  }

  /**
   * Extract successful patterns from orchestrator runs
   */
  private async extractAndArchivePattern(
    objective: string,
    steps: OrchestratorRunArchive['steps'],
    orchestratorMemoryId: string
  ): Promise<string> {
    try {
      const pattern = {
        objective,
        agentSequence: steps.map((s) => s.assignedAgent),
        stepCount: steps.length,
        successRate: 100,
        timestamp: new Date().toISOString(),
      };

      const patternMemory = await this.memoryStore.store({
        workspaceId: (await getSupabaseServer().auth.getUser()).data.user?.id || 'system',
        agent: 'orchestrator',
        memoryType: 'orchestrator_pattern',
        content: pattern,
        importance: 75,
        confidence: 80,
        keywords: ['pattern', 'orchestrator', ...steps.map((s) => s.assignedAgent)],
        parentMemoryId: orchestratorMemoryId,
      });

      // Link pattern to orchestrator run
      await this.memoryStore.link(
        orchestratorMemoryId,
        patternMemory.memoryId,
        'derived_pattern',
        0.85
      );

      return patternMemory.memoryId;
    } catch (error) {
      console.error('Error extracting pattern:', error);
      return '';
    }
  }

  /**
   * Record orchestrator decision with full lineage
   */
  async recordDecisionAudit(
    taskId: string,
    decision: {
      objective: string;
      action: string;
      reasoning: string;
      riskAssessment: number;
      uncertaintyAssessment: number;
    }
  ): Promise<string> {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Store decision as memory
      const decisionMemory = await this.memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'orchestrator',
        memoryType: 'decision',
        content: {
          objective: decision.objective,
          action: decision.action,
          reasoning: decision.reasoning,
          riskScore: decision.riskAssessment,
          uncertaintyScore: decision.uncertaintyAssessment,
          decidedAt: new Date().toISOString(),
        },
        importance: Math.max(60, decision.riskAssessment),
        confidence: 85,
        keywords: ['decision', 'orchestrator', 'audit'],
      });

      // Log to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: user?.id,
        user_id: user?.id,
        action: 'orchestrator_decision',
        resource_type: 'orchestrator_task',
        resource_id: taskId,
        details: {
          decisionMemoryId: decisionMemory.memoryId,
          decision: decision.action,
          risk: decision.riskAssessment,
          uncertainty: decision.uncertaintyAssessment,
        },
        timestamp: new Date().toISOString(),
      });

      return decisionMemory.memoryId;
    } catch (error) {
      console.error('Error recording decision audit:', error);
      throw error;
    }
  }

  /**
   * Find similar past orchestrator runs
   */
  async findSimilarOrchestrations(objective: string, workspaceId: string): Promise<
    Array<{
      memoryId: string;
      similarity: number;
      objective: string;
      successRate: number;
    }>
  > {
    const supabase = await getSupabaseServer();

    try {
      // Search for similar orchestrator runs
      const { data: memories } = await supabase
        .from('ai_memory')
        .select('id, content, importance')
        .eq('memory_type', 'orchestrator_run')
        .eq('workspace_id', workspaceId)
        .limit(10);

      if (!memories) {
return [];
}

      // Calculate similarity based on keyword overlap
      const objectiveKeywords = objective.toLowerCase().split(/\s+/);

      return memories
        .map((m) => {
          const contentStr = JSON.stringify(m.content).toLowerCase();
          const matchingKeywords = objectiveKeywords.filter((k) => contentStr.includes(k));
          const similarity = matchingKeywords.length / objectiveKeywords.length;

          return {
            memoryId: m.id,
            similarity: Math.round(similarity * 100),
            objective: m.content?.objective || '',
            successRate: m.content?.status === 'completed' ? 100 : 0,
          };
        })
        .filter((m) => m.similarity > 30)
        .sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Error finding similar orchestrations:', error);
      return [];
    }
  }

  /**
   * Calculate importance score based on risk and uncertainty
   */
  private calculateImportance(finalRisk: number, finalUncertainty: number): number {
    // Higher risk/uncertainty = higher importance for retention
    const avgScore = (finalRisk + finalUncertainty) / 2;
    return Math.min(100, Math.round(avgScore + 20)); // Base 20 + risk/uncertainty
  }

  /**
   * Extract keywords from objective
   */
  private extractKeywords(objective: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = objective
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    return Array.from(new Set(words)).slice(0, 10);
  }

  /**
   * Suggest improvements based on past runs
   */
  async suggestImprovements(
    taskId: string,
    analysis: {
      finalRisk: number;
      finalUncertainty: number;
      failedSteps?: number[];
    }
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (analysis.finalRisk > 70) {
      suggestions.push('Consider adding validation steps before execution');
      suggestions.push('Review risk factors - may need extra controls');
    }

    if (analysis.finalUncertainty > 70) {
      suggestions.push('Gather more context data before next attempt');
      suggestions.push('Break down complex steps into smaller subtasks');
    }

    if (analysis.failedSteps && analysis.failedSteps.length > 0) {
      suggestions.push(
        `Investigate failed steps: ${analysis.failedSteps.join(', ')}`
      );
      suggestions.push('Consider agent configuration or input quality');
    }

    return suggestions;
  }
}
