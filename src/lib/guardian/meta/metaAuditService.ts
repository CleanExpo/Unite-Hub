/**
 * Guardian Z10: Meta Audit Service
 * Append-only audit logging for Z01-Z09 configuration changes
 * PII-free, immutable, tenant-isolated
 */

import { getSupabaseServer } from '@/lib/supabase';

// ===== TYPE DEFINITIONS =====

export type GuardianMetaAuditSource =
  | 'readiness'
  | 'uplift'
  | 'editions'
  | 'executive'
  | 'adoption'
  | 'lifecycle'
  | 'integrations'
  | 'goals_okrs'
  | 'playbooks'
  | 'meta_governance';

export type GuardianMetaAuditAction = 'create' | 'update' | 'delete' | 'archive' | 'policy_change';

export interface GuardianMetaAuditEvent {
  tenantId: string;
  actor: string;
  source: GuardianMetaAuditSource;
  action: GuardianMetaAuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GuardianMetaAuditLogFilters {
  source?: GuardianMetaAuditSource;
  entityType?: string;
  actor?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GuardianMetaAuditLogEntry extends GuardianMetaAuditEvent {
  id: string;
  createdAt: Date;
}

// ===== AUDIT LOGGING =====

/**
 * Log an audit event to the append-only audit log
 * Validates payload size (max 10KB for details)
 * Service role inserts, tenant reads via RLS
 */
export async function logMetaAuditEvent(event: GuardianMetaAuditEvent): Promise<void> {
  const supabase = getSupabaseServer();

  // Validate details size (prevent huge payloads)
  const detailsStr = JSON.stringify(event.details || {});
  if (detailsStr.length > 10000) {
    throw new Error('Audit event details too large (max 10KB). Truncate or summarize.');
  }

  // Validate metadata size
  const metadataStr = JSON.stringify(event.metadata || {});
  if (metadataStr.length > 10000) {
    throw new Error('Audit event metadata too large (max 10KB). Truncate or summarize.');
  }

  // Build insert payload with snake_case keys
  const { error } = await supabase.from('guardian_meta_audit_log').insert({
    tenant_id: event.tenantId,
    actor: event.actor,
    source: event.source,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId || null,
    summary: event.summary,
    details: event.details || {},
    metadata: event.metadata || {},
  });

  if (error) {
    console.error('Failed to log meta audit event:', error);
    throw error;
  }
}

// ===== AUDIT LOG QUERIES =====

/**
 * List audit log entries with optional filtering
 * Filtered by tenant (via RLS), sortable by creation time
 */
export async function listMetaAuditLog(
  tenantId: string,
  filters?: GuardianMetaAuditLogFilters
): Promise<GuardianMetaAuditLogEntry[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_audit_log')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Apply optional filters
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }
  if (filters?.actor) {
    query = query.eq('actor', filters.actor);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  // Apply pagination
  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    actor: row.actor,
    source: row.source,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    details: row.details || {},
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Get audit log entries by source (e.g., all 'readiness' changes)
 */
export async function getMetaAuditBySource(
  tenantId: string,
  source: GuardianMetaAuditSource,
  limit: number = 50
): Promise<GuardianMetaAuditLogEntry[]> {
  return listMetaAuditLog(tenantId, { source, limit });
}

/**
 * Get audit log entries by entity type (e.g., all 'uplift_plan' changes)
 */
export async function getMetaAuditByEntity(
  tenantId: string,
  entityType: string,
  limit: number = 50
): Promise<GuardianMetaAuditLogEntry[]> {
  return listMetaAuditLog(tenantId, { entityType, limit });
}

/**
 * Get audit log entries by actor (e.g., all changes by user@example.com)
 */
export async function getMetaAuditByActor(
  tenantId: string,
  actor: string,
  limit: number = 50
): Promise<GuardianMetaAuditLogEntry[]> {
  return listMetaAuditLog(tenantId, { actor, limit });
}

/**
 * Get audit log entries in date range
 */
export async function getMetaAuditByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<GuardianMetaAuditLogEntry[]> {
  return listMetaAuditLog(tenantId, { startDate, endDate, limit });
}

/**
 * Count audit log entries (useful for analytics)
 */
export async function countMetaAuditLog(
  tenantId: string,
  filters?: Omit<GuardianMetaAuditLogFilters, 'limit' | 'offset'>
): Promise<number> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }
  if (filters?.actor) {
    query = query.eq('actor', filters.actor);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}
