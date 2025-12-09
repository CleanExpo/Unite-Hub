export type ConfigScope = 'global' | 'synthex' | 'unitehub' | string;

export interface ConfigSetting {
  id: string;
  tenantId: string;
  key: string;
  value: string;
  isSecret: boolean;
  scope: ConfigScope;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertConfigInput {
  tenantId: string;
  key: string;
  value: string;
  isSecret?: boolean;
  scope?: ConfigScope;
  description?: string;
}

export const configService = {
  async getSetting(supabase: any, tenantId: string, key: string, scope: ConfigScope = 'global'): Promise<ConfigSetting | null> {
    const { data, error } = await supabase
      .from('security_config_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('key', key)
      .eq('scope', scope)
      .maybeSingle();

    if (error) {
      console.error('[configService.getSetting] error', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      key: data.key,
      value: data.value,
      isSecret: data.is_secret,
      scope: data.scope,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async listSettings(supabase: any, tenantId: string, scope?: ConfigScope): Promise<ConfigSetting[]> {
    let query = supabase
      .from('security_config_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('key', { ascending: true });

    if (scope) {
      query = query.eq('scope', scope);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[configService.listSettings] error', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      key: row.key,
      value: row.value,
      isSecret: row.is_secret,
      scope: row.scope,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  async upsertSetting(supabase: any, input: UpsertConfigInput): Promise<ConfigSetting | null> {
    const { tenantId, key, value } = input;
    const scope: ConfigScope = input.scope ?? 'global';

    const { data, error } = await supabase
      .from('security_config_settings')
      .upsert({
        tenant_id: tenantId,
        key,
        value,
        is_secret: input.isSecret ?? false,
        scope,
        description: input.description
      }, {
        onConflict: 'tenant_id,key,scope'
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[configService.upsertSetting] error', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      key: data.key,
      value: data.value,
      isSecret: data.is_secret,
      scope: data.scope,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
};
