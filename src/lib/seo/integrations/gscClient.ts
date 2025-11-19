/**
 * Google Search Console OAuth Client
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Handles OAuth 2.0 authentication and credential management for Google Search Console.
 * All tokens are stored securely in seo_credentials with multi-tenant isolation.
 *
 * REAL API IMPLEMENTATION - No stubs remaining.
 */

import type { SeoCredential } from "../seoTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface GscAuthUrlOptions {
  redirect_uri: string;
  state: string; // CSRF protection token
  organization_id: string; // For multi-tenant tracking
}

export interface GscTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope: string;
}

export interface GscProperty {
  siteUrl: string;
  permissionLevel: "siteOwner" | "siteFullUser" | "siteRestrictedUser";
}

export interface GscCredentialData {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO 8601 timestamp
  scope: string;
  property_url?: string; // Selected GSC property
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GSC_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GSC_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

// ============================================================================
// AUTH URL BUILDER
// ============================================================================

/**
 * Build Google OAuth authorization URL for Search Console access.
 * User will be redirected to this URL to grant permissions.
 */
export function buildGscAuthUrl(options: GscAuthUrlOptions): string {
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing GOOGLE_GSC_CLIENT_ID environment variable");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: options.redirect_uri,
    response_type: "code",
    scope: GSC_SCOPES,
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent screen to get refresh token
    state: options.state,
  });

  return `${GSC_AUTH_ENDPOINT}?${params.toString()}`;
}

// ============================================================================
// TOKEN EXCHANGE
// ============================================================================

/**
 * Exchange authorization code for access token and refresh token.
 * This is called in the OAuth callback after user grants permission.
 *
 * @param authCode - Authorization code from OAuth callback
 * @param redirectUri - Must match the redirect_uri used in buildGscAuthUrl
 * @returns Token response with access_token and refresh_token
 */
export async function exchangeAuthCodeForTokens(
  authCode: string,
  redirectUri: string
): Promise<GscTokenResponse> {
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials in environment variables");
  }

  try {
    const response = await fetch(GSC_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `OAuth token exchange failed: ${response.status} - ${errorData.error_description || errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    return data as GscTokenResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to exchange GSC auth code: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh an expired access token using the refresh token.
 * Should be called automatically when access_token expires.
 *
 * @param refreshToken - The refresh token from initial OAuth flow
 * @returns New token response with fresh access_token
 */
export async function refreshGscTokens(
  refreshToken: string
): Promise<GscTokenResponse> {
  const clientId = process.env.GOOGLE_GSC_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GSC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials in environment variables");
  }

  try {
    const response = await fetch(GSC_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `Token refresh failed: ${response.status} - ${errorData.error_description || errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    // Google may not return a new refresh_token, so preserve the old one
    if (!data.refresh_token) {
      data.refresh_token = refreshToken;
    }

    return data as GscTokenResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to refresh GSC tokens: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// GSC API METHODS (REAL)
// ============================================================================

/**
 * List all Search Console properties the user has access to.
 *
 * @param accessToken - Valid GSC access token
 * @returns Array of GSC properties
 */
export async function listGscProperties(
  accessToken: string
): Promise<GscProperty[]> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/webmasters/v3/sites",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `Failed to list GSC properties: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.siteEntry || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list GSC properties: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verify domain ownership for a given property.
 *
 * @param accessToken - Valid GSC access token
 * @param siteUrl - Property URL to verify
 * @returns Verification status
 */
export async function verifyDomainOwnership(
  accessToken: string,
  siteUrl: string
): Promise<{ verified: boolean; method?: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // 404 means site not found/not verified
      if (response.status === 404) {
        return { verified: false };
      }
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `Failed to verify domain: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    // If we successfully fetched the site, it's verified
    return { verified: true, method: "API_VERIFIED" };
  } catch (error) {
    if (error instanceof Error) {
      // If it's a 404 error, return verified: false instead of throwing
      if (error.message.includes("404")) {
        return { verified: false };
      }
      throw new Error(`Failed to verify domain ownership: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// CREDENTIAL DATA HELPERS
// ============================================================================

/**
 * Build credential_data JSONB object for storage in seo_credentials table.
 * This formats the token response into our standard credential storage format.
 */
export function buildGscCredentialData(
  tokenResponse: GscTokenResponse,
  propertyUrl?: string
): GscCredentialData {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();

  return {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: expiresAt,
    scope: tokenResponse.scope,
    property_url: propertyUrl,
  };
}

/**
 * Check if a GSC access token is expired or about to expire.
 * Tokens should be refreshed 5 minutes before expiration.
 */
export function isGscTokenExpired(credentialData: GscCredentialData): boolean {
  const expiresAt = new Date(credentialData.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Extract access token from SeoCredential entity.
 * Handles type checking and validation.
 */
export function extractAccessToken(credential: SeoCredential): string | null {
  if (credential.credential_type !== "gsc") {
    return null;
  }

  const data = credential.credential_data as unknown as GscCredentialData;
  return data?.access_token || null;
}

/**
 * Extract refresh token from SeoCredential entity.
 */
export function extractRefreshToken(credential: SeoCredential): string | null {
  if (credential.credential_type !== "gsc") {
    return null;
  }

  const data = credential.credential_data as unknown as GscCredentialData;
  return data?.refresh_token || null;
}
