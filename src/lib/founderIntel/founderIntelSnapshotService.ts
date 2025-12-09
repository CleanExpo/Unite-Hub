/**
 * Founder Intel Snapshot Service
 * Phase 80: CRUD operations for founder_intel_snapshots
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  FounderIntelSnapshot,
  CreateSnapshotInput,
  SnapshotFilters,
  AggregatedSignals,
  RiskLevel,
  OpportunityLevel,
} from './founderIntelTypes';

/**
 * Create a snapshot from aggregated signals
 */
export async function createSnapshotFromSignals(
  input: CreateSnapshotInput,
  signals: AggregatedSignals,
  summaryMarkdown: string,
  confidenceScore: number,
  completenessScore: number
): Promise<FounderIntelSnapshot | null> {
  const supabase = await getSupabaseServer();

  const riskLevel = calculateRiskLevel(signals);
  const opportunityLevel = calculateOpportunityLevel(signals);

  const { data, error } = await supabase
    .from('founder_intel_snapshots')
    .insert({
      scope: input.scope,
      client_id: input.client_id,
      title: input.title,
      summary_markdown: summaryMarkdown,
      intelligence_json: {
        signals: signals.signals,
        metrics: {
          agency_health: signals.agency_health.score,
          client_health: signals.client_health.score,
          creative_health: signals.creative_health.score,
          scaling_risk: signals.scaling_risk.score,
          orm_reality: signals.orm_reality.score,
          archive_completeness: signals.archive_completeness.score,
        },
        sources: signals.signals.map(s => s.engine),
        alerts_count: signals.alerts.length,
        opportunities_count: signals.opportunities.length,
      },
      risk_level: riskLevel,
      opportunity_level: opportunityLevel,
      confidence_score: confidenceScore,
      timeframe_start: input.timeframe_start,
      timeframe_end: input.timeframe_end,
      data_completeness_score: completenessScore,
      created_by_user_id: input.created_by_user_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create snapshot:', error);
    return null;
  }

  return data as FounderIntelSnapshot;
}

/**
 * Get recent snapshots with filters
 */
export async function getRecentSnapshots(
  filters: SnapshotFilters
): Promise<FounderIntelSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_intel_snapshots')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  if (filters.from) {
    query = query.gte('created_at', filters.from);
  }

  if (filters.to) {
    query = query.lte('created_at', filters.to);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get snapshots:', error);
    return [];
  }

  return data as FounderIntelSnapshot[];
}

/**
 * Get a single snapshot by ID
 */
export async function getSnapshotById(
  id: string
): Promise<FounderIntelSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_snapshots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to get snapshot:', error);
    return null;
  }

  return data as FounderIntelSnapshot;
}

/**
 * Calculate overall risk level from signals
 */
function calculateRiskLevel(signals: AggregatedSignals): RiskLevel {
  const criticalAlerts = signals.alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = signals.alerts.filter(a => a.severity === 'high').length;

  if (criticalAlerts > 0) {
return 'critical';
}
  if (highAlerts >= 3) {
return 'high';
}
  if (highAlerts >= 1) {
return 'medium';
}

  // Check health scores
  const scores = [
    signals.agency_health.score,
    signals.client_health.score,
    signals.creative_health.score,
    signals.scaling_risk.score,
    signals.orm_reality.score,
  ];

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avgScore < 40) {
return 'high';
}
  if (avgScore < 60) {
return 'medium';
}
  return 'low';
}

/**
 * Calculate opportunity level from signals
 */
function calculateOpportunityLevel(signals: AggregatedSignals): OpportunityLevel {
  const highOpportunities = signals.opportunities.filter(o => o.confidence >= 0.8).length;
  const mediumOpportunities = signals.opportunities.filter(o => o.confidence >= 0.6 && o.confidence < 0.8).length;

  if (highOpportunities >= 3) {
return 'high';
}
  if (highOpportunities >= 1 || mediumOpportunities >= 3) {
return 'medium';
}
  if (mediumOpportunities >= 1 || signals.opportunities.length > 0) {
return 'low';
}
  return 'none';
}

/**
 * Get snapshot count by scope
 */
export async function getSnapshotCountByScope(): Promise<Record<string, number>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_snapshots')
    .select('scope');

  if (error || !data) {
    return { global: 0, client: 0, cohort: 0, segment: 0 };
  }

  const counts: Record<string, number> = { global: 0, client: 0, cohort: 0, segment: 0 };
  data.forEach(item => {
    counts[item.scope] = (counts[item.scope] || 0) + 1;
  });

  return counts;
}
