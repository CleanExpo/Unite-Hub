/**
 * @fileoverview E49 Longitudinal Founder Trend Engine Service
 * Server-side only service for trend metric tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("trendService must only run on server");
}

export type TrendWindow = "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type TrendDirection = "improving" | "stable" | "declining" | "volatile" | "unknown";

/**
 * List trend metrics
 */
export async function listTrendMetrics(
  tenantId: string,
  filters?: {
    metricCode?: string;
    window?: TrendWindow;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_trend_metrics", {
    p_tenant_id: tenantId,
    p_metric_code: filters?.metricCode || null,
    p_time_window: filters?.window || null,
    p_limit: filters?.limit || 500,
  });

  if (error) throw new Error(`Failed to list trend metrics: ${error.message}`);
  return data || [];
}

/**
 * Record trend metric
 */
export async function recordTrendMetric(args: {
  tenantId: string;
  metricCode: string;
  metricName: string;
  value: number;
  window?: TrendWindow;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_trend_metric", {
    p_tenant_id: args.tenantId,
    p_metric_code: args.metricCode,
    p_metric_name: args.metricName,
    p_value: args.value,
    p_time_window: args.window || "daily",
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record trend metric: ${error.message}`);
  return data;
}

/**
 * Get trend summary
 */
export async function getTrendSummary(tenantId: string, days: number = 30): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_trend_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get trend summary: ${error.message}`);
  return data || {};
}

/**
 * Get metric trend (detailed stats for one metric)
 */
export async function getMetricTrend(
  tenantId: string,
  metricCode: string,
  days: number = 30
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_metric_trend", {
    p_tenant_id: tenantId,
    p_metric_code: metricCode,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get metric trend: ${error.message}`);
  return data || {};
}
