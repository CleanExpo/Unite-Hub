/**
 * @fileoverview E42 Founder Reality Map Service
 * Server-side only service for reality panel management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("realityMapService must only run on server");
}

export type RealityPanelStatus = "active" | "archived";
export type RealityLevel = "healthy" | "watch" | "stress" | "critical" | "unknown";

/**
 * List reality panels
 */
export async function listRealityPanels(
  tenantId: string,
  filters?: { status?: RealityPanelStatus }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_reality_panels", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
  });

  if (error) throw new Error(`Failed to list reality panels: ${error.message}`);
  return data || [];
}

/**
 * Get latest reality snapshots (one per panel)
 */
export async function getLatestRealitySnapshots(
  tenantId: string,
  panelCode?: string
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("get_latest_reality_snapshots", {
    p_tenant_id: tenantId,
    p_panel_code: panelCode || null,
  });

  if (error) throw new Error(`Failed to get latest snapshots: ${error.message}`);
  return data || [];
}

/**
 * Record reality panel (upsert)
 */
export async function recordRealityPanel(args: {
  tenantId: string;
  code: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_reality_panel", {
    p_tenant_id: args.tenantId,
    p_code: args.code,
    p_title: args.title,
    p_description: args.description || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record reality panel: ${error.message}`);
  return data;
}

/**
 * Record reality snapshot
 */
export async function recordRealitySnapshot(args: {
  tenantId: string;
  panelCode: string;
  score?: number;
  level?: RealityLevel;
  summary?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_reality_snapshot", {
    p_tenant_id: args.tenantId,
    p_panel_code: args.panelCode,
    p_score: args.score ?? null,
    p_level: args.level || "unknown",
    p_summary: args.summary || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record reality snapshot: ${error.message}`);
  return data;
}

/**
 * Get reality map summary
 */
export async function getRealityMapSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_reality_map_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get reality map summary: ${error.message}`);
  return data || {};
}
