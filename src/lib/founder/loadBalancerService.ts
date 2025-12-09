/**
 * @fileoverview F03 Founder Stress Load Balancer Service
 * Server-side only service for founder load tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("loadBalancerService must only run on server");
}

export type LoadSource =
  | "task_volume"
  | "decision_complexity"
  | "time_pressure"
  | "cognitive_load"
  | "external_interrupt"
  | "other";

/**
 * Record load event
 */
export async function recordLoadEvent(args: {
  tenantId: string;
  streamCode?: string;
  loadSource?: LoadSource;
  perceivedLoad?: number;
  calculatedLoad?: number;
  resolution?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_load_event", {
    p_tenant_id: args.tenantId,
    p_stream_code: args.streamCode || null,
    p_load_source: args.loadSource || "other",
    p_perceived_load: args.perceivedLoad ?? null,
    p_calculated_load: args.calculatedLoad ?? null,
    p_resolution: args.resolution || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record load event: ${error.message}`);
  return data;
}

/**
 * List load events
 */
export async function listLoadEvents(
  tenantId: string,
  filters?: {
    streamCode?: string;
    loadSource?: LoadSource;
    hours?: number;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_load_events", {
    p_tenant_id: tenantId,
    p_stream_code: filters?.streamCode || null,
    p_load_source: filters?.loadSource || null,
    p_hours: filters?.hours || 24,
    p_limit: filters?.limit || 500,
  });

  if (error) throw new Error(`Failed to list load events: ${error.message}`);
  return data || [];
}

/**
 * Get load summary
 */
export async function getLoadSummary(tenantId: string, hours: number = 24): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_load_summary", {
    p_tenant_id: tenantId,
    p_hours: hours,
  });

  if (error) throw new Error(`Failed to get load summary: ${error.message}`);
  return data || {};
}

/**
 * Get stream load (specific stream stats)
 */
export async function getStreamLoad(
  tenantId: string,
  streamCode: string,
  hours: number = 24
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_stream_load", {
    p_tenant_id: tenantId,
    p_stream_code: streamCode,
    p_hours: hours,
  });

  if (error) throw new Error(`Failed to get stream load: ${error.message}`);
  return data || {};
}
