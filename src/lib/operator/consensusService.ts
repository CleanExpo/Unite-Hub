/**
 * Consensus Service - Phase 10 Week 3-4
 *
 * Handles multi-approver consensus, voting, and conflict resolution.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { OperatorRole } from "./operatorRoleService";

// =============================================================
// Types
// =============================================================

export type VoteType = "APPROVE" | "REJECT" | "ABSTAIN" | "DEFER";
export type ConflictType =
  | "CONFLICTING_VOTES"
  | "EXPIRED_REVIEW"
  | "DOMAIN_DISPUTE"
  | "QUORUM_DEADLOCK"
  | "AUTHORITY_CONFLICT";

export interface ConsensusVote {
  id: string;
  queue_item_id: string;
  proposal_id: string;
  organization_id: string;
  voter_id: string;
  voter_role: OperatorRole;
  vote: VoteType;
  vote_weight: number;
  reason?: string;
  is_override: boolean;
  created_at: string;
}

export interface ConsensusResult {
  reached: boolean;
  outcome?: "APPROVED" | "REJECTED";
  approve_weight: number;
  reject_weight: number;
  total_votes: number;
  quorum_met: boolean;
  override_used: boolean;
  reason: string;
}

export interface ReviewConflict {
  id: string;
  queue_item_id: string;
  conflict_type: ConflictType;
  description: string;
  status: string;
}

// Vote weights by role
const VOTE_WEIGHTS: Record<OperatorRole, number> = {
  OWNER: 10,
  MANAGER: 2,
  ANALYST: 0, // Cannot vote, only comment
};

// Quorum requirements
const QUORUM_RULES = {
  LOW_RISK: { min_votes: 1, min_weight: 2 },
  MEDIUM_RISK: { min_votes: 2, min_weight: 4 },
  HIGH_RISK: { min_votes: 2, min_weight: 6 },
};

// =============================================================
// Consensus Service
// =============================================================

export class ConsensusService {
  /**
   * Cast a vote on a queue item
   */
  async castVote(
    queueItemId: string,
    voterId: string,
    voterRole: OperatorRole,
    vote: VoteType,
    reason?: string,
    isOverride: boolean = false
  ): Promise<ConsensusVote> {
    const supabase = await getSupabaseServer();

    // Get queue item for proposal and org
    const { data: queueItem, error: queueError } = await supabase
      .from("operator_approval_queue")
      .select("proposal_id, organization_id")
      .eq("id", queueItemId)
      .single();

    if (queueError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // Check if analyst trying to vote
    if (voterRole === "ANALYST" && vote !== "ABSTAIN") {
      throw new Error("Analysts can only comment or abstain");
    }

    // Calculate vote weight
    let weight = VOTE_WEIGHTS[voterRole];

    // Owner override gives full weight
    if (isOverride && voterRole === "OWNER") {
      weight = 100; // Override weight
    }

    // Upsert vote (update if exists)
    const { data, error } = await supabase
      .from("consensus_votes")
      .upsert(
        {
          queue_item_id: queueItemId,
          proposal_id: queueItem.proposal_id,
          organization_id: queueItem.organization_id,
          voter_id: voterId,
          voter_role: voterRole,
          vote,
          vote_weight: weight,
          reason,
          is_override: isOverride,
        },
        { onConflict: "queue_item_id,voter_id" }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cast vote: ${error.message}`);
    }

    // Log activity
    await this.logActivity(
      queueItem.organization_id,
      "VOTE_CAST",
      voterId,
      voterRole,
      queueItemId,
      queueItem.proposal_id,
      `${voterRole} voted ${vote}`,
      { vote, weight, isOverride }
    );

    // Check for conflicts
    await this.detectConflicts(queueItemId);

    // Check if consensus reached
    const consensus = await this.checkConsensus(queueItemId);
    if (consensus.reached) {
      await this.logActivity(
        queueItem.organization_id,
        "CONSENSUS_REACHED",
        voterId,
        voterRole,
        queueItemId,
        queueItem.proposal_id,
        `Consensus reached: ${consensus.outcome}`,
        consensus
      );
    }

    return data;
  }

  /**
   * Check consensus status for a queue item
   */
  async checkConsensus(queueItemId: string): Promise<ConsensusResult> {
    const supabase = await getSupabaseServer();

    // Get all votes
    const { data: votes, error } = await supabase
      .from("consensus_votes")
      .select("*")
      .eq("queue_item_id", queueItemId);

    if (error || !votes) {
      return {
        reached: false,
        approve_weight: 0,
        reject_weight: 0,
        total_votes: 0,
        quorum_met: false,
        override_used: false,
        reason: "Failed to fetch votes",
      };
    }

    // Get proposal risk level
    const { data: queueItem } = await supabase
      .from("operator_approval_queue")
      .select("autonomy_proposals(risk_level)")
      .eq("id", queueItemId)
      .single();

    const riskLevel = queueItem?.autonomy_proposals?.risk_level || "MEDIUM";
    const quorum = QUORUM_RULES[`${riskLevel}_RISK` as keyof typeof QUORUM_RULES] || QUORUM_RULES.MEDIUM_RISK;

    // Calculate weights
    let approveWeight = 0;
    let rejectWeight = 0;
    let overrideUsed = false;

    votes.forEach((vote) => {
      if (vote.is_override) {
        overrideUsed = true;
        if (vote.vote === "APPROVE") {
          approveWeight = 100;
        } else if (vote.vote === "REJECT") {
          rejectWeight = 100;
        }
      } else {
        if (vote.vote === "APPROVE") {
          approveWeight += vote.vote_weight;
        } else if (vote.vote === "REJECT") {
          rejectWeight += vote.vote_weight;
        }
      }
    });

    // Check quorum
    const totalVotes = votes.filter((v) => v.vote !== "ABSTAIN").length;
    const quorumMet = totalVotes >= quorum.min_votes;
    const weightMet = Math.max(approveWeight, rejectWeight) >= quorum.min_weight;

    // Determine outcome
    let reached = false;
    let outcome: "APPROVED" | "REJECTED" | undefined;
    let reason = "";

    if (overrideUsed) {
      reached = true;
      outcome = approveWeight > rejectWeight ? "APPROVED" : "REJECTED";
      reason = "Owner override used";
    } else if (quorumMet && weightMet) {
      if (approveWeight > rejectWeight) {
        reached = true;
        outcome = "APPROVED";
        reason = `Consensus reached with ${approveWeight} approve weight`;
      } else if (rejectWeight > approveWeight) {
        reached = true;
        outcome = "REJECTED";
        reason = `Consensus reached with ${rejectWeight} reject weight`;
      } else {
        reason = "Tied votes - needs tie-breaker";
      }
    } else if (!quorumMet) {
      reason = `Quorum not met (${totalVotes}/${quorum.min_votes} votes)`;
    } else {
      reason = `Weight threshold not met (need ${quorum.min_weight})`;
    }

    return {
      reached,
      outcome,
      approve_weight: approveWeight,
      reject_weight: rejectWeight,
      total_votes: totalVotes,
      quorum_met: quorumMet,
      override_used: overrideUsed,
      reason,
    };
  }

  /**
   * Get votes for a queue item
   */
  async getVotes(queueItemId: string): Promise<ConsensusVote[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("consensus_votes")
      .select("*")
      .eq("queue_item_id", queueItemId)
      .order("created_at", { ascending: true });

    if (error) {
return [];
}
    return data;
  }

  /**
   * Detect conflicts in voting
   */
  async detectConflicts(queueItemId: string): Promise<ReviewConflict[]> {
    const supabase = await getSupabaseServer();
    const conflicts: ReviewConflict[] = [];

    // Get votes
    const votes = await this.getVotes(queueItemId);

    if (votes.length < 2) {
return conflicts;
}

    // Get queue item
    const { data: queueItem } = await supabase
      .from("operator_approval_queue")
      .select("organization_id, expires_at")
      .eq("id", queueItemId)
      .single();

    if (!queueItem) {
return conflicts;
}

    // Check for conflicting votes between same role
    const votesByRole: Record<string, ConsensusVote[]> = {};
    votes.forEach((vote) => {
      if (!votesByRole[vote.voter_role]) {
        votesByRole[vote.voter_role] = [];
      }
      votesByRole[vote.voter_role].push(vote);
    });

    // Check MANAGER conflicts
    const managerVotes = votesByRole["MANAGER"] || [];
    if (managerVotes.length >= 2) {
      const approves = managerVotes.filter((v) => v.vote === "APPROVE");
      const rejects = managerVotes.filter((v) => v.vote === "REJECT");

      if (approves.length > 0 && rejects.length > 0) {
        const conflict = await this.createConflict(
          queueItemId,
          queueItem.organization_id,
          "CONFLICTING_VOTES",
          "Managers have conflicting votes",
          managerVotes.map((v) => v.voter_id)
        );
        conflicts.push(conflict);
      }
    }

    // Check for expired review
    if (new Date(queueItem.expires_at) < new Date()) {
      const conflict = await this.createConflict(
        queueItemId,
        queueItem.organization_id,
        "EXPIRED_REVIEW",
        "Review has expired without consensus",
        votes.map((v) => v.voter_id)
      );
      conflicts.push(conflict);
    }

    // Check for quorum deadlock
    const consensus = await this.checkConsensus(queueItemId);
    if (
      votes.length >= 3 &&
      !consensus.reached &&
      consensus.approve_weight === consensus.reject_weight
    ) {
      const conflict = await this.createConflict(
        queueItemId,
        queueItem.organization_id,
        "QUORUM_DEADLOCK",
        "Voting deadlock - equal approve and reject weight",
        votes.map((v) => v.voter_id)
      );
      conflicts.push(conflict);
    }

    return conflicts;
  }

  /**
   * Create a conflict record
   */
  private async createConflict(
    queueItemId: string,
    organizationId: string,
    conflictType: ConflictType,
    description: string,
    affectedVoters: string[]
  ): Promise<ReviewConflict> {
    const supabase = await getSupabaseServer();

    // Check if conflict already exists
    const { data: existing } = await supabase
      .from("review_conflicts")
      .select("id")
      .eq("queue_item_id", queueItemId)
      .eq("conflict_type", conflictType)
      .eq("status", "OPEN")
      .single();

    if (existing) {
      return existing as ReviewConflict;
    }

    const { data, error } = await supabase
      .from("review_conflicts")
      .insert({
        queue_item_id: queueItemId,
        organization_id: organizationId,
        conflict_type: conflictType,
        description,
        affected_voters: affectedVoters,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conflict: ${error.message}`);
    }

    // Log activity
    await this.logActivity(
      organizationId,
      "CONFLICT_DETECTED",
      null,
      null,
      queueItemId,
      null,
      `Conflict detected: ${conflictType}`,
      { conflictType, description }
    );

    return data;
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { data: conflict, error: fetchError } = await supabase
      .from("review_conflicts")
      .select("queue_item_id, organization_id")
      .eq("id", conflictId)
      .single();

    if (fetchError || !conflict) {
      throw new Error("Conflict not found");
    }

    await supabase
      .from("review_conflicts")
      .update({
        status: "RESOLVED",
        resolution,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", conflictId);

    // Log activity
    await this.logActivity(
      conflict.organization_id,
      "CONFLICT_RESOLVED",
      resolvedBy,
      null,
      conflict.queue_item_id,
      null,
      `Conflict resolved: ${resolution}`,
      { conflictId, resolution }
    );
  }

  /**
   * Get open conflicts for organization
   */
  async getOpenConflicts(organizationId: string): Promise<ReviewConflict[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("review_conflicts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "OPEN")
      .order("created_at", { ascending: false });

    if (error) {
return [];
}
    return data;
  }

  /**
   * Log activity to stream
   */
  private async logActivity(
    organizationId: string,
    activityType: string,
    actorId: string | null,
    actorRole: string | null,
    queueItemId: string | null,
    proposalId: string | null,
    summary: string,
    details: Record<string, any>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("operator_activity_stream").insert({
      organization_id: organizationId,
      activity_type: activityType,
      actor_id: actorId,
      actor_role: actorRole,
      queue_item_id: queueItemId,
      proposal_id: proposalId,
      summary,
      details,
    });
  }

  /**
   * Get activity stream
   */
  async getActivityStream(
    organizationId: string,
    limit: number = 50
  ): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_activity_stream")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
return [];
}
    return data;
  }
}

export const consensusService = new ConsensusService();
