/**
 * E38: Founder Observatory Service
 * Meta-system operational signals
 */

import { supabaseAdmin } from "@/lib/supabase";

if (typeof window !== "undefined") {
  throw new Error("observatoryService must only run on server");
}

export type ObservatoryEventType =
  | "performance_spike"
  | "load_spike"
  | "friction_detected"
  | "decay_signal"
  | "anomaly_detected"
  | "system_health"
  | "user_experience"
  | "other";

export type ObservatorySeverity = "info" | "low" | "medium" | "high" | "critical";

export async function listObservatoryEvents(
  tenantId: string,
  filters?: {
    eventType?: ObservatoryEventType;
    severity?: ObservatorySeverity;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_observatory_events", {
    p_tenant_id: tenantId,
    p_event_type: filters?.eventType || null,
    p_severity: filters?.severity || null,
    p_limit: filters?.limit || 100,
  });

  if (error) throw new Error(`Failed to list observatory events: ${error.message}`);
  return data;
}

export async function recordObservatoryEvent(args: {
  tenantId: string;
  eventType: ObservatoryEventType;
  severity?: ObservatorySeverity;
  value?: number;
  description?: string;
  metadata?: any;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_observatory_event", {
    p_tenant_id: args.tenantId,
    p_event_type: args.eventType,
    p_severity: args.severity || "info",
    p_value: args.value || null,
    p_description: args.description || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record observatory event: ${error.message}`);
  return data;
}

export async function getObservatorySummary(
  tenantId: string,
  days: number = 7
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_observatory_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get observatory summary: ${error.message}`);
  return data;
}
