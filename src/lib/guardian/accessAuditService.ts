/**
 * Guardian Phase G34: Access Audit Viewer Service
 *
 * Read-only service for querying guardian_access_audit table.
 * Supports basic filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';

export interface GuardianAccessAuditRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  endpoint: string;
  method: string;
  status_code: number;
  success: boolean;
  source_ip: string | null;
  user_agent: string | null;
  meta: unknown;
  created_at: string;
}

export interface GuardianAccessAuditQuery {
  limit?: number;
  statusCode?: number;
  endpoint?: string;
  success?: boolean;
}

/**
 * List Guardian access audit records for a tenant.
 *
 * Supports filtering by:
 * - statusCode: HTTP status code (200, 401, 403, 500)
 * - endpoint: Endpoint substring match (case-insensitive)
 * - success: Success flag (true/false)
 * - limit: Max records to return (default 200, max 500)
 *
 * @param tenantId Tenant ID to query
 * @param query Query filters
 * @returns Array of audit records, newest first
 */
export async function listGuardianAccessAudit(
  tenantId: string,
  query: GuardianAccessAuditQuery = {}
): Promise<GuardianAccessAuditRecord[]> {
  const supabase = await createClient();

  let q = supabase
    .from('guardian_access_audit')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (typeof query.statusCode === 'number') {
    q = q.eq('status_code', query.statusCode);
  }

  if (typeof query.success === 'boolean') {
    q = q.eq('success', query.success);
  }

  if (query.endpoint) {
    q = q.ilike('endpoint', `%${query.endpoint}%`);
  }

  const limit = query.limit
    ? Math.min(Math.max(query.limit, 10), 500)
    : 200;

  const { data, error } = await q.limit(limit);

  if (error) {
    console.error('[Guardian G34] Failed to list access audit:', error);
    throw error;
  }

  return data as GuardianAccessAuditRecord[];
}

/**
 * Get Guardian access audit summary statistics for a tenant.
 *
 * @param tenantId Tenant ID to query
 * @returns Summary statistics
 */
export async function getGuardianAccessAuditSummary(
  tenantId: string
): Promise<{
  total: number;
  successCount: number;
  failureCount: number;
  recentEndpoints: string[];
}> {
  const supabase = await createClient();

  // Get total count
  const { count: total, error: countError } = await supabase
    .from('guardian_access_audit')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (countError) {
    console.error('[Guardian G34] Failed to get total count:', countError);
    throw countError;
  }

  // Get success count
  const { count: successCount, error: successError } = await supabase
    .from('guardian_access_audit')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('success', true);

  if (successError) {
    console.error('[Guardian G34] Failed to get success count:', successError);
    throw successError;
  }

  // Get recent distinct endpoints
  const { data: recentData, error: recentError } = await supabase
    .from('guardian_access_audit')
    .select('endpoint')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (recentError) {
    console.error('[Guardian G34] Failed to get recent endpoints:', recentError);
    throw recentError;
  }

  const recentEndpoints = [
    ...new Set(recentData?.map((r) => r.endpoint) ?? []),
  ].slice(0, 10);

  return {
    total: total ?? 0,
    successCount: successCount ?? 0,
    failureCount: (total ?? 0) - (successCount ?? 0),
    recentEndpoints,
  };
}
