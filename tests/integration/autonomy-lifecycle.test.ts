/**
 * Autonomy Lifecycle Integration Tests - Phase 9 Week 9
 *
 * End-to-end tests covering the complete autonomy workflow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase (hoisted above vi.mock)
const { mockSupabase } = vi.hoisted(() => {
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
  };
  return { mockSupabase };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
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
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Complete Trust Mode → Proposal → Execution → Rollback Flow", () => {
    it("should complete full lifecycle for LOW risk proposal", async () => {
      // Step 1: Initialize Trusted Mode
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // No existing request
        .mockResolvedValueOnce({
          data: {
            id: "trust-request-uuid",
            client_id: testClientId,
            status: "PENDING_IDENTITY",
          },
          error: null,
        });

      const trustRequest = await trustService.initializeTrustedMode({
        client_id: testClientId,
        organization_id: testOrgId,
        business_name: "Test Business",
        business_type: "LLC",
        primary_contact_name: "John Doe",
        primary_contact_email: "john@example.com",
        primary_contact_phone: "555-1234",
        tax_id: "12-3456789",
        restore_email: "restore@example.com",
      });

      expect(trustRequest.status).toBe("PENDING_IDENTITY");

      // Step 2: Activate Trusted Mode (simulate all verification steps)
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: "ACTIVE" },
        error: null,
      });

      // Step 3: Create LOW risk proposal (should auto-approve)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
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
        domain: "SEO",
        change_type: "meta_update",
        proposed_diff: { title: "New Title" },
        rationale: "Improve CTR",
        created_by: testUserId,
      });

      expect(proposal.status).toBe("APPROVED");
      expect(proposal.risk_level).toBe("LOW");

      // Step 4: Execute proposal
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: testClientId,
            organization_id: testOrgId,
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
        proposal_id: "proposal-uuid",
        executed_by: testUserId,
      });

      expect(execution.success).toBe(true);
      expect(execution.rollback_token_id).toBeDefined();

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
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
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
        domain: "SEO",
        change_type: "robots_txt_allow",
        proposed_diff: { content: "Allow: /" },
        rationale: "Open crawling",
        created_by: testUserId,
      });

      expect(proposal.status).toBe("PENDING");
      expect(proposal.risk_level).toBe("HIGH");

      // Manual approval
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "PENDING" },
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
      await expect(
        proposalEngine.createProposal({
          client_id: testClientId,
          organization_id: testOrgId,
          domain: "SEO",
          change_type: "domain_redirect",
          proposed_diff: {},
          rationale: "Test",
          created_by: testUserId,
        })
      ).rejects.toThrow("Validation failed");
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
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: "PENDING_SIGNATURE" },
        error: null,
      });

      await expect(
        proposalEngine.createProposal({
          client_id: testClientId,
          organization_id: testOrgId,
          domain: "SEO",
          change_type: "meta_update",
          proposed_diff: {},
          rationale: "Test",
          created_by: testUserId,
        })
      ).rejects.toThrow("Trusted mode not active");
    });

    it("should reject execution when trust mode is suspended", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: testClientId,
            status: "APPROVED",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "SUSPENDED" },
          error: null,
        });

      const result = await executionEngine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Trusted mode is not ACTIVE");
    });
  });

  describe("Domain-Specific Validation", () => {
    it("should allow SEO meta_update changes", async () => {
      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        domain: "SEO",
        change_type: "meta_update",
        proposed_diff: { title: "New" },
      });

      expect(result.valid).toBe(true);
    });

    it("should reject ADS budget_increase changes", async () => {
      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        domain: "ADS",
        change_type: "budget_increase",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should reject CONTENT mass_content_delete changes", async () => {
      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        domain: "CONTENT",
        change_type: "mass_content_delete",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should reject CRO variant_mass_delete changes", async () => {
      const result = await proposalEngine.validateProposal({
        client_id: testClientId,
        domain: "CRO",
        change_type: "variant_mass_delete",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Execution Limits", () => {
    it("should enforce daily execution limit", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            client_id: testClientId,
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
        count: 100,
      });

      const result = await executionEngine.executeProposal({
        proposal_id: "proposal-uuid",
        executed_by: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Daily execution limit");
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
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
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
        domain: "SEO",
        change_type: "meta_update",
        proposed_diff: {},
        rationale: "Test",
        created_by: testUserId,
      });

      // Verify audit log insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith("autonomy_audit_log");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});
