/**
 * Founder Business Vault Service
 *
 * Manages founder_business_vault_secrets table.
 * Provides secure storage for API keys, credentials, and sensitive configuration.
 *
 * NOTE: Secrets are stored as text. Encryption should be handled at the
 * application level before calling these functions for sensitive data.
 *
 * @module founderOS/founderBusinessVaultService
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type SecretType =
  | 'api_key'
  | 'oauth_token'
  | 'webhook_secret'
  | 'database_url'
  | 'smtp_credentials'
  | 'encryption_key'
  | 'other';

export interface SecretMetadata {
  environment?: 'production' | 'staging' | 'development';
  expires_at?: string;
  scopes?: string[];
  service_name?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface VaultSecret {
  id: string;
  founder_business_id: string;
  secret_label: string;
  secret_type: SecretType;
  secret_payload: string;
  metadata: SecretMetadata;
  created_at: string;
  updated_at: string;
}

export interface AddSecretInput {
  label: string;
  type: SecretType;
  payload: string;
  metadata?: SecretMetadata;
}

export interface UpdateSecretInput {
  label?: string;
  type?: SecretType;
  payload?: string;
  metadata?: SecretMetadata;
}

export interface VaultServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Add a new secret to a business vault
 *
 * @param businessId - UUID of the founder business
 * @param label - Human-readable label for the secret
 * @param type - Type of secret (api_key, oauth_token, etc.)
 * @param payload - The secret value (should be encrypted before storage for sensitive data)
 * @param metadata - Optional additional metadata
 * @returns Created secret or error
 */
export async function addSecret(
  businessId: string,
  label: string,
  type: SecretType,
  payload: string,
  metadata?: SecretMetadata
): Promise<VaultServiceResult<VaultSecret>> {
  try {
    const supabase = supabaseAdmin;

    const { data: secret, error } = await supabase
      .from('founder_business_vault_secrets')
      .insert({
        founder_business_id: businessId,
        secret_label: label,
        secret_type: type,
        secret_payload: payload,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[VaultService] Add secret error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: `Secret with label '${label}' already exists for this business`,
        };
      }

      // Handle foreign key violation (business doesn't exist)
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Business not found',
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: secret as VaultSecret,
    };
  } catch (err) {
    console.error('[VaultService] Add secret exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error adding secret',
    };
  }
}

/**
 * Get all secrets for a business
 *
 * @param businessId - UUID of the founder business
 * @param secretType - Optional filter by secret type
 * @returns List of secrets
 */
export async function getSecrets(
  businessId: string,
  secretType?: SecretType
): Promise<VaultServiceResult<VaultSecret[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_business_vault_secrets')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false });

    if (secretType) {
      query = query.eq('secret_type', secretType);
    }

    const { data: secrets, error } = await query;

    if (error) {
      console.error('[VaultService] Get secrets error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (secrets || []) as VaultSecret[],
    };
  } catch (err) {
    console.error('[VaultService] Get secrets exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching secrets',
    };
  }
}

/**
 * Get a single secret by ID
 *
 * @param secretId - UUID of the secret
 * @returns Secret data or error
 */
export async function getSecret(
  secretId: string
): Promise<VaultServiceResult<VaultSecret>> {
  try {
    const supabase = supabaseAdmin;

    const { data: secret, error } = await supabase
      .from('founder_business_vault_secrets')
      .select('*')
      .eq('id', secretId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Secret not found',
        };
      }
      console.error('[VaultService] Get secret error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: secret as VaultSecret,
    };
  } catch (err) {
    console.error('[VaultService] Get secret exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching secret',
    };
  }
}

/**
 * Get a secret by its label for a specific business
 *
 * @param businessId - UUID of the founder business
 * @param label - Secret label
 * @returns Secret data or error
 */
export async function getSecretByLabel(
  businessId: string,
  label: string
): Promise<VaultServiceResult<VaultSecret>> {
  try {
    const supabase = supabaseAdmin;

    const { data: secret, error } = await supabase
      .from('founder_business_vault_secrets')
      .select('*')
      .eq('founder_business_id', businessId)
      .eq('secret_label', label)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: `Secret with label '${label}' not found`,
        };
      }
      console.error('[VaultService] Get secret by label error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: secret as VaultSecret,
    };
  } catch (err) {
    console.error('[VaultService] Get secret by label exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching secret by label',
    };
  }
}

/**
 * Update a secret
 *
 * @param secretId - UUID of the secret
 * @param data - Update data
 * @returns Updated secret or error
 */
export async function updateSecret(
  secretId: string,
  data: UpdateSecretInput
): Promise<VaultServiceResult<VaultSecret>> {
  try {
    const supabase = supabaseAdmin;

    const updateData: Record<string, unknown> = {};

    if (data.label !== undefined) {
      updateData.secret_label = data.label;
    }
    if (data.type !== undefined) {
      updateData.secret_type = data.type;
    }
    if (data.payload !== undefined) {
      updateData.secret_payload = data.payload;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    const { data: secret, error } = await supabase
      .from('founder_business_vault_secrets')
      .update(updateData)
      .eq('id', secretId)
      .select()
      .single();

    if (error) {
      console.error('[VaultService] Update secret error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: `Secret with label '${data.label}' already exists for this business`,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: secret as VaultSecret,
    };
  } catch (err) {
    console.error('[VaultService] Update secret exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error updating secret',
    };
  }
}

/**
 * Delete a secret
 *
 * @param secretId - UUID of the secret
 * @returns Success/failure result
 */
export async function deleteSecret(
  secretId: string
): Promise<VaultServiceResult<void>> {
  try {
    const supabase = supabaseAdmin;

    const { error } = await supabase
      .from('founder_business_vault_secrets')
      .delete()
      .eq('id', secretId);

    if (error) {
      console.error('[VaultService] Delete secret error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[VaultService] Delete secret exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error deleting secret',
    };
  }
}

/**
 * Delete all secrets for a business
 * WARNING: Use with caution - this is destructive
 *
 * @param businessId - UUID of the founder business
 * @returns Number of deleted secrets
 */
export async function deleteAllSecretsForBusiness(
  businessId: string
): Promise<VaultServiceResult<number>> {
  try {
    const supabase = supabaseAdmin;

    // First count how many will be deleted
    const { count, error: countError } = await supabase
      .from('founder_business_vault_secrets')
      .select('id', { count: 'exact', head: true })
      .eq('founder_business_id', businessId);

    if (countError) {
      console.error('[VaultService] Count before delete error:', countError);
      return {
        success: false,
        error: countError.message,
      };
    }

    // Perform the delete
    const { error } = await supabase
      .from('founder_business_vault_secrets')
      .delete()
      .eq('founder_business_id', businessId);

    if (error) {
      console.error('[VaultService] Delete all secrets error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (err) {
    console.error('[VaultService] Delete all secrets exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error deleting all secrets',
    };
  }
}

/**
 * Check if a secret exists by label
 *
 * @param businessId - UUID of the founder business
 * @param label - Secret label to check
 * @returns Boolean indicating existence
 */
export async function secretExists(
  businessId: string,
  label: string
): Promise<VaultServiceResult<boolean>> {
  try {
    const supabase = supabaseAdmin;

    const { count, error } = await supabase
      .from('founder_business_vault_secrets')
      .select('id', { count: 'exact', head: true })
      .eq('founder_business_id', businessId)
      .eq('secret_label', label);

    if (error) {
      console.error('[VaultService] Secret exists error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (count || 0) > 0,
    };
  } catch (err) {
    console.error('[VaultService] Secret exists exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error checking secret existence',
    };
  }
}

/**
 * Upsert a secret - create or update based on label
 *
 * @param businessId - UUID of the founder business
 * @param label - Secret label
 * @param type - Secret type
 * @param payload - Secret payload
 * @param metadata - Optional metadata
 * @returns Created or updated secret
 */
export async function upsertSecret(
  businessId: string,
  label: string,
  type: SecretType,
  payload: string,
  metadata?: SecretMetadata
): Promise<VaultServiceResult<VaultSecret>> {
  try {
    const supabase = supabaseAdmin;

    const { data: secret, error } = await supabase
      .from('founder_business_vault_secrets')
      .upsert(
        {
          founder_business_id: businessId,
          secret_label: label,
          secret_type: type,
          secret_payload: payload,
          metadata: metadata || {},
        },
        {
          onConflict: 'founder_business_id,secret_label',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[VaultService] Upsert secret error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: secret as VaultSecret,
    };
  } catch (err) {
    console.error('[VaultService] Upsert secret exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error upserting secret',
    };
  }
}

/**
 * Count secrets for a business
 *
 * @param businessId - UUID of the founder business
 * @param secretType - Optional filter by type
 * @returns Count of secrets
 */
export async function countSecrets(
  businessId: string,
  secretType?: SecretType
): Promise<VaultServiceResult<number>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_business_vault_secrets')
      .select('id', { count: 'exact', head: true })
      .eq('founder_business_id', businessId);

    if (secretType) {
      query = query.eq('secret_type', secretType);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[VaultService] Count secrets error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (err) {
    console.error('[VaultService] Count secrets exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error counting secrets',
    };
  }
}
