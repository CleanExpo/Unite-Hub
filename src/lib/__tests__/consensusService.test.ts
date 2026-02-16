/**
 * Consensus Service Tests - Phase 10 Week 3-4
 *
 * Tests for multi-approver consensus, voting, and conflict detection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a fully chainable mock for Supabase
const { mockSupabase, setQueryResults } = vi.hoisted(() => {
  let queryResults: any[] = [];
  let queryIndex = 0;

  const createQueryChain = () => {
    const chain: any = {};
    const methods = [
      "select", "insert", "update", "delete", "upsert",
      "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
      "is", "in", "or", "not", "order", "limit", "range",
      "match", "filter", "contains", "containedBy", "textSearch",
    ];
    methods.forEach((m) => {
      chain[m] = vi.fn().mockReturnValue(chain);
    });
    chain.single = vi.fn().mockImplementation(() => {
      const result = queryResults[queryIndex] || { data: null, error: null };
      queryIndex++;
      return Promise.resolve(result);
    });
    chain.maybeSingle = vi.fn().mockImplementation(() => {
      const result = queryResults[queryIndex] || { data: null, error: null };
      queryIndex++;
      return Promise.resolve(result);
    });
    chain.then = vi.fn().mockImplementation((resolve: any, reject?: any) => {
      const result = queryResults[queryIndex] || { data: [], error: null };
      queryIndex++;
      return Promise.resolve(result).then(resolve, reject);
    });
    return chain;
  };

  const queryChain = createQueryChain();
  const mock: any = {
    from: vi.fn().mockReturnValue(queryChain),
  };
  // Expose chain methods for assertions, excluding 'then'
  const chainMethods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "or", "not", "order", "limit", "range",
    "match", "filter", "contains", "containedBy", "textSearch",
    "single", "maybeSingle",
  ];
  chainMethods.forEach((m) => {
    mock[m] = queryChain[m];
  });

  return {
    mockSupabase: mock,
    setQueryResults: (results: any[]) => {
      queryResults = results;
      queryIndex = 0;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
  getSupabaseAdmin: vi.fn(() => mockSupabase),
  getSupabaseServerWithAuth: vi.fn(() => mockSupabase),
  supabase: mockSupabase,
  supabaseBrowser: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

// Import after mocking
import { ConsensusService } from "../operator/consensusService";

describe("ConsensusService", () => {
  let service: ConsensusService;

  beforeEach(() => {
    vi.clearAllMocks();
    setQueryResults([]);
    service = new ConsensusService();
  });

  describe("Vote Weight Calculations", () => {
    it("should assign weight 10 to OWNER votes", async () => {
      const queueItem = {
        proposal_id: "proposal-1",
        organization_id: "org-1",
      };

      setQueryResults([
        // 1. castVote: get queue item .single()
        { data: queueItem, error: null },
        // 2. castVote: upsert vote .single()
        { data: { id: "vote-1", vote_weight: 10, voter_role: "OWNER" }, error: null },
        // 3. logActivity: insert -> thenable
        { data: null, error: null },
        // 4. detectConflicts -> getVotes: select votes -> thenable
        { data: [], error: null },
        // 5. checkConsensus: select votes -> thenable
        { data: [{ vote: "APPROVE", vote_weight: 10, voter_role: "OWNER", is_override: false }], error: null },
        // 6. checkConsensus: get queue item risk level .single()
        { data: { autonomy_proposals: { risk_level: "LOW" } }, error: null },
      ]);

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
      setQueryResults([
        { data: { proposal_id: "proposal-1", organization_id: "org-1" }, error: null },
        { data: { id: "vote-1", vote_weight: 2, voter_role: "MANAGER" }, error: null },
        { data: null, error: null }, // log
        { data: [], error: null }, // getVotes for detectConflicts
        { data: [{ vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false }], error: null },
        { data: { autonomy_proposals: { risk_level: "LOW" } }, error: null },
      ]);

      const result = await service.castVote(
        "queue-1",
        "user-1",
        "MANAGER",
        "APPROVE"
      );

      expect(result.vote_weight).toBe(2);
    });

    it("should throw error for ANALYST vote attempts", async () => {
      // castVote first fetches queue item, then checks role
      setQueryResults([
        { data: { proposal_id: "proposal-1", organization_id: "org-1" }, error: null },
      ]);

      await expect(
        service.castVote("queue-1", "user-1", "ANALYST", "APPROVE")
      ).rejects.toThrow(/Analysts can/);
    });

    it("should assign weight 100 for OWNER override", async () => {
      setQueryResults([
        { data: { proposal_id: "proposal-1", organization_id: "org-1" }, error: null },
        { data: { id: "vote-1", vote_weight: 100, voter_role: "OWNER", is_override: true }, error: null },
        { data: null, error: null }, // log
        { data: [], error: null }, // getVotes for detectConflicts
        { data: [{ vote: "APPROVE", vote_weight: 100, voter_role: "OWNER", is_override: true }], error: null },
        { data: { autonomy_proposals: { risk_level: "HIGH" } }, error: null },
        { data: null, error: null }, // consensus log
      ]);

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

    it("should not grant override weight to MANAGER", async () => {
      // MANAGER with isOverride=true still only gets normal MANAGER weight (2), not 100
      setQueryResults([
        { data: { proposal_id: "proposal-1", organization_id: "org-1" }, error: null },
        { data: { id: "vote-1", vote_weight: 2, voter_role: "MANAGER", is_override: true }, error: null },
        { data: null, error: null }, // logActivity insert
        { data: [], error: null }, // getVotes (detectConflicts) - fewer than 2 votes, returns early
        // checkConsensus: getVotes then queue item
        { data: [{ vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: true }], error: null },
        { data: { autonomy_proposals: { risk_level: "LOW" } }, error: null },
      ]);

      const result = await service.castVote(
        "queue-1",
        "user-1",
        "MANAGER",
        "APPROVE",
        "Trying override",
        true
      );

      // MANAGER override flag is set but weight remains 2, not 100
      expect(result.vote_weight).toBe(2);
    });
  });

  describe("Quorum Rules by Risk Level", () => {
    // checkConsensus flow:
    // 1. get all votes -> thenable
    // 2. get queue item with risk_level .single()
    function setupCheckConsensus(votes: any[], riskLevel: string) {
      setQueryResults([
        // 1. consensus_votes select -> thenable
        { data: votes, error: null },
        // 2. queue item .single()
        { data: { autonomy_proposals: { risk_level: riskLevel } }, error: null },
      ]);
    }

    it("should require min 1 vote and weight 2 for LOW_RISK", async () => {
      setupCheckConsensus(
        [{ vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false }],
        "LOW"
      );

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(true);
      expect(result.outcome).toBe("APPROVED");
    });

    it("should require min 2 votes and weight 4 for MEDIUM_RISK", async () => {
      setupCheckConsensus(
        [{ vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false }],
        "MEDIUM"
      );

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(false);
    });

    it("should meet MEDIUM_RISK quorum with 2 MANAGER votes", async () => {
      setupCheckConsensus(
        [
          { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
          { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
        ],
        "MEDIUM"
      );

      const result = await service.checkConsensus("queue-1");

      expect(result.quorum_met).toBe(true);
      expect(result.total_votes).toBe(2);
      expect(result.outcome).toBe("APPROVED");
    });

    it("should not reach consensus for HIGH_RISK with insufficient weight", async () => {
      // 2 MANAGER votes (weight 2 each = 4 total) but HIGH_RISK needs min_weight 6
      setupCheckConsensus(
        [
          { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
          { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
        ],
        "HIGH"
      );

      const result = await service.checkConsensus("queue-1");

      // quorum_met checks only vote count (2 >= 2), which passes
      expect(result.quorum_met).toBe(true);
      expect(result.total_votes).toBe(2);
      // But consensus not reached because weight (4) < min_weight (6)
      expect(result.reached).toBe(false);
    });

    it("should not meet quorum for HIGH_RISK with single OWNER vote", async () => {
      // 1 OWNER vote (weight 10) but HIGH_RISK needs min_votes=2
      setupCheckConsensus(
        [{ vote: "APPROVE", vote_weight: 10, voter_role: "OWNER", is_override: false }],
        "HIGH"
      );

      const result = await service.checkConsensus("queue-1");

      // Only 1 vote, HIGH_RISK needs min_votes=2
      expect(result.quorum_met).toBe(false);
      expect(result.reached).toBe(false);
    });
  });

  describe("Consensus Determination", () => {
    function setupCheckConsensus(votes: any[], riskLevel: string = "LOW") {
      setQueryResults([
        { data: votes, error: null },
        { data: { autonomy_proposals: { risk_level: riskLevel } }, error: null },
      ]);
    }

    it("should approve when all votes are APPROVE", async () => {
      setupCheckConsensus([
        { vote: "APPROVE", vote_weight: 10, voter_role: "OWNER", is_override: false },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
      ]);

      const result = await service.checkConsensus("queue-1");

      expect(result.outcome).toBe("APPROVED");
      expect(result.approve_weight).toBe(12);
      expect(result.reject_weight).toBe(0);
    });

    it("should reject when reject weight exceeds approve weight", async () => {
      setupCheckConsensus([
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
        { vote: "REJECT", vote_weight: 10, voter_role: "OWNER", is_override: false },
      ]);

      const result = await service.checkConsensus("queue-1");

      expect(result.outcome).toBe("REJECTED");
      expect(result.reject_weight).toBe(10);
    });

    it("should return PENDING when no votes cast", async () => {
      setupCheckConsensus([], "MEDIUM");

      const result = await service.checkConsensus("queue-1");

      expect(result.reached).toBe(false);
      expect(result.quorum_met).toBe(false);
    });

    it("should handle DEFER votes as neutral", async () => {
      setupCheckConsensus([
        { vote: "DEFER", vote_weight: 2, voter_role: "MANAGER", is_override: false },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
      ]);

      const result = await service.checkConsensus("queue-1");

      expect(result.approve_weight).toBe(2);
    });

    it("should handle ABSTAIN votes", async () => {
      setupCheckConsensus([
        { vote: "ABSTAIN", vote_weight: 10, voter_role: "OWNER", is_override: false },
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", is_override: false },
      ]);

      const result = await service.checkConsensus("queue-1");

      // ABSTAIN is filtered out of total_votes count
      expect(result.total_votes).toBe(1);
    });
  });

  describe("Conflict Detection", () => {
    // detectConflicts flow:
    // 1. getVotes: select votes with order -> thenable
    // 2. get queue item .single()
    // 3. (per conflict) check existing conflict .single()
    // 4. (per conflict) insert conflict .single()
    // 5. (per conflict) log activity -> thenable
    // Also: checkConsensus is called for deadlock check

    it("should detect CONFLICTING_VOTES between managers", async () => {
      const votes = [
        { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-1", vote_weight: 2, is_override: false },
        { vote: "REJECT", voter_role: "MANAGER", voter_id: "user-2", vote_weight: 2, is_override: false },
      ];

      setQueryResults([
        // 1. getVotes -> thenable
        { data: votes, error: null },
        // 2. get queue item .single()
        { data: { organization_id: "org-1", expires_at: new Date(Date.now() + 86400000).toISOString() }, error: null },
        // 3. check existing conflict .single() - not found
        { data: null, error: { code: "PGRST116" } },
        // 4. insert conflict .single()
        { data: { id: "conflict-1", queue_item_id: "queue-1", conflict_type: "CONFLICTING_VOTES", description: "Managers have conflicting votes", status: "OPEN" }, error: null },
        // 5. log activity -> thenable
        { data: null, error: null },
        // 6. checkConsensus: get votes -> thenable
        { data: votes, error: null },
        // 7. checkConsensus: get risk level .single()
        { data: { autonomy_proposals: { risk_level: "MEDIUM" } }, error: null },
        // 8. QUORUM_DEADLOCK conflict: check existing .single()
        { data: null, error: { code: "PGRST116" } },
        // 9. insert deadlock conflict .single()
        { data: { id: "conflict-2", conflict_type: "QUORUM_DEADLOCK", status: "OPEN" }, error: null },
        // 10. log activity -> thenable
        { data: null, error: null },
      ]);

      const conflicts = await service.detectConflicts("queue-1");

      expect(conflicts.length).toBeGreaterThan(0);
      const conflictingVotes = conflicts.find(
        (c) => c.conflict_type === "CONFLICTING_VOTES"
      );
      expect(conflictingVotes).toBeDefined();
    });

    it("should detect EXPIRED_REVIEW for old pending items", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      setQueryResults([
        // 1. getVotes -> thenable (need >= 2 votes for conflict detection to proceed)
        { data: [
          { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-1", vote_weight: 2, is_override: false },
          { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-2", vote_weight: 2, is_override: false },
        ], error: null },
        // 2. get queue item .single() - expired
        { data: { organization_id: "org-1", expires_at: oldDate.toISOString() }, error: null },
        // 3. check existing expired conflict .single()
        { data: null, error: { code: "PGRST116" } },
        // 4. insert expired conflict .single()
        { data: { id: "conflict-1", conflict_type: "EXPIRED_REVIEW", status: "OPEN" }, error: null },
        // 5. log activity -> thenable
        { data: null, error: null },
        // 6-7. checkConsensus
        { data: [
          { vote: "APPROVE", vote_weight: 2, is_override: false },
          { vote: "APPROVE", vote_weight: 2, is_override: false },
        ], error: null },
        { data: { autonomy_proposals: { risk_level: "LOW" } }, error: null },
      ]);

      const conflicts = await service.detectConflicts("queue-1");

      const expired = conflicts.find(
        (c) => c.conflict_type === "EXPIRED_REVIEW"
      );
      expect(expired).toBeDefined();
    });

    it("should not flag EXPIRED_REVIEW for recent items", async () => {
      const futureDate = new Date(Date.now() + 86400000 * 7); // 7 days from now

      setQueryResults([
        // 1. getVotes -> thenable (need >= 2)
        { data: [
          { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-1", vote_weight: 2, is_override: false },
          { vote: "APPROVE", voter_role: "MANAGER", voter_id: "user-2", vote_weight: 2, is_override: false },
        ], error: null },
        // 2. get queue item .single() - not expired
        { data: { organization_id: "org-1", expires_at: futureDate.toISOString() }, error: null },
        // 3-4. checkConsensus
        { data: [
          { vote: "APPROVE", vote_weight: 2, is_override: false },
          { vote: "APPROVE", vote_weight: 2, is_override: false },
        ], error: null },
        { data: { autonomy_proposals: { risk_level: "LOW" } }, error: null },
      ]);

      const conflicts = await service.detectConflicts("queue-1");

      const expired = conflicts.find(
        (c) => c.conflict_type === "EXPIRED_REVIEW"
      );
      expect(expired).toBeUndefined();
    });

    it("should detect QUORUM_DEADLOCK with equal weights", async () => {
      const votes = [
        { vote: "APPROVE", vote_weight: 2, voter_role: "MANAGER", voter_id: "user-1", is_override: false },
        { vote: "REJECT", vote_weight: 2, voter_role: "MANAGER", voter_id: "user-2", is_override: false },
        { vote: "ABSTAIN", vote_weight: 0, voter_role: "ANALYST", voter_id: "user-3", is_override: false },
      ];

      setQueryResults([
        // 1. getVotes -> thenable
        { data: votes, error: null },
        // 2. get queue item .single()
        { data: { organization_id: "org-1", expires_at: new Date(Date.now() + 86400000).toISOString() }, error: null },
        // 3. CONFLICTING_VOTES: check existing .single()
        { data: null, error: { code: "PGRST116" } },
        // 4. insert conflict .single()
        { data: { id: "conflict-1", conflict_type: "CONFLICTING_VOTES", status: "OPEN" }, error: null },
        // 5. log -> thenable
        { data: null, error: null },
        // 6-7. checkConsensus
        { data: votes, error: null },
        { data: { autonomy_proposals: { risk_level: "MEDIUM" } }, error: null },
        // 8. QUORUM_DEADLOCK: check existing .single()
        { data: null, error: { code: "PGRST116" } },
        // 9. insert deadlock .single()
        { data: { id: "conflict-2", queue_item_id: "queue-1", conflict_type: "QUORUM_DEADLOCK", description: "Voting deadlock", status: "OPEN" }, error: null },
        // 10. log -> thenable
        { data: null, error: null },
      ]);

      const conflicts = await service.detectConflicts("queue-1");

      const deadlock = conflicts.find(
        (c) => c.conflict_type === "QUORUM_DEADLOCK"
      );
      expect(deadlock).toBeDefined();
    });
  });

  describe("Conflict Resolution", () => {
    it("should resolve a conflict successfully", async () => {
      setQueryResults([
        // 1. fetch conflict .single()
        { data: { queue_item_id: "queue-1", organization_id: "org-1" }, error: null },
        // 2. update conflict -> thenable
        { data: null, error: null },
        // 3. logActivity -> thenable
        { data: null, error: null },
      ]);

      await expect(
        service.resolveConflict(
          "conflict-1",
          "user-1",
          "Escalated to leadership"
        )
      ).resolves.not.toThrow();
    });

    it("should log activity when resolving conflict", async () => {
      setQueryResults([
        { data: { queue_item_id: "queue-1", organization_id: "org-1" }, error: null },
        { data: null, error: null }, // update
        { data: null, error: null }, // log
      ]);

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

      setQueryResults([
        // getActivityStream -> thenable
        { data: activities, error: null },
      ]);

      const result = await service.getActivityStream("org-1", 50);

      expect(result).toHaveLength(2);
      expect(result[0].action_type).toBe("VOTE_CAST");
    });

    it("should respect limit parameter", async () => {
      setQueryResults([
        { data: [], error: null },
      ]);

      await service.getActivityStream("org-1", 10);

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it("should order by created_at descending", async () => {
      setQueryResults([
        { data: [], error: null },
      ]);

      await service.getActivityStream("org-1");

      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });
  });
});
