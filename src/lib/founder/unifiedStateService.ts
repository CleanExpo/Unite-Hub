/**
 * Founder Unified State Service (F13)
 * Aggregates F09-F12 into single weighted state
 */

if (typeof window !== "undefined") {
  throw new Error("unifiedStateService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type FounderStateCategory =
  | "optimal"
  | "flow"
  | "focused"
  | "balanced"
  | "stressed"
  | "overloaded"
  | "fatigued"
  | "disrupted"
  | "recovering"
  | "critical";

export type UnifiedState = {
  id: string;
  state_category: FounderStateCategory;
  composite_score: number;
  cognitive_load_score: number;
  energy_score: number;
  recovery_score: number;
  intent_routing_score: number;
  factors: Record<string, any>;
  recommended_actions: string[];
  priority_level: string;
  notes: string | null;
  created_at: string;
};

export type UnifiedStateSummary = {
  total_snapshots: number;
  current_state: FounderStateCategory;
  current_score: number;
  avg_composite_score: number;
  max_score: number;
  min_score: number;
  by_category: Record<string, number>;
  score_trend: "improving" | "stable" | "declining";
  critical_count: number;
};

/**
 * Calculate current unified state from F09-F12 data
 */
export async function calculateUnifiedState(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_unified_state", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to calculate unified state: ${error.message}`);

  return data?.[0] || null;
}

/**
 * Record unified state snapshot
 */
export async function recordUnifiedState(args: {
  tenantId: string;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_unified_state", {
    p_tenant_id: args.tenantId,
    p_notes: args.notes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record unified state: ${error.message}`);

  return data;
}

/**
 * List unified state snapshots
 */
export async function listUnifiedState(
  tenantId: string,
  filters?: {
    category?: FounderStateCategory;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<UnifiedState[]> {
  const { data, error } = await supabaseAdmin.rpc("list_unified_state", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list unified state: ${error.message}`);

  return data || [];
}

/**
 * Get unified state summary
 */
export async function getUnifiedStateSummary(
  tenantId: string,
  days: number = 7
): Promise<UnifiedStateSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_unified_state_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get unified state summary: ${error.message}`);

  return data?.[0] || null;
}
