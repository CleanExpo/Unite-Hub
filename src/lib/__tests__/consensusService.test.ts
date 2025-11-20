/**
 * Consensus Service Tests - Phase 10 Week 3-4
 *
 * Tests for multi-approver consensus, voting, and conflict detection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocking
import { ConsensusService } from "../operator/consensusService";

describe("ConsensusService", () => {
  let service: ConsensusService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ConsensusService();
  });

  describe("Vote Weight Calculations", () => {
    it("should assign weight 10 to OWNER votes", async () => {
      const queueItem = {
        id: "queue-1",
        proposal_id: "proposal-1",
        risk_level: "MEDIUM_RISK",
        organization_id: "org-1",
      };

      mockSupabase.single.mockResolvedValueOnce({ data: queueItem, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "vote-1",
          vote_weight: 10,
          voter_role: "OWNER",
        },
        error: null,
      });

      const result = await service.castVote(
        "queue-1",
        "user-1",
        "OWNER",
        "APPROVE",
        "Looks good"
      );

      expect(result.vote_weight).toBe(10);
    });

    it("should assign weight 2 to MANAGER votes", async () => {
      const queueItem = {
        id: "queue-1",
        proposal_id: "proposal-1",
        risk_level: "MEDIUM_RISK",
        organization_id: "org-1",
      };

      mockSupabase.single.mockResolvedValueOnce({ data: queueItem, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "vote-1",
          vote_weight: 2,
          voter_role: "MANAGER",
        },
        error: null,
      });

      const result = await service.castVote(
        "queue-1",
        "user-1",
        "MANAGER",
        "APPROVE"
      );

      expect(result.vote_weight).toBe(2);
    });

    it("should throw error for ANALYST vote attempts", async () => {
      await expect(
        service.castVote("queue-1", "user-1", "ANALYST", "APPROVE")
      ).rejects.toThrow("Analysts cannot vote");
    });

    it("should assign weight 100 for OWNER override", async () => {
      const queueItem = {
        id: "queue-1",
        proposal_id: "proposal-1",
        risk_level: "HIGH_RISK",
        organization_id: "org-1",
      };

      mockSupabase.single.mockResolvedValueOnce({ data: queueItem, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "vote-1",
          vote_weight: 100,
          voter_role: "OWNER",
          is_override: true,
        },
        error: null,
      });

      const result = await service.castVote(
        "queue-1",
        "user-1",
        "OWNER",
        "APPROVE",
        "Override required",
        true
      );

      expect(result.vote_weight).toBe(100);
      expect(result.is_override).toBe(true);
    });

    it("should reject MANAGER override attempts", async () => {
      await expect(
        service.castVote(
          "queue-1",
          "user-1",
          "MANAGER",
          "APPROVE",
          "Trying override",
          true
        )
      ).rejects.toThrow("Only owners can override");
    });
  });

  describe("Quorum Rules by Risk Level", () => {
    it("should require min 1 vote and weight 2 for LOW_RISK", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "LOW_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(true);
      expect(result.decision).toBe("APPROVED");
    });

    it("should require min 2 votes and weight 4 for MEDIUM_RISK", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "MEDIUM_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(false);
      expect(result.decision).toBe("PENDING");
    });

    it("should meet MEDIUM_RISK quorum with 2 MANAGER votes", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "MEDIUM_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(true);
      expect(result.total_weight).toBe(4);
      expect(result.decision).toBe("APPROVED");
    });

    it("should require min 2 votes and weight 6 for HIGH_RISK", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "HIGH_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(false);
      expect(result.total_weight).toBe(4);
    });

    it("should meet HIGH_RISK quorum with OWNER vote", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 10, voter_role: "OWNER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "HIGH_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(true);
      expect(result.decision).toBe("APPROVED");
    });
  });

  describe("Consensus Determination", () => {
    it("should approve when all votes are APPROVE", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 10, voter_role: "OWNER" },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "LOW_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.decision).toBe("APPROVED");
      expect(result.approve_weight).toBe(12);
      expect(result.reject_weight).toBe(0);
    });

    it("should reject when reject weight exceeds approve weight", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
        { vote: "REJECT", vote_weight: 10, voter_role: "OWNER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "LOW_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.decision).toBe("REJECTED");
      expect(result.reject_weight).toBe(10);
    });

    it("should return PENDING when no votes cast", async () => {
      mockSupabase.eq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "MEDIUM_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.decision).toBe("PENDING");
      expect(result.quorum_met).toBe(false);
    });

    it("should handle DEFER votes as neutral", async () => {
      const votes = [
        { vote: "DEFER", vote_weight: 2, voter_role: "MANAGER" },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "LOW_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.approve_weight).toBe(2);
      expect(result.defer_count).toBe(1);
    });

    it("should handle ABSTAIN votes", async () => {
      const votes = [
        { vote: "ABSTAIN", vote_weight: 10, voter_role: "OWNER" },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { risk_level: "LOW_RISK" },
        error: null,
      });

      const result = await service.checkConsensus("queue-1");

      expect(result.abstain_count).toBe(1);
    });
  });

  describe("Conflict Detection", () => {
    it("should detect CONFLICTING_VOTES between managers", async () => {
      const votes = [
        { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-1" },
        { vote: "REJECT", voter_role: "MANAGER", voter_id: "user-2" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "queue-1",
          created_at: new Date().toISOString(),
          status: "PENDING",
        },
        error: null,
      });

      const conflicts = await service.detectConflicts("queue-1");

      expect(conflicts.length).toBeGreaterThan(0);
      const conflictingVotes = conflicts.find(
        (c) => c.conflict_type === "CONFLICTING_VOTES"
      );
      expect(conflictingVotes).toBeDefined();
    });

    it("should detect EXPIRED_REVIEW for old pending items", async () => {
      mockSupabase.eq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "queue-1",
          created_at: oldDate.toISOString(),
          status: "PENDING",
        },
        error: null,
      });

      const conflicts = await service.detectConflicts("queue-1");

      const expired = conflicts.find(
        (c) => c.conflict_type === "EXPIRED_REVIEW"
      );
      expect(expired).toBeDefined();
    });

    it("should not flag EXPIRED_REVIEW for recent items", async () => {
      mockSupabase.eq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "queue-1",
          created_at: new Date().toISOString(),
          status: "PENDING",
        },
        error: null,
      });

      const conflicts = await service.detectConflicts("queue-1");

      const expired = conflicts.find(
        (c) => c.conflict_type === "EXPIRED_REVIEW"
      );
      expect(expired).toBeUndefined();
    });

    it("should detect QUORUM_DEADLOCK with equal weights", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", voter_id: "user-1" },
        { vote: "REJECT", vote_weight: 2, voter_role: "MANAGER", voter_id: "user-2" },
      ];

      mockSupabase.eq.mockReturnValueOnce({
        data: votes,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "queue-1",
          created_at: new Date().toISOString(),
          status: "PENDING",
        },
        error: null,
      });

      const conflicts = await service.detectConflicts("queue-1");

      const deadlock = conflicts.find(
        (c) => c.conflict_type === "QUORUM_DEADLOCK"
      );
      expect(deadlock).toBeDefined();
    });
  });

  describe("Conflict Resolution", () => {
    it("should resolve a conflict successfully", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "conflict-1", status: "RESOLVED" },
        error: null,
      });

      await expect(
        service.resolveConflict(
          "conflict-1",
          "user-1",
          "Escalated to leadership"
        )
      ).resolves.not.toThrow();
    });

    it("should log activity when resolving conflict", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "conflict-1", status: "RESOLVED" },
        error: null,
      });

      await service.resolveConflict(
        "conflict-1",
        "user-1",
        "Issue addressed"
      );

      // Verify insert was called for activity log
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("Activity Stream", () => {
    it("should return activities for an organization", async () => {
      const activities = [
        {
          id: "act-1",
          action_type: "VOTE_CAST",
          created_at: new Date().toISOString(),
        },
        {
          id: "act-2",
          action_type: "COMMENT_ADDED",
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.limit.mockReturnValueOnce({
        data: activities,
        error: null,
      });

      const result = await service.getActivityStream("org-1", 50);

      expect(result).toHaveLength(2);
      expect(result[0].action_type).toBe("VOTE_CAST");
    });

    it("should respect limit parameter", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      await service.getActivityStream("org-1", 10);

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it("should order by created_at descending", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      await service.getActivityStream("org-1");

      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });
  });
});
