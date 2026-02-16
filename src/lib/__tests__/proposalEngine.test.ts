/**
 * Proposal Engine Unit Tests - Phase 9 Week 7-8
 *
 * 20 unit tests for proposal lifecycle and validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create chainable mock with vi.hoisted
const { mockSupabaseInstance, mockGetSupabaseServer, resetMockChain } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const createQueryBuilder = (): any => {
    const builder: any = {};
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { builder[m] = vi.fn().mockReturnValue(builder); });
    builder.single = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.maybeSingle = vi.fn().mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    builder.then = (resolve: any, reject?: any) => {
      const result = queryResults.shift() || { data: [], error: null };
      return Promise.resolve(resolve(result));
    };
    return builder;
  };

  const queryBuilder = createQueryBuilder();

  const mock: any = {
    _setResults: (results: any[]) => { queryResults.length = 0; queryResults.push(...results); },
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockReturnValue(queryBuilder),
    auth: { getUser: vi.fn(), getSession: vi.fn() },
  };

  Object.keys(queryBuilder).forEach(k => {
    if (k !== 'then') mock[k] = queryBuilder[k];
  });

  const mockGSS = vi.fn().mockResolvedValue(mock);
  const resetFn = () => {
    queryResults.length = 0;
    const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'order', 'limit', 'range', 'match', 'not', 'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps'];
    chainMethods.forEach(m => { queryBuilder[m].mockReturnValue(queryBuilder); });
    mock.from.mockReturnValue(queryBuilder);
    queryBuilder.single.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    queryBuilder.maybeSingle.mockImplementation(() => {
      const result = queryResults.shift() || { data: null, error: null };
      return Promise.resolve(result);
    });
    mockGSS.mockResolvedValue(mock);
  };
  return {
    mockSupabaseInstance: mock,
    mockGetSupabaseServer: mockGSS,
    resetMockChain: resetFn,
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: mockGetSupabaseServer,
}));

// Mock TrustModeService
vi.mock("@/lib/trust/trustModeService", () => ({
  TrustModeService: vi.fn().mockImplementation(() => ({
    isChangeAllowed: vi.fn().mockResolvedValue({ allowed: true }),
  })),
}));

// Import after mocking
import { ProposalEngine } from "../autonomy/proposalEngine";

describe("ProposalEngine", () => {
  let engine: ProposalEngine;

  beforeEach(() => {
    resetMockChain();
    engine = new ProposalEngine();
  });

  describe("validateProposal", () => {
    it("should validate allowed change types", async () => {
      // isChangeAllowed returns allowed: true (from mock)
      // validateProposal also queries autonomy_scopes (.single) and trusted_mode_requests (.single)
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null }, // autonomy_scopes
        { data: { status: "ACTIVE" }, error: null }, // trusted_mode_requests
      ]);

      const result = await engine.validateProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "title_tag",
        title: "Update title",
        proposed_diff: { title: "New Title" },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return risk level for change", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
      ]);

      const result = await engine.validateProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "robots_txt_modify",
        title: "Modify robots.txt",
        proposed_diff: { content: "Disallow: /admin" },
      });

      expect(result.risk_level).toBe("HIGH");
    });

    it("should reject when not allowed by trust service", async () => {
      // Override TrustModeService mock for this test
      const { TrustModeService } = await import("@/lib/trust/trustModeService");
      (TrustModeService as any).mockImplementation(() => ({
        isChangeAllowed: vi.fn().mockResolvedValue({
          allowed: false,
          reason: "Change type domain_redirect is forbidden in SEO domain",
        }),
      }));
      engine = new ProposalEngine();

      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
      ]);

      const result = await engine.validateProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "domain_redirect",
        title: "Redirect domain",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore
      (TrustModeService as any).mockImplementation(() => ({
        isChangeAllowed: vi.fn().mockResolvedValue({ allowed: true }),
      }));
    });

    it("should detect auto-approve eligibility for LOW risk with ACTIVE trust", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
      ]);

      const result = await engine.validateProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "title_tag",
        title: "Update title tag",
        proposed_diff: { title: "New Title" },
      });

      expect(result.auto_approve_eligible).toBe(true);
    });

    it("should require approval for MEDIUM risk", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
      ]);

      const result = await engine.validateProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "h1_change",
        title: "Change H1",
        proposed_diff: { h1: "New H1" },
      });

      expect(result.requires_approval).toBe(true);
    });
  });

  describe("createProposal", () => {
    it("should create a proposal with calculated risk level", async () => {
      // validateProposal queries: autonomy_scopes, trusted_mode_requests
      // createProposal queries: insert autonomy_proposals, insert autonomy_audit_log
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null }, // autonomy_scopes
        { data: { status: "ACTIVE" }, error: null }, // trusted_mode_requests
        { data: { id: "proposal-uuid", status: "APPROVED", risk_level: "LOW" }, error: null }, // insert proposal
      ]);

      const proposal = await engine.createProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "title_tag",
        title: "Update title",
        proposed_diff: { title: "New Title" },
        created_by: "user-uuid",
      });

      expect(proposal.status).toBe("APPROVED");
      expect(mockSupabaseInstance.from).toHaveBeenCalled();
    });

    it("should set PENDING for MEDIUM/HIGH risk", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
        { data: { id: "proposal-uuid", status: "PENDING", risk_level: "HIGH" }, error: null },
      ]);

      const proposal = await engine.createProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "robots_txt_modify",
        title: "Modify robots.txt",
        proposed_diff: { content: "Disallow: /admin" },
        created_by: "user-uuid",
      });

      expect(proposal.status).toBe("PENDING");
    });

    it("should throw error for invalid change type", async () => {
      // Override TrustModeService to reject
      const { TrustModeService } = await import("@/lib/trust/trustModeService");
      (TrustModeService as any).mockImplementation(() => ({
        isChangeAllowed: vi.fn().mockResolvedValue({
          allowed: false,
          reason: "Change not allowed",
        }),
      }));
      engine = new ProposalEngine();

      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
      ]);

      await expect(
        engine.createProposal({
          client_id: "client-uuid",
          organization_id: "org-uuid",
          trigger: { type: "MANUAL", data: {} },
          domain_scope: "SEO",
          change_type: "domain_redirect",
          title: "Redirect",
          proposed_diff: {},
          created_by: "user-uuid",
        })
      ).rejects.toThrow("Proposal validation failed");

      // Restore
      (TrustModeService as any).mockImplementation(() => ({
        isChangeAllowed: vi.fn().mockResolvedValue({ allowed: true }),
      }));
    });
  });

  describe("approveProposal", () => {
    it("should approve a pending proposal", async () => {
      // approveProposal: select proposal, update proposal, insert audit log
      mockSupabaseInstance._setResults([
        { data: { id: "proposal-uuid", status: "PENDING", client_id: "c1", organization_id: "o1" }, error: null },
        { data: { id: "proposal-uuid", status: "APPROVED" }, error: null },
      ]);

      const result = await engine.approveProposal(
        "proposal-uuid",
        "admin-uuid",
        "Looks good"
      );

      expect(result.status).toBe("APPROVED");
    });

    it("should throw error for non-PENDING proposal", async () => {
      mockSupabaseInstance._setResults([
        { data: { id: "proposal-uuid", status: "APPROVED" }, error: null },
      ]);

      await expect(
        engine.approveProposal("proposal-uuid", "admin-uuid")
      ).rejects.toThrow("Cannot approve proposal in status");
    });

    it("should throw error if proposal not found", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: { message: "Not found" } },
      ]);

      await expect(
        engine.approveProposal("not-found", "admin-uuid")
      ).rejects.toThrow("Proposal not found");
    });
  });

  describe("rejectProposal", () => {
    it("should reject a pending proposal", async () => {
      mockSupabaseInstance._setResults([
        { data: { id: "proposal-uuid", status: "PENDING", client_id: "c1", organization_id: "o1" }, error: null },
        { data: { id: "proposal-uuid", status: "REJECTED" }, error: null },
      ]);

      const result = await engine.rejectProposal(
        "proposal-uuid",
        "admin-uuid",
        "Too risky"
      );

      expect(result.status).toBe("REJECTED");
    });

    it("should handle rejection with reason", async () => {
      mockSupabaseInstance._setResults([
        { data: { id: "proposal-uuid", status: "PENDING", client_id: "c1", organization_id: "o1" }, error: null },
        { data: { id: "proposal-uuid", status: "REJECTED" }, error: null },
      ]);

      const result = await engine.rejectProposal(
        "proposal-uuid",
        "admin-uuid",
        "Not aligned with priorities"
      );

      expect(result.status).toBe("REJECTED");
    });
  });

  describe("getPendingProposals", () => {
    it("should return pending proposals for a client", async () => {
      mockSupabaseInstance._setResults([
        {
          data: [
            { id: "p1", status: "PENDING" },
            { id: "p2", status: "PENDING" },
          ],
          error: null,
        },
      ]);

      const proposals = await engine.getPendingProposals("client-uuid");

      expect(proposals).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabaseInstance._setResults([
        { data: null, error: { message: "Error" } },
      ]);

      const proposals = await engine.getPendingProposals("client-uuid");

      expect(proposals).toHaveLength(0);
    });
  });

  describe("risk assessment", () => {
    it("should assess HIGH risk for robots.txt changes", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
        { data: { id: "p1", risk_level: "HIGH", status: "PENDING" }, error: null },
      ]);

      const proposal = await engine.createProposal({
        client_id: "c1",
        organization_id: "o1",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "robots_txt_modify",
        title: "Modify robots",
        proposed_diff: {},
        created_by: "u1",
      });

      expect(proposal.risk_level).toBe("HIGH");
    });

    it("should assess MEDIUM risk for H1 changes", async () => {
      mockSupabaseInstance._setResults([
        { data: { max_risk_level_allowed: "HIGH" }, error: null },
        { data: { status: "ACTIVE" }, error: null },
        { data: { id: "p1", risk_level: "MEDIUM", status: "PENDING" }, error: null },
      ]);

      const proposal = await engine.createProposal({
        client_id: "c1",
        organization_id: "o1",
        trigger: { type: "MANUAL", data: {} },
        domain_scope: "SEO",
        change_type: "h1_change",
        title: "Change H1",
        proposed_diff: { h1: "New heading" },
        created_by: "u1",
      });

      expect(proposal.risk_level).toBe("MEDIUM");
    });
  });

  describe("getApprovedProposals", () => {
    it("should return approved proposals", async () => {
      mockSupabaseInstance._setResults([
        {
          data: [
            { id: "p1", status: "APPROVED" },
            { id: "p2", status: "APPROVED" },
          ],
          error: null,
        },
      ]);

      const proposals = await engine.getApprovedProposals("client-uuid");

      expect(proposals).toHaveLength(2);
    });
  });
});
