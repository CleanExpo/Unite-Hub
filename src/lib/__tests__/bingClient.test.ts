/**
 * Unit Tests: Bing Webmaster Client
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import { describe, it, expect } from "vitest";
import {
  validateApiKeyFormat,
  buildBingCredentialData,
  extractBingApiKey,
  maskBingApiKey,
  normalizeBingSiteUrl,
} from "@/lib/seo/integrations/bingClient";
import type { SeoCredential } from "@/lib/seo/seoTypes";

describe("validateApiKeyFormat", () => {
  it("should validate correct API key format (32 characters)", () => {
    const apiKey = "a".repeat(32);
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
    expect(result.message).toBe("API key format is valid");
  });

  it("should validate correct API key format (64 characters)", () => {
    const apiKey = "A1b2C3d4".repeat(8); // 64 alphanumeric characters
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
  });

  it("should reject API key that is too short", () => {
    const apiKey = "a".repeat(31);
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("32-64 alphanumeric characters");
  });

  it("should reject API key that is too long", () => {
    const apiKey = "a".repeat(65);
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("32-64 alphanumeric characters");
  });

  it("should reject API key with invalid characters (hyphens)", () => {
    const apiKey = "a".repeat(30) + "-a";
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("32-64 alphanumeric characters");
  });

  it("should reject empty API key", () => {
    const result = validateApiKeyFormat("");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("API key is required");
  });

  it("should reject null API key", () => {
    const result = validateApiKeyFormat(null as any);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("API key is required");
  });

  it("should handle API key with leading/trailing whitespace", () => {
    const apiKey = " " + "a".repeat(32) + " ";
    const result = validateApiKeyFormat(apiKey);
    expect(result.valid).toBe(true);
  });
});

describe("buildBingCredentialData", () => {
  it("should build credential data with API key only", () => {
    const apiKey = "a".repeat(32);
    const credentialData = buildBingCredentialData(apiKey);

    expect(credentialData.api_key).toBe(apiKey);
    expect(credentialData.verified_sites).toEqual([]);
    expect(credentialData.created_at).toBeDefined();
    expect(new Date(credentialData.created_at).getTime()).toBeLessThanOrEqual(
      Date.now()
    );
  });

  it("should include verified sites if provided", () => {
    const apiKey = "a".repeat(32);
    const verifiedSites = ["https://example.com/", "https://blog.example.com/"];
    const credentialData = buildBingCredentialData(apiKey, verifiedSites);

    expect(credentialData.api_key).toBe(apiKey);
    expect(credentialData.verified_sites).toEqual(verifiedSites);
  });

  it("should default to empty array if verified sites not provided", () => {
    const apiKey = "a".repeat(32);
    const credentialData = buildBingCredentialData(apiKey);

    expect(credentialData.verified_sites).toEqual([]);
  });
});

describe("extractBingApiKey", () => {
  it("should extract API key from Bing credential", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "bing_webmaster",
      credential_data: {
        api_key: "test_api_key_12345",
        verified_sites: [],
        created_at: new Date().toISOString(),
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const apiKey = extractBingApiKey(credential);
    expect(apiKey).toBe("test_api_key_12345");
  });

  it("should return null for non-Bing credential", () => {
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

    const apiKey = extractBingApiKey(credential);
    expect(apiKey).toBeNull();
  });

  it("should return null if API key is missing", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "bing_webmaster",
      credential_data: {
        verified_sites: [],
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const apiKey = extractBingApiKey(credential);
    expect(apiKey).toBeNull();
  });
});

describe("maskBingApiKey", () => {
  it("should mask API key showing first 8 and last 4 characters", () => {
    const apiKey = "abcdefgh12345678ijklmnop";
    const masked = maskBingApiKey(apiKey);

    // 24 chars - 8 start - 4 end = 12 masked
    expect(masked).toBe("abcdefgh************mnop");
    expect(masked.length).toBe(apiKey.length);
  });

  it("should handle API key of exactly 32 characters", () => {
    const apiKey = "a".repeat(32);
    const masked = maskBingApiKey(apiKey);

    expect(masked.substring(0, 8)).toBe("a".repeat(8));
    expect(masked.substring(28, 32)).toBe("a".repeat(4));
    expect(masked.substring(8, 28)).toBe("*".repeat(20));
  });

  it("should handle API key of 64 characters", () => {
    const apiKey = "b".repeat(64);
    const masked = maskBingApiKey(apiKey);

    expect(masked.substring(0, 8)).toBe("b".repeat(8));
    expect(masked.substring(60, 64)).toBe("b".repeat(4));
    expect(masked.substring(8, 60)).toBe("*".repeat(52));
  });

  it("should return ***INVALID*** for short API key", () => {
    const apiKey = "short";
    const masked = maskBingApiKey(apiKey);
    expect(masked).toBe("***INVALID***");
  });

  it("should return ***INVALID*** for empty API key", () => {
    const masked = maskBingApiKey("");
    expect(masked).toBe("***INVALID***");
  });
});

describe("normalizeBingSiteUrl", () => {
  it("should add https:// protocol if missing", () => {
    const url = "example.com";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/");
  });

  it("should preserve https:// protocol", () => {
    const url = "https://example.com";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/");
  });

  it("should preserve http:// protocol", () => {
    const url = "http://example.com";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("http://example.com/");
  });

  it("should add trailing slash if missing", () => {
    const url = "https://example.com";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/");
  });

  it("should preserve trailing slash", () => {
    const url = "https://example.com/";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/");
  });

  it("should handle subdomain URLs", () => {
    const url = "blog.example.com";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://blog.example.com/");
  });

  it("should handle URLs with paths", () => {
    const url = "https://example.com/path/to/page";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/path/to/page/");
  });

  it("should trim whitespace", () => {
    const url = "  https://example.com  ";
    const normalized = normalizeBingSiteUrl(url);
    expect(normalized).toBe("https://example.com/");
  });
});
