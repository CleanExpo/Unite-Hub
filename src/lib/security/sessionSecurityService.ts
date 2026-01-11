export interface SessionRecord {
  id: string;
  tenantId: string;
  userId: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt?: string | null;
}

export interface TrustedDeviceRecord {
  id: string;
  tenantId: string;
  userId: string;
  deviceKey: string;
  label?: string | null;
  createdAt: string;
  revokedAt?: string | null;
}

export const sessionSecurityService = {
  async createSession(supabase: any, params: {
    tenantId: string;
    userId: string;
    deviceId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<SessionRecord | null> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        device_id: params.deviceId ?? null,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[sessionSecurityService.createSession] error', error);
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      userId: data.user_id,
      deviceId: data.device_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
      lastSeenAt: data.last_seen_at,
      revokedAt: data.revoked_at
    };
  },

  async revokeSession(supabase: any, tenantId: string, sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', sessionId);

    if (error) {
      console.error('[sessionSecurityService.revokeSession] error', error);
      return false;
    }
    return true;
  },

  async listActiveSessions(supabase: any, tenantId: string, userId: string): Promise<SessionRecord[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[sessionSecurityService.listActiveSessions] error', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      deviceId: row.device_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      revokedAt: row.revoked_at
    }));
  },

  async addTrustedDevice(supabase: any, params: {
    tenantId: string;
    userId: string;
    deviceKey: string;
    label?: string;
  }): Promise<TrustedDeviceRecord | null> {
    const { data, error } = await supabase
      .from('trusted_devices')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        device_key: params.deviceKey,
        label: params.label ?? null
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[sessionSecurityService.addTrustedDevice] error', error);
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      userId: data.user_id,
      deviceKey: data.device_key,
      label: data.label,
      createdAt: data.created_at,
      revokedAt: data.revoked_at
    };
  }
};
