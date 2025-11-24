/**
 * Region Shard Router
 * Phase 92: Route jobs to appropriate region shards
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { JobRoutingResult, ScalingMode } from './globalScalingTypes';
import { resolveRegionForAgency } from './regionContextResolver';
import { checkBudget } from './regionAIBudgetAllocator';

interface RoutingOptions {
  priority?: number;
  estimatedCost?: number;
  allowFallback?: boolean;
}

/**
 * Route a posting job to appropriate shard
 */
export async function routePostingJob(
  tenantId: string,
  regionId?: string,
  options: RoutingOptions = {}
): Promise<JobRoutingResult | null> {
  const supabase = await getSupabaseServer();

  // Resolve region if not provided
  const resolvedRegion = regionId || await resolveRegionForAgency(tenantId);
  if (!resolvedRegion) {
    return null;
  }

  // Get region state
  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('scaling_mode, jobs_in_queue, posting_pressure')
    .eq('region_id', resolvedRegion)
    .single();

  if (!state) {
    return null;
  }

  // Check if region can accept jobs
  if (state.scaling_mode === 'frozen') {
    if (!options.allowFallback) {
      return null;
    }
    // Could implement fallback to another region here
  }

  // Check budget if cost provided
  if (options.estimatedCost) {
    const budgetCheck = await checkBudget(resolvedRegion, options.estimatedCost);
    if (!budgetCheck.allowed) {
      return null;
    }
  }

  // Calculate priority based on pressure
  const basePriority = options.priority || 5;
  const pressureAdjustment = Math.floor(state.posting_pressure / 20);
  const adjustedPriority = Math.max(1, basePriority - pressureAdjustment);

  // Estimate wait time
  const estimatedWait = state.jobs_in_queue * 2; // 2 seconds per job

  return {
    regionId: resolvedRegion,
    shardKey: `posting:${resolvedRegion}`,
    priority: adjustedPriority,
    estimatedWait,
    scalingMode: state.scaling_mode as ScalingMode,
  };
}

/**
 * Route an orchestration job
 */
export async function routeOrchestrationJob(
  regionId: string,
  options: RoutingOptions = {}
): Promise<JobRoutingResult | null> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('scaling_mode, jobs_in_queue, orchestration_pressure')
    .eq('region_id', regionId)
    .single();

  if (!state || state.scaling_mode === 'frozen') {
    return null;
  }

  // Orchestration jobs are higher priority
  const basePriority = options.priority || 7;
  const pressureAdjustment = Math.floor(state.orchestration_pressure / 25);
  const adjustedPriority = Math.max(1, basePriority - pressureAdjustment);

  return {
    regionId,
    shardKey: `orchestration:${regionId}`,
    priority: adjustedPriority,
    estimatedWait: state.jobs_in_queue * 3,
    scalingMode: state.scaling_mode as ScalingMode,
  };
}

/**
 * Route a creative job
 */
export async function routeCreativeJob(
  regionId: string,
  options: RoutingOptions = {}
): Promise<JobRoutingResult | null> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('scaling_mode, jobs_in_queue, creative_pressure')
    .eq('region_id', regionId)
    .single();

  if (!state) {
    return null;
  }

  // Creative jobs blocked in throttled mode
  if (state.scaling_mode === 'frozen' || state.scaling_mode === 'throttled') {
    return null;
  }

  const basePriority = options.priority || 4;
  const pressureAdjustment = Math.floor(state.creative_pressure / 20);
  const adjustedPriority = Math.max(1, basePriority - pressureAdjustment);

  return {
    regionId,
    shardKey: `creative:${regionId}`,
    priority: adjustedPriority,
    estimatedWait: state.jobs_in_queue * 5, // Creative jobs take longer
    scalingMode: state.scaling_mode as ScalingMode,
  };
}

/**
 * Route a performance/intel job
 */
export async function routePerformanceJob(
  regionId: string,
  options: RoutingOptions = {}
): Promise<JobRoutingResult | null> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('scaling_mode, jobs_in_queue, intel_pressure')
    .eq('region_id', regionId)
    .single();

  if (!state || state.scaling_mode === 'frozen') {
    return null;
  }

  // Performance jobs are lower priority but still allowed in cautious mode
  const basePriority = options.priority || 3;
  const pressureAdjustment = Math.floor(state.intel_pressure / 30);
  const adjustedPriority = Math.max(1, basePriority - pressureAdjustment);

  return {
    regionId,
    shardKey: `intel:${regionId}`,
    priority: adjustedPriority,
    estimatedWait: state.jobs_in_queue * 4,
    scalingMode: state.scaling_mode as ScalingMode,
  };
}

/**
 * Get best available region for a job type
 */
export async function getBestRegionForJob(
  jobType: 'posting' | 'orchestration' | 'creative' | 'intel',
  preferredRegion?: string
): Promise<string | null> {
  const supabase = await getSupabaseServer();

  // Get all active regions sorted by capacity
  const { data: regions } = await supabase
    .from('region_scaling_state')
    .select(`
      region_id,
      scaling_mode,
      capacity_score,
      posting_pressure,
      orchestration_pressure,
      creative_pressure,
      intel_pressure
    `)
    .in('scaling_mode', ['normal', 'cautious'])
    .order('capacity_score', { ascending: false });

  if (!regions || regions.length === 0) {
    return null;
  }

  // If preferred region is available and healthy, use it
  if (preferredRegion) {
    const preferred = regions.find(r => r.region_id === preferredRegion);
    if (preferred && preferred.capacity_score > 30) {
      return preferred.region_id;
    }
  }

  // Select based on lowest pressure for job type
  const pressureKey = {
    posting: 'posting_pressure',
    orchestration: 'orchestration_pressure',
    creative: 'creative_pressure',
    intel: 'intel_pressure',
  }[jobType];

  regions.sort((a, b) => (a as any)[pressureKey] - (b as any)[pressureKey]);

  return regions[0]?.region_id || null;
}

/**
 * Update job queue count for a region
 */
export async function updateJobQueue(
  regionId: string,
  delta: number
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { data: current } = await supabase
    .from('region_scaling_state')
    .select('jobs_in_queue')
    .eq('region_id', regionId)
    .single();

  if (current) {
    await supabase
      .from('region_scaling_state')
      .update({
        jobs_in_queue: Math.max(0, current.jobs_in_queue + delta),
        updated_at: new Date().toISOString(),
      })
      .eq('region_id', regionId);
  }
}
