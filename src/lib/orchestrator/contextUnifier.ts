/**
 * Context Unifier - Assembles Global Task Context
 *
 * Unifies memory systems, analytics, user data, and step history
 * into comprehensive context packets for agent execution.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryRetriever } from '@/lib/memory';

export interface ContextUnificationRequest {
  workspaceId: string;
  taskId: string;
  previousSteps: Array<{
    stepIndex: number;
    assignedAgent: string;
    outputPayload?: Record<string, any>;
  }>;
  objective: string;
}

export interface UnifiedContext {
  taskId: string;
  objective: string;
  workspaceContext: Record<string, any>;
  memoryContext: Array<{
    memoryId: string;
    type: string;
    content: string;
    importance: number;
  }>;
  stepHistory: Array<{
    stepIndex: number;
    agent: string;
    result: Record<string, any>;
  }>;
  analyticsSnapshot: Record<string, any>;
  userContext: Record<string, any>;
  timestamp: string;
}

export class ContextUnifier {
  private memoryRetriever: MemoryRetriever;

  constructor() {
    this.memoryRetriever = new MemoryRetriever();
  }

  /**
   * Assemble unified global context
   */
  async unify(request: ContextUnificationRequest): Promise<UnifiedContext> {
    const supabase = await getSupabaseServer();

    try {
      // Parallel fetch of all context sources
      const [
        memoryContext,
        analyticsSnapshot,
        workspaceContext,
        userContext,
      ] = await Promise.all([
        this.getMemoryContext(request.workspaceId, request.objective),
        this.getAnalyticsSnapshot(request.workspaceId),
        this.getWorkspaceContext(request.workspaceId),
        this.getUserContext(request.workspaceId),
      ]);

      return {
        taskId: request.taskId,
        objective: request.objective,
        workspaceContext,
        memoryContext,
        stepHistory: request.previousSteps.map((step) => ({
          stepIndex: step.stepIndex,
          agent: step.assignedAgent,
          result: step.outputPayload || {},
        })),
        analyticsSnapshot,
        userContext,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error unifying context:', error);
      // Return minimal context on failure
      return {
        taskId: request.taskId,
        objective: request.objective,
        workspaceContext: {},
        memoryContext: [],
        stepHistory: request.previousSteps.map((step) => ({
          stepIndex: step.stepIndex,
          agent: step.assignedAgent,
          result: step.outputPayload || {},
        })),
        analyticsSnapshot: {},
        userContext: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get relevant memories using hybrid search
   */
  private async getMemoryContext(
    workspaceId: string,
    objective: string
  ): Promise<UnifiedContext['memoryContext']> {
    try {
      const result = await this.memoryRetriever.retrieve({
        workspaceId,
        query: objective,
        limit: 5,
        minImportance: 40,
        includeRelated: true,
      });

      return result.memories.map((m) => ({
        memoryId: m.id,
        type: m.memoryType,
        content: m.content || '',
        importance: m.importance || 50,
      }));
    } catch (error) {
      console.error('Error retrieving memory context:', error);
      return [];
    }
  }

  /**
   * Get workspace analytics snapshot
   */
  private async getAnalyticsSnapshot(workspaceId: string): Promise<Record<string, any>> {
    const supabase = await getSupabaseServer();

    try {
      // Get recent contact stats
      const { data: contacts } = await supabase
        .from('contacts')
        .select('ai_score, status')
        .eq('workspace_id', workspaceId)
        .limit(100);

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status')
        .eq('workspace_id', workspaceId)
        .limit(50);

      const contactScores = contacts?.map((c: any) => c.ai_score || 0) || [];
      const campaignStatuses = campaigns?.map((c: any) => c.status) || [];

      return {
        totalContacts: contacts?.length || 0,
        avgContactScore: contactScores.length > 0
          ? (contactScores.reduce((a: number, b: number) => a + b, 0) / contactScores.length)
          : 0,
        activeCampaigns: campaignStatuses.filter((s: string) => s === 'active').length,
        hotLeads: contacts?.filter((c: any) => (c.ai_score || 0) >= 80).length || 0,
        warmLeads: contacts?.filter(
          (c: any) => (c.ai_score || 0) >= 60 && (c.ai_score || 0) < 80
        ).length || 0,
      };
    } catch (error) {
      console.error('Error getting analytics snapshot:', error);
      return {};
    }
  }

  /**
   * Get workspace configuration context
   */
  private async getWorkspaceContext(workspaceId: string): Promise<Record<string, any>> {
    const supabase = await getSupabaseServer();

    try {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('*, organizations(name)')
        .eq('id', workspaceId)
        .single();

      if (!workspace) return {};

      return {
        workspaceId,
        organizationName: workspace.organizations?.name || 'Unknown',
        createdAt: workspace.created_at,
        settings: workspace.settings || {},
      };
    } catch (error) {
      console.error('Error getting workspace context:', error);
      return {};
    }
  }

  /**
   * Get user context for current user
   */
  private async getUserContext(workspaceId: string): Promise<Record<string, any>> {
    const supabase = await getSupabaseServer();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return {};

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return {
        userId: user.id,
        email: user.email || '',
        fullName: profile?.full_name || 'Unknown User',
        role: profile?.role || 'user',
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  /**
   * Calculate context quality score
   */
  calculateQualityScore(context: UnifiedContext): number {
    let score = 50; // Base score

    // Memory coverage
    if (context.memoryContext.length > 0) {
      score += Math.min(context.memoryContext.length * 5, 20);
    }

    // Analytics data
    if (Object.keys(context.analyticsSnapshot).length > 0) {
      score += 15;
    }

    // Step history
    if (context.stepHistory.length > 0) {
      score += Math.min(context.stepHistory.length * 5, 15);
    }

    return Math.min(score, 100);
  }
}
