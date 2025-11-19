/**
 * Unit Tests: SEO Credential Service
 * Phase 4 Step 2: GSC/Bing/Brave Connection Layer
 */

import { describe, it, expect } from "vitest";
import {
  isCredentialExpired,
} from "@/lib/services/seo/credentialService";
import type { SeoCredential } from "@/lib/seo/seoTypes";

describe("isCredentialExpired", () => {
  it("should return false for credential without expiration (API keys)", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "bing_webmaster",
      credential_data: {
        api_key: "test_key",
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(false);
  });

  it("should return false for fresh OAuth token (1 hour remaining)", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
        refresh_token: "1//test",
      },
      is_active: true,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(false);
  });

  it("should return true for expired OAuth token", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
      },
      is_active: true,
      expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(true);
  });

  it("should return true for token expiring within 5 minutes (refresh buffer)", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
      },
      is_active: true,
      expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 minutes from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(true);
  });

  it("should return false for token expiring in more than 5 minutes", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
      },
      is_active: true,
      expires_at: new Date(Date.now() + 6 * 60 * 1000).toISOString(), // 6 minutes from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(false);
  });

  it("should handle edge case: token expires exactly 5 minutes from now", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "gsc",
      credential_data: {
        access_token: "ya29.test",
      },
      is_active: true,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // exactly 5 minutes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Should return true (within 5 minute buffer)
    expect(isCredentialExpired(credential)).toBe(true);
  });

  it("should handle Brave API key credential (never expires)", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "brave_console",
      credential_data: {
        api_key: "brave_key",
        auth_method: "api_key",
      },
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(false);
  });

  it("should handle Brave OAuth credential (expires)", () => {
    const credential: SeoCredential = {
      id: "cred-123",
      seo_profile_id: "profile-123",
      organization_id: "org-123",
      credential_type: "brave_console",
      credential_data: {
        access_token: "brave_oauth_token",
        auth_method: "oauth",
      },
      is_active: true,
      expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), // expired
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isCredentialExpired(credential)).toBe(true);
  });
});
