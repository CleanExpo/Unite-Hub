/**
 * UsageAnalyticsService
 * Phase 12 Week 7-8: Usage analytics, heatmaps, consumption clustering, trend modeling
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface UsageHeatmap {
  workspace_id: string;
  workspace_name: string;
  hourly_distribution: number[];
  daily_distribution: number[];
  peak_hours: number[];
  peak_days: number[];
  total_events: number;
}

export interface ConsumptionCluster {
  cluster_id: string;
  cluster_name: string;
  characteristics: ClusterCharacteristics;
  workspaces: string[];
  workspace_count: number;
  avg_usage: UsageProfile;
}

export interface ClusterCharacteristics {
  primary_category: string;
  usage_level: 'low' | 'medium' | 'high' | 'very_high';
  growth_trend: 'declining' | 'stable' | 'growing' | 'rapid_growth';
  peak_time: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface UsageProfile {
  emails: number;
  ai_requests: number;
  contacts: number;
  reports: number;
  campaigns: number;
  api_calls: number;
}

export interface UsageTrend {
  period: string;
  period_start: Date;
  period_end: Date;
  usage: UsageProfile;
  growth_rate: number;
  projected_next: number;
}

export interface TrendForecast {
  category: string;
  current_value: number;
  forecasted_values: ForecastPoint[];
  confidence: number;
  trend_direction: 'up' | 'down' | 'stable';
  growth_rate: number;
}

export interface ForecastPoint {
  period: string;
  value: number;
  lower_bound: number;
  upper_bound: number;
}

export interface AnomalyDetection {
  workspace_id: string;
  workspace_name: string;
  category: string;
  expected_value: number;
  actual_value: number;
  deviation_percent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: Date;
}

export class UsageAnalyticsService {
  /**
   * Generate usage heatmap for organization
   */
  async generateHeatmap(
    orgId: string,
    workspaceId?: string,
    days: number = 30
  ): Promise<UsageHeatmap[]> {
    const supabase = await getSupabaseServer();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get workspaces
    let workspacesQuery = supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId);

    if (workspaceId) {
      workspacesQuery = workspacesQuery.eq('id', workspaceId);
    }

    const { data: workspaces } = await workspacesQuery;

    if (!workspaces || workspaces.length === 0) {
      return [];
    }

    const heatmaps: UsageHeatmap[] = [];

    for (const workspace of workspaces) {
      // Get usage events with timestamps
      const { data: events } = await supabase
        .from('usage_events')
        .select('created_at, quantity')
        .eq('org_id', orgId)
        .eq('workspace_id', workspace.id)
        .gte('created_at', startDate.toISOString());

      // Initialize distributions
      const hourlyDistribution = new Array(24).fill(0);
      const dailyDistribution = new Array(7).fill(0);

      // Process events
      (events || []).forEach((event: any) => {
        const date = new Date(event.created_at);
        const hour = date.getHours();
        const day = date.getDay();

        hourlyDistribution[hour] += event.quantity || 1;
        dailyDistribution[day] += event.quantity || 1;
      });

      // Find peaks
      const peakHours = this.findPeaks(hourlyDistribution, 3);
      const peakDays = this.findPeaks(dailyDistribution, 2);

      heatmaps.push({
        workspace_id: workspace.id,
        workspace_name: workspace.name,
        hourly_distribution: hourlyDistribution,
        daily_distribution: dailyDistribution,
        peak_hours: peakHours,
        peak_days: peakDays,
        total_events: (events || []).length,
      });
    }

    return heatmaps;
  }

  /**
   * Cluster workspaces by consumption patterns
   */
  async clusterByConsumption(orgId: string, days: number = 30): Promise<ConsumptionCluster[]> {
    const supabase = await getSupabaseServer();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all workspaces with their usage
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId);

    if (!workspaces || workspaces.length === 0) {
      return [];
    }

    // Get usage for each workspace
    const workspaceUsage: Map<string, { name: string; usage: UsageProfile }> = new Map();

    for (const workspace of workspaces) {
      const { data: events } = await supabase
        .from('usage_events')
        .select('event_category, quantity')
        .eq('org_id', orgId)
        .eq('workspace_id', workspace.id)
        .gte('created_at', startDate.toISOString());

      const usage: UsageProfile = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
      };

      (events || []).forEach((event: any) => {
        switch (event.event_category) {
          case 'email_sent':
            usage.emails += event.quantity;
            break;
          case 'ai_request':
            usage.ai_requests += event.quantity;
            break;
          case 'contact_created':
            usage.contacts += event.quantity;
            break;
          case 'report_generated':
            usage.reports += event.quantity;
            break;
          case 'campaign_step':
            usage.campaigns += event.quantity;
            break;
          case 'api_call':
            usage.api_calls += event.quantity;
            break;
        }
      });

      workspaceUsage.set(workspace.id, { name: workspace.name, usage });
    }

    // Simple k-means-like clustering
    const clusters = this.performClustering(workspaceUsage);

    return clusters;
  }

  /**
   * Analyze usage trends over time
   */
  async analyzeTrends(
    orgId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    periods: number = 12
  ): Promise<UsageTrend[]> {
    const supabase = await getSupabaseServer();
    const trends: UsageTrend[] = [];

    // Calculate period boundaries
    const now = new Date();
    const periodMs = this.getPeriodMs(periodType);

    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getTime() - i * periodMs);
      const periodStart = new Date(periodEnd.getTime() - periodMs);

      const { data: events } = await supabase
        .from('usage_events')
        .select('event_category, quantity')
        .eq('org_id', orgId)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());

      const usage: UsageProfile = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
      };

      (events || []).forEach((event: any) => {
        switch (event.event_category) {
          case 'email_sent':
            usage.emails += event.quantity;
            break;
          case 'ai_request':
            usage.ai_requests += event.quantity;
            break;
          case 'contact_created':
            usage.contacts += event.quantity;
            break;
          case 'report_generated':
            usage.reports += event.quantity;
            break;
          case 'campaign_step':
            usage.campaigns += event.quantity;
            break;
          case 'api_call':
            usage.api_calls += event.quantity;
            break;
        }
      });

      const totalUsage = Object.values(usage).reduce((a, b) => a + b, 0);

      // Calculate growth rate
      let growthRate = 0;
      if (trends.length > 0) {
        const prevTotal = Object.values(trends[trends.length - 1].usage).reduce((a, b) => a + b, 0);
        if (prevTotal > 0) {
          growthRate = ((totalUsage - prevTotal) / prevTotal) * 100;
        }
      }

      trends.push({
        period: this.formatPeriod(periodStart, periodType),
        period_start: periodStart,
        period_end: periodEnd,
        usage,
        growth_rate: growthRate,
        projected_next: 0, // Will be calculated after
      });
    }

    // Calculate projections using linear regression
    if (trends.length >= 3) {
      const values = trends.map((t) => Object.values(t.usage).reduce((a, b) => a + b, 0));
      const projection = this.linearRegression(values);
      trends[trends.length - 1].projected_next = Math.max(0, projection);
    }

    return trends;
  }

  /**
   * Forecast future usage
   */
  async forecastUsage(
    orgId: string,
    category: string,
    periodsAhead: number = 3
  ): Promise<TrendForecast> {
    const supabase = await getSupabaseServer();

    // Get historical data (last 12 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const { data: rollups } = await supabase
      .from('usage_rollups')
      .select('*')
      .eq('org_id', orgId)
      .eq('period_type', 'monthly')
      .gte('period_start', startDate.toISOString())
      .order('period_start');

    // Extract category values
    const values: number[] = [];
    (rollups || []).forEach((rollup: any) => {
      switch (category) {
        case 'emails':
          values.push(rollup.email_count);
          break;
        case 'ai_requests':
          values.push(rollup.ai_request_count);
          break;
        case 'contacts':
          values.push(rollup.contact_count);
          break;
        case 'reports':
          values.push(rollup.report_count);
          break;
        case 'campaigns':
          values.push(rollup.campaign_count);
          break;
        case 'api_calls':
          values.push(rollup.api_call_count);
          break;
      }
    });

    if (values.length < 3) {
      return {
        category,
        current_value: values[values.length - 1] || 0,
        forecasted_values: [],
        confidence: 0,
        trend_direction: 'stable',
        growth_rate: 0,
      };
    }

    // Calculate trend
    const { slope, intercept, r2 } = this.calculateRegression(values);
    const currentValue = values[values.length - 1];
    const n = values.length;

    // Generate forecasts
    const forecasted_values: ForecastPoint[] = [];
    const stdDev = this.calculateStdDev(values);

    for (let i = 1; i <= periodsAhead; i++) {
      const forecastedValue = slope * (n + i) + intercept;
      const uncertainty = stdDev * Math.sqrt(1 + 1 / n + Math.pow(i, 2) / (n * n));

      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + i);

      forecasted_values.push({
        period: this.formatPeriod(nextDate, 'monthly'),
        value: Math.max(0, Math.round(forecastedValue)),
        lower_bound: Math.max(0, Math.round(forecastedValue - 1.96 * uncertainty)),
        upper_bound: Math.round(forecastedValue + 1.96 * uncertainty),
      });
    }

    // Calculate growth rate
    const growthRate = values.length >= 2 ? ((currentValue - values[0]) / values[0]) * 100 : 0;

    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable';
    if (slope > 0.05 * currentValue) {
      trendDirection = 'up';
    } else if (slope < -0.05 * currentValue) {
      trendDirection = 'down';
    } else {
      trendDirection = 'stable';
    }

    return {
      category,
      current_value: currentValue,
      forecasted_values,
      confidence: r2,
      trend_direction: trendDirection,
      growth_rate: growthRate,
    };
  }

  /**
   * Detect usage anomalies
   */
  async detectAnomalies(orgId: string, threshold: number = 2.0): Promise<AnomalyDetection[]> {
    const supabase = await getSupabaseServer();
    const anomalies: AnomalyDetection[] = [];

    // Get workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId);

    if (!workspaces || workspaces.length === 0) {
      return [];
    }

    // Analyze each workspace
    for (const workspace of workspaces) {
      // Get last 30 days of usage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: events } = await supabase
        .from('usage_events')
        .select('event_category, quantity, created_at')
        .eq('org_id', orgId)
        .eq('workspace_id', workspace.id)
        .gte('created_at', startDate.toISOString());

      // Group by category and date
      const dailyUsage: Map<string, Map<string, number>> = new Map();

      (events || []).forEach((event: any) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        const category = event.event_category;

        if (!dailyUsage.has(category)) {
          dailyUsage.set(category, new Map());
        }

        const categoryUsage = dailyUsage.get(category)!;
        categoryUsage.set(date, (categoryUsage.get(date) || 0) + event.quantity);
      });

      // Check for anomalies in each category
      for (const [category, usageByDate] of dailyUsage) {
        const values = Array.from(usageByDate.values());
        if (values.length < 7) continue;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = this.calculateStdDev(values);

        if (stdDev === 0) continue;

        // Check latest day
        const latestDate = Array.from(usageByDate.keys()).sort().pop()!;
        const latestValue = usageByDate.get(latestDate)!;

        const zScore = (latestValue - mean) / stdDev;

        if (Math.abs(zScore) > threshold) {
          const deviationPercent = ((latestValue - mean) / mean) * 100;

          let severity: 'low' | 'medium' | 'high' | 'critical';
          if (Math.abs(zScore) > 4) {
            severity = 'critical';
          } else if (Math.abs(zScore) > 3) {
            severity = 'high';
          } else if (Math.abs(zScore) > 2.5) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          anomalies.push({
            workspace_id: workspace.id,
            workspace_name: workspace.name,
            category,
            expected_value: mean,
            actual_value: latestValue,
            deviation_percent: deviationPercent,
            severity,
            detected_at: new Date(),
          });
        }
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return anomalies;
  }

  /**
   * Get usage comparison between periods
   */
  async compareperiods(
    orgId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
    period1: UsageProfile;
    period2: UsageProfile;
    changes: { [key: string]: number };
  }> {
    const supabase = await getSupabaseServer();

    const getUsage = async (start: Date, end: Date): Promise<UsageProfile> => {
      const { data } = await supabase
        .from('usage_events')
        .select('event_category, quantity')
        .eq('org_id', orgId)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      const usage: UsageProfile = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
      };

      (data || []).forEach((event: any) => {
        switch (event.event_category) {
          case 'email_sent':
            usage.emails += event.quantity;
            break;
          case 'ai_request':
            usage.ai_requests += event.quantity;
            break;
          case 'contact_created':
            usage.contacts += event.quantity;
            break;
          case 'report_generated':
            usage.reports += event.quantity;
            break;
          case 'campaign_step':
            usage.campaigns += event.quantity;
            break;
          case 'api_call':
            usage.api_calls += event.quantity;
            break;
        }
      });

      return usage;
    };

    const period1 = await getUsage(period1Start, period1End);
    const period2 = await getUsage(period2Start, period2End);

    const changes: { [key: string]: number } = {};
    for (const key of Object.keys(period1) as Array<keyof UsageProfile>) {
      const p1Value = period1[key];
      const p2Value = period2[key];
      changes[key] = p1Value > 0 ? ((p2Value - p1Value) / p1Value) * 100 : p2Value > 0 ? 100 : 0;
    }

    return { period1, period2, changes };
  }

  // Private helper methods

  private findPeaks(distribution: number[], count: number): number[] {
    const indexed = distribution.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => b.value - a.value);
    return indexed.slice(0, count).map((item) => item.index);
  }

  private getPeriodMs(periodType: 'daily' | 'weekly' | 'monthly'): number {
    switch (periodType) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private formatPeriod(date: Date, periodType: 'daily' | 'weekly' | 'monthly'): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (periodType) {
      case 'daily':
        return `${months[date.getMonth()]} ${date.getDate()}`;
      case 'weekly':
        return `Week of ${months[date.getMonth()]} ${date.getDate()}`;
      case 'monthly':
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }

  private linearRegression(values: number[]): number {
    const n = values.length;
    if (n < 2) return values[values.length - 1] || 0;

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return slope * n + intercept;
  }

  private calculateRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
      sumY2 += values[i] * values[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const meanY = sumY / n;
    let ssTotal = 0,
      ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssTotal += Math.pow(values[i] - meanY, 2);
      ssResidual += Math.pow(values[i] - predicted, 2);
    }

    const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    return { slope, intercept, r2 };
  }

  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);

    return Math.sqrt(variance);
  }

  private performClustering(
    workspaceUsage: Map<string, { name: string; usage: UsageProfile }>
  ): ConsumptionCluster[] {
    // Simple clustering based on total usage and primary category
    const clusters: ConsumptionCluster[] = [];

    // Define cluster thresholds
    const clusterDefs = [
      { name: 'Light Users', minTotal: 0, maxTotal: 100 },
      { name: 'Moderate Users', minTotal: 100, maxTotal: 500 },
      { name: 'Heavy Users', minTotal: 500, maxTotal: 2000 },
      { name: 'Power Users', minTotal: 2000, maxTotal: Infinity },
    ];

    for (const clusterDef of clusterDefs) {
      const clusterWorkspaces: string[] = [];
      let totalUsage: UsageProfile = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
      };

      for (const [workspaceId, data] of workspaceUsage) {
        const total = Object.values(data.usage).reduce((a, b) => a + b, 0);

        if (total >= clusterDef.minTotal && total < clusterDef.maxTotal) {
          clusterWorkspaces.push(workspaceId);
          for (const key of Object.keys(data.usage) as Array<keyof UsageProfile>) {
            totalUsage[key] += data.usage[key];
          }
        }
      }

      if (clusterWorkspaces.length === 0) continue;

      // Calculate average
      const avgUsage: UsageProfile = {
        emails: Math.round(totalUsage.emails / clusterWorkspaces.length),
        ai_requests: Math.round(totalUsage.ai_requests / clusterWorkspaces.length),
        contacts: Math.round(totalUsage.contacts / clusterWorkspaces.length),
        reports: Math.round(totalUsage.reports / clusterWorkspaces.length),
        campaigns: Math.round(totalUsage.campaigns / clusterWorkspaces.length),
        api_calls: Math.round(totalUsage.api_calls / clusterWorkspaces.length),
      };

      // Determine primary category
      const maxEntry = Object.entries(avgUsage).reduce((a, b) => (a[1] > b[1] ? a : b));

      // Determine usage level
      const avgTotal = Object.values(avgUsage).reduce((a, b) => a + b, 0);
      let usageLevel: 'low' | 'medium' | 'high' | 'very_high';
      if (avgTotal < 100) usageLevel = 'low';
      else if (avgTotal < 500) usageLevel = 'medium';
      else if (avgTotal < 2000) usageLevel = 'high';
      else usageLevel = 'very_high';

      clusters.push({
        cluster_id: clusterDef.name.toLowerCase().replace(/\s+/g, '_'),
        cluster_name: clusterDef.name,
        characteristics: {
          primary_category: maxEntry[0],
          usage_level: usageLevel,
          growth_trend: 'stable', // Would need historical data
          peak_time: 'afternoon', // Would need time analysis
        },
        workspaces: clusterWorkspaces,
        workspace_count: clusterWorkspaces.length,
        avg_usage: avgUsage,
      });
    }

    return clusters;
  }
}

// Export singleton
export const usageAnalyticsService = new UsageAnalyticsService();
