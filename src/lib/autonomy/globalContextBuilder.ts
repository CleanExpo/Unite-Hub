/**
 * Global Context Builder
 *
 * Assembles unified context from all intelligence systems:
 * - Memory system (top 20 relevant memories with embeddings)
 * - Reasoning engine (recent reasoning runs and insights)
 * - Orchestrator (active tasks and step history)
 * - User analytics (activity patterns and engagement)
 * - System health (agent status and performance metrics)
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GlobalContext {
  workspaceId: string;
  objective: string;

  // Memory influence
  relevantMemories: MemoryContext[];
  memoryConfidence: number;
  memoryInfluence: number;

  // Reasoning insights
  recentReasoningRuns: ReasoningContext[];
  reasoningConfidence: number;

  // Orchestration state
  activeOrchestrations: OrchestrationContext[];
  orchestratorConfidence: number;

  // User and system state
  userActivityPattern: ActivityPattern;
  systemHealth: SystemHealth;

  // Aggregated metrics
  aggregatedRisk: number;
  aggregatedUncertainty: number;
  activeAgents: string[];

  // Plan breakdown
  planSteps?: string[];
  agentHealth?: Record<string, string>;

  timestamp: string;
}

interface MemoryContext {
  id: string;
  content: string;
  importance: number;
  confidence: number;
  recallPriority?: number;
}

interface ReasoningContext {
  id: string;
  objective: string;
  finalDecision: string;
  riskScore: number;
  uncertaintyScore: number;
}

interface OrchestrationContext {
  id: string;
  objective: string;
  status: string;
  riskScore: number;
  uncertaintyScore: number;
}

interface ActivityPattern {
  recentActions: number;
  activeTime: string;
  preferredAgents: string[];
  successRate: number;
}

interface SystemHealth {
  emailAgent: AgentStatus;
  contentAgent: AgentStatus;
  contactIntelligence: AgentStatus;
  orchestrator: AgentStatus;
  memorySystem: AgentStatus;
}

interface AgentStatus {
  status: 'healthy' | 'degraded' | 'offline';
  lastHeartbeat: string;
  errorRate: number;
}

class GlobalContextBuilder {
  /**
   * Build comprehensive global context
   */
  async buildContext(params: {
    workspaceId: string;
    objective: string;
  }): Promise<GlobalContext> {
    const supabase = await getSupabaseServer();
    const now = new Date();

    try {
      // Fetch all context in parallel
      const [memories, reasoningRuns, orchestrations, health] = await Promise.all([
        this.fetchRelevantMemories(params.workspaceId),
        this.fetchRecentReasoningRuns(params.workspaceId),
        this.fetchActiveOrchestrations(params.workspaceId),
        this.assessSystemHealth(),
      ]);

      // Build activity pattern
      const { data: recentActions } = await supabase
        .from('audit_logs')
        .select('action')
        .eq('workspace_id', params.workspaceId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      const activityPattern: ActivityPattern = {
        recentActions: recentActions?.length || 0,
        activeTime: now.toISOString(),
        preferredAgents: this.extractPreferredAgents(recentActions || []),
        successRate: await this.calculateSuccessRate(params.workspaceId),
      };

      // Extract agents from orchestrations
      const activeAgents = new Set<string>();
      for (const orch of orchestrations) {
        // Will be populated during execution
      }

      // Calculate aggregated scores
      const memoryConfidence = memories.length > 0 ? 70 + (memories[0]?.confidence || 0) / 2 : 50;
      const reasoningConfidence =
        reasoningRuns.length > 0
          ? 100 - reasoningRuns[0]?.uncertaintyScore || 75
          : 60;
      const orchestratorConfidence = orchestrations.length > 0 ? 80 : 60;

      const aggregatedRisk = Math.round(
        (orchestrations.reduce((sum, o) => sum + (o.riskScore || 0), 0) /
          Math.max(orchestrations.length, 1)) *
          0.5 +
          (reasoningRuns.reduce((sum, r) => sum + (r.riskScore || 0), 0) /
            Math.max(reasoningRuns.length, 1)) *
            0.5
      );

      const aggregatedUncertainty = Math.round(
        (orchestrations.reduce((sum, o) => sum + (o.uncertaintyScore || 0), 0) /
          Math.max(orchestrations.length, 1)) *
          0.5 +
          (reasoningRuns.reduce((sum, r) => sum + (r.uncertaintyScore || 0), 0) /
            Math.max(reasoningRuns.length, 1)) *
            0.5
      );

      return {
        workspaceId: params.workspaceId,
        objective: params.objective,
        relevantMemories: memories,
        memoryConfidence: Math.round(memoryConfidence),
        memoryInfluence: memories.length,
        recentReasoningRuns: reasoningRuns,
        reasoningConfidence: Math.round(reasoningConfidence),
        activeOrchestrations: orchestrations,
        orchestratorConfidence: Math.round(orchestratorConfidence),
        userActivityPattern: activityPattern,
        systemHealth: health,
        aggregatedRisk,
        aggregatedUncertainty,
        activeAgents: Array.from(activeAgents),
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error('Error building global context:', error);
      throw error;
    }
  }

  /**
   * Fetch top 20 relevant memories
   */
  private async fetchRelevantMemories(workspaceId: string): Promise<MemoryContext[]> {
    const supabase = await getSupabaseServer();

    const { data: memories } = await supabase
      .from('ai_memory')
      .select('id, content, importance, confidence, recall_priority')
      .eq('workspace_id', workspaceId)
      .order('importance', { ascending: false })
      .order('recall_priority', { ascending: false })
      .limit(20);

    return (
      memories?.map((m) => ({
        id: m.id,
        content: m.content?.substring(0, 200) || '',
        importance: m.importance || 0,
        confidence: m.confidence || 0,
        recallPriority: m.recall_priority || 0,
      })) || []
    );
  }

  /**
   * Fetch recent reasoning runs
   */
  private async fetchRecentReasoningRuns(workspaceId: string): Promise<ReasoningContext[]> {
    const supabase = await getSupabaseServer();

    const { data: runs } = await supabase
      .from('reasoning_runs')
      .select('id, objective, final_decision, final_risk, final_uncertainty')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    return (
      runs?.map((r) => ({
        id: r.id,
        objective: r.objective || '',
        finalDecision: r.final_decision || '',
        riskScore: r.final_risk || 0,
        uncertaintyScore: r.final_uncertainty || 0,
      })) || []
    );
  }

  /**
   * Fetch active orchestrations
   */
  private async fetchActiveOrchestrations(workspaceId: string): Promise<OrchestrationContext[]> {
    const supabase = await getSupabaseServer();

    const { data: tasks } = await supabase
      .from('orchestrator_tasks')
      .select('id, objective, status, risk_score, uncertainty_score')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'running', 'paused'])
      .order('created_at', { ascending: false })
      .limit(10);

    return (
      tasks?.map((t) => ({
        id: t.id,
        objective: t.objective || '',
        status: t.status || '',
        riskScore: t.risk_score || 0,
        uncertaintyScore: t.uncertainty_score || 0,
      })) || []
    );
  }

  /**
   * Assess system health across all agents
   */
  private async assessSystemHealth(): Promise<SystemHealth> {
    // In a real implementation, would check actual agent heartbeats
    // For now, return nominal status
    return {
      emailAgent: {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        errorRate: 0,
      },
      contentAgent: {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        errorRate: 0,
      },
      contactIntelligence: {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        errorRate: 0,
      },
      orchestrator: {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        errorRate: 0,
      },
      memorySystem: {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        errorRate: 0,
      },
    };
  }

  /**
   * Extract agent preferences from recent actions
   */
  private extractPreferredAgents(actions: any[]): string[] {
    const agentCount: Record<string, number> = {};

    for (const action of actions) {
      const actionType = action.action || '';
      if (actionType.includes('email')) {
agentCount['email-agent'] = (agentCount['email-agent'] || 0) + 1;
}
      if (actionType.includes('content')) {
agentCount['content-agent'] = (agentCount['content-agent'] || 0) + 1;
}
      if (actionType.includes('contact')) {
agentCount['contact-intelligence'] = (agentCount['contact-intelligence'] || 0) + 1;
}
      if (actionType.includes('orchestrator')) {
agentCount['orchestrator'] = (agentCount['orchestrator'] || 0) + 1;
}
    }

    return Object.entries(agentCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([agent]) => agent);
  }

  /**
   * Calculate overall success rate
   */
  private async calculateSuccessRate(workspaceId: string): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data: orchestrations } = await supabase
      .from('orchestrator_tasks')
      .select('status')
      .eq('workspace_id', workspaceId)
      .limit(50);

    if (!orchestrations || orchestrations.length === 0) {
return 0;
}

    const completed = orchestrations.filter((t) => t.status === 'completed').length;
    return Math.round((completed / orchestrations.length) * 100);
  }
}

export const globalContextBuilder = new GlobalContextBuilder();
