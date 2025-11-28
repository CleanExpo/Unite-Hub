/**
 * Unit Tests: Google Search Console Client
 * Phase 4 Step 3: Real API Integration Layer
 */

import { describe, it, expect } from "vitest";
import {
  buildGscAuthUrl,
  buildGscCredentialData,
  isGscTokenExpired,
  extractAccessToken,
  extractRefreshToken,
  type GscTokenResponse,
  type GscCredentialData,
} from "@/lib/seo/integrations/gscClient";
import type { SeoCredential } from "@/lib/seo/seoTypes";

describe("buildGscAuthUrl", () => {
  it("should build a valid OAuth authorization URL", () => {
    // Set env var for test
    const originalClientId = process.env.GOOGLE_GSC_CLIENT_ID;
    process.env.GOOGLE_GSC_CLIENT_ID = "test-client-id";

    const options = {
      redirect_uri: "https://app.example.com/callback",
      state: "test-state-token",
      organization_id: "org-123",
    };

    const authUrl = buildGscAuthUrl(options);
    process.env.GOOGLE_GSC_CLIENT_ID = originalClientId;

    expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(authUrl).toContain("redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback");
    expect(authUrl).toContain("state=test-state-token");
    expect(authUrl).toContain("response_type=code");
    expect(authUrl).toContain("scope=");
    expect(authUrl).toContain("access_type=offline");
    expect(authUrl).toContain("prompt=consent");
  });

  it("should throw error if GOOGLE_GSC_CLIENT_ID is missing", () => {
    const originalClientId = process.env.GOOGLE_GSC_CLIENT_ID;
    delete process.env.GOOGLE_GSC_CLIENT_ID;

    expect(() => {
      buildGscAuthUrl({
        redirect_uri: "https://app.example.com/callback",
        state: "state",
        organization_id: "org-123",
      });
    }).toThrow("Missing GOOGLE_GSC_CLIENT_ID environment variable");

    process.env.GOOGLE_GSC_CLIENT_ID = originalClientId;
  });
});

describe("buildGscCredentialData", () => {
  it("should build credential data from token response", () => {
    const tokenResponse: GscTokenResponse = {
      access_token: "ya29.test_token",
      refresh_token: "1//test_refresh",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
    };

    const credentialData = buildGscCredentialData(tokenResponse);

    expect(credentialData.access_token).toBe("ya29.test_token");
    expect(credentialData.refresh_token).toBe("1//test_refresh");
    expect(credentialData.scope).toBe(
      "https://www.googleapis.com/auth/webmasters.readonly"
    );
    expect(credentialData.expires_at).toBeDefined();
    expect(new Date(credentialData.expires_at).getTime()).toBeGreaterThan(
      Date.now()
    );
  });

  it("should include property URL if provided", () => {
    const tokenResponse: GscTokenResponse = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "test",
    };

    const credentialData = buildGscCredentialData(
      tokenResponse,
      "https://example.com/"
    );

    expect(credentialData.property_url).toBe("https://example.com/");
  });

  it("should calculate correct expiration timestamp", () => {
    const tokenResponse: GscTokenResponse = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_in: 7200, // 2 hours
      token_type: "Bearer",
      scope: "test",
    };

    const before = Date.now() + 7200 * 1000;
    const credentialData = buildGscCredentialData(tokenResponse);
    const after = Date.now() + 7200 * 1000;

    const expiresAt = new Date(credentialData.expires_at).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before - 1000); // Allow 1s variance
    expect(expiresAt).toBeLessThanOrEqual(after + 1000);
  });
});

describe("isGscTokenExpired", () => {
  it("should return false for fresh token", () => {
    const credentialData: GscCredentialData = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      scope: "test",
    };

    expect(isGscTokenExpired(credentialData)).toBe(false);
  });

  it("should return true for expired token", () => {
    const credentialData: GscCredentialData = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      scope: "test",
    };

    expect(isGscTokenExpired(credentialData)).toBe(true);
  });

  it("should return true for token expiring within 5 minutes", () => {
    const credentialData: GscCredentialData = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 minutes from now
      scope: "test",
    };

    expect(isGscTokenExpired(credentialData)).toBe(true);
  });

  it("should return false for token expiring in more than 5 minutes", () => {
    const credentialData: GscCredentialData = {
      access_token: "ya29.test",
      refresh_token: "1//test",
      expires_at: new Date(Date.now() + 6 * 60 * 1000).toISOString(), // 6 minutes from now
      scope: "test",
    };

    expect(isGscTokenExpired(credentialData)).toBe(false);
  });
});

describe("extractAccessToken", () => {
  it("should extract access token from GSC credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test_token",
        refresh_token: "1//test",
        expires_at: new Date().toISOString(),
        scope: "test",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const accessToken = extractAccessToken(credential);
    expect(accessToken).toBe("ya29.test_token");
  });

  it("should return null for non-GSC credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "bing_webmaster",
      credential_data: {
        api_key: "bing_key",
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const accessToken = extractAccessToken(credential);
    expect(accessToken).toBeNull();
  });

  it("should return null if access_token is missing", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        refresh_token: "1//test",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const accessToken = extractAccessToken(credential);
    expect(accessToken).toBeNull();
  });
});

describe("extractRefreshToken", () => {
  it("should extract refresh token from GSC credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
        refresh_token: "1//test_refresh_token",
        expires_at: new Date().toISOString(),
        scope: "test",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const refreshToken = extractRefreshToken(credential);
    expect(refreshToken).toBe("1//test_refresh_token");
  });

  it("should return null for non-GSC credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "bing_webmaster",
      credential_data: {
        api_key: "bing_key",
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const refreshToken = extractRefreshToken(credential);
    expect(refreshToken).toBeNull();
  });

  it("should return null if refresh_token is missing", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
      },
      is_active: true,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const refreshToken = extractRefreshToken(credential);
    expect(refreshToken).toBeNull();
  });
});
