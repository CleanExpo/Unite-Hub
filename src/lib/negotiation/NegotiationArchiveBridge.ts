/**
 * Negotiation Archive Bridge
 *
 * Archives negotiation sessions and decisions for learning:
 * - Store complete negotiation transcripts with full metadata
 * - Detect patterns in agent behavior and decision-making
 * - Link negotiation outcomes to subsequent workflow performance
 * - Generate insights about agent cooperation effectiveness
 * - Enable historical analysis and trend tracking
 *
 * Core principle: Every negotiation is a learning opportunity.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface NegotiationRecord {
  recordId: string;
  workspaceId: string;
  sessionId: string;
  agentParticipants: string[];
  objective: string;
  proposalsCount: number;
  conflictsDetected: number;
  consensusAchieved: boolean;
  consensusPercentage: number;
  selectedAgent: string;
  selectedAction: string;
  decisionOutcome: 'success' | 'partial_success' | 'failure';
  timeToResolution: number; // ms
  negotiationTranscript: string;
  timestamp: string;
}

export interface NegotiationPattern {
  patternId: string;
  patternType:
    | 'agent_dominance'
    | 'consensus_builder'
    | 'risk_avoider'
    | 'cost_optimizer'
    | 'repeated_conflict';
  participatingAgents: string[];
  occurrences: number;
  successRate: number;
  avgConsensusPercentage: number;
  avgResolutionTime: number;
  keyInsight: string;
}

class NegotiationArchiveBridge {
  private memoryStore = new MemoryStore();

  /**
   * Archive a completed negotiation session
   */
  async archiveNegotiationSession(params: {
    workspaceId: string;
    sessionId: string;
    agentParticipants: string[];
    objective: string;
    proposalsCount: number;
    conflictsDetected: number;
    consensusAchieved: boolean;
    consensusPercentage: number;
    selectedAgent: string;
    selectedAction: string;
    decisionOutcome: 'success' | 'partial_success' | 'failure';
    negotiationTranscript: string;
    startTime: number; // Unix timestamp in ms
  }): Promise<NegotiationRecord> {
    const supabase = await getSupabaseServer();
    const recordId = crypto.randomUUID();
    const endTime = Date.now();
    const timeToResolution = endTime - params.startTime;

    try {
      const record: NegotiationRecord = {
        recordId,
        workspaceId: params.workspaceId,
        sessionId: params.sessionId,
        agentParticipants: params.agentParticipants,
        objective: params.objective,
        proposalsCount: params.proposalsCount,
        conflictsDetected: params.conflictsDetected,
        consensusAchieved: params.consensusAchieved,
        consensusPercentage: params.consensusPercentage,
        selectedAgent: params.selectedAgent,
        selectedAction: params.selectedAction,
        decisionOutcome: params.decisionOutcome,
        timeToResolution,
        negotiationTranscript: params.negotiationTranscript,
        timestamp: new Date().toISOString(),
      };

      // 1. Store record to database
      await supabase.from('negotiation_archives').insert({
        workspace_id: params.workspaceId,
        record_id: recordId,
        session_id: params.sessionId,
        agent_participants: params.agentParticipants,
        objective: params.objective,
        proposals_count: params.proposalsCount,
        conflicts_detected: params.conflictsDetected,
        consensus_achieved: params.consensusAchieved,
        consensus_percentage: params.consensusPercentage,
        selected_agent: params.selectedAgent,
        selected_action: params.selectedAction,
        decision_outcome: params.decisionOutcome,
        time_to_resolution: timeToResolution,
        transcript: params.negotiationTranscript,
        created_at: record.timestamp,
      });

      // 2. Archive to memory system
      await this.memoryStore.store({
        workspaceId: params.workspaceId,
        agent: 'negotiation-archive',
        memoryType: 'negotiation_resolved',
        content: {
          record_id: recordId,
          session_id: params.sessionId,
          agents_involved: params.agentParticipants.length,
          consensus: params.consensusAchieved,
          outcome: params.decisionOutcome,
          resolution_time_ms: timeToResolution,
          timestamp: record.timestamp,
        },
        importance: this.calculateImportance(
          params.consensusAchieved,
          params.conflictsDetected,
          params.decisionOutcome
        ),
        confidence: 85,
        keywords: ['negotiation', 'consensus', 'decision', 'multi-agent', 'arbitration'],
      });

      // 3. Detect and record patterns
      await this.detectNegotiationPatterns(params.workspaceId, params.agentParticipants);

      return record;
    } catch (error) {
      console.error('Negotiation archive error:', error);
      throw error;
    }
  }

  /**
   * Detect patterns in negotiation behavior
   */
  private async detectNegotiationPatterns(
    workspaceId: string,
    agentParticipants: string[]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get recent negotiation records involving these agents
    const { data: recentRecords } = await supabase
      .from('negotiation_archives')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentRecords || recentRecords.length < 3) {
return;
}

    // Analyze agent selection frequency
    const agentSelectionCounts: Record<string, number> = {};
    const agentSuccessCounts: Record<string, number> = {};

    for (const record of recentRecords) {
      const agent = record.selected_agent;
      agentSelectionCounts[agent] = (agentSelectionCounts[agent] || 0) + 1;

      if (record.decision_outcome === 'success' || record.decision_outcome === 'partial_success') {
        agentSuccessCounts[agent] = (agentSuccessCounts[agent] || 0) + 1;
      }
    }

    // Detect dominance pattern
    for (const [agent, count] of Object.entries(agentSelectionCounts)) {
      if (count >= 5) {
        // Agent was selected 5+ times
        const successRate = (agentSuccessCounts[agent] || 0) / count;

        // Check if pattern already exists
        const { data: existing } = await supabase
          .from('negotiation_patterns')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('pattern_type', 'agent_dominance')
          .eq('primary_agent', agent);

        if (existing && existing.length > 0) {
          // Update existing pattern
          const pattern = existing[0];
          const newOccurrences = (pattern.occurrences || 0) + 1;
          const newSuccessRate =
            ((pattern.success_rate || 0) * (newOccurrences - 1) + successRate) / newOccurrences;

          await supabase
            .from('negotiation_patterns')
            .update({
              occurrences: newOccurrences,
              success_rate: newSuccessRate,
              last_observed_at: new Date().toISOString(),
            })
            .eq('id', pattern.id);
        } else {
          // Create new pattern
          await supabase.from('negotiation_patterns').insert({
            workspace_id: workspaceId,
            pattern_type: 'agent_dominance',
            primary_agent: agent,
            occurrences: count,
            success_rate: successRate,
            key_insight: `${agent} is selected in ${((count / recentRecords.length) * 100).toFixed(0)}% of negotiations with ${(successRate * 100).toFixed(0)}% success rate`,
            first_observed_at: new Date().toISOString(),
            last_observed_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  /**
   * Calculate importance score for memory storage
   */
  private calculateImportance(
    consensusAchieved: boolean,
    conflictsDetected: number,
    outcome: string
  ): number {
    let score = 50; // Base

    // Consensus boost
    if (consensusAchieved) {
score += 20;
}

    // Conflict complexity boost
    score += Math.min(20, conflictsDetected * 5);

    // Outcome boost
    if (outcome === 'success') {
score += 15;
} else if (outcome === 'failure') {
score += 10;
} // Failures are also important to remember

    return Math.min(100, score);
  }

  /**
   * Get negotiation statistics for workspace
   */
  async getNegotiationStats(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{
    totalNegotiations: number;
    consensusRate: number;
    avgResolutionTime: number;
    successRate: number;
    mostActiveAgents: Array<{ agent: string; participationCount: number }>;
    patternCount: number;
  }> {
    const supabase = await getSupabaseServer();
    const lookbackDate = new Date(Date.now() - (params.lookbackDays || 7) * 24 * 60 * 60 * 1000);

    // Get records
    const { data: records } = await supabase
      .from('negotiation_archives')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('created_at', lookbackDate.toISOString());

    if (!records || records.length === 0) {
      return {
        totalNegotiations: 0,
        consensusRate: 0,
        avgResolutionTime: 0,
        successRate: 0,
        mostActiveAgents: [],
        patternCount: 0,
      };
    }

    // Calculate metrics
    const consensusCount = records.filter(r => r.consensus_achieved).length;
    const successCount = records.filter(
      r => r.decision_outcome === 'success' || r.decision_outcome === 'partial_success'
    ).length;
    const avgResolutionTime =
      records.reduce((sum, r) => sum + (r.time_to_resolution || 0), 0) / records.length;

    // Get most active agents
    const agentCounts: Record<string, number> = {};
    for (const record of records) {
      for (const agent of record.agent_participants || []) {
        agentCounts[agent] = (agentCounts[agent] || 0) + 1;
      }
    }

    const mostActiveAgents = Object.entries(agentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent, count]) => ({ agent, participationCount: count }));

    // Get patterns
    const { data: patterns } = await supabase
      .from('negotiation_patterns')
      .select('*')
      .eq('workspace_id', params.workspaceId);

    return {
      totalNegotiations: records.length,
      consensusRate: (consensusCount / records.length) * 100,
      avgResolutionTime: Math.round(avgResolutionTime),
      successRate: (successCount / records.length) * 100,
      mostActiveAgents,
      patternCount: patterns?.length || 0,
    };
  }

  /**
   * Get patterns detected in negotiation history
   */
  async getDetectedPatterns(params: {
    workspaceId: string;
    patternType?: string;
  }): Promise<NegotiationPattern[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('negotiation_patterns')
      .select('*')
      .eq('workspace_id', params.workspaceId);

    if (params.patternType) {
      query = query.eq('pattern_type', params.patternType);
    }

    const { data } = await query.order('occurrences', { ascending: false });

    return (data || []).map(p => ({
      patternId: p.id,
      patternType: p.pattern_type,
      participatingAgents: p.participating_agents || [],
      occurrences: p.occurrences,
      successRate: p.success_rate,
      avgConsensusPercentage: p.avg_consensus_percentage || 65,
      avgResolutionTime: p.avg_resolution_time || 0,
      keyInsight: p.key_insight,
    }));
  }
}

export const negotiationArchiveBridge = new NegotiationArchiveBridge();
