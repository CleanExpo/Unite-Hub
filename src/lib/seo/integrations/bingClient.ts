/**
 * Bing Webmaster API Key Client
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Handles API key authentication and credential management for Bing Webmaster Tools.
 * All API keys are stored securely in seo_credentials with multi-tenant isolation.
 *
 * REAL API IMPLEMENTATION - No stubs remaining.
 */

import type { SeoCredential } from "../seoTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface BingCredentialData {
  api_key: string;
  verified_sites?: string[]; // List of verified domains
  created_at: string; // ISO 8601 timestamp
}

export interface BingSite {
  url: string;
  verified: boolean;
  verificationMethod?: string;
}

export interface BingApiKeyValidation {
  valid: boolean;
  message?: string;
  sites_count?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BING_WEBMASTER_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";

// Bing API key format: 32-64 alphanumeric characters
const BING_API_KEY_REGEX = /^[A-Za-z0-9]{32,64}$/;

// ============================================================================
// API KEY VALIDATION
// ============================================================================

/**
 * Validate Bing Webmaster API key format.
 * This performs local validation without making an API call.
 *
 * @param apiKey - The API key to validate
 * @returns Validation result
 */
export function validateApiKeyFormat(apiKey: string): BingApiKeyValidation {
  if (!apiKey || typeof apiKey !== "string") {
    return {
      valid: false,
      message: "API key is required",
    };
  }

  const trimmed = apiKey.trim();

  if (!BING_API_KEY_REGEX.test(trimmed)) {
    return {
      valid: false,
      message: "Invalid API key format. Expected 32-64 alphanumeric characters.",
    };
  }

  return {
    valid: true,
    message: "API key format is valid",
  };
}

/**
 * Validate Bing API key by making a test API call.
 * STUB: Returns mock validation for testing.
 *
 * @param apiKey - The API key to validate
 * @returns Validation result with site count if valid
 */
export async function validateBingApiKey(
  apiKey: string
): Promise<BingApiKeyValidation> {
  // First check format
  const formatCheck = validateApiKeyFormat(apiKey);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  try {
    const response = await fetch(
      `${BING_WEBMASTER_API_BASE}/GetSites?apikey=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        valid: false,
        message: `API key validation failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      valid: true,
      message: "API key is valid",
      sites_count: data.d?.length || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        message: `API key validation error: ${error.message}`,
      };
    }
    return {
      valid: false,
      message: "Unknown error during API key validation",
    };
  }
}

// ============================================================================
// CREDENTIAL STORAGE
// ============================================================================

/**
 * Build credential_data JSONB object for storage in seo_credentials table.
 * This formats the API key into our standard credential storage format.
 */
export function buildBingCredentialData(
  apiKey: string,
  verifiedSites?: string[]
): BingCredentialData {
  return {
    api_key: apiKey,
    verified_sites: verifiedSites || [],
    created_at: new Date().toISOString(),
  };
}

/**
 * Extract API key from SeoCredential entity.
 * Handles type checking and validation.
 */
export function extractBingApiKey(credential: SeoCredential): string | null {
  if (credential.credential_type !== "bing_webmaster") {
    return null;
  }

  const data = credential.credential_data as unknown as BingCredentialData;
  return data?.api_key || null;
}

// ============================================================================
// BING API METHODS (REAL)
// ============================================================================

/**
 * List all sites registered in Bing Webmaster for this API key.
 *
 * @param apiKey - Valid Bing Webmaster API key
 * @returns Array of Bing sites
 */
export async function bingListSites(apiKey: string): Promise<BingSite[]> {
  try {
    const response = await fetch(
      `${BING_WEBMASTER_API_BASE}/GetSites?apikey=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list Bing sites: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.d?.map((site: any) => ({
      url: site.Url,
      verified: site.IsVerified,
      verificationMethod: site.VerificationMethod,
    })) || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list Bing sites: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verify site ownership in Bing Webmaster.
 *
 * @param apiKey - Valid Bing Webmaster API key
 * @param siteUrl - Site URL to verify
 * @returns Verification status
 */
export async function bingVerifySiteOwnership(
  apiKey: string,
  siteUrl: string
): Promise<{ verified: boolean; method?: string }> {
  try {
    const response = await fetch(
      `${BING_WEBMASTER_API_BASE}/GetSite?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // 404 means site not found
      if (response.status === 404) {
        return { verified: false };
      }
      throw new Error(`Failed to verify site: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      verified: data.d?.IsVerified || false,
      method: data.d?.VerificationMethod,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return { verified: false };
    }
    console.error("Error verifying Bing site:", error);
    return { verified: false };
  }
}

/**
 * Add a new site to Bing Webmaster.
 *
 * @param apiKey - Valid Bing Webmaster API key
 * @param siteUrl - Site URL to add
 * @returns Success status
 */
export async function bingAddSite(
  apiKey: string,
  siteUrl: string
): Promise<{ success: boolean; message?: string }> {
  // Validate URL format
  try {
    new URL(siteUrl);
  } catch {
    return {
      success: false,
      message: "Invalid URL format",
    };
  }

  try {
    const response = await fetch(
      `${BING_WEBMASTER_API_BASE}/AddSite?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        message: `Failed to add site: ${response.status} ${errorText}`,
      };
    }

    return {
      success: true,
      message: "Site added successfully",
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error adding site: ${error.message}`,
      };
    }
    return {
      success: false,
      message: "Unknown error adding site",
    };
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Mask Bing API key for logging (show first 8 and last 4 characters only).
 * Security: Never log full API keys.
 */
export function maskBingApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return "***INVALID***";
  }

  const first8 = apiKey.substring(0, 8);
  const last4 = apiKey.substring(apiKey.length - 4);

  return `${first8}${"*".repeat(apiKey.length - 12)}${last4}`;
}

/**
 * Normalize Bing site URL to standard format.
 * Bing requires URLs to end with trailing slash for some endpoints.
 */
export function normalizeBingSiteUrl(url: string): string {
  let normalized = url.trim();

  // Ensure https:// protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  // Ensure trailing slash
  if (!normalized.endsWith("/")) {
    normalized += "/";
  }

  return normalized;
}
