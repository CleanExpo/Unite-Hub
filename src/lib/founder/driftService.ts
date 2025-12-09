/**
 * E39: Drift Detector Service
 * Configuration, behavioral, and schema drift detection
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("driftService must only run on server");
}

export type DriftType = "configuration" | "behavioral" | "schema" | "performance" | "security" | "compliance" | "other";
export type DriftSeverity = "low" | "medium" | "high" | "critical";
export type DriftStatus = "detected" | "acknowledged" | "resolved" | "ignored";

export async function listDriftEvents(
  tenantId: string,
  filters?: {
    driftType?: DriftType;
    status?: DriftStatus;
    severity?: DriftSeverity;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_drift_events", {
    p_tenant_id: tenantId,
    p_drift_type: filters?.driftType || null,
    p_status: filters?.status || null,
    p_severity: filters?.severity || null,
  });

  if (error) throw new Error(`Failed to list drift events: ${error.message}`);
  return data;
}

export async function recordDriftEvent(args: {
  tenantId: string;
  driftType: DriftType;
  severity: DriftSeverity;
  title: string;
  description?: string;
  expectedValue?: string;
  actualValue?: string;
  metadata?: any;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_drift_event", {
    p_tenant_id: args.tenantId,
    p_drift_type: args.driftType,
    p_severity: args.severity,
    p_title: args.title,
    p_description: args.description || null,
    p_expected_value: args.expectedValue || null,
    p_actual_value: args.actualValue || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record drift event: ${error.message}`);
  return data;
}

export async function updateDriftStatus(
  eventId: string,
  status: DriftStatus
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_drift_status", {
    p_event_id: eventId,
    p_status: status,
  });

  if (error) throw new Error(`Failed to update drift status: ${error.message}`);
}

export async function getDriftSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_drift_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get drift summary: ${error.message}`);
  return data;
}
