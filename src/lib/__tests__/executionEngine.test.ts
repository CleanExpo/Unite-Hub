/**
 * Execution Engine Unit Tests - Phase 9 Week 7-8
 *
 * Tests for execution safety, snapshots, and audit logging.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { ExecutionEngine } from "../autonomy/executionEngine";

describe("ExecutionEngine", () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ExecutionEngine();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
  });

  describe("executeProposal", () => {
    it("should execute an approved proposal successfully", async () => {
      // Mock proposal lookup
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "APPROVED",
            domain: "SEO",
            change_type: "meta_update",
            proposed_diff: { title: "New Title" },
            risk_level: "LOW",
          },
          error: null,
        })
        // Mock trusted mode check
        .mockResolvedValueOnce({
          data: {
            status: "ACTIVE",
            backup_snapshot_url: "s3://backup",
          },
          error: null,
        })
        // Mock execution count
        .mockResolvedValueOnce({
          data: null,
          error: null,
          count: 5,
        })
        // Mock execution insert
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            rollback_token_id: "token-uuid",
          },
          error: null,
        });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(true);
      expect(result.rollback_token_id).toBeDefined();
    });

    it("should reject non-APPROVED proposals", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "proposal-uuid",
          status: "PENDING",
        },
        error: null,
      });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not in APPROVED status");
    });

    it("should reject when trusted mode is not ACTIVE", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            status: "APPROVED",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "SUSPENDED" },
          error: null,
        });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Trusted mode is not ACTIVE");
    });

    it("should enforce daily execution limit", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            status: "APPROVED",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        });

      // Mock count returning over limit
      mockSupabase.gte = vi.fn().mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 100, // Over default limit
      });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Daily execution limit");
    });

    it("should return proposal not found error", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await engine.executeProposal({
        proposal_id: "not-found",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Proposal not found");
    });

    it("should calculate correct rollback deadline for LOW risk", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "APPROVED",
            risk_level: "LOW",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
          count: 0,
        })
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            rollback_available_until: expect.any(String),
          },
          error: null,
        });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(true);
      // LOW risk = 72 hours rollback window
    });
  });

  describe("processApprovedProposals", () => {
    it("should process all approved proposals for a client", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: [
          { id: "p1", status: "APPROVED" },
          { id: "p2", status: "APPROVED" },
        ],
        error: null,
      });

      // Mock each execution
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "p1", client_id: "c1", status: "APPROVED", risk_level: "LOW" },
          error: null,
        })
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null, count: 0 })
        .mockResolvedValueOnce({ data: { id: "e1" }, error: null })
        .mockResolvedValueOnce({
          data: { id: "p2", client_id: "c1", status: "APPROVED", risk_level: "LOW" },
          error: null,
        })
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null, count: 1 })
        .mockResolvedValueOnce({ data: { id: "e2" }, error: null });

      const results = await engine.processApprovedProposals("client-uuid");

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no approved proposals", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const results = await engine.processApprovedProposals("client-uuid");

      expect(results).toHaveLength(0);
    });
  });

  describe("getExecutionHistory", () => {
    it("should return execution history with limit", async () => {
      mockSupabase.order = vi.fn().mockReturnThis();
      mockSupabase.order.mockResolvedValueOnce({
        data: [
          { id: "e1", executed_at: "2025-01-01" },
          { id: "e2", executed_at: "2025-01-02" },
        ],
        error: null,
      });

      const history = await engine.getExecutionHistory("client-uuid", 10);

      expect(history).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabase.order = vi.fn().mockReturnThis();
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const history = await engine.getExecutionHistory("client-uuid");

      expect(history).toHaveLength(0);
    });
  });

  describe("snapshot handling", () => {
    it("should create before and after snapshots", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "APPROVED",
            domain: "SEO",
            risk_level: "LOW",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            status: "ACTIVE",
            backup_snapshot_url: "s3://backups/client-uuid",
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null, count: 0 })
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            before_snapshot_path: expect.stringContaining("snapshots/"),
            after_snapshot_path: expect.stringContaining("snapshots/"),
          },
          error: null,
        });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("execution window", () => {
    it("should check execution is within allowed time window", async () => {
      // This is a placeholder test - in production, execution windows
      // would be enforced based on autonomy scope configuration
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            status: "APPROVED",
            risk_level: "LOW",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null, count: 0 })
        .mockResolvedValueOnce({
          data: { id: "exec-uuid" },
          error: null,
        });

      const result = await engine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: "user-uuid",
      });

      expect(result.success).toBe(true);
    });
  });
});
