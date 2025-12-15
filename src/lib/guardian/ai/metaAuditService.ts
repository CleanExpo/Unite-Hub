import { logMetaAuditEvent as logMetaAuditEventCore } from "../meta/metaAuditService";

export async function logMetaAuditEvent(event: {
  tenantId: string;
  actor: string;
  source: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  return logMetaAuditEventCore(event as any);
}

