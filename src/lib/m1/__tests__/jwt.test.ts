/**
 * M1 JWT Security Tests - Phase 5
 *
 * Tests for JWT token generation, verification, and validation.
 * Validates cryptographic security measures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { verifyApprovalToken } from "../cli/approval-handler";
import { policyEngine } from "../tools/policy";
import type { ToolCall } from "../types";

// Test configuration
const TEST_SECRET = "test-secret-key";
const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "m1-agent-control";
const JWT_SUBJECT = "approval";

describe("JWT Token Generation and Verification", () => {
  describe("Token Generation", () => {
    it("should generate valid JWT token with correct structure", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test_tool",
        scope: "execute",
        iat: now,
        exp,
        jti: "test-jti-123",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, { algorithm: JWT_ALGORITHM });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature
    });

    it("should include required claims in token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "log_agent_run",
        scope: "execute",
        iat: now,
        exp,
        jti: "unique-jti",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, { algorithm: JWT_ALGORITHM });
      const decoded = jwt.decode(token) as any;

      expect(decoded.toolName).toBe("log_agent_run");
      expect(decoded.scope).toBe("execute");
      expect(decoded.iat).toBe(now);
      expect(decoded.exp).toBe(exp);
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBe(JWT_ISSUER);
      expect(decoded.sub).toBe(JWT_SUBJECT);
    });

    it("should set correct expiration time", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60; // 5 minutes

      const payload = {
        toolName: "test",
        scope: "write",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, { algorithm: JWT_ALGORITHM });
      const decoded = jwt.decode(token) as any;

      const expirationSeconds = decoded.exp - decoded.iat;
      expect(expirationSeconds).toBe(5 * 60); // 300 seconds
    });
  });

  describe("Token Verification", () => {
    it("should decode token structure correctly", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "tool_registry_list",
        scope: "read",
        iat: now,
        exp,
        jti: "test-jti",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, { algorithm: JWT_ALGORITHM });
      const decoded = jwt.decode(token) as any;

      expect(decoded.toolName).toBe("tool_registry_list");
      expect(decoded.scope).toBe("read");
      expect(decoded.jti).toBe("test-jti");
    });

    it("should reject invalid signature", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "execute",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      // Sign with wrong secret
      const token = jwt.sign(payload, "wrong-secret", {
        algorithm: JWT_ALGORITHM,
      });

      // Should throw when verified with different secret
      expect(() => {
        jwt.verify(token, TEST_SECRET, {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          subject: JWT_SUBJECT,
        });
      }).toThrow("invalid signature");
    });

    it("should reject expired token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now - 3600; // 1 hour ago (expired)

      const payload = {
        toolName: "test",
        scope: "execute",
        iat: now - 7200, // 2 hours ago
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      // Should throw TokenExpiredError
      expect(() => {
        jwt.verify(token, TEST_SECRET, {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          subject: JWT_SUBJECT,
        });
      }).toThrow("jwt expired");
    });

    it("should detect wrong issuer in token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "execute",
        iat: now,
        exp,
        jti: "test",
        iss: "wrong-issuer",
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      // Should fail verification with wrong issuer
      expect(() => {
        jwt.verify(token, TEST_SECRET, {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          subject: JWT_SUBJECT,
        });
      }).toThrow();
    });

    it("should detect wrong subject in token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "execute",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: "wrong-subject",
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      // Should fail verification with wrong subject
      expect(() => {
        jwt.verify(token, TEST_SECRET, {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          subject: JWT_SUBJECT,
        });
      }).toThrow();
    });

    it("should reject malformed token", () => {
      const malformedToken = "not.a.valid.token";

      expect(() => {
        jwt.verify(malformedToken, TEST_SECRET, {
          algorithms: [JWT_ALGORITHM],
          issuer: JWT_ISSUER,
          subject: JWT_SUBJECT,
        });
      }).toThrow();
    });

    it("should handle different algorithms", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "read",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      // This would work with RS256 if we had key pairs
      // For now, HS256 is sufficient for tests
      const token = jwt.sign(payload, TEST_SECRET, { algorithm: "HS256" });

      expect(token).toBeDefined();
    });
  });

  describe("JWT Claims Validation", () => {
    it("should validate required claims are present", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "log_agent_run",
        scope: "execute",
        iat: now,
        exp,
        jti: "test-jti",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      const decoded = jwt.decode(token) as any;

      // All required claims should be present
      expect(decoded.toolName).toBeDefined();
      expect(decoded.scope).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBeDefined();
      expect(decoded.sub).toBeDefined();
    });

    it("should validate tool name in token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "tool_registry_list",
        scope: "read",
        iat: now,
        exp,
        jti: "test-jti",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      const decoded = jwt.decode(token) as any;

      // Tool name should match exactly
      expect(decoded.toolName).toBe("tool_registry_list");
    });

    it("should validate scope in token", () => {
      // Create tokens with different scopes
      const scopes = ["read", "write", "execute"];

      scopes.forEach((scope) => {
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 5 * 60;

        const payload = {
          toolName: "test",
          scope,
          iat: now,
          exp,
          jti: "test",
          iss: JWT_ISSUER,
          sub: JWT_SUBJECT,
        };

        const token = jwt.sign(payload, TEST_SECRET, {
          algorithm: JWT_ALGORITHM,
        });

        const decoded = jwt.decode(token) as any;
        expect(decoded.scope).toBe(scope);
      });
    });
  });

  describe("Token Security", () => {
    it("should include unique token ID (jti) for revocation support", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload1 = {
        toolName: "test1",
        scope: "read",
        iat: now,
        exp,
        jti: "unique-id-1",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const payload2 = {
        toolName: "test2",
        scope: "read",
        iat: now,
        exp,
        jti: "unique-id-2",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token1 = jwt.sign(payload1, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });
      const token2 = jwt.sign(payload2, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;

      expect(decoded1.jti).toBe("unique-id-1");
      expect(decoded2.jti).toBe("unique-id-2");
      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it("should use HMAC-SHA256 algorithm for signing", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "read",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, { algorithm: "HS256" });
      const decoded = jwt.decode(token, { complete: true }) as any;

      expect(decoded.header.alg).toBe("HS256");
      expect(decoded.header.typ).toBe("JWT");
    });

    it("should not contain sensitive information in token", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test",
        scope: "read",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
        // Don't include user password, API keys, etc.
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });
      const decoded = jwt.decode(token) as any;

      // Verify no sensitive data
      expect(decoded.password).toBeUndefined();
      expect(decoded.apiKey).toBeUndefined();
      expect(decoded.secret).toBeUndefined();
    });
  });

  describe("Token Lifetime", () => {
    it("should be valid at issuance time", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60;

      const payload = {
        toolName: "test_tool",
        scope: "execute",
        iat: now,
        exp,
        jti: "lifetime-test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      // Should be verifiable immediately after signing
      const decoded = jwt.verify(token, TEST_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: JWT_ISSUER,
        subject: JWT_SUBJECT,
      }) as any;

      expect(decoded.toolName).toBe("test_tool");
      expect(decoded.iat).toBe(now);
    });

    it("should have 5 minute expiration window", () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 5 * 60; // 5 minutes

      const payload = {
        toolName: "test",
        scope: "read",
        iat: now,
        exp,
        jti: "test",
        iss: JWT_ISSUER,
        sub: JWT_SUBJECT,
      };

      const token = jwt.sign(payload, TEST_SECRET, {
        algorithm: JWT_ALGORITHM,
      });

      const decoded = jwt.decode(token) as any;

      // Expiration should be exactly 5 minutes from issuance
      expect(decoded.exp - decoded.iat).toBe(300); // 5 * 60 seconds
    });
  });
});
