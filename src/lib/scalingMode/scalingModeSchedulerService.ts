/**
 * Scaling Mode Scheduler Service
 * Phase 86: Scheduled scaling evaluations
 */

import {
  ScalingHealthSnapshot,
  ScalingModeConfig,
} from './scalingModeTypes';
import { getConfig, setCurrentMode } from './scalingModeConfigService';
import { generateSnapshot, getLatestSnapshot } from './scalingHealthSnapshotService';
import { logModeChange, logNote } from './scalingHistoryService';
import { shouldBlockRecommendation } from './scalingModeTruthAdapter';
import { collectHealthInputs } from './scalingHealthAggregationService';

/**
 * Run daily scaling evaluation
 */
export async function runDailyScalingEvaluation(
  environment: string = 'production'
): Promise<{
  snapshot: ScalingHealthSnapshot;
  mode_changed: boolean;
  new_mode?: string;
}> {
  // Generate new snapshot
  const snapshot = await generateSnapshot(environment);

  // Get config for auto-mode check
  const config = await getConfig(environment);

  if (!config) {
    return { snapshot, mode_changed: false };
  }

  // Check if we should auto-apply mode change
  let modeChanged = false;
  let newMode: string | undefined;

  if (config.auto_mode_enabled) {
    const result = await evaluateAutoModeChange(
      environment,
      config,
      snapshot
    );

    modeChanged = result.changed;
    newMode = result.new_mode;
  }

  return {
    snapshot,
    mode_changed: modeChanged,
    new_mode: newMode,
  };
}

/**
 * Evaluate and potentially apply auto mode change
 */
async function evaluateAutoModeChange(
  environment: string,
  config: ScalingModeConfig,
  snapshot: ScalingHealthSnapshot
): Promise<{ changed: boolean; new_mode?: string }> {
  // Only consider increase recommendations for auto-apply
  if (snapshot.recommendation !== 'increase_mode') {
    return { changed: false };
  }

  // Get decision details from metadata
  const decision = {
    recommendation: snapshot.recommendation,
    confidence: snapshot.confidence_score,
    reasons: (snapshot.metadata as any)?.decision_reasons || [],
    can_auto_apply: true,
    next_mode: getNextModeFromCurrent(config.current_mode),
  };

  // Collect inputs for truth check
  const inputs = await collectHealthInputs(environment);

  // Check truth layer
  const blockCheck = shouldBlockRecommendation(decision, inputs);
  if (blockCheck.blocked) {
    await logNote(
      environment,
      `Auto mode change blocked: ${blockCheck.reason}`,
      'system'
    );
    return { changed: false };
  }

  // Additional safety checks for auto-apply
  if (snapshot.overall_scaling_health_score < 80) {
    await logNote(
      environment,
      `Auto mode change skipped: health ${snapshot.overall_scaling_health_score} below 80`,
      'system'
    );
    return { changed: false };
  }

  if (snapshot.confidence_score < 0.8) {
    await logNote(
      environment,
      `Auto mode change skipped: confidence ${snapshot.confidence_score} below 0.8`,
      'system'
    );
    return { changed: false };
  }

  // Apply the mode change
  const nextMode = decision.next_mode;
  if (!nextMode) {
    return { changed: false };
  }

  await setCurrentMode(environment, nextMode as any);

  // Log the change
  await logModeChange(
    environment,
    config.current_mode,
    nextMode as any,
    `Auto-applied mode change based on high health (${snapshot.overall_scaling_health_score.toFixed(0)}) and confidence (${(snapshot.confidence_score * 100).toFixed(0)}%).`,
    'system',
    snapshot.id
  );

  return { changed: true, new_mode: nextMode };
}

/**
 * Get next mode from current
 */
function getNextModeFromCurrent(currentMode: string): string | null {
  const sequence = ['lab', 'pilot', 'growth', 'scale'];
  const currentIndex = sequence.indexOf(currentMode);

  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null;
  }

  return sequence[currentIndex + 1];
}

/**
 * Run weekly summary generation
 */
export async function runWeeklySummary(
  environment: string = 'production'
): Promise<string> {
  const { getSupabaseServer } = await import('@/lib/supabase');
  const supabase = await getSupabaseServer();

  // Get snapshots from last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: snapshots } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('environment', environment)
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false });

  const { data: history } = await supabase
    .from('scaling_history')
    .select('*')
    .eq('environment', environment)
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false });

  if (!snapshots || snapshots.length === 0) {
    return 'No scaling data available for the past week.';
  }

  // Generate summary
  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  const avgHealth = snapshots.reduce(
    (sum, s) => sum + s.overall_scaling_health_score,
    0
  ) / snapshots.length;

  const modeChanges = history?.filter(h => h.event_type === 'mode_change') || [];

  const lines: string[] = [
    `## Weekly Scaling Summary (${environment})`,
    '',
    `**Period:** ${oldest.created_at.split('T')[0]} to ${latest.created_at.split('T')[0]}`,
    '',
    '### Key Metrics',
    `- Current Mode: ${latest.current_mode}`,
    `- Active Clients: ${latest.active_clients}`,
    `- Average Health: ${avgHealth.toFixed(0)}/100`,
    `- Mode Changes: ${modeChanges.length}`,
    '',
    '### Trend',
    snapshots.length > 1
      ? `Health ${oldest.overall_scaling_health_score.toFixed(0)} → ${latest.overall_scaling_health_score.toFixed(0)}`
      : 'Insufficient data for trend analysis',
    '',
    '---',
    '*Weekly summary generated from verified system data.*',
  ];

  return lines.join('\n');
}

/**
 * Check if evaluation is needed (not run recently)
 */
export async function needsEvaluation(
  environment: string = 'production',
  minHoursBetween: number = 23
): Promise<boolean> {
  const latest = await getLatestSnapshot(environment);

  if (!latest) {
    return true;
  }

  const hoursSince = (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);

  return hoursSince >= minHoursBetween;
}
