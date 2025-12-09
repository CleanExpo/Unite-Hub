/**
 * Autonomy Archive Bridge
 *
 * Writes all global autonomy events and decisions into the memory system
 * and orchestrator logs for persistent learning and audit trails.
 * Creates relationship links between autonomy runs, memories, and steps.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface AutonomyArchiveData {
  runId: string;
  objective: string;
  globalContext: Record<string, any>;
  autonomyScore: number;
  riskScore: number;
  uncertaintyScore: number;
  agents: string[];
  completedSteps: number;
  totalSteps: number;
}

class AutonomyArchiveBridge {
  /**
   * Archive complete global autonomy run
   */
  async archiveRun(archive: AutonomyArchiveData): Promise<{
    autonomyMemoryId: string;
    linkedMemories: number;
    linkedSteps: number;
  }> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create main autonomy run memory
      const autonomyMemory = await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'autonomy-engine',
        memoryType: 'autonomy_run',
        content: {
          objective: archive.objective,
          autonomyScore: archive.autonomyScore,
          riskScore: archive.riskScore,
          uncertaintyScore: archive.uncertaintyScore,
          agentCount: archive.agents.length,
          completedSteps: archive.completedSteps,
          totalSteps: archive.totalSteps,
          successRate: Math.round((archive.completedSteps / archive.totalSteps) * 100),
          timestamp: new Date().toISOString(),
        },
        importance: this.calculateImportance(archive.autonomyScore, archive.riskScore),
        confidence: Math.round((archive.autonomyScore + 50) / 1.5), // 33-100
        keywords: [
          'autonomy',
          'orchestration',
          ...archive.agents,
          archive.objective.split(' ')[0].toLowerCase(),
        ].slice(0, 10),
      });

      let linkedMemories = 0;
      let linkedSteps = 0;

      // 2. Link to related memories based on context
      const contextMemories = archive.globalContext.relevantMemories || [];
      for (const contextMem of contextMemories.slice(0, 5)) {
        try {
          await supabase.rpc('link_autonomy_to_memory', {
            p_run_id: archive.runId,
            p_memory_id: contextMem.id,
            p_agent: 'autonomy-engine',
            p_link_type: 'informed_by',
            p_confidence: Math.round(contextMem.confidence || 80),
          });
          linkedMemories++;
        } catch (err) {
          console.error('Error linking to context memory:', err);
        }
      }

      // 3. Link to orchestrator steps if they exist
      const { data: orchestrationSteps } = await supabase
        .from('orchestrator_steps')
        .select('id')
        .in('assigned_agent', archive.agents)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orchestrationSteps) {
        for (const step of orchestrationSteps) {
          try {
            await supabase.rpc('link_autonomy_to_orchestrator', {
              p_run_id: archive.runId,
              p_step_id: step.id,
              p_agent: 'autonomy-engine',
              p_link_type: 'depends_on',
              p_confidence: 85,
            });
            linkedSteps++;
          } catch (err) {
            console.error('Error linking to orchestrator step:', err);
          }
        }
      }

      // 4. Extract and archive success patterns
      if (archive.autonomyScore >= 70 && archive.riskScore <= 50) {
        await this.extractSuccessPattern(
          archive,
          autonomyMemory.memoryId,
          memoryStore,
          user?.id || 'system'
        );
      }

      // 5. Archive failure patterns if applicable
      if (archive.autonomyScore < 40 || archive.riskScore > 70) {
        await this.extractFailurePattern(
          archive,
          autonomyMemory.memoryId,
          memoryStore,
          user?.id || 'system'
        );
      }

      // 6. Create agent-specific memories
      for (const agent of archive.agents) {
        try {
          const agentMemory = await memoryStore.store({
            workspaceId: user?.id || 'system',
            agent: 'autonomy-engine',
            memoryType: 'agent_autonomy',
            content: {
              agent,
              autonomyScore: archive.autonomyScore,
              orchestrationObjective: archive.objective,
              timestamp: new Date().toISOString(),
            },
            importance: 65,
            confidence: 80,
            keywords: [agent, 'autonomy', 'orchestration'],
            parentMemoryId: autonomyMemory.memoryId,
          });

          // Link agent memory to main
          await memoryStore.link(
            autonomyMemory.memoryId,
            agentMemory.memoryId,
            'contains_agent_run',
            0.85
          );
        } catch (err) {
          console.error(`Error creating agent memory for ${agent}:`, err);
        }
      }

      return {
        autonomyMemoryId: autonomyMemory.memoryId,
        linkedMemories,
        linkedSteps,
      };
    } catch (error) {
      console.error('Error archiving autonomy run:', error);
      throw error;
    }
  }

  /**
   * Extract and archive success patterns
   */
  private async extractSuccessPattern(
    archive: AutonomyArchiveData,
    parentMemoryId: string,
    memoryStore: MemoryStore,
    userId: string
  ): Promise<void> {
    try {
      const pattern = {
        objectivePattern: archive.objective.split(' ').slice(0, 3).join(' '),
        agentSequence: archive.agents,
        autonomyScore: archive.autonomyScore,
        successRate: Math.round((archive.completedSteps / archive.totalSteps) * 100),
        contextSummary: {
          memoryInfluence: archive.globalContext.memoryInfluence,
          agentHealth: archive.globalContext.agentHealth,
        },
        timestamp: new Date().toISOString(),
      };

      const patternMemory = await memoryStore.store({
        workspaceId: userId,
        agent: 'autonomy-engine',
        memoryType: 'autonomy_success_pattern',
        content: pattern,
        importance: 80,
        confidence: 85,
        keywords: ['pattern', 'success', 'autonomy', ...archive.agents.slice(0, 2)],
        parentMemoryId,
      });

      // Link pattern to main run
      await memoryStore.link(parentMemoryId, patternMemory.memoryId, 'exhibits_pattern', 0.9);
    } catch (error) {
      console.error('Error extracting success pattern:', error);
    }
  }

  /**
   * Extract and archive failure patterns
   */
  private async extractFailurePattern(
    archive: AutonomyArchiveData,
    parentMemoryId: string,
    memoryStore: MemoryStore,
    userId: string
  ): Promise<void> {
    try {
      const pattern = {
        objectivePattern: archive.objective.split(' ').slice(0, 3).join(' '),
        failureReason: archive.riskScore > 70 ? 'high_risk' : 'low_autonomy_score',
        autonomyScore: archive.autonomyScore,
        riskScore: archive.riskScore,
        uncertaintyScore: archive.uncertaintyScore,
        affectedAgents: archive.agents,
        timestamp: new Date().toISOString(),
      };

      const patternMemory = await memoryStore.store({
        workspaceId: userId,
        agent: 'autonomy-engine',
        memoryType: 'autonomy_failure_pattern',
        content: pattern,
        importance: 75,
        confidence: 80,
        keywords: ['pattern', 'failure', 'autonomy', 'risk'],
        parentMemoryId,
      });

      // Link pattern to main run
      await memoryStore.link(parentMemoryId, patternMemory.memoryId, 'exhibits_pattern', 0.85);
    } catch (error) {
      console.error('Error extracting failure pattern:', error);
    }
  }

  /**
   * Record autonomy decision with full lineage
   */
  async recordDecision(params: {
    runId: string;
    userId: string;
    objective: string;
    decision: string;
    reasoning: string;
    autonomyScore: number;
    recommendation: 'proceed' | 'validate' | 'pause' | 'halt';
  }): Promise<string> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      // Store decision as memory
      const decisionMemory = await memoryStore.store({
        workspaceId: params.userId,
        agent: 'autonomy-engine',
        memoryType: 'autonomy_decision',
        content: {
          objective: params.objective,
          decision: params.decision,
          reasoning: params.reasoning,
          autonomyScore: params.autonomyScore,
          recommendation: params.recommendation,
          decidedAt: new Date().toISOString(),
        },
        importance: Math.max(70, params.autonomyScore),
        confidence: 85,
        keywords: ['decision', 'autonomy', params.recommendation],
      });

      // Log to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: params.userId,
        user_id: params.userId,
        action: 'autonomy_decision_made',
        resource_type: 'autonomy_run',
        resource_id: params.runId,
        details: {
          decisionMemoryId: decisionMemory.memoryId,
          decision: params.decision,
          autonomyScore: params.autonomyScore,
          recommendation: params.recommendation,
        },
        timestamp: new Date().toISOString(),
      });

      return decisionMemory.memoryId;
    } catch (error) {
      console.error('Error recording autonomy decision:', error);
      throw error;
    }
  }

  /**
   * Calculate memory importance based on outcomes
   */
  private calculateImportance(autonomyScore: number, riskScore: number): number {
    // Higher autonomy score = higher importance (good outcome)
    // Higher risk score = higher importance (must remember risks)
    const importance = Math.round(
      (autonomyScore * 0.6 + (100 - riskScore) * 0.4 + 20)
    );
    return Math.min(100, importance);
  }

  /**
   * Find similar past autonomy runs
   */
  async findSimilarAutonomyRuns(
    objective: string,
    workspaceId: string,
    limit: number = 5
  ): Promise<
    Array<{
      runId: string;
      similarity: number;
      autonomyScore: number;
      objective: string;
    }>
  > {
    const supabase = await getSupabaseServer();

    try {
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('id, objective, autonomy_score')
        .eq('workspace_id', workspaceId)
        .in('status', ['completed', 'failed'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (!runs) {
return [];
}

      const objectiveKeywords = objective.toLowerCase().split(/\s+/);

      return runs
        .map((r) => {
          const runObjectiveStr = (r.objective || '').toLowerCase();
          const matchingKeywords = objectiveKeywords.filter((k) =>
            runObjectiveStr.includes(k)
          );
          const similarity = (matchingKeywords.length / objectiveKeywords.length) * 100;

          return {
            runId: r.id,
            similarity: Math.round(similarity),
            autonomyScore: r.autonomy_score || 0,
            objective: r.objective || '',
          };
        })
        .filter((r) => r.similarity > 30)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar autonomy runs:', error);
      return [];
    }
  }

  /**
   * Generate autonomy improvement suggestions
   */
  async generateImprovementSuggestions(params: {
    autonomyScore: number;
    riskScore: number;
    uncertaintyScore: number;
    failedAgents?: string[];
  }): Promise<string[]> {
    const suggestions: string[] = [];

    // Autonomy score feedback
    if (params.autonomyScore < 40) {
      suggestions.push(
        'Low autonomy score detected. Review memory consistency and agent readiness.'
      );
      suggestions.push(
        'Consider running validation passes before full multi-agent orchestration.'
      );
    } else if (params.autonomyScore < 60) {
      suggestions.push('Moderate autonomy score. Gather more context from memory system.');
      suggestions.push(
        'Monitor agent health and response times during execution.'
      );
    }

    // Risk feedback
    if (params.riskScore > 70) {
      suggestions.push('High risk factors detected. Implement additional safety gates.');
      suggestions.push(
        'Consider breaking workflow into smaller, lower-risk substeps.'
      );
    } else if (params.riskScore > 50) {
      suggestions.push(
        'Moderate risk. Review cross-agent dependencies and failure modes.'
      );
    }

    // Uncertainty feedback
    if (params.uncertaintyScore > 70) {
      suggestions.push(
        'High uncertainty in context. Collect more data before next execution.'
      );
      suggestions.push('Run reasoning engine to reduce decision uncertainty.');
    } else if (params.uncertaintyScore > 50) {
      suggestions.push('Consider validation checkpoints at critical workflow steps.');
    }

    // Agent-specific feedback
    if (params.failedAgents && params.failedAgents.length > 0) {
      suggestions.push(
        `${params.failedAgents.length} agent(s) failed: ${params.failedAgents.join(', ')}. Check agent logs.`
      );
    }

    // Default suggestion if none triggered
    if (suggestions.length === 0) {
      suggestions.push(
        'Autonomy metrics are healthy. Continue monitoring and learning.'
      );
    }

    return suggestions;
  }
}

export const autonomyArchiveBridge = new AutonomyArchiveBridge();
