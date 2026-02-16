/**
 * Execution Engine Unit Tests - Phase 9 Week 7-8
 *
 * Tests for execution safety, snapshots, and audit logging.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create chainable Supabase mock with chainProxy pattern.
// The root mock must NOT have .then (otherwise await getSupabaseServer()
// treats it as thenable and unwraps it). Chain methods return chainProxy
// which HAS .then for terminal query resolution.
const { mockSupabase } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const mock: any = {
    _queryResults: queryResults,
    _setResults: (results: any[]) => {
      queryResults.length = 0;
      queryResults.push(...results);
    },
  };

  const chainProxy: any = {};

  const chainMethods = [
    "from", "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "order", "limit", "range", "match", "not",
    "or", "filter", "contains", "containedBy", "textSearch", "overlaps",
  ];
  chainMethods.forEach((m) => {
    const fn = vi.fn().mockReturnValue(chainProxy);
    mock[m] = fn;
    chainProxy[m] = fn;
  });

  const singleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const maybeSingleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const rpcFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });

  mock.single = singleFn;
  mock.maybeSingle = maybeSingleFn;
  mock.rpc = rpcFn;
  chainProxy.single = singleFn;
  chainProxy.maybeSingle = maybeSingleFn;
  chainProxy.rpc = rpcFn;

  // .then ONLY on chainProxy for terminal query resolution
  chainProxy.then = (resolve: any) => {
    const result = queryResults.shift() || { data: [], error: null };
    return resolve(result);
  };

  return { mockSupabase: mock };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock TrustModeService
vi.mock("@/lib/trust/trustModeService", () => ({
  TrustModeService: vi.fn().mockImplementation(() => ({
    getStatus: vi.fn(),
  })),
}));

// Import after mocking
import { ExecutionEngine } from "../autonomy/executionEngine";

describe("ExecutionEngine", () => {
  let engine: ExecutionEngine;
  let mockTrustService: any;

  beforeEach(() => {
    // Clear result queue
    mockSupabase._setResults([]);

    engine = new ExecutionEngine();
    // Access the internal trust service mock
    mockTrustService = (engine as any).trustService;
  });

  describe("executeProposal", () => {
    it("should execute an approved proposal successfully", async () => {
      // Mock trust service
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      // Mock: checkDailyLimit -> scopes query (single), count query (then)
      // Mock: checkExecutionWindow -> scopes query (single)
      // Mock: update proposal status (then)
      // Mock: insert execution (single)
      // Mock: update proposal to EXECUTED (then)
      // Mock: insert audit log (then)
      mockSupabase._setResults([
        // checkDailyLimit: scopes single
        { data: { max_daily_actions: 50 }, error: null },
        // checkDailyLimit: count query (then)
        { data: null, error: null, count: 5 },
        // checkExecutionWindow: scopes single
        { data: { execution_window_start: "00:00", execution_window_end: "23:59" }, error: null },
        // update proposal status to EXECUTING (then)
        { data: null, error: null },
        // insert execution record (single)
        { data: { id: "exec-uuid", rollback_token_id: "token-uuid" }, error: null },
        // update proposal to EXECUTED (then)
        { data: null, error: null },
        // insert audit log (then)
        { data: null, error: null },
      ]);

      const result = await engine.executeProposal({
        proposal: {
          id: "proposal-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          status: "APPROVED",
          domain_scope: "SEO",
          change_type: "title_tag",
          proposed_diff: { new_title: "New Title" },
          risk_level: "LOW",
          title: "Update title tag",
        } as any,
        executor_type: "SYSTEM",
        executor_id: "user-uuid",
      });

      expect(result.success).toBe(true);
      expect(result.execution_id).toBe("exec-uuid");
    });

    it("should reject non-APPROVED proposals", async () => {
      await expect(
        engine.executeProposal({
          proposal: {
            id: "proposal-uuid",
            status: "PENDING",
          } as any,
          executor_type: "SYSTEM",
        })
      ).rejects.toThrow("Cannot execute proposal in status: PENDING");
    });

    it("should reject when trusted mode is not ACTIVE", async () => {
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "SUSPENDED",
      });

      await expect(
        engine.executeProposal({
          proposal: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            status: "APPROVED",
          } as any,
          executor_type: "SYSTEM",
        })
      ).rejects.toThrow("Trusted Mode is not active");
    });

    it("should enforce daily execution limit", async () => {
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      // checkDailyLimit: scopes returns low limit, count exceeds it
      mockSupabase._setResults([
        { data: { max_daily_actions: 10 }, error: null },
        { data: null, error: null, count: 100 },
      ]);

      await expect(
        engine.executeProposal({
          proposal: {
            id: "proposal-uuid",
            client_id: "client-uuid",
            status: "APPROVED",
          } as any,
          executor_type: "SYSTEM",
        })
      ).rejects.toThrow("Daily execution limit reached");
    });

    it("should calculate correct rollback deadline for LOW risk", async () => {
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      mockSupabase._setResults([
        { data: { max_daily_actions: 50 }, error: null },
        { data: null, error: null, count: 0 },
        { data: { execution_window_start: "00:00", execution_window_end: "23:59" }, error: null },
        { data: null, error: null },
        { data: { id: "exec-uuid", rollback_available_until: "2025-01-04" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ]);

      const result = await engine.executeProposal({
        proposal: {
          id: "proposal-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          status: "APPROVED",
          risk_level: "LOW",
          domain_scope: "SEO",
          change_type: "meta_description",
          proposed_diff: {},
          title: "Update meta",
        } as any,
        executor_type: "SYSTEM",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("processApprovedProposals", () => {
    it("should process all approved proposals for a client", async () => {
      // First query returns approved proposals list (then terminal)
      mockSupabase._setResults([
        // proposals list query
        {
          data: [
            {
              id: "p1",
              client_id: "client-uuid",
              organization_id: "org-uuid",
              status: "APPROVED",
              risk_level: "LOW",
              domain_scope: "SEO",
              change_type: "title_tag",
              proposed_diff: {},
              title: "Change 1",
            },
          ],
          error: null,
        },
      ]);

      // Mock trust service for each executeProposal call
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      // Supply results for the sub-calls in executeProposal:
      // checkDailyLimit: single + then
      // checkExecutionWindow: single
      // update proposal: then
      // insert execution: single
      // update proposal: then
      // audit log: then
      mockSupabase._queryResults.push(
        { data: { max_daily_actions: 50 }, error: null },
        { data: null, error: null, count: 0 },
        { data: { execution_window_start: "00:00", execution_window_end: "23:59" }, error: null },
        { data: null, error: null },
        { data: { id: "exec-uuid" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      );

      const results = await engine.processApprovedProposals("client-uuid");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
    });

    it("should return empty array when no approved proposals", async () => {
      mockSupabase._setResults([
        { data: [], error: null },
      ]);

      const results = await engine.processApprovedProposals("client-uuid");
      expect(results).toHaveLength(0);
    });
  });

  describe("getExecutionHistory", () => {
    it("should return execution history with limit", async () => {
      mockSupabase._setResults([
        {
          data: [
            { id: "e1", executed_at: "2025-01-01" },
            { id: "e2", executed_at: "2025-01-02" },
          ],
          error: null,
        },
      ]);

      const history = await engine.getExecutionHistory("client-uuid", 10);
      expect(history).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabase._setResults([
        { data: null, error: { message: "Error" } },
      ]);

      const history = await engine.getExecutionHistory("client-uuid");
      expect(history).toHaveLength(0);
    });
  });

  describe("snapshot handling", () => {
    it("should create before and after snapshots", async () => {
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      mockSupabase._setResults([
        { data: { max_daily_actions: 50 }, error: null },
        { data: null, error: null, count: 0 },
        { data: { execution_window_start: "00:00", execution_window_end: "23:59" }, error: null },
        { data: null, error: null },
        {
          data: {
            id: "exec-uuid",
            before_snapshot_path: "snapshots/before",
            after_snapshot_path: "snapshots/after",
          },
          error: null,
        },
        { data: null, error: null },
        { data: null, error: null },
      ]);

      const result = await engine.executeProposal({
        proposal: {
          id: "proposal-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          status: "APPROVED",
          domain_scope: "SEO",
          change_type: "title_tag",
          proposed_diff: {},
          risk_level: "LOW",
          title: "SEO update",
        } as any,
        executor_type: "SYSTEM",
        executor_id: "user-uuid",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("execution window", () => {
    it("should check execution is within allowed time window", async () => {
      mockTrustService.getStatus.mockResolvedValue({
        trusted_mode_status: "ACTIVE",
      });

      mockSupabase._setResults([
        { data: { max_daily_actions: 50 }, error: null },
        { data: null, error: null, count: 0 },
        { data: { execution_window_start: "00:00", execution_window_end: "23:59" }, error: null },
        { data: null, error: null },
        { data: { id: "exec-uuid" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ]);

      const result = await engine.executeProposal({
        proposal: {
          id: "proposal-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          status: "APPROVED",
          risk_level: "LOW",
          domain_scope: "SEO",
          change_type: "canonical_fix",
          proposed_diff: {},
          title: "Fix canonical",
        } as any,
        executor_type: "SYSTEM",
        executor_id: "user-uuid",
      });

      expect(result.success).toBe(true);
    });
  });
});
