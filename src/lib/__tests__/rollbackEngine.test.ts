/**
 * Rollback Engine Unit Tests - Phase 9 Week 7-8
 *
 * Tests for rollback operations, deadline enforcement, and audit.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const { mockSupabase } = vi.hoisted(() => {
  const mock: any = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
  };
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  return { mockSupabase: mock };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { RollbackEngine } from "../autonomy/rollbackEngine";

describe("RollbackEngine", () => {
  let engine: RollbackEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new RollbackEngine();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
  });

  describe("isRollbackAvailable", () => {
    it("should return available when within deadline", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "exec-uuid",
          rollback_available_until: futureDate,
          autonomy_proposals: {
            status: "EXECUTED",
            rollback_deadline: futureDate,
          },
        },
        error: null,
      });

      const result = await engine.isRollbackAvailable("token-uuid");

      expect(result.available).toBe(true);
      expect(result.deadline).toBeDefined();
    });

    it("should return unavailable when past deadline", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "exec-uuid",
          rollback_available_until: pastDate,
          autonomy_proposals: {
            status: "EXECUTED",
            rollback_deadline: pastDate,
          },
        },
        error: null,
      });

      const result = await engine.isRollbackAvailable("token-uuid");

      expect(result.available).toBe(false);
      expect(result.reason).toContain("deadline has passed");
    });

    it("should return unavailable when already rolled back", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "exec-uuid",
          autonomy_proposals: {
            status: "ROLLED_BACK",
          },
        },
        error: null,
      });

      const result = await engine.isRollbackAvailable("token-uuid");

      expect(result.available).toBe(false);
      expect(result.reason).toContain("Already rolled back");
    });

    it("should return unavailable when execution not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await engine.isRollbackAvailable("not-found");

      expect(result.available).toBe(false);
      expect(result.reason).toContain("not found");
    });
  });

  describe("rollback", () => {
    it("should perform SOFT_UNDO for recent LOW risk execution", async () => {
      const futureDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const recentExecution = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            executed_at: recentExecution,
            rollback_available_until: futureDeadline,
            before_snapshot_path: "snapshots/before",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "EXECUTED",
            risk_level: "LOW",
            change_type: "meta_update",
            proposed_diff: { old_value: "A", new_value: "B" },
            rollback_deadline: futureDeadline,
          },
          error: null,
        });

      const result = await engine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: "user-uuid",
        reason: "Client requested reversal",
      });

      expect(result.success).toBe(true);
      expect(result.rollback_type).toBe("SOFT_UNDO");
    });

    it("should perform HARD_UNDO for older executions", async () => {
      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const olderExecution = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days ago

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            executed_at: olderExecution,
            rollback_available_until: futureDeadline,
            before_snapshot_path: "snapshots/before",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "EXECUTED",
            risk_level: "MEDIUM",
            rollback_deadline: futureDeadline,
          },
          error: null,
        });

      const result = await engine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: "user-uuid",
        reason: "Issues discovered",
      });

      expect(result.success).toBe(true);
      expect(result.rollback_type).toBe("HARD_UNDO");
    });

    it("should perform ESCALATED_RESTORE for very old executions", async () => {
      const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const oldExecution = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            executed_at: oldExecution,
            rollback_available_until: futureDeadline,
            before_snapshot_path: "snapshots/before",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "EXECUTED",
            risk_level: "HIGH",
            rollback_deadline: futureDeadline,
          },
          error: null,
        })
        // Mock trust request for emergency contact
        .mockResolvedValueOnce({
          data: {
            restore_email: "admin@example.com",
            emergency_phone: "+1234567890",
          },
          error: null,
        });

      const result = await engine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: "user-uuid",
        reason: "Critical issue",
      });

      expect(result.success).toBe(true);
      expect(result.rollback_type).toBe("ESCALATED_RESTORE");
    });

    it("should throw error when execution not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await expect(
        engine.rollback({
          rollback_token_id: "not-found",
          requested_by: "user-uuid",
          reason: "Test",
        })
      ).rejects.toThrow("Execution not found");
    });

    it("should throw error when already rolled back", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "exec-uuid", proposal_id: "proposal-uuid" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            rolled_back_at: new Date().toISOString(),
          },
          error: null,
        });

      await expect(
        engine.rollback({
          rollback_token_id: "token-uuid",
          requested_by: "user-uuid",
          reason: "Test",
        })
      ).rejects.toThrow("already been rolled back");
    });

    it("should throw error when deadline passed", async () => {
      const pastDeadline = new Date(Date.now() - 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            rollback_available_until: pastDeadline,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            rollback_deadline: pastDeadline,
          },
          error: null,
        });

      await expect(
        engine.rollback({
          rollback_token_id: "token-uuid",
          requested_by: "user-uuid",
          reason: "Test",
        })
      ).rejects.toThrow("Rollback deadline has passed");
    });

    it("should allow explicit rollback type override", async () => {
      const futureDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            executed_at: new Date().toISOString(),
            rollback_available_until: futureDeadline,
            before_snapshot_path: "snapshots/before",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "EXECUTED",
            risk_level: "LOW",
            rollback_deadline: futureDeadline,
          },
          error: null,
        });

      const result = await engine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: "user-uuid",
        reason: "Test",
        rollback_type: "HARD_UNDO", // Override
      });

      expect(result.rollback_type).toBe("HARD_UNDO");
    });
  });

  describe("extendRollbackDeadline", () => {
    it("should extend the rollback deadline", async () => {
      const newDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            proposal_id: "proposal-uuid",
            client_id: "client-uuid",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { organization_id: "org-uuid" },
          error: null,
        });

      await engine.extendRollbackDeadline(
        "token-uuid",
        "admin-uuid",
        newDeadline
      );

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe("getRollbackHistory", () => {
    it("should return all rolled back proposals for client", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: [
          { id: "p1", status: "ROLLED_BACK", rolled_back_at: "2025-01-01" },
          { id: "p2", status: "ROLLED_BACK", rolled_back_at: "2025-01-02" },
        ],
        error: null,
      });

      const history = await engine.getRollbackHistory("client-uuid");

      expect(history).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const history = await engine.getRollbackHistory("client-uuid");

      expect(history).toHaveLength(0);
    });
  });

  describe("reverse diff generation", () => {
    it("should correctly reverse old_value/new_value pairs", async () => {
      const futureDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "exec-uuid",
            proposal_id: "proposal-uuid",
            executed_at: new Date().toISOString(),
            rollback_available_until: futureDeadline,
            before_snapshot_path: "snapshots/before",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "EXECUTED",
            risk_level: "LOW",
            change_type: "meta_update",
            proposed_diff: {
              old_value: "Original Title",
              new_value: "New Title",
            },
            rollback_deadline: futureDeadline,
          },
          error: null,
        });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await engine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: "user-uuid",
        reason: "Test",
      });

      // Verify reverse diff was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Reverse diff:",
        expect.stringContaining("Original Title")
      );

      consoleSpy.mockRestore();
    });
  });
});
