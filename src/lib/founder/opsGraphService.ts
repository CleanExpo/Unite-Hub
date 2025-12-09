/**
 * @fileoverview F01 Founder Daily Ops Graph Service
 * Server-side only service for operational graph management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("opsGraphService must only run on server");
}

export type OpsNodeCategory =
  | "inbox"
  | "decision"
  | "review"
  | "approval"
  | "monitor"
  | "action"
  | "meeting"
  | "other";

export type OpsNodeState = "active" | "pending" | "completed" | "blocked" | "deferred";

/**
 * List ops streams
 */
export async function listOpsStreams(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_ops_streams", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to list ops streams: ${error.message}`);
  return data || [];
}

/**
 * List ops nodes
 */
export async function listOpsNodes(
  tenantId: string,
  filters?: {
    streamCode?: string;
    state?: OpsNodeState;
    category?: OpsNodeCategory;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_ops_nodes", {
    p_tenant_id: tenantId,
    p_stream_code: filters?.streamCode || null,
    p_state: filters?.state || null,
    p_category: filters?.category || null,
    p_limit: filters?.limit || 500,
  });

  if (error) throw new Error(`Failed to list ops nodes: ${error.message}`);
  return data || [];
}

/**
 * Record ops stream
 */
export async function recordOpsStream(args: {
  tenantId: string;
  streamCode: string;
  streamName: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_ops_stream", {
    p_tenant_id: args.tenantId,
    p_stream_code: args.streamCode,
    p_stream_name: args.streamName,
    p_description: args.description || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record ops stream: ${error.message}`);
  return data;
}

/**
 * Record ops node
 */
export async function recordOpsNode(args: {
  tenantId: string;
  streamCode: string;
  nodeCode: string;
  label: string;
  category?: OpsNodeCategory;
  state?: OpsNodeState;
  importance?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_ops_node", {
    p_tenant_id: args.tenantId,
    p_stream_code: args.streamCode,
    p_node_code: args.nodeCode,
    p_label: args.label,
    p_category: args.category || "other",
    p_state: args.state || "active",
    p_importance: args.importance || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record ops node: ${error.message}`);
  return data;
}

/**
 * Get ops summary
 */
export async function getOpsSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_ops_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get ops summary: ${error.message}`);
  return data || {};
}
