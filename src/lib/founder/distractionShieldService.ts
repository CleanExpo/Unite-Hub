/**
 * @fileoverview F06 Distraction Shield Service
 * Server-side only service for distraction event tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("distractionShieldService must only run on server");
}

export type DistractionSource =
  | "slack"
  | "email"
  | "phone"
  | "meeting"
  | "employee"
  | "client"
  | "internal_thought"
  | "notification"
  | "social_media"
  | "other";

export type DistractionSeverity = "low" | "medium" | "high" | "critical";

/**
 * Record distraction event
 */
export async function recordDistractionEvent(args: {
  tenantId: string;
  source: DistractionSource;
  severity?: DistractionSeverity;
  description?: string;
  context?: string;
  mitigationApplied?: string;
  recoveryTimeMins?: number;
  prevented?: boolean;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_distraction_event", {
    p_tenant_id: args.tenantId,
    p_source: args.source,
    p_severity: args.severity || "low",
    p_description: args.description || null,
    p_context: args.context || null,
    p_mitigation_applied: args.mitigationApplied || null,
    p_recovery_time_mins: args.recoveryTimeMins ?? null,
    p_prevented: args.prevented ?? false,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record distraction event: ${error.message}`);
  return data;
}

/**
 * List distraction events
 */
export async function listDistractionEvents(
  tenantId: string,
  filters?: {
    source?: DistractionSource;
    severity?: DistractionSeverity;
    prevented?: boolean;
    hours?: number;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_distraction_events", {
    p_tenant_id: tenantId,
    p_source: filters?.source || null,
    p_severity: filters?.severity || null,
    p_prevented: filters?.prevented ?? null,
    p_hours: filters?.hours || 24,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list distraction events: ${error.message}`);
  return data || [];
}

/**
 * Get distraction summary
 */
export async function getDistractionSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_distraction_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get distraction summary: ${error.message}`);
  return data || {};
}
