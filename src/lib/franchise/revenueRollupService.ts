/**
 * Revenue Rollup Service
 * Phase 91: Aggregate metrics for parent agencies
 */

import { getSupabaseServer } from '@/lib/supabase';
import { FranchiseMetrics, FranchiseRollup } from './franchiseTypes';

/**
 * Compute revenue for agency
 */
export async function computeRevenueForAgency(
  agencyId: string,
  periodStart: string,
  periodEnd: string
): Promise<FranchiseMetrics | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('franchise_metrics')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .single();

  if (!data) return null;

  return mapToMetrics(data);
}

/**
 * Compute client growth for agency
 */
export async function computeClientGrowth(
  agencyId: string,
  periods: number = 6
): Promise<{ period: string; clients: number; growth: number }[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('franchise_metrics')
    .select('period_start, total_clients, new_clients, churned_clients')
    .eq('agency_id', agencyId)
    .order('period_start', { ascending: false })
    .limit(periods);

  if (!data) return [];

  return data.reverse().map((row, index, arr) => {
    const prev = index > 0 ? arr[index - 1].total_clients : row.total_clients;
    const growth = prev > 0 ? ((row.total_clients - prev) / prev) * 100 : 0;

    return {
      period: row.period_start,
      clients: row.total_clients,
      growth: Math.round(growth * 10) / 10,
    };
  });
}

/**
 * Roll up metrics to parent agency
 */
export async function rollUpToParent(
  parentAgencyId: string,
  periodStart: string,
  periodEnd: string
): Promise<FranchiseRollup> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('rollup_franchise_metrics', {
    p_parent_id: parentAgencyId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });

  if (!data) {
    return {
      totalAgencies: 0,
      totalClients: 0,
      totalRevenue: 0,
      avgHealth: 0,
    };
  }

  return {
    totalAgencies: data.total_agencies,
    totalClients: data.total_clients,
    totalRevenue: data.total_revenue,
    avgHealth: data.avg_health,
  };
}

/**
 * Record metrics for agency
 */
export async function recordMetrics(
  agencyId: string,
  periodStart: string,
  periodEnd: string,
  metrics: Partial<FranchiseMetrics>
): Promise<FranchiseMetrics> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('franchise_metrics')
    .upsert({
      agency_id: agencyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_clients: metrics.totalClients || 0,
      active_clients: metrics.activeClients || 0,
      new_clients: metrics.newClients || 0,
      churned_clients: metrics.churnedClients || 0,
      gross_revenue: metrics.grossRevenue || 0,
      net_revenue: metrics.netRevenue || 0,
      mrr: metrics.mrr || 0,
      avg_client_health: metrics.avgClientHealth,
      avg_campaign_performance: metrics.avgCampaignPerformance,
      total_posts: metrics.totalPosts || 0,
      total_engagements: metrics.totalEngagements || 0,
      metadata: metrics.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record metrics: ${error.message}`);
  }

  return mapToMetrics(data);
}

/**
 * Get metrics history for agency
 */
export async function getMetricsHistory(
  agencyId: string,
  periods: number = 12
): Promise<FranchiseMetrics[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('franchise_metrics')
    .select('*')
    .eq('agency_id', agencyId)
    .order('period_start', { ascending: false })
    .limit(periods);

  if (error) {
    console.error('Failed to get metrics history:', error);
    return [];
  }

  return (data || []).map(mapToMetrics).reverse();
}

/**
 * Compare metrics between periods
 */
export async function compareMetrics(
  agencyId: string,
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): Promise<{
  period1: FranchiseMetrics | null;
  period2: FranchiseMetrics | null;
  changes: Record<string, number>;
}> {
  const [period1, period2] = await Promise.all([
    computeRevenueForAgency(agencyId, period1Start, period1End),
    computeRevenueForAgency(agencyId, period2Start, period2End),
  ]);

  const changes: Record<string, number> = {};

  if (period1 && period2) {
    changes.clientGrowth = period2.totalClients - period1.totalClients;
    changes.revenueGrowth = period2.grossRevenue - period1.grossRevenue;
    changes.mrrGrowth = period2.mrr - period1.mrr;
    changes.healthChange = (period2.avgClientHealth || 0) - (period1.avgClientHealth || 0);
  }

  return { period1, period2, changes };
}

// Helper
function mapToMetrics(row: any): FranchiseMetrics {
  return {
    id: row.id,
    createdAt: row.created_at,
    agencyId: row.agency_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalClients: row.total_clients,
    activeClients: row.active_clients,
    newClients: row.new_clients,
    churnedClients: row.churned_clients,
    grossRevenue: row.gross_revenue,
    netRevenue: row.net_revenue,
    mrr: row.mrr,
    avgClientHealth: row.avg_client_health ? parseFloat(row.avg_client_health) : undefined,
    avgCampaignPerformance: row.avg_campaign_performance ? parseFloat(row.avg_campaign_performance) : undefined,
    totalPosts: row.total_posts,
    totalEngagements: row.total_engagements,
    metadata: row.metadata,
  };
}
