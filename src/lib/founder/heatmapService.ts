/**
 * E37: Founder Heatmap Service
 * Temporal heatmaps of governance activity
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("heatmapService must only run on server");
}

export type HeatmapEventType =
  | "audit_log"
  | "sla_incident"
  | "risk_event"
  | "debt_created"
  | "remediation_task"
  | "security_alert"
  | "compliance_violation"
  | "other";

export interface HeatmapItem {
  id: string;
  tenant_id: string;
  event_type: HeatmapEventType;
  event_date: string;
  count: number;
  metadata?: any;
  computed_at: string;
}

/**
 * Get heatmap data for date range
 */
export async function getHeatmapData(
  tenantId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    eventTypes?: HeatmapEventType[];
  }
): Promise<HeatmapItem[]> {
  const { data, error } = await supabaseAdmin.rpc("get_heatmap_data", {
    p_tenant_id: tenantId,
    p_start_date: options?.startDate || null,
    p_end_date: options?.endDate || null,
    p_event_types: options?.eventTypes || null,
  });

  if (error) throw new Error(`Failed to get heatmap data: ${error.message}`);
  return data as HeatmapItem[];
}

/**
 * Compute daily heatmap for specific date
 */
export async function computeDailyHeatmap(
  tenantId: string,
  targetDate?: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("compute_daily_heatmap", {
    p_tenant_id: tenantId,
    p_target_date: targetDate || null,
  });

  if (error) throw new Error(`Failed to compute daily heatmap: ${error.message}`);
  return data;
}

/**
 * Compute heatmap for date range
 */
export async function computeHeatmapRange(
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("compute_heatmap_range", {
    p_tenant_id: tenantId,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) throw new Error(`Failed to compute heatmap range: ${error.message}`);
  return data;
}

/**
 * Record heatmap event manually
 */
export async function recordHeatmapEvent(
  tenantId: string,
  eventType: HeatmapEventType,
  eventDate: string,
  count: number = 1,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_heatmap_event", {
    p_tenant_id: tenantId,
    p_event_type: eventType,
    p_event_date: eventDate,
    p_count: count,
    p_metadata: metadata || {},
  });

  if (error) throw new Error(`Failed to record heatmap event: ${error.message}`);
  return data as string; // UUID
}

/**
 * List raw heatmap items
 */
export async function listHeatmapItems(tenantId: string): Promise<HeatmapItem[]> {
  const { data, error } = await supabaseAdmin
    .from("founder_heatmap")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("event_date", { ascending: true });

  if (error) throw new Error(`Failed to list heatmap items: ${error.message}`);
  return data as HeatmapItem[];
}
