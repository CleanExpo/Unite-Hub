/**
 * Approval Queue Service - Phase 10 Week 1-2
 *
 * Manages the operator approval queue for proposals.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { operatorRoleService, RiskLevel, AutonomyDomain } from "./operatorRoleService";

// =============================================================
// Types
// =============================================================

export type QueueStatus = "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED" | "ESCALATED" | "EXPIRED";

export interface QueueItem {
  id: string;
  proposal_id: string;
  organization_id: string;
  status: QueueStatus;
  priority: number;
  assigned_to?: string;
  assigned_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  escalated_to?: string;
  escalation_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  autonomy_proposals?: any;
}

export interface CreateQueueItemRequest {
  proposal_id: string;
  organization_id: string;
  priority?: number;
  expires_in_hours?: number;
}

export interface ResolveQueueItemRequest {
  queue_item_id: string;
  resolved_by: string;
  status: "APPROVED" | "REJECTED";
  notes?: string;
}

// =============================================================
// Approval Queue Service
// =============================================================

export class ApprovalQueueService {
  /**
   * Add proposal to approval queue
   */
  async addToQueue(request: CreateQueueItemRequest): Promise<QueueItem> {
    const supabase = await getSupabaseServer();

    const expiresAt = new Date(
      Date.now() + (request.expires_in_hours || 24) * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("operator_approval_queue")
      .insert({
        proposal_id: request.proposal_id,
        organization_id: request.organization_id,
        priority: request.priority || 5,
        status: "PENDING",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to queue: ${error.message}`);
    }

    // Notify operators
    await this.notifyApprovers(request.organization_id, data.id, request.proposal_id);

    return data;
  }

  /**
   * Get queue items for organization
   */
  async getQueue(
    organizationId: string,
    options?: {
      status?: QueueStatus;
      assigned_to?: string;
      limit?: number;
    }
  ): Promise<QueueItem[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("operator_approval_queue")
      .select(`
        *,
        autonomy_proposals (
          id,
          domain,
          change_type,
          risk_level,
          rationale,
          proposed_diff,
          created_at
        )
      `)
      .eq("organization_id", organizationId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.assigned_to) {
      query = query.eq("assigned_to", options.assigned_to);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) return [];
    return data;
  }

  /**
   * Get pending queue for operator
   */
  async getOperatorQueue(
    userId: string,
    organizationId: string
  ): Promise<QueueItem[]> {
    const operator = await operatorRoleService.getOperator(userId, organizationId);

    if (!operator) return [];

    const supabase = await getSupabaseServer();

    // Get items matching operator's permissions
    let query = supabase
      .from("operator_approval_queue")
      .select(`
        *,
        autonomy_proposals (
          id,
          domain,
          change_type,
          risk_level,
          rationale,
          proposed_diff,
          created_at
        )
      `)
      .eq("organization_id", organizationId)
      .in("status", ["PENDING", "ASSIGNED"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    const { data, error } = await query;

    if (error) return [];

    // Filter by operator's permissions
    return data.filter((item) => {
      const proposal = item.autonomy_proposals;
      if (!proposal) return false;

      // Check domain access
      if (!operator.allowed_domains.includes(proposal.domain)) {
        return false;
      }

      // Check risk level permission
      switch (proposal.risk_level) {
        case "LOW":
          return operator.can_approve_low;
        case "MEDIUM":
          return operator.can_approve_medium;
        case "HIGH":
          return operator.can_approve_high;
        default:
          return false;
      }
    });
  }

  /**
   * Assign queue item to operator
   */
  async assignToOperator(
    queueItemId: string,
    operatorUserId: string
  ): Promise<QueueItem> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_approval_queue")
      .update({
        assigned_to: operatorUserId,
        assigned_at: new Date().toISOString(),
        status: "ASSIGNED",
      })
      .eq("id", queueItemId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign: ${error.message}`);
    }

    return data;
  }

  /**
   * Resolve queue item (approve/reject)
   */
  async resolve(request: ResolveQueueItemRequest): Promise<QueueItem> {
    const supabase = await getSupabaseServer();

    // Get queue item to check organization
    const { data: queueItem, error: fetchError } = await supabase
      .from("operator_approval_queue")
      .select("*, autonomy_proposals(*)")
      .eq("id", request.queue_item_id)
      .single();

    if (fetchError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // Verify operator permission
    const proposal = queueItem.autonomy_proposals;
    const permCheck = await operatorRoleService.canApproveProposal(
      request.resolved_by,
      queueItem.organization_id,
      proposal.risk_level,
      proposal.domain
    );

    if (!permCheck.allowed) {
      throw new Error(permCheck.reason || "Permission denied");
    }

    // Update queue item
    const { data, error } = await supabase
      .from("operator_approval_queue")
      .update({
        status: request.status,
        resolved_by: request.resolved_by,
        resolved_at: new Date().toISOString(),
        resolution_notes: request.notes,
      })
      .eq("id", request.queue_item_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve: ${error.message}`);
    }

    // Increment operator's approval count
    await operatorRoleService.incrementApprovalCount(
      request.resolved_by,
      queueItem.organization_id
    );

    return data;
  }

  /**
   * Escalate queue item to higher role
   */
  async escalate(
    queueItemId: string,
    escalatedBy: string,
    reason: string
  ): Promise<QueueItem> {
    const supabase = await getSupabaseServer();

    // Get queue item
    const { data: queueItem, error: fetchError } = await supabase
      .from("operator_approval_queue")
      .select("*")
      .eq("id", queueItemId)
      .single();

    if (fetchError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // Find a higher-level operator
    const managers = await operatorRoleService.getOrganizationOperators(
      queueItem.organization_id
    );

    const escalationTarget = managers.find(
      (op) => op.role === "OWNER" || op.role === "MANAGER"
    );

    if (!escalationTarget) {
      throw new Error("No escalation target found");
    }

    // Update queue item
    const { data, error } = await supabase
      .from("operator_approval_queue")
      .update({
        status: "ESCALATED",
        escalated_to: escalationTarget.user_id,
        escalation_reason: reason,
        assigned_to: escalationTarget.user_id,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", queueItemId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to escalate: ${error.message}`);
    }

    // Notify escalation target
    await this.createNotification(
      escalationTarget.user_id,
      queueItem.organization_id,
      "ESCALATION",
      "Proposal Escalated",
      `A proposal has been escalated to you: ${reason}`,
      queueItem.proposal_id,
      queueItemId
    );

    return data;
  }

  /**
   * Expire old queue items
   */
  async expireOldItems(): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_approval_queue")
      .update({ status: "EXPIRED" })
      .lt("expires_at", new Date().toISOString())
      .in("status", ["PENDING", "ASSIGNED"])
      .select();

    if (error) return 0;
    return data.length;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    assigned: number;
    approved: number;
    rejected: number;
    escalated: number;
    expired: number;
    average_resolution_time_ms: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_approval_queue")
      .select("status, created_at, resolved_at")
      .eq("organization_id", organizationId);

    if (error || !data) {
      return {
        total: 0,
        pending: 0,
        assigned: 0,
        approved: 0,
        rejected: 0,
        escalated: 0,
        expired: 0,
        average_resolution_time_ms: 0,
      };
    }

    const stats = {
      total: data.length,
      pending: 0,
      assigned: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      expired: 0,
      average_resolution_time_ms: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    data.forEach((item) => {
      stats[item.status.toLowerCase() as keyof typeof stats]++;

      if (item.resolved_at && item.created_at) {
        const resolutionTime =
          new Date(item.resolved_at).getTime() - new Date(item.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    stats.average_resolution_time_ms =
      resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0;

    return stats;
  }

  /**
   * Notify approvers about new queue item
   */
  private async notifyApprovers(
    organizationId: string,
    queueItemId: string,
    proposalId: string
  ): Promise<void> {
    const recipients = await operatorRoleService.getNotificationRecipients(
      organizationId,
      "APPROVAL_NEEDED"
    );

    for (const recipient of recipients) {
      await this.createNotification(
        recipient.user_id,
        organizationId,
        "APPROVAL_NEEDED",
        "Approval Required",
        "A new proposal requires your approval",
        proposalId,
        queueItemId
      );
    }
  }

  /**
   * Create notification
   */
  private async createNotification(
    userId: string,
    organizationId: string,
    type: string,
    title: string,
    message: string,
    proposalId?: string,
    queueItemId?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("operator_notifications").insert({
      user_id: userId,
      organization_id: organizationId,
      type,
      title,
      message,
      proposal_id: proposalId,
      queue_item_id: queueItemId,
    });
  }
}

export const approvalQueueService = new ApprovalQueueService();
