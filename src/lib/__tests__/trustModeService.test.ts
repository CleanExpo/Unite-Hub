/**
 * Trust Mode Service Unit Tests - Phase 9 Week 1-2
 *
 * 20 unit tests for Trusted Mode functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase with sequential query results pattern
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
  const mock: any = { from: vi.fn().mockReturnValue(queryChain) };

  // Expose chain methods on root EXCLUDING 'then'
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
}));

// Import after mocking
import { TrustModeService } from "../trust/trustModeService";

describe("TrustModeService", () => {
  let service: TrustModeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TrustModeService();
    setQueryResults([]);
  });

  describe("initializeTrustedMode", () => {
    it("should create a new trusted mode request", async () => {
      setQueryResults([
        // 1. Check existing -> null (no existing request)
        { data: null, error: null },
        // 2. Insert new request -> .single()
        {
          data: {
            id: "request-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
            restore_email: "admin@test.com",
          },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

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
      setQueryResults([
        // 1. Check existing -> found with PENDING_OWNERSHIP (not revoked/rejected)
        {
          data: {
            id: "existing-uuid",
            client_id: "client-uuid",
            status: "PENDING_OWNERSHIP",
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Check existing -> found with REJECTED status
        {
          data: {
            id: "old-uuid",
            client_id: "client-uuid",
            status: "REJECTED",
          },
          error: null,
        },
        // 2. Update (restart) -> .single()
        {
          data: {
            id: "old-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        },
        // 2. Update -> .single()
        {
          data: {
            status: "PENDING_OWNERSHIP",
            identity_verification_result: { verified: true },
          },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

      const result = await service.verifyIdentity("client-uuid", {
        verified: true,
        method: "ABN_ACN",
        abn_acn: "12345678901",
        legal_name: "Test Company Pty Ltd",
      });

      expect(result.status).toBe("PENDING_OWNERSHIP");
    });

    it("should reject if verification fails", async () => {
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_IDENTITY",
          },
          error: null,
        },
        // 2. Update -> .single()
        {
          data: { status: "REJECTED" },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

      const result = await service.verifyIdentity("client-uuid", {
        verified: false,
        method: "ABN_ACN",
        notes: "ABN not found",
      });

      expect(result.status).toBe("REJECTED");
    });

    it("should throw error if status is not PENDING_IDENTITY", async () => {
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            status: "ACTIVE",
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_OWNERSHIP",
          },
          error: null,
        },
        // 2. Update -> .single()
        {
          data: { status: "PENDING_SIGNATURE" },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

      const result = await service.verifyOwnership("client-uuid", {
        verified: true,
        method: "GSC",
        domain: "example.com",
        gsc_property_id: "sc-domain:example.com",
      });

      expect(result.status).toBe("PENDING_SIGNATURE");
    });

    it("should support DNS verification method", async () => {
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_OWNERSHIP",
          },
          error: null,
        },
        // 2. Update -> .single()
        {
          data: { status: "PENDING_SIGNATURE" },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

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
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_SIGNATURE",
          },
          error: null,
        },
        // 2. Update request -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 3. createDefaultScopes: check existing -> .single()
        { data: null, error: null },
        // 4. createDefaultScopes: insert -> .single()
        {
          data: { client_id: "client-uuid" },
          error: null,
        },
        // 5. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

      const result = await service.recordSignature("client-uuid", {
        document_id: "doc-123",
        provider: "docusign",
        signer_email: "owner@test.com",
        signer_ip: "192.168.1.1",
      });

      expect(result.status).toBe("ACTIVE");
    });

    it("should create default autonomy scopes", async () => {
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "PENDING_SIGNATURE",
          },
          error: null,
        },
        // 2. Update request -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 3. createDefaultScopes: check existing -> .single()
        { data: null, error: null },
        // 4. createDefaultScopes: insert -> .single()
        {
          data: {
            client_id: "client-uuid",
            seo_scope_json: { enabled: false },
          },
          error: null,
        },
        // 5. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

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
      setQueryResults([
        // 1. Fetch existing scopes -> .single()
        {
          data: {
            client_id: "client-uuid",
            seo_scope_json: { enabled: false },
            content_scope_json: {},
            ads_scope_json: {},
            cro_scope_json: {},
          },
          error: null,
        },
        // 2. Update scopes -> .single()
        {
          data: {
            seo_scope_json: {
              enabled: true,
              auto_fix_technical: true,
            },
          },
          error: null,
        },
      ]);

      const result = await service.configureScopes("client-uuid", {
        seo_scope: {
          enabled: true,
          auto_fix_technical: true,
        },
      });

      expect(result.seo_scope_json.enabled).toBe(true);
    });

    it("should update multiple domains at once", async () => {
      setQueryResults([
        // 1. Fetch existing scopes -> .single()
        {
          data: {
            client_id: "client-uuid",
            seo_scope_json: {},
            content_scope_json: {},
            ads_scope_json: {},
            cro_scope_json: {},
          },
          error: null,
        },
        // 2. Update scopes -> .single()
        {
          data: {
            seo_scope_json: { enabled: true },
            content_scope_json: { enabled: true },
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Get trusted_mode_requests -> .single()
        {
          data: {
            client_id: "client-uuid",
            status: "ACTIVE",
            identity_verification_result: { verified: true },
            ownership_verification_result: { verified: true },
            signed_at: "2025-01-20T00:00:00Z",
          },
          error: null,
        },
        // 2. Get autonomy_scopes -> .single()
        {
          data: {
            seo_scope_json: { enabled: true },
            content_scope_json: { enabled: false },
            ads_scope_json: { enabled: false },
            cro_scope_json: { enabled: false },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        },
        // 3. Get pending proposals count -> thenable (count query)
        { count: 5, error: null },
        // 4. Get today's executions count -> thenable (count query)
        { count: 3, error: null },
        // 5. Get last execution -> .single()
        {
          data: { executed_at: "2025-01-20T10:00:00Z" },
          error: null,
        },
      ]);

      const status = await service.getStatus("client-uuid");

      expect(status.trusted_mode_status).toBe("ACTIVE");
      expect(status.identity_verified).toBe(true);
      expect(status.ownership_verified).toBe(true);
      expect(status.signature_complete).toBe(true);
    });

    it("should return default status if no request exists", async () => {
      setQueryResults([
        // 1. Get trusted_mode_requests -> .single() (not found)
        { data: null, error: null },
        // 2. Get autonomy_scopes -> .single() (not found)
        { data: null, error: null },
        // 3. Get pending proposals count -> thenable
        { count: 0, error: null },
        // 4. Get today's executions count -> thenable
        { count: 0, error: null },
        // 5. Get last execution -> .single()
        { data: null, error: null },
      ]);

      const status = await service.getStatus("client-uuid");

      expect(status.trusted_mode_status).toBe("PENDING_IDENTITY");
      expect(status.enabled_domains).toHaveLength(0);
    });
  });

  describe("revokeTrustedMode", () => {
    it("should set status to REVOKED", async () => {
      setQueryResults([
        // 1. Fetch request -> .single()
        {
          data: {
            client_id: "client-uuid",
            organization_id: "org-uuid",
            status: "ACTIVE",
          },
          error: null,
        },
        // 2. Update -> .single()
        {
          data: { status: "REVOKED" },
          error: null,
        },
        // 3. logAuditEvent -> insert thenable
        { data: null, error: null },
      ]);

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
      setQueryResults([
        // 1. Check trusted mode status -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 2. Get scopes -> .single()
        {
          data: {
            seo_scope_json: {
              enabled: true,
              allowed_changes: ["title_tag", "meta_description"],
              forbidden_changes: [],
            },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        },
      ]);

      const result = await service.isChangeAllowed(
        "client-uuid",
        "SEO",
        "title_tag",
        "LOW"
      );

      expect(result.allowed).toBe(true);
    });

    it("should reject if Trusted Mode not active", async () => {
      setQueryResults([
        // 1. Check trusted mode status -> .single()
        {
          data: { status: "PENDING_SIGNATURE" },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Check trusted mode status -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 2. Get scopes -> .single()
        {
          data: {
            seo_scope_json: { enabled: true },
            max_risk_level_allowed: "LOW",
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Check trusted mode status -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 2. Get scopes -> .single()
        {
          data: {
            seo_scope_json: {
              enabled: true,
              forbidden_changes: ["domain_redirect"],
            },
            max_risk_level_allowed: "HIGH",
          },
          error: null,
        },
      ]);

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
      setQueryResults([
        // 1. Check trusted mode status -> .single()
        {
          data: { status: "ACTIVE" },
          error: null,
        },
        // 2. Get scopes -> .single()
        {
          data: {
            content_scope_json: { enabled: false },
            max_risk_level_allowed: "MEDIUM",
          },
          error: null,
        },
      ]);

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
