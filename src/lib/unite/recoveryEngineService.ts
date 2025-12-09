/**
 * Adaptive Recovery Engine Service
 * Phase: D75 - Unite Adaptive Recovery Engine
 *
 * Automated recovery with AI-enabled decision making.
 * CRITICAL: Must simulate before commit - NO destructive operations without approval.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export type RecoveryStatus =
  | 'pending'
  | 'simulating'
  | 'simulated'
  | 'executing'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface RecoveryPolicy {
  id: string;
  key: string;
  rules: {
    trigger_condition: {
      metric: string;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      threshold: number;
    };
    recovery_action: {
      type: 'restart_service' | 'clear_cache' | 'scale_resources' | 'rollback_deployment' | 'custom';
      params?: Record<string, unknown>;
    };
    simulation_required: boolean;
    max_retries: number;
    auto_execute?: boolean;
  };
  enabled: boolean;
  tenant_id?: string;
  updated_at: string;
}

export interface RecoveryRun {
  id: string;
  policy_key: string;
  status: RecoveryStatus;
  trigger_event?: {
    component: string;
    severity: string;
    metrics: Record<string, number>;
  };
  simulation_result?: {
    predicted_impact: string;
    risk_score: number; // 0-100
    recommended_action: string;
    safe_to_execute: boolean;
  };
  execution_result?: {
    actions_taken: string[];
    metrics_before: Record<string, number>;
    metrics_after: Record<string, number>;
    success: boolean;
  };
  ai_trace?: {
    model: string;
    prompt: string;
    response: string;
    thinking_tokens?: number;
  };
  tenant_id?: string;
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

/**
 * Create a new recovery policy
 */
export async function createRecoveryPolicy(
  key: string,
  rules: RecoveryPolicy['rules'],
  tenantId?: string | null
): Promise<RecoveryPolicy | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('unite_recovery_policies')
      .insert({
        key,
        rules,
        enabled: true,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecoveryPolicy;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to create policy:', error);
    return null;
  }
}

/**
 * List all recovery policies
 */
export async function listRecoveryPolicies(filters?: {
  tenant_id?: string;
  enabled?: boolean;
  limit?: number;
}): Promise<RecoveryPolicy[]> {
  let query = supabaseAdmin
    .from('unite_recovery_policies')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.enabled !== undefined) query = query.eq('enabled', filters.enabled);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list recovery policies: ${error.message}`);
  return data as RecoveryPolicy[];
}

/**
 * Get a specific recovery policy by key
 */
export async function getRecoveryPolicy(
  key: string,
  tenantId?: string | null
): Promise<RecoveryPolicy | null> {
  let query = supabaseAdmin.from('unite_recovery_policies').select('*').eq('key', key);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get recovery policy: ${error.message}`);
  }

  return data as RecoveryPolicy;
}

/**
 * Update a recovery policy
 */
export async function updateRecoveryPolicy(
  key: string,
  updates: Partial<Pick<RecoveryPolicy, 'rules' | 'enabled'>>,
  tenantId?: string | null
): Promise<RecoveryPolicy | null> {
  try {
    let query = supabaseAdmin
      .from('unite_recovery_policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data as RecoveryPolicy;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to update policy:', error);
    return null;
  }
}

/**
 * Delete a recovery policy
 */
export async function deleteRecoveryPolicy(
  key: string,
  tenantId?: string | null
): Promise<boolean> {
  try {
    let query = supabaseAdmin.from('unite_recovery_policies').delete().eq('key', key);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to delete policy:', error);
    return false;
  }
}

// ============================================================================
// RECOVERY EXECUTION
// ============================================================================

/**
 * Simulate a recovery action using AI
 */
async function simulateRecoveryAction(
  policy: RecoveryPolicy,
  triggerEvent: RecoveryRun['trigger_event']
): Promise<{
  simulation: RecoveryRun['simulation_result'];
  aiTrace: RecoveryRun['ai_trace'];
}> {
  const client = getAnthropicClient();

  const prompt = `You are a system recovery advisor. Analyze the following recovery scenario and predict the impact.

**Trigger Event:**
- Component: ${triggerEvent?.component}
- Severity: ${triggerEvent?.severity}
- Metrics: ${JSON.stringify(triggerEvent?.metrics, null, 2)}

**Proposed Recovery Action:**
- Type: ${policy.rules.recovery_action.type}
- Parameters: ${JSON.stringify(policy.rules.recovery_action.params, null, 2)}

**Analysis Required:**
1. Predict the impact of this recovery action on the system
2. Assess the risk score (0-100, where 0 is no risk and 100 is critical risk)
3. Recommend whether it's safe to execute this action automatically
4. Suggest any alternative actions if the risk is too high

Respond in JSON format:
{
  "predicted_impact": "string describing the expected impact",
  "risk_score": number,
  "recommended_action": "string describing what should be done",
  "safe_to_execute": boolean
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const simulationResult = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        predicted_impact: 'Unable to parse AI response',
        risk_score: 100,
        recommended_action: 'Manual review required',
        safe_to_execute: false,
      };

  return {
    simulation: simulationResult,
    aiTrace: {
      model: 'claude-sonnet-4-5-20250929',
      prompt,
      response: responseText,
      thinking_tokens: response.usage.input_tokens,
    },
  };
}

/**
 * Execute a recovery action (actual implementation would depend on action type)
 */
async function executeRecoveryAction(
  policy: RecoveryPolicy,
  triggerEvent: RecoveryRun['trigger_event']
): Promise<RecoveryRun['execution_result']> {
  // Get metrics before execution
  const metricsBefore = triggerEvent?.metrics || {};

  const actionsTaken: string[] = [];

  // Execute based on action type
  switch (policy.rules.recovery_action.type) {
    case 'restart_service':
      actionsTaken.push(`Simulated restart of service: ${policy.rules.recovery_action.params?.service}`);
      break;

    case 'clear_cache':
      actionsTaken.push('Simulated cache clearing');
      break;

    case 'scale_resources':
      actionsTaken.push(
        `Simulated resource scaling: ${JSON.stringify(policy.rules.recovery_action.params)}`
      );
      break;

    case 'rollback_deployment':
      actionsTaken.push('Simulated deployment rollback');
      break;

    case 'custom':
      actionsTaken.push(
        `Simulated custom action: ${JSON.stringify(policy.rules.recovery_action.params)}`
      );
      break;

    default:
      actionsTaken.push('Unknown action type');
  }

  // Get metrics after execution (in real implementation, measure actual system state)
  const metricsAfter = { ...metricsBefore };

  return {
    actions_taken: actionsTaken,
    metrics_before: metricsBefore,
    metrics_after: metricsAfter,
    success: true,
  };
}

/**
 * Run a recovery policy (with simulation first)
 */
export async function runRecovery(
  policyKey: string,
  triggerEvent: RecoveryRun['trigger_event'],
  options: {
    skip_simulation?: boolean;
    auto_execute?: boolean;
    tenant_id?: string | null;
  } = {}
): Promise<RecoveryRun | null> {
  try {
    // Get policy
    const policy = await getRecoveryPolicy(policyKey, options.tenant_id);
    if (!policy) {
      throw new Error(`Policy not found: ${policyKey}`);
    }

    if (!policy.enabled) {
      throw new Error(`Policy is disabled: ${policyKey}`);
    }

    // Create initial run record
    const { data: run, error: createError } = await supabaseAdmin
      .from('unite_recovery_runs')
      .insert({
        policy_key: policyKey,
        status: 'pending',
        trigger_event: triggerEvent,
        tenant_id: options.tenant_id,
      })
      .select()
      .single();

    if (createError) throw createError;

    const runId = run.id;

    // Simulate recovery action
    if (policy.rules.simulation_required && !options.skip_simulation) {
      await supabaseAdmin
        .from('unite_recovery_runs')
        .update({ status: 'simulating' })
        .eq('id', runId);

      const { simulation, aiTrace } = await simulateRecoveryAction(policy, triggerEvent);

      await supabaseAdmin
        .from('unite_recovery_runs')
        .update({
          status: 'simulated',
          simulation_result: simulation,
          ai_trace: aiTrace,
        })
        .eq('id', runId);

      // Check if auto-execution is allowed
      const shouldAutoExecute =
        (options.auto_execute || policy.rules.auto_execute) &&
        simulation.safe_to_execute &&
        simulation.risk_score < 30;

      if (!shouldAutoExecute) {
        // Return simulation result for manual review
        const { data: finalRun } = await supabaseAdmin
          .from('unite_recovery_runs')
          .select('*')
          .eq('id', runId)
          .single();

        return finalRun as RecoveryRun;
      }
    }

    // Execute recovery action
    await supabaseAdmin
      .from('unite_recovery_runs')
      .update({ status: 'executing' })
      .eq('id', runId);

    const executionResult = await executeRecoveryAction(policy, triggerEvent);

    await supabaseAdmin
      .from('unite_recovery_runs')
      .update({
        status: executionResult.success ? 'success' : 'failed',
        execution_result: executionResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Get final run record
    const { data: finalRun } = await supabaseAdmin
      .from('unite_recovery_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return finalRun as RecoveryRun;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to run recovery:', error);
    return null;
  }
}

/**
 * Approve a simulated recovery run for execution
 */
export async function approveRecoveryRun(
  runId: string,
  tenantId?: string | null
): Promise<RecoveryRun | null> {
  try {
    // Get the run
    let query = supabaseAdmin.from('unite_recovery_runs').select('*').eq('id', runId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data: run, error: fetchError } = await query.single();

    if (fetchError) throw fetchError;

    if (run.status !== 'simulated') {
      throw new Error(`Cannot approve run in status: ${run.status}`);
    }

    // Get policy
    const policy = await getRecoveryPolicy(run.policy_key, tenantId);
    if (!policy) {
      throw new Error(`Policy not found: ${run.policy_key}`);
    }

    // Execute recovery action
    await supabaseAdmin
      .from('unite_recovery_runs')
      .update({ status: 'executing' })
      .eq('id', runId);

    const executionResult = await executeRecoveryAction(policy, run.trigger_event);

    await supabaseAdmin
      .from('unite_recovery_runs')
      .update({
        status: executionResult.success ? 'success' : 'failed',
        execution_result: executionResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Get final run record
    const { data: finalRun } = await supabaseAdmin
      .from('unite_recovery_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return finalRun as RecoveryRun;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to approve recovery run:', error);
    return null;
  }
}

/**
 * Cancel a recovery run
 */
export async function cancelRecoveryRun(
  runId: string,
  tenantId?: string | null
): Promise<boolean> {
  try {
    let query = supabaseAdmin
      .from('unite_recovery_runs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[RecoveryEngine] Failed to cancel recovery run:', error);
    return false;
  }
}

/**
 * List recovery runs
 */
export async function listRecoveryRuns(filters?: {
  tenant_id?: string;
  policy_key?: string;
  status?: RecoveryStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<RecoveryRun[]> {
  let query = supabaseAdmin
    .from('unite_recovery_runs')
    .select('*')
    .order('started_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.policy_key) query = query.eq('policy_key', filters.policy_key);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.start_date) query = query.gte('started_at', filters.start_date);
  if (filters?.end_date) query = query.lte('started_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list recovery runs: ${error.message}`);
  return data as RecoveryRun[];
}

/**
 * Get recovery run statistics
 */
export async function getRecoveryStats(filters?: {
  tenant_id?: string;
  policy_key?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{
  total_runs: number;
  by_status: Record<RecoveryStatus, number>;
  by_policy: Record<string, number>;
  success_rate: number;
  avg_risk_score: number;
}> {
  const runs = await listRecoveryRuns({
    ...filters,
    limit: 10000, // Analyze last 10k runs
  });

  const byStatus: Record<RecoveryStatus, number> = {
    pending: 0,
    simulating: 0,
    simulated: 0,
    executing: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
  };

  const byPolicy: Record<string, number> = {};
  let totalRiskScore = 0;
  let riskScoreCount = 0;

  runs.forEach((run) => {
    byStatus[run.status]++;
    byPolicy[run.policy_key] = (byPolicy[run.policy_key] || 0) + 1;

    if (run.simulation_result?.risk_score !== undefined) {
      totalRiskScore += run.simulation_result.risk_score;
      riskScoreCount++;
    }
  });

  const completedRuns = byStatus.success + byStatus.failed;
  const successRate = completedRuns > 0 ? (byStatus.success / completedRuns) * 100 : 0;
  const avgRiskScore = riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0;

  return {
    total_runs: runs.length,
    by_status: byStatus,
    by_policy: byPolicy,
    success_rate: Math.round(successRate * 10) / 10,
    avg_risk_score: Math.round(avgRiskScore * 10) / 10,
  };
}
