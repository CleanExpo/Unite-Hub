/**
 * Founder Systemic Drift Service (F17)
 * Detects deviations between founder intent and execution reality
 */

if (typeof window !== "undefined") {
  throw new Error("systemicDriftService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type DriftCategory =
  | "alignment_loss"
  | "focus_split"
  | "execution_gap"
  | "external_pressure"
  | "resource_constraint"
  | "priority_conflict";

export type DriftSeverity = "minimal" | "moderate" | "significant" | "critical";

export type SystemicDrift = {
  id: string;
  drift_score: number;
  drift_category: DriftCategory;
  drift_severity: DriftSeverity;
  contributing_factors: Record<string, any>;
  intent_vector: Record<string, any> | null;
  execution_vector: Record<string, any> | null;
  alignment_angle: number | null;
  affected_domains: string[] | null;
  root_causes: string[] | null;
  created_at: string;
};

export type DriftCorrection = {
  id: string;
  drift_id: string;
  correction_type: string;
  action_taken: string;
  impact_score: number | null;
  success: boolean | null;
  actual_impact: number | null;
  created_at: string;
};

export type DriftSummary = {
  avg_drift_score: number;
  max_drift_score: number;
  critical_count: number;
  by_category: Record<string, number>;
  period_days: number;
};

/**
 * Calculate current systemic drift
 */
export async function calculateSystemicDrift(args: {
  tenantId: string;
  intentVector?: Record<string, any>;
  executionVector?: Record<string, any>;
}): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_systemic_drift", {
    p_tenant_id: args.tenantId,
    p_intent_vector: args.intentVector || null,
    p_execution_vector: args.executionVector || null,
  });

  if (error) {
throw new Error(`Failed to calculate systemic drift: ${error.message}`);
}

  return data;
}

/**
 * Record drift correction action
 */
export async function recordDriftCorrection(args: {
  driftId: string;
  tenantId: string;
  correctionType: string;
  actionTaken: string;
  impactScore?: number;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_drift_correction", {
    p_drift_id: args.driftId,
    p_tenant_id: args.tenantId,
    p_correction_type: args.correctionType,
    p_action_taken: args.actionTaken,
    p_impact_score: args.impactScore || null,
  });

  if (error) {
throw new Error(`Failed to record drift correction: ${error.message}`);
}

  return data;
}

/**
 * List systemic drift records
 */
export async function listSystemicDrift(
  tenantId: string,
  filters?: {
    category?: DriftCategory;
    severity?: DriftSeverity;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<SystemicDrift[]> {
  const { data, error } = await supabaseAdmin.rpc("list_systemic_drift", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_severity: filters?.severity || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
throw new Error(`Failed to list systemic drift: ${error.message}`);
}

  return data || [];
}

/**
 * Get drift summary
 */
export async function getDriftSummary(
  tenantId: string,
  days: number = 7
): Promise<DriftSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_systemic_drift_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
throw new Error(`Failed to get drift summary: ${error.message}`);
}

  return data || null;
}
