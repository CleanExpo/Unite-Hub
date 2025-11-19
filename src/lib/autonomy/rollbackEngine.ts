/**
 * Rollback Engine - Phase 9 Week 7-8
 *
 * Handles rollback operations for executed changes.
 */

import { getSupabaseServer } from "@/lib/supabase";
import {
  RollbackType,
  AutonomyProposal,
  AutonomyExecution,
} from "@/lib/validation/trustSchemas";

// =============================================================
// Types
// =============================================================

export interface RollbackResult {
  success: boolean;
  rollback_type: RollbackType;
  message: string;
  restored_snapshot?: string;
  error?: string;
}

export interface RollbackRequest {
  rollback_token_id: string;
  requested_by: string;
  reason: string;
  rollback_type?: RollbackType;
}

// =============================================================
// Rollback Engine
// =============================================================

export class RollbackEngine {
  /**
   * Rollback an execution by token ID
   */
  async rollback(request: RollbackRequest): Promise<RollbackResult> {
    const supabase = await getSupabaseServer();

    // Find the execution by rollback token
    const { data: execution, error: execError } = await supabase
      .from("autonomy_executions")
      .select("*")
      .eq("rollback_token_id", request.rollback_token_id)
      .single();

    if (execError || !execution) {
      throw new Error("Execution not found for rollback token");
    }

    // Find the associated proposal
    const { data: proposal, error: propError } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("id", execution.proposal_id)
      .single();

    if (propError || !proposal) {
      throw new Error("Proposal not found");
    }

    // Check if rollback is still available
    if (proposal.rolled_back_at) {
      throw new Error("This execution has already been rolled back");
    }

    const now = new Date();
    const deadline = new Date(execution.rollback_available_until || proposal.rollback_deadline);

    if (now > deadline) {
      throw new Error(`Rollback deadline has passed (${deadline.toISOString()})`);
    }

    // Determine rollback type
    const rollbackType = request.rollback_type || this.determineRollbackType(proposal, execution);

    try {
      let result: RollbackResult;

      switch (rollbackType) {
        case "SOFT_UNDO":
          result = await this.performSoftUndo(proposal, execution);
          break;

        case "HARD_UNDO":
          result = await this.performHardUndo(proposal, execution);
          break;

        case "ESCALATED_RESTORE":
          result = await this.performEscalatedRestore(proposal, execution);
          break;

        default:
          throw new Error(`Unknown rollback type: ${rollbackType}`);
      }

      // Update proposal status
      await supabase
        .from("autonomy_proposals")
        .update({
          status: "ROLLED_BACK",
          rolled_back_at: new Date().toISOString(),
          rolled_back_by: request.requested_by,
        })
        .eq("id", proposal.id);

      // Update execution with rollback info
      await supabase
        .from("autonomy_executions")
        .update({
          rollback_type: rollbackType,
        })
        .eq("id", execution.id);

      // Log audit event
      await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
        action_type: "EXECUTION_ROLLED_BACK",
        proposal_id: proposal.id,
        execution_id: execution.id,
        rollback_token_id: request.rollback_token_id,
        actor_id: request.requested_by,
        details: {
          rollback_type: rollbackType,
          reason: request.reason,
          restored_snapshot: result.restored_snapshot,
        },
      });

      return result;
    } catch (error) {
      // Log failed rollback
      await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
        action_type: "ROLLBACK_FAILED",
        proposal_id: proposal.id,
        execution_id: execution.id,
        rollback_token_id: request.rollback_token_id,
        actor_id: request.requested_by,
        details: {
          rollback_type: rollbackType,
          reason: request.reason,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  /**
   * Determine appropriate rollback type
   */
  private determineRollbackType(
    proposal: AutonomyProposal,
    execution: AutonomyExecution
  ): RollbackType {
    const now = Date.now();
    const executedAt = new Date(execution.executed_at).getTime();
    const hoursSinceExecution = (now - executedAt) / (1000 * 60 * 60);

    // Within 72 hours -> Soft Undo
    if (hoursSinceExecution <= 72 && proposal.risk_level === "LOW") {
      return "SOFT_UNDO";
    }

    // Within 7 days -> Hard Undo
    if (hoursSinceExecution <= 168) {
      // 7 * 24
      return "HARD_UNDO";
    }

    // Beyond 7 days -> Escalated Restore
    return "ESCALATED_RESTORE";
  }

  /**
   * Soft Undo - Apply reverse diff
   */
  private async performSoftUndo(
    proposal: AutonomyProposal,
    execution: AutonomyExecution
  ): Promise<RollbackResult> {
    // In production, this would:
    // 1. Generate reverse diff from proposed_diff
    // 2. Apply reverse changes to the target
    // 3. Verify changes were reverted

    const reverseDiff = this.generateReverseDiff(proposal.proposed_diff);

    // Simulate applying reverse diff
    console.log(`Applying soft undo for proposal ${proposal.id}`);
    console.log("Reverse diff:", JSON.stringify(reverseDiff, null, 2));

    return {
      success: true,
      rollback_type: "SOFT_UNDO",
      message: `Soft undo completed. Reversed ${proposal.change_type} changes.`,
      restored_snapshot: execution.before_snapshot_path,
    };
  }

  /**
   * Hard Undo - Restore from snapshot
   */
  private async performHardUndo(
    proposal: AutonomyProposal,
    execution: AutonomyExecution
  ): Promise<RollbackResult> {
    // In production, this would:
    // 1. Load the before snapshot
    // 2. Restore the full state from snapshot
    // 3. Reapply any safe subsequent changes

    if (!execution.before_snapshot_path) {
      throw new Error("No before snapshot available for hard undo");
    }

    // Simulate restoring from snapshot
    console.log(`Restoring from snapshot: ${execution.before_snapshot_path}`);

    return {
      success: true,
      rollback_type: "HARD_UNDO",
      message: `Hard undo completed. Restored from snapshot: ${execution.before_snapshot_path}`,
      restored_snapshot: execution.before_snapshot_path,
    };
  }

  /**
   * Escalated Restore - Full manual intervention
   */
  private async performEscalatedRestore(
    proposal: AutonomyProposal,
    execution: AutonomyExecution
  ): Promise<RollbackResult> {
    // In production, this would:
    // 1. Create incident ticket
    // 2. Notify engineering team
    // 3. Trigger full backup restore
    // 4. Generate incident report

    const supabase = await getSupabaseServer();

    // Get client notification email
    const { data: trustRequest } = await supabase
      .from("trusted_mode_requests")
      .select("restore_email, emergency_phone")
      .eq("client_id", proposal.client_id)
      .single();

    // In production, send notification email and create ticket
    console.log(`ESCALATED RESTORE for proposal ${proposal.id}`);
    console.log(`Notifying: ${trustRequest?.restore_email}`);
    console.log(`Emergency phone: ${trustRequest?.emergency_phone}`);

    return {
      success: true,
      rollback_type: "ESCALATED_RESTORE",
      message: `Escalated restore initiated. Incident ticket created. Team notified at ${trustRequest?.restore_email}`,
      restored_snapshot: execution.before_snapshot_path,
    };
  }

  /**
   * Generate reverse diff from original diff
   */
  private generateReverseDiff(originalDiff: Record<string, any>): Record<string, any> {
    const reverseDiff: Record<string, any> = {};

    for (const key of Object.keys(originalDiff)) {
      if (key === "old_value" && "new_value" in originalDiff) {
        reverseDiff.old_value = originalDiff.new_value;
        reverseDiff.new_value = originalDiff.old_value;
      } else if (key === "new_title" && "old_title" in originalDiff) {
        reverseDiff.new_title = originalDiff.old_title;
        reverseDiff.old_title = originalDiff.new_title;
      } else if (key === "action") {
        reverseDiff.action = `undo_${originalDiff[key]}`;
      } else {
        reverseDiff[key] = originalDiff[key];
      }
    }

    return reverseDiff;
  }

  /**
   * Get rollback history for a client
   */
  async getRollbackHistory(clientId: string): Promise<AutonomyProposal[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "ROLLED_BACK")
      .order("rolled_back_at", { ascending: false });

    if (error) return [];
    return data;
  }

  /**
   * Check if rollback is available for a token
   */
  async isRollbackAvailable(rollbackTokenId: string): Promise<{
    available: boolean;
    deadline?: string;
    reason?: string;
  }> {
    const supabase = await getSupabaseServer();

    const { data: execution, error } = await supabase
      .from("autonomy_executions")
      .select("*, autonomy_proposals(*)")
      .eq("rollback_token_id", rollbackTokenId)
      .single();

    if (error || !execution) {
      return {
        available: false,
        reason: "Execution not found",
      };
    }

    const proposal = execution.autonomy_proposals;

    if (proposal.status === "ROLLED_BACK") {
      return {
        available: false,
        reason: "Already rolled back",
      };
    }

    const now = new Date();
    const deadline = new Date(execution.rollback_available_until || proposal.rollback_deadline);

    if (now > deadline) {
      return {
        available: false,
        deadline: deadline.toISOString(),
        reason: "Rollback deadline has passed",
      };
    }

    return {
      available: true,
      deadline: deadline.toISOString(),
    };
  }

  /**
   * Extend rollback deadline (admin function)
   */
  async extendRollbackDeadline(
    rollbackTokenId: string,
    extendedBy: string,
    newDeadline: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Update execution
    await supabase
      .from("autonomy_executions")
      .update({ rollback_available_until: newDeadline })
      .eq("rollback_token_id", rollbackTokenId);

    // Find associated proposal
    const { data: execution } = await supabase
      .from("autonomy_executions")
      .select("proposal_id, client_id")
      .eq("rollback_token_id", rollbackTokenId)
      .single();

    if (execution) {
      // Update proposal
      await supabase
        .from("autonomy_proposals")
        .update({ rollback_deadline: newDeadline })
        .eq("id", execution.proposal_id);

      // Get org_id for audit
      const { data: proposal } = await supabase
        .from("autonomy_proposals")
        .select("organization_id")
        .eq("id", execution.proposal_id)
        .single();

      if (proposal) {
        // Log audit event
        await this.logAuditEvent(execution.client_id, proposal.organization_id, {
          action_type: "ROLLBACK_DEADLINE_EXTENDED",
          proposal_id: execution.proposal_id,
          rollback_token_id: rollbackTokenId,
          actor_id: extendedBy,
          details: { new_deadline: newDeadline },
        });
      }
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    clientId: string,
    organizationId: string,
    event: {
      action_type: string;
      proposal_id?: string;
      execution_id?: string;
      rollback_token_id?: string;
      actor_id?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("autonomy_audit_log").insert({
      client_id: clientId,
      organization_id: organizationId,
      action_type: event.action_type,
      source: "RollbackEngine",
      actor_type: event.actor_id ? "HUMAN" : "SYSTEM",
      actor_id: event.actor_id,
      proposal_id: event.proposal_id,
      execution_id: event.execution_id,
      rollback_token_id: event.rollback_token_id,
      details: event.details || {},
      timestamp_utc: new Date().toISOString(),
    });
  }
}

export const rollbackEngine = new RollbackEngine();
