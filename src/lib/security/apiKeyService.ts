import crypto from 'crypto';

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRawKey(): string {
  return 'uh_' + crypto.randomBytes(24).toString('hex');
}

export const apiKeyService = {
  async createApiKey(supabase: any, tenantId: string, name: string, scopes: string[]): Promise<{ rawKey: string; recordId: string | null; }> {
    const rawKey = generateRawKey();
    const hashed = hashApiKey(rawKey);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        tenant_id: tenantId,
        name,
        hashed_key: hashed,
        scopes
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[apiKeyService.createApiKey] Failed to create API key', error);
      return { rawKey, recordId: null };
    }

    return { rawKey, recordId: data?.id ?? null };
  },

  async revokeApiKey(supabase: any, tenantId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', id);

    if (error) {
      console.error('[apiKeyService.revokeApiKey] Failed to revoke API key', error);
      return false;
    }
    return true;
  },

  async verifyApiKey(supabase: any, rawKey: string): Promise<ApiKeyRecord | null> {
    const hashed = hashApiKey(rawKey);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('hashed_key', hashed)
      .is('revoked_at', null)
      .maybeSingle();

    if (error) {
      console.error('[apiKeyService.verifyApiKey] Failed to verify key', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      scopes: data.scopes ?? [],
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      revokedAt: data.revoked_at
    };
  }
};
