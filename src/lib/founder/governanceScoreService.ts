/**
 * E36: Governance Scorecard Service
 * Precomputed governance health metrics
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("governanceScoreService must only run on server");
}

export interface GovernanceMetric {
  id: string;
  tenant_id: string;
  metric: string;
  value: number;
  metadata?: any;
  computed_at: string;
}

export interface GovernanceScorecard {
  open_incidents: number;
  unresolved_debt: number;
  open_remediation_tasks: number;
  security_events_30d: number;
  compliance_score: number;
  computed_at: string;
}

/**
 * Get latest scorecard (most recent value for each metric)
 */
export async function getLatestScorecard(tenantId: string): Promise<GovernanceMetric[]> {
  const { data, error } = await supabaseAdmin.rpc("get_latest_scorecard", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get latest scorecard: ${error.message}`);
  return data as GovernanceMetric[];
}

/**
 * Get metric history
 */
export async function getMetricHistory(
  tenantId: string,
  metric: string,
  days: number = 30
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("get_metric_history", {
    p_tenant_id: tenantId,
    p_metric: metric,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get metric history: ${error.message}`);
  return data;
}

/**
 * Compute governance scorecard (aggregate from E28-E35)
 */
export async function computeGovernanceScorecard(tenantId: string): Promise<GovernanceScorecard> {
  const { data, error } = await supabaseAdmin.rpc("compute_governance_scorecard", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to compute governance scorecard: ${error.message}`);
  return data as GovernanceScorecard;
}

/**
 * Record custom governance metric
 */
export async function recordGovernanceMetric(
  tenantId: string,
  metric: string,
  value: number,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_governance_metric", {
    p_tenant_id: tenantId,
    p_metric: metric,
    p_value: value,
    p_metadata: metadata || {},
  });

  if (error) throw new Error(`Failed to record governance metric: ${error.message}`);
  return data as string; // UUID
}

/**
 * List all governance metrics
 */
export async function listGovernanceMetrics(tenantId: string): Promise<GovernanceMetric[]> {
  const { data, error } = await supabaseAdmin
    .from("governance_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("computed_at", { ascending: false });

  if (error) throw new Error(`Failed to list governance metrics: ${error.message}`);
  return data as GovernanceMetric[];
}
