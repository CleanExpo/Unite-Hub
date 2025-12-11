/**
 * Guardian X01: Tenant Fingerprint Service
 *
 * Maps tenant IDs to irreversible hashes and coarse cohort metadata.
 * Strictly privacy-preserving: no reverse mapping tenant_hash → tenant_id.
 */

import { createHmac } from 'crypto';
import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianTenantFingerprint {
  tenantHash: string;
  region?: string;
  sizeBand?: string;
  vertical?: string;
}

/**
 * Compute irreversible tenant hash using HMAC-SHA256
 *
 * Secret is read from GUARDIAN_TENANT_HASH_SECRET environment variable.
 * Never log tenantId or the secret.
 *
 * @param tenantId Internal tenant identifier
 * @param saltId Salt version identifier (e.g., 'v1', 'v2')
 * @returns Hex-encoded hash
 */
export function computeTenantHash(tenantId: string, saltId: string): string {
  const secret = process.env.GUARDIAN_TENANT_HASH_SECRET;
  if (!secret) {
    throw new Error('GUARDIAN_TENANT_HASH_SECRET environment variable is not set');
  }

  // HMAC-SHA256(secret, tenantId + ':' + saltId)
  const hmac = createHmac('sha256', secret);
  hmac.update(`${tenantId}:${saltId}`);
  return hmac.digest('hex');
}

/**
 * Upsert a tenant fingerprint with optional cohort metadata
 */
export async function upsertTenantFingerprint(
  tenantId: string,
  options?: {
    region?: string;
    sizeBand?: string;
    vertical?: string;
  }
): Promise<GuardianTenantFingerprint> {
  const supabase = getSupabaseServer();
  const saltId = process.env.GUARDIAN_HASH_SALT_ID || 'v1';
  const tenantHash = computeTenantHash(tenantId, saltId);

  const { data, error } = await supabase
    .from('guardian_network_tenant_fingerprints')
    .upsert(
      {
        tenant_hash: tenantHash,
        hash_salt: saltId,
        region: options?.region || null,
        size_band: options?.sizeBand || null,
        vertical: options?.vertical || null,
        updated_at: new Date(),
      },
      { onConflict: 'tenant_hash' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert tenant fingerprint: ${error?.message || 'Unknown error'}`);
  }

  return {
    tenantHash: data.tenant_hash,
    region: data.region || undefined,
    sizeBand: data.size_band || undefined,
    vertical: data.vertical || undefined,
  };
}

/**
 * Get tenant fingerprint (create default if missing)
 */
export async function getTenantFingerprintByTenantId(
  tenantId: string
): Promise<GuardianTenantFingerprint> {
  const supabase = getSupabaseServer();
  const saltId = process.env.GUARDIAN_HASH_SALT_ID || 'v1';
  const tenantHash = computeTenantHash(tenantId, saltId);

  const { data } = await supabase
    .from('guardian_network_tenant_fingerprints')
    .select('*')
    .eq('tenant_hash', tenantHash)
    .single();

  if (data) {
    return {
      tenantHash: data.tenant_hash,
      region: data.region || undefined,
      sizeBand: data.size_band || undefined,
      vertical: data.vertical || undefined,
    };
  }

  // Create default fingerprint if missing
  return upsertTenantFingerprint(tenantId);
}

/**
 * Compute cohort keys for a fingerprint (for aggregation/exposure)
 *
 * Returns keys like: 'global', 'region:apac', 'size:small', 'vertical:saas'
 */
export function computeCohortKeysForFingerprint(fp: GuardianTenantFingerprint): string[] {
  const keys = ['global'];

  if (fp.region) {
    keys.push(`region:${fp.region}`);
  }
  if (fp.sizeBand) {
    keys.push(`size:${fp.sizeBand}`);
  }
  if (fp.vertical) {
    keys.push(`vertical:${fp.vertical}`);
  }

  return keys;
}
