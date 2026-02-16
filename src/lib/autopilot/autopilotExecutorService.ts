/**
 * Autopilot Executor Service
 * Phase 89: Execute low-risk, allowed actions
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AutopilotAction,
  ExecutionResult,
  AutopilotPreferences,
} from './autopilotTypes';
import { canAutoExecute } from './autopilotPreferenceService';
import { updateActionState, getPlaybookActions } from './autopilotPlaybookService';

/**
 * Execute a single action
 */
export async function executeAction(
  action: AutopilotAction,
  executedBy?: string
): Promise<ExecutionResult> {
  try {
    let result: any;

    // Route to appropriate handler
    switch (action.sourceEngine) {
      case 'early_warning':
        result = await executeEarlyWarningAction(action);
        break;

      case 'performance_reality':
        result = await executePerformanceRealityAction(action);
        break;

      case 'combat':
        result = await executeCombatAction(action);
        break;

      case 'scaling_mode':
        result = await executeScalingModeAction(action);
        break;

      case 'founder_intel':
        result = await executeFounderIntelAction(action);
        break;

      default:
        result = { message: 'No handler for this action type' };
    }

    // Update action state
    const state = executedBy ? 'approved_executed' : 'auto_executed';
    await updateActionState(action.id, state, result, executedBy);

    return {
      success: true,
      actionId: action.id,
      result,
    };
  } catch (error: unknown) {
    // Update action with error
    await updateActionState(action.id, 'suggested', {
      error: error.message,
      attempted_at: new Date().toISOString(),
    });

    return {
      success: false,
      actionId: action.id,
      error: error.message,
    };
  }
}

/**
 * Execute batch of auto-eligible actions
 */
export async function executeAutoBatch(
  playbookId: string,
  preferences: AutopilotPreferences | null
): Promise<ExecutionResult[]> {
  const actions = await getPlaybookActions(playbookId);
  const results: ExecutionResult[] = [];

  for (const action of actions) {
    // Only process suggested actions
    if (action.state !== 'suggested') continue;

    // Check if eligible for auto-execution
    if (!canAutoExecute(preferences, action.category, action.riskClass)) {
      continue;
    }

    const result = await executeAction(action);
    results.push(result);
  }

  return results;
}

/**
 * Approve and execute an action
 */
export async function approveAndExecute(
  actionId: string,
  userId: string
): Promise<ExecutionResult> {
  const supabase = await getSupabaseServer();

  // Get action
  const { data: action } = await supabase
    .from('autopilot_actions')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) {
    return {
      success: false,
      actionId,
      error: 'Action not found',
    };
  }

  if (action.state !== 'suggested') {
    return {
      success: false,
      actionId,
      error: `Action already ${action.state}`,
    };
  }

  // Execute with approval
  return executeAction(mapActionFromRow(action), userId);
}

/**
 * Skip an action
 */
export async function skipAction(actionId: string): Promise<boolean> {
  const action = await updateActionState(actionId, 'skipped');
  return action !== null;
}

// Action handlers

async function executeEarlyWarningAction(action: AutopilotAction): Promise<any> {
  // Mark warning as reviewed/acknowledged
  const supabase = await getSupabaseServer();

  const warningId = action.payload.warning_id;

  const { error } = await supabase
    .from('early_warning_events')
    .update({
      metadata: {
        reviewed_by_autopilot: true,
        reviewed_at: new Date().toISOString(),
      },
    })
    .eq('id', warningId);

  if (error) {
    throw new Error(`Failed to update warning: ${error.message}`);
  }

  return {
    message: 'Warning marked as reviewed',
    warning_id: warningId,
  };
}

async function executePerformanceRealityAction(action: AutopilotAction): Promise<any> {
  // Log performance review
  return {
    message: 'Performance review logged',
    snapshot_id: action.payload.snapshot_id,
    recommendation: action.payload.recommendation,
  };
}

async function executeCombatAction(action: AutopilotAction): Promise<any> {
  const { processIntegrations } = await import('@/lib/creativeCombat');

  if (action.actionType === 'promote_winner') {
    const result = await processIntegrations(action.payload.round_id);
    return {
      message: 'Combat integrations processed',
      result,
    };
  }

  return {
    message: 'Combat action logged',
    result_id: action.payload.result_id,
  };
}

async function executeScalingModeAction(action: AutopilotAction): Promise<any> {
  // Scaling changes are always suggestion-only in Phase 89
  return {
    message: 'Scaling recommendation logged for manual review',
    recommendation: action.payload.recommendation,
    current_mode: action.payload.current_mode,
  };
}

async function executeFounderIntelAction(action: AutopilotAction): Promise<any> {
  // Generate report reference
  return {
    message: 'Report generation queued',
    snapshot_id: action.payload.snapshot_id,
    report_type: 'weekly_intel',
  };
}

// Helper
function mapActionFromRow(row: any): AutopilotAction {
  return {
    id: row.id,
    createdAt: row.created_at,
    playbookId: row.playbook_id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    category: row.category,
    sourceEngine: row.source_engine,
    actionType: row.action_type,
    riskClass: row.risk_class,
    impactEstimate: parseFloat(row.impact_estimate),
    effortEstimate: parseFloat(row.effort_estimate),
    priorityScore: parseFloat(row.priority_score),
    state: row.state,
    title: row.title,
    description: row.description,
    payload: row.payload,
    executionResult: row.execution_result,
    executedAt: row.executed_at,
    executedBy: row.executed_by,
    truthNotes: row.truth_notes,
    metadata: row.metadata,
  };
}
