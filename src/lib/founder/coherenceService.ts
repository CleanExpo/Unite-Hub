/**
 * @fileoverview E46 Coherence Matrix Service
 * Server-side only service for system-of-systems coherence tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("coherenceService must only run on server");
}

export type CoherenceEdgeType =
  | "api_dependency"
  | "data_flow"
  | "event_subscription"
  | "shared_resource"
  | "logical_coupling"
  | "other";

export type CoherenceHealth =
  | "aligned"
  | "minor_drift"
  | "major_drift"
  | "critical_mismatch"
  | "unknown";

/**
 * List coherence nodes (subsystems)
 */
export async function listCoherenceNodes(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_coherence_nodes", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to list coherence nodes: ${error.message}`);
  return data || [];
}

/**
 * List coherence edges (relationships)
 */
export async function listCoherenceEdges(
  tenantId: string,
  filters?: { health?: CoherenceHealth; limit?: number }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_coherence_edges", {
    p_tenant_id: tenantId,
    p_health: filters?.health || null,
    p_limit: filters?.limit || 300,
  });

  if (error) throw new Error(`Failed to list coherence edges: ${error.message}`);
  return data || [];
}

/**
 * Record coherence node (upsert)
 */
export async function recordCoherenceNode(args: {
  tenantId: string;
  systemCode: string;
  systemName: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_coherence_node", {
    p_tenant_id: args.tenantId,
    p_system_code: args.systemCode,
    p_system_name: args.systemName,
    p_description: args.description || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record coherence node: ${error.message}`);
  return data;
}

/**
 * Record coherence edge (upsert)
 */
export async function recordCoherenceEdge(args: {
  tenantId: string;
  sourceSystem: string;
  targetSystem: string;
  edgeType: CoherenceEdgeType;
  coherenceScore?: number;
  driftScore?: number;
  health?: CoherenceHealth;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_coherence_edge", {
    p_tenant_id: args.tenantId,
    p_source_system: args.sourceSystem,
    p_target_system: args.targetSystem,
    p_edge_type: args.edgeType,
    p_coherence_score: args.coherenceScore ?? null,
    p_drift_score: args.driftScore ?? null,
    p_health: args.health || "unknown",
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record coherence edge: ${error.message}`);
  return data;
}

/**
 * Get coherence summary
 */
export async function getCoherenceSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_coherence_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get coherence summary: ${error.message}`);
  return data || {};
}
