/**
 * Unit Tests: Brave Creator Console Client
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import { describe, it, expect } from "vitest";
import {
  buildBraveAuthUrl,
  validateBraveApiKeyFormat,
  buildBraveOAuthCredentialData,
  buildBraveApiKeyCredentialData,
  isBraveTokenExpired,
  extractBraveCredential,
  maskBraveCredential,
  type BraveTokenResponse,
  type BraveCredentialData,
} from "@/lib/seo/integrations/braveClient";
import type { SeoCredential } from "@/lib/seo/seoTypes";

describe("buildBraveAuthUrl", () => {
  it("should build a valid OAuth authorization URL", () => {
    const options = {
      redirect_uri: "https://app.example.com/callback",
      state: "test-state-token",
      organization_id: "org-123",
    };

    const authUrl = buildBraveAuthUrl(options);

    expect(authUrl).toContain("https://creators.brave.com/oauth2/authorize");
    expect(authUrl).toContain("redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback");
    expect(authUrl).toContain("state=test-state-token");
    expect(authUrl).toContain("response_type=code");
    expect(authUrl).toContain("scope=");
  });

  it("should throw error if BRAVE_CREATOR_CLIENT_ID is missing", () => {
    const originalClientId = process.env.BRAVE_CREATOR_CLIENT_ID;
    delete process.env.BRAVE_CREATOR_CLIENT_ID;

    expect(() => {
      buildBraveAuthUrl({
        redirect_uri: "https://app.example.com/callback",
        state: "state",
        organization_id: "org-123",
      });
    }).toThrow("Missing BRAVE_CREATOR_CLIENT_ID environment variable");

    process.env.BRAVE_CREATOR_CLIENT_ID = originalClientId;
  });
});

describe("validateBraveApiKeyFormat", () => {
  it("should validate correct API key format (32 characters with hyphens)", () => {
    const apiKey = "a".repeat(30) + "--";
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
    expect(result.message).toBe("API key format is valid");
  });

  it("should validate API key format (64 characters)", () => {
    const apiKey = "a".repeat(64);
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
  });

  it("should reject API key that is too short", () => {
    const apiKey = "a".repeat(31);
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("32-64 alphanumeric characters with hyphens");
  });

  it("should reject API key that is too long", () => {
    const apiKey = "a".repeat(65);
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("32-64 alphanumeric characters with hyphens");
  });

  it("should accept API key with hyphens", () => {
    const apiKey = "abc-def-ghi-jkl-mno-pqr-stu-vwx-yz";
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
  });

  it("should reject API key with invalid characters", () => {
    const apiKey = "a".repeat(30) + "_!";
    const result = validateBraveApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
  });

  it("should reject empty API key", () => {
    const result = validateBraveApiKeyFormat("");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("API key is required");
  });
});

describe("buildBraveOAuthCredentialData", () => {
  it("should build OAuth credential data from token response", () => {
    const tokenResponse: BraveTokenResponse = {
      access_token: "brave_access_token",
      refresh_token: "brave_refresh_token",
      expires_in: 7200,
      token_type: "Bearer",
      scope: "channels:read channels:write",
    };

    const credentialData = buildBraveOAuthCredentialData(tokenResponse);

    expect(credentialData.access_token).toBe("brave_access_token");
    expect(credentialData.refresh_token).toBe("brave_refresh_token");
    expect(credentialData.scope).toBe("channels:read channels:write");
    expect(credentialData.auth_method).toBe("oauth");
    expect(credentialData.expires_at).toBeDefined();
  });

  it("should include channel ID if provided", () => {
    const tokenResponse: BraveTokenResponse = {
      access_token: "brave_access_token",
      expires_in: 7200,
      token_type: "Bearer",
      scope: "test",
    };

    const credentialData = buildBraveOAuthCredentialData(
      tokenResponse,
      "channel-123"
    );

    expect(credentialData.channel_id).toBe("channel-123");
  });

  it("should handle missing refresh token", () => {
    const tokenResponse: BraveTokenResponse = {
      access_token: "brave_access_token",
      expires_in: 7200,
      token_type: "Bearer",
      scope: "test",
    };

    const credentialData = buildBraveOAuthCredentialData(tokenResponse);

    expect(credentialData.refresh_token).toBeUndefined();
  });
});

describe("buildBraveApiKeyCredentialData", () => {
  it("should build API key credential data", () => {
    const apiKey = "a".repeat(32);
    const credentialData = buildBraveApiKeyCredentialData(apiKey);

    expect(credentialData.api_key).toBe(apiKey);
    expect(credentialData.auth_method).toBe("api_key");
    expect(credentialData.access_token).toBe("");
    expect(credentialData.expires_at).toBeUndefined();
  });

  it("should include channel ID if provided", () => {
    const apiKey = "a".repeat(32);
    const credentialData = buildBraveApiKeyCredentialData(apiKey, "channel-456");

    expect(credentialData.api_key).toBe(apiKey);
    expect(credentialData.channel_id).toBe("channel-456");
  });
});

describe("isBraveTokenExpired", () => {
  it("should return false for API key auth method", () => {
    const credentialData: BraveCredentialData = {
      api_key: "test_key",
      scope: "test",
      channel_id: "ch-123",
      auth_method: "api_key",
      access_token: "",
    };

    expect(isBraveTokenExpired(credentialData)).toBe(false);
  });

  it("should return false for fresh OAuth token", () => {
    const credentialData: BraveCredentialData = {
      access_token: "test_token",
      refresh_token: "test_refresh",
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      scope: "test",
      auth_method: "oauth",
    };

    expect(isBraveTokenExpired(credentialData)).toBe(false);
  });

  it("should return true for expired OAuth token", () => {
    const credentialData: BraveCredentialData = {
      access_token: "test_token",
      expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      scope: "test",
      auth_method: "oauth",
    };

    expect(isBraveTokenExpired(credentialData)).toBe(true);
  });

  it("should return true for token expiring within 5 minutes", () => {
    const credentialData: BraveCredentialData = {
      access_token: "test_token",
      expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      scope: "test",
      auth_method: "oauth",
    };

    expect(isBraveTokenExpired(credentialData)).toBe(true);
  });

  it("should return false when expires_at is not set", () => {
    const credentialData: BraveCredentialData = {
      access_token: "test_token",
      scope: "test",
      auth_method: "oauth",
    };

    expect(isBraveTokenExpired(credentialData)).toBe(false);
  });
});

describe("extractBraveCredential", () => {
  it("should extract API key from API key credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "brave_console",
      credential_data: {
        api_key: "test_api_key",
        auth_method: "api_key",
        access_token: "",
        scope: "test",
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const extracted = extractBraveCredential(credential);
    expect(extracted).toBe("test_api_key");
  });

  it("should extract access token from OAuth credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "brave_console",
      credential_data: {
        access_token: "brave_oauth_token",
        auth_method: "oauth",
        scope: "test",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const extracted = extractBraveCredential(credential);
    expect(extracted).toBe("brave_oauth_token");
  });

  it("should return null for non-Brave credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "gsc_token",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const extracted = extractBraveCredential(credential);
    expect(extracted).toBeNull();
  });
});

describe("maskBraveCredential", () => {
  it("should mask credential showing first 8 and last 4 characters", () => {
    const credential = "abcdefgh12345678ijklmnop";
    const masked = maskBraveCredential(credential);

    expect(masked).toBe("abcdefgh*************mnop");
    expect(masked.length).toBe(credential.length);
  });

  it("should handle credential of exactly 32 characters", () => {
    const credential = "a".repeat(32);
    const masked = maskBraveCredential(credential);

    expect(masked.substring(0, 8)).toBe("a".repeat(8));
    expect(masked.substring(28, 32)).toBe("a".repeat(4));
    expect(masked.substring(8, 28)).toBe("*".repeat(20));
  });

  it("should return ***INVALID*** for short credential", () => {
    const credential = "short";
    const masked = maskBraveCredential(credential);
    expect(masked).toBe("***INVALID***");
  });

  it("should return ***INVALID*** for empty credential", () => {
    const masked = maskBraveCredential("");
    expect(masked).toBe("***INVALID***");
  });
});
