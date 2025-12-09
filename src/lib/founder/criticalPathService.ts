/**
 * @fileoverview E45 Critical Path Engine Service
 * Server-side only service for critical path and node management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("criticalPathService must only run on server");
}

export type CriticalPathStatus = "planning" | "active" | "blocked" | "done" | "cancelled";
export type CriticalNodeState = "pending" | "in_progress" | "blocked" | "done" | "skipped";

/**
 * List critical paths
 */
export async function listCriticalPaths(
  tenantId: string,
  filters?: { status?: CriticalPathStatus }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_critical_paths", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
  });

  if (error) throw new Error(`Failed to list critical paths: ${error.message}`);
  return data || [];
}

/**
 * List critical path nodes
 */
export async function listCriticalNodes(
  tenantId: string,
  pathCode: string
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_critical_nodes", {
    p_tenant_id: tenantId,
    p_path_code: pathCode,
  });

  if (error) throw new Error(`Failed to list critical nodes: ${error.message}`);
  return data || [];
}

/**
 * Record critical path (upsert)
 */
export async function recordCriticalPath(args: {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_critical_path", {
    p_tenant_id: args.tenantId,
    p_code: args.code,
    p_name: args.name,
    p_description: args.description || null,
    p_start_date: args.startDate || null,
    p_target_date: args.targetDate || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record critical path: ${error.message}`);
  return data;
}

/**
 * Record critical node (upsert)
 */
export async function recordCriticalNode(args: {
  tenantId: string;
  pathCode: string;
  nodeCode: string;
  label: string;
  description?: string;
  dependsOn?: string[];
  weight?: number;
  assignee?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_critical_node", {
    p_tenant_id: args.tenantId,
    p_path_code: args.pathCode,
    p_node_code: args.nodeCode,
    p_label: args.label,
    p_description: args.description || null,
    p_depends_on: args.dependsOn || [],
    p_weight: args.weight ?? 1.0,
    p_assignee: args.assignee || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record critical node: ${error.message}`);
  return data;
}

/**
 * Update node state
 */
export async function updateNodeState(
  nodeId: string,
  state: CriticalNodeState
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_node_state", {
    p_node_id: nodeId,
    p_state: state,
  });

  if (error) throw new Error(`Failed to update node state: ${error.message}`);
}

/**
 * Get critical path summary
 */
export async function getCriticalPathSummary(
  tenantId: string,
  pathCode: string
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_critical_path_summary", {
    p_tenant_id: tenantId,
    p_path_code: pathCode,
  });

  if (error) throw new Error(`Failed to get critical path summary: ${error.message}`);
  return data || {};
}
