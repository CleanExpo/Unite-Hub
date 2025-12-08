/**
 * E41: Governance Forecast Service
 * Predictive governance forecasting
 */

import { supabaseAdmin } from "@/lib/supabase";

if (typeof window !== "undefined") {
  throw new Error("governanceForecastService must only run on server");
}

export type ForecastType =
  | "compliance_score"
  | "risk_score"
  | "incident_rate"
  | "debt_accumulation"
  | "remediation_backlog"
  | "system_load"
  | "user_satisfaction"
  | "other";

export type ForecastHorizon = "1_day" | "7_days" | "30_days" | "90_days" | "1_year";
export type ForecastMethod = "heuristic" | "linear_regression" | "time_series" | "ml_model" | "manual";

export async function listForecasts(
  tenantId: string,
  includeExpired: boolean = false
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_forecasts", {
    p_tenant_id: tenantId,
    p_include_expired: includeExpired,
  });

  if (error) throw new Error(`Failed to list forecasts: ${error.message}`);
  return data;
}

export async function getLatestForecasts(
  tenantId: string,
  forecastType?: ForecastType
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("get_latest_forecasts", {
    p_tenant_id: tenantId,
    p_forecast_type: forecastType || null,
  });

  if (error) throw new Error(`Failed to get latest forecasts: ${error.message}`);
  return data;
}

export async function recordForecast(args: {
  tenantId: string;
  forecastType: ForecastType;
  forecastHorizon: ForecastHorizon;
  forecastMethod: ForecastMethod;
  forecastValue: number;
  confidence?: number;
  lowerBound?: number;
  upperBound?: number;
  metadata?: any;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_forecast", {
    p_tenant_id: args.tenantId,
    p_forecast_type: args.forecastType,
    p_forecast_horizon: args.forecastHorizon,
    p_forecast_method: args.forecastMethod,
    p_forecast_value: args.forecastValue,
    p_confidence: args.confidence || null,
    p_lower_bound: args.lowerBound || null,
    p_upper_bound: args.upperBound || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record forecast: ${error.message}`);
  return data;
}

export async function getForecastAccuracy(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_forecast_accuracy", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get forecast accuracy: ${error.message}`);
  return data;
}
