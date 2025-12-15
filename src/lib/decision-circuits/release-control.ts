/**
 * Decision Circuits Release Control v1.2.0
 * Autonomous canary rollout with continuous validation and automatic rollback
 */

import { createClient } from '@/lib/supabase/server';
import { checkProductionHealth } from './enforcement';

export type CanaryPhase = 'canary_10' | 'canary_50' | 'full_release';

export interface CanaryConfiguration {
  phase: CanaryPhase;
  traffic_percent: number;
  min_duration_hours: number;
  health_requirements: string[];
}

export const CANARY_PHASES: Record<CanaryPhase, CanaryConfiguration> = {
  canary_10: {
    phase: 'canary_10',
    traffic_percent: 10,
    min_duration_hours: 24,
    health_requirements: ['DC_HEALTH_01', 'DC_HEALTH_02', 'DC_HEALTH_03'],
  },
  canary_50: {
    phase: 'canary_50',
    traffic_percent: 50,
    min_duration_hours: 24,
    health_requirements: ['DC_HEALTH_01', 'DC_HEALTH_02', 'DC_HEALTH_03'],
  },
  full_release: {
    phase: 'full_release',
    traffic_percent: 100,
    health_requirements: ['DC_HEALTH_01', 'DC_HEALTH_02', 'DC_HEALTH_03'],
  },
};

export interface RollbackTrigger {
  metric: string;
  condition: 'below_threshold' | 'exceeds_cycles' | 'violation_spike';
  action: 'rollback_to_previous_circuit_version' | 'freeze_self_correction_and_rollback' | 'rollback_and_tighten_constraints';
}

export const ROLLBACK_TRIGGERS: RollbackTrigger[] = [
  {
    metric: 'DC_HEALTH_01',
    condition: 'below_threshold',
    action: 'rollback_to_previous_circuit_version',
  },
  {
    metric: 'DC_HEALTH_02',
    condition: 'exceeds_cycles',
    action: 'freeze_self_correction_and_rollback',
  },
  {
    metric: 'DC_HEALTH_03',
    condition: 'violation_spike',
    action: 'rollback_and_tighten_constraints',
  },
];

export interface CircuitVersion {
  version_id: string;
  circuit_id: string;
  workspace_id: string;
  version_number: number;
  released_at: string;
  is_active: boolean;
  is_canary: boolean;
  canary_phase?: CanaryPhase;
  traffic_percent: number;
  health_score: number;
  rollback_available: boolean;
  created_at: string;
}

export interface ReleaseState {
  workspace_id: string;
  current_phase: CanaryPhase;
  current_version_id: string;
  previous_version_id?: string;
  phase_started_at: string;
  min_phase_duration_hours: number;
  ready_for_next_phase: boolean;
  health_checks_passing: boolean;
  can_rollback: boolean;
}

export interface RollbackEvent {
  workspace_id: string;
  rollback_id: string;
  from_version_id: string;
  to_version_id: string;
  trigger: RollbackTrigger;
  reason: string;
  executed_at: string;
  success: boolean;
  reverted_at?: string;
}

/**
 * Create a new circuit version (immutable)
 */
export async function createCircuitVersion(
  workspace_id: string,
  circuit_id: string,
  version_number: number
): Promise<CircuitVersion> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const version_id = `v${version_number}_${circuit_id}_${Date.now()}`;

  const { data, error } = await supabase
    .from('circuit_versions')
    .insert({
      version_id,
      circuit_id,
      workspace_id,
      version_number,
      released_at: now,
      is_active: false,
      is_canary: false,
      traffic_percent: 0,
      health_score: 0,
      rollback_available: false,
      created_at: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create circuit version: ${error.message}`);
  }

  return data as CircuitVersion;
}

/**
 * Get current release state for workspace
 */
export async function getReleaseState(
  workspace_id: string
): Promise<ReleaseState> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('circuit_release_state')
    .select('*')
    .eq('workspace_id', workspace_id)
    .single();

  if (error) {
    // Initialize default state
    const now = new Date().toISOString();
    return {
      workspace_id,
      current_phase: 'canary_10',
      current_version_id: 'v1_default',
      phase_started_at: now,
      min_phase_duration_hours: 24,
      ready_for_next_phase: false,
      health_checks_passing: false,
      can_rollback: false,
    };
  }

  return data as ReleaseState;
}

/**
 * Update release state
 */
export async function updateReleaseState(
  workspace_id: string,
  updates: Partial<ReleaseState>
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('circuit_release_state')
    .upsert(
      {
        workspace_id,
        ...updates,
      },
      { onConflict: 'workspace_id' }
    );

  if (error) {
    throw new Error(`Failed to update release state: ${error.message}`);
  }
}

/**
 * Start canary rollout (10% traffic)
 */
export async function startCanaryRollout(
  workspace_id: string,
  new_version_id: string
): Promise<{
  success: boolean;
  phase: CanaryPhase;
  message: string;
}> {
  const supabase = createClient();
  const phase: CanaryPhase = 'canary_10';
  const config = CANARY_PHASES[phase];

  try {
    // Update version to canary
    await supabase
      .from('circuit_versions')
      .update({
        is_canary: true,
        canary_phase: phase,
        traffic_percent: config.traffic_percent,
      })
      .eq('version_id', new_version_id)
      .eq('workspace_id', workspace_id);

    // Update release state
    const previousState = await getReleaseState(workspace_id);
    await updateReleaseState(workspace_id, {
      current_phase: phase,
      current_version_id: new_version_id,
      previous_version_id: previousState.current_version_id,
      phase_started_at: new Date().toISOString(),
      min_phase_duration_hours: config.min_duration_hours,
      ready_for_next_phase: false,
    });

    // Log release event
    await supabase.from('circuit_release_events').insert({
      workspace_id,
      event_type: 'canary_started',
      version_id: new_version_id,
      phase,
      traffic_percent: config.traffic_percent,
      details: { previous_version_id: previousState.current_version_id },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      phase,
      message: `Canary rollout started: 10% traffic to ${new_version_id}`,
    };
  } catch (error) {
    return {
      success: false,
      phase,
      message: `Canary rollout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Progress canary to next phase
 */
export async function progressCanaryPhase(
  workspace_id: string
): Promise<{
  success: boolean;
  new_phase?: CanaryPhase;
  message: string;
}> {
  const supabase = createClient();
  const state = await getReleaseState(workspace_id);
  const health = await checkProductionHealth(workspace_id);

  // Verify health checks pass
  if (!health.healthy) {
    return {
      success: false,
      message: 'Cannot progress: Health checks failing',
    };
  }

  // Verify minimum phase duration elapsed
  const phaseStarted = new Date(state.phase_started_at);
  const now = new Date();
  const hoursElapsed =
    (now.getTime() - phaseStarted.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < state.min_phase_duration_hours) {
    return {
      success: false,
      message: `Cannot progress: Minimum ${state.min_phase_duration_hours}h duration not met (${hoursElapsed.toFixed(1)}h elapsed)`,
    };
  }

  // Determine next phase
  let nextPhase: CanaryPhase | null = null;
  if (state.current_phase === 'canary_10') {
    nextPhase = 'canary_50';
  } else if (state.current_phase === 'canary_50') {
    nextPhase = 'full_release';
  }

  if (!nextPhase) {
    return {
      success: false,
      message: 'Already at full release',
    };
  }

  const nextConfig = CANARY_PHASES[nextPhase];

  try {
    // Update version
    await supabase
      .from('circuit_versions')
      .update({
        canary_phase: nextPhase,
        traffic_percent: nextConfig.traffic_percent,
      })
      .eq('version_id', state.current_version_id)
      .eq('workspace_id', workspace_id);

    // Update release state
    await updateReleaseState(workspace_id, {
      current_phase: nextPhase,
      phase_started_at: new Date().toISOString(),
      min_phase_duration_hours: nextConfig.min_duration_hours,
      ready_for_next_phase: false,
    });

    // Log event
    await supabase.from('circuit_release_events').insert({
      workspace_id,
      event_type: 'canary_progressed',
      version_id: state.current_version_id,
      phase: nextPhase,
      traffic_percent: nextConfig.traffic_percent,
      details: { previous_phase: state.current_phase },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      new_phase: nextPhase,
      message: `Progressed to ${nextPhase}: ${nextConfig.traffic_percent}% traffic`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Phase progression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if automatic rollback should trigger
 */
export async function evaluateRollbackTriggers(
  workspace_id: string
): Promise<{
  should_rollback: boolean;
  trigger?: RollbackTrigger;
  reason?: string;
}> {
  const health = await checkProductionHealth(workspace_id);

  for (const trigger of ROLLBACK_TRIGGERS) {
    const check = health.checks.find((c) => c.check_id === trigger.metric);

    if (!check) {
continue;
}

    if (trigger.condition === 'below_threshold' && !check.passed) {
      return {
        should_rollback: true,
        trigger,
        reason: `${trigger.metric} failed: ${check.value} < ${check.threshold}`,
      };
    }

    if (
      trigger.condition === 'exceeds_cycles' &&
      typeof check.value === 'number' &&
      typeof check.threshold === 'number' &&
      check.value > check.threshold
    ) {
      return {
        should_rollback: true,
        trigger,
        reason: `${trigger.metric} exceeded: ${check.value} > ${check.threshold}`,
      };
    }

    if (
      trigger.condition === 'violation_spike' &&
      typeof check.value === 'number' &&
      check.value > 0.02 // 2% spike from 1% threshold
    ) {
      return {
        should_rollback: true,
        trigger,
        reason: `${trigger.metric} spike detected: ${(check.value * 100).toFixed(2)}%`,
      };
    }
  }

  return { should_rollback: false };
}

/**
 * Execute automatic rollback
 */
export async function executeAutomaticRollback(
  workspace_id: string,
  trigger: RollbackTrigger,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  rollback_event_id?: string;
}> {
  const supabase = createClient();
  const state = await getReleaseState(workspace_id);

  if (!state.previous_version_id) {
    return {
      success: false,
      message: 'No previous version available for rollback',
    };
  }

  const rollback_id = `rollback_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // Deactivate current version
    await supabase
      .from('circuit_versions')
      .update({
        is_active: false,
        is_canary: false,
        traffic_percent: 0,
      })
      .eq('version_id', state.current_version_id)
      .eq('workspace_id', workspace_id);

    // Activate previous version
    await supabase
      .from('circuit_versions')
      .update({
        is_active: true,
        is_canary: false,
        traffic_percent: 100,
      })
      .eq('version_id', state.previous_version_id)
      .eq('workspace_id', workspace_id);

    // Log rollback event
    const now = new Date().toISOString();
    await supabase.from('circuit_rollback_events').insert({
      workspace_id,
      rollback_id,
      from_version_id: state.current_version_id,
      to_version_id: state.previous_version_id,
      trigger: trigger.metric,
      reason,
      executed_at: now,
      success: true,
    });

    // Update release state
    await updateReleaseState(workspace_id, {
      current_version_id: state.previous_version_id,
      current_phase: 'canary_10',
      previous_version_id: state.current_version_id,
      phase_started_at: now,
      ready_for_next_phase: false,
      can_rollback: false,
    });

    // Log to release events
    await supabase.from('circuit_release_events').insert({
      workspace_id,
      event_type: 'automatic_rollback',
      version_id: state.current_version_id,
      phase: 'canary_10',
      details: {
        trigger: trigger.metric,
        reason,
        rolled_back_to: state.previous_version_id,
      },
      created_at: now,
    });

    return {
      success: true,
      message: `Automatic rollback executed: ${trigger.metric} - ${reason}`,
      rollback_event_id: rollback_id,
    };
  } catch (error) {
    return {
      success: false,
      message: `Rollback execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Monitor canary and execute automatic actions
 */
export async function monitorCanaryRelease(
  workspace_id: string
): Promise<{
  status: 'healthy' | 'degraded' | 'rolled_back';
  actions_taken: string[];
  current_phase: CanaryPhase;
}> {
  const actions_taken: string[] = [];
  const state = await getReleaseState(workspace_id);

  // Check rollback triggers
  const rollbackEval = await evaluateRollbackTriggers(workspace_id);
  if (rollbackEval.should_rollback && rollbackEval.trigger) {
    const rollback = await executeAutomaticRollback(
      workspace_id,
      rollbackEval.trigger,
      rollbackEval.reason || 'Health check failed'
    );
    actions_taken.push(rollback.message);

    return {
      status: 'rolled_back',
      actions_taken,
      current_phase: 'canary_10',
    };
  }

  // Check if can progress to next phase
  const health = await checkProductionHealth(workspace_id);
  if (health.healthy) {
    // Check if minimum duration elapsed
    const phaseStarted = new Date(state.phase_started_at);
    const hoursElapsed =
      (Date.now() - phaseStarted.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= state.min_phase_duration_hours) {
      if (state.current_phase !== 'full_release') {
        const progress = await progressCanaryPhase(workspace_id);
        if (progress.success) {
          actions_taken.push(
            `Progressed to ${progress.new_phase}: ${progress.message}`
          );
        }
      }
    }
  }

  return {
    status: health.healthy ? 'healthy' : 'degraded',
    actions_taken,
    current_phase: state.current_phase,
  };
}

/**
 * Get canary release report
 */
export async function getCanaryReleaseReport(
  workspace_id: string
): Promise<{
  workspace_id: string;
  current_state: ReleaseState;
  current_version: CircuitVersion | null;
  previous_version: CircuitVersion | null;
  release_timeline: Array<{
    phase: CanaryPhase;
    started_at: string;
    duration_hours: number;
  }>;
  recent_events: Array<{
    event_type: string;
    created_at: string;
    details: Record<string, unknown>;
  }>;
}> {
  const supabase = createClient();
  const state = await getReleaseState(workspace_id);

  // Get current version
  const { data: currentVer } = await supabase
    .from('circuit_versions')
    .select('*')
    .eq('version_id', state.current_version_id)
    .single();

  // Get previous version
  let previousVer = null;
  if (state.previous_version_id) {
    const { data: prevVer } = await supabase
      .from('circuit_versions')
      .select('*')
      .eq('version_id', state.previous_version_id)
      .single();
    previousVer = prevVer;
  }

  // Get recent events
  const { data: events } = await supabase
    .from('circuit_release_events')
    .select('event_type, created_at, details')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    workspace_id,
    current_state: state,
    current_version: currentVer as CircuitVersion | null,
    previous_version: previousVer as CircuitVersion | null,
    release_timeline: [
      {
        phase: 'canary_10',
        started_at: new Date().toISOString(),
        duration_hours: 24,
      },
      {
        phase: 'canary_50',
        started_at: new Date().toISOString(),
        duration_hours: 24,
      },
      {
        phase: 'full_release',
        started_at: new Date().toISOString(),
        duration_hours: 0,
      },
    ],
    recent_events: (events || []).map((e) => ({
      event_type: (e as { event_type: string }).event_type,
      created_at: (e as { created_at: string }).created_at,
      details: (e as { details: Record<string, unknown> }).details || {},
    })),
  };
}
