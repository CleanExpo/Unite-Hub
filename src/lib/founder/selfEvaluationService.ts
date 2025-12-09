/**
 * @fileoverview E48 Autonomous Self-Evaluation Loop Service
 * Server-side only service for self-evaluation cycle management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("selfEvaluationService must only run on server");
}

export type EvaluationStatus = "running" | "completed" | "failed" | "cancelled";
export type EvaluationFactorType =
  | "stability"
  | "risk"
  | "coherence"
  | "performance"
  | "security"
  | "compliance"
  | "quality"
  | "efficiency"
  | "reliability"
  | "scalability"
  | "other";

/**
 * List evaluation cycles
 */
export async function listEvaluationCycles(
  tenantId: string,
  filters?: { status?: EvaluationStatus; limit?: number }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_evaluation_cycles", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list evaluation cycles: ${error.message}`);
  return data || [];
}

/**
 * List evaluation factors for a cycle
 */
export async function listEvaluationFactors(
  tenantId: string,
  cycleCode: string
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_evaluation_factors", {
    p_tenant_id: tenantId,
    p_cycle_code: cycleCode,
  });

  if (error) throw new Error(`Failed to list evaluation factors: ${error.message}`);
  return data || [];
}

/**
 * Start evaluation cycle
 */
export async function startEvaluationCycle(args: {
  tenantId: string;
  cycleCode: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("start_evaluation_cycle", {
    p_tenant_id: args.tenantId,
    p_cycle_code: args.cycleCode,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to start evaluation cycle: ${error.message}`);
  return data;
}

/**
 * Record evaluation factor
 */
export async function recordEvaluationFactor(args: {
  tenantId: string;
  cycleCode: string;
  factor: EvaluationFactorType;
  value: number;
  weight?: number;
  details?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_evaluation_factor", {
    p_tenant_id: args.tenantId,
    p_cycle_code: args.cycleCode,
    p_factor: args.factor,
    p_value: args.value,
    p_weight: args.weight ?? 1.0,
    p_details: args.details || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record evaluation factor: ${error.message}`);
  return data;
}

/**
 * Complete evaluation cycle
 */
export async function completeEvaluationCycle(args: {
  cycleId: string;
  summary?: string;
  recommendations?: string[];
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("complete_evaluation_cycle", {
    p_cycle_id: args.cycleId,
    p_summary: args.summary || null,
    p_recommendations: args.recommendations || null,
  });

  if (error) throw new Error(`Failed to complete evaluation cycle: ${error.message}`);
}

/**
 * Get evaluation summary
 */
export async function getEvaluationSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_evaluation_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get evaluation summary: ${error.message}`);
  return data || {};
}
