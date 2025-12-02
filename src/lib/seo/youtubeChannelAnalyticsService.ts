/**
 * YouTube Channel Analytics Service
 * Phase 89A: YouTube channel health scoring, growth tracking, and content performance
 */

import logger from '@/lib/logger';

export interface VideoMetrics {
  title: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  content_type: 'tutorial' | 'vlog' | 'educational' | 'entertainment' | 'product' | 'shorts';
  publish_date: string;
  duration_seconds: number;
}

export interface ChannelMetrics {
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  subscriber_growth_30d: number;
  subscriber_growth_rate: number; // Percentage
  total_views: number;
  monthly_views: number;
  total_watch_hours: number;
  average_watch_duration: number; // In minutes
  audience_retention_rate: number; // Percentage
  estimated_monthly_revenue: number;
  upload_frequency_weekly: number;
  verified: boolean;
}

export interface ContentPerformance {
  content_type: string;
  count: number;
  avg_views: number;
  avg_engagement: number;
  best_performer: string;
  trend: 'up' | 'down' | 'stable';
}

export interface AudienceInsights {
  top_geographies: Array<{ country: string; percentage: number }>;
  audience_gender: { male: number; female: number; other: number };
  age_groups: Record<string, number>;
  subscriber_vs_nonsubscriber_ratio: number;
  average_session_duration_seconds: number;
}

export interface ChannelHealthScore {
  overall_score: number; // 0-100
  growth_score: number;
  engagement_score: number;
  content_score: number;
  retention_score: number;
  monetization_score: number;
}

export interface YouTubeAnalyticsResult {
  channel_metrics: ChannelMetrics;
  health_score: ChannelHealthScore;
  top_videos: VideoMetrics[];
  content_performance: ContentPerformance[];
  audience_insights: AudienceInsights;
  opportunities: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
  summary: {
    channel_status: 'healthy' | 'growing' | 'stagnant' | 'declining';
    primary_strength: string;
    primary_weakness: string;
    recommended_actions: string[];
  };
}

export class YouTubeChannelAnalyticsService {
  analyzeChannel(clientId: string, channelId: string, channelName?: string): YouTubeAnalyticsResult {
    logger.info('[YouTubeAnalytics] Starting analysis', {
      clientId,
      channelId,
      channelName,
    });

    const channelMetrics = this.generateMockChannelMetrics(channelId, channelName);
    const topVideos = this.generateMockTopVideos();
    const contentPerformance = this.analyzeContentPerformance(topVideos);
    const audienceInsights = this.generateMockAudienceInsights();
    const healthScore = this.calculateHealthScore(channelMetrics, topVideos, contentPerformance);
    const opportunities = this.identifyOpportunities(channelMetrics, healthScore, contentPerformance);

    return {
      channel_metrics: channelMetrics,
      health_score: healthScore,
      top_videos: topVideos,
      content_performance: contentPerformance,
      audience_insights: audienceInsights,
      opportunities,
      summary: {
        channel_status: this.determineChannelStatus(healthScore),
        primary_strength: this.identifyPrimaryStrength(healthScore),
        primary_weakness: this.identifyPrimaryWeakness(healthScore),
        recommended_actions: this.generateRecommendations(healthScore, contentPerformance),
      },
    };
  }

  private generateMockChannelMetrics(channelId: string, channelName?: string): ChannelMetrics {
    const baseSubscribers = Math.floor(Math.random() * 500000) + 10000;
    const monthlyViews = Math.floor(Math.random() * 1000000) + 50000;

    return {
      channel_id: channelId,
      channel_name: channelName || `Channel ${channelId}`,
      subscriber_count: baseSubscribers,
      subscriber_growth_30d: Math.floor(Math.random() * 5000) + 100,
      subscriber_growth_rate: Math.floor(Math.random() * 20) + 2,
      total_views: baseSubscribers * Math.floor(Math.random() * 500) + 1000000,
      monthly_views: monthlyViews,
      total_watch_hours: Math.floor(Math.random() * 10000000) + 1000000,
      average_watch_duration: Math.floor(Math.random() * 15) + 2,
      audience_retention_rate: Math.floor(Math.random() * 40) + 30,
      estimated_monthly_revenue: Math.floor(monthlyViews * 0.0015),
      upload_frequency_weekly: Math.floor(Math.random() * 7) + 1,
      verified: Math.random() > 0.3,
    };
  }

  private generateMockTopVideos(): VideoMetrics[] {
    const contentTypes: Array<'tutorial' | 'vlog' | 'educational' | 'entertainment' | 'product' | 'shorts'> = [
      'tutorial',
      'vlog',
      'educational',
      'entertainment',
      'product',
      'shorts',
    ];

    return Array.from({ length: 10 }, (_, i) => {
      const views = Math.floor(Math.random() * 500000) + 1000;
      const likes = Math.floor(views * 0.05);
      const comments = Math.floor(views * 0.02);

      return {
        title: `Video ${i + 1}: ${contentTypes[i % 6]} Content`,
        views,
        likes,
        comments,
        engagement_rate: ((likes + comments) / views) * 100,
        content_type: contentTypes[i % 6],
        publish_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration_seconds: Math.floor(Math.random() * 3600) + 60,
      };
    });
  }

  private analyzeContentPerformance(videos: VideoMetrics[]): ContentPerformance[] {
    const byType = new Map<string, VideoMetrics[]>();

    videos.forEach((video) => {
      if (!byType.has(video.content_type)) {
        byType.set(video.content_type, []);
      }
      byType.get(video.content_type)!.push(video);
    });

    return Array.from(byType.entries()).map(([type, typeVideos]) => {
      const avgViews = typeVideos.reduce((sum, v) => sum + v.views, 0) / typeVideos.length;
      const avgEngagement = typeVideos.reduce((sum, v) => sum + v.engagement_rate, 0) / typeVideos.length;
      const bestPerformer = typeVideos.reduce((best, v) => (v.views > best.views ? v : best));

      const _recent = typeVideos.slice(0, 3);
      const older = typeVideos.slice(3);
      const trend = older.length > 0 ? (avgViews > older[0].views ? 'up' : 'down') : 'stable';

      return {
        content_type: type,
        count: typeVideos.length,
        avg_views: Math.round(avgViews),
        avg_engagement: Math.round(avgEngagement * 100) / 100,
        best_performer: bestPerformer.title,
        trend,
      };
    });
  }

  private generateMockAudienceInsights(): AudienceInsights {
    const countries = ['US', 'UK', 'CA', 'AU', 'IN', 'Other'];
    const topGeos = countries
      .map((country, i) => ({
        country,
        percentage: Math.floor(Math.random() * 30) + (i === 0 ? 10 : 2),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Normalize to 100%
    const total = topGeos.reduce((sum, g) => sum + g.percentage, 0);
    topGeos.forEach((g) => {
      g.percentage = Math.round((g.percentage / total) * 100);
    });

    const totalPercentage = topGeos.reduce((sum, g) => sum + g.percentage, 0);
    if (totalPercentage < 100) {
      topGeos[0].percentage += 100 - totalPercentage;
    }

    return {
      top_geographies: topGeos,
      audience_gender: {
        male: Math.floor(Math.random() * 60) + 20,
        female: Math.floor(Math.random() * 60) + 20,
        other: Math.floor(Math.random() * 10),
      },
      age_groups: {
        '13-17': Math.floor(Math.random() * 15) + 2,
        '18-24': Math.floor(Math.random() * 25) + 10,
        '25-34': Math.floor(Math.random() * 30) + 15,
        '35-44': Math.floor(Math.random() * 20) + 10,
        '45-54': Math.floor(Math.random() * 15) + 5,
        '55+': Math.floor(Math.random() * 10),
      },
      subscriber_vs_nonsubscriber_ratio: Math.round(Math.random() * 40) + 20,
      average_session_duration_seconds: Math.floor(Math.random() * 600) + 60,
    };
  }

  private calculateHealthScore(
    metrics: ChannelMetrics,
    videos: VideoMetrics[],
    contentPerformance: ContentPerformance[]
  ): ChannelHealthScore {
    // Growth score: based on subscriber growth rate
    const growthScore = Math.min(100, (metrics.subscriber_growth_rate / 20) * 100);

    // Engagement score: average engagement rate of top videos
    const avgEngagement = videos.reduce((sum, v) => sum + v.engagement_rate, 0) / videos.length;
    const engagementScore = Math.min(100, (avgEngagement / 10) * 100);

    // Content score: frequency and diversity
    const diversityScore = Math.min(100, (contentPerformance.length / 6) * 100);
    const frequencyScore = Math.min(100, metrics.upload_frequency_weekly * 15);
    const contentScore = (diversityScore + frequencyScore) / 2;

    // Retention score: audience retention rate
    const retentionScore = metrics.audience_retention_rate;

    // Monetization score: revenue potential
    const monthlyRevenue = metrics.estimated_monthly_revenue;
    const monetizationScore = Math.min(100, Math.floor((monthlyRevenue / 10000) * 100));

    const overallScore = Math.round(
      (growthScore * 0.2 + engagementScore * 0.25 + contentScore * 0.25 + retentionScore * 0.2 + monetizationScore * 0.1)
    );

    return {
      overall_score: overallScore,
      growth_score: Math.round(growthScore),
      engagement_score: Math.round(engagementScore),
      content_score: Math.round(contentScore),
      retention_score: Math.round(retentionScore),
      monetization_score: Math.round(monetizationScore),
    };
  }

  private determineChannelStatus(score: ChannelHealthScore): 'healthy' | 'growing' | 'stagnant' | 'declining' {
    if (score.overall_score >= 70) {
      return score.growth_score >= 60 ? 'healthy' : 'growing';
    }
    if (score.overall_score >= 50) {
      return 'stagnant';
    }
    return 'declining';
  }

  private identifyPrimaryStrength(score: ChannelHealthScore): string {
    const scores = [
      { name: 'Growth', value: score.growth_score },
      { name: 'Engagement', value: score.engagement_score },
      { name: 'Content Quality', value: score.content_score },
      { name: 'Retention', value: score.retention_score },
    ];

    const strongest = scores.reduce((prev, current) => (prev.value > current.value ? prev : current));
    return strongest.name;
  }

  private identifyPrimaryWeakness(score: ChannelHealthScore): string {
    const scores = [
      { name: 'Growth', value: score.growth_score },
      { name: 'Engagement', value: score.engagement_score },
      { name: 'Content Quality', value: score.content_score },
      { name: 'Retention', value: score.retention_score },
    ];

    const weakest = scores.reduce((prev, current) => (prev.value < current.value ? prev : current));
    return weakest.name;
  }

  private generateRecommendations(score: ChannelHealthScore, contentPerformance: ContentPerformance[]): string[] {
    const recommendations: string[] = [];

    if (score.growth_score < 50) {
      recommendations.push('Increase upload frequency and promote videos across social media');
    }

    if (score.engagement_score < 50) {
      recommendations.push('Improve thumbnails and titles - A/B test different styles');
    }

    if (score.content_score < 50) {
      recommendations.push('Diversify content types - analyze audience preferences');
    }

    if (score.retention_score < 40) {
      recommendations.push('Hook viewers in first 5 seconds and maintain pacing throughout');
    }

    const highPerforming = contentPerformance.filter((c) => c.avg_engagement > 5);
    if (highPerforming.length > 0) {
      recommendations.push(`Focus on ${highPerforming[0].content_type} - it performs best with your audience`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Channel is performing well - continue current strategy');
    }

    return recommendations.slice(0, 5);
  }

  private identifyOpportunities(
    metrics: ChannelMetrics,
    score: ChannelHealthScore,
    contentPerformance: ContentPerformance[]
  ): YouTubeAnalyticsResult['opportunities'] {
    const opportunities: YouTubeAnalyticsResult['opportunities'] = [];

    if (metrics.subscriber_count > 10000 && !metrics.verified) {
      opportunities.push({
        title: 'Apply for Verification',
        description: 'Your channel is eligible for verification - increases credibility',
        impact: 'high',
        effort: 'low',
      });
    }

    if (metrics.estimated_monthly_revenue > 100 && metrics.upload_frequency_weekly < 3) {
      opportunities.push({
        title: 'Increase Upload Frequency',
        description: 'More consistent uploads drive subscriber growth and revenue',
        impact: 'high',
        effort: 'high',
      });
    }

    const bestType = contentPerformance.sort((a, b) => b.avg_engagement - a.avg_engagement)[0];
    if (bestType && bestType.count < 20) {
      opportunities.push({
        title: `Expand ${bestType.content_type} Series`,
        description: `This content type gets ${bestType.avg_engagement.toFixed(1)}% engagement - your best performer`,
        impact: 'high',
        effort: 'medium',
      });
    }

    if (score.retention_score < 50) {
      opportunities.push({
        title: 'Create Shorts Series',
        description: 'YouTube Shorts can boost discoverability and improve average watch duration',
        impact: 'medium',
        effort: 'medium',
      });
    }

    if (metrics.subscriber_count > 50000 && metrics.estimated_monthly_revenue < 1000) {
      opportunities.push({
        title: 'Optimize for Monetization',
        description: 'Implement sponsorships, affiliate links, and premium content',
        impact: 'high',
        effort: 'medium',
      });
    }

    return opportunities;
  }
}

export const youtubeChannelAnalyticsService = new YouTubeChannelAnalyticsService();
