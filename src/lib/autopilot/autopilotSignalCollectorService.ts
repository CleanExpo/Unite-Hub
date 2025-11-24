/**
 * Autopilot Signal Collector Service
 * Phase 89: Collect candidate actions from all underlying engines
 */

import { getSupabaseServer } from '@/lib/supabase';
import { RawAutopilotSignal, SourceEngine } from './autopilotTypes';

/**
 * Collect signals from all engines for a period
 */
export async function collectSignalsForPeriod(
  workspaceId: string,
  periodStart: string,
  periodEnd: string
): Promise<RawAutopilotSignal[]> {
  const signals: RawAutopilotSignal[] = [];

  // Collect from each source in parallel
  const [
    earlyWarnings,
    performanceSnapshots,
    combatResults,
    scalingSnapshots,
    founderSnapshots,
  ] = await Promise.all([
    collectEarlyWarnings(workspaceId, periodStart),
    collectPerformanceReality(workspaceId, periodStart),
    collectCombatResults(workspaceId, periodStart),
    collectScalingMode(workspaceId, periodStart),
    collectFounderIntel(workspaceId, periodStart),
  ]);

  signals.push(...earlyWarnings);
  signals.push(...performanceSnapshots);
  signals.push(...combatResults);
  signals.push(...scalingSnapshots);
  signals.push(...founderSnapshots);

  return signals;
}

// Collect from Early Warning Engine
async function collectEarlyWarnings(
  workspaceId: string,
  since: string
): Promise<RawAutopilotSignal[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('early_warning_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('resolved', false)
    .gte('created_at', since)
    .order('severity', { ascending: false });

  return (data || []).map(warning => ({
    sourceEngine: 'early_warning' as SourceEngine,
    signalType: warning.warning_type,
    clientId: warning.client_id,
    severity: warning.severity,
    data: {
      id: warning.id,
      threshold_value: warning.threshold_value,
      actual_value: warning.actual_value,
      message: warning.message,
    },
    timestamp: warning.created_at,
  }));
}

// Collect from Performance Reality Engine
async function collectPerformanceReality(
  workspaceId: string,
  since: string
): Promise<RawAutopilotSignal[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('performance_reality_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data || []).map(snapshot => ({
    sourceEngine: 'performance_reality' as SourceEngine,
    signalType: snapshot.recommendation || 'performance_update',
    clientId: snapshot.client_id,
    severity: snapshot.overall_confidence < 0.5 ? 'high' : 'low',
    data: {
      id: snapshot.id,
      overall_confidence: snapshot.overall_confidence,
      recommendation: snapshot.recommendation,
      summary: snapshot.summary_markdown,
    },
    timestamp: snapshot.created_at,
  }));
}

// Collect from Creative Combat Engine
async function collectCombatResults(
  workspaceId: string,
  since: string
): Promise<RawAutopilotSignal[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('combat_results')
    .select(`
      *,
      combat_rounds!inner (workspace_id, client_id, channel)
    `)
    .eq('combat_rounds.workspace_id', workspaceId)
    .gte('created_at', since);

  return (data || []).map(result => ({
    sourceEngine: 'combat' as SourceEngine,
    signalType: result.result_type,
    clientId: result.combat_rounds?.client_id,
    severity: result.result_type === 'winner' ? 'low' : 'medium',
    data: {
      id: result.id,
      round_id: result.round_id,
      result_type: result.result_type,
      winner_promoted: result.winner_promoted,
      loser_retired: result.loser_retired,
      lift_percent: result.score_lift_percent,
    },
    timestamp: result.created_at,
  }));
}

// Collect from Scaling Mode Engine
async function collectScalingMode(
  workspaceId: string,
  since: string
): Promise<RawAutopilotSignal[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data || []).map(snapshot => ({
    sourceEngine: 'scaling_mode' as SourceEngine,
    signalType: snapshot.recommendation,
    severity: snapshot.recommendation === 'freeze' ? 'high' : 'low',
    data: {
      id: snapshot.id,
      current_mode: snapshot.current_mode,
      health_score: snapshot.overall_scaling_health_score,
      recommendation: snapshot.recommendation,
      utilisation: snapshot.utilisation_ratio,
    },
    timestamp: snapshot.created_at,
  }));
}

// Collect from Founder Intel
async function collectFounderIntel(
  workspaceId: string,
  since: string
): Promise<RawAutopilotSignal[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_intel_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5);

  return (data || []).map(snapshot => ({
    sourceEngine: 'founder_intel' as SourceEngine,
    signalType: 'intel_snapshot',
    data: {
      id: snapshot.id,
      summary: snapshot.summary_markdown,
      metrics: snapshot.metrics,
    },
    timestamp: snapshot.created_at,
  }));
}
