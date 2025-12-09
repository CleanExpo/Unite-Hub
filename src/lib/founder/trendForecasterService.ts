/**
 * Founder Trend Forecaster Service (F15)
 * Predictive time-series analysis from F09-F14 historical data
 */

if (typeof window !== "undefined") {
  throw new Error("trendForecasterService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ForecastWindow = "24h" | "7d" | "30d";
export type ForecastCategory = "improving" | "stable" | "declining" | "critical";

export type TrendForecast = {
  id: string;
  forecast_window: ForecastWindow;
  forecast_category: ForecastCategory;
  current_score: number;
  predicted_score: number;
  predicted_change: number;
  predicted_change_pct: number;
  confidence_score: number;
  prediction_method: string;
  data_points_count: number;
  trend_direction: string;
  trend_strength: number;
  volatility_factor: number;
  risk_factors: any[];
  recommended_actions: string[];
  urgency_level: string;
  notes: string | null;
  forecast_generated_at: string;
  forecast_target_date: string;
};

export type ForecastSummary = {
  forecast_24h: {
    category: ForecastCategory;
    predicted_score: number;
    change: number;
    confidence: number;
  } | null;
  forecast_7d: {
    category: ForecastCategory;
    predicted_score: number;
    change: number;
    confidence: number;
  } | null;
  forecast_30d: {
    category: ForecastCategory;
    predicted_score: number;
    change: number;
    confidence: number;
  } | null;
  overall_trend: string;
  confidence_avg: number;
};

/**
 * Generate trend forecast
 */
export async function generateTrendForecast(
  tenantId: string,
  window: ForecastWindow = "7d"
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("generate_trend_forecast", {
    p_tenant_id: tenantId,
    p_window: window,
  });

  if (error) throw new Error(`Failed to generate trend forecast: ${error.message}`);

  return data?.[0] || null;
}

/**
 * Record trend forecast
 */
export async function recordTrendForecast(args: {
  tenantId: string;
  window?: ForecastWindow;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_trend_forecast", {
    p_tenant_id: args.tenantId,
    p_window: args.window || "7d",
    p_notes: args.notes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record trend forecast: ${error.message}`);

  return data;
}

/**
 * List trend forecasts
 */
export async function listTrendForecasts(
  tenantId: string,
  filters?: {
    window?: ForecastWindow;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<TrendForecast[]> {
  const { data, error } = await supabaseAdmin.rpc("list_trend_forecasts", {
    p_tenant_id: tenantId,
    p_window: filters?.window || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list trend forecasts: ${error.message}`);

  return data || [];
}

/**
 * Get forecast summary
 */
export async function getForecastSummary(tenantId: string): Promise<ForecastSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_forecast_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get forecast summary: ${error.message}`);

  return data?.[0] || null;
}
