/**
 * Unit tests for seoCore.ts
 * Phase 4 Step 1: Core Architecture
 */

import { describe, it, expect } from "vitest";
import {
  buildDefaultSeoProfileForDomain,
  computeInitialKeywordSet,
  determineDefaultPackageTierBasedOnSubscription,
  canAccessSeoProfile,
  canModifySeoProfile,
  maskSensitivePayloadForLogs,
  isValidDomain,
  normalizeDomain,
  isValidPriority,
  computeMatrixScore,
  getPackageFeatures,
} from "../seo/seoCore";
import type { SeoProfile, UserContext, OrganizationContext } from "../seo/seoTypes";

describe("seoCore", () => {
  describe("buildDefaultSeoProfileForDomain", () => {
    it("should build a default SEO profile with basic fields", () => {
      const orgContext: OrganizationContext = {
        organization_id: "org-123",
        workspace_id: "ws-456",
      };

      const result = buildDefaultSeoProfileForDomain("example.com", orgContext);

      expect(result).toEqual({
        organization_id: "org-123",
        workspace_id: "ws-456",
        client_id: null,
        project_id: null,
        domain: "example.com",
        primary_geo_region: null,
        primary_service_vertical: null,
        package_tier: "good",
      });
    });

    it("should normalize domain to lowercase", () => {
      const orgContext: OrganizationContext = {
        organization_id: "org-123",
      };

      const result = buildDefaultSeoProfileForDomain("EXAMPLE.COM", orgContext);

      expect(result.domain).toBe("example.com");
    });

    it("should include vertical hint when provided", () => {
      const orgContext: OrganizationContext = {
        organization_id: "org-123",
      };

      const result = buildDefaultSeoProfileForDomain("example.com", orgContext, "construction");

      expect(result.primary_service_vertical).toBe("construction");
    });

    it("should handle workspace_id as null", () => {
      const orgContext: OrganizationContext = {
        organization_id: "org-123",
        workspace_id: null,
      };

      const result = buildDefaultSeoProfileForDomain("example.com", orgContext);

      expect(result.workspace_id).toBeNull();
    });
  });

  describe("computeInitialKeywordSet", () => {
    it("should return empty array (stub implementation)", () => {
      const result = computeInitialKeywordSet("example.com");

      expect(result).toEqual([]);
    });

    it("should return empty array with vertical hint", () => {
      const result = computeInitialKeywordSet("example.com", "construction");

      expect(result).toEqual([]);
    });
  });

  describe("determineDefaultPackageTierBasedOnSubscription", () => {
    it("should return 'good' for null subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription(null);

      expect(result).toBe("good");
    });

    it("should return 'good' for undefined subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription(undefined);

      expect(result).toBe("good");
    });

    it("should return 'best' for enterprise subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("enterprise");

      expect(result).toBe("best");
    });

    it("should return 'best' for premium subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("premium");

      expect(result).toBe("best");
    });

    it("should return 'best' for pro subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("pro");

      expect(result).toBe("best");
    });

    it("should return 'better' for plus subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("plus");

      expect(result).toBe("better");
    });

    it("should return 'better' for standard subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("standard");

      expect(result).toBe("better");
    });

    it("should return 'better' for business subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("business");

      expect(result).toBe("better");
    });

    it("should return 'good' for basic subscription", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("basic");

      expect(result).toBe("good");
    });

    it("should be case insensitive", () => {
      const result = determineDefaultPackageTierBasedOnSubscription("ENTERPRISE");

      expect(result).toBe("best");
    });
  });

  describe("canAccessSeoProfile", () => {
    const userContext: UserContext = {
      user_id: "user-123",
      organization_id: "org-123",
      role: "member",
    };

    const seoProfile: SeoProfile = {
      id: "profile-123",
      organization_id: "org-123",
      workspace_id: null,
      client_id: null,
      project_id: null,
      domain: "example.com",
      primary_geo_region: null,
      primary_service_vertical: null,
      package_tier: "good",
      gsc_property_id: null,
      bing_site_id: null,
      brave_channel_id: null,
      gmb_location_id: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    it("should return true when user is in same organization", () => {
      const result = canAccessSeoProfile(userContext, seoProfile);

      expect(result).toBe(true);
    });

    it("should return false when user is in different organization", () => {
      const differentOrgUser: UserContext = {
        ...userContext,
        organization_id: "org-456",
      };

      const result = canAccessSeoProfile(differentOrgUser, seoProfile);

      expect(result).toBe(false);
    });
  });

  describe("canModifySeoProfile", () => {
    const seoProfile: SeoProfile = {
      id: "profile-123",
      organization_id: "org-123",
      workspace_id: null,
      client_id: null,
      project_id: null,
      domain: "example.com",
      primary_geo_region: null,
      primary_service_vertical: null,
      package_tier: "good",
      gsc_property_id: null,
      bing_site_id: null,
      brave_channel_id: null,
      gmb_location_id: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    it("should return true for owner in same organization", () => {
      const ownerContext: UserContext = {
        user_id: "user-123",
        organization_id: "org-123",
        role: "owner",
      };

      const result = canModifySeoProfile(ownerContext, seoProfile);

      expect(result).toBe(true);
    });

    it("should return true for admin in same organization", () => {
      const adminContext: UserContext = {
        user_id: "user-123",
        organization_id: "org-123",
        role: "admin",
      };

      const result = canModifySeoProfile(adminContext, seoProfile);

      expect(result).toBe(true);
    });

    it("should return false for member in same organization", () => {
      const memberContext: UserContext = {
        user_id: "user-123",
        organization_id: "org-123",
        role: "member",
      };

      const result = canModifySeoProfile(memberContext, seoProfile);

      expect(result).toBe(false);
    });

    it("should return false for owner in different organization", () => {
      const ownerContext: UserContext = {
        user_id: "user-123",
        organization_id: "org-456",
        role: "owner",
      };

      const result = canModifySeoProfile(ownerContext, seoProfile);

      expect(result).toBe(false);
    });
  });

  describe("maskSensitivePayloadForLogs", () => {
    it("should mask api_key field", () => {
      const payload = {
        api_key: "secret123",
        data: "public",
      };

      const result = maskSensitivePayloadForLogs(payload);

      expect(result.api_key).toBe("***MASKED***");
      expect(result.data).toBe("public");
    });

    it("should mask nested sensitive fields", () => {
      const payload = {
        config: {
          token: "secret123",
          name: "test",
        },
        data: "public",
      };

      const result = maskSensitivePayloadForLogs(payload);

      expect(result.config).toEqual({
        token: "***MASKED***",
        name: "test",
      });
    });

    it("should handle multiple sensitive keys", () => {
      const payload = {
        api_key: "key123",
        access_token: "token456",
        password: "pass789",
        username: "john",
      };

      const result = maskSensitivePayloadForLogs(payload);

      expect(result.api_key).toBe("***MASKED***");
      expect(result.access_token).toBe("***MASKED***");
      expect(result.password).toBe("***MASKED***");
      expect(result.username).toBe("john");
    });
  });

  describe("isValidDomain", () => {
    it("should return true for valid domain", () => {
      expect(isValidDomain("example.com")).toBe(true);
      expect(isValidDomain("sub.example.com")).toBe(true);
      expect(isValidDomain("example.co.uk")).toBe(true);
    });

    it("should return false for invalid domain", () => {
      expect(isValidDomain("")).toBe(false);
      expect(isValidDomain("   ")).toBe(false);
      expect(isValidDomain("not a domain")).toBe(false);
      expect(isValidDomain("http://example.com")).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isValidDomain(null as any)).toBe(false);
      expect(isValidDomain(undefined as any)).toBe(false);
    });
  });

  describe("normalizeDomain", () => {
    it("should remove protocol", () => {
      expect(normalizeDomain("https://example.com")).toBe("example.com");
      expect(normalizeDomain("http://example.com")).toBe("example.com");
    });

    it("should remove www", () => {
      expect(normalizeDomain("www.example.com")).toBe("example.com");
      expect(normalizeDomain("https://www.example.com")).toBe("example.com");
    });

    it("should remove trailing slash", () => {
      expect(normalizeDomain("example.com/")).toBe("example.com");
    });

    it("should remove path", () => {
      expect(normalizeDomain("example.com/about")).toBe("example.com");
    });

    it("should convert to lowercase", () => {
      expect(normalizeDomain("EXAMPLE.COM")).toBe("example.com");
    });

    it("should handle complex URLs", () => {
      expect(normalizeDomain("https://www.EXAMPLE.com/path/to/page/")).toBe("example.com");
    });
  });

  describe("isValidPriority", () => {
    it("should return true for valid priorities (1-5)", () => {
      expect(isValidPriority(1)).toBe(true);
      expect(isValidPriority(2)).toBe(true);
      expect(isValidPriority(3)).toBe(true);
      expect(isValidPriority(4)).toBe(true);
      expect(isValidPriority(5)).toBe(true);
    });

    it("should return false for invalid priorities", () => {
      expect(isValidPriority(0)).toBe(false);
      expect(isValidPriority(6)).toBe(false);
      expect(isValidPriority(-1)).toBe(false);
    });

    it("should return false for non-integers", () => {
      expect(isValidPriority(2.5)).toBe(false);
      expect(isValidPriority(NaN)).toBe(false);
    });
  });

  describe("computeMatrixScore", () => {
    it("should return 0 (stub implementation)", () => {
      const payload = { data: "test" };
      const result = computeMatrixScore(payload);

      expect(result).toBe(0);
    });
  });

  describe("getPackageFeatures", () => {
    it("should return all features enabled for 'best' tier", () => {
      const result = getPackageFeatures("best");

      expect(result).toEqual({
        includes_social: true,
        includes_matrix_v11: true,
        includes_indexnow: true,
        includes_brave_goggles: true,
        includes_nano_banana: true,
        includes_golden_key: true,
      });
    });

    it("should return limited features for 'better' tier", () => {
      const result = getPackageFeatures("better");

      expect(result).toEqual({
        includes_social: true,
        includes_matrix_v11: true,
        includes_indexnow: true,
        includes_brave_goggles: false,
        includes_nano_banana: false,
        includes_golden_key: false,
      });
    });

    it("should return basic features for 'good' tier", () => {
      const result = getPackageFeatures("good");

      expect(result).toEqual({
        includes_social: false,
        includes_matrix_v11: true,
        includes_indexnow: false,
        includes_brave_goggles: false,
        includes_nano_banana: false,
        includes_golden_key: false,
      });
    });
  });
});
