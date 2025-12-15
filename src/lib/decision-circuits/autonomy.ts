/**
 * Self-Correction & Autonomy System
 * Enables circuit-based self-healing without human intervention
 */

import { createClient } from '@/lib/supabase/server';
import { getCircuitMetrics } from './executor';

export interface StrategyState {
  client_id: string;
  workspace_id: string;
  audience_segment: string;
  strategy_id: string;
  engagement_score: number;
  conversion_score: number;
  created_at: string;
  updated_at: string;
  cycle_count: number;
  decline_cycles: number;
  last_rotated_at?: string;
}

export interface AutoCorrectionAction {
  action_type: 'rotate_strategy' | 'escalate_to_admin' | 'none';
  reason: string;
  new_strategy_id?: string;
  confidence: number;
  timestamp: number;
}

/**
 * Check if strategy needs correction based on engagement decline
 */
export async function evaluateStrategyHealth(
  client_id: string,
  workspace_id: string,
  audience_segment: string
): Promise<{
  needs_correction: boolean;
  action: AutoCorrectionAction;
  current_state: StrategyState;
}> {
  const supabase = createClient();

  // Get current strategy state
  const { data: currentState, error: stateError } = await supabase
    .from('circuit_strategy_states')
    .select('*')
    .eq('client_id', client_id)
    .eq('workspace_id', workspace_id)
    .eq('audience_segment', audience_segment)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (stateError || !currentState) {
    return {
      needs_correction: false,
      action: { action_type: 'none', reason: 'No prior state', confidence: 0 },
      current_state: {
        client_id,
        workspace_id,
        audience_segment,
        strategy_id: 'initial',
        engagement_score: 0,
        conversion_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cycle_count: 0,
        decline_cycles: 0,
      },
    };
  }

  // Get historical baseline
  const { data: history } = await supabase
    .from('circuit_strategy_states')
    .select('engagement_score, conversion_score')
    .eq('client_id', client_id)
    .eq('workspace_id', workspace_id)
    .eq('audience_segment', audience_segment)
    .eq('strategy_id', currentState.strategy_id)
    .order('created_at', { ascending: false })
    .limit(10);

  const historicalAvg =
    history && history.length > 0
      ? history.reduce((sum, h) => sum + h.engagement_score, 0) / history.length
      : currentState.engagement_score;

  // Check for decline
  const engagementDeclining =
    currentState.engagement_score < historicalAvg * 0.8; // 20% below average
  const newDeclineCycles = engagementDeclining
    ? (currentState.decline_cycles || 0) + 1
    : 0;

  // Self-correction rules
  const DECLINE_THRESHOLD = 3; // Rotate after 3 cycles of decline

  const needs_correction = newDeclineCycles >= DECLINE_THRESHOLD;

  let action: AutoCorrectionAction;

  if (needs_correction) {
    action = {
      action_type: 'rotate_strategy',
      reason: `Engagement declined for ${newDeclineCycles} cycles (current: ${currentState.engagement_score}, baseline: ${historicalAvg})`,
      confidence: 0.95,
      timestamp: Date.now(),
    };
  } else if (newDeclineCycles > 0) {
    action = {
      action_type: 'none',
      reason: `Monitoring decline cycle ${newDeclineCycles}/${DECLINE_THRESHOLD}`,
      confidence: 0.8,
      timestamp: Date.now(),
    };
  } else {
    action = {
      action_type: 'none',
      reason: 'Strategy performing within baseline',
      confidence: 0.9,
      timestamp: Date.now(),
    };
  }

  return {
    needs_correction,
    action,
    current_state: {
      ...currentState,
      decline_cycles: newDeclineCycles,
    },
  };
}

/**
 * Execute auto-correction action
 */
export async function executeAutoCorrection(
  client_id: string,
  workspace_id: string,
  audience_segment: string,
  action: AutoCorrectionAction
): Promise<{
  success: boolean;
  new_strategy_id?: string;
  log_id: string;
}> {
  const supabase = createClient();
  const log_id = `correction_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    if (action.action_type === 'rotate_strategy') {
      // Get available strategies
      const { data: strategies } = await supabase
        .from('content_strategies')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('audience_segment', audience_segment)
        .order('success_rate', { ascending: false })
        .limit(5);

      if (!strategies || strategies.length === 0) {
        action = {
          ...action,
          action_type: 'escalate_to_admin',
          reason: 'No alternative strategies available',
          confidence: 0.5,
          timestamp: Date.now(),
        };
      } else {
        // Rotate to next best strategy
        const new_strategy_id = strategies[0].id;

        // Update strategy state
        await supabase.from('circuit_strategy_states').insert({
          client_id,
          workspace_id,
          audience_segment,
          strategy_id: new_strategy_id,
          engagement_score: 0,
          conversion_score: 0,
          cycle_count: 0,
          decline_cycles: 0,
          last_rotated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Log correction action
        await supabase.from('circuit_autocorrection_logs').insert({
          log_id,
          client_id,
          workspace_id,
          action_type: action.action_type,
          previous_strategy_id: undefined,
          new_strategy_id,
          reason: action.reason,
          confidence: action.confidence,
          timestamp: new Date(action.timestamp).toISOString(),
        });

        return {
          success: true,
          new_strategy_id,
          log_id,
        };
      }
    }

    if (action.action_type === 'escalate_to_admin') {
      // Create admin notification
      await supabase.from('circuit_autocorrection_logs').insert({
        log_id,
        client_id,
        workspace_id,
        action_type: 'escalate_to_admin',
        reason: action.reason,
        confidence: action.confidence,
        timestamp: new Date(action.timestamp).toISOString(),
      });

      return {
        success: true,
        log_id,
      };
    }

    // No action needed
    return {
      success: true,
      log_id,
    };
  } catch (error) {
    console.error('Auto-correction failed:', error);

    await supabase.from('circuit_autocorrection_logs').insert({
      log_id,
      client_id,
      workspace_id,
      action_type: 'escalate_to_admin',
      reason: `Auto-correction error: ${error instanceof Error ? error.message : 'Unknown'}`,
      confidence: 0,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      log_id,
    };
  }
}

/**
 * Update strategy performance metrics
 */
export async function updateStrategyMetrics(
  client_id: string,
  workspace_id: string,
  audience_segment: string,
  engagement_score: number,
  conversion_score: number
): Promise<void> {
  const supabase = createClient();

  const { data: current } = await supabase
    .from('circuit_strategy_states')
    .select('*')
    .eq('client_id', client_id)
    .eq('workspace_id', workspace_id)
    .eq('audience_segment', audience_segment)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (current) {
    await supabase
      .from('circuit_strategy_states')
      .update({
        engagement_score,
        conversion_score,
        cycle_count: (current.cycle_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id);
  }
}

/**
 * Get autonomy dashboard data
 */
export async function getAutonomyDashboard(
  workspace_id: string,
  days: number = 30
): Promise<{
  total_corrections: number;
  successful_rotations: number;
  escalations: number;
  avg_correction_confidence: number;
  strategy_states: StrategyState[];
}> {
  const supabase = createClient();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  // Get correction logs
  const { data: logs } = await supabase
    .from('circuit_autocorrection_logs')
    .select('*')
    .eq('workspace_id', workspace_id)
    .gte('timestamp', sinceDate.toISOString());

  // Get current strategy states
  const { data: states } = await supabase
    .from('circuit_strategy_states')
    .select('*')
    .eq('workspace_id', workspace_id)
    .order('updated_at', { ascending: false });

  const correctionLogs = logs || [];
  const rotations = correctionLogs.filter(
    (log) => log.action_type === 'rotate_strategy'
  );
  const escalations = correctionLogs.filter(
    (log) => log.action_type === 'escalate_to_admin'
  );

  return {
    total_corrections: correctionLogs.length,
    successful_rotations: rotations.length,
    escalations: escalations.length,
    avg_correction_confidence:
      correctionLogs.length > 0
        ? correctionLogs.reduce((sum, log) => sum + log.confidence, 0) /
          correctionLogs.length
        : 0,
    strategy_states: (states || []) as StrategyState[],
  };
}
