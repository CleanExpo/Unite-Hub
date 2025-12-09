/**
 * Adaptive Workload Regulator Service (F19)
 * Dynamically adjusts workload recommendations based on founder state
 */

if (typeof window !== "undefined") {
  throw new Error("workloadRegulatorService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type WorkloadRecommendation =
  | "increase"
  | "maintain"
  | "reduce"
  | "pause"
  | "halt";

export type WorkloadRecord = {
  id: string;
  recommended_load: WorkloadRecommendation;
  load_score: number;
  factors: Record<string, any>;
  current_capacity: number | null;
  current_utilization: number | null;
  optimal_load: number | null;
  safety_margin: number | null;
  limiting_factors: string[] | null;
  suggested_actions: string[] | null;
  created_at: string;
};

export type WorkloadSummary = {
  avg_load_score: number;
  current_recommendation: string;
  recommendation_distribution: Record<string, number>;
  period_days: number;
};

/**
 * Calculate workload recommendation
 */
export async function calculateWorkloadRecommendation(
  tenantId: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_workload_recommendation", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to calculate workload recommendation: ${error.message}`);
}

  return data;
}

/**
 * List workload recommendations
 */
export async function listWorkloadRecommendations(
  tenantId: string,
  filters?: {
    recommendation?: WorkloadRecommendation;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<WorkloadRecord[]> {
  const { data, error } = await supabaseAdmin.rpc("list_workload_recommendations", {
    p_tenant_id: tenantId,
    p_recommendation: filters?.recommendation || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
throw new Error(`Failed to list workload recommendations: ${error.message}`);
}

  return data || [];
}

/**
 * Get workload summary
 */
export async function getWorkloadSummary(
  tenantId: string,
  days: number = 7
): Promise<WorkloadSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_workload_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
throw new Error(`Failed to get workload summary: ${error.message}`);
}

  return data || null;
}
