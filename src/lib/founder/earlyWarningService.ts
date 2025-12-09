/**
 * E40: Early Warning Service
 * Critical system telemetry and early warning signals
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("earlyWarningService must only run on server");
}

export type WarningSignalType =
  | "resource_exhaustion"
  | "capacity_threshold"
  | "error_rate_spike"
  | "latency_degradation"
  | "security_anomaly"
  | "compliance_breach"
  | "data_quality"
  | "system_degradation"
  | "other";

export type WarningRiskLevel = "info" | "watch" | "alert" | "critical";
export type WarningStatus = "active" | "acknowledged" | "mitigated" | "resolved";

export async function listWarningEvents(
  tenantId: string,
  filters?: {
    signalType?: WarningSignalType;
    riskLevel?: WarningRiskLevel;
    status?: WarningStatus;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_warning_events", {
    p_tenant_id: tenantId,
    p_signal_type: filters?.signalType || null,
    p_risk_level: filters?.riskLevel || null,
    p_status: filters?.status || null,
  });

  if (error) throw new Error(`Failed to list warning events: ${error.message}`);
  return data;
}

export async function recordWarningEvent(args: {
  tenantId: string;
  signalType: WarningSignalType;
  riskLevel: WarningRiskLevel;
  title: string;
  details?: string;
  thresholdValue?: number;
  actualValue?: number;
  metadata?: any;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_warning_event", {
    p_tenant_id: args.tenantId,
    p_signal_type: args.signalType,
    p_risk_level: args.riskLevel,
    p_title: args.title,
    p_details: args.details || null,
    p_threshold_value: args.thresholdValue || null,
    p_actual_value: args.actualValue || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record warning event: ${error.message}`);
  return data;
}

export async function updateWarningStatus(
  eventId: string,
  status: WarningStatus
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_warning_status", {
    p_event_id: eventId,
    p_status: status,
  });

  if (error) throw new Error(`Failed to update warning status: ${error.message}`);
}

export async function getWarningSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_warning_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get warning summary: ${error.message}`);
  return data;
}
