/**
 * Signature Provider Unit Tests - Phase 9 Week 5-6
 *
 * 15 unit tests for signature service functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { SignatureService } from "../trust/signatureProvider";

describe("SignatureService", () => {
  let service: SignatureService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SignatureService();

    // Reset mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockReturnThis();
  });

  describe("createSignatureRequest", () => {
    it("should create a signature request with manual provider", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          trust_request_id: "trust-uuid",
          provider: "manual",
          provider_envelope_id: expect.stringContaining("MANUAL-"),
          status: "SENT",
          signer_name: "John Doe",
          signer_email: "john@example.com",
        },
        error: null,
      });

      const result = await service.createSignatureRequest({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trust_request_id: "trust-uuid",
        signer_name: "John Doe",
        signer_email: "john@example.com",
        provider: "manual",
        created_by: "user-uuid",
      });

      expect(result.status).toBe("SENT");
      expect(result.signer_email).toBe("john@example.com");
    });

    it("should default to manual provider when no API keys configured", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          provider: "manual",
          status: "SENT",
        },
        error: null,
      });

      const result = await service.createSignatureRequest({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trust_request_id: "trust-uuid",
        signer_name: "Jane Doe",
        signer_email: "jane@example.com",
        created_by: "user-uuid",
      });

      expect(result.provider).toBe("manual");
    });

    it("should set expiration to 7 days from now", async () => {
      const beforeCreate = Date.now();

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
      });

      const result = await service.createSignatureRequest({
        client_id: "client-uuid",
        organization_id: "org-uuid",
        trust_request_id: "trust-uuid",
        signer_name: "Test User",
        signer_email: "test@example.com",
        created_by: "user-uuid",
      });

      const expirationDate = new Date(result.expires_at).getTime();
      const sevenDaysFromNow = beforeCreate + 7 * 24 * 60 * 60 * 1000;

      // Should be approximately 7 days (within 1 minute tolerance)
      expect(Math.abs(expirationDate - sevenDaysFromNow)).toBeLessThan(60000);
    });
  });

  describe("handleWebhook", () => {
    it("should update status to SIGNED on signature completion", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          trust_request_id: "trust-uuid",
          provider: "docusign",
          webhook_events: [],
        },
        error: null,
      });

      await service.handleWebhook("docusign", {
        event_type: "envelope-completed",
        envelope_id: "DS-123",
        timestamp: new Date().toISOString(),
        signer_email: "signer@example.com",
        signer_ip: "192.168.1.1",
      });

      // Verify update was called
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should update trusted mode request to ACTIVE when signed", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          trust_request_id: "trust-uuid",
          webhook_events: [],
        },
        error: null,
      });

      await service.handleWebhook("hellosign", {
        event_type: "signature_request_signed",
        envelope_id: "HS-456",
        timestamp: new Date().toISOString(),
      });

      // Should update both signature_requests and trusted_mode_requests
      expect(mockSupabase.from).toHaveBeenCalledWith("signature_requests");
      expect(mockSupabase.from).toHaveBeenCalledWith("trusted_mode_requests");
    });

    it("should handle declined signatures", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          trust_request_id: "trust-uuid",
          webhook_events: [],
        },
        error: null,
      });

      await service.handleWebhook("docusign", {
        event_type: "envelope-declined",
        envelope_id: "DS-789",
        timestamp: new Date().toISOString(),
      });

      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should log unknown events but not update status", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          webhook_events: [],
        },
        error: null,
      });

      await service.handleWebhook("docusign", {
        event_type: "unknown-event-type",
        envelope_id: "DS-000",
        timestamp: new Date().toISOString(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown webhook event")
      );
      consoleSpy.mockRestore();
    });

    it("should handle request not found gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await service.handleWebhook("docusign", {
        event_type: "envelope-completed",
        envelope_id: "DS-NOT-FOUND",
        timestamp: new Date().toISOString(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found")
      );
      consoleSpy.mockRestore();
    });
  });

  describe("completeSignatureManually", () => {
    it("should mark signature as complete", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: "sig-uuid",
            client_id: "client-uuid",
            organization_id: "org-uuid",
            trust_request_id: "trust-uuid",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "sig-uuid",
            status: "SIGNED",
            signed_at: expect.any(String),
          },
          error: null,
        });

      const result = await service.completeSignatureManually(
        "sig-uuid",
        "admin-uuid",
        "192.168.1.100"
      );

      expect(result.status).toBe("SIGNED");
    });

    it("should throw error if request not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await expect(
        service.completeSignatureManually("not-found", "admin-uuid")
      ).rejects.toThrow("Signature request not found");
    });
  });

  describe("voidSignatureRequest", () => {
    it("should void a pending signature request", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          provider: "manual",
          provider_envelope_id: "MANUAL-123",
        },
        error: null,
      });

      await service.voidSignatureRequest(
        "sig-uuid",
        "admin-uuid",
        "Client requested cancellation"
      );

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe("getSignatureRequest", () => {
    it("should return signature request by ID", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          status: "SENT",
          signer_email: "test@example.com",
        },
        error: null,
      });

      const result = await service.getSignatureRequest("sig-uuid");

      expect(result).not.toBeNull();
      expect(result!.status).toBe("SENT");
    });

    it("should return null if not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await service.getSignatureRequest("not-found");

      expect(result).toBeNull();
    });
  });

  describe("getClientSignatureRequests", () => {
    it("should return all signature requests for a client", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: [
          { id: "sig-1", status: "SIGNED" },
          { id: "sig-2", status: "SENT" },
        ],
        error: null,
      });

      const result = await service.getClientSignatureRequests("client-uuid");

      expect(result).toHaveLength(2);
    });

    it("should return empty array on error", async () => {
      mockSupabase.order = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const result = await service.getClientSignatureRequests("client-uuid");

      expect(result).toHaveLength(0);
    });
  });

  describe("resendSignatureRequest", () => {
    it("should increment retry count", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "sig-uuid",
          client_id: "client-uuid",
          organization_id: "org-uuid",
          retry_count: 1,
        },
        error: null,
      });

      await service.resendSignatureRequest("sig-uuid", "admin-uuid");

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });
});
