/**
 * Founder Memory Aggregation Service
 *
 * Aggregates signals from CRM, pre-clients, email intelligence, social inbox,
 * ads, search, and automation logs into unified founder_memory_snapshots.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';

// Types
export interface FounderMemorySnapshot {
  id: string;
  founderId: string;
  workspaceId: string;
  snapshotAt: Date;
  timeRangeStart: Date;
  timeRangeEnd: Date;
  summaryJson: SnapshotSummary;
  dataSourcesIncluded: string[];
  confidenceScore: number;
  createdAt: Date;
}

export interface SnapshotSummary {
  totalClients: number;
  activeClients: number;
  totalPreClients: number;
  analyzedPreClients: number;
  activeCampaigns: number;
  totalEmailsProcessed: number;
  emailSentimentOverview: SentimentOverview;
  keyThemes: string[];
  topOpportunities: OpportunitySummary[];
  topRisks: RiskSummary[];
  recentWins: string[];
  openLoops: number;
  pendingFollowUps: number;
  channelActivity: ChannelActivity;
  aiGeneratedInsight: string;
}

export interface SentimentOverview {
  positive: number;
  neutral: number;
  negative: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface OpportunitySummary {
  title: string;
  value: number;
  source: string;
}

export interface RiskSummary {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface ChannelActivity {
  email: number;
  social: number;
  ads: number;
  search: number;
  automation: number;
}

export interface AggregationConfig {
  founderId: string;
  workspaceId: string;
  timeRangeStart?: Date;
  timeRangeEnd?: Date;
  dataSources?: string[];
  includeAIInsight?: boolean;
}

export interface DataSourceResult {
  source: string;
  data: Record<string, unknown>;
  recordCount: number;
  success: boolean;
  error?: string;
}

class FounderMemoryAggregationService {
  private anthropic: Anthropic;
  private defaultDataSources = [
    'contacts',
    'pre_clients',
    'emails',
    'campaigns',
    'social_inbox',
    'ads_performance',
    'search_analytics',
    'automation_logs',
  ];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Create a new founder memory snapshot by aggregating all data sources
   */
  async createSnapshot(config: AggregationConfig): Promise<FounderMemorySnapshot> {
    const {
      founderId,
      workspaceId,
      timeRangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      timeRangeEnd = new Date(),
      dataSources = this.defaultDataSources,
      includeAIInsight = true,
    } = config;

    // Aggregate data from all sources
    const aggregatedData = await this.aggregateAllSources(
      founderId,
      workspaceId,
      timeRangeStart,
      timeRangeEnd,
      dataSources
    );

    // Build summary
    const summary = await this.buildSummary(aggregatedData, includeAIInsight);

    // Calculate confidence based on data completeness
    const confidenceScore = this.calculateConfidence(aggregatedData);

    // Store snapshot
    const { data: snapshot, error } = await supabaseAdmin
      .from('founder_memory_snapshots')
      .insert({
        founder_id: founderId,
        workspace_id: workspaceId,
        snapshot_at: new Date().toISOString(),
        time_range_start: timeRangeStart.toISOString(),
        time_range_end: timeRangeEnd.toISOString(),
        summary_json: summary,
        data_sources_included: dataSources,
        confidence_score: confidenceScore,
      })
      .select()
      .single();

    if (error) {
      console.error('[FounderMemoryAggregation] Failed to save snapshot:', error);
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }

    return this.mapDbToSnapshot(snapshot);
  }

  /**
   * Aggregate data from all configured sources
   */
  private async aggregateAllSources(
    founderId: string,
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    sources: string[]
  ): Promise<Map<string, DataSourceResult>> {
    const results = new Map<string, DataSourceResult>();

    const aggregationPromises = sources.map(async (source) => {
      try {
        const data = await this.aggregateSource(source, workspaceId, startDate, endDate);
        results.set(source, data);
      } catch (error) {
        console.error(`[FounderMemoryAggregation] Error aggregating ${source}:`, error);
        results.set(source, {
          source,
          data: {},
          recordCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(aggregationPromises);
    return results;
  }

  /**
   * Aggregate a single data source
   */
  private async aggregateSource(
    source: string,
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    switch (source) {
      case 'contacts':
        return this.aggregateContacts(workspaceId);
      case 'pre_clients':
        return this.aggregatePreClients(workspaceId);
      case 'emails':
        return this.aggregateEmails(workspaceId, startDate, endDate);
      case 'campaigns':
        return this.aggregateCampaigns(workspaceId, startDate, endDate);
      case 'social_inbox':
        return this.aggregateSocialInbox(workspaceId, startDate, endDate);
      case 'ads_performance':
        return this.aggregateAdsPerformance(workspaceId, startDate, endDate);
      case 'search_analytics':
        return this.aggregateSearchAnalytics(workspaceId, startDate, endDate);
      case 'automation_logs':
        return this.aggregateAutomationLogs(workspaceId, startDate, endDate);
      default:
        return {
          source,
          data: {},
          recordCount: 0,
          success: false,
          error: `Unknown data source: ${source}`,
        };
    }
  }

  /**
   * Aggregate contact data
   */
  private async aggregateContacts(workspaceId: string): Promise<DataSourceResult> {
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('id, status, ai_score, created_at, updated_at')
      .eq('workspace_id', workspaceId);

    if (error) {
      return { source: 'contacts', data: {}, recordCount: 0, success: false, error: error.message };
    }

    const total = contacts?.length || 0;
    const statusCounts: Record<string, number> = {};
    let totalScore = 0;
    let scoredCount = 0;

    contacts?.forEach((c) => {
      statusCounts[c.status || 'unknown'] = (statusCounts[c.status || 'unknown'] || 0) + 1;
      if (c.ai_score) {
        totalScore += c.ai_score;
        scoredCount++;
      }
    });

    return {
      source: 'contacts',
      data: {
        total,
        statusCounts,
        averageScore: scoredCount > 0 ? totalScore / scoredCount : 0,
        hotLeads: contacts?.filter((c) => (c.ai_score || 0) >= 80).length || 0,
        warmLeads: contacts?.filter((c) => (c.ai_score || 0) >= 60 && (c.ai_score || 0) < 80).length || 0,
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate pre-client data
   */
  private async aggregatePreClients(workspaceId: string): Promise<DataSourceResult> {
    const { data: preClients, error } = await supabaseAdmin
      .from('pre_clients')
      .select('id, status, engagement_level, sentiment_score')
      .eq('workspace_id', workspaceId);

    if (error) {
      return { source: 'pre_clients', data: {}, recordCount: 0, success: false, error: error.message };
    }

    const total = preClients?.length || 0;
    const statusCounts: Record<string, number> = {};
    const engagementCounts: Record<string, number> = {};

    preClients?.forEach((p) => {
      statusCounts[p.status || 'unknown'] = (statusCounts[p.status || 'unknown'] || 0) + 1;
      engagementCounts[p.engagement_level || 'unknown'] = (engagementCounts[p.engagement_level || 'unknown'] || 0) + 1;
    });

    return {
      source: 'pre_clients',
      data: {
        total,
        statusCounts,
        engagementCounts,
        analyzed: statusCounts['analyzed'] || 0,
        hotEngagement: (engagementCounts['hot'] || 0) + (engagementCounts['active'] || 0),
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate email data
   */
  private async aggregateEmails(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    const { data: emails, error } = await supabaseAdmin
      .from('emails')
      .select('id, direction, status, sentiment_score, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      return { source: 'emails', data: {}, recordCount: 0, success: false, error: error.message };
    }

    const total = emails?.length || 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    emails?.forEach((e) => {
      const score = e.sentiment_score || 0.5;
      if (score >= 0.6) positiveCount++;
      else if (score <= 0.4) negativeCount++;
      else neutralCount++;
    });

    return {
      source: 'emails',
      data: {
        total,
        sent: emails?.filter((e) => e.direction === 'outbound').length || 0,
        received: emails?.filter((e) => e.direction === 'inbound').length || 0,
        sentimentBreakdown: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
        },
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate campaign data
   */
  private async aggregateCampaigns(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('id, status, type, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      return { source: 'campaigns', data: {}, recordCount: 0, success: false, error: error.message };
    }

    const total = campaigns?.length || 0;
    const statusCounts: Record<string, number> = {};

    campaigns?.forEach((c) => {
      statusCounts[c.status || 'unknown'] = (statusCounts[c.status || 'unknown'] || 0) + 1;
    });

    return {
      source: 'campaigns',
      data: {
        total,
        statusCounts,
        active: statusCounts['active'] || 0,
        completed: statusCounts['completed'] || 0,
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate social inbox data
   */
  private async aggregateSocialInbox(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    // Try to aggregate from social_inbox_messages if it exists
    const { data, error } = await supabaseAdmin
      .from('social_inbox_messages')
      .select('id, platform, status, sentiment_score')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      // Table might not exist yet
      return { source: 'social_inbox', data: { total: 0 }, recordCount: 0, success: true };
    }

    const total = data?.length || 0;
    const platformCounts: Record<string, number> = {};

    data?.forEach((m) => {
      platformCounts[m.platform || 'unknown'] = (platformCounts[m.platform || 'unknown'] || 0) + 1;
    });

    return {
      source: 'social_inbox',
      data: { total, platformCounts },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate ads performance data
   */
  private async aggregateAdsPerformance(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    // Try to aggregate from ads tables if they exist
    const { data, error } = await supabaseAdmin
      .from('ad_campaigns')
      .select('id, platform, status, impressions, clicks, spend')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      return { source: 'ads_performance', data: { total: 0 }, recordCount: 0, success: true };
    }

    const total = data?.length || 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;

    data?.forEach((ad) => {
      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalSpend += ad.spend || 0;
    });

    return {
      source: 'ads_performance',
      data: {
        total,
        totalImpressions,
        totalClicks,
        totalSpend,
        averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate search analytics data
   */
  private async aggregateSearchAnalytics(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    const { data, error } = await supabaseAdmin
      .from('search_analytics')
      .select('id, query, impressions, clicks, position')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
      return { source: 'search_analytics', data: { total: 0 }, recordCount: 0, success: true };
    }

    const total = data?.length || 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    data?.forEach((s) => {
      totalImpressions += s.impressions || 0;
      totalClicks += s.clicks || 0;
    });

    return {
      source: 'search_analytics',
      data: {
        total,
        totalImpressions,
        totalClicks,
        averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Aggregate automation logs
   */
  private async aggregateAutomationLogs(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DataSourceResult> {
    const { data, error } = await supabaseAdmin
      .from('automation_logs')
      .select('id, action_type, status, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      return { source: 'automation_logs', data: { total: 0 }, recordCount: 0, success: true };
    }

    const total = data?.length || 0;
    const statusCounts: Record<string, number> = {};

    data?.forEach((log) => {
      statusCounts[log.status || 'unknown'] = (statusCounts[log.status || 'unknown'] || 0) + 1;
    });

    return {
      source: 'automation_logs',
      data: {
        total,
        statusCounts,
        successRate: total > 0 ? ((statusCounts['success'] || 0) / total) * 100 : 0,
      },
      recordCount: total,
      success: true,
    };
  }

  /**
   * Build summary from aggregated data
   */
  private async buildSummary(
    aggregatedData: Map<string, DataSourceResult>,
    includeAIInsight: boolean
  ): Promise<SnapshotSummary> {
    const contacts = aggregatedData.get('contacts')?.data || {};
    const preClients = aggregatedData.get('pre_clients')?.data || {};
    const emails = aggregatedData.get('emails')?.data || {};
    const campaigns = aggregatedData.get('campaigns')?.data || {};
    const socialInbox = aggregatedData.get('social_inbox')?.data || {};
    const ads = aggregatedData.get('ads_performance')?.data || {};
    const search = aggregatedData.get('search_analytics')?.data || {};
    const automation = aggregatedData.get('automation_logs')?.data || {};

    const emailSentiment = emails.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };
    const totalSentiment = emailSentiment.positive + emailSentiment.neutral + emailSentiment.negative;

    const summary: SnapshotSummary = {
      totalClients: (contacts.total as number) || 0,
      activeClients: (contacts.hotLeads as number) || 0,
      totalPreClients: (preClients.total as number) || 0,
      analyzedPreClients: (preClients.analyzed as number) || 0,
      activeCampaigns: (campaigns.active as number) || 0,
      totalEmailsProcessed: (emails.total as number) || 0,
      emailSentimentOverview: {
        positive: totalSentiment > 0 ? Math.round((emailSentiment.positive / totalSentiment) * 100) : 0,
        neutral: totalSentiment > 0 ? Math.round((emailSentiment.neutral / totalSentiment) * 100) : 0,
        negative: totalSentiment > 0 ? Math.round((emailSentiment.negative / totalSentiment) * 100) : 0,
        trend: this.determineSentimentTrend(emailSentiment),
      },
      keyThemes: [], // Will be populated by pattern extraction
      topOpportunities: [],
      topRisks: [],
      recentWins: [],
      openLoops: 0,
      pendingFollowUps: 0,
      channelActivity: {
        email: (emails.total as number) || 0,
        social: (socialInbox.total as number) || 0,
        ads: (ads.total as number) || 0,
        search: (search.total as number) || 0,
        automation: (automation.total as number) || 0,
      },
      aiGeneratedInsight: '',
    };

    // Generate AI insight if requested
    if (includeAIInsight) {
      summary.aiGeneratedInsight = await this.generateAIInsight(summary, aggregatedData);
    }

    return summary;
  }

  /**
   * Determine sentiment trend
   */
  private determineSentimentTrend(
    sentiment: { positive: number; neutral: number; negative: number }
  ): 'improving' | 'stable' | 'declining' {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;
    if (total === 0) return 'stable';

    const positiveRatio = sentiment.positive / total;
    if (positiveRatio >= 0.6) return 'improving';
    if (positiveRatio <= 0.3) return 'declining';
    return 'stable';
  }

  /**
   * Generate AI insight using Claude
   */
  private async generateAIInsight(
    summary: SnapshotSummary,
    aggregatedData: Map<string, DataSourceResult>
  ): Promise<string> {
    try {
      const prompt = `You are the Cognitive Twin for a business founder. Analyze this snapshot of their business state and provide a brief, actionable insight (2-3 sentences max).

Business Snapshot:
- Total Clients: ${summary.totalClients} (${summary.activeClients} hot leads)
- Pre-Clients: ${summary.totalPreClients} (${summary.analyzedPreClients} analyzed)
- Active Campaigns: ${summary.activeCampaigns}
- Emails Processed: ${summary.totalEmailsProcessed}
- Email Sentiment: ${summary.emailSentimentOverview.positive}% positive, ${summary.emailSentimentOverview.negative}% negative (${summary.emailSentimentOverview.trend})
- Channel Activity: Email(${summary.channelActivity.email}), Social(${summary.channelActivity.social}), Ads(${summary.channelActivity.ads})

Provide a concise founder-focused insight about the current state and one priority action.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      return textBlock?.text || 'Analysis complete. Review the data for detailed insights.';
    } catch (error) {
      console.error('[FounderMemoryAggregation] AI insight generation failed:', error);
      return 'Analysis complete. AI insight generation unavailable.';
    }
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(aggregatedData: Map<string, DataSourceResult>): number {
    let successfulSources = 0;
    let totalRecords = 0;

    aggregatedData.forEach((result) => {
      if (result.success) successfulSources++;
      totalRecords += result.recordCount;
    });

    const sourceCompleteness = successfulSources / aggregatedData.size;
    const dataRichness = Math.min(totalRecords / 100, 1); // Cap at 100 records for full richness

    return Math.round((sourceCompleteness * 0.6 + dataRichness * 0.4) * 100) / 100;
  }

  /**
   * Get latest snapshot for a founder
   */
  async getLatestSnapshot(founderId: string, workspaceId: string): Promise<FounderMemorySnapshot | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_memory_snapshots')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapDbToSnapshot(data);
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshotById(snapshotId: string, workspaceId: string): Promise<FounderMemorySnapshot | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_memory_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapDbToSnapshot(data);
  }

  /**
   * List snapshots for a founder
   */
  async listSnapshots(
    founderId: string,
    workspaceId: string,
    limit = 10
  ): Promise<FounderMemorySnapshot[]> {
    const { data, error } = await supabaseAdmin
      .from('founder_memory_snapshots')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('snapshot_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapDbToSnapshot);
  }

  /**
   * Map database record to typed object
   */
  private mapDbToSnapshot(record: Record<string, unknown>): FounderMemorySnapshot {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      snapshotAt: new Date(record.snapshot_at as string),
      timeRangeStart: new Date(record.time_range_start as string),
      timeRangeEnd: new Date(record.time_range_end as string),
      summaryJson: record.summary_json as SnapshotSummary,
      dataSourcesIncluded: record.data_sources_included as string[],
      confidenceScore: record.confidence_score as number,
      createdAt: new Date(record.created_at as string),
    };
  }

  /**
   * Handle orchestrator intent
   */
  async handleAnalyzeFounderMemoryIntent(
    founderId: string,
    workspaceId: string,
    options?: { timeRangeDays?: number }
  ): Promise<{
    success: boolean;
    snapshot?: FounderMemorySnapshot;
    error?: string;
  }> {
    try {
      const timeRangeStart = new Date();
      timeRangeStart.setDate(timeRangeStart.getDate() - (options?.timeRangeDays || 30));

      const snapshot = await this.createSnapshot({
        founderId,
        workspaceId,
        timeRangeStart,
        timeRangeEnd: new Date(),
        includeAIInsight: true,
      });

      return { success: true, snapshot };
    } catch (error) {
      console.error('[FounderMemoryAggregation] Intent handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const founderMemoryAggregationService = new FounderMemoryAggregationService();
