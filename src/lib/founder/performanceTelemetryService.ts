/**
 * @fileoverview F08 Founder Performance Telemetry Service
 * Server-side only service for performance metrics management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("performanceTelemetryService must only run on server");
}

export type TelemetryMetricCode =
  | "focus_score"
  | "distraction_resistance"
  | "time_block_adherence"
  | "ops_efficiency"
  | "load_balance"
  | "priority_accuracy"
  | "task_completion_rate"
  | "energy_management"
  | "overall_performance";

export type TelemetryTrend = "improving" | "stable" | "declining" | "volatile";

/**
 * Record performance metric
 */
export async function recordPerformanceMetric(args: {
  tenantId: string;
  metricCode: TelemetryMetricCode;
  value: number;
  trend?: TelemetryTrend;
  rationale?: string;
  confidence?: number;
  signalsUsed?: string[];
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_performance_metric", {
    p_tenant_id: args.tenantId,
    p_metric_code: args.metricCode,
    p_value: args.value,
    p_trend: args.trend || null,
    p_rationale: args.rationale || null,
    p_confidence: args.confidence ?? null,
    p_signals_used: args.signalsUsed || [],
    p_period_start: args.periodStart?.toISOString() || null,
    p_period_end: args.periodEnd?.toISOString() || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record performance metric: ${error.message}`);
  return data;
}

/**
 * List performance metrics
 */
export async function listPerformanceMetrics(
  tenantId: string,
  filters?: {
    metricCode?: TelemetryMetricCode;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_performance_metrics", {
    p_tenant_id: tenantId,
    p_metric_code: filters?.metricCode || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list performance metrics: ${error.message}`);
  return data || [];
}

/**
 * Get performance summary
 */
export async function getPerformanceSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_performance_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get performance summary: ${error.message}`);
  return data || {};
}

/**
 * Get metric history
 */
export async function getMetricHistory(
  tenantId: string,
  metricCode: TelemetryMetricCode,
  days: number = 30
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_metric_history", {
    p_tenant_id: tenantId,
    p_metric_code: metricCode,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get metric history: ${error.message}`);
  return data || {};
}
