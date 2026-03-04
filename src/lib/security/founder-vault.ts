/**
 * Founder Credential Vault Service
 *
 * Secrets are encrypted with AES-256-GCM at the application layer before
 * being written to the database. The encryption key is VAULT_ENCRYPTION_KEY
 * (64 hex chars = 32 bytes), stored as a server-side environment variable.
 *
 * Metadata (label, url, notes) is stored in founder_vault_items.
 * The secret_encrypted column holds the AES-256-GCM ciphertext blob.
 * Audit events are written to founder_vault_audit_log.
 *
 * Owner verification is enforced at both the service layer and via RLS.
 *
 * Generate a key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Then set: VAULT_ENCRYPTION_KEY=<64-hex-string> in .env.local
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

// ─── Crypto ───────────────────────────────────────────────────────────────────

function getVaultKey(): Buffer {
  const keyHex = process.env.VAULT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'VAULT_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

interface EncryptedBlob {
  iv: string;       // base64, 12 bytes
  tag: string;      // base64, 16 bytes (GCM auth tag)
  ciphertext: string; // base64
}

function encryptSecret(plaintext: string): string {
  const key = getVaultKey();
  const iv = randomBytes(12); // 96-bit IV — optimal for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob: EncryptedBlob = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
  return JSON.stringify(blob);
}

function decryptSecret(encrypted: string): string {
  const key = getVaultKey();
  const { iv, tag, ciphertext }: EncryptedBlob = JSON.parse(encrypted);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type VaultCategory = 'login' | 'api-key' | 'banking' | 'licence' | 'other';

export interface VaultItemMetadata {
  id: string;
  owner_id: string;
  business_id: string;
  category: VaultCategory;
  label: string;
  url: string | null;
  notes: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
  // secret_encrypted is intentionally omitted from the public type —
  // never send the ciphertext to the client
}

export interface CreateVaultItemParams {
  ownerId: string;
  businessId: string;
  category: VaultCategory;
  label: string;
  url?: string;
  notes?: string;
  secret: string;
  agentAccessible?: boolean;
}

export interface UpdateVaultItemParams {
  label?: string;
  url?: string | null;
  notes?: string | null;
  category?: VaultCategory;
  businessId?: string;
  secret?: string;
  agentAccessible?: boolean;
}

// ─── Audit Helper ─────────────────────────────────────────────────────────────

async function writeAuditLog(
  itemId: string | null,
  ownerId: string,
  action: 'view' | 'create' | 'update' | 'delete',
  ipAddress?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('founder_vault_audit_log')
    .insert({ item_id: itemId, owner_id: ownerId, action, ip_address: ipAddress ?? null });
  if (error) {
    console.error('[founder-vault] Audit log write failed:', error.message);
  }
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Create a new credential in the vault.
 * Encrypts the secret with AES-256-GCM before storing.
 */
export async function createVaultItem(
  params: CreateVaultItemParams
): Promise<VaultItemMetadata> {
  const supabase = await getSupabaseServer();

  const secretEncrypted = encryptSecret(params.secret);

  const { data: item, error: insertError } = await supabase
    .from('founder_vault_items')
    .insert({
      owner_id: params.ownerId,
      business_id: params.businessId,
      category: params.category,
      label: params.label,
      url: params.url ?? null,
      notes: params.notes ?? null,
      secret_encrypted: secretEncrypted,
      agent_accessible: params.agentAccessible ?? false,
    })
    .select('id, owner_id, business_id, category, label, url, notes, agent_accessible, tags, last_accessed_at, created_at, updated_at')
    .single();

  if (insertError || !item) {
    throw new Error(`Failed to create vault item: ${insertError?.message ?? 'unknown'}`);
  }

  await writeAuditLog(item.id, params.ownerId, 'create');
  return item as VaultItemMetadata;
}

/**
 * List vault items for a user (metadata only — secret_encrypted never returned).
 */
export async function listVaultItems(
  ownerId: string,
  businessId?: string,
  category?: VaultCategory
): Promise<VaultItemMetadata[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_vault_items')
    .select('id, owner_id, business_id, category, label, url, notes, agent_accessible, tags, last_accessed_at, created_at, updated_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (businessId) query = query.eq('business_id', businessId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list vault items: ${error.message}`);
  return (data ?? []) as VaultItemMetadata[];
}

/**
 * Retrieve and decrypt the secret for a vault item.
 * Verifies ownership, decrypts in-process, updates last_accessed_at, writes audit.
 */
export async function getVaultItemDecrypted(
  itemId: string,
  requestingUserId: string,
  ipAddress?: string
): Promise<{ item: VaultItemMetadata; secret: string }> {
  const supabase = await getSupabaseServer();

  const { data: row, error: fetchError } = await supabase
    .from('founder_vault_items')
    .select('*')
    .eq('id', itemId)
    .eq('owner_id', requestingUserId)
    .single();

  if (fetchError || !row) {
    throw new Error('Vault item not found or access denied');
  }

  const secret = decryptSecret(row.secret_encrypted);

  // Update last_accessed_at (non-fatal)
  await supabaseAdmin
    .from('founder_vault_items')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', itemId)
    .catch(() => null);

  await writeAuditLog(itemId, requestingUserId, 'view', ipAddress);

  // Return metadata without secret_encrypted
  const { secret_encrypted: _omit, ...item } = row;
  return { item: item as VaultItemMetadata, secret };
}

/**
 * Update a vault item's metadata and/or secret.
 */
export async function updateVaultItem(
  itemId: string,
  ownerId: string,
  updates: UpdateVaultItemParams
): Promise<VaultItemMetadata> {
  const supabase = await getSupabaseServer();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('founder_vault_items')
    .select('id, owner_id')
    .eq('id', itemId)
    .eq('owner_id', ownerId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Vault item not found or access denied');
  }

  const metaUpdate: Record<string, unknown> = {};
  if (updates.label !== undefined) metaUpdate.label = updates.label;
  if (updates.url !== undefined) metaUpdate.url = updates.url;
  if (updates.notes !== undefined) metaUpdate.notes = updates.notes;
  if (updates.category !== undefined) metaUpdate.category = updates.category;
  if (updates.businessId !== undefined) metaUpdate.business_id = updates.businessId;
  if (updates.secret !== undefined) metaUpdate.secret_encrypted = encryptSecret(updates.secret);
  if (updates.agentAccessible !== undefined) metaUpdate.agent_accessible = updates.agentAccessible;

  const { data, error: updateError } = await supabase
    .from('founder_vault_items')
    .update(metaUpdate)
    .eq('id', itemId)
    .eq('owner_id', ownerId)
    .select('id, owner_id, business_id, category, label, url, notes, agent_accessible, tags, last_accessed_at, created_at, updated_at')
    .single();

  if (updateError || !data) {
    throw new Error(`Failed to update vault item: ${updateError?.message ?? 'unknown'}`);
  }

  await writeAuditLog(itemId, ownerId, 'update');
  return data as VaultItemMetadata;
}

/**
 * Delete a vault item and its encrypted secret.
 */
export async function deleteVaultItem(itemId: string, ownerId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { data: item, error: fetchError } = await supabase
    .from('founder_vault_items')
    .select('id, owner_id')
    .eq('id', itemId)
    .eq('owner_id', ownerId)
    .single();

  if (fetchError || !item) {
    throw new Error('Vault item not found or access denied');
  }

  const { error: deleteError } = await supabase
    .from('founder_vault_items')
    .delete()
    .eq('id', itemId)
    .eq('owner_id', ownerId);

  if (deleteError) {
    throw new Error(`Failed to delete vault item: ${deleteError.message}`);
  }

  await writeAuditLog(itemId, ownerId, 'delete');
}
