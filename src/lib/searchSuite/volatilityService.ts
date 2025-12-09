/**
 * Volatility Service
 *
 * Monitors search ranking volatility and generates alerts for significant changes.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  VolatilityLevel,
  VolatilityAlert,
  AlertType,
  AlertSeverity,
  VolatilityMetrics,
  SearchEngine,
} from './searchProviderTypes';
import { searchSuiteConfig } from '../../../config/searchSuite.config';

export interface VolatilityCheckOptions {
  period?: '24h' | '7d' | '30d';
  engines?: SearchEngine[];
  keywordIds?: string[];
}

export interface AlertFilters {
  types?: AlertType[];
  severities?: AlertSeverity[];
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface VolatilitySummary {
  overallLevel: VolatilityLevel;
  avgVolatilityScore: number;
  keywordsAnalyzed: number;
  highVolatilityCount: number;
  activeAlerts: number;
  criticalAlerts: number;
  lastChecked: Date;
}

class VolatilityService {
  private thresholds = searchSuiteConfig.volatility.alertThresholds;

  /**
   * Check volatility for a project
   */
  async checkVolatility(
    projectId: string,
    workspaceId: string,
    options: VolatilityCheckOptions = {}
  ): Promise<{
    metrics: VolatilityMetrics[];
    newAlerts: VolatilityAlert[];
  }> {
    const {
      period = '7d',
      engines = ['google'],
      keywordIds,
    } = options;

    const supabase = await getSupabaseServer();
    const metrics: VolatilityMetrics[] = [];
    const newAlerts: VolatilityAlert[] = [];

    // Get keywords to check
    let keywordQuery = supabase
      .from('search_keywords')
      .select('id, keyword')
      .eq('project_id', projectId)
      .eq('status', 'active');

    if (keywordIds?.length) {
      keywordQuery = keywordQuery.in('id', keywordIds);
    }

    const { data: keywords } = await keywordQuery;

    if (!keywords || keywords.length === 0) {
      return { metrics, newAlerts };
    }

    // Calculate period dates
    const periodDays = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Analyze each keyword
    for (const keyword of keywords) {
      for (const engine of engines) {
        const volatilityMetrics = await this.calculateKeywordVolatility(
          projectId,
          keyword.id,
          keyword.keyword,
          engine,
          startDate,
          period
        );

        if (volatilityMetrics) {
          metrics.push(volatilityMetrics);

          // Check for alerts
          const alerts = await this.checkForAlerts(
            projectId,
            workspaceId,
            keyword.id,
            keyword.keyword,
            volatilityMetrics
          );

          newAlerts.push(...alerts);
        }
      }
    }

    return { metrics, newAlerts };
  }

  /**
   * Calculate volatility for a single keyword
   */
  private async calculateKeywordVolatility(
    projectId: string,
    keywordId: string,
    keyword: string,
    engine: SearchEngine,
    startDate: Date,
    period: '24h' | '7d' | '30d'
  ): Promise<VolatilityMetrics | null> {
    const supabase = await getSupabaseServer();

    // Get snapshots for the period
    const { data: snapshots } = await supabase
      .from('search_serp_snapshots')
      .select('snapshot_date, organic_results')
      .eq('keyword_id', keywordId)
      .eq('engine', engine)
      .gte('snapshot_date', startDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (!snapshots || snapshots.length < 2) {
      return null;
    }

    // Extract positions
    const positions: number[] = [];
    for (const snapshot of snapshots) {
      const results = snapshot.organic_results as Array<{ isOurSite: boolean; position: number }>;
      const ourResult = results?.find((r) => r.isOurSite);
      if (ourResult) {
        positions.push(ourResult.position);
      }
    }

    if (positions.length < 2) {
      return null;
    }

    // Calculate volatility metrics
    const changes: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      changes.push(Math.abs(positions[i] - positions[i - 1]));
    }

    const avgPositionChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const maxPositionChange = Math.max(...changes);
    const volatilityScore = this.calculateVolatilityScore(avgPositionChange, maxPositionChange, positions.length);

    return {
      engine,
      keyword,
      period,
      avgPositionChange,
      maxPositionChange,
      volatilityScore,
      volatilityLevel: this.getVolatilityLevel(volatilityScore),
      dataPoints: positions.length,
    };
  }

  /**
   * Check for alert conditions
   */
  private async checkForAlerts(
    projectId: string,
    workspaceId: string,
    keywordId: string,
    keyword: string,
    metrics: VolatilityMetrics
  ): Promise<VolatilityAlert[]> {
    const supabase = await getSupabaseServer();
    const alerts: VolatilityAlert[] = [];

    // Get latest two snapshots for comparison
    const { data: recentSnapshots } = await supabase
      .from('search_serp_snapshots')
      .select('snapshot_date, organic_results, features')
      .eq('keyword_id', keywordId)
      .order('snapshot_date', { ascending: false })
      .limit(2);

    if (!recentSnapshots || recentSnapshots.length < 2) {
      return alerts;
    }

    const [latest, previous] = recentSnapshots;
    const latestResults = latest.organic_results as Array<{ isOurSite: boolean; position: number; url: string }>;
    const previousResults = previous.organic_results as Array<{ isOurSite: boolean; position: number; url: string }>;

    const latestOur = latestResults?.find((r) => r.isOurSite);
    const previousOur = previousResults?.find((r) => r.isOurSite);

    // Check for rank changes
    if (latestOur && previousOur) {
      const rankChange = previousOur.position - latestOur.position;

      // Significant rank drop
      if (rankChange < -this.thresholds.rankDrop) {
        const alert = await this.createAlert(projectId, workspaceId, keywordId, {
          alertType: 'rank_drop',
          severity: rankChange < -10 ? 'critical' : 'warning',
          title: `Significant rank drop for "${keyword}"`,
          description: `Position dropped from ${previousOur.position} to ${latestOur.position} (${Math.abs(rankChange)} positions)`,
          previousValue: String(previousOur.position),
          currentValue: String(latestOur.position),
          changePercent: (rankChange / previousOur.position) * 100,
          affectedUrls: [latestOur.url],
        });
        if (alert) {
alerts.push(alert);
}
      }

      // Significant rank gain
      if (rankChange > this.thresholds.rankGain) {
        const alert = await this.createAlert(projectId, workspaceId, keywordId, {
          alertType: 'rank_gain',
          severity: 'info',
          title: `Significant rank improvement for "${keyword}"`,
          description: `Position improved from ${previousOur.position} to ${latestOur.position} (+${rankChange} positions)`,
          previousValue: String(previousOur.position),
          currentValue: String(latestOur.position),
          changePercent: (rankChange / previousOur.position) * 100,
          affectedUrls: [latestOur.url],
        });
        if (alert) {
alerts.push(alert);
}
      }
    }

    // Check for lost ranking
    if (previousOur && !latestOur) {
      const alert = await this.createAlert(projectId, workspaceId, keywordId, {
        alertType: 'rank_drop',
        severity: 'critical',
        title: `Lost ranking for "${keyword}"`,
        description: `Previously ranked at position ${previousOur.position}, no longer in top 100`,
        previousValue: String(previousOur.position),
        currentValue: 'Not ranking',
        affectedUrls: [previousOur.url],
      });
      if (alert) {
alerts.push(alert);
}
    }

    // Check for new ranking
    if (!previousOur && latestOur) {
      const alert = await this.createAlert(projectId, workspaceId, keywordId, {
        alertType: 'rank_gain',
        severity: 'info',
        title: `New ranking for "${keyword}"`,
        description: `Now ranking at position ${latestOur.position}`,
        currentValue: String(latestOur.position),
        affectedUrls: [latestOur.url],
      });
      if (alert) {
alerts.push(alert);
}
    }

    // Check for SERP feature changes
    const latestFeatures = (latest.features || []) as string[];
    const previousFeatures = (previous.features || []) as string[];

    const lostFeatures = previousFeatures.filter((f) => !latestFeatures.includes(f));
    const gainedFeatures = latestFeatures.filter((f) => !previousFeatures.includes(f));

    if (lostFeatures.length > 0) {
      const alert = await this.createAlert(projectId, workspaceId, keywordId, {
        alertType: 'lost_feature',
        severity: lostFeatures.includes('featured_snippet') ? 'critical' : 'warning',
        title: `Lost SERP features for "${keyword}"`,
        description: `Lost: ${lostFeatures.join(', ')}`,
        previousValue: previousFeatures.join(', '),
        currentValue: latestFeatures.join(', '),
      });
      if (alert) {
alerts.push(alert);
}
    }

    if (gainedFeatures.length > 0) {
      const alert = await this.createAlert(projectId, workspaceId, keywordId, {
        alertType: 'gained_feature',
        severity: 'info',
        title: `Gained SERP features for "${keyword}"`,
        description: `Gained: ${gainedFeatures.join(', ')}`,
        previousValue: previousFeatures.join(', '),
        currentValue: latestFeatures.join(', '),
      });
      if (alert) {
alerts.push(alert);
}
    }

    // High volatility alert
    if (metrics.volatilityLevel === 'high' || metrics.volatilityLevel === 'extreme') {
      const alert = await this.createAlert(projectId, workspaceId, keywordId, {
        alertType: 'high_volatility',
        severity: metrics.volatilityLevel === 'extreme' ? 'critical' : 'warning',
        title: `High volatility detected for "${keyword}"`,
        description: `Volatility score: ${metrics.volatilityScore.toFixed(1)} (${metrics.volatilityLevel}). Average position change: ${metrics.avgPositionChange.toFixed(1)}`,
        currentValue: String(metrics.volatilityScore),
      });
      if (alert) {
alerts.push(alert);
}
    }

    return alerts;
  }

  /**
   * Create and store an alert
   */
  private async createAlert(
    projectId: string,
    workspaceId: string,
    keywordId: string,
    alertData: {
      alertType: AlertType;
      severity: AlertSeverity;
      title: string;
      description: string;
      previousValue?: string;
      currentValue?: string;
      changePercent?: number;
      affectedUrls?: string[];
      recommendations?: string[];
    }
  ): Promise<VolatilityAlert | null> {
    const supabase = await getSupabaseServer();

    // Check for duplicate recent alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: existing } = await supabase
      .from('search_volatility_alerts')
      .select('id')
      .eq('project_id', projectId)
      .eq('keyword_id', keywordId)
      .eq('alert_type', alertData.alertType)
      .gte('created_at', oneHourAgo.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      return null; // Duplicate alert
    }

    const { data: alert, error } = await supabase
      .from('search_volatility_alerts')
      .insert({
        project_id: projectId,
        keyword_id: keywordId,
        workspace_id: workspaceId,
        alert_type: alertData.alertType,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description,
        alert_date: new Date().toISOString(),
        previous_value: alertData.previousValue,
        current_value: alertData.currentValue,
        change_percent: alertData.changePercent,
        affected_urls: alertData.affectedUrls,
        recommendations: alertData.recommendations || this.getRecommendations(alertData.alertType),
        acknowledged: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Volatility] Error creating alert:', error);
      return null;
    }

    return this.mapAlertFromDb(alert);
  }

  /**
   * Get alerts for a project
   */
  async getAlerts(
    projectId: string,
    filters: AlertFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ alerts: VolatilityAlert[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('search_volatility_alerts')
      .select('*, search_keywords(keyword)', { count: 'exact' })
      .eq('project_id', projectId);

    if (filters.types?.length) {
      query = query.in('alert_type', filters.types);
    }

    if (filters.severities?.length) {
      query = query.in('severity', filters.severities);
    }

    if (filters.acknowledged !== undefined) {
      query = query.eq('acknowledged', filters.acknowledged);
    }

    if (filters.startDate) {
      query = query.gte('alert_date', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('alert_date', filters.endDate.toISOString());
    }

    const offset = (page - 1) * limit;
    query = query
      .order('alert_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      alerts: (data || []).map(this.mapAlertFromDb),
      total: count || 0,
    };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('search_volatility_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      throw error;
    }
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledgeAlerts(alertIds: string[], userId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('search_volatility_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .in('id', alertIds);

    if (error) {
      throw error;
    }
  }

  /**
   * Get volatility summary for a project
   */
  async getVolatilitySummary(projectId: string): Promise<VolatilitySummary> {
    const { metrics } = await this.checkVolatility(projectId, '', { period: '7d' });

    const supabase = await getSupabaseServer();

    // Count active alerts
    const { count: activeCount } = await supabase
      .from('search_volatility_alerts')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId)
      .eq('acknowledged', false);

    const { count: criticalCount } = await supabase
      .from('search_volatility_alerts')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId)
      .eq('acknowledged', false)
      .eq('severity', 'critical');

    const avgScore = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.volatilityScore, 0) / metrics.length
      : 0;

    const highVolatilityCount = metrics.filter(
      (m) => m.volatilityLevel === 'high' || m.volatilityLevel === 'extreme'
    ).length;

    return {
      overallLevel: this.getVolatilityLevel(avgScore),
      avgVolatilityScore: avgScore,
      keywordsAnalyzed: metrics.length,
      highVolatilityCount,
      activeAlerts: activeCount || 0,
      criticalAlerts: criticalCount || 0,
      lastChecked: new Date(),
    };
  }

  // Private helper methods

  private calculateVolatilityScore(
    avgChange: number,
    maxChange: number,
    dataPoints: number
  ): number {
    // Score from 0-100 based on position changes
    const avgWeight = 0.6;
    const maxWeight = 0.3;
    const consistencyWeight = 0.1;

    const avgScore = Math.min(100, avgChange * 10);
    const maxScore = Math.min(100, maxChange * 5);
    const consistencyScore = dataPoints >= 7 ? 100 : (dataPoints / 7) * 100;

    return avgScore * avgWeight + maxScore * maxWeight + consistencyScore * consistencyWeight;
  }

  private getVolatilityLevel(score: number): VolatilityLevel {
    if (score < 10) {
return 'stable';
}
    if (score < 25) {
return 'low';
}
    if (score < 50) {
return 'moderate';
}
    if (score < 75) {
return 'high';
}
    return 'extreme';
  }

  private getRecommendations(alertType: AlertType): string[] {
    const recommendations: Record<AlertType, string[]> = {
      rank_drop: [
        'Check for recent algorithm updates',
        'Review content quality and freshness',
        'Analyze competitor movements',
        'Check for technical SEO issues',
        'Review backlink profile for losses',
      ],
      rank_gain: [
        'Analyze what contributed to the improvement',
        'Consider expanding content on this topic',
        'Build more backlinks to consolidate gains',
      ],
      new_competitor: [
        'Analyze competitor content strategy',
        'Identify their unique value proposition',
        'Look for content gaps to exploit',
      ],
      lost_feature: [
        'Review content structure for featured snippet optimization',
        'Ensure content directly answers the query',
        'Check competitor content that took the feature',
      ],
      gained_feature: [
        'Document what worked for this keyword',
        'Apply similar strategies to related keywords',
      ],
      high_volatility: [
        'Monitor closely for sustained changes',
        'Check for algorithm update announcements',
        'Review industry-wide SERP changes',
      ],
      index_issue: [
        'Check robots.txt for blocking rules',
        'Verify sitemap submission',
        'Use URL inspection tool',
      ],
      crawl_error: [
        'Check server logs for errors',
        'Verify page accessibility',
        'Review redirect chains',
      ],
    };

    return recommendations[alertType] || [];
  }

  private mapAlertFromDb(data: Record<string, unknown>): VolatilityAlert {
    return {
      id: data.id as string,
      projectId: data.project_id as string,
      keywordId: data.keyword_id as string | undefined,
      workspaceId: data.workspace_id as string,
      alertType: data.alert_type as AlertType,
      severity: data.severity as AlertSeverity,
      title: data.title as string,
      description: data.description as string,
      alertDate: new Date(data.alert_date as string),
      previousValue: data.previous_value as string | undefined,
      currentValue: data.current_value as string | undefined,
      changePercent: data.change_percent as number | undefined,
      affectedUrls: data.affected_urls as string[] | undefined,
      recommendations: data.recommendations as string[] | undefined,
      acknowledged: data.acknowledged as boolean,
      acknowledgedBy: data.acknowledged_by as string | undefined,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const volatilityService = new VolatilityService();
