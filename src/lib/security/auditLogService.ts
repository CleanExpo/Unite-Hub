import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export type AuditActorType = 'user' | 'system' | 'agent';

export interface AuditEventInput {
  tenantId: string;
  actorId?: string | null;
  actorType?: AuditActorType;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  createdAt: string;
}

export const auditLogService = {
  async recordEvent(supabase: any, event: AuditEventInput): Promise<void> {
    const { error }: PostgrestSingleResponse<unknown> = await supabase
      .from('security_audit_log')
      .insert({
        tenant_id: event.tenantId,
        actor_id: event.actorId ?? null,
        actor_type: event.actorType ?? 'user',
        action: event.action,
        entity_type: event.entityType ?? null,
        entity_id: event.entityId ?? null,
        ip_address: event.ipAddress ?? null,
        user_agent: event.userAgent ?? null,
        metadata: event.metadata ?? {}
      }) as PostgrestSingleResponse<unknown>;

    if (error) {
      // Do not throw hard in production paths – log and continue
      console.error('[auditLogService.recordEvent] Failed to insert audit event', error);
    }
  },

  async listEvents(supabase: any, tenantId: string, limit = 100): Promise<AuditEvent[]> {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[auditLogService.listEvents] Failed to fetch audit events', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      actorId: row.actor_id,
      actorType: row.actor_type,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ?? {},
      createdAt: row.created_at
    }));
  }
};
