/**
 * Proposal Engine Unit Tests - Phase 9 Week 7-8
 *
 * 20 unit tests for proposal lifecycle and validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { ProposalEngine } from "../autonomy/proposalEngine";

describe("ProposalEngine", () => {
  let engine: ProposalEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ProposalEngine();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
  });

  describe("validateProposal", () => {
    it("should reject when change type is forbidden", async () => {
      const result = await engine.validateProposal({
        client_id: "client-uuid",
        domain: "SEO",
        change_type: "domain_redirect",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Change type domain_redirect is forbidden in SEO domain"
      );
    });

    it("should reject ADS domain budget changes", async () => {
      const result = await engine.validateProposal({
        client_id: "client-uuid",
        domain: "ADS",
        change_type: "budget_increase",
        proposed_diff: { amount: 1000 },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Change type budget_increase is forbidden in ADS domain"
      );
    });

    it("should reject CRO domain mass deletes", async () => {
      const result = await engine.validateProposal({
        client_id: "client-uuid",
        domain: "CRO",
        change_type: "variant_mass_delete",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should reject CONTENT domain major schema changes", async () => {
      const result = await engine.validateProposal({
        client_id: "client-uuid",
        domain: "CONTENT",
        change_type: "schema_major_change",
        proposed_diff: {},
      });

      expect(result.valid).toBe(false);
    });

    it("should validate allowed change types", async () => {
      const result = await engine.validateProposal({
        client_id: "client-uuid",
        domain: "SEO",
        change_type: "meta_update",
        proposed_diff: { title: "New Title" },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("createProposal", () => {
    it("should create a proposal with calculated risk level", async () => {
      // Mock trusted mode check
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "proposal-uuid",
            status: "PENDING",
            risk_level: "LOW",
          },
          error: null,
        });

      const proposal = await engine.createProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        domain: "SEO",
        change_type: "meta_update",
        proposed_diff: { title: "New Title" },
        rationale: "Improve CTR",
        created_by: "user-uuid",
      });

      expect(proposal.status).toBe("PENDING");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should auto-approve LOW risk proposals with ACTIVE trust", async () => {
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

      const proposal = await engine.createProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        domain: "CONTENT",
        change_type: "content_publish",
        proposed_diff: { slug: "new-post" },
        rationale: "New blog post",
        created_by: "user-uuid",
      });

      expect(proposal.status).toBe("APPROVED");
    });

    it("should set PENDING for MEDIUM/HIGH risk with approval", async () => {
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

      const proposal = await engine.createProposal({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        domain: "SEO",
        change_type: "robots_txt_modify",
        proposed_diff: { content: "Disallow: /admin" },
        rationale: "Block admin pages",
        created_by: "user-uuid",
      });

      expect(proposal.status).toBe("PENDING");
    });

    it("should throw error for invalid change type", async () => {
      await expect(
        engine.createProposal({
          client_id: "client-uuid",
          organization_id: "org-uuid",
          domain: "SEO",
          change_type: "domain_redirect",
          proposed_diff: {},
          rationale: "Test",
          created_by: "user-uuid",
        })
      ).rejects.toThrow("Validation failed");
    });

    it("should require ACTIVE trusted mode for proposals", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: "PENDING_SIGNATURE" },
        error: null,
      });

      await expect(
        engine.createProposal({
          client_id: "client-uuid",
          organization_id: "org-uuid",
          domain: "SEO",
          change_type: "meta_update",
          proposed_diff: {},
          rationale: "Test",
          created_by: "user-uuid",
        })
      ).rejects.toThrow("Trusted mode not active");
    });
  });

  describe("approveProposal", () => {
    it("should approve a pending proposal", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "PENDING" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "APPROVED" },
          error: null,
        });

      const result = await engine.approveProposal(
        "proposal-uuid",
        "admin-uuid",
        "Looks good"
      );

      expect(result.status).toBe("APPROVED");
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should throw error for non-PENDING proposal", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "proposal-uuid", status: "APPROVED" },
        error: null,
      });

      await expect(
        engine.approveProposal("proposal-uuid", "admin-uuid")
      ).rejects.toThrow("Only PENDING proposals can be approved");
    });

    it("should throw error if proposal not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await expect(
        engine.approveProposal("not-found", "admin-uuid")
      ).rejects.toThrow("Proposal not found");
    });
  });

  describe("rejectProposal", () => {
    it("should reject a pending proposal", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "PENDING" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "proposal-uuid", status: "REJECTED" },
          error: null,
        });

      const result = await engine.rejectProposal(
        "proposal-uuid",
        "admin-uuid",
        "Too risky"
      );

      expect(result.status).toBe("REJECTED");
    });

    it("should throw error for non-PENDING proposal", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "proposal-uuid", status: "EXECUTED" },
        error: null,
      });

      await expect(
        engine.rejectProposal("proposal-uuid", "admin-uuid", "Reason")
      ).rejects.toThrow("Only PENDING proposals can be rejected");
    });
  });

  describe("generateFromDelta", () => {
    it("should create proposals from delta changes", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { status: "ACTIVE" },
        error: null,
      });

      // Mock multiple proposal creations
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({
          data: { id: "proposal-1", status: "APPROVED" },
          error: null,
        })
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({
          data: { id: "proposal-2", status: "APPROVED" },
          error: null,
        });

      const proposals = await engine.generateFromDelta(
        "client-uuid",
        "org-uuid",
        {
          type: "weekly_report",
          changes: [
            {
              domain: "SEO",
              change_type: "meta_update",
              diff: { title: "New Title" },
              rationale: "CTR improvement",
            },
            {
              domain: "CONTENT",
              change_type: "content_update",
              diff: { body: "Updated content" },
              rationale: "Content refresh",
            },
          ],
        }
      );

      expect(proposals).toHaveLength(2);
    });
  });

  describe("risk assessment", () => {
    it("should assess HIGH risk for robots.txt changes", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({
          data: { id: "p1", risk_level: "HIGH", status: "PENDING" },
          error: null,
        });

      const proposal = await engine.createProposal({
        client_id: "c1",
        organization_id: "o1",
        domain: "SEO",
        change_type: "robots_txt_allow",
        proposed_diff: {},
        rationale: "test",
        created_by: "u1",
      });

      expect(proposal.risk_level).toBe("HIGH");
    });

    it("should assess MEDIUM risk for large diffs", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { status: "ACTIVE" }, error: null })
        .mockResolvedValueOnce({
          data: { id: "p1", risk_level: "MEDIUM", status: "PENDING" },
          error: null,
        });

      const largeDiff = { items: Array(15).fill({ field: "value" }) };

      const proposal = await engine.createProposal({
        client_id: "c1",
        organization_id: "o1",
        domain: "CONTENT",
        change_type: "content_update",
        proposed_diff: largeDiff,
        rationale: "test",
        created_by: "u1",
      });

      expect(proposal.risk_level).toBe("MEDIUM");
    });
  });

  describe("getProposalsByStatus", () => {
    it("should return proposals filtered by status", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: [
          { id: "p1", status: "PENDING" },
          { id: "p2", status: "PENDING" },
        ],
        error: null,
      });

      const proposals = await engine.getProposalsByStatus("client-uuid", "PENDING");

      expect(proposals).toHaveLength(2);
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "PENDING");
    });

    it("should return empty array on error", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const proposals = await engine.getProposalsByStatus("client-uuid", "PENDING");

      expect(proposals).toHaveLength(0);
    });
  });
});
