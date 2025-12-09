/**
 * Topic Discovery Engine
 *
 * Self-smart topic and trend discovery system that aggregates signals from:
 * - Google Search Console (GSC)
 * - Bing Webmaster Tools
 * - DataForSEO trend signals
 * - LinkedIn Industry Activity (LIA)
 * - Industry event scanners
 *
 * Provides actionable topic opportunities for founder decision-making.
 *
 * @module intel/topicDiscoveryEngine
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/intel/topic-discovery' });

// ====================================
// Types
// ====================================

export interface TopicSignal {
  id: string;
  topic: string;
  source: 'gsc' | 'bing' | 'dataforseo' | 'lia' | 'industry_events';
  signal_type: 'emerging' | 'trending' | 'declining' | 'opportunity';
  strength: number; // 0-100
  velocity: number; // Rate of change (-100 to +100)
  first_seen: string;
  last_updated: string;
  metadata: {
    search_volume?: number;
    ctr?: number;
    impressions?: number;
    clicks?: number;
    competition?: 'low' | 'medium' | 'high';
    related_topics?: string[];
    related_queries?: string[];
    industry_events?: string[];
  };
}

export interface TrendOpportunity {
  id: string;
  topic: string;
  opportunity_type: 'content_gap' | 'rising_demand' | 'low_competition' | 'seasonal' | 'event_driven';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number; // 0-100
  estimated_impact: 'low' | 'medium' | 'high';
  time_window: {
    optimal_start: string;
    optimal_end?: string;
    urgency: 'immediate' | 'this_week' | 'this_month' | 'this_quarter';
  };
  signals: TopicSignal[];
  recommended_actions: {
    action_type: 'create_content' | 'update_content' | 'build_landing_page' | 'social_campaign' | 'email_campaign';
    description: string;
    estimated_effort: 'low' | 'medium' | 'high';
  }[];
  founder_notes?: string;
  approved?: boolean;
  created_at: string;
}

export interface TopicRadar {
  workspace_id: string;
  scan_timestamp: string;
  emerging_topics: TopicSignal[];
  trending_topics: TopicSignal[];
  declining_topics: TopicSignal[];
  opportunities: TrendOpportunity[];
  summary: {
    total_signals: number;
    high_priority_opportunities: number;
    immediate_actions: number;
    this_week_actions: number;
  };
}

export interface DiscoveryConfig {
  workspace_id: string;
  enabled_sources: Array<'gsc' | 'bing' | 'dataforseo' | 'lia' | 'industry_events'>;
  signal_threshold: number; // Minimum strength to include (0-100)
  opportunity_threshold: number; // Minimum confidence to surface (0-100)
  time_range_days: number; // How far back to look
  industry_context?: string;
  target_audience?: string;
  business_goals?: string[];
}

// ====================================
// Core Discovery Logic
// ====================================

export class TopicDiscoveryEngine {
  private config: DiscoveryConfig;

  constructor(config: DiscoveryConfig) {
    this.config = config;
  }

  /**
   * Run complete topic discovery scan
   */
  async runDiscoveryScan(): Promise<TopicRadar> {
    logger.info('Starting topic discovery scan', {
      workspace_id: this.config.workspace_id,
      sources: this.config.enabled_sources,
    });

    const startTime = Date.now();

    try {
      // Collect signals from all enabled sources
      const signals = await this.collectAllSignals();

      // Classify signals by type
      const classified = this.classifySignals(signals);

      // Identify opportunities
      const opportunities = await this.identifyOpportunities(signals);

      // Generate summary
      const summary = this.generateSummary(signals, opportunities);

      const radar: TopicRadar = {
        workspace_id: this.config.workspace_id,
        scan_timestamp: new Date().toISOString(),
        emerging_topics: classified.emerging,
        trending_topics: classified.trending,
        declining_topics: classified.declining,
        opportunities,
        summary,
      };

      logger.info('Topic discovery scan complete', {
        duration_ms: Date.now() - startTime,
        signals: signals.length,
        opportunities: opportunities.length,
      });

      return radar;
    } catch (error) {
      logger.error('Topic discovery scan failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect signals from all enabled sources
   */
  private async collectAllSignals(): Promise<TopicSignal[]> {
    const allSignals: TopicSignal[] = [];

    // Parallel collection from all sources
    const promises: Promise<TopicSignal[]>[] = [];

    if (this.config.enabled_sources.includes('gsc')) {
      promises.push(this.collectGSCSignals());
    }

    if (this.config.enabled_sources.includes('bing')) {
      promises.push(this.collectBingSignals());
    }

    if (this.config.enabled_sources.includes('dataforseo')) {
      promises.push(this.collectDataForSEOSignals());
    }

    if (this.config.enabled_sources.includes('lia')) {
      promises.push(this.collectLIASignals());
    }

    if (this.config.enabled_sources.includes('industry_events')) {
      promises.push(this.collectIndustryEventSignals());
    }

    const results = await Promise.allSettled(promises);

    // Aggregate successful results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allSignals.push(...result.value);
      } else {
        logger.warn(`Source ${this.config.enabled_sources[index]} failed`, {
          error: result.reason,
        });
      }
    });

    // Filter by signal threshold
    return allSignals.filter((signal) => signal.strength >= this.config.signal_threshold);
  }

  /**
   * Collect signals from Google Search Console
   */
  private async collectGSCSignals(): Promise<TopicSignal[]> {
    // Import GSC bridge dynamically
    const { searchConsoleBridge } = await import('./searchConsoleBridge');
    return searchConsoleBridge.getTopicSignals(this.config);
  }

  /**
   * Collect signals from Bing Webmaster Tools
   */
  private async collectBingSignals(): Promise<TopicSignal[]> {
    // Import Bing bridge dynamically
    const { bingWebmasterBridge } = await import('./bingWebmasterBridge');
    return bingWebmasterBridge.getTopicSignals(this.config);
  }

  /**
   * Collect signals from DataForSEO
   */
  private async collectDataForSEOSignals(): Promise<TopicSignal[]> {
    // Import trend signals bridge dynamically
    const { trendSignalsBridge } = await import('./trendSignalsBridge');
    return trendSignalsBridge.getTopicSignals(this.config);
  }

  /**
   * Collect signals from LinkedIn Industry Activity
   */
  private async collectLIASignals(): Promise<TopicSignal[]> {
    // TODO: Implement LIA integration in future phase
    logger.info('LIA signal collection not yet implemented');
    return [];
  }

  /**
   * Collect signals from industry events
   */
  private async collectIndustryEventSignals(): Promise<TopicSignal[]> {
    // Import industry events scanner dynamically
    const { industryEventsScanner } = await import('./industryEventsScanner');
    return industryEventsScanner.getTopicSignals(this.config);
  }

  /**
   * Classify signals by type
   */
  private classifySignals(signals: TopicSignal[]): {
    emerging: TopicSignal[];
    trending: TopicSignal[];
    declining: TopicSignal[];
  } {
    const emerging = signals.filter((s) => s.signal_type === 'emerging');
    const trending = signals.filter((s) => s.signal_type === 'trending');
    const declining = signals.filter((s) => s.signal_type === 'declining');

    // Sort by strength descending
    emerging.sort((a, b) => b.strength - a.strength);
    trending.sort((a, b) => b.strength - a.strength);
    declining.sort((a, b) => b.strength - a.strength);

    return { emerging, trending, declining };
  }

  /**
   * Identify actionable opportunities from signals
   */
  private async identifyOpportunities(signals: TopicSignal[]): Promise<TrendOpportunity[]> {
    const opportunities: TrendOpportunity[] = [];

    // Group signals by topic
    const topicGroups = this.groupSignalsByTopic(signals);

    // Analyze each topic group for opportunities
    for (const [topic, topicSignals] of Object.entries(topicGroups)) {
      const opportunity = await this.analyzeTopicOpportunity(topic, topicSignals);

      if (
        opportunity &&
        opportunity.confidence_score >= this.config.opportunity_threshold
      ) {
        opportunities.push(opportunity);
      }
    }

    // Sort by priority and confidence
    opportunities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
return priorityDiff;
}
      return b.confidence_score - a.confidence_score;
    });

    return opportunities;
  }

  /**
   * Group signals by topic
   */
  private groupSignalsByTopic(
    signals: TopicSignal[]
  ): Record<string, TopicSignal[]> {
    const groups: Record<string, TopicSignal[]> = {};

    signals.forEach((signal) => {
      const normalizedTopic = signal.topic.toLowerCase().trim();
      if (!groups[normalizedTopic]) {
        groups[normalizedTopic] = [];
      }
      groups[normalizedTopic].push(signal);
    });

    return groups;
  }

  /**
   * Analyze topic signals to identify opportunity
   */
  private async analyzeTopicOpportunity(
    topic: string,
    signals: TopicSignal[]
  ): Promise<TrendOpportunity | null> {
    // Calculate aggregate metrics
    const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
    const avgVelocity = signals.reduce((sum, s) => sum + s.velocity, 0) / signals.length;
    const sourceCount = new Set(signals.map((s) => s.source)).size;

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      avgStrength,
      avgVelocity,
      sourceCount,
      signals.length
    );

    // If confidence too low, skip
    if (confidenceScore < this.config.opportunity_threshold) {
      return null;
    }

    // Determine opportunity type
    const opportunityType = this.determineOpportunityType(signals, avgVelocity);

    // Determine priority
    const priority = this.determinePriority(
      confidenceScore,
      avgVelocity,
      opportunityType
    );

    // Determine time window
    const timeWindow = this.determineTimeWindow(avgVelocity, opportunityType);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      opportunityType,
      signals
    );

    // Determine estimated impact
    const estimatedImpact = this.estimateImpact(avgStrength, sourceCount);

    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      opportunity_type: opportunityType,
      priority,
      confidence_score: Math.round(confidenceScore),
      estimated_impact: estimatedImpact,
      time_window: timeWindow,
      signals,
      recommended_actions: recommendedActions,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate confidence score for opportunity
   */
  private calculateConfidenceScore(
    avgStrength: number,
    avgVelocity: number,
    sourceCount: number,
    signalCount: number
  ): number {
    // Weighted factors
    const strengthWeight = 0.4;
    const velocityWeight = 0.3;
    const sourceWeight = 0.2;
    const signalWeight = 0.1;

    const normalizedVelocity = Math.min(100, Math.max(0, avgVelocity + 50)); // Convert -50 to +50 range to 0-100
    const normalizedSourceCount = Math.min(100, (sourceCount / 5) * 100); // Max 5 sources
    const normalizedSignalCount = Math.min(100, (signalCount / 10) * 100); // Max 10 signals = 100

    return (
      avgStrength * strengthWeight +
      normalizedVelocity * velocityWeight +
      normalizedSourceCount * sourceWeight +
      normalizedSignalCount * signalWeight
    );
  }

  /**
   * Determine opportunity type from signals
   */
  private determineOpportunityType(
    signals: TopicSignal[],
    avgVelocity: number
  ): TrendOpportunity['opportunity_type'] {
    // Check for event-driven signals
    if (signals.some((s) => s.source === 'industry_events')) {
      return 'event_driven';
    }

    // Check for low competition signals
    const lowCompetition = signals.some(
      (s) => s.metadata.competition === 'low'
    );
    if (lowCompetition && avgVelocity > 10) {
      return 'low_competition';
    }

    // Check for rising demand
    if (avgVelocity > 20) {
      return 'rising_demand';
    }

    // Check for seasonal patterns (would need historical data)
    // For now, default to content_gap
    return 'content_gap';
  }

  /**
   * Determine priority based on metrics
   */
  private determinePriority(
    confidenceScore: number,
    avgVelocity: number,
    opportunityType: TrendOpportunity['opportunity_type']
  ): TrendOpportunity['priority'] {
    // Event-driven opportunities are always high priority
    if (opportunityType === 'event_driven') {
      return 'critical';
    }

    // High velocity + high confidence = high priority
    if (confidenceScore >= 80 && avgVelocity >= 30) {
      return 'high';
    }

    // High confidence but lower velocity = medium
    if (confidenceScore >= 70) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine optimal time window for action
   */
  private determineTimeWindow(
    avgVelocity: number,
    opportunityType: TrendOpportunity['opportunity_type']
  ): TrendOpportunity['time_window'] {
    const now = new Date();

    // Event-driven = immediate
    if (opportunityType === 'event_driven') {
      return {
        optimal_start: now.toISOString(),
        urgency: 'immediate',
      };
    }

    // High velocity = this week
    if (avgVelocity > 30) {
      return {
        optimal_start: now.toISOString(),
        urgency: 'this_week',
      };
    }

    // Medium velocity = this month
    if (avgVelocity > 10) {
      return {
        optimal_start: now.toISOString(),
        urgency: 'this_month',
      };
    }

    // Low velocity = this quarter
    return {
      optimal_start: now.toISOString(),
      urgency: 'this_quarter',
    };
  }

  /**
   * Generate recommended actions for opportunity
   */
  private generateRecommendedActions(
    opportunityType: TrendOpportunity['opportunity_type'],
    signals: TopicSignal[]
  ): TrendOpportunity['recommended_actions'] {
    const actions: TrendOpportunity['recommended_actions'] = [];

    // Analyze metadata for specific recommendations
    const hasHighSearchVolume = signals.some(
      (s) => (s.metadata.search_volume || 0) > 1000
    );
    const hasRelatedQueries = signals.some(
      (s) => (s.metadata.related_queries || []).length > 0
    );

    // Content creation recommendation
    if (opportunityType === 'content_gap' || opportunityType === 'rising_demand') {
      actions.push({
        action_type: 'create_content',
        description: hasRelatedQueries
          ? 'Create comprehensive content covering related queries'
          : 'Create content targeting this emerging topic',
        estimated_effort: hasHighSearchVolume ? 'high' : 'medium',
      });
    }

    // Landing page for high-value opportunities
    if (hasHighSearchVolume && opportunityType === 'low_competition') {
      actions.push({
        action_type: 'build_landing_page',
        description: 'Build dedicated landing page to capture search traffic',
        estimated_effort: 'high',
      });
    }

    // Social campaign for trending topics
    if (opportunityType === 'rising_demand' || opportunityType === 'event_driven') {
      actions.push({
        action_type: 'social_campaign',
        description: 'Launch social media campaign to ride the trend wave',
        estimated_effort: 'medium',
      });
    }

    // Email campaign for existing audience
    if (opportunityType === 'event_driven') {
      actions.push({
        action_type: 'email_campaign',
        description: 'Send targeted email to existing contacts about this opportunity',
        estimated_effort: 'low',
      });
    }

    // Default action if none added
    if (actions.length === 0) {
      actions.push({
        action_type: 'create_content',
        description: 'Create content targeting this topic',
        estimated_effort: 'medium',
      });
    }

    return actions;
  }

  /**
   * Estimate impact of opportunity
   */
  private estimateImpact(
    avgStrength: number,
    sourceCount: number
  ): TrendOpportunity['estimated_impact'] {
    const impactScore = avgStrength * 0.7 + (sourceCount / 5) * 100 * 0.3;

    if (impactScore >= 70) {
return 'high';
}
    if (impactScore >= 40) {
return 'medium';
}
    return 'low';
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    signals: TopicSignal[],
    opportunities: TrendOpportunity[]
  ): TopicRadar['summary'] {
    const highPriority = opportunities.filter(
      (o) => o.priority === 'high' || o.priority === 'critical'
    ).length;

    const immediate = opportunities.filter(
      (o) => o.time_window.urgency === 'immediate'
    ).length;

    const thisWeek = opportunities.filter(
      (o) => o.time_window.urgency === 'this_week'
    ).length;

    return {
      total_signals: signals.length,
      high_priority_opportunities: highPriority,
      immediate_actions: immediate,
      this_week_actions: thisWeek,
    };
  }
}

/**
 * Create default discovery configuration
 */
export function createDefaultConfig(workspaceId: string): DiscoveryConfig {
  return {
    workspace_id: workspaceId,
    enabled_sources: ['gsc', 'bing', 'dataforseo', 'industry_events'],
    signal_threshold: 30, // Include signals with strength >= 30
    opportunity_threshold: 50, // Surface opportunities with confidence >= 50
    time_range_days: 30, // Look back 30 days
  };
}

/**
 * Factory function to create topic discovery engine
 */
export function createTopicDiscoveryEngine(
  config: Partial<DiscoveryConfig> & { workspace_id: string }
): TopicDiscoveryEngine {
  const fullConfig = {
    ...createDefaultConfig(config.workspace_id),
    ...config,
  };

  return new TopicDiscoveryEngine(fullConfig);
}
