/**
 * Founder Momentum Service (F20)
 * Tracks directional momentum based on multi-phase trends
 */

if (typeof window !== "undefined") {
  throw new Error("momentumService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type MomentumDirection =
  | "accelerating_up"
  | "trending_up"
  | "stable"
  | "trending_down"
  | "accelerating_down"
  | "volatile";

export type MomentumIndex = {
  id: string;
  momentum_score: number;
  momentum_direction: MomentumDirection;
  velocity: number | null;
  acceleration: number | null;
  trajectory_angle: number | null;
  contributing_signals: Record<string, any>;
  positive_signals: number | null;
  negative_signals: number | null;
  mixed_signals: number | null;
  confidence_level: number | null;
  key_drivers: string[] | null;
  momentum_sustainers: string[] | null;
  momentum_drains: string[] | null;
  created_at: string;
};

export type MomentumSummary = {
  avg_momentum: number;
  avg_velocity: number;
  current_direction: string;
  trend: string;
  period_days: number;
};

/**
 * Calculate current momentum
 */
export async function calculateMomentum(
  tenantId: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("calculate_momentum", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to calculate momentum: ${error.message}`);
}

  return data;
}

/**
 * List momentum index records
 */
export async function listMomentumIndex(
  tenantId: string,
  filters?: {
    direction?: MomentumDirection;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<MomentumIndex[]> {
  const { data, error } = await supabaseAdmin.rpc("list_momentum_index", {
    p_tenant_id: tenantId,
    p_direction: filters?.direction || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
throw new Error(`Failed to list momentum index: ${error.message}`);
}

  return data || [];
}

/**
 * Get momentum summary
 */
export async function getMomentumSummary(
  tenantId: string,
  days: number = 7
): Promise<MomentumSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_momentum_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
throw new Error(`Failed to get momentum summary: ${error.message}`);
}

  return data || null;
}
