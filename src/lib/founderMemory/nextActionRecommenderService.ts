/**
 * Next Action Recommender Service
 *
 * Generates concrete "What should I do next?" recommendations using
 * momentum, risk, and opportunity data.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { momentumScoringService } from './momentumScoringService';
import { opportunityConsolidationService } from './opportunityConsolidationService';
import { riskAnalysisService } from './riskAnalysisService';
import { overloadDetectionService } from './overloadDetectionService';

// Types
export type ActionCategory =
  | 'opportunity'
  | 'risk_mitigation'
  | 'follow_up'
  | 'decision'
  | 'review'
  | 'communication';

export type ActionUrgency = 'low' | 'normal' | 'high' | 'urgent';

export interface NextAction {
  id: string;
  founderId: string;
  workspaceId: string;
  actionTitle: string;
  actionDescription?: string;
  category: ActionCategory;
  priorityScore: number;
  urgency: ActionUrgency;
  relatedEntityType?: string;
  relatedEntityId?: string;
  contextJson: ActionContext;
  status: 'suggested' | 'accepted' | 'dismissed' | 'completed';
  generatedAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionContext {
  why: string;
  expectedOutcome: string;
  timeEstimate: string;
  dependencies?: string[];
  relatedData?: Record<string, unknown>;
}

export interface RecommendationConfig {
  founderId: string;
  workspaceId: string;
  maxActions?: number;
  categories?: ActionCategory[];
  includeContext?: boolean;
  refreshCache?: boolean;
}

export interface RecommendationResult {
  actions: NextAction[];
  summary: {
    totalSuggested: number;
    urgentCount: number;
    topPriority: NextAction | null;
    lastRefreshed: Date;
  };
}

class NextActionRecommenderService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Get recommended next actions
   */
  async getRecommendations(config: RecommendationConfig): Promise<RecommendationResult> {
    const {
      founderId,
      workspaceId,
      maxActions = 10,
      categories,
      includeContext = true,
      refreshCache = false,
    } = config;

    // Check for valid cached actions first
    if (!refreshCache) {
      const cached = await this.getCachedActions(founderId, workspaceId, maxActions, categories);
      if (cached.length >= 3) {
        return this.buildResult(cached);
      }
    }

    // Generate fresh recommendations
    const actions = await this.generateRecommendations(
      founderId,
      workspaceId,
      maxActions,
      categories,
      includeContext
    );

    // Save to cache
    await this.cacheActions(founderId, workspaceId, actions);

    return this.buildResult(actions);
  }

  /**
   * Get cached valid actions
   */
  private async getCachedActions(
    founderId: string,
    workspaceId: string,
    limit: number,
    categories?: ActionCategory[]
  ): Promise<NextAction[]> {
    let query = supabaseAdmin
      .from('founder_next_actions')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .eq('status', 'suggested')
      .gt('expires_at', new Date().toISOString());

    if (categories?.length) {
      query = query.in('category', categories);
    }

    const { data, error } = await query
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapDbToAction);
  }

  /**
   * Generate fresh recommendations
   */
  private async generateRecommendations(
    founderId: string,
    workspaceId: string,
    maxActions: number,
    categories?: ActionCategory[],
    includeContext?: boolean
  ): Promise<NextAction[]> {
    // Gather context data
    const [momentum, opportunities, risks, overload, pendingFollowups] = await Promise.all([
      momentumScoringService.getLatestMomentum(founderId, workspaceId),
      opportunityConsolidationService.getTopOpportunities(founderId, workspaceId, 10),
      riskAnalysisService.getActiveRisks(founderId, workspaceId, 10),
      overloadDetectionService.getQuickSummary(founderId, workspaceId),
      this.getPendingFollowups(workspaceId),
    ]);

    const actions: Omit<NextAction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // 1. Risk mitigation actions (highest priority if critical)
    const criticalRisks = risks.filter((r) => r.riskScore >= 0.5);
    for (const risk of criticalRisks.slice(0, 3)) {
      const action = await this.createRiskAction(founderId, workspaceId, risk, includeContext);
      if (!categories || categories.includes('risk_mitigation')) {
        actions.push(action);
      }
    }

    // 2. High-value opportunity actions
    const topOpportunities = opportunities.filter((o) => o.estimatedValueScore >= 70);
    for (const opp of topOpportunities.slice(0, 3)) {
      const action = await this.createOpportunityAction(founderId, workspaceId, opp, includeContext);
      if (!categories || categories.includes('opportunity')) {
        actions.push(action);
      }
    }

    // 3. Follow-up actions
    for (const contact of pendingFollowups.slice(0, 3)) {
      const action = this.createFollowupAction(founderId, workspaceId, contact);
      if (!categories || categories.includes('follow_up')) {
        actions.push(action);
      }
    }

    // 4. Review/decision actions based on momentum
    if (momentum && (!categories || categories.includes('review'))) {
      const lowDomains = this.findLowMomentumDomains(momentum);
      for (const domain of lowDomains.slice(0, 2)) {
        actions.push(this.createReviewAction(founderId, workspaceId, domain));
      }
    }

    // 5. If overloaded, add recovery action
    if (overload.overloaded && (!categories || categories.includes('decision'))) {
      actions.push({
        founderId,
        workspaceId,
        actionTitle: 'Address workload overload',
        actionDescription: overload.topIssue,
        category: 'decision',
        priorityScore: 95,
        urgency: 'urgent',
        contextJson: {
          why: 'Overload detected - sustainable pace is critical for long-term success',
          expectedOutcome: 'Reduced stress and improved focus',
          timeEstimate: '30-60 minutes for triage',
        },
        status: 'suggested',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      });
    }

    // Sort by priority and limit
    actions.sort((a, b) => b.priorityScore - a.priorityScore);

    return actions.slice(0, maxActions).map((a) => ({
      ...a,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as NextAction[];
  }

  /**
   * Create action for risk mitigation
   */
  private async createRiskAction(
    founderId: string,
    workspaceId: string,
    risk: { id: string; title: string; riskScore: number; category?: string; description?: string },
    includeContext?: boolean
  ): Promise<Omit<NextAction, 'id' | 'createdAt' | 'updatedAt'>> {
    const urgency: ActionUrgency = risk.riskScore >= 0.7 ? 'urgent' : risk.riskScore >= 0.5 ? 'high' : 'normal';
    const priorityScore = Math.round(risk.riskScore * 100);

    let context: ActionContext = {
      why: 'High-impact risk requires attention',
      expectedOutcome: 'Risk reduced or mitigated',
      timeEstimate: '15-30 minutes',
    };

    if (includeContext) {
      context = await this.enrichContextWithAI(
        `Risk mitigation: ${risk.title}`,
        risk.description || 'Address this risk to protect business operations'
      );
    }

    return {
      founderId,
      workspaceId,
      actionTitle: `Mitigate risk: ${risk.title}`,
      actionDescription: risk.description,
      category: 'risk_mitigation',
      priorityScore,
      urgency,
      relatedEntityType: 'risk',
      relatedEntityId: risk.id,
      contextJson: context,
      status: 'suggested',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  /**
   * Create action for opportunity pursuit
   */
  private async createOpportunityAction(
    founderId: string,
    workspaceId: string,
    opportunity: { id: string; title: string; estimatedValueScore: number; effortScore: number; description?: string },
    includeContext?: boolean
  ): Promise<Omit<NextAction, 'id' | 'createdAt' | 'updatedAt'>> {
    const valueEffortRatio = opportunity.estimatedValueScore / Math.max(1, opportunity.effortScore);
    const urgency: ActionUrgency = valueEffortRatio > 2 ? 'high' : 'normal';
    const priorityScore = Math.round((opportunity.estimatedValueScore * 0.7 + (100 - opportunity.effortScore) * 0.3));

    let context: ActionContext = {
      why: 'High-value opportunity with good ROI potential',
      expectedOutcome: 'Progress towards capturing value',
      timeEstimate: '30-60 minutes',
    };

    if (includeContext) {
      context = await this.enrichContextWithAI(
        `Opportunity: ${opportunity.title}`,
        opportunity.description || 'Take action to capture this business opportunity'
      );
    }

    return {
      founderId,
      workspaceId,
      actionTitle: `Pursue opportunity: ${opportunity.title}`,
      actionDescription: opportunity.description,
      category: 'opportunity',
      priorityScore,
      urgency,
      relatedEntityType: 'opportunity',
      relatedEntityId: opportunity.id,
      contextJson: context,
      status: 'suggested',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    };
  }

  /**
   * Create follow-up action
   */
  private createFollowupAction(
    founderId: string,
    workspaceId: string,
    contact: { id: string; name?: string; email: string; daysSinceContact: number }
  ): Omit<NextAction, 'id' | 'createdAt' | 'updatedAt'> {
    const urgency: ActionUrgency = contact.daysSinceContact > 30 ? 'high' : 'normal';
    const priorityScore = Math.min(90, 50 + contact.daysSinceContact);

    return {
      founderId,
      workspaceId,
      actionTitle: `Follow up with ${contact.name || contact.email}`,
      actionDescription: `No contact in ${contact.daysSinceContact} days`,
      category: 'follow_up',
      priorityScore,
      urgency,
      relatedEntityType: 'contact',
      relatedEntityId: contact.id,
      contextJson: {
        why: `Relationship may cool if not maintained`,
        expectedOutcome: 'Maintained relationship and potential insights',
        timeEstimate: '10-15 minutes',
      },
      status: 'suggested',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Create review action for low momentum domain
   */
  private createReviewAction(
    founderId: string,
    workspaceId: string,
    domain: { name: string; score: number }
  ): Omit<NextAction, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      founderId,
      workspaceId,
      actionTitle: `Review ${domain.name} strategy`,
      actionDescription: `${domain.name} momentum is low at ${domain.score}%`,
      category: 'review',
      priorityScore: 60,
      urgency: 'normal',
      contextJson: {
        why: `Low momentum in ${domain.name} may indicate issues`,
        expectedOutcome: 'Identified improvement actions',
        timeEstimate: '20-30 minutes',
      },
      status: 'suggested',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Enrich context with AI
   */
  private async enrichContextWithAI(title: string, description: string): Promise<ActionContext> {
    try {
      const prompt = `For this action: "${title}"
Description: ${description}

Provide brief context:
- Why is this important? (1 sentence)
- Expected outcome? (1 sentence)
- Time estimate? (e.g., "15-30 minutes")
- Any dependencies? (list or "none")

Return JSON:
{"why": "...", "expectedOutcome": "...", "timeEstimate": "...", "dependencies": ["..."]}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) throw new Error('No response');

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');

      return JSON.parse(jsonMatch[0]) as ActionContext;
    } catch {
      return {
        why: 'Important for business progress',
        expectedOutcome: 'Positive impact on operations',
        timeEstimate: '15-30 minutes',
      };
    }
  }

  /**
   * Get pending follow-ups
   */
  private async getPendingFollowups(
    workspaceId: string
  ): Promise<{ id: string; name?: string; email: string; daysSinceContact: number }[]> {
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, email, last_contacted_at')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'warm', 'hot'])
      .order('last_contacted_at', { ascending: true, nullsFirst: true })
      .limit(20);

    if (!contacts) return [];

    const now = Date.now();
    return contacts
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        daysSinceContact: c.last_contacted_at
          ? Math.floor((now - new Date(c.last_contacted_at).getTime()) / (24 * 60 * 60 * 1000))
          : 999,
      }))
      .filter((c) => c.daysSinceContact > 14);
  }

  /**
   * Find low momentum domains
   */
  private findLowMomentumDomains(
    momentum: { marketingScore: number; salesScore: number; deliveryScore: number; productScore: number; clientsScore: number; engineeringScore: number; financeScore: number }
  ): { name: string; score: number }[] {
    const domains = [
      { name: 'Marketing', score: momentum.marketingScore },
      { name: 'Sales', score: momentum.salesScore },
      { name: 'Delivery', score: momentum.deliveryScore },
      { name: 'Product', score: momentum.productScore },
      { name: 'Clients', score: momentum.clientsScore },
      { name: 'Engineering', score: momentum.engineeringScore },
      { name: 'Finance', score: momentum.financeScore },
    ];

    return domains
      .filter((d) => d.score < 50)
      .sort((a, b) => a.score - b.score);
  }

  /**
   * Cache actions to database
   */
  private async cacheActions(founderId: string, workspaceId: string, actions: NextAction[]): Promise<void> {
    // Clear expired actions
    await supabaseAdmin
      .from('founder_next_actions')
      .delete()
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .lt('expires_at', new Date().toISOString());

    // Insert new actions
    const records = actions.map((a) => ({
      id: a.id,
      founder_id: founderId,
      workspace_id: workspaceId,
      action_title: a.actionTitle,
      action_description: a.actionDescription,
      category: a.category,
      priority_score: a.priorityScore,
      urgency: a.urgency,
      related_entity_type: a.relatedEntityType,
      related_entity_id: a.relatedEntityId,
      context_json: a.contextJson,
      status: 'suggested',
      generated_at: a.generatedAt.toISOString(),
      expires_at: a.expiresAt.toISOString(),
    }));

    if (records.length > 0) {
      await supabaseAdmin.from('founder_next_actions').insert(records);
    }
  }

  /**
   * Build result with summary
   */
  private buildResult(actions: NextAction[]): RecommendationResult {
    const urgentCount = actions.filter((a) => a.urgency === 'urgent' || a.urgency === 'high').length;

    return {
      actions,
      summary: {
        totalSuggested: actions.length,
        urgentCount,
        topPriority: actions[0] || null,
        lastRefreshed: new Date(),
      },
    };
  }

  /**
   * Update action status
   */
  async updateActionStatus(
    actionId: string,
    workspaceId: string,
    status: 'accepted' | 'dismissed' | 'completed'
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('founder_next_actions')
      .update(updateData)
      .eq('id', actionId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Handle orchestrator intent
   */
  async handleSuggestNextActionsIntent(
    founderId: string,
    workspaceId: string,
    options?: { maxActions?: number; categories?: ActionCategory[] }
  ): Promise<{
    success: boolean;
    result?: RecommendationResult;
    error?: string;
  }> {
    try {
      const result = await this.getRecommendations({
        founderId,
        workspaceId,
        maxActions: options?.maxActions,
        categories: options?.categories,
        refreshCache: true,
      });

      return { success: true, result };
    } catch (error) {
      console.error('[NextActionRecommender] Intent handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map database record to typed object
   */
  private mapDbToAction(record: Record<string, unknown>): NextAction {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      actionTitle: record.action_title as string,
      actionDescription: record.action_description as string | undefined,
      category: record.category as ActionCategory,
      priorityScore: record.priority_score as number,
      urgency: record.urgency as ActionUrgency,
      relatedEntityType: record.related_entity_type as string | undefined,
      relatedEntityId: record.related_entity_id as string | undefined,
      contextJson: record.context_json as ActionContext,
      status: record.status as NextAction['status'],
      generatedAt: new Date(record.generated_at as string),
      expiresAt: new Date(record.expires_at as string),
      completedAt: record.completed_at ? new Date(record.completed_at as string) : undefined,
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
    };
  }
}

export const nextActionRecommenderService = new NextActionRecommenderService();
