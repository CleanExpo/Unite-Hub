/**
 * Region Scaling Service
 * Phase 92: Compute region capacity and pressure metrics
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  RegionScalingState,
  RegionScalingSummary,
  ScalingMode
} from './globalScalingTypes';

/**
 * Compute overall capacity score for a region
 * Based on active jobs, budget remaining, and system health
 */
export async function computeRegionCapacity(regionId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('*')
    .eq('region_id', regionId)
    .single();

  if (!state) {
    return 100; // Default to full capacity if no state
  }

  // Factors that reduce capacity
  const budgetFactor = state.ai_budget_remaining / Math.max(state.ai_budget_monthly, 1);
  const pressureFactor = 1 - (
    state.posting_pressure * 0.3 +
    state.orchestration_pressure * 0.25 +
    state.creative_pressure * 0.25 +
    state.intel_pressure * 0.2
  ) / 100;
  const fatigueFactor = 1 - (state.fatigue_score / 100);

  // Weighted capacity
  const capacity = (
    budgetFactor * 0.4 +
    pressureFactor * 0.35 +
    fatigueFactor * 0.25
  ) * 100;

  return Math.round(Math.max(0, Math.min(100, capacity)) * 100) / 100;
}

/**
 * Compute overall pressure score for a region
 */
export async function computePressure(regionId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('compute_region_pressure', {
    p_region_id: regionId
  });

  return data || 0;
}

/**
 * Generate a snapshot of current region state
 */
export async function generateRegionSnapshot(
  regionId: string
): Promise<Record<string, unknown>> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('*')
    .eq('region_id', regionId)
    .single();

  if (!state) {
    return {};
  }

  const capacity = await computeRegionCapacity(regionId);
  const pressure = await computePressure(regionId);

  return {
    timestamp: new Date().toISOString(),
    regionId,
    state: {
      scalingMode: state.scaling_mode,
      capacityScore: capacity,
      overallPressure: pressure,
      warningIndex: state.warning_index,
      fatigueScore: state.fatigue_score,
    },
    pressures: {
      posting: state.posting_pressure,
      orchestration: state.orchestration_pressure,
      creative: state.creative_pressure,
      intel: state.intel_pressure,
    },
    budget: {
      monthly: state.ai_budget_monthly,
      remaining: state.ai_budget_remaining,
      spentToday: state.ai_spend_today,
    },
    utilization: {
      activeAgencies: state.active_agencies,
      activeClients: state.active_clients,
      jobsInQueue: state.jobs_in_queue,
    },
  };
}

/**
 * Save a snapshot to history
 */
export async function saveRegionSnapshot(
  regionId: string,
  periodType: 'hourly' | 'daily' | 'weekly' = 'hourly'
): Promise<void> {
  const supabase = await getSupabaseServer();

  const snapshot = await generateRegionSnapshot(regionId);
  const state = snapshot.state as any;

  await supabase.from('region_scaling_history').insert({
    region_id: regionId,
    snapshot,
    period_type: periodType,
    avg_capacity: state?.capacityScore,
    peak_pressure: state?.overallPressure,
    budget_used: (snapshot.budget as any)?.spentToday,
  });
}

/**
 * Update scaling mode based on current metrics
 */
export async function updateScalingMode(regionId: string): Promise<ScalingMode> {
  const supabase = await getSupabaseServer();

  const capacity = await computeRegionCapacity(regionId);
  const pressure = await computePressure(regionId);

  let newMode: ScalingMode = 'normal';

  if (capacity < 10 || pressure > 90) {
    newMode = 'frozen';
  } else if (capacity < 30 || pressure > 75) {
    newMode = 'throttled';
  } else if (capacity < 50 || pressure > 60) {
    newMode = 'cautious';
  }

  await supabase
    .from('region_scaling_state')
    .update({
      scaling_mode: newMode,
      capacity_score: capacity,
      updated_at: new Date().toISOString(),
    })
    .eq('region_id', regionId);

  return newMode;
}

/**
 * Get region scaling summary
 */
export async function getRegionScalingSummary(
  regionId: string
): Promise<RegionScalingSummary | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_region_scaling_summary', {
    p_region_id: regionId
  });

  if (!data) {
    return null;
  }

  return {
    regionId: data.region_id,
    scalingMode: data.scaling_mode,
    capacityScore: data.capacity_score,
    warningIndex: data.warning_index,
    pressures: data.pressures,
    budget: data.budget,
    utilization: data.utilization,
    updatedAt: data.updated_at,
  };
}

/**
 * Update pressure scores based on job activity
 */
export async function updatePressureScores(
  regionId: string,
  activity: {
    postingJobs?: number;
    orchestrationJobs?: number;
    creativeJobs?: number;
    intelJobs?: number;
  }
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get current state
  const { data: current } = await supabase
    .from('region_scaling_state')
    .select('*')
    .eq('region_id', regionId)
    .single();

  if (!current) return;

  // Calculate new pressures (simple moving average)
  const alpha = 0.3; // Smoothing factor
  const updates: Record<string, number> = {};

  if (activity.postingJobs !== undefined) {
    updates.posting_pressure = Math.min(100,
      current.posting_pressure * (1 - alpha) + (activity.postingJobs * 10) * alpha
    );
  }
  if (activity.orchestrationJobs !== undefined) {
    updates.orchestration_pressure = Math.min(100,
      current.orchestration_pressure * (1 - alpha) + (activity.orchestrationJobs * 10) * alpha
    );
  }
  if (activity.creativeJobs !== undefined) {
    updates.creative_pressure = Math.min(100,
      current.creative_pressure * (1 - alpha) + (activity.creativeJobs * 10) * alpha
    );
  }
  if (activity.intelJobs !== undefined) {
    updates.intel_pressure = Math.min(100,
      current.intel_pressure * (1 - alpha) + (activity.intelJobs * 10) * alpha
    );
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('region_scaling_state')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('region_id', regionId);
  }
}
