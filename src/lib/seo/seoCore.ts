/**
 * SEO/GEO Intelligence Module - Core Helper Functions
 * Phase 4 Step 1: Core Architecture
 *
 * Pure logic helpers (no external API calls, no side effects)
 * These functions are deterministic and safe to use in any context.
 */

import type {
  SeoProfile,
  CreateSeoProfileInput,
  SeoPackageTier,
  UserContext,
  OrganizationContext,
} from "./seoTypes";

// ============================================================================
// PROFILE BUILDERS
// ============================================================================

/**
 * Build a default SEO profile for a given domain and organization context.
 * This is a pure function that returns a profile input object.
 */
export function buildDefaultSeoProfileForDomain(
  domain: string,
  orgContext: OrganizationContext,
  verticalHint?: string | null
): CreateSeoProfileInput {
  return {
    organization_id: orgContext.organization_id,
    workspace_id: orgContext.workspace_id || null,
    client_id: null,
    project_id: null,
    domain: domain.toLowerCase().trim(),
    primary_geo_region: null,
    primary_service_vertical: verticalHint || null,
    package_tier: "good", // Default to basic tier
  };
}

/**
 * Stub function for computing initial keyword set based on domain and vertical.
 * This will be implemented in later phases when we integrate with external APIs.
 */
export function computeInitialKeywordSet(
  domain: string,
  verticalHint?: string | null
): string[] {
  // Stub implementation - returns empty array for now
  // Future: This will call OpenRouter/Perplexity to generate keyword suggestions
  return [];
}

// ============================================================================
// PACKAGE TIER MAPPING
// ============================================================================

/**
 * Determine the default SEO package tier based on existing subscription tier.
 * Maps subscription package names to SEO package tiers.
 */
export function determineDefaultPackageTierBasedOnSubscription(
  subscriptionTier: string | null | undefined
): SeoPackageTier {
  if (!subscriptionTier) {
    return "good";
  }

  const tier = subscriptionTier.toLowerCase();

  // Map subscription tiers to SEO tiers
  if (tier.includes("enterprise") || tier.includes("premium") || tier.includes("pro")) {
    return "best";
  }

  if (tier.includes("plus") || tier.includes("standard") || tier.includes("business")) {
    return "better";
  }

  return "good";
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if a user context has permission to access an SEO profile.
 * This is a pure function that checks organization membership.
 */
export function canAccessSeoProfile(
  userContext: UserContext,
  seoProfile: SeoProfile
): boolean {
  return userContext.organization_id === seoProfile.organization_id;
}

/**
 * Check if a user context has permission to modify an SEO profile.
 * Only owners and admins can modify profiles.
 */
export function canModifySeoProfile(
  userContext: UserContext,
  seoProfile: SeoProfile
): boolean {
  const hasAccess = canAccessSeoProfile(userContext, seoProfile);
  const hasRole = userContext.role === "owner" || userContext.role === "admin";

  return hasAccess && hasRole;
}

// ============================================================================
// DATA MASKING
// ============================================================================

/**
 * Mask sensitive data in snapshot payloads before logging.
 * This prevents API keys, tokens, and PII from appearing in logs.
 */
export function maskSensitivePayloadForLogs(
  snapshotPayload: Record<string, unknown>
): Record<string, unknown> {
  const masked = { ...snapshotPayload };

  // List of keys that should be masked
  const sensitiveKeys = [
    "api_key",
    "apiKey",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "password",
    "credential",
    "auth",
    "authorization",
  ];

  // Recursively mask sensitive keys
  function maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sk) => keyLower.includes(sk));

      if (isSensitive) {
        result[key] = "***MASKED***";
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = maskObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return maskObject(masked);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a domain string.
 * Returns true if the domain is valid, false otherwise.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") {
    return false;
  }

  const trimmed = domain.trim().toLowerCase();

  // Basic domain regex (simplified)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  return domainRegex.test(trimmed);
}

/**
 * Normalize a domain string (remove protocol, www, trailing slash).
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, "");

  // Remove www.
  normalized = normalized.replace(/^www\./, "");

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  // Remove path (keep only domain)
  const slashIndex = normalized.indexOf("/");
  if (slashIndex > 0) {
    normalized = normalized.substring(0, slashIndex);
  }

  return normalized;
}

/**
 * Validate keyword priority (must be 1-5).
 */
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 1 && priority <= 5;
}

// ============================================================================
// MATRIX SCORE HELPERS (stubs for future implementation)
// ============================================================================

/**
 * Stub function for computing matrix score.
 * This will be implemented in later phases with actual Matrix v11.0 logic.
 */
export function computeMatrixScore(
  snapshotPayload: Record<string, unknown>
): number {
  // Stub implementation - returns 0 for now
  // Future: This will compute the actual Singularity Matrix v11.0 score
  return 0;
}

/**
 * Stub function for determining package features based on tier.
 * Returns feature flags for a given package tier.
 */
export function getPackageFeatures(tier: SeoPackageTier): {
  includes_social: boolean;
  includes_matrix_v11: boolean;
  includes_indexnow: boolean;
  includes_brave_goggles: boolean;
  includes_nano_banana: boolean;
  includes_golden_key: boolean;
} {
  switch (tier) {
    case "best":
      return {
        includes_social: true,
        includes_matrix_v11: true,
        includes_indexnow: true,
        includes_brave_goggles: true,
        includes_nano_banana: true,
        includes_golden_key: true,
      };

    case "better":
      return {
        includes_social: true,
        includes_matrix_v11: true,
        includes_indexnow: true,
        includes_brave_goggles: false,
        includes_nano_banana: false,
        includes_golden_key: false,
      };

    case "good":
    default:
      return {
        includes_social: false,
        includes_matrix_v11: true,
        includes_indexnow: false,
        includes_brave_goggles: false,
        includes_nano_banana: false,
        includes_golden_key: false,
      };
  }
}
