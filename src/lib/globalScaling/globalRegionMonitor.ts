/**
 * Global Region Monitor
 * Phase 92: Monitor health across all regions and detect conflicts
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  RegionHealthSummary,
  CrossRegionConflict,
  GlobalRiskAssessment,
} from './globalScalingTypes';

/**
 * List health status of all regions
 */
export async function listRegionHealth(): Promise<RegionHealthSummary[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_all_regions_health');

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    regionId: row.region_id,
    regionName: row.region_name,
    scalingMode: row.scaling_mode,
    capacityScore: row.capacity_score,
    overallPressure: row.overall_pressure,
    budgetPercentRemaining: row.budget_percent_remaining,
    warningIndex: row.warning_index,
  }));
}

/**
 * Detect conflicts and issues across regions
 */
export async function detectCrossRegionConflicts(): Promise<CrossRegionConflict[]> {
  const supabase = await getSupabaseServer();
  const conflicts: CrossRegionConflict[] = [];

  // Get all region states
  const { data: states } = await supabase
    .from('region_scaling_state')
    .select(`
      *,
      regions (name)
    `);

  if (!states) return conflicts;

  const now = new Date().toISOString();

  for (const state of states) {
    const regionName = (state.regions as any)?.name || 'Unknown';

    // Check for frozen regions
    if (state.scaling_mode === 'frozen') {
      conflicts.push({
        type: 'mode_frozen',
        regionId: state.region_id,
        regionName,
        severity: 'critical',
        message: `Region ${regionName} is frozen and not accepting jobs`,
        detectedAt: now,
      });
    }

    // Check for critical capacity
    if (state.capacity_score < 20) {
      conflicts.push({
        type: 'capacity_critical',
        regionId: state.region_id,
        regionName,
        severity: 'critical',
        message: `Region ${regionName} capacity critically low at ${state.capacity_score}%`,
        detectedAt: now,
      });
    } else if (state.capacity_score < 40) {
      conflicts.push({
        type: 'capacity_critical',
        regionId: state.region_id,
        regionName,
        severity: 'warning',
        message: `Region ${regionName} capacity low at ${state.capacity_score}%`,
        detectedAt: now,
      });
    }

    // Check for budget issues
    const budgetPercent = (state.ai_budget_remaining / state.ai_budget_monthly) * 100;
    if (budgetPercent < 10) {
      conflicts.push({
        type: 'budget_exceeded',
        regionId: state.region_id,
        regionName,
        severity: 'critical',
        message: `Region ${regionName} budget critically low at ${budgetPercent.toFixed(1)}%`,
        detectedAt: now,
      });
    } else if (budgetPercent < 25) {
      conflicts.push({
        type: 'budget_exceeded',
        regionId: state.region_id,
        regionName,
        severity: 'warning',
        message: `Region ${regionName} budget low at ${budgetPercent.toFixed(1)}%`,
        detectedAt: now,
      });
    }
  }

  return conflicts;
}

/**
 * Compute global risk assessment across all regions
 */
export async function computeGlobalRisk(): Promise<GlobalRiskAssessment> {
  const conflicts = await detectCrossRegionConflicts();
  const health = await listRegionHealth();

  // Calculate overall risk score
  let riskScore = 0;

  // Add risk from conflicts
  conflicts.forEach(conflict => {
    if (conflict.severity === 'critical') {
      riskScore += 20;
    } else {
      riskScore += 10;
    }
  });

  // Add risk from low capacity regions
  health.forEach(region => {
    if (region.capacityScore < 30) {
      riskScore += 15;
    } else if (region.capacityScore < 50) {
      riskScore += 5;
    }
  });

  // Add risk from frozen regions
  const frozenCount = health.filter(r => r.scalingMode === 'frozen').length;
  riskScore += frozenCount * 25;

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 25) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (frozenCount > 0) {
    recommendations.push(`${frozenCount} region(s) frozen - investigate and restore`);
  }

  const lowBudgetRegions = health.filter(r => r.budgetPercentRemaining < 25);
  if (lowBudgetRegions.length > 0) {
    recommendations.push(`${lowBudgetRegions.length} region(s) have low AI budget - consider reallocation`);
  }

  const highPressureRegions = health.filter(r => r.overallPressure > 70);
  if (highPressureRegions.length > 0) {
    recommendations.push(`${highPressureRegions.length} region(s) under high pressure - distribute load`);
  }

  const lowCapacityRegions = health.filter(r => r.capacityScore < 40);
  if (lowCapacityRegions.length > 0) {
    recommendations.push(`${lowCapacityRegions.length} region(s) at low capacity - scale resources`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All regions operating normally');
  }

  return {
    overallRisk: riskScore,
    riskLevel,
    conflicts,
    recommendations,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Get historical health trends for a region
 */
export async function getRegionHealthTrend(
  regionId: string,
  periods: number = 24
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('region_scaling_history')
    .select('created_at, snapshot, avg_capacity, peak_pressure')
    .eq('region_id', regionId)
    .order('created_at', { ascending: false })
    .limit(periods);

  return data || [];
}

/**
 * Get regions sorted by a specific metric
 */
export async function getRegionsByMetric(
  metric: 'capacity' | 'pressure' | 'budget' | 'warning',
  order: 'asc' | 'desc' = 'desc'
): Promise<RegionHealthSummary[]> {
  const health = await listRegionHealth();

  const sortKey = {
    capacity: 'capacityScore',
    pressure: 'overallPressure',
    budget: 'budgetPercentRemaining',
    warning: 'warningIndex',
  }[metric] as keyof RegionHealthSummary;

  health.sort((a, b) => {
    const aVal = a[sortKey] as number;
    const bVal = b[sortKey] as number;
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return health;
}

/**
 * Send alert for critical region issues
 */
export async function alertCriticalIssues(): Promise<void> {
  const assessment = await computeGlobalRisk();

  if (assessment.riskLevel === 'critical') {
    // In production, this would send notifications
    console.error('[GRSE] CRITICAL RISK DETECTED:', {
      score: assessment.overallRisk,
      conflicts: assessment.conflicts.length,
      recommendations: assessment.recommendations,
    });
  }
}
