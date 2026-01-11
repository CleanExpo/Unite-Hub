/**
 * Founder Resilience Service (F18)
 * Measures resilience in presence of stressors, drift, and instability
 */

if (typeof window !== "undefined") {
  throw new Error("resilienceService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ResilienceLevel =
  | "exceptional"
  | "strong"
  | "adequate"
  | "vulnerable"
  | "critical";

export type ResilienceMetric = {
  id: string;
  resilience_score: number;
  resilience_level: ResilienceLevel;
  pressure_factors: Record<string, any>;
  stabilising_factors: Record<string, any>;
  net_resilience: number;
  pressure_score: number | null;
  stability_score: number | null;
  recovery_capacity: number | null;
  adaptation_speed: number | null;
  stressor_types: string[] | null;
  coping_mechanisms: string[] | null;
  created_at: string;
};

export type ResilienceSummary = {
  avg_resilience: number;
  min_resilience: number;
  max_resilience: number;
  current_level: string;
  vulnerable_count: number;
  period_days: number;
};

/**
 * Calculate current resilience score
 */
export async function calculateResilienceScore(
  tenantId: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_resilience_score", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to calculate resilience: ${error.message}`);
}

  return data;
}

/**
 * List resilience metrics
 */
export async function listResilienceMetrics(
  tenantId: string,
  filters?: {
    level?: ResilienceLevel;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<ResilienceMetric[]> {
  const { data, error } = await supabaseAdmin.rpc("list_resilience_metrics", {
    p_tenant_id: tenantId,
    p_level: filters?.level || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
throw new Error(`Failed to list resilience metrics: ${error.message}`);
}

  return data || [];
}

/**
 * Get resilience summary
 */
export async function getResilienceSummary(
  tenantId: string,
  days: number = 7
): Promise<ResilienceSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_resilience_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
throw new Error(`Failed to get resilience summary: ${error.message}`);
}

  return data || null;
}
