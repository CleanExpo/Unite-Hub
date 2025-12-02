/**
 * Social Media Aggregator Service
 * Phase 89A: 7-platform social media metrics aggregation
 */

import logger from '@/lib/logger';

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'reddit' | 'youtube';

export interface PlatformMetrics {
  platform: SocialPlatform;
  follower_count: number;
  follower_growth_30d: number;
  follower_growth_rate: number; // Percentage
  posts_30d: number;
  avg_engagement_per_post: number;
  engagement_rate: number; // Percentage
  reach_30d: number;
  impressions_30d: number;
  avg_post_reach: number;
  best_post_reach: number;
  posting_frequency_weekly: number;
}

export interface ContentTypePerformance {
  platform: SocialPlatform;
  content_type: string;
  count: number;
  avg_engagement: number;
  avg_reach: number;
  top_performing_content: string;
}

export interface PlatformOpportunity {
  platform: SocialPlatform;
  opportunity: string;
  description: string;
  potential_impact: number; // 1-10
  effort: 'low' | 'medium' | 'high';
}

export interface SocialMediaAggregatorResult {
  platforms: PlatformMetrics[];
  summary: {
    total_followers: number;
    combined_reach_30d: number;
    combined_impressions_30d: number;
    average_engagement_rate: number;
    strongest_platform: SocialPlatform;
    weakest_platform: SocialPlatform;
    growth_momentum: 'positive' | 'stable' | 'negative';
  };
  growth_trends: Array<{
    platform: SocialPlatform;
    growth_rate: number;
    trend_direction: 'up' | 'down' | 'stable';
  }>;
  content_performance: ContentTypePerformance[];
  best_posting_times: Record<SocialPlatform, string>;
  opportunities: PlatformOpportunity[];
}

export class SocialMediaAggregatorService {
  private platforms: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'linkedin', 'x', 'reddit', 'youtube'];

  analyzeMetrics(clientId: string, enabledPlatforms?: SocialPlatform[]): SocialMediaAggregatorResult {
    logger.info('[SocialMediaAggregator] Starting analysis', {
      clientId,
      platformCount: enabledPlatforms?.length || 7,
    });

    const platformsToAnalyze = enabledPlatforms || this.platforms;
    const platformMetrics = platformsToAnalyze.map((platform) => this.generateMockPlatformMetrics(platform));

    const summary = this.generateSummary(platformMetrics);
    const growthTrends = this.analyzeGrowthTrends(platformMetrics);
    const contentPerformance = this.generateContentPerformance(platformMetrics);
    const bestPostingTimes = this.determineBestPostingTimes(platformMetrics);
    const opportunities = this.identifyOpportunities(platformMetrics, summary);

    return {
      platforms: platformMetrics,
      summary,
      growth_trends: growthTrends,
      content_performance: contentPerformance,
      best_posting_times: bestPostingTimes,
      opportunities,
    };
  }

  private generateMockPlatformMetrics(platform: SocialPlatform): PlatformMetrics {
    const baseFollowers = this.getBaseFollowers(platform);
    const followerGrowth = Math.floor(Math.random() * 2000) + 50;
    const posts = Math.floor(Math.random() * 20) + 4;
    const avgEngagement = Math.floor(Math.random() * 500) + 50;

    return {
      platform,
      follower_count: baseFollowers,
      follower_growth_30d: followerGrowth,
      follower_growth_rate: (followerGrowth / baseFollowers) * 100,
      posts_30d: posts,
      avg_engagement_per_post: avgEngagement,
      engagement_rate: (avgEngagement / baseFollowers) * 100,
      reach_30d: Math.floor(Math.random() * 50000) + 5000,
      impressions_30d: Math.floor(Math.random() * 100000) + 20000,
      avg_post_reach: Math.floor(Math.random() * 2000) + 200,
      best_post_reach: Math.floor(Math.random() * 10000) + 1000,
      posting_frequency_weekly: posts / 4,
    };
  }

  private getBaseFollowers(platform: SocialPlatform): number {
    const baseFollows: Record<SocialPlatform, number> = {
      facebook: Math.floor(Math.random() * 100000) + 10000,
      instagram: Math.floor(Math.random() * 50000) + 5000,
      tiktok: Math.floor(Math.random() * 200000) + 20000,
      linkedin: Math.floor(Math.random() * 30000) + 2000,
      x: Math.floor(Math.random() * 50000) + 5000,
      reddit: Math.floor(Math.random() * 20000) + 1000,
      youtube: Math.floor(Math.random() * 500000) + 50000,
    };

    return baseFollows[platform];
  }

  private generateSummary(platformMetrics: PlatformMetrics[]): SocialMediaAggregatorResult['summary'] {
    const totalFollowers = platformMetrics.reduce((sum, m) => sum + m.follower_count, 0);
    const combinedReach = platformMetrics.reduce((sum, m) => sum + m.reach_30d, 0);
    const combinedImpressions = platformMetrics.reduce((sum, m) => sum + m.impressions_30d, 0);
    const avgEngagement = platformMetrics.reduce((sum, m) => sum + m.engagement_rate, 0) / platformMetrics.length;

    const sortedByFollowers = [...platformMetrics].sort((a, b) => b.follower_count - a.follower_count);
    const strongestPlatform = sortedByFollowers[0].platform;
    const weakestPlatform = sortedByFollowers[sortedByFollowers.length - 1].platform;

    const growthMetrics = platformMetrics.filter((m) => m.follower_growth_rate > 2);
    const growthMomentum: 'positive' | 'stable' | 'negative' =
      growthMetrics.length > 3 ? 'positive' : growthMetrics.length > 1 ? 'stable' : 'negative';

    return {
      total_followers: totalFollowers,
      combined_reach_30d: combinedReach,
      combined_impressions_30d: combinedImpressions,
      average_engagement_rate: Math.round(avgEngagement * 100) / 100,
      strongest_platform: strongestPlatform,
      weakest_platform: weakestPlatform,
      growth_momentum: growthMomentum,
    };
  }

  private analyzeGrowthTrends(platformMetrics: PlatformMetrics[]): SocialMediaAggregatorResult['growth_trends'] {
    return platformMetrics.map((m) => {
      const trendDirection: 'up' | 'down' | 'stable' =
        m.follower_growth_rate > 3 ? 'up' : m.follower_growth_rate < 1 ? 'down' : 'stable';

      return {
        platform: m.platform,
        growth_rate: Math.round(m.follower_growth_rate * 100) / 100,
        trend_direction: trendDirection,
      };
    });
  }

  private generateContentPerformance(platformMetrics: PlatformMetrics[]): ContentTypePerformance[] {
    const contentTypes: Record<SocialPlatform, string[]> = {
      facebook: ['articles', 'videos', 'images', 'stories'],
      instagram: ['reels', 'carousel', 'stories', 'igtv'],
      tiktok: ['short_videos', 'trends', 'duets', 'stitches'],
      linkedin: ['articles', 'updates', 'videos', 'documents'],
      x: ['tweets', 'threads', 'media_tweets'],
      reddit: ['posts', 'comments', 'ama'],
      youtube: ['videos', 'shorts', 'community_posts'],
    };

    const performance: ContentTypePerformance[] = [];

    platformMetrics.forEach((metric) => {
      const types = contentTypes[metric.platform] || ['content'];

      types.forEach((type) => {
        performance.push({
          platform: metric.platform,
          content_type: type,
          count: Math.floor(metric.posts_30d * (1 + Math.random())),
          avg_engagement: metric.avg_engagement_per_post * (0.8 + Math.random() * 0.4),
          avg_reach: metric.avg_post_reach * (0.7 + Math.random() * 0.6),
          top_performing_content: `Top ${type} in ${metric.platform}`,
        });
      });
    });

    return performance;
  }

  private determineBestPostingTimes(_platformMetrics: PlatformMetrics[]): Record<SocialPlatform, string> {
    const times: Record<SocialPlatform, string> = {
      facebook: '1:00 PM - 3:00 PM (Wednesday)',
      instagram: '11:00 AM - 1:00 PM (Tuesday & Thursday)',
      tiktok: '6:00 PM - 10:00 PM (Friday & Saturday)',
      linkedin: '8:00 AM - 10:00 AM (Tuesday - Thursday)',
      x: '9:00 AM - 5:00 PM (Weekdays)',
      reddit: '12:00 PM - 1:00 PM (Wednesday & Thursday)',
      youtube: '5:00 PM - 7:00 PM (Thursday & Friday)',
    };

    return times;
  }

  private identifyOpportunities(
    platformMetrics: PlatformMetrics[],
    _summary: SocialMediaAggregatorResult['summary']
  ): PlatformOpportunity[] {
    const opportunities: PlatformOpportunity[] = [];

    // Low follower platforms
    platformMetrics.forEach((m) => {
      if (m.follower_count < 1000) {
        opportunities.push({
          platform: m.platform,
          opportunity: 'Platform Growth Initiative',
          description: `Boost presence on ${m.platform} - currently has only ${m.follower_count} followers`,
          potential_impact: 6,
          effort: 'medium',
        });
      }
    });

    // High engagement platforms
    const highEngagement = platformMetrics.filter((m) => m.engagement_rate > 2);
    if (highEngagement.length > 0) {
      highEngagement.forEach((m) => {
        opportunities.push({
          platform: m.platform,
          opportunity: 'Increase Content Frequency',
          description: `${m.platform} shows ${m.engagement_rate.toFixed(1)}% engagement - post more often`,
          potential_impact: 8,
          effort: 'medium',
        });
      });
    }

    // Cross-promotion opportunities
    const platforms = platformMetrics.map((m) => m.platform);
    if (platforms.length > 3) {
      opportunities.push({
        platform: 'youtube',
        opportunity: 'Cross-Platform Promotion',
        description: 'Repurpose best-performing content across multiple platforms',
        potential_impact: 7,
        effort: 'low',
      });
    }

    // Influencer/hashtag opportunities
    platformMetrics.forEach((m) => {
      if (m.best_post_reach > m.avg_post_reach * 2) {
        opportunities.push({
          platform: m.platform,
          opportunity: 'Viral Content Analysis',
          description: 'Analyze what made your best post successful and replicate',
          potential_impact: 7,
          effort: 'low',
        });
      }
    });

    return opportunities.slice(0, 10);
  }
}

export const socialMediaAggregatorService = new SocialMediaAggregatorService();
