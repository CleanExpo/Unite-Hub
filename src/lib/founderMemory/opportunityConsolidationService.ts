/**
 * Opportunity Consolidation Service
 *
 * Consolidates opportunities from email ideas, pre-client insights,
 * social/ads/search data into founder_opportunity_backlog.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Types
export type OpportunitySource =
  | 'email_idea'
  | 'pre_client_insight'
  | 'social_mention'
  | 'ad_signal'
  | 'search_trend'
  | 'manual';

export type OpportunityCategory =
  | 'new_client'
  | 'upsell'
  | 'partnership'
  | 'market_expansion'
  | 'product'
  | 'process';

export type OpportunityStatus =
  | 'open'
  | 'evaluating'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'deferred';

export interface FounderOpportunity {
  id: string;
  founderId: string;
  workspaceId: string;
  relatedClientId?: string;
  relatedPreClientId?: string;
  sourceType: OpportunitySource;
  sourceId?: string;
  title: string;
  description?: string;
  estimatedValueScore: number;
  effortScore: number;
  timeHorizonWeeks: number;
  category?: OpportunityCategory;
  tags: string[];
  status: OpportunityStatus;
  priorityRank?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsolidationConfig {
  founderId: string;
  workspaceId: string;
  sources?: OpportunitySource[];
  lookbackDays?: number;
  scoreWithAI?: boolean;
}

export interface ConsolidationResult {
  newOpportunities: number;
  updatedOpportunities: number;
  totalOpportunities: number;
  topOpportunities: FounderOpportunity[];
}

export interface OpportunityInput {
  sourceType: OpportunitySource;
  sourceId?: string;
  relatedClientId?: string;
  relatedPreClientId?: string;
  title: string;
  description?: string;
  rawData?: Record<string, unknown>;
}

class OpportunityConsolidationService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Consolidate opportunities from all sources
   */
  async consolidateOpportunities(config: ConsolidationConfig): Promise<ConsolidationResult> {
    const {
      founderId,
      workspaceId,
      sources = ['email_idea', 'pre_client_insight', 'social_mention', 'ad_signal', 'search_trend'],
      lookbackDays = 30,
      scoreWithAI = true,
    } = config;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    let newCount = 0;
    let updatedCount = 0;

    // Gather opportunities from each source
    const allOpportunities: OpportunityInput[] = [];

    if (sources.includes('email_idea')) {
      const emailOpps = await this.gatherEmailIdeas(workspaceId, lookbackDate);
      allOpportunities.push(...emailOpps);
    }

    if (sources.includes('pre_client_insight')) {
      const preClientOpps = await this.gatherPreClientInsights(workspaceId, lookbackDate);
      allOpportunities.push(...preClientOpps);
    }

    if (sources.includes('social_mention')) {
      const socialOpps = await this.gatherSocialMentions(workspaceId, lookbackDate);
      allOpportunities.push(...socialOpps);
    }

    if (sources.includes('ad_signal')) {
      const adOpps = await this.gatherAdSignals(workspaceId, lookbackDate);
      allOpportunities.push(...adOpps);
    }

    if (sources.includes('search_trend')) {
      const searchOpps = await this.gatherSearchTrends(workspaceId, lookbackDate);
      allOpportunities.push(...searchOpps);
    }

    // Score and save each opportunity
    for (const opp of allOpportunities) {
      const result = await this.processOpportunity(founderId, workspaceId, opp, scoreWithAI);
      if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
    }

    // Recalculate priority ranks
    await this.recalculatePriorityRanks(founderId, workspaceId);

    // Get total count and top opportunities
    const { count: totalOpportunities } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .in('status', ['open', 'evaluating']);

    const topOpportunities = await this.getTopOpportunities(founderId, workspaceId, 5);

    return {
      newOpportunities: newCount,
      updatedOpportunities: updatedCount,
      totalOpportunities: totalOpportunities || 0,
      topOpportunities,
    };
  }

  /**
   * Gather opportunities from email ideas
   */
  private async gatherEmailIdeas(
    workspaceId: string,
    sinceDate: Date
  ): Promise<OpportunityInput[]> {
    // Look for emails with extracted_intent containing opportunity-related keywords
    const { data: emails } = await supabaseAdmin
      .from('emails')
      .select('id, contact_id, subject, extracted_intent, extracted_idea')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceDate.toISOString())
      .or('extracted_intent.ilike.%opportunity%,extracted_idea.neq.null');

    if (!emails) {
return [];
}

    return emails
      .filter((e) => e.extracted_idea || (e.extracted_intent && e.extracted_intent.includes('opportunity')))
      .map((e) => ({
        sourceType: 'email_idea' as OpportunitySource,
        sourceId: e.id,
        relatedClientId: e.contact_id,
        title: e.extracted_idea || `Opportunity from: ${e.subject}`,
        description: e.extracted_intent,
      }));
  }

  /**
   * Gather opportunities from pre-client insights
   */
  private async gatherPreClientInsights(
    workspaceId: string,
    sinceDate: Date
  ): Promise<OpportunityInput[]> {
    const { data: insights } = await supabaseAdmin
      .from('pre_client_insights')
      .select('id, pre_client_id, title, detail, category, confidence_score')
      .eq('workspace_id', workspaceId)
      .eq('category', 'opportunity')
      .in('status', ['open', 'new'])
      .gte('created_at', sinceDate.toISOString());

    if (!insights) {
return [];
}

    return insights.map((i) => ({
      sourceType: 'pre_client_insight' as OpportunitySource,
      sourceId: i.id,
      relatedPreClientId: i.pre_client_id,
      title: i.title,
      description: i.detail,
      rawData: { confidenceScore: i.confidence_score },
    }));
  }

  /**
   * Gather opportunities from social mentions
   */
  private async gatherSocialMentions(
    workspaceId: string,
    sinceDate: Date
  ): Promise<OpportunityInput[]> {
    // Try to get from social_inbox_messages if available
    const { data: messages } = await supabaseAdmin
      .from('social_inbox_messages')
      .select('id, content, platform, sentiment_score')
      .eq('workspace_id', workspaceId)
      .gte('sentiment_score', 0.7) // Positive sentiment
      .gte('created_at', sinceDate.toISOString())
      .limit(20);

    if (!messages) {
return [];
}

    return messages
      .filter((m) => m.content && m.content.length > 20)
      .map((m) => ({
        sourceType: 'social_mention' as OpportunitySource,
        sourceId: m.id,
        title: `Social opportunity: ${m.platform}`,
        description: m.content?.slice(0, 200),
        rawData: { platform: m.platform, sentiment: m.sentiment_score },
      }));
  }

  /**
   * Gather opportunities from ad performance signals
   */
  private async gatherAdSignals(
    workspaceId: string,
    sinceDate: Date
  ): Promise<OpportunityInput[]> {
    // Look for high-performing ads
    const { data: ads } = await supabaseAdmin
      .from('ad_campaigns')
      .select('id, name, platform, impressions, clicks, conversions')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceDate.toISOString());

    if (!ads) {
return [];
}

    // Filter for high CTR or conversion opportunities
    return ads
      .filter((a) => {
        const ctr = a.impressions > 0 ? a.clicks / a.impressions : 0;
        return ctr > 0.05 || (a.conversions && a.conversions > 5);
      })
      .map((a) => ({
        sourceType: 'ad_signal' as OpportunitySource,
        sourceId: a.id,
        title: `Scale ad: ${a.name}`,
        description: `High-performing ${a.platform} ad with ${a.clicks} clicks and ${a.conversions || 0} conversions`,
        rawData: { impressions: a.impressions, clicks: a.clicks, conversions: a.conversions },
      }));
  }

  /**
   * Gather opportunities from search trends
   */
  private async gatherSearchTrends(
    workspaceId: string,
    sinceDate: Date
  ): Promise<OpportunityInput[]> {
    // Look for trending queries with high positions
    const { data: analytics } = await supabaseAdmin
      .from('search_analytics')
      .select('id, query, impressions, clicks, position')
      .eq('workspace_id', workspaceId)
      .gte('date', sinceDate.toISOString().split('T')[0])
      .lte('position', 20) // Top 20 positions
      .order('impressions', { ascending: false })
      .limit(10);

    if (!analytics) {
return [];
}

    return analytics
      .filter((a) => a.impressions > 100)
      .map((a) => ({
        sourceType: 'search_trend' as OpportunitySource,
        sourceId: a.id,
        title: `Content opportunity: "${a.query}"`,
        description: `Ranking #${Math.round(a.position)} with ${a.impressions} impressions. Potential to capture more traffic.`,
        rawData: { query: a.query, position: a.position, impressions: a.impressions },
      }));
  }

  /**
   * Process and score a single opportunity
   */
  private async processOpportunity(
    founderId: string,
    workspaceId: string,
    opp: OpportunityInput,
    useAIScoring: boolean
  ): Promise<'new' | 'updated' | 'skipped'> {
    // Check for existing similar opportunity
    const { data: existing } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('id, estimated_value_score')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .eq('source_type', opp.sourceType)
      .eq('source_id', opp.sourceId)
      .single();

    let valueScore = 50;
    let effortScore = 50;
    let timeHorizon = 4;
    let category: OpportunityCategory | undefined;

    if (useAIScoring) {
      const scoring = await this.scoreOpportunityWithAI(opp);
      valueScore = scoring.valueScore;
      effortScore = scoring.effortScore;
      timeHorizon = scoring.timeHorizon;
      category = scoring.category;
    }

    if (existing) {
      // Update if significantly different
      if (Math.abs(existing.estimated_value_score - valueScore) > 10) {
        await supabaseAdmin
          .from('founder_opportunity_backlog')
          .update({
            title: opp.title,
            description: opp.description,
            estimated_value_score: valueScore,
            effort_score: effortScore,
            time_horizon_weeks: timeHorizon,
            category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        return 'updated';
      }
      return 'skipped';
    }

    // Insert new opportunity
    await supabaseAdmin.from('founder_opportunity_backlog').insert({
      founder_id: founderId,
      workspace_id: workspaceId,
      related_client_id: opp.relatedClientId,
      related_pre_client_id: opp.relatedPreClientId,
      source_type: opp.sourceType,
      source_id: opp.sourceId,
      title: opp.title,
      description: opp.description,
      estimated_value_score: valueScore,
      effort_score: effortScore,
      time_horizon_weeks: timeHorizon,
      category,
      status: 'open',
    });

    return 'new';
  }

  /**
   * Score opportunity using AI
   */
  private async scoreOpportunityWithAI(
    opp: OpportunityInput
  ): Promise<{
    valueScore: number;
    effortScore: number;
    timeHorizon: number;
    category?: OpportunityCategory;
  }> {
    try {
      const prompt = `Score this business opportunity:

Title: ${opp.title}
Description: ${opp.description || 'N/A'}
Source: ${opp.sourceType}
${opp.rawData ? `Additional data: ${JSON.stringify(opp.rawData)}` : ''}

Provide scores (0-100) and analysis:
- value_score: Potential business value (0=low, 100=high)
- effort_score: Required effort (0=easy, 100=very hard)
- time_horizon_weeks: Estimated weeks to realize value (1-52)
- category: One of [new_client, upsell, partnership, market_expansion, product, process]

Return JSON only:
{"value_score": 70, "effort_score": 40, "time_horizon_weeks": 4, "category": "new_client"}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) {
throw new Error('No response');
}

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
throw new Error('No JSON found');
}

      const result = JSON.parse(jsonMatch[0]);

      return {
        valueScore: Math.max(0, Math.min(100, result.value_score || 50)),
        effortScore: Math.max(0, Math.min(100, result.effort_score || 50)),
        timeHorizon: Math.max(1, Math.min(52, result.time_horizon_weeks || 4)),
        category: result.category as OpportunityCategory,
      };
    } catch (error) {
      console.error('[OpportunityConsolidation] AI scoring failed:', error);
      return { valueScore: 50, effortScore: 50, timeHorizon: 4 };
    }
  }

  /**
   * Recalculate priority ranks based on value/effort ratio
   */
  private async recalculatePriorityRanks(founderId: string, workspaceId: string): Promise<void> {
    const { data: opportunities } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('id, estimated_value_score, effort_score, time_horizon_weeks')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .in('status', ['open', 'evaluating']);

    if (!opportunities) {
return;
}

    // Calculate priority score: value / (effort * time)
    const ranked = opportunities
      .map((o) => ({
        id: o.id,
        priorityScore:
          o.estimated_value_score / (Math.max(1, o.effort_score / 10) * Math.max(1, o.time_horizon_weeks / 4)),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    // Update ranks
    for (let i = 0; i < ranked.length; i++) {
      await supabaseAdmin
        .from('founder_opportunity_backlog')
        .update({ priority_rank: i + 1 })
        .eq('id', ranked[i].id);
    }
  }

  /**
   * Get top opportunities
   */
  async getTopOpportunities(
    founderId: string,
    workspaceId: string,
    limit = 10
  ): Promise<FounderOpportunity[]> {
    const { data, error } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .in('status', ['open', 'evaluating'])
      .order('priority_rank', { ascending: true, nullsFirst: false })
      .order('estimated_value_score', { ascending: false })
      .limit(limit);

    if (error || !data) {
return [];
}
    return data.map(this.mapDbToOpportunity);
  }

  /**
   * Get all opportunities with filters
   */
  async getOpportunities(
    founderId: string,
    workspaceId: string,
    options?: {
      status?: OpportunityStatus[];
      category?: OpportunityCategory;
      sourceType?: OpportunitySource;
      minValueScore?: number;
      limit?: number;
    }
  ): Promise<FounderOpportunity[]> {
    let query = supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId);

    if (options?.status?.length) {
      query = query.in('status', options.status);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.sourceType) {
      query = query.eq('source_type', options.sourceType);
    }

    if (options?.minValueScore !== undefined) {
      query = query.gte('estimated_value_score', options.minValueScore);
    }

    query = query
      .order('priority_rank', { ascending: true, nullsFirst: false })
      .limit(options?.limit || 50);

    const { data, error } = await query;

    if (error || !data) {
return [];
}
    return data.map(this.mapDbToOpportunity);
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(
    opportunityId: string,
    workspaceId: string,
    status: OpportunityStatus,
    notes?: string
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
updateData.notes = notes;
}

    const { error } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .update(updateData)
      .eq('id', opportunityId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Add manual opportunity
   */
  async addManualOpportunity(
    founderId: string,
    workspaceId: string,
    data: {
      title: string;
      description?: string;
      estimatedValueScore?: number;
      effortScore?: number;
      timeHorizonWeeks?: number;
      category?: OpportunityCategory;
      tags?: string[];
      relatedClientId?: string;
      relatedPreClientId?: string;
    }
  ): Promise<FounderOpportunity | null> {
    const { data: result, error } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .insert({
        founder_id: founderId,
        workspace_id: workspaceId,
        source_type: 'manual',
        title: data.title,
        description: data.description,
        estimated_value_score: data.estimatedValueScore || 50,
        effort_score: data.effortScore || 50,
        time_horizon_weeks: data.timeHorizonWeeks || 4,
        category: data.category,
        tags: data.tags || [],
        related_client_id: data.relatedClientId,
        related_pre_client_id: data.relatedPreClientId,
        status: 'open',
      })
      .select()
      .single();

    if (error || !result) {
return null;
}

    // Recalculate ranks
    await this.recalculatePriorityRanks(founderId, workspaceId);

    return this.mapDbToOpportunity(result);
  }

  /**
   * Map database record to typed object
   */
  private mapDbToOpportunity(record: Record<string, unknown>): FounderOpportunity {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      relatedClientId: record.related_client_id as string | undefined,
      relatedPreClientId: record.related_pre_client_id as string | undefined,
      sourceType: record.source_type as OpportunitySource,
      sourceId: record.source_id as string | undefined,
      title: record.title as string,
      description: record.description as string | undefined,
      estimatedValueScore: record.estimated_value_score as number,
      effortScore: record.effort_score as number,
      timeHorizonWeeks: record.time_horizon_weeks as number,
      category: record.category as OpportunityCategory | undefined,
      tags: record.tags as string[],
      status: record.status as OpportunityStatus,
      priorityRank: record.priority_rank as number | undefined,
      notes: record.notes as string | undefined,
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
    };
  }
}

export const opportunityConsolidationService = new OpportunityConsolidationService();
