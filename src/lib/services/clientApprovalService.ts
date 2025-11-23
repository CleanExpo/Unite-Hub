/**
 * Client Approval Service
 * Phase 35: Integrity Framework
 *
 * Manages the approval pipeline for AI-generated content
 */

import { getSupabaseServer } from "@/lib/supabase";

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ItemType = "concept" | "video" | "audio" | "copy" | "image" | "wireframe";

export interface ApprovalRequest {
  id: string;
  client_id: string;
  item_type: ItemType;
  item_id: string;
  status: ApprovalStatus;
  model_used: string;
  description: string | null;
  metadata: Record<string, unknown>;
  generated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

/**
 * Create a new approval request for AI-generated content
 */
export async function createApprovalRequest(
  itemType: ItemType,
  itemId: string,
  clientId: string,
  modelUsed: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<ApprovalRequest | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_approvals")
    .insert({
      client_id: clientId,
      item_type: itemType,
      item_id: itemId,
      model_used: modelUsed,
      description: description || null,
      metadata: metadata || {},
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating approval request:", error);
    return null;
  }

  return data as ApprovalRequest;
}

/**
 * Get all pending approvals for a client
 */
export async function getPendingApprovals(
  clientId: string
): Promise<ApprovalRequest[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_approvals")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "pending")
    .order("generated_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending approvals:", error);
    return [];
  }

  return data as ApprovalRequest[];
}

/**
 * Get all approvals for a client (all statuses)
 */
export async function getAllApprovals(
  clientId: string,
  status?: ApprovalStatus
): Promise<ApprovalRequest[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("client_approvals")
    .select("*")
    .eq("client_id", clientId)
    .order("generated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching approvals:", error);
    return [];
  }

  return data as ApprovalRequest[];
}

/**
 * Approve an item
 */
export async function approveItem(
  approvalId: string,
  clientId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_approvals")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("client_id", clientId);

  if (error) {
    console.error("Error approving item:", error);
    return false;
  }

  return true;
}

/**
 * Reject an item
 */
export async function rejectItem(
  approvalId: string,
  clientId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_approvals")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("client_id", clientId);

  if (error) {
    console.error("Error rejecting item:", error);
    return false;
  }

  return true;
}

/**
 * Get approval status for a specific item
 */
export async function getItemApprovalStatus(
  itemId: string,
  clientId: string
): Promise<ApprovalRequest | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_approvals")
    .select("*")
    .eq("item_id", itemId)
    .eq("client_id", clientId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching item status:", error);
    }
    return null;
  }

  return data as ApprovalRequest;
}

/**
 * Get approval counts by status
 */
export async function getApprovalCounts(
  clientId: string
): Promise<{ pending: number; approved: number; rejected: number }> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_approvals")
    .select("status")
    .eq("client_id", clientId);

  if (error) {
    console.error("Error fetching approval counts:", error);
    return { pending: 0, approved: 0, rejected: 0 };
  }

  const counts = { pending: 0, approved: 0, rejected: 0 };
  data.forEach((item) => {
    if (item.status in counts) {
      counts[item.status as ApprovalStatus]++;
    }
  });

  return counts;
}
