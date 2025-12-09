/**
 * Autonomous Founder Stability Guard Service (F16)
 * Anomaly detection, alerting, and autonomous interventions
 */

if (typeof window !== "undefined") {
  throw new Error("stabilityGuardService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AlertType =
  | "decline"
  | "burnout_risk"
  | "overload"
  | "conflict"
  | "instability"
  | "pattern_break"
  | "recovery_failure"
  | "forecast_alarm";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

export type StabilityAlert = {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  severity_score: number;
  detection_method: string;
  confidence_score: number;
  trigger_source: string;
  recommended_interventions: string[];
  urgency_level: string;
  detected_at: string;
  resolved_at: string | null;
  time_to_resolve_hours: number | null;
};

export type AlertSummary = {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  avg_resolution_hours: number;
  unresolved_critical_count: number;
};

/**
 * Detect stability anomalies
 */
export async function detectStabilityAnomalies(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("detect_stability_anomalies", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to detect stability anomalies: ${error.message}`);

  return data || [];
}

/**
 * Record stability alert
 */
export async function recordStabilityAlert(args: {
  tenantId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  severityScore: number;
  detectionMethod?: string;
  confidenceScore?: number;
  triggerSource?: string;
  triggerData?: Record<string, any>;
  recommendedInterventions?: string[];
  urgencyLevel?: string;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_stability_alert", {
    p_tenant_id: args.tenantId,
    p_alert_type: args.alertType,
    p_severity: args.severity,
    p_title: args.title,
    p_description: args.description,
    p_severity_score: args.severityScore,
    p_detection_method: args.detectionMethod || null,
    p_confidence_score: args.confidenceScore || null,
    p_trigger_source: args.triggerSource || null,
    p_trigger_data: args.triggerData || {},
    p_recommended_interventions: args.recommendedInterventions || [],
    p_urgency_level: args.urgencyLevel || null,
  });

  if (error) throw new Error(`Failed to record stability alert: ${error.message}`);

  return data;
}

/**
 * List stability alerts
 */
export async function listStabilityAlerts(
  tenantId: string,
  filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    limit?: number;
  }
): Promise<StabilityAlert[]> {
  const { data, error } = await supabaseAdmin.rpc("list_stability_alerts", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
    p_severity: filters?.severity || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list stability alerts: ${error.message}`);

  return data || [];
}

/**
 * Get alert summary
 */
export async function getAlertSummary(
  tenantId: string,
  days: number = 7
): Promise<AlertSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_alert_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get alert summary: ${error.message}`);

  return data?.[0] || null;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  newStatus: AlertStatus,
  resolutionNotes?: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("update_alert_status", {
    p_alert_id: alertId,
    p_new_status: newStatus,
    p_resolution_notes: resolutionNotes || null,
  });

  if (error) throw new Error(`Failed to update alert status: ${error.message}`);

  return data === true;
}

/**
 * Run automated anomaly detection and create alerts
 */
export async function runAutomatedDetection(tenantId: string): Promise<number> {
  const anomalies = await detectStabilityAnomalies(tenantId);

  let alertCount = 0;
  for (const anomaly of anomalies) {
    await recordStabilityAlert({
      tenantId,
      alertType: anomaly.alert_type,
      severity: anomaly.severity,
      title: anomaly.title,
      description: anomaly.description,
      severityScore: anomaly.severity_score,
      detectionMethod: anomaly.detection_method,
      confidenceScore: anomaly.confidence_score,
      triggerSource: anomaly.trigger_source,
      triggerData: anomaly.trigger_data,
      recommendedInterventions: anomaly.recommended_interventions,
      urgencyLevel: anomaly.urgency_level,
    });
    alertCount++;
  }

  return alertCount;
}
