/**
 * Trend Signals Bridge
 *
 * Connects to DataForSEO API to collect trend signals for topic discovery.
 * Provides keyword trends, search volume changes, and competitive analysis.
 *
 * @module intel/trendSignalsBridge
 */

import { createApiLogger } from '@/lib/logger';
import type { TopicSignal, DiscoveryConfig } from './topicDiscoveryEngine';

const logger = createApiLogger({ route: '/intel/trend-signals-bridge' });

// ====================================
// DataForSEO Types
// ====================================

interface DataForSEOTrendData {
  keyword: string;
  search_volume: number;
  competition: number; // 0-1
  cpc: number;
  trend_data?: Array<{
    month: string;
    search_volume: number;
  }>;
}

// ====================================
// Trend Signals Bridge
// ====================================

class TrendSignalsBridge {
  /**
   * Get topic signals from DataForSEO
   */
  async getTopicSignals(config: DiscoveryConfig): Promise<TopicSignal[]> {
    logger.info('Collecting DataForSEO trend signals', {
      workspace_id: config.workspace_id,
      time_range_days: config.time_range_days,
    });

    try {
      // Check if DataForSEO API key is configured
      if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        logger.warn('DataForSEO credentials not configured, skipping');
        return [];
      }

      // Get trending keywords for the workspace's industry
      const trendingKeywords = await this.getTrendingKeywords(config);

      // Convert to TopicSignals
      const signals = trendingKeywords.map((keyword) =>
        this.convertToTopicSignal(keyword, config)
      );

      logger.info('DataForSEO signals collected', {
        count: signals.length,
      });

      return signals;
    } catch (error) {
      logger.error('Failed to collect DataForSEO signals', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get trending keywords from DataForSEO
   */
  private async getTrendingKeywords(
    config: DiscoveryConfig
  ): Promise<DataForSEOTrendData[]> {
    // TODO: Implement actual DataForSEO API call
    // For now, return mock data for development

    logger.info('Fetching trending keywords (mock data)');

    // Mock trending keywords based on industry context
    const mockKeywords: DataForSEOTrendData[] = [
      {
        keyword: 'AI automation tools',
        search_volume: 12000,
        competition: 0.65,
        cpc: 8.5,
        trend_data: [
          { month: '2025-08', search_volume: 8000 },
          { month: '2025-09', search_volume: 9500 },
          { month: '2025-10', search_volume: 11000 },
          { month: '2025-11', search_volume: 12000 },
        ],
      },
      {
        keyword: 'CRM software for small business',
        search_volume: 8500,
        competition: 0.72,
        cpc: 12.3,
        trend_data: [
          { month: '2025-08', search_volume: 7000 },
          { month: '2025-09', search_volume: 7500 },
          { month: '2025-10', search_volume: 8000 },
          { month: '2025-11', search_volume: 8500 },
        ],
      },
      {
        keyword: 'marketing automation platform',
        search_volume: 15000,
        competition: 0.85,
        cpc: 15.7,
        trend_data: [
          { month: '2025-08', search_volume: 13000 },
          { month: '2025-09', search_volume: 13500 },
          { month: '2025-10', search_volume: 14200 },
          { month: '2025-11', search_volume: 15000 },
        ],
      },
      {
        keyword: 'email drip campaigns',
        search_volume: 3200,
        competition: 0.45,
        cpc: 5.2,
        trend_data: [
          { month: '2025-08', search_volume: 2800 },
          { month: '2025-09', search_volume: 2900 },
          { month: '2025-10', search_volume: 3000 },
          { month: '2025-11', search_volume: 3200 },
        ],
      },
      {
        keyword: 'lead scoring best practices',
        search_volume: 1800,
        competition: 0.35,
        cpc: 4.1,
        trend_data: [
          { month: '2025-08', search_volume: 1200 },
          { month: '2025-09', search_volume: 1400 },
          { month: '2025-10', search_volume: 1600 },
          { month: '2025-11', search_volume: 1800 },
        ],
      },
    ];

    return mockKeywords;
  }

  /**
   * Convert DataForSEO keyword data to TopicSignal
   */
  private convertToTopicSignal(
    keyword: DataForSEOTrendData,
    config: DiscoveryConfig
  ): TopicSignal {
    // Calculate velocity from trend data
    const velocity = this.calculateVelocity(keyword.trend_data || []);

    // Determine signal strength (0-100)
    const strength = this.calculateStrength(
      keyword.search_volume,
      keyword.competition,
      velocity
    );

    // Determine signal type based on velocity
    const signal_type = this.determineSignalType(velocity);

    // Determine competition level
    const competition = this.mapCompetitionLevel(keyword.competition);

    return {
      id: `dataforseo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: keyword.keyword,
      source: 'dataforseo',
      signal_type,
      strength,
      velocity,
      first_seen: new Date(
        Date.now() - config.time_range_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      last_updated: new Date().toISOString(),
      metadata: {
        search_volume: keyword.search_volume,
        competition,
        related_topics: [],
        related_queries: [],
      },
    };
  }

  /**
   * Calculate velocity from trend data
   */
  private calculateVelocity(
    trendData: Array<{ month: string; search_volume: number }>
  ): number {
    if (trendData.length < 2) {
return 0;
}

    // Calculate percentage change from first to last month
    const first = trendData[0].search_volume;
    const last = trendData[trendData.length - 1].search_volume;

    if (first === 0) {
return 0;
}

    const percentChange = ((last - first) / first) * 100;

    // Clamp to -100 to +100
    return Math.max(-100, Math.min(100, percentChange));
  }

  /**
   * Calculate signal strength (0-100)
   */
  private calculateStrength(
    searchVolume: number,
    competition: number,
    velocity: number
  ): number {
    // Normalize search volume (log scale, 100 = 10k+, 0 = <10)
    const normalizedVolume = Math.min(
      100,
      Math.max(0, Math.log10(searchVolume) * 20)
    );

    // Competition inversely affects strength (lower competition = higher strength)
    const competitionFactor = (1 - competition) * 100;

    // Velocity bonus (positive velocity increases strength)
    const velocityBonus = Math.max(0, velocity) / 2; // Max +50 bonus

    // Weighted calculation
    const strength =
      normalizedVolume * 0.5 + competitionFactor * 0.3 + velocityBonus * 0.2;

    return Math.round(Math.max(0, Math.min(100, strength)));
  }

  /**
   * Determine signal type based on velocity
   */
  private determineSignalType(velocity: number): TopicSignal['signal_type'] {
    if (velocity > 40) {
return 'emerging';
}
    if (velocity > 10) {
return 'trending';
}
    if (velocity < -20) {
return 'declining';
}
    return 'opportunity';
  }

  /**
   * Map competition level from 0-1 to low/medium/high
   */
  private mapCompetitionLevel(
    competition: number
  ): 'low' | 'medium' | 'high' {
    if (competition < 0.4) {
return 'low';
}
    if (competition < 0.7) {
return 'medium';
}
    return 'high';
  }

  /**
   * Get related keywords for a topic
   */
  async getRelatedKeywords(
    topic: string,
    maxResults: number = 10
  ): Promise<string[]> {
    logger.info('Fetching related keywords', { topic, maxResults });

    try {
      // TODO: Implement actual DataForSEO related keywords API call
      // For now, return mock data

      const mockRelated = [
        `${topic} best practices`,
        `${topic} guide`,
        `${topic} tools`,
        `${topic} software`,
        `${topic} tips`,
      ].slice(0, maxResults);

      return mockRelated;
    } catch (error) {
      logger.error('Failed to fetch related keywords', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get SERP features for a keyword
   */
  async getSERPFeatures(keyword: string): Promise<{
    featured_snippet: boolean;
    people_also_ask: boolean;
    local_pack: boolean;
    knowledge_graph: boolean;
  }> {
    logger.info('Fetching SERP features', { keyword });

    try {
      // TODO: Implement actual DataForSEO SERP features API call
      // For now, return mock data

      return {
        featured_snippet: Math.random() > 0.7,
        people_also_ask: Math.random() > 0.5,
        local_pack: Math.random() > 0.8,
        knowledge_graph: Math.random() > 0.85,
      };
    } catch (error) {
      logger.error('Failed to fetch SERP features', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        featured_snippet: false,
        people_also_ask: false,
        local_pack: false,
        knowledge_graph: false,
      };
    }
  }
}

// Export singleton instance
export const trendSignalsBridge = new TrendSignalsBridge();
