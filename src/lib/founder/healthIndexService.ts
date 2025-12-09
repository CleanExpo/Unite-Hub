/**
 * Founder Health Index Service (F14)
 * Multivariate health scoring from F09-F13 weighted signals
 */

if (typeof window !== "undefined") {
  throw new Error("healthIndexService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type FounderHealthCategory = "optimal" | "stable" | "declining" | "critical";

export type HealthIndex = {
  id: string;
  health_category: FounderHealthCategory;
  health_score: number;
  unified_state_score: number;
  energy_trend_score: number;
  cognitive_stability_score: number;
  recovery_effectiveness_score: number;
  contributing_factors: Record<string, any>;
  recommended_interventions: string[];
  urgency_level: string;
  days_in_current_category: number;
  consecutive_decline_days: number;
  volatility_score: number;
  peak_score_30d: number | null;
  lowest_score_30d: number | null;
  notes: string | null;
  created_at: string;
};

export type HealthSummary = {
  total_snapshots: number;
  current_category: FounderHealthCategory;
  current_score: number;
  avg_health_score: number;
  max_score: number;
  min_score: number;
  avg_volatility: number;
  by_category: Record<string, number>;
  score_trend: "improving" | "stable" | "declining";
  critical_days: number;
  longest_decline_streak: number;
};

/**
 * Calculate current health index from F09-F13 data
 */
export async function calculateHealthIndex(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_health_index", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to calculate health index: ${error.message}`);

  return data?.[0] || null;
}

/**
 * Record health index snapshot
 */
export async function recordHealthIndex(args: {
  tenantId: string;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_health_index", {
    p_tenant_id: args.tenantId,
    p_notes: args.notes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record health index: ${error.message}`);

  return data;
}

/**
 * List health index snapshots
 */
export async function listHealthIndex(
  tenantId: string,
  filters?: {
    category?: FounderHealthCategory;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<HealthIndex[]> {
  const { data, error } = await supabaseAdmin.rpc("list_health_index", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list health index: ${error.message}`);

  return data || [];
}

/**
 * Get health index summary
 */
export async function getHealthSummary(
  tenantId: string,
  days: number = 30
): Promise<HealthSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_health_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get health summary: ${error.message}`);

  return data?.[0] || null;
}
