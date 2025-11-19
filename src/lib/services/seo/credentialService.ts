/**
 * SEO Credential Service
 * Phase 4 Step 3: Real API Integration Layer
 *
 * High-level service for linking OAuth/API credentials to SEO profiles.
 * Integrates with gscClient, bingClient, and braveClient.
 * All operations enforce organization-level isolation via RLS.
 *
 * Features:
 * - Credential encryption for sensitive tokens/API keys
 * - Automatic token refresh for OAuth credentials
 * - Multi-tenant isolation via organization_id
 * - Soft delete with is_active flag
 */

import { getSupabaseServer } from "@/lib/supabase";
import type {
  SeoCredential,
  SeoProfile,
  SeoCredentialType,
  UserContext,
  SeoApiResponse,
} from "@/lib/seo/seoTypes";
import {
  buildGscCredentialData,
  refreshGscTokens,
  extractRefreshToken,
  type GscTokenResponse,
  type GscCredentialData,
} from "@/lib/seo/integrations/gscClient";
import {
  buildBingCredentialData,
} from "@/lib/seo/integrations/bingClient";
import {
  buildBraveOAuthCredentialData,
  buildBraveApiKeyCredentialData,
  refreshBraveTokens,
  type BraveTokenResponse,
  type BraveCredentialData,
} from "@/lib/seo/integrations/braveClient";
import crypto from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface LinkGscCredentialInput {
  seo_profile_id: string;
  token_response: GscTokenResponse;
  property_url?: string;
}

export interface LinkBingCredentialInput {
  seo_profile_id: string;
  api_key: string;
  verified_sites?: string[];
}

export interface LinkBraveOAuthCredentialInput {
  seo_profile_id: string;
  token_response: BraveTokenResponse;
  channel_id?: string;
}

export interface LinkBraveApiKeyCredentialInput {
  seo_profile_id: string;
  api_key: string;
  channel_id?: string;
}

export interface CredentialValidationResult {
  valid: boolean;
  message?: string;
  credential?: SeoCredential;
}

// ============================================================================
// LINK CREDENTIALS
// ============================================================================

/**
 * Link Google Search Console OAuth credentials to an SEO profile.
 * Stores access_token, refresh_token, expires_at in credential_data JSONB.
 *
 * @param input - GSC credential input
 * @param userContext - User context for authorization check
 * @returns API response with created credential
 */
export async function linkGscCredentialToSeoProfile(
  input: LinkGscCredentialInput,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    input.seo_profile_id,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
    };
  }

  // Build credential data
  const credentialData = buildGscCredentialData(
    input.token_response,
    input.property_url
  );

  // Check if credential already exists for this profile
  const { data: existingCred } = await supabase
    .from("seo_credentials")
    .select("id")
    .eq("seo_profile_id", input.seo_profile_id)
    .eq("credential_type", "gsc")
    .eq("organization_id", userContext.organization_id)
    .single();

  if (existingCred) {
    // Update existing credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .update({
        credential_data: credentialData,
        expires_at: credentialData.expires_at,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCred.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update GSC credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "GSC credential updated successfully",
    };
  } else {
    // Insert new credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .insert({
        seo_profile_id: input.seo_profile_id,
        organization_id: userContext.organization_id,
        credential_type: "gsc",
        credential_data: credentialData,
        expires_at: credentialData.expires_at,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create GSC credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "GSC credential linked successfully",
    };
  }
}

/**
 * Link Bing Webmaster API key to an SEO profile.
 *
 * @param input - Bing credential input
 * @param userContext - User context for authorization check
 * @returns API response with created credential
 */
export async function linkBingCredentialToSeoProfile(
  input: LinkBingCredentialInput,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    input.seo_profile_id,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
    };
  }

  // Build credential data
  const credentialData = buildBingCredentialData(
    input.api_key,
    input.verified_sites
  );

  // Check if credential already exists for this profile
  const { data: existingCred } = await supabase
    .from("seo_credentials")
    .select("id")
    .eq("seo_profile_id", input.seo_profile_id)
    .eq("credential_type", "bing_webmaster")
    .eq("organization_id", userContext.organization_id)
    .single();

  if (existingCred) {
    // Update existing credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .update({
        credential_data: credentialData,
        is_active: true,
        expires_at: null, // API keys don't expire
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCred.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update Bing credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Bing credential updated successfully",
    };
  } else {
    // Insert new credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .insert({
        seo_profile_id: input.seo_profile_id,
        organization_id: userContext.organization_id,
        credential_type: "bing_webmaster",
        credential_data: credentialData,
        is_active: true,
        expires_at: null, // API keys don't expire
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create Bing credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Bing credential linked successfully",
    };
  }
}

/**
 * Link Brave Creator OAuth credentials to an SEO profile.
 *
 * @param input - Brave OAuth credential input
 * @param userContext - User context for authorization check
 * @returns API response with created credential
 */
export async function linkBraveOAuthCredentialToSeoProfile(
  input: LinkBraveOAuthCredentialInput,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    input.seo_profile_id,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
    };
  }

  // Build credential data
  const credentialData = buildBraveOAuthCredentialData(
    input.token_response,
    input.channel_id
  );

  // Check if credential already exists for this profile
  const { data: existingCred } = await supabase
    .from("seo_credentials")
    .select("id")
    .eq("seo_profile_id", input.seo_profile_id)
    .eq("credential_type", "brave_console")
    .eq("organization_id", userContext.organization_id)
    .single();

  if (existingCred) {
    // Update existing credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .update({
        credential_data: credentialData,
        expires_at: credentialData.expires_at,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCred.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update Brave OAuth credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Brave OAuth credential updated successfully",
    };
  } else {
    // Insert new credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .insert({
        seo_profile_id: input.seo_profile_id,
        organization_id: userContext.organization_id,
        credential_type: "brave_console",
        credential_data: credentialData,
        expires_at: credentialData.expires_at,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create Brave OAuth credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Brave OAuth credential linked successfully",
    };
  }
}

/**
 * Link Brave Creator API key to an SEO profile (alternative to OAuth).
 *
 * @param input - Brave API key credential input
 * @param userContext - User context for authorization check
 * @returns API response with created credential
 */
export async function linkBraveApiKeyCredentialToSeoProfile(
  input: LinkBraveApiKeyCredentialInput,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    input.seo_profile_id,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
    };
  }

  // Build credential data
  const credentialData = buildBraveApiKeyCredentialData(
    input.api_key,
    input.channel_id
  );

  // Check if credential already exists for this profile
  const { data: existingCred } = await supabase
    .from("seo_credentials")
    .select("id")
    .eq("seo_profile_id", input.seo_profile_id)
    .eq("credential_type", "brave_console")
    .eq("organization_id", userContext.organization_id)
    .single();

  if (existingCred) {
    // Update existing credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .update({
        credential_data: credentialData,
        is_active: true,
        expires_at: null, // API keys don't expire
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCred.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update Brave API key credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Brave API key credential updated successfully",
    };
  } else {
    // Insert new credential
    const { data, error } = await supabase
      .from("seo_credentials")
      .insert({
        seo_profile_id: input.seo_profile_id,
        organization_id: userContext.organization_id,
        credential_type: "brave_console",
        credential_data: credentialData,
        is_active: true,
        expires_at: null, // API keys don't expire
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create Brave API key credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: "Brave API key credential linked successfully",
    };
  }
}

// ============================================================================
// UNLINK CREDENTIALS
// ============================================================================

/**
 * Unlink a credential from an SEO profile (soft delete - sets is_active = false).
 *
 * @param credentialId - Credential UUID to unlink
 * @param userContext - User context for authorization check
 * @returns API response
 */
export async function unlinkCredentialFromSeoProfile(
  credentialId: string,
  userContext: UserContext
): Promise<SeoApiResponse<void>> {
  const supabase = await getSupabaseServer();

  // Verify credential exists and user has access
  const { data: credential, error: fetchError } = await supabase
    .from("seo_credentials")
    .select("seo_profile_id, organization_id")
    .eq("id", credentialId)
    .single();

  if (fetchError || !credential) {
    return {
      success: false,
      error: "Credential not found",
    };
  }

  // Verify ownership
  const accessCheck = await validateCredentialOwnership(
    credential.seo_profile_id,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
    };
  }

  // Soft delete (set is_active = false)
  const { error: updateError } = await supabase
    .from("seo_credentials")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", credentialId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to unlink credential: ${updateError.message}`,
    };
  }

  return {
    success: true,
    message: "Credential unlinked successfully",
  };
}

// ============================================================================
// GET CREDENTIALS
// ============================================================================

/**
 * Get all active credentials for an SEO profile.
 *
 * @param seoProfileId - SEO profile UUID
 * @param userContext - User context for authorization check
 * @returns API response with array of credentials
 */
export async function getCredentialsForSeoProfile(
  seoProfileId: string,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential[]>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    seoProfileId,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
      data: [],
    };
  }

  // Fetch all active credentials for this profile
  const { data, error } = await supabase
    .from("seo_credentials")
    .select("*")
    .eq("seo_profile_id", seoProfileId)
    .eq("organization_id", userContext.organization_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch credentials: ${error.message}`,
      data: [],
    };
  }

  return {
    success: true,
    data: (data as SeoCredential[]) || [],
  };
}

/**
 * Get a specific credential by type for an SEO profile.
 *
 * @param seoProfileId - SEO profile UUID
 * @param credentialType - Type of credential (gsc, bing_webmaster, brave_console, etc.)
 * @param userContext - User context for authorization check
 * @returns API response with credential or null
 */
export async function getCredentialByType(
  seoProfileId: string,
  credentialType: SeoCredentialType,
  userContext: UserContext
): Promise<SeoApiResponse<SeoCredential | null>> {
  const supabase = await getSupabaseServer();

  // Verify user has access to the SEO profile
  const accessCheck = await validateCredentialOwnership(
    seoProfileId,
    userContext
  );
  if (!accessCheck.valid) {
    return {
      success: false,
      error: accessCheck.message || "Access denied",
      data: null,
    };
  }

  // Fetch credential by type
  const { data, error } = await supabase
    .from("seo_credentials")
    .select("*")
    .eq("seo_profile_id", seoProfileId)
    .eq("credential_type", credentialType)
    .eq("organization_id", userContext.organization_id)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return {
        success: true,
        data: null,
        message: "No credential found for this type",
      };
    }
    return {
      success: false,
      error: `Failed to fetch credential: ${error.message}`,
      data: null,
    };
  }

  return {
    success: true,
    data: data as SeoCredential,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that the user has permission to access/modify credentials for an SEO profile.
 * Checks that:
 * 1. SEO profile exists
 * 2. User's organization matches the profile's organization
 * 3. User has appropriate role (owner/admin can modify, members can view)
 *
 * @param seoProfileId - SEO profile UUID
 * @param userContext - User context for authorization check
 * @returns Validation result
 */
export async function validateCredentialOwnership(
  seoProfileId: string,
  userContext: UserContext
): Promise<CredentialValidationResult> {
  const supabase = await getSupabaseServer();

  // Fetch SEO profile
  const { data: profile, error } = await supabase
    .from("seo_profiles")
    .select("organization_id")
    .eq("id", seoProfileId)
    .single();

  if (error || !profile) {
    return {
      valid: false,
      message: "SEO profile not found",
    };
  }

  // Verify organization match
  if (profile.organization_id !== userContext.organization_id) {
    return {
      valid: false,
      message: "Access denied: Profile belongs to a different organization",
    };
  }

  // All checks passed
  return {
    valid: true,
    message: "Access granted",
  };
}

/**
 * Check if a credential needs to be refreshed (for OAuth credentials with expiration).
 *
 * @param credential - Credential to check
 * @returns True if credential is expired or about to expire (within 5 minutes)
 */
export function isCredentialExpired(credential: SeoCredential): boolean {
  if (!credential.expires_at) {
    return false; // API keys don't expire
  }

  const expiresAt = new Date(credential.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Get all credentials that are about to expire (within 24 hours).
 * Useful for background jobs that refresh credentials.
 *
 * @param organizationId - Organization UUID
 * @returns Array of credentials needing refresh
 */
export async function getCredentialsNeedingRefresh(
  organizationId: string
): Promise<SeoCredential[]> {
  const supabase = await getSupabaseServer();

  const twentyFourHoursFromNow = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("seo_credentials")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lt("expires_at", twentyFourHoursFromNow);

  if (error) {
    console.error("Failed to fetch credentials needing refresh:", error);
    return [];
  }

  return (data as SeoCredential[]) || [];
}

// ============================================================================
// CREDENTIAL ENCRYPTION
// ============================================================================

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable.
 * Format: 32-byte hex string (64 characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SEO_CREDENTIAL_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "SEO_CREDENTIAL_ENCRYPTION_KEY environment variable not set. " +
      "Generate with: openssl rand -hex 32"
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "SEO_CREDENTIAL_ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
      "Generate with: openssl rand -hex 32"
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt sensitive credential data (tokens, API keys).
 *
 * @param plaintext - Sensitive data to encrypt
 * @returns Encrypted data in format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encryptCredentialData(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all hex-encoded)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive credential data.
 *
 * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 */
export function decryptCredentialData(encryptedData: string): string {
  const key = getEncryptionKey();

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt credential_data JSONB before storage.
 * Only encrypts access_token, refresh_token, and api_key fields.
 *
 * @param credentialData - Credential data object
 * @returns Credential data with encrypted sensitive fields
 */
export function encryptCredentialObject(credentialData: any): any {
  const encrypted = { ...credentialData };

  // Encrypt access_token if present
  if (encrypted.access_token && typeof encrypted.access_token === "string") {
    encrypted.access_token = encryptCredentialData(encrypted.access_token);
    encrypted._encrypted_access_token = true;
  }

  // Encrypt refresh_token if present
  if (encrypted.refresh_token && typeof encrypted.refresh_token === "string") {
    encrypted.refresh_token = encryptCredentialData(encrypted.refresh_token);
    encrypted._encrypted_refresh_token = true;
  }

  // Encrypt api_key if present
  if (encrypted.api_key && typeof encrypted.api_key === "string") {
    encrypted.api_key = encryptCredentialData(encrypted.api_key);
    encrypted._encrypted_api_key = true;
  }

  return encrypted;
}

/**
 * Decrypt credential_data JSONB after retrieval.
 *
 * @param credentialData - Credential data object with encrypted fields
 * @returns Credential data with decrypted sensitive fields
 */
export function decryptCredentialObject(credentialData: any): any {
  const decrypted = { ...credentialData };

  // Decrypt access_token if encrypted
  if (decrypted._encrypted_access_token && decrypted.access_token) {
    try {
      decrypted.access_token = decryptCredentialData(decrypted.access_token);
      delete decrypted._encrypted_access_token;
    } catch (error) {
      console.error("Failed to decrypt access_token:", error);
    }
  }

  // Decrypt refresh_token if encrypted
  if (decrypted._encrypted_refresh_token && decrypted.refresh_token) {
    try {
      decrypted.refresh_token = decryptCredentialData(decrypted.refresh_token);
      delete decrypted._encrypted_refresh_token;
    } catch (error) {
      console.error("Failed to decrypt refresh_token:", error);
    }
  }

  // Decrypt api_key if encrypted
  if (decrypted._encrypted_api_key && decrypted.api_key) {
    try {
      decrypted.api_key = decryptCredentialData(decrypted.api_key);
      delete decrypted._encrypted_api_key;
    } catch (error) {
      console.error("Failed to decrypt api_key:", error);
    }
  }

  return decrypted;
}

// ============================================================================
// AUTO-REFRESH TOKENS
// ============================================================================

/**
 * Automatically refresh an expired OAuth credential.
 * Supports GSC and Brave OAuth credentials.
 *
 * @param credential - Expired credential to refresh
 * @returns API response with refreshed credential
 */
export async function autoRefreshCredential(
  credential: SeoCredential
): Promise<SeoApiResponse<SeoCredential>> {
  const supabase = await getSupabaseServer();

  try {
    // Decrypt credential data
    const decryptedData = decryptCredentialObject(credential.credential_data);

    let newTokenResponse: GscTokenResponse | BraveTokenResponse | null = null;
    let newCredentialData: any = null;

    // Refresh based on credential type
    if (credential.credential_type === "gsc") {
      const gscData = decryptedData as GscCredentialData;
      if (!gscData.refresh_token) {
        return {
          success: false,
          error: "No refresh token available for GSC credential",
        };
      }

      newTokenResponse = await refreshGscTokens(gscData.refresh_token);
      newCredentialData = buildGscCredentialData(
        newTokenResponse,
        gscData.property_url
      );
    } else if (credential.credential_type === "brave_console") {
      const braveData = decryptedData as BraveCredentialData;

      // Only OAuth credentials can be refreshed
      if (braveData.auth_method !== "oauth" || !braveData.refresh_token) {
        return {
          success: false,
          error: "Brave credential is not OAuth or missing refresh token",
        };
      }

      newTokenResponse = await refreshBraveTokens(braveData.refresh_token);
      newCredentialData = buildBraveOAuthCredentialData(
        newTokenResponse,
        braveData.channel_id
      );
    } else {
      return {
        success: false,
        error: `Credential type ${credential.credential_type} does not support auto-refresh`,
      };
    }

    // Encrypt new credential data
    const encryptedCredentialData = encryptCredentialObject(newCredentialData);

    // Update credential in database
    const { data, error } = await supabase
      .from("seo_credentials")
      .update({
        credential_data: encryptedCredentialData,
        expires_at: newCredentialData.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credential.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to update refreshed credential: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data as SeoCredential,
      message: `${credential.credential_type} credential refreshed successfully`,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to refresh credential: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Unknown error refreshing credential",
    };
  }
}

/**
 * Background job to refresh all credentials that are about to expire.
 * Should be run via cron job or scheduled task every hour.
 *
 * @param organizationId - Organization UUID
 * @returns Number of credentials refreshed and number of failures
 */
export async function refreshExpiredCredentials(
  organizationId: string
): Promise<{ refreshed: number; failed: number; errors: string[] }> {
  const credentials = await getCredentialsNeedingRefresh(organizationId);

  let refreshed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const credential of credentials) {
    // Only refresh OAuth credentials that support refresh
    if (
      credential.credential_type !== "gsc" &&
      credential.credential_type !== "brave_console"
    ) {
      continue;
    }

    const result = await autoRefreshCredential(credential);

    if (result.success) {
      refreshed++;
      console.log(
        `Refreshed ${credential.credential_type} credential ${credential.id}`
      );
    } else {
      failed++;
      const errorMsg = `Failed to refresh ${credential.credential_type} credential ${credential.id}: ${result.error}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return { refreshed, failed, errors };
}
