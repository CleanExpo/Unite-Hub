/**
 * @fileoverview F05 Founder Focus Engine Service
 * Server-side only service for focus session management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("focusEngineService must only run on server");
}

export type FocusCategory =
  | "deep_work"
  | "strategic_thinking"
  | "review"
  | "admin"
  | "sales"
  | "meetings"
  | "learning"
  | "other";

export type FocusStatus = "planned" | "active" | "completed" | "abandoned";

/**
 * Record focus session
 */
export async function recordFocusSession(args: {
  tenantId: string;
  label: string;
  category?: FocusCategory;
  status?: FocusStatus;
  depthScore?: number;
  plannedStart?: Date;
  plannedEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  interruptions?: number;
  outcomeNotes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_focus_session", {
    p_tenant_id: args.tenantId,
    p_label: args.label,
    p_category: args.category || "other",
    p_status: args.status || "planned",
    p_depth_score: args.depthScore ?? null,
    p_planned_start: args.plannedStart?.toISOString() || null,
    p_planned_end: args.plannedEnd?.toISOString() || null,
    p_actual_start: args.actualStart?.toISOString() || null,
    p_actual_end: args.actualEnd?.toISOString() || null,
    p_interruptions: args.interruptions ?? 0,
    p_outcome_notes: args.outcomeNotes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record focus session: ${error.message}`);
  return data;
}

/**
 * Update focus session
 */
export async function updateFocusSession(args: {
  sessionId: string;
  status?: FocusStatus;
  depthScore?: number;
  actualStart?: Date;
  actualEnd?: Date;
  interruptions?: number;
  outcomeNotes?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_focus_session", {
    p_session_id: args.sessionId,
    p_status: args.status || null,
    p_depth_score: args.depthScore ?? null,
    p_actual_start: args.actualStart?.toISOString() || null,
    p_actual_end: args.actualEnd?.toISOString() || null,
    p_interruptions: args.interruptions ?? null,
    p_outcome_notes: args.outcomeNotes || null,
  });

  if (error) throw new Error(`Failed to update focus session: ${error.message}`);
}

/**
 * List focus sessions
 */
export async function listFocusSessions(
  tenantId: string,
  filters?: {
    category?: FocusCategory;
    status?: FocusStatus;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_focus_sessions", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_status: filters?.status || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list focus sessions: ${error.message}`);
  return data || [];
}

/**
 * Get focus summary
 */
export async function getFocusSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_focus_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get focus summary: ${error.message}`);
  return data || {};
}
