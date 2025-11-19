/**
 * Trust Mode Service Unit Tests - Phase 9 Week 1-2
 *
 * 20 unit tests for Trusted Mode functionality.
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
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { TrustModeService } from "../trust/trustModeService";

describe("TrustModeService", () => {
  let service: TrustModeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TrustModeService();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.limit.mockReturnThis();
  });

  describe("initializeTrustedMode", () => {
    it("should create a new trusted mode request", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null }) // Check existing
        .mockResolvedValueOnce({
          data: {
            id: "request-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
            restore_email: "admin@test.com",
          },
          error: null,
        }); // Insert

      const result = await service.initializeTrustedMode(
        "client-uuid",
        "org-uuid",
        "user-uuid",
        { restore_email: "admin@test.com" }
      );

      expect(result.status).toBe("PENDING_IDENTITY");
      expect(result.restore_email).toBe("admin@test.com");
    });

    it("should return existing request if already initiated", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "existing-uuid",
          client_id: "client-uuid",
          status: "PENDING_OWNERSHIP",
        },
        error: null,
      });

      const result = await service.initializeTrustedMode(
        "client-uuid",
        "org-uuid",
        "user-uuid",
        { restore_email: "admin@test.com" }
      );

      expect(result.id).toBe("existing-uuid");
      expect(result.status).toBe("PENDING_OWNERSHIP");
    });

    it("should restart if previously rejected", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "old-uuid",
            client_id: "client-uuid",
            status: "REJECTED",
          },
          error: null,
        }) // Check existing
        .mockResolvedValueOnce({
          data: {
            id: "old-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        }); // Update

      const result = await service.initializeTrustedMode(
        "client-uuid",
        "org-uuid",
        "user-uuid",
        { restore_email: "admin@test.com" }
      );

      expect(result.status).toBe("PENDING_IDENTITY");
    });
  });

  describe("verifyIdentity", () => {
    it("should advance to PENDING_OWNERSHIP on successful verification", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        }) // Fetch request
        .mockResolvedValueOnce({
          data: {
            status: "PENDING_OWNERSHIP",
            identity_verification_result: { verified: true },
          },
          error: null,
        }); // Update

      const result = await service.verifyIdentity("client-uuid", {
        verified: true,
        method: "ABN_ACN",
        abn_acn: "12345678901",
        legal_name: "Test Company Pty Ltd",
      });

      expect(result.status).toBe("PENDING_OWNERSHIP");
    });

    it("should reject if verification fails", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "REJECTED" },
          error: null,
        });

      const result = await service.verifyIdentity("client-uuid", {
        verified: false,
        method: "ABN_ACN",
        notes: "ABN not found",
      });

      expect(result.status).toBe("REJECTED");
    });

    it("should throw error if status is not PENDING_IDENTITY", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          client_id: "client-uuid",
          status: "ACTIVE",
        },
        error: null,
      });

      await expect(
        service.verifyIdentity("client-uuid", {
          verified: true,
          method: "ABN_ACN",
        })
      ).rejects.toThrow("Invalid status");
    });
  });

  describe("verifyOwnership", () => {
    it("should advance to PENDING_SIGNATURE on successful verification", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_OWNERSHIP",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "PENDING_SIGNATURE" },
          error: null,
        });

      const result = await service.verifyOwnership("client-uuid", {
        verified: true,
        method: "GSC",
        domain: "example.com",
        gsc_property_id: "sc-domain:example.com",
      });

      expect(result.status).toBe("PENDING_SIGNATURE");
    });

    it("should support DNS verification method", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_OWNERSHIP",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "PENDING_SIGNATURE" },
          error: null,
        });

      const result = await service.verifyOwnership("client-uuid", {
        verified: true,
        method: "DNS_TXT",
        domain: "example.com",
        dns_record: "unite-hub-verify=abc123",
      });

      expect(result.status).toBe("PENDING_SIGNATURE");
    });
  });

  describe("recordSignature", () => {
    it("should activate Trusted Mode after signature", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_SIGNATURE",
          },
          error: null,
        }) // Fetch request
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        }) // Update request
        .mockResolvedValueOnce({ data: null, error: null }) // Check existing scopes
        .mockResolvedValueOnce({
          data: { client_id: "client-uuid" },
          error: null,
        }); // Create scopes

      const result = await service.recordSignature("client-uuid", {
        document_id: "doc-123",
        provider: "docusign",
        signer_email: "owner@test.com",
        signer_ip: "192.168.1.1",
      });

      expect(result.status).toBe("ACTIVE");
    });

    it("should create default autonomy scopes", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_SIGNATURE",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            seo_scope_json: { enabled: false },
          },
          error: null,
        });

      await service.recordSignature("client-uuid", {
        document_id: "doc-123",
        provider: "hellosign",
        signer_email: "owner@test.com",
      });

      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("configureScopes", () => {
    it("should update SEO scope configuration", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            seo_scope_json: { enabled: false },
            content_scope_json: {},
            ads_scope_json: {},
            cro_scope_json: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: {
              enabled: true,
              auto_fix_technical: true,
            },
          },
          error: null,
        });

      const result = await service.configureScopes("client-uuid", {
        seo_scope: {
          enabled: true,
          auto_fix_technical: true,
        },
      });

      expect(result.seo_scope_json.enabled).toBe(true);
    });

    it("should update multiple domains at once", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            seo_scope_json: {},
            content_scope_json: {},
            ads_scope_json: {},
            cro_scope_json: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: { enabled: true },
            content_scope_json: { enabled: true },
          },
          error: null,
        });

      const result = await service.configureScopes("client-uuid", {
        seo_scope: { enabled: true },
        content_scope: { enabled: true },
        max_daily_actions: 20,
      });

      expect(result).toBeDefined();
    });
  });

  describe("getStatus", () => {
    it("should return complete trust status", async () => {
      // Mock all the queries
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            status: "ACTIVE",
            identity_verification_result: { verified: true },
            ownership_verification_result: { verified: true },
            signed_at: "2025-01-20T00:00:00Z",
          },
          error: null,
        }) // Request
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: { enabled: true },
            content_scope_json: { enabled: false },
            ads_scope_json: { enabled: false },
            cro_scope_json: { enabled: false },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        }) // Scopes
        .mockResolvedValueOnce({
          data: { executed_at: "2025-01-20T10:00:00Z" },
          error: null,
        }); // Last execution

      // Mock count queries
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === "autonomy_proposals") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }),
          };
        }
        if (table === "autonomy_executions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 3 }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({
                    data: { executed_at: "2025-01-20T10:00:00Z" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return mockSupabase;
      });

      const status = await service.getStatus("client-uuid");

      expect(status.trusted_mode_status).toBe("ACTIVE");
      expect(status.identity_verified).toBe(true);
      expect(status.ownership_verified).toBe(true);
      expect(status.signature_complete).toBe(true);
    });

    it("should return default status if no request exists", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const status = await service.getStatus("client-uuid");

      expect(status.trusted_mode_status).toBe("PENDING_IDENTITY");
      expect(status.enabled_domains).toHaveLength(0);
    });
  });

  describe("revokeTrustedMode", () => {
    it("should set status to REVOKED", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "ACTIVE",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { status: "REVOKED" },
          error: null,
        });

      const result = await service.revokeTrustedMode(
        "client-uuid",
        "admin-uuid",
        "Client requested revocation"
      );

      expect(result.status).toBe("REVOKED");
    });
  });

  describe("isChangeAllowed", () => {
    it("should allow change within scope", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: {
              enabled: true,
              allowed_changes: ["title_tag", "meta_description"],
              forbidden_changes: [],
            },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        });

      const result = await service.isChangeAllowed(
        "client-uuid",
        "SEO",
        "title_tag",
        "LOW"
      );

      expect(result.allowed).toBe(true);
    });

    it("should reject if Trusted Mode not active", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { status: "PENDING_SIGNATURE" },
        error: null,
      });

      const result = await service.isChangeAllowed(
        "client-uuid",
        "SEO",
        "title_tag",
        "LOW"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should reject if risk level exceeds maximum", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: { enabled: true },
            max_risk_level_allowed: "LOW",
          },
          error: null,
        });

      const result = await service.isChangeAllowed(
        "client-uuid",
        "SEO",
        "title_tag",
        "HIGH"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("exceeds maximum");
    });

    it("should reject forbidden change types", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            seo_scope_json: {
              enabled: true,
              forbidden_changes: ["domain_redirect"],
            },
            max_risk_level_allowed: "HIGH",
          },
          error: null,
        });

      const result = await service.isChangeAllowed(
        "client-uuid",
        "SEO",
        "domain_redirect",
        "HIGH"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("forbidden");
    });

    it("should reject if domain scope not enabled", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { status: "ACTIVE" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            content_scope_json: { enabled: false },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        });

      const result = await service.isChangeAllowed(
        "client-uuid",
        "CONTENT",
        "blog_post",
        "LOW"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not enabled");
    });
  });
});
