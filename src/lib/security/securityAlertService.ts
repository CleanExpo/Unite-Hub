export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlertInput {
  tenantId: string;
  type: string;
  severity: SecuritySeverity;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlert extends SecurityAlertInput {
  id: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export const securityAlertService = {
  async raiseAlert(supabase: any, input: SecurityAlertInput): Promise<SecurityAlert | null> {
    const { data, error } = await supabase
      .from('security_alerts')
      .insert({
        tenant_id: input.tenantId,
        type: input.type,
        severity: input.severity,
        message: input.message,
        source: input.source ?? null,
        metadata: input.metadata ?? {}
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[securityAlertService.raiseAlert] error', error);
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      type: data.type,
      severity: data.severity,
      message: data.message,
      source: data.source,
      metadata: data.metadata ?? {},
      createdAt: data.created_at,
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by
    };
  },

  async listAlerts(supabase: any, tenantId: string, limit = 50): Promise<SecurityAlert[]> {
    const { data, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[securityAlertService.listAlerts] error', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      severity: row.severity,
      message: row.message,
      source: row.source,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by
    }));
  },

  async resolveAlert(supabase: any, tenantId: string, id: string, resolvedBy?: string): Promise<boolean> {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy ?? null
      })
      .eq('tenant_id', tenantId)
      .eq('id', id);

    if (error) {
      console.error('[securityAlertService.resolveAlert] error', error);
      return false;
    }
    return true;
  }
};
