/**
 * Runtime Adaptive Orchestrator Service
 * Phase: D72 - Unite Runtime Adaptive Orchestrator
 *
 * Adaptive runtime strategies with side-effect-free evaluation.
 * AI-enabled decision making and execution orchestration.
 * CRITICAL: Always evaluate in side-effect-free mode before committing.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface RuntimeSignal {
  id: string;
  signal_type: string;
  source_system: string;
  severity: 'info' | 'warning' | 'critical';
  metric_name: string;
  metric_value: number;
  threshold_value?: number;
  metadata?: Record<string, unknown>;
  tenant_id?: string;
  detected_at: string;
  resolved_at?: string;
}

export interface AdaptiveStrategy {
  id: string;
  name: string;
  description?: string;
  trigger_conditions: {
    signal_type?: string;
    severity?: string;
    threshold?: number;
  };
  actions: Array<{
    type: 'scale_up' | 'scale_down' | 'throttle' | 'alert' | 'restart';
    params: Record<string, unknown>;
  }>;
  evaluation_mode: 'side-effect-free' | 'commit';
  priority: number;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrchestratorRun {
  id: string;
  strategy_id: string;
  triggered_by_signal_id?: string;
  status: 'evaluating' | 'executing' | 'completed' | 'failed' | 'skipped';
  evaluation_result?: {
    safe: boolean;
    predicted_impact: Record<string, unknown>;
  };
  actions_taken?: Array<{
    action: string;
    result: string;
    timestamp: string;
  }>;
  ai_reasoning?: string;
  side_effects_detected?: {
    warnings: string[];
    impacts: string[];
  };
  tenant_id?: string;
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// SIGNAL MANAGEMENT
// ============================================================================

export async function createRuntimeSignal(
  input: Omit<RuntimeSignal, 'id' | 'detected_at'>
): Promise<RuntimeSignal> {
  const { data, error } = await supabaseAdmin
    .from('unite_runtime_signals')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create runtime signal: ${error.message}`);
  return data as RuntimeSignal;
}

export async function listRuntimeSignals(filters?: {
  tenant_id?: string;
  signal_type?: string;
  severity?: string;
  unresolved_only?: boolean;
  limit?: number;
}): Promise<RuntimeSignal[]> {
  let query = supabaseAdmin
    .from('unite_runtime_signals')
    .select('*')
    .order('detected_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.signal_type) query = query.eq('signal_type', filters.signal_type);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.unresolved_only) query = query.is('resolved_at', null);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list runtime signals: ${error.message}`);
  return data as RuntimeSignal[];
}

export async function resolveRuntimeSignal(signalId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_runtime_signals')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', signalId);

  if (error) throw new Error(`Failed to resolve runtime signal: ${error.message}`);
}

// ============================================================================
// STRATEGY MANAGEMENT
// ============================================================================

export async function createAdaptiveStrategy(
  input: Omit<AdaptiveStrategy, 'id' | 'created_at' | 'updated_at'>
): Promise<AdaptiveStrategy> {
  const { data, error } = await supabaseAdmin
    .from('unite_adaptive_strategies')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create adaptive strategy: ${error.message}`);
  return data as AdaptiveStrategy;
}

export async function listAdaptiveStrategies(filters?: {
  tenant_id?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<AdaptiveStrategy[]> {
  let query = supabaseAdmin
    .from('unite_adaptive_strategies')
    .select('*')
    .order('priority', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list adaptive strategies: ${error.message}`);
  return data as AdaptiveStrategy[];
}

export async function getAdaptiveStrategy(strategyId: string): Promise<AdaptiveStrategy | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_adaptive_strategies')
    .select('*')
    .eq('id', strategyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get adaptive strategy: ${error.message}`);
  }

  return data as AdaptiveStrategy;
}

export async function updateAdaptiveStrategy(
  strategyId: string,
  updates: Partial<Omit<AdaptiveStrategy, 'id' | 'created_at' | 'updated_at'>>
): Promise<AdaptiveStrategy> {
  const { data, error } = await supabaseAdmin
    .from('unite_adaptive_strategies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', strategyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update adaptive strategy: ${error.message}`);
  return data as AdaptiveStrategy;
}

export async function deleteAdaptiveStrategy(strategyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_adaptive_strategies')
    .delete()
    .eq('id', strategyId);

  if (error) throw new Error(`Failed to delete adaptive strategy: ${error.message}`);
}

// ============================================================================
// ORCHESTRATOR EXECUTION
// ============================================================================

export async function runOrchestrator(
  signalId: string,
  tenantId: string | null
): Promise<OrchestratorRun[]> {
  // Get the signal
  const { data: signal } = await supabaseAdmin
    .from('unite_runtime_signals')
    .select('*')
    .eq('id', signalId)
    .single();

  if (!signal) {
    throw new Error('Runtime signal not found');
  }

  // Find matching strategies
  const { data: strategies } = await supabaseAdmin
    .from('unite_adaptive_strategies')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (!strategies || strategies.length === 0) {
    return [];
  }

  const runs: OrchestratorRun[] = [];

  // Execute matching strategies
  for (const strategy of strategies) {
    const matchesConditions = evaluateTriggerConditions(
      signal as RuntimeSignal,
      strategy.trigger_conditions
    );

    if (!matchesConditions) {
      continue;
    }

    // Create run record
    const { data: run, error: createError } = await supabaseAdmin
      .from('unite_orchestrator_runs')
      .insert({
        strategy_id: strategy.id,
        triggered_by_signal_id: signalId,
        status: 'evaluating',
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create orchestrator run:', createError);
      continue;
    }

    // CRITICAL: Always evaluate side-effect-free first
    const evaluation = await evaluateSideEffectFree(
      signal as RuntimeSignal,
      strategy as AdaptiveStrategy
    );

    // Update with evaluation result
    await supabaseAdmin
      .from('unite_orchestrator_runs')
      .update({
        evaluation_result: evaluation.result,
        side_effects_detected: evaluation.side_effects,
        ai_reasoning: evaluation.reasoning,
      })
      .eq('id', run.id);

    // Only execute if evaluation passed and mode is commit
    if (evaluation.result.safe && strategy.evaluation_mode === 'commit') {
      await updateRunStatus(run.id, 'executing');

      const actionResults = await executeActions(strategy as AdaptiveStrategy);

      const { data: finalRun } = await supabaseAdmin
        .from('unite_orchestrator_runs')
        .update({
          status: 'completed',
          actions_taken: actionResults,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id)
        .select()
        .single();

      runs.push(finalRun as OrchestratorRun);
    } else {
      // Skip execution
      const { data: skippedRun } = await supabaseAdmin
        .from('unite_orchestrator_runs')
        .update({
          status: 'skipped',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id)
        .select()
        .single();

      runs.push(skippedRun as OrchestratorRun);
    }
  }

  return runs;
}

export async function listOrchestratorRuns(filters?: {
  tenant_id?: string;
  strategy_id?: string;
  status?: string;
  limit?: number;
}): Promise<OrchestratorRun[]> {
  let query = supabaseAdmin
    .from('unite_orchestrator_runs')
    .select('*')
    .order('started_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.strategy_id) query = query.eq('strategy_id', filters.strategy_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list orchestrator runs: ${error.message}`);
  return data as OrchestratorRun[];
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function evaluateTriggerConditions(
  signal: RuntimeSignal,
  conditions: AdaptiveStrategy['trigger_conditions']
): boolean {
  if (conditions.signal_type && signal.signal_type !== conditions.signal_type) {
    return false;
  }

  if (conditions.severity && signal.severity !== conditions.severity) {
    return false;
  }

  if (conditions.threshold && signal.metric_value < conditions.threshold) {
    return false;
  }

  return true;
}

async function evaluateSideEffectFree(
  signal: RuntimeSignal,
  strategy: AdaptiveStrategy
): Promise<{
  result: { safe: boolean; predicted_impact: Record<string, unknown> };
  side_effects: { warnings: string[]; impacts: string[] };
  reasoning: string;
}> {
  try {
    const anthropic = getAnthropicClient();

    const prompt = `Evaluate this adaptive strategy execution in SIDE-EFFECT-FREE mode:

Signal:
- Type: ${signal.signal_type}
- Source: ${signal.source_system}
- Severity: ${signal.severity}
- Metric: ${signal.metric_name} = ${signal.metric_value}
- Threshold: ${signal.threshold_value || 'N/A'}

Strategy:
- Name: ${strategy.name}
- Actions: ${JSON.stringify(strategy.actions)}

Provide analysis in JSON format:
{
  "safe": true|false,
  "predicted_impact": {
    "description": "What would happen if we execute",
    "estimated_cost": "low|medium|high",
    "reversible": true|false
  },
  "side_effects": {
    "warnings": ["Warning 1", "Warning 2"],
    "impacts": ["Impact 1", "Impact 2"]
  },
  "reasoning": "Why this is/isn't safe to execute"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);
    return {
      result: {
        safe: result.safe,
        predicted_impact: result.predicted_impact,
      },
      side_effects: result.side_effects,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('[Orchestrator] AI evaluation failed:', error);
    return {
      result: {
        safe: false,
        predicted_impact: { description: 'AI evaluation unavailable' },
      },
      side_effects: {
        warnings: ['AI evaluation failed - defaulting to unsafe'],
        impacts: [],
      },
      reasoning: 'AI evaluation unavailable - defaulting to safe mode',
    };
  }
}

async function executeActions(
  strategy: AdaptiveStrategy
): Promise<Array<{ action: string; result: string; timestamp: string }>> {
  const results: Array<{ action: string; result: string; timestamp: string }> = [];

  for (const action of strategy.actions) {
    // SIMULATED execution - in production, these would trigger real actions
    const result = {
      action: action.type,
      result: 'simulated_success',
      timestamp: new Date().toISOString(),
    };

    results.push(result);

    // Brief delay to simulate execution
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return results;
}

async function updateRunStatus(runId: string, status: OrchestratorRun['status']): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_orchestrator_runs')
    .update({ status })
    .eq('id', runId);

  if (error) throw new Error(`Failed to update run status: ${error.message}`);
}
