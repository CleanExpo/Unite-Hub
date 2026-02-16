/**
 * Autonomy Lifecycle Integration Tests - Phase 9 Week 9
 *
 * End-to-end tests covering the complete autonomy workflow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase (hoisted above vi.mock)
const { mockSupabase, mockGetSupabaseServer } = vi.hoisted(() => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
  };
  const mockGetSupabaseServer = vi.fn().mockResolvedValue(mockSupabase);
  return { mockSupabase, mockGetSupabaseServer };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: mockGetSupabaseServer,
}));

// Import services after mocking
import { TrustModeService } from "@/lib/trust/trustModeService";
import { ProposalEngine } from "@/lib/autonomy/proposalEngine";
import { ExecutionEngine } from "@/lib/autonomy/executionEngine";
import { RollbackEngine } from "@/lib/autonomy/rollbackEngine";

describe("Autonomy Lifecycle Integration Tests", () => {
  let trustService: TrustModeService;
  let proposalEngine: ProposalEngine;
  let executionEngine: ExecutionEngine;
  let rollbackEngine: RollbackEngine;

  const testClientId = "test-client-uuid";
  const testOrgId = "test-org-uuid";
  const testUserId = "test-user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-establish getSupabaseServer mock after clearAllMocks
    mockGetSupabaseServer.mockResolvedValue(mockSupabase);

    trustService = new TrustModeService();
    proposalEngine = new ProposalEngine();
    executionEngine = new ExecutionEngine();
    rollbackEngine = new RollbackEngine();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.neq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.lte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockReturnThis();
    mockSupabase.upsert.mockReturnThis();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Complete Trust Mode → Proposal → Execution → Rollback Flow", () => {
    it("should complete full lifecycle for LOW risk proposal", async () => {
      // Step 1: Initialize Trusted Mode
      // initializeTrustedMode(clientId, organizationId, initiatedBy, options)
      // First call: check existing request -> not found
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
        // Second call: insert new request
        .mockResolvedValueOnce({
          data: {
            id: "trust-request-uuid",
            client_id: testClientId,
            status: "PENDING_IDENTITY",
          },
          error: null,
        });

      const trustRequest = await trustService.initializeTrustedMode(
        testClientId,
        testOrgId,
        testUserId,
        { restore_email: "restore@example.com" }
      );

      expect(trustRequest.status).toBe("PENDING_IDENTITY");

      // Step 2+3: Create LOW risk proposal (should auto-approve)
      // The trust mode is checked during proposal validation.
      // createProposal -> validateProposal -> isChangeAllowed (2 queries) + 2 more queries + insert
      mockSupabase.single
        // isChangeAllowed: check trusted_mode_requests status -> ACTIVE
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: check autonomy_scopes (forbidden/allowed changes)
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true }, max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: check autonomy_scopes max_risk_level_allowed
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: check trusted_mode_requests for auto-approve
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // createProposal: insert into autonomy_proposals
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            status: "APPROVED",
            risk_level: "LOW",
          },
          error: null,
        });

      const proposal = await proposalEngine.createProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Update meta title",
        proposed_diff: { title: "New Title" },
        created_by: testUserId,
      });

      expect(proposal.status).toBe("APPROVED");
      expect(proposal.risk_level).toBe("LOW");

      // Step 4: Execute proposal
      // executeProposal expects { proposal, executor_type, executor_id }
      // It calls getStatus (multiple DB calls), checkDailyLimit, checkExecutionWindow, etc.
      const proposalObj = {
        id: "proposal-uuid",
        client_id: testClientId,
        organization_id: testOrgId,
        status: "APPROVED" as const,
        risk_level: "LOW",
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Update meta title",
        proposed_diff: { title: "New Title" },
        rollback_token_id: "rollback-token-uuid",
        rollback_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      };

      // executeProposal .single() calls (6 total):
      // 1. getStatus: trusted_mode_requests
      // 2. getStatus: autonomy_scopes
      // (count queries don't use .single())
      // 3. getStatus: last execution
      // 4. checkDailyLimit: autonomy_scopes
      // (count query doesn't use .single())
      // 5. checkExecutionWindow: autonomy_scopes
      // 6. insert execution record
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })          // 1
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true } }, error: null }) // 2
        .mockResolvedValueOnce({ data: null, error: null })                           // 3 last execution
        .mockResolvedValueOnce({ data: { max_daily_actions: 10 }, error: null })      // 4 checkDailyLimit scopes
        .mockResolvedValueOnce({ data: null, error: null })                           // 5 checkExecutionWindow scopes
        .mockResolvedValueOnce({                                                       // 6 insert execution
          data: {
            id: "execution-uuid",
            rollback_token_id: "rollback-token-uuid",
            rollback_available_until: new Date(
              Date.now() + 72 * 60 * 60 * 1000
            ).toISOString(),
          },
          error: null,
        });

      const execution = await executionEngine.executeProposal({
        proposal: proposalObj as any,
        executor_type: "HUMAN",
        executor_id: testUserId,
      });

      expect(execution.success).toBe(true);
      expect(execution.execution_id).toBeDefined();

      // Step 5: Check rollback availability
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "execution-uuid",
          rollback_available_until: futureDate,
          autonomy_proposals: {
            status: "EXECUTED",
            rollback_deadline: futureDate,
          },
        },
        error: null,
      });

      const availability = await rollbackEngine.isRollbackAvailable(
        "rollback-token-uuid"
      );

      expect(availability.available).toBe(true);
    });

    it("should require manual approval for HIGH risk proposal", async () => {
      // Create HIGH risk proposal
      // validateProposal internal calls
      mockSupabase.single
        // isChangeAllowed: trusted_mode_requests status
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true }, max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: autonomy_scopes max_risk_level_allowed
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: trusted_mode_requests for auto-approve
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // createProposal: insert
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            status: "PENDING",
            risk_level: "HIGH",
          },
          error: null,
        });

      const proposal = await proposalEngine.createProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "robots_txt_modify",
        title: "Modify robots.txt",
        proposed_diff: { content: "Allow: /" },
        created_by: testUserId,
      });

      expect(proposal.status).toBe("PENDING");
      expect(proposal.risk_level).toBe("HIGH");

      // Manual approval
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "PENDING", client_id: testClientId, organization_id: testOrgId },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "APPROVED" },
          error: null,
        });

      const approved = await proposalEngine.approveProposal(
        "proposal-uuid",
        testUserId,
        "Reviewed and approved"
      );

      expect(approved.status).toBe("APPROVED");
    });

    it("should reject forbidden change types", async () => {
      // isChangeAllowed: trusted_mode_requests status -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes with forbidden changes
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: { enabled: true, forbidden_changes: ["domain_redirect"] },
            max_risk_level_allowed: "HIGH",
          },
          error: null,
        })
        // validateProposal: autonomy_scopes max risk
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null });

      await expect(
        proposalEngine.createProposal({
          client_id: testClientId,
          organization_id: testOrgId,
          trigger: { type: "MANUAL", data: {} },
          domain_scope: "SEO",
          change_type: "domain_redirect",
          title: "Redirect domain",
          proposed_diff: {},
          created_by: testUserId,
        })
      ).rejects.toThrow("validation failed");
    });

    it("should enforce rollback deadline", async () => {
      const pastDeadline = new Date(Date.now() - 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "execution-uuid",
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
        rollbackEngine.rollback({
          rollback_token_id: "token-uuid",
          requested_by: testUserId,
          reason: "Test",
        })
      ).rejects.toThrow("Rollback deadline has passed");
    });

    it("should prevent duplicate rollbacks", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "execution-uuid", proposal_id: "proposal-uuid" },
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
        rollbackEngine.rollback({
          rollback_token_id: "token-uuid",
          requested_by: testUserId,
          reason: "Test",
        })
      ).rejects.toThrow("already been rolled back");
    });
  });

  describe("Trust Mode Status Enforcement", () => {
    it("should reject proposals when trust mode is not ACTIVE", async () => {
      // isChangeAllowed: trusted_mode_requests status -> not ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "PENDING_SIGNATURE" }, error: null })
        // isChangeAllowed returns {allowed: false, reason: "...not active..."}
        // validateProposal: autonomy_scopes
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "PENDING_SIGNATURE" }, error: null });

      await expect(
        proposalEngine.createProposal({
          client_id: testClientId,
          organization_id: testOrgId,
          trigger: { type: "MANUAL", data: {} },
          domain_scope: "SEO",
          change_type: "meta_update",
          title: "Test proposal",
          proposed_diff: {},
          created_by: testUserId,
        })
      ).rejects.toThrow("not active");
    });

    it("should reject execution when trust mode is suspended", async () => {
      const proposalObj = {
        id: "proposal-uuid",
        client_id: testClientId,
        organization_id: testOrgId,
        status: "APPROVED" as const,
        risk_level: "LOW",
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Test",
        proposed_diff: {},
      };

      // getStatus: trusted_mode_requests -> SUSPENDED
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "SUSPENDED" }, error: null })
        // getStatus: autonomy_scopes
        .mockResolvedValueOnce({ data: null, error: null })
        // getStatus: pending proposals count
        .mockResolvedValueOnce({ data: null, error: null, count: 0 })
        // getStatus: executions count
        .mockResolvedValueOnce({ data: null, error: null, count: 0 })
        // getStatus: last execution
        .mockResolvedValueOnce({ data: null, error: null });

      await expect(
        executionEngine.executeProposal({
          proposal: proposalObj as any,
          executor_type: "HUMAN",
          executor_id: testUserId,
        })
      ).rejects.toThrow("not active");
    });
  });

  describe("Domain-Specific Validation", () => {
    it("should allow SEO meta_update changes", async () => {
      // isChangeAllowed: trusted_mode_requests -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true }, max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: autonomy_scopes
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: trusted_mode_requests for auto-approve
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null });

      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Test",
        proposed_diff: { title: "New" },
      });

      expect(result.valid).toBe(true);
    });

    it("should reject ADS budget_increase changes (HIGH risk)", async () => {
      // isChangeAllowed: trusted_mode_requests -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes (only LOW allowed)
        .mockResolvedValueOnce({ data: { ads_scope_json: { enabled: true }, max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: autonomy_scopes max_risk_level_allowed
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null });

      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "ADS",
        change_type: "budget_increase",
        title: "Test",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should reject CONTENT mass_content_delete changes (HIGH risk)", async () => {
      // isChangeAllowed: trusted_mode_requests -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes (only LOW allowed)
        .mockResolvedValueOnce({ data: { content_scope_json: { enabled: true }, max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: autonomy_scopes max_risk_level_allowed
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "LOW" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null });

      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "CONTENT",
        change_type: "mass_content_delete",
        title: "Test",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should reject CRO variant_mass_delete changes (HIGH risk via forbidden)", async () => {
      // isChangeAllowed: trusted_mode_requests -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes with forbidden changes
        .mockResolvedValueOnce({
          data: {
            cro_scope_json: { enabled: true, forbidden_changes: ["variant_mass_delete"] },
            max_risk_level_allowed: "HIGH",
          },
          error: null,
        })
        // validateProposal: autonomy_scopes
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null });

      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "CRO",
        change_type: "variant_mass_delete",
        title: "Test",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Execution Limits", () => {
    it("should enforce daily execution limit", async () => {
      const proposalObj = {
        id: "proposal-uuid",
        client_id: testClientId,
        organization_id: testOrgId,
        status: "APPROVED" as const,
        risk_level: "LOW",
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Test",
        proposed_diff: {},
      };

      // .single() calls: getStatus(3) + checkDailyLimit(1) = 4
      // checkDailyLimit count query doesn't use .single() - chain resolves to mockSupabase
      // count = undefined -> (count || 0) = 0
      // max_daily_actions = 5 -> 0 < 5 = true (within limit)
      // To exceed the limit, we override gte to return { count: 100 }
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })    // getStatus: trusted_mode_requests
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true } }, error: null }) // getStatus: autonomy_scopes
        .mockResolvedValueOnce({ data: null, error: null })                     // getStatus: last execution
        .mockResolvedValueOnce({ data: { max_daily_actions: 5 }, error: null }); // checkDailyLimit: scopes

      // Override gte to return a thenable with count exceeding the limit for the checkDailyLimit query
      let gteCallCount = 0;
      mockSupabase.gte.mockImplementation(() => {
        gteCallCount++;
        // 1st gte: getStatus's executedToday count -> return chain
        if (gteCallCount === 1) return mockSupabase;
        // 2nd gte: checkDailyLimit count -> return promise with count > max_daily_actions
        return Promise.resolve({ data: null, error: null, count: 100 });
      });

      await expect(
        executionEngine.executeProposal({
          proposal: proposalObj as any,
          executor_type: "HUMAN",
          executor_id: testUserId,
        })
      ).rejects.toThrow("Daily execution limit");
    });
  });

  describe("Rollback Type Selection", () => {
    it("should select SOFT_UNDO for recent LOW risk", async () => {
      const futureDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const recentExecution = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "execution-uuid",
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
            client_id: testClientId,
            organization_id: testOrgId,
            status: "EXECUTED",
            risk_level: "LOW",
            proposed_diff: { old_value: "A", new_value: "B" },
            rollback_deadline: futureDeadline,
            change_type: "meta_update",
          },
          error: null,
        });

      const result = await rollbackEngine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: testUserId,
        reason: "Test",
      });

      expect(result.rollback_type).toBe("SOFT_UNDO");
    });

    it("should select HARD_UNDO for older executions", async () => {
      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const olderExecution = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "execution-uuid",
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
            client_id: testClientId,
            organization_id: testOrgId,
            status: "EXECUTED",
            risk_level: "MEDIUM",
            rollback_deadline: futureDeadline,
            change_type: "h1_change",
          },
          error: null,
        });

      const result = await rollbackEngine.rollback({
        rollback_token_id: "token-uuid",
        requested_by: testUserId,
        reason: "Test",
      });

      expect(result.rollback_type).toBe("HARD_UNDO");
    });
  });

  describe("Audit Trail", () => {
    it("should log proposal creation", async () => {
      // isChangeAllowed: trusted_mode_requests -> ACTIVE
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // isChangeAllowed: autonomy_scopes
        .mockResolvedValueOnce({ data: { seo_scope_json: { enabled: true }, max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: autonomy_scopes
        .mockResolvedValueOnce({ data: { max_risk_level_allowed: "HIGH" }, error: null })
        // validateProposal: trusted_mode_requests
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        // createProposal: insert
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            status: "APPROVED",
            risk_level: "LOW",
          },
          error: null,
        });

      await proposalEngine.createProposal({
        client_id: testClientId,
        organization_id: testOrgId,
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "meta_update",
        title: "Test proposal",
        proposed_diff: {},
        created_by: testUserId,
      });

      // Verify audit log insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith("autonomy_audit_log");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});
