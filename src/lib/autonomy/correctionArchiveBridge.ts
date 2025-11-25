/**
 * Correction Archive Bridge
 *
 * Archives all global self-correction events and improvements into the memory system
 * for persistent learning, historical comparison, and future prevention.
 *
 * Creates relationship links between correction cycles, memories, and system events.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface CorrectionArchiveData {
  cycleId: string;
  cycleType: 'preventive' | 'reactive' | 'adaptive' | 'learning' | 'system_wide';
  objective: string;
  predictedFailures: number;
  affectedAgents: string[];
  improvementActionsCount: number;
  executedActionsCount: number;
  effectivenessScore: number;
  riskReduction: number;
  uncertaintyReduction: number;
}

class CorrectionArchiveBridge {
  /**
   * Archive complete correction cycle
   */
  async archiveCycle(archive: CorrectionArchiveData): Promise<{
    correctionMemoryId: string;
    linkedMemories: number;
    linkedEvents: number;
  }> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create main correction cycle memory
      const correctionMemory = await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'self-correction-engine',
        memoryType: 'correction_cycle',
        content: {
          cycleType: archive.cycleType,
          objective: archive.objective,
          predictedFailures: archive.predictedFailures,
          affectedAgents: archive.affectedAgents,
          improvementActionsCount: archive.improvementActionsCount,
          executedActionsCount: archive.executedActionsCount,
          effectivenessScore: archive.effectivenessScore,
          riskReduction: archive.riskReduction,
          uncertaintyReduction: archive.uncertaintyReduction,
          timestamp: new Date().toISOString(),
        },
        importance: this.calculateImportance(archive.effectivenessScore, archive.riskReduction),
        confidence: Math.round((archive.effectivenessScore + 50) / 1.5), // 33-100
        keywords: [
          'correction',
          'self-improvement',
          archive.cycleType,
          ...archive.affectedAgents,
          archive.objective.split(' ')[0].toLowerCase(),
        ].slice(0, 10),
      });

      let linkedMemories = 0;
      let linkedEvents = 0;

      // 2. Link correction patterns to memory system
      const { data: relatedRuns } = await supabase
        .from('global_autonomy_runs')
        .select('id')
        .in('active_agents', archive.affectedAgents)
        .limit(10);

      if (relatedRuns) {
        for (const run of relatedRuns) {
          try {
            // Create pattern memory linking to affected runs
            const patternMemory = await memoryStore.store({
              workspaceId: user?.id || 'system',
              agent: 'self-correction-engine',
              memoryType: 'correction_pattern',
              content: {
                runId: run.id,
                cycleId: archive.cycleId,
                pattern: `${archive.cycleType}_correction_for_${archive.objective}`,
                timestamp: new Date().toISOString(),
              },
              importance: 70,
              confidence: 80,
              keywords: ['pattern', 'correction', archive.cycleType],
              parentMemoryId: correctionMemory.memoryId,
            });

            // Link pattern to main correction memory
            await memoryStore.link(
              correctionMemory.memoryId,
              patternMemory.memoryId,
              'identifies_pattern',
              0.85
            );

            linkedMemories++;
          } catch (err) {
            console.error('Error linking correction pattern:', err);
          }
        }
      }

      // 3. Archive improvement actions as memory
      try {
        const actionsMemory = await memoryStore.store({
          workspaceId: user?.id || 'system',
          agent: 'self-correction-engine',
          memoryType: 'improvement_actions',
          content: {
            cycleId: archive.cycleId,
            totalActions: archive.improvementActionsCount,
            executedActions: archive.executedActionsCount,
            successRate: Math.round((archive.executedActionsCount / Math.max(archive.improvementActionsCount, 1)) * 100),
            affectedAgents: archive.affectedAgents,
            timestamp: new Date().toISOString(),
          },
          importance: Math.max(70, archive.effectivenessScore),
          confidence: 85,
          keywords: ['improvements', 'actions', 'effectiveness'],
          parentMemoryId: correctionMemory.memoryId,
        });

        await memoryStore.link(
          correctionMemory.memoryId,
          actionsMemory.memoryId,
          'executes_improvement',
          0.9
        );

        linkedMemories++;
      } catch (err) {
        console.error('Error archiving improvement actions:', err);
      }

      // 4. Archive risk and uncertainty reductions
      if (archive.riskReduction > 0 || archive.uncertaintyReduction > 0) {
        try {
          const metricsMemory = await memoryStore.store({
            workspaceId: user?.id || 'system',
            agent: 'self-correction-engine',
            memoryType: 'correction_metrics',
            content: {
              cycleId: archive.cycleId,
              riskReduction: archive.riskReduction,
              uncertaintyReduction: archive.uncertaintyReduction,
              effectivenessScore: archive.effectivenessScore,
              timestamp: new Date().toISOString(),
            },
            importance: 80,
            confidence: 90,
            keywords: ['metrics', 'improvement', 'risk', 'uncertainty'],
            parentMemoryId: correctionMemory.memoryId,
          });

          await memoryStore.link(
            correctionMemory.memoryId,
            metricsMemory.memoryId,
            'demonstrates_improvement',
            0.95
          );

          linkedMemories++;
        } catch (err) {
          console.error('Error archiving correction metrics:', err);
        }
      }

      // 5. Create agent-specific learning memories
      for (const agent of archive.affectedAgents) {
        try {
          const agentMemory = await memoryStore.store({
            workspaceId: user?.id || 'system',
            agent: 'self-correction-engine',
            memoryType: 'agent_correction_learning',
            content: {
              agent,
              cycleId: archive.cycleId,
              cycleType: archive.cycleType,
              improvementArea: archive.objective,
              timestamp: new Date().toISOString(),
            },
            importance: 65,
            confidence: 80,
            keywords: [agent, 'correction', 'learning', archive.cycleType],
            parentMemoryId: correctionMemory.memoryId,
          });

          // Link agent memory to main
          await memoryStore.link(
            correctionMemory.memoryId,
            agentMemory.memoryId,
            'improves_agent',
            0.85
          );

          linkedMemories++;
        } catch (err) {
          console.error(`Error creating agent learning memory for ${agent}:`, err);
        }
      }

      // 6. Record correction cycle events
      const { data: cycleEvents } = await supabase
        .from('self_correction_cycles')
        .select('*')
        .eq('id', archive.cycleId);

      if (cycleEvents && cycleEvents.length > 0) {
        const cycle = cycleEvents[0];

        // Link correction graph nodes to memory
        const { data: graphNodes } = await supabase
          .from('self_correction_graph')
          .select('*')
          .eq('cycle_id', archive.cycleId)
          .limit(5);

        if (graphNodes) {
          for (const node of graphNodes) {
            try {
              await supabase
                .from('ai_memory')
                .insert({
                  workspace_id: user?.id || 'system',
                  agent: 'self-correction-engine',
                  memory_type: 'correction_weakness_node',
                  content: {
                    nodeType: node.node_type,
                    severity: node.severity,
                    cycleId: archive.cycleId,
                  },
                  importance: node.severity * 15,
                  confidence: node.confidence,
                  keywords: [node.node_type, 'weakness', 'correction'],
                  created_at: new Date().toISOString(),
                });

              linkedEvents++;
            } catch (err) {
              console.error('Error archiving weakness node:', err);
            }
          }
        }
      }

      // 7. Log correction to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: user?.id || 'system',
        user_id: user?.id || 'system',
        action: 'correction_cycle_archived',
        resource_type: 'correction_cycle',
        resource_id: archive.cycleId,
        details: {
          memoryId: correctionMemory.memoryId,
          cycleType: archive.cycleType,
          effectivenessScore: archive.effectivenessScore,
          linkedMemories,
          linkedEvents,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        correctionMemoryId: correctionMemory.memoryId,
        linkedMemories,
        linkedEvents,
      };
    } catch (error) {
      console.error('Error archiving correction cycle:', error);
      throw error;
    }
  }

  /**
   * Record prevention success (when correction prevented a failure)
   */
  async recordPrevention(params: {
    cycleId: string;
    userId: string;
    preventedFailureType: string;
    preventionMethod: string;
    riskAvoided: number;
    agentsProtected: string[];
  }): Promise<string> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      // Store prevention event as memory
      const preventionMemory = await memoryStore.store({
        workspaceId: params.userId,
        agent: 'self-correction-engine',
        memoryType: 'prevention_success',
        content: {
          cycleId: params.cycleId,
          preventedFailureType: params.preventedFailureType,
          preventionMethod: params.preventionMethod,
          riskAvoided: params.riskAvoided,
          agentsProtected: params.agentsProtected,
          timestamp: new Date().toISOString(),
        },
        importance: 85 + params.riskAvoided * 0.15,
        confidence: 90,
        keywords: ['prevention', 'success', params.preventedFailureType],
      });

      // Log to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: params.userId,
        user_id: params.userId,
        action: 'prevention_success_recorded',
        resource_type: 'correction_cycle',
        resource_id: params.cycleId,
        details: {
          memoryId: preventionMemory.memoryId,
          preventedFailure: params.preventedFailureType,
          riskAvoided: params.riskAvoided,
        },
        timestamp: new Date().toISOString(),
      });

      return preventionMemory.memoryId;
    } catch (error) {
      console.error('Error recording prevention success:', error);
      throw error;
    }
  }

  /**
   * Find similar corrections from history
   */
  async findSimilarCorrections(
    failureType: string,
    workspaceId: string,
    limit: number = 5
  ): Promise<
    Array<{
      cycleId: string;
      cycleType: string;
      similarity: number;
      effectivenessScore: number;
      riskReduction: number;
    }>
  > {
    const supabase = await getSupabaseServer();

    try {
      const { data: cycles } = await supabase
        .from('self_correction_cycles')
        .select('id, cycle_type, effectiveness_score, risk_score, predicted_failure_type')
        .eq('workspace_id', workspaceId)
        .in('status', ['completed', 'validated'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (!cycles) return [];

      const failureKeywords = failureType.toLowerCase().split('_');

      return cycles
        .map(cycle => {
          const cycleKeywords = (cycle.predicted_failure_type || '')
            .toLowerCase()
            .split('_');

          const matchingKeywords = failureKeywords.filter(k =>
            cycleKeywords.includes(k)
          );

          const similarity = (matchingKeywords.length / Math.max(failureKeywords.length, 1)) * 100;

          return {
            cycleId: cycle.id,
            cycleType: cycle.cycle_type,
            similarity: Math.round(similarity),
            effectivenessScore: cycle.effectiveness_score || 0,
            riskReduction: 100 - (cycle.risk_score || 50),
          };
        })
        .filter(c => c.similarity >= 30)
        .sort((a, b) => {
          // Sort by similarity first, then effectiveness
          if (b.similarity !== a.similarity) return b.similarity - a.similarity;
          return b.effectivenessScore - a.effectivenessScore;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar corrections:', error);
      return [];
    }
  }

  /**
   * Generate learning insights from correction history
   */
  async generateLearningInsights(params: {
    workspaceId: string;
    lookbackDays?: number;
    failureType?: string;
  }): Promise<{
    topImprovements: string[];
    failurePatterns: Array<{ type: string; frequency: number; successRate: number }>;
    agentLearnings: Record<string, string[]>;
    recommendations: string[];
  }> {
    const supabase = await getSupabaseServer();
    const lookbackDays = params.lookbackDays || 30;
    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch completed correction cycles
      const { data: cycles } = await supabase
        .from('self_correction_cycles')
        .select('*')
        .eq('workspace_id', params.workspaceId)
        .gte('created_at', lookbackDate)
        .eq('status', 'completed')
        .order('effectiveness_score', { ascending: false });

      if (!cycles || cycles.length === 0) {
        return {
          topImprovements: [],
          failurePatterns: [],
          agentLearnings: {},
          recommendations: [],
        };
      }

      // 1. Extract top improvements
      const topImprovements = cycles
        .filter(c => c.improvement_actions)
        .flatMap(c => (c.improvement_actions || []).map((a: any) => a.description))
        .slice(0, 5);

      // 2. Analyze failure patterns
      const failurePatterns: Record<string, any> = {};

      for (const cycle of cycles) {
        const failureType = cycle.predicted_failure_type || 'unknown';

        if (!failurePatterns[failureType]) {
          failurePatterns[failureType] = {
            type: failureType,
            frequency: 0,
            totalEffectiveness: 0,
            count: 0,
          };
        }

        failurePatterns[failureType].frequency++;
        failurePatterns[failureType].totalEffectiveness += cycle.effectiveness_score || 0;
        failurePatterns[failureType].count++;
      }

      const failureAnalysis = Object.values(failurePatterns).map((p: any) => ({
        type: p.type,
        frequency: p.frequency,
        successRate: Math.round(p.totalEffectiveness / p.count),
      }));

      // 3. Extract agent learnings
      const agentLearnings: Record<string, Set<string>> = {};

      for (const cycle of cycles) {
        const agents = cycle.affected_agents || [];
        for (const agent of agents) {
          if (!agentLearnings[agent]) {
            agentLearnings[agent] = new Set();
          }

          if (cycle.improvement_actions) {
            for (const action of cycle.improvement_actions) {
              if (action.targetAgent === agent || !action.targetAgent) {
                agentLearnings[agent].add(action.description);
              }
            }
          }
        }
      }

      const agentLearningsMap: Record<string, string[]> = {};
      for (const [agent, learnings] of Object.entries(agentLearnings)) {
        agentLearningsMap[agent] = Array.from(learnings).slice(0, 3);
      }

      // 4. Generate recommendations
      const recommendations: string[] = [];

      const mostFrequentFailure = failureAnalysis.sort((a, b) => b.frequency - a.frequency)[0];
      if (mostFrequentFailure && mostFrequentFailure.frequency > 2) {
        recommendations.push(
          `Focus on preventing "${mostFrequentFailure.type}" failures - occurred ${mostFrequentFailure.frequency} times`
        );
      }

      const leastSuccessful = failureAnalysis.sort((a, b) => a.successRate - b.successRate)[0];
      if (leastSuccessful && leastSuccessful.successRate < 60) {
        recommendations.push(
          `Improve correction strategy for "${leastSuccessful.type}" - current success rate only ${leastSuccessful.successRate}%`
        );
      }

      if (Object.keys(agentLearningsMap).length > 0) {
        const targetAgent = Object.entries(agentLearningsMap).sort(
          (a, b) => b[1].length - a[1].length
        )[0][0];
        recommendations.push(`${targetAgent} has learned multiple improvement strategies - reinforce these patterns`);
      }

      return {
        topImprovements: topImprovements as string[],
        failurePatterns: failureAnalysis as any[],
        agentLearnings: agentLearningsMap,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating learning insights:', error);
      return {
        topImprovements: [],
        failurePatterns: [],
        agentLearnings: {},
        recommendations: ['Unable to generate insights - check system logs'],
      };
    }
  }

  /**
   * Private: Calculate importance score
   */
  private calculateImportance(effectivenessScore: number, riskReduction: number): number {
    // Higher effectiveness and risk reduction = higher importance
    const importance = Math.round(effectivenessScore * 0.6 + riskReduction * 0.4);
    return Math.min(100, Math.max(50, importance)); // 50-100 range
  }
}

export const correctionArchiveBridge = new CorrectionArchiveBridge();
