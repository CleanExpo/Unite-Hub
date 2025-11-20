/**
 * KPI Tracking Service
 * Phase 11 Week 5-6: Long-Horizon Planning
 *
 * Collects baseline, current, and projected KPIs across SEO, GEO, Content, Ads, and CRO domains.
 * Provides trend analysis and gap detection for horizon planning.
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type SnapshotType = 'BASELINE' | 'CURRENT' | 'PROJECTED' | 'TARGET' | 'MILESTONE';
export type KPIDomain = 'SEO' | 'GEO' | 'CONTENT' | 'ADS' | 'CRO' | 'EMAIL' | 'SOCIAL' | 'OVERALL';
export type Trend = 'UP' | 'DOWN' | 'STABLE' | 'VOLATILE';
export type DataQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KPISnapshot {
  id: string;
  organization_id: string;
  snapshot_type: SnapshotType;
  snapshot_date: string;
  domain: KPIDomain;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  baseline_value: number | null;
  target_value: number | null;
  change_percent: number | null;
  trend: Trend | null;
  confidence: number;
  data_quality: DataQuality;
  horizon_plan_id: string | null;
  horizon_step_id: string | null;
  created_at: string;
}

export interface KPIDefinition {
  name: string;
  domain: KPIDomain;
  unit: string;
  direction: 'higher_better' | 'lower_better';
  weight: number;
}

export interface CreateSnapshotRequest {
  organization_id: string;
  snapshot_type: SnapshotType;
  domain: KPIDomain;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  baseline_value?: number;
  target_value?: number;
  confidence?: number;
  data_quality?: DataQuality;
  horizon_plan_id?: string;
  horizon_step_id?: string;
}

export interface KPITrend {
  metric_name: string;
  domain: KPIDomain;
  current_value: number;
  baseline_value: number;
  target_value: number;
  change_percent: number;
  trend: Trend;
  on_track: boolean;
  gap_to_target: number;
  projected_value: number;
  confidence: number;
}

export interface DomainKPISummary {
  domain: KPIDomain;
  metrics: KPITrend[];
  overall_score: number;
  health_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  improvement_areas: string[];
}

export interface KPIProjection {
  metric_name: string;
  domain: KPIDomain;
  current_value: number;
  projected_values: { day: number; value: number; confidence: number }[];
  target_value: number;
  days_to_target: number | null;
  will_meet_target: boolean;
}

// Standard KPI definitions by domain
const KPI_DEFINITIONS: KPIDefinition[] = [
  // SEO KPIs
  { name: 'organic_traffic', domain: 'SEO', unit: 'sessions', direction: 'higher_better', weight: 0.25 },
  { name: 'keyword_rankings', domain: 'SEO', unit: 'positions', direction: 'lower_better', weight: 0.20 },
  { name: 'domain_authority', domain: 'SEO', unit: 'score', direction: 'higher_better', weight: 0.15 },
  { name: 'backlinks', domain: 'SEO', unit: 'count', direction: 'higher_better', weight: 0.15 },
  { name: 'page_speed', domain: 'SEO', unit: 'score', direction: 'higher_better', weight: 0.10 },
  { name: 'indexed_pages', domain: 'SEO', unit: 'count', direction: 'higher_better', weight: 0.15 },

  // GEO KPIs
  { name: 'local_pack_rankings', domain: 'GEO', unit: 'positions', direction: 'lower_better', weight: 0.25 },
  { name: 'gmb_views', domain: 'GEO', unit: 'views', direction: 'higher_better', weight: 0.20 },
  { name: 'local_citations', domain: 'GEO', unit: 'count', direction: 'higher_better', weight: 0.20 },
  { name: 'review_count', domain: 'GEO', unit: 'count', direction: 'higher_better', weight: 0.15 },
  { name: 'review_rating', domain: 'GEO', unit: 'stars', direction: 'higher_better', weight: 0.20 },

  // Content KPIs
  { name: 'content_pieces', domain: 'CONTENT', unit: 'count', direction: 'higher_better', weight: 0.20 },
  { name: 'avg_time_on_page', domain: 'CONTENT', unit: 'seconds', direction: 'higher_better', weight: 0.25 },
  { name: 'bounce_rate', domain: 'CONTENT', unit: 'percent', direction: 'lower_better', weight: 0.20 },
  { name: 'pages_per_session', domain: 'CONTENT', unit: 'count', direction: 'higher_better', weight: 0.15 },
  { name: 'social_shares', domain: 'CONTENT', unit: 'count', direction: 'higher_better', weight: 0.20 },

  // Ads KPIs
  { name: 'ctr', domain: 'ADS', unit: 'percent', direction: 'higher_better', weight: 0.20 },
  { name: 'cpc', domain: 'ADS', unit: 'dollars', direction: 'lower_better', weight: 0.20 },
  { name: 'conversion_rate', domain: 'ADS', unit: 'percent', direction: 'higher_better', weight: 0.25 },
  { name: 'roas', domain: 'ADS', unit: 'ratio', direction: 'higher_better', weight: 0.25 },
  { name: 'quality_score', domain: 'ADS', unit: 'score', direction: 'higher_better', weight: 0.10 },

  // CRO KPIs
  { name: 'conversion_rate', domain: 'CRO', unit: 'percent', direction: 'higher_better', weight: 0.30 },
  { name: 'form_completion_rate', domain: 'CRO', unit: 'percent', direction: 'higher_better', weight: 0.20 },
  { name: 'cart_abandonment', domain: 'CRO', unit: 'percent', direction: 'lower_better', weight: 0.20 },
  { name: 'avg_order_value', domain: 'CRO', unit: 'dollars', direction: 'higher_better', weight: 0.15 },
  { name: 'revenue_per_visitor', domain: 'CRO', unit: 'dollars', direction: 'higher_better', weight: 0.15 },
];

export class KPITrackingService {
  /**
   * Create a KPI snapshot
   */
  async createSnapshot(request: CreateSnapshotRequest): Promise<KPISnapshot> {
    const supabase = await getSupabaseServer();

    // Calculate change percent if baseline provided
    let change_percent: number | null = null;
    let trend: Trend | null = null;

    if (request.baseline_value && request.baseline_value !== 0) {
      change_percent = ((request.metric_value - request.baseline_value) / request.baseline_value) * 100;
      trend = this.calculateTrend(change_percent);
    }

    const { data, error } = await supabase
      .from('kpi_snapshots')
      .insert({
        organization_id: request.organization_id,
        snapshot_type: request.snapshot_type,
        snapshot_date: new Date().toISOString(),
        domain: request.domain,
        metric_name: request.metric_name,
        metric_value: request.metric_value,
        metric_unit: request.metric_unit || null,
        baseline_value: request.baseline_value || null,
        target_value: request.target_value || null,
        change_percent,
        trend,
        confidence: request.confidence || 0.5,
        data_quality: request.data_quality || 'MEDIUM',
        horizon_plan_id: request.horizon_plan_id || null,
        horizon_step_id: request.horizon_step_id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create KPI snapshot: ${error.message}`);
    }

    return data;
  }

  /**
   * Batch create snapshots for all KPIs in a domain
   */
  async createDomainBaseline(
    organizationId: string,
    domain: KPIDomain,
    metrics: { name: string; value: number; unit?: string }[]
  ): Promise<KPISnapshot[]> {
    const snapshots: KPISnapshot[] = [];

    for (const metric of metrics) {
      const snapshot = await this.createSnapshot({
        organization_id: organizationId,
        snapshot_type: 'BASELINE',
        domain,
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        data_quality: 'HIGH',
      });
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  /**
   * Get latest KPI values for an organization
   */
  async getCurrentKPIs(
    organizationId: string,
    domain?: KPIDomain
  ): Promise<KPISnapshot[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('snapshot_type', 'CURRENT')
      .order('snapshot_date', { ascending: false });

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get current KPIs: ${error.message}`);
    }

    // Get only the most recent snapshot for each metric
    const latestByMetric = new Map<string, KPISnapshot>();
    for (const snapshot of data || []) {
      const key = `${snapshot.domain}-${snapshot.metric_name}`;
      if (!latestByMetric.has(key)) {
        latestByMetric.set(key, snapshot);
      }
    }

    return Array.from(latestByMetric.values());
  }

  /**
   * Get KPI trend analysis
   */
  async getKPITrends(
    organizationId: string,
    domain?: KPIDomain
  ): Promise<KPITrend[]> {
    const supabase = await getSupabaseServer();

    // Get baselines
    let baselineQuery = supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('snapshot_type', 'BASELINE');

    if (domain) {
      baselineQuery = baselineQuery.eq('domain', domain);
    }

    const { data: baselines } = await baselineQuery;

    // Get current values
    const currentKPIs = await this.getCurrentKPIs(organizationId, domain);

    // Get targets
    let targetQuery = supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('snapshot_type', 'TARGET');

    if (domain) {
      targetQuery = targetQuery.eq('domain', domain);
    }

    const { data: targets } = await targetQuery;

    // Build trend analysis
    const trends: KPITrend[] = [];

    for (const current of currentKPIs) {
      const baseline = baselines?.find(
        b => b.domain === current.domain && b.metric_name === current.metric_name
      );
      const target = targets?.find(
        t => t.domain === current.domain && t.metric_name === current.metric_name
      );

      const baselineValue = baseline?.metric_value || current.metric_value;
      const targetValue = target?.metric_value || current.metric_value * 1.2; // Default 20% improvement

      const changePercent = baselineValue !== 0
        ? ((current.metric_value - baselineValue) / baselineValue) * 100
        : 0;

      const gapToTarget = targetValue - current.metric_value;
      const definition = KPI_DEFINITIONS.find(
        d => d.name === current.metric_name && d.domain === current.domain
      );

      // Check if on track (simple linear projection)
      const onTrack = definition?.direction === 'lower_better'
        ? current.metric_value <= targetValue
        : current.metric_value >= targetValue * 0.8; // Within 80% of target

      // Project value (simple linear extrapolation)
      const projectedValue = current.metric_value + (current.metric_value - baselineValue);

      trends.push({
        metric_name: current.metric_name,
        domain: current.domain as KPIDomain,
        current_value: current.metric_value,
        baseline_value: baselineValue,
        target_value: targetValue,
        change_percent: changePercent,
        trend: this.calculateTrend(changePercent),
        on_track: onTrack,
        gap_to_target: gapToTarget,
        projected_value: projectedValue,
        confidence: current.confidence,
      });
    }

    return trends;
  }

  /**
   * Get domain-level KPI summary
   */
  async getDomainSummary(
    organizationId: string,
    domain: KPIDomain
  ): Promise<DomainKPISummary> {
    const trends = await this.getKPITrends(organizationId, domain);

    // Calculate overall score (0-100)
    let totalWeight = 0;
    let weightedScore = 0;

    for (const trend of trends) {
      const definition = KPI_DEFINITIONS.find(
        d => d.name === trend.metric_name && d.domain === domain
      );
      const weight = definition?.weight || 0.1;

      // Calculate metric score (0-100)
      let metricScore: number;
      if (trend.target_value === trend.baseline_value) {
        metricScore = 50;
      } else if (definition?.direction === 'lower_better') {
        metricScore = Math.max(0, Math.min(100,
          100 - ((trend.current_value - trend.target_value) / (trend.baseline_value - trend.target_value)) * 100
        ));
      } else {
        metricScore = Math.max(0, Math.min(100,
          ((trend.current_value - trend.baseline_value) / (trend.target_value - trend.baseline_value)) * 100
        ));
      }

      weightedScore += metricScore * weight;
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 50;

    // Determine health status
    let healthStatus: DomainKPISummary['health_status'];
    if (overallScore >= 80) healthStatus = 'EXCELLENT';
    else if (overallScore >= 60) healthStatus = 'GOOD';
    else if (overallScore >= 40) healthStatus = 'FAIR';
    else if (overallScore >= 20) healthStatus = 'POOR';
    else healthStatus = 'CRITICAL';

    // Identify improvement areas (metrics not on track)
    const improvementAreas = trends
      .filter(t => !t.on_track)
      .sort((a, b) => Math.abs(b.gap_to_target) - Math.abs(a.gap_to_target))
      .slice(0, 3)
      .map(t => t.metric_name);

    return {
      domain,
      metrics: trends,
      overall_score: overallScore,
      health_status: healthStatus,
      improvement_areas: improvementAreas,
    };
  }

  /**
   * Project KPIs forward in time
   */
  async projectKPIs(
    organizationId: string,
    domain: KPIDomain,
    days: number
  ): Promise<KPIProjection[]> {
    const supabase = await getSupabaseServer();

    // Get historical snapshots for trend calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historical } = await supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('domain', domain)
      .gte('snapshot_date', thirtyDaysAgo.toISOString())
      .order('snapshot_date', { ascending: true });

    // Get current and target values
    const trends = await this.getKPITrends(organizationId, domain);

    const projections: KPIProjection[] = [];

    for (const trend of trends) {
      // Calculate daily rate of change from historical data
      const metricHistory = historical?.filter(h => h.metric_name === trend.metric_name) || [];

      let dailyChange = 0;
      if (metricHistory.length >= 2) {
        const first = metricHistory[0];
        const last = metricHistory[metricHistory.length - 1];
        const daysDiff = Math.max(1,
          (new Date(last.snapshot_date).getTime() - new Date(first.snapshot_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        dailyChange = (last.metric_value - first.metric_value) / daysDiff;
      } else {
        // Estimate from current vs baseline
        dailyChange = (trend.current_value - trend.baseline_value) / 30;
      }

      // Generate projections
      const projectedValues: { day: number; value: number; confidence: number }[] = [];
      let currentValue = trend.current_value;

      for (let day = 1; day <= days; day++) {
        currentValue += dailyChange;
        // Confidence decreases with time
        const confidence = Math.max(0.1, 1 - (day / days) * 0.5);
        projectedValues.push({
          day,
          value: Math.max(0, currentValue),
          confidence,
        });
      }

      // Calculate days to target
      let daysToTarget: number | null = null;
      const definition = KPI_DEFINITIONS.find(
        d => d.name === trend.metric_name && d.domain === domain
      );

      if (dailyChange !== 0) {
        const gapToClose = trend.target_value - trend.current_value;
        if (definition?.direction === 'lower_better') {
          if (dailyChange < 0) {
            daysToTarget = Math.ceil(Math.abs(gapToClose / dailyChange));
          }
        } else {
          if (dailyChange > 0) {
            daysToTarget = Math.ceil(gapToClose / dailyChange);
          }
        }
      }

      const finalProjectedValue = projectedValues[projectedValues.length - 1]?.value || trend.current_value;
      const willMeetTarget = definition?.direction === 'lower_better'
        ? finalProjectedValue <= trend.target_value
        : finalProjectedValue >= trend.target_value;

      projections.push({
        metric_name: trend.metric_name,
        domain,
        current_value: trend.current_value,
        projected_values: projectedValues,
        target_value: trend.target_value,
        days_to_target: daysToTarget && daysToTarget <= days ? daysToTarget : null,
        will_meet_target: willMeetTarget,
      });
    }

    return projections;
  }

  /**
   * Record KPI snapshot for a horizon step
   */
  async recordStepKPI(
    organizationId: string,
    horizonPlanId: string,
    horizonStepId: string,
    metrics: { name: string; value: number; domain: KPIDomain; unit?: string }[]
  ): Promise<KPISnapshot[]> {
    const snapshots: KPISnapshot[] = [];

    for (const metric of metrics) {
      // Get baseline for comparison
      const supabase = await getSupabaseServer();
      const { data: baseline } = await supabase
        .from('kpi_snapshots')
        .select('metric_value')
        .eq('organization_id', organizationId)
        .eq('domain', metric.domain)
        .eq('metric_name', metric.name)
        .eq('snapshot_type', 'BASELINE')
        .single();

      const snapshot = await this.createSnapshot({
        organization_id: organizationId,
        snapshot_type: 'MILESTONE',
        domain: metric.domain,
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        baseline_value: baseline?.metric_value,
        horizon_plan_id: horizonPlanId,
        horizon_step_id: horizonStepId,
      });

      snapshots.push(snapshot);
    }

    return snapshots;
  }

  /**
   * Get KPI performance for a horizon plan
   */
  async getPlanKPIPerformance(planId: string): Promise<{
    plan_id: string;
    snapshots: KPISnapshot[];
    by_step: Map<string, KPISnapshot[]>;
    overall_improvement: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data: snapshots, error } = await supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('horizon_plan_id', planId)
      .order('snapshot_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get plan KPI performance: ${error.message}`);
    }

    // Group by step
    const byStep = new Map<string, KPISnapshot[]>();
    for (const snapshot of snapshots || []) {
      if (snapshot.horizon_step_id) {
        const existing = byStep.get(snapshot.horizon_step_id) || [];
        existing.push(snapshot);
        byStep.set(snapshot.horizon_step_id, existing);
      }
    }

    // Calculate overall improvement
    let totalImprovement = 0;
    let count = 0;

    for (const snapshot of snapshots || []) {
      if (snapshot.change_percent !== null) {
        totalImprovement += snapshot.change_percent;
        count++;
      }
    }

    return {
      plan_id: planId,
      snapshots: snapshots || [],
      by_step: byStep,
      overall_improvement: count > 0 ? totalImprovement / count : 0,
    };
  }

  /**
   * Calculate trend from change percentage
   */
  private calculateTrend(changePercent: number): Trend {
    if (changePercent > 5) return 'UP';
    if (changePercent < -5) return 'DOWN';
    return 'STABLE';
  }

  /**
   * Get KPI definitions for a domain
   */
  getKPIDefinitions(domain?: KPIDomain): KPIDefinition[] {
    if (domain) {
      return KPI_DEFINITIONS.filter(d => d.domain === domain);
    }
    return KPI_DEFINITIONS;
  }
}

export const kpiTrackingService = new KPITrackingService();
