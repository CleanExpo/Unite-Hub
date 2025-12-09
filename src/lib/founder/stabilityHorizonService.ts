/**
 * Founder Stability Horizon Service (F21)
 * Predicts future stability risks based on multi-phase leading indicators
 */

if (typeof window !== "undefined") {
  throw new Error("stabilityHorizonService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type HorizonWindow = '24h' | '72h' | '7d' | '14d' | '30d';
export type PredictedRisk = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

export type StabilityHorizon = {
  id: string;
  horizon_window: HorizonWindow;
  predicted_risk: PredictedRisk;
  risk_score: number;
  leading_signals: Record<string, any>;
  signal_count: number;
  positive_indicators: number;
  negative_indicators: number;
  probability: number | null;
  confidence_level: number | null;
  risk_factors: Record<string, any> | null;
  protective_factors: Record<string, any> | null;
  intervention_suggestions: string[] | null;
  created_at: string;
};

export type HorizonSummary = {
  avg_risk_score: number;
  max_risk_score: number;
  critical_count: number;
  high_count: number;
  by_window: Record<string, number>;
  period_days: number;
};

/**
 * Calculate stability horizon forecast
 */
export async function calculateStabilityHorizon(args: {
  tenantId: string;
  horizonWindow?: HorizonWindow;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("calculate_stability_horizon", {
    p_tenant_id: args.tenantId,
    p_horizon_window: args.horizonWindow || '7d',
  });

  if (error) {
    throw new Error(`Failed to calculate stability horizon: ${error.message}`);
  }

  return data;
}

/**
 * List stability horizon forecasts
 */
export async function listStabilityHorizon(
  tenantId: string,
  filters?: {
    horizonWindow?: HorizonWindow;
    riskLevel?: PredictedRisk;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<StabilityHorizon[]> {
  const { data, error } = await supabaseAdmin.rpc("list_stability_horizon", {
    p_tenant_id: tenantId,
    p_horizon_window: filters?.horizonWindow || null,
    p_risk_level: filters?.riskLevel || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
    throw new Error(`Failed to list stability horizon: ${error.message}`);
  }

  return data || [];
}

/**
 * Get stability horizon summary
 */
export async function getStabilityHorizonSummary(
  tenantId: string,
  days: number = 7
): Promise<HorizonSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_stability_horizon_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get stability horizon summary: ${error.message}`);
  }

  return data || null;
}
