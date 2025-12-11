/**
 * Guardian X05: Network Lifecycle Audit Logger
 *
 * Records all X-series lifecycle operations (deletes, policy updates, cleanup runs)
 * in an immutable, auditable way.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Lifecycle audit event input
 */
export interface GuardianLifecycleAuditInput {
  scope:
    | 'telemetry'
    | 'aggregates'
    | 'anomalies'
    | 'benchmarks'
    | 'early_warnings'
    | 'governance'
    | 'patterns'
    | 'policy';
  action: 'delete' | 'soft_delete' | 'policy_update' | 'dry_run';
  tenantId?: string;
  itemsAffected: number;
  windowStart?: Date;
  windowEnd?: Date;
  detail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a lifecycle audit event
 */
export async function logLifecycleAudit(input: GuardianLifecycleAuditInput): Promise<void> {
  const {
    scope,
    action,
    tenantId,
    itemsAffected,
    windowStart,
    windowEnd,
    detail,
    metadata,
  } = input;

  // Sanitize metadata
  const sanitizedMetadata = sanitizeMetadata(metadata);

  const supabase = getSupabaseServer();

  try {
    const { error } = await supabase
      .from('guardian_network_lifecycle_audit')
      .insert({
        scope,
        action,
        tenant_id: tenantId || null,
        items_affected: itemsAffected,
        window_start: windowStart?.toISOString() || null,
        window_end: windowEnd?.toISOString() || null,
        detail: detail ? truncate(detail, 500) : null,
        metadata: sanitizedMetadata,
      });

    if (error) {
      console.error('Failed to log lifecycle audit event:', error);
    }
  } catch (error) {
    console.error('Unexpected error logging lifecycle audit:', error);
  }
}

/**
 * Retrieve recent lifecycle audit events for a tenant or global
 */
export async function getLifecycleAuditEvents(
  tenantId: string | null,
  options?: {
    limit?: number;
    offset?: number;
    scope?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Array<{
  id: string;
  occurredAt: string;
  scope: string;
  action: string;
  tenantId?: string;
  itemsAffected: number;
  windowStart?: string;
  windowEnd?: string;
  detail?: string;
}>> {
  const { limit = 50, offset = 0, scope, action, startDate, endDate } = options || {};

  const supabase = getSupabaseServer();

  try {
    let query = supabase
      .from('guardian_network_lifecycle_audit')
      .select('*')
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by tenant or global
    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    } else {
      query = query.is('tenant_id', null);
    }

    if (scope) {
      query = query.eq('scope', scope);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('occurred_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('occurred_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      occurredAt: row.occurred_at,
      scope: row.scope,
      action: row.action,
      tenantId: row.tenant_id || undefined,
      itemsAffected: row.items_affected,
      windowStart: row.window_start || undefined,
      windowEnd: row.window_end || undefined,
      detail: row.detail || undefined,
    }));
  } catch (error) {
    console.error('Failed to retrieve lifecycle audit events:', error);
    return [];
  }
}

/**
 * Sanitize metadata to ensure no PII or raw payloads are stored
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const MAX_FIELD_SIZE = 500;

  for (const [key, value] of Object.entries(metadata)) {
    // Skip PII-like fields
    if (
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('credential') ||
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('payload') ||
      key.toLowerCase().includes('raw') ||
      key.toLowerCase().includes('hash') ||
      key.toLowerCase().includes('fingerprint')
    ) {
      continue;
    }

    // Truncate string fields
    if (typeof value === 'string') {
      sanitized[key] = truncate(value, MAX_FIELD_SIZE);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10); // Limit array size
      } else {
        sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
      }
    }
  }

  return sanitized;
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}
