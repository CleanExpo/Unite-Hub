/**
 * Monitor Service - Real-time Citation Share Tracking
 *
 * Monitors citation performance across search engines and AI platforms
 * with real-time updates and alerting.
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import type { CitationSource } from '../seo-intelligence/scout-service.js';

export interface CitationMetrics {
  timestamp: string;
  totalCitations: number;
  aiOverviewCitations: number;
  organicCitations: number;
  featuredSnippets: number;
  knowledgePanels: number;
  averageAuthority: number;
  citationShare: number; // % vs competitors
  trends: CitationTrend[];
}

export interface CitationTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface MonitorOptions {
  watch?: boolean;
  interval?: number; // seconds
  alertThreshold?: number; // % change to trigger alert
  domain?: string;
  compareWith?: string[]; // competitor domains
}

export interface MonitorResult {
  domain: string;
  metrics: CitationMetrics;
  competitors: CompetitorComparison[];
  alerts: CitationAlert[];
}

export interface CompetitorComparison {
  domain: string;
  citationCount: number;
  citationShare: number;
  aiOverviewShare: number;
  gap: number; // difference from your citations
}

export interface CitationAlert {
  id: string;
  type: 'spike' | 'drop' | 'competitor_gain' | 'new_citation' | 'lost_citation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  change: number;
  timestamp: string;
}

export class MonitorService {
  private supabase;
  private workspaceId: string;
  private watching: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    const config = ConfigManager.getInstance();
    this.workspaceId = config.getWorkspaceId();

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async monitor(options: MonitorOptions, callback?: (result: MonitorResult) => void): Promise<MonitorResult | void> {
    if (options.watch) {
      console.log(`[Monitor] Starting watch mode (interval: ${options.interval}s)...`);
      this.startWatching(options, callback);
      return; // Watch mode runs indefinitely
    } else {
      // Single snapshot
      return await this.getSnapshot(options);
    }
  }

  private async startWatching(
    options: MonitorOptions,
    callback?: (result: MonitorResult) => void
  ): Promise<void> {
    this.watching = true;
    const interval = (options.interval || 60) * 1000; // Convert to milliseconds

    const check = async () => {
      if (!this.watching) return;

      try {
        const result = await this.getSnapshot(options);

        // Call callback if provided
        if (callback) {
          callback(result);
        }

        // Store snapshot
        await this.storeSnapshot(result);

        // Check for alerts
        if (result.alerts.length > 0) {
          await this.handleAlerts(result.alerts);
        }
      } catch (error) {
        console.error('[Monitor] Error during check:', error);
      }
    };

    // Initial check
    await check();

    // Set up interval
    this.intervalId = setInterval(check, interval);

    console.log(`[Monitor] Watching citations every ${options.interval}s...`);
    console.log(`[Monitor] Press Ctrl+C to stop`);
  }

  stopWatching(): void {
    this.watching = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('[Monitor] Watch mode stopped');
  }

  private async getSnapshot(options: MonitorOptions): Promise<MonitorResult> {
    const domain = options.domain || 'example.com.au';

    // Fetch current citations
    const citations = await this.fetchCitations(domain);

    // Calculate metrics
    const metrics = this.calculateMetrics(citations);

    // Get competitor data if requested
    const competitors = options.compareWith
      ? await this.fetchCompetitorComparisons(domain, options.compareWith)
      : [];

    // Detect alerts
    const alerts = await this.detectAlerts(domain, metrics, options.alertThreshold || 10);

    return {
      domain,
      metrics,
      competitors,
      alerts,
    };
  }

  private async fetchCitations(domain: string): Promise<CitationSource[]> {
    const { data } = await this.supabase
      .from('citation_sources')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('domain', domain)
      .order('created_at', { ascending: false });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      url: row.url,
      domain: row.domain,
      authority: row.authority,
      citationCount: row.citation_count || 0,
      sectors: row.sectors || [],
      discoveredAt: row.created_at,
      citationType: row.citation_type,
      metadata: row.metadata || {},
    }));
  }

  private calculateMetrics(citations: CitationSource[]): CitationMetrics {
    const totalCitations = citations.length;
    const aiOverviewCitations = citations.filter((c) => c.citationType === 'ai_overview').length;
    const organicCitations = citations.filter((c) => c.citationType === 'organic').length;
    const featuredSnippets = citations.filter((c) => c.citationType === 'featured_snippet').length;
    const knowledgePanels = citations.filter((c) => c.citationType === 'knowledge_panel').length;

    const averageAuthority =
      citations.length > 0
        ? citations.reduce((sum, c) => sum + c.authority, 0) / citations.length
        : 0;

    // Calculate trends (compare with previous snapshot)
    const trends = this.calculateTrends({
      totalCitations,
      aiOverviewCitations,
      organicCitations,
      averageAuthority,
    });

    return {
      timestamp: new Date().toISOString(),
      totalCitations,
      aiOverviewCitations,
      organicCitations,
      featuredSnippets,
      knowledgePanels,
      averageAuthority: Math.round(averageAuthority),
      citationShare: 0, // Calculated against competitors
      trends,
    };
  }

  private calculateTrends(current: Record<string, number>): CitationTrend[] {
    // In production, fetch previous snapshot from database
    // For now, simulate with mock data
    const previous = {
      totalCitations: current.totalCitations * 0.9,
      aiOverviewCitations: current.aiOverviewCitations * 0.95,
      organicCitations: current.organicCitations * 0.88,
      averageAuthority: current.averageAuthority * 0.98,
    };

    const trends: CitationTrend[] = [];

    for (const [metric, currentValue] of Object.entries(current)) {
      const previousValue = previous[metric as keyof typeof previous] || 0;
      const change = currentValue - previousValue;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
      const direction: 'up' | 'down' | 'stable' =
        Math.abs(changePercent) < 2 ? 'stable' : changePercent > 0 ? 'up' : 'down';

      trends.push({
        metric,
        current: currentValue,
        previous: previousValue,
        change,
        changePercent: Math.round(changePercent * 10) / 10,
        direction,
      });
    }

    return trends;
  }

  private async fetchCompetitorComparisons(
    domain: string,
    competitors: string[]
  ): Promise<CompetitorComparison[]> {
    const comparisons: CompetitorComparison[] = [];

    // Fetch client citations count
    const clientCitations = await this.fetchCitations(domain);
    const clientCount = clientCitations.length;
    const clientAiCount = clientCitations.filter((c) => c.citationType === 'ai_overview').length;

    for (const competitor of competitors) {
      const competitorCitations = await this.fetchCitations(competitor);
      const count = competitorCitations.length;
      const aiCount = competitorCitations.filter((c) => c.citationType === 'ai_overview').length;

      const totalCitations = clientCount + count;
      const citationShare = totalCitations > 0 ? (count / totalCitations) * 100 : 0;
      const aiOverviewShare = clientAiCount + aiCount > 0 ? (aiCount / (clientAiCount + aiCount)) * 100 : 0;

      comparisons.push({
        domain: competitor,
        citationCount: count,
        citationShare: Math.round(citationShare * 10) / 10,
        aiOverviewShare: Math.round(aiOverviewShare * 10) / 10,
        gap: count - clientCount,
      });
    }

    return comparisons.sort((a, b) => b.citationCount - a.citationCount);
  }

  private async detectAlerts(
    domain: string,
    metrics: CitationMetrics,
    threshold: number
  ): Promise<CitationAlert[]> {
    const alerts: CitationAlert[] = [];

    // Check for significant changes
    for (const trend of metrics.trends) {
      if (Math.abs(trend.changePercent) >= threshold) {
        const type: CitationAlert['type'] =
          trend.changePercent > 0 ? 'spike' : 'drop';
        const severity: CitationAlert['severity'] =
          Math.abs(trend.changePercent) >= 25
            ? 'critical'
            : Math.abs(trend.changePercent) >= 15
            ? 'warning'
            : 'info';

        alerts.push({
          id: `alert-${Date.now()}-${trend.metric}`,
          type,
          severity,
          message: `${trend.metric} ${trend.direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(trend.changePercent).toFixed(1)}%`,
          metric: trend.metric,
          value: trend.current,
          change: trend.changePercent,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }

  private async handleAlerts(alerts: CitationAlert[]): Promise<void> {
    // Store alerts in database
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }

    // In production, send notifications via:
    // - Email
    // - Slack
    // - Webhook
    // - Dashboard WebSocket
  }

  private async storeSnapshot(result: MonitorResult): Promise<void> {
    const record = {
      workspace_id: this.workspaceId,
      domain: result.domain,
      metrics: result.metrics,
      competitors: result.competitors,
      timestamp: new Date().toISOString(),
    };

    await this.supabase.from('citation_snapshots').insert(record);
  }

  private async storeAlert(alert: CitationAlert): Promise<void> {
    const record = {
      id: alert.id,
      workspace_id: this.workspaceId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metric: alert.metric,
      value: alert.value,
      change: alert.change,
      timestamp: alert.timestamp,
    };

    await this.supabase.from('citation_alerts').insert(record);
  }

  async getRecentSnapshots(domain: string, limit: number = 20): Promise<any[]> {
    const { data } = await this.supabase
      .from('citation_snapshots')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('domain', domain)
      .order('timestamp', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getRecentAlerts(limit: number = 50): Promise<CitationAlert[]> {
    const { data } = await this.supabase
      .from('citation_alerts')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      message: row.message,
      metric: row.metric,
      value: row.value,
      change: row.change,
      timestamp: row.timestamp,
    }));
  }
}
