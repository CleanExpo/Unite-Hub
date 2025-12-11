/**
 * Guardian I06: Gatekeeper Orchestrator
 *
 * Main entry point for change impact gatekeeper.
 * Orchestrates change set creation, impact planning, and gate evaluation.
 * Designed for CI/CD integration and admin manual usage.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { type GuardianChangeDiff } from './changeDiffCollector';
import { planImpactForChangeSet } from './changeImpactPlanner';
import {
  evaluateImpactPlan,
  GuardianGateConfig,
} from './gateEvaluationEngine';

export interface GuardianGatekeeperRequest {
  tenantId: string;
  source: 'manual' | 'ci' | 'api' | 'script';
  sourceRef?: string;
  changeType: 'rules' | 'playbooks' | 'thresholds' | 'mixed';
  diff: GuardianChangeDiff;
  actorId?: string;
}

export interface GuardianGatekeeperResponse {
  changeSetId: string;
  gateDecisionId: string;
  decision: 'allow' | 'block' | 'warn';
  reason: string;
  flags: string[];
  summary: Record<string, unknown>;
}

/**
 * Run the complete gatekeeper flow for a change
 *
 * Steps:
 * 1. Create and insert guardian_change_sets row
 * 2. Create guardian_gate_decisions row (status=pending)
 * 3. Plan impact using changeImpactPlanner
 * 4. Evaluate impact using gateEvaluationEngine
 * 5. Update guardian_gate_decisions with results
 * 6. Return decision response
 */
export async function runGatekeeper(
  request: GuardianGatekeeperRequest,
  gateConfig?: GuardianGateConfig
): Promise<GuardianGatekeeperResponse> {
  const supabase = getSupabaseServer();
  const { tenantId, source, sourceRef, changeType, diff, actorId } = request;

  let changeSetId: string | undefined;
  let gateDecisionId: string | undefined;

  try {
    // Step 1: Create change set
    const { data: changeSet, error: csError } = await supabase
      .from('guardian_change_sets')
      .insert({
        tenant_id: tenantId,
        source,
        source_ref: sourceRef,
        change_type: changeType,
        diff,
        created_by: actorId,
      })
      .select('id')
      .single();

    if (csError || !changeSet) {
      throw new Error(`Failed to create change set: ${csError?.message}`);
    }

    changeSetId = changeSet.id;

    // Step 2: Create gate decision (pending)
    const { data: gateDecision, error: gdError } = await supabase
      .from('guardian_gate_decisions')
      .insert({
        tenant_id: tenantId,
        change_set_id: changeSetId,
        status: 'pending',
        created_by: actorId,
      })
      .select('id')
      .single();

    if (gdError || !gateDecision) {
      throw new Error(`Failed to create gate decision: ${gdError?.message}`);
    }

    gateDecisionId = gateDecision.id;

    // Step 3: Plan impact
    const impactPlan = await planImpactForChangeSet(tenantId, changeSetId);

    // Step 4: Evaluate impact
    const evaluationResponse = await evaluateImpactPlan(
      tenantId,
      impactPlan,
      gateConfig
    );

    const { decision, reason, flags, summary } = evaluationResponse.result;

    // Step 5: Update gate decision with results
    const { error: updateError } = await supabase
      .from('guardian_gate_decisions')
      .update({
        status: 'evaluated',
        decision,
        reason,
        regression_run_id: evaluationResponse.regressionRunId,
        qa_schedule_id: evaluationResponse.qaScheduleId,
        drift_report_id: evaluationResponse.driftReportId,
        summary: {
          ...(summary as Record<string, unknown>),
          impactPlanRationale: impactPlan.rationaleMarkdown,
        },
      })
      .eq('id', gateDecisionId);

    if (updateError) {
      throw new Error(`Failed to update gate decision: ${updateError.message}`);
    }

    // Step 6: Return response
    return {
      changeSetId,
      gateDecisionId,
      decision,
      reason,
      flags,
      summary,
    };
  } catch (err) {
    // Update gate decision with error status
    if (gateDecisionId) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await supabase
        .from('guardian_gate_decisions')
        .update({
          status: 'failed',
          error_message: errorMsg,
        })
        .eq('id', gateDecisionId);
    }

    throw err;
  }
}

/**
 * List gate decisions for a tenant with optional filters
 */
export async function listGateDecisions(
  tenantId: string,
  filters?: {
    status?: 'pending' | 'evaluated' | 'failed';
    decision?: 'allow' | 'block' | 'warn';
    changeType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_gate_decisions')
    .select('*, guardian_change_sets(id, source, source_ref, change_type, description, created_at)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.decision) {
    query = query.eq('decision', filters.decision);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list gate decisions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single gate decision with related data
 */
export async function getGateDecision(
  tenantId: string,
  gateDecisionId: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_gate_decisions')
    .select('*, guardian_change_sets(*)')
    .eq('tenant_id', tenantId)
    .eq('id', gateDecisionId)
    .single();

  if (error) {
    throw new Error(`Failed to get gate decision: ${error.message}`);
  }

  return data;
}
