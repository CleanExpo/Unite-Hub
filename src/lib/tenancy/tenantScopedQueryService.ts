/**
 * Tenant Scoped Query Service
 * Phase 90: Execute tenant-scoped database queries
 */

import { getSupabaseServer } from '@/lib/supabase';
import { TenantQueryOptions } from './tenantTypes';

/**
 * Query with tenant scope
 */
export async function query<T = any>(
  table: string,
  tenantId: string,
  options: Omit<TenantQueryOptions, 'tenantId'> = {}
): Promise<T[]> {
  const supabase = await getSupabaseServer();

  let queryBuilder = supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId);

  // Apply filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
  }

  // Apply ordering
  if (options.orderBy) {
    queryBuilder = queryBuilder.order(options.orderBy, {
      ascending: options.ascending ?? false,
    });
  }

  // Apply pagination
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  if (options.offset) {
    queryBuilder = queryBuilder.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Tenant query failed: ${error.message}`);
  }

  return data as T[];
}

/**
 * Insert with tenant scope
 */
export async function insert<T = any>(
  table: string,
  tenantId: string,
  payload: Partial<T>
): Promise<T> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from(table)
    .insert({
      ...payload,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Tenant insert failed: ${error.message}`);
  }

  return data as T;
}

/**
 * Update with tenant scope
 */
export async function update<T = any>(
  table: string,
  tenantId: string,
  id: string,
  payload: Partial<T>
): Promise<T> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Tenant update failed: ${error.message}`);
  }

  return data as T;
}

/**
 * Delete with tenant scope
 */
export async function remove(
  table: string,
  tenantId: string,
  id: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Tenant delete failed: ${error.message}`);
  }

  return true;
}

/**
 * Count with tenant scope
 */
export async function count(
  table: string,
  tenantId: string,
  filters?: Record<string, any>
): Promise<number> {
  const supabase = await getSupabaseServer();

  let queryBuilder = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
  }

  const { count: total, error } = await queryBuilder;

  if (error) {
    throw new Error(`Tenant count failed: ${error.message}`);
  }

  return total || 0;
}

/**
 * Check if record exists in tenant
 */
export async function exists(
  table: string,
  tenantId: string,
  id: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  return !!data;
}
