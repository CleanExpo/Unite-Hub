/**
 * Workspace Scoping for Database Operations
 *
 * ADR-002: Automatic Workspace Scoping
 * Fixes 399 routes missing workspace filter.
 *
 * This module provides:
 * - Automatic workspace_id injection on all queries
 * - Type-safe scoped query builders
 * - Prevention of cross-workspace data access
 *
 * @module core/database/workspace-scope
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  WorkspaceScopedRecord,
  isWorkspaceScopedTable,
  DB_ERROR_CODES,
} from './types';

/**
 * Scope a SELECT query to a workspace
 *
 * @param query - Supabase query builder
 * @param workspaceId - Workspace ID to filter by
 * @returns Query with workspace filter applied
 */
export function scopeSelect<T>(
  query: any,
  workspaceId: string
): any {
  return query.eq('workspace_id', workspaceId);
}

/**
 * Inject workspace_id into INSERT data
 *
 * @param data - Record or array of records to insert
 * @param workspaceId - Workspace ID to inject
 * @returns Data with workspace_id added
 */
export function injectWorkspaceId<T extends Record<string, unknown>>(
  data: T | T[],
  workspaceId: string
): (T & { workspace_id: string }) | (T & { workspace_id: string })[] {
  if (Array.isArray(data)) {
    return data.map(record => ({
      ...record,
      workspace_id: workspaceId,
    }));
  }

  return {
    ...data,
    workspace_id: workspaceId,
  };
}

/**
 * Create a workspace-scoped database interface
 *
 * This is the primary API for workspace-scoped database operations.
 * All queries automatically include workspace filtering.
 *
 * @example
 * const db = createWorkspaceScopedClient(supabase, workspaceId);
 *
 * // SELECT - automatically filtered
 * const { data } = await db.from('contacts').select('*');
 *
 * // INSERT - workspace_id automatically added
 * const { data } = await db.from('contacts').insert({ name: 'John' });
 *
 * // UPDATE - automatically scoped
 * const { data } = await db.from('contacts').update({ name: 'Jane' }).eq('id', '123');
 *
 * // DELETE - automatically scoped
 * const { data } = await db.from('contacts').delete().eq('id', '123');
 */
export function createWorkspaceScopedClient(
  supabase: SupabaseClient,
  workspaceId: string
) {
  if (!workspaceId) {
    throw new Error(`[${DB_ERROR_CODES.WORKSPACE_REQUIRED}] Workspace ID is required`);
  }

  return {
    /**
     * Access a table with automatic workspace scoping
     */
    from: <T extends WorkspaceScopedRecord>(table: string) => {
      const requiresScoping = isWorkspaceScopedTable(table);

      return {
        /**
         * SELECT with automatic workspace filter
         */
        select: (columns: string = '*') => {
          const query = supabase.from(table).select(columns);
          return requiresScoping ? query.eq('workspace_id', workspaceId) : query;
        },

        /**
         * INSERT with automatic workspace_id injection
         */
        insert: (data: Partial<T> | Partial<T>[]) => {
          const scopedData = requiresScoping
            ? injectWorkspaceId(data as Record<string, unknown> | Record<string, unknown>[], workspaceId)
            : data;
          return supabase.from(table).insert(scopedData as any);
        },

        /**
         * UPDATE with automatic workspace filter
         */
        update: (data: Partial<T>) => {
          const query = supabase.from(table).update(data as any);
          return requiresScoping ? query.eq('workspace_id', workspaceId) : query;
        },

        /**
         * DELETE with automatic workspace filter
         */
        delete: () => {
          const query = supabase.from(table).delete();
          return requiresScoping ? query.eq('workspace_id', workspaceId) : query;
        },

        /**
         * UPSERT with automatic workspace_id injection
         */
        upsert: (data: Partial<T> | Partial<T>[], options?: { onConflict?: string }) => {
          const scopedData = requiresScoping
            ? injectWorkspaceId(data as Record<string, unknown> | Record<string, unknown>[], workspaceId)
            : data;
          return supabase.from(table).upsert(scopedData as any, options);
        },

        /**
         * Count with automatic workspace filter
         */
        count: (options?: { count?: 'exact' | 'planned' | 'estimated' }) => {
          const query = supabase.from(table).select('*', {
            count: options?.count || 'exact',
            head: true,
          });
          return requiresScoping ? query.eq('workspace_id', workspaceId) : query;
        },
      };
    },

    /**
     * Get the raw Supabase client (use sparingly)
     */
    raw: supabase,

    /**
     * Get the workspace ID this client is scoped to
     */
    workspaceId,
  };
}

/**
 * Type for the workspace-scoped client
 */
export type WorkspaceScopedClient = ReturnType<typeof createWorkspaceScopedClient>;

/**
 * Verify a record belongs to the workspace
 *
 * @param supabase - Supabase client
 * @param table - Table name
 * @param recordId - Record ID to verify
 * @param workspaceId - Expected workspace ID
 * @returns true if record belongs to workspace
 */
export async function verifyRecordOwnership(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('workspace_id')
    .eq('id', recordId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.workspace_id === workspaceId;
}

/**
 * Batch verify multiple records belong to workspace
 *
 * @param supabase - Supabase client
 * @param table - Table name
 * @param recordIds - Array of record IDs
 * @param workspaceId - Expected workspace ID
 * @returns Object with valid and invalid record IDs
 */
export async function batchVerifyOwnership(
  supabase: SupabaseClient,
  table: string,
  recordIds: string[],
  workspaceId: string
): Promise<{ valid: string[]; invalid: string[] }> {
  const { data, error } = await supabase
    .from(table)
    .select('id, workspace_id')
    .in('id', recordIds);

  if (error) {
    return { valid: [], invalid: recordIds };
  }

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of recordIds) {
    const record = data?.find(r => r.id === id);
    if (record?.workspace_id === workspaceId) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}
