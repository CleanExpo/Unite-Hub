/**
 * API Key Management Service (Phase E2)
 *
 * Secure API key generation, verification, and revocation.
 * Keys are SHA-256 hashed and never stored in plain text.
 *
 * Key format: uh_[32 random chars] (e.g. uh_abc123def456...)
 *
 * Related to: E-Series Security & Governance Foundation
 */

import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string;
  last_used_ip?: string;
  usage_count: number;
  is_active: boolean;
  revoked_at?: string;
  revoked_by?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateApiKeyInput {
  tenantId: string;
  name: string;
  scopes?: string[];
  createdBy: string;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  rawKey: string; // Only returned once at creation
}

// ============================================================================
// API Key Generation
// ============================================================================

/**
 * Generate a secure API key
 * Format: uh_[32 random hex chars]
 */
function generateApiKey(): string {
  const randomPart = randomBytes(16).toString('hex'); // 32 hex chars
  return `uh_${randomPart}`;
}

/**
 * Hash API key with SHA-256
 */
function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extract key prefix (first 8 chars after uh_)
 */
function getKeyPrefix(rawKey: string): string {
  // uh_ + first 8 chars of random part = 11 chars total
  return rawKey.substring(0, 11);
}

// ============================================================================
// Create API Key
// ============================================================================

/**
 * Create a new API key
 * Returns the raw key ONLY ONCE - must be saved by caller
 */
export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult | null> {
  try {
    const supabase = await createClient();

    // Generate raw key
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    // Insert into database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        tenant_id: input.tenantId,
        name: input.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: input.scopes || [],
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create API key:', error.message);
      return null;
    }

    return {
      apiKey: data as ApiKey,
      rawKey, // Return raw key ONLY once
    };
  } catch (error: any) {
    console.error('Unexpected error creating API key:', error);
    return null;
  }
}

// ============================================================================
// Verify API Key
// ============================================================================

/**
 * Verify an API key and return its metadata
 * Updates last_used_at and usage_count
 */
export async function verifyApiKey(
  rawKey: string,
  ipAddress?: string
): Promise<ApiKey | null> {
  try {
    const supabase = await createClient();
    const keyHash = hashApiKey(rawKey);

    // Find key by hash
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to verify API key:', error.message);
      return null;
    }

    const apiKey = data as ApiKey;

    // Update last used tracking (fire and forget - don't wait)
    supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_ip: ipAddress || null,
        usage_count: apiKey.usage_count + 1,
      })
      .eq('id', apiKey.id)
      .then(() => {})
      .catch((err) => console.error('Failed to update API key usage:', err));

    return apiKey;
  } catch (error: any) {
    console.error('Unexpected error verifying API key:', error);
    return null;
  }
}

// ============================================================================
// List API Keys
// ============================================================================

/**
 * List all API keys for a tenant
 */
export async function listApiKeys(tenantId: string): Promise<ApiKey[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to list API keys:', error.message);
      return [];
    }

    return (data as ApiKey[]) || [];
  } catch (error: any) {
    console.error('Unexpected error listing API keys:', error);
    return [];
  }
}

/**
 * Get a single API key by ID
 */
export async function getApiKey(tenantId: string, keyId: string): Promise<ApiKey | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', keyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get API key:', error.message);
      return null;
    }

    return data as ApiKey;
  } catch (error: any) {
    console.error('Unexpected error getting API key:', error);
    return null;
  }
}

// ============================================================================
// Revoke API Key
// ============================================================================

/**
 * Revoke an API key (soft delete)
 */
export async function revokeApiKey(
  tenantId: string,
  keyId: string,
  revokedBy: string
): Promise<ApiKey | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq('tenant_id', tenantId)
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      console.error('Failed to revoke API key:', error.message);
      return null;
    }

    return data as ApiKey;
  } catch (error: any) {
    console.error('Unexpected error revoking API key:', error);
    return null;
  }
}

// ============================================================================
// Scope Checking
// ============================================================================

/**
 * Check if API key has required scope
 */
export function hasScope(apiKey: ApiKey, requiredScope: string): boolean {
  return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('admin');
}

/**
 * Check if API key has any of the required scopes
 */
export function hasAnyScope(apiKey: ApiKey, requiredScopes: string[]): boolean {
  if (apiKey.scopes.includes('admin')) return true;
  return requiredScopes.some((scope) => apiKey.scopes.includes(scope));
}

/**
 * Check if API key has all required scopes
 */
export function hasAllScopes(apiKey: ApiKey, requiredScopes: string[]): boolean {
  if (apiKey.scopes.includes('admin')) return true;
  return requiredScopes.every((scope) => apiKey.scopes.includes(scope));
}
