/**
 * @fileoverview E47 Runtime Integrity Sentinel Service
 * Server-side only service for runtime integrity event tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("runtimeIntegrityService must only run on server");
}

export type IntegrityViolationType =
  | "unexpected_state"
  | "api_violation"
  | "latency_spike"
  | "permission_mismatch"
  | "data_integrity"
  | "security_breach"
  | "rate_limit_exceeded"
  | "resource_leak"
  | "other";

export type IntegritySeverity = "low" | "medium" | "high" | "critical";
export type IntegrityStatus = "detected" | "investigating" | "mitigated" | "resolved" | "false_positive";

/**
 * List integrity events
 */
export async function listIntegrityEvents(
  tenantId: string,
  filters?: {
    subsystem?: string;
    severity?: IntegritySeverity;
    status?: IntegrityStatus;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_integrity_events", {
    p_tenant_id: tenantId,
    p_subsystem: filters?.subsystem || null,
    p_severity: filters?.severity || null,
    p_status: filters?.status || null,
    p_limit: filters?.limit || 300,
  });

  if (error) throw new Error(`Failed to list integrity events: ${error.message}`);
  return data || [];
}

/**
 * Record integrity event
 */
export async function recordIntegrityEvent(args: {
  tenantId: string;
  subsystem: string;
  violationType: IntegrityViolationType;
  severity: IntegritySeverity;
  title?: string;
  details?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_integrity_event", {
    p_tenant_id: args.tenantId,
    p_subsystem: args.subsystem,
    p_violation_type: args.violationType,
    p_severity: args.severity,
    p_title: args.title || null,
    p_details: args.details || null,
    p_stack_trace: args.stackTrace || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record integrity event: ${error.message}`);
  return data;
}

/**
 * Update integrity event status
 */
export async function updateIntegrityEventStatus(
  eventId: string,
  status: IntegrityStatus
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_integrity_event_status", {
    p_event_id: eventId,
    p_status: status,
  });

  if (error) throw new Error(`Failed to update integrity event status: ${error.message}`);
}

/**
 * Get integrity summary
 */
export async function getIntegritySummary(tenantId: string, hours: number = 24): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_integrity_summary", {
    p_tenant_id: tenantId,
    p_hours: hours,
  });

  if (error) throw new Error(`Failed to get integrity summary: ${error.message}`);
  return data || {};
}
