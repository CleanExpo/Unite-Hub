/**
 * Database Helper Functions - Evaluator-Optimizer Pattern
 *
 * Provides graceful error handling for all Supabase queries
 * following "Building Effective Agents" principles:
 * - Ground truth verification
 * - Fail gracefully (not silently)
 * - Clear error messages
 * - Idempotent operations
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Standard response type for database operations
 */
export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Safe query wrapper - returns null instead of throwing on not found
 *
 * @example
 * const profile = await safeQuerySingle(supabase, 'user_profiles', userId);
 * if (!profile) {
 *   return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
 * }
 */
export async function safeQuerySingle<T = any>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle(); // ← Returns null if not found, doesn't throw

    if (error) {
      console.error(`[db-helpers] Query error on ${table}:`, error);
      return null;
    }

    return data;
  } catch (err) {
    console.error(`[db-helpers] Unexpected error querying ${table}:`, err);
    return null;
  }
}

/**
 * Safe query wrapper with workspace filter
 *
 * @example
 * const contacts = await safeQueryWorkspace(supabase, 'contacts', workspaceId);
 */
export async function safeQueryWorkspace<T = any>(
  supabase: SupabaseClient,
  table: string,
  workspaceId: string,
  additionalFilters?: Record<string, any>
): Promise<T[]> {
  try {
    let query = supabase
      .from(table)
      .select('*')
      .eq('workspace_id', workspaceId);

    // Apply additional filters
    if (additionalFilters) {
      for (const [key, value] of Object.entries(additionalFilters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[db-helpers] Query error on ${table}:`, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`[db-helpers] Unexpected error querying ${table}:`, err);
    return [];
  }
}

/**
 * Safe insert with ground truth verification
 *
 * @example
 * const result = await safeInsert(supabase, 'contacts', {
 *   workspace_id: workspaceId,
 *   email: 'test@example.com',
 *   full_name: 'Test User'
 * });
 *
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 500 });
 * }
 */
export async function safeInsert<T = any>(
  supabase: SupabaseClient,
  table: string,
  data: Record<string, any>
): Promise<DbResult<T>> {
  try {
    const { data: inserted, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`[db-helpers] Insert error on ${table}:`, error);
      return {
        success: false,
        error: `Failed to insert into ${table}`,
        details: error
      };
    }

    if (!inserted) {
      console.error(`[db-helpers] Insert succeeded but no data returned from ${table}`);
      return {
        success: false,
        error: `Insert succeeded but verification failed`
      };
    }

    // Ground truth verification: Query to confirm it exists
    const verification = await supabase
      .from(table)
      .select('id')
      .eq('id', inserted.id)
      .maybeSingle();

    if (verification.error || !verification.data) {
      console.error(`[db-helpers] Ground truth verification failed for ${table}:`, verification.error);
      return {
        success: false,
        error: `Insert completed but verification failed`,
        details: verification.error
      };
    }

    console.log(`[db-helpers] ✅ Insert into ${table} verified:`, inserted.id);

    return {
      success: true,
      data: inserted
    };
  } catch (err) {
    console.error(`[db-helpers] Unexpected error inserting into ${table}:`, err);
    return {
      success: false,
      error: 'Internal server error during insert',
      details: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Safe update with ground truth verification
 *
 * @example
 * const result = await safeUpdate(supabase, 'contacts', contactId, {
 *   ai_score: 85,
 *   status: 'hot'
 * });
 */
export async function safeUpdate<T = any>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  updates: Record<string, any>
): Promise<DbResult<T>> {
  try {
    const { data: updated, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[db-helpers] Update error on ${table}:`, error);
      return {
        success: false,
        error: `Failed to update ${table}`,
        details: error
      };
    }

    if (!updated) {
      console.error(`[db-helpers] Update succeeded but no data returned from ${table}`);
      return {
        success: false,
        error: `Update succeeded but verification failed`
      };
    }

    console.log(`[db-helpers] ✅ Update on ${table} verified:`, id);

    return {
      success: true,
      data: updated
    };
  } catch (err) {
    console.error(`[db-helpers] Unexpected error updating ${table}:`, err);
    return {
      success: false,
      error: 'Internal server error during update',
      details: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Safe delete with ground truth verification
 *
 * @example
 * const result = await safeDelete(supabase, 'contacts', contactId);
 */
export async function safeDelete(
  supabase: SupabaseClient,
  table: string,
  id: string
): Promise<DbResult<void>> {
  try {
    // First verify it exists
    const existing = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existing.error) {
      return {
        success: false,
        error: `Failed to verify existence before delete`,
        details: existing.error
      };
    }

    if (!existing.data) {
      return {
        success: false,
        error: `Record not found in ${table}`,
        details: { id }
      };
    }

    // Perform delete
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[db-helpers] Delete error on ${table}:`, error);
      return {
        success: false,
        error: `Failed to delete from ${table}`,
        details: error
      };
    }

    // Ground truth verification: Confirm it's gone
    const verification = await supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (verification.data) {
      console.error(`[db-helpers] Delete succeeded but record still exists in ${table}`);
      return {
        success: false,
        error: `Delete succeeded but verification failed`
      };
    }

    console.log(`[db-helpers] ✅ Delete from ${table} verified:`, id);

    return {
      success: true
    };
  } catch (err) {
    console.error(`[db-helpers] Unexpected error deleting from ${table}:`, err);
    return {
      success: false,
      error: 'Internal server error during delete',
      details: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Validate workspace access for authenticated user
 *
 * @example
 * const hasAccess = await validateWorkspaceAccess(supabase, workspaceId, userId);
 * if (!hasAccess) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export async function validateWorkspaceAccess(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        id,
        org_id,
        user_organizations!inner(user_id)
      `)
      .eq('id', workspaceId)
      .eq('user_organizations.user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[db-helpers] Workspace access validation error:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('[db-helpers] Unexpected error validating workspace access:', err);
    return false;
  }
}

/**
 * Get user's organization ID
 *
 * @example
 * const orgId = await getUserOrgId(supabase, userId);
 * if (!orgId) {
 *   return NextResponse.json({ error: 'No organization found' }, { status: 404 });
 * }
 */
export async function getUserOrgId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[db-helpers] Get user org ID error:', error);
      return null;
    }

    return data?.org_id || null;
  } catch (err) {
    console.error('[db-helpers] Unexpected error getting user org ID:', err);
    return null;
  }
}

/**
 * Check if a table exists (ground truth check)
 *
 * @example
 * const exists = await tableExists(supabase, 'subscriptions');
 * if (!exists) {
 *   console.warn('Subscriptions table does not exist - feature disabled');
 *   return NextResponse.json({ feature_available: false });
 * }
 */
export async function tableExists(
  supabase: SupabaseClient,
  tableName: string
): Promise<boolean> {
  try {
    // Try to query with LIMIT 0 (no data returned, just schema check)
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    // If error contains "does not exist", table is missing
    if (error && error.message.includes('does not exist')) {
      return false;
    }

    // If error but not "does not exist", table exists but RLS might block
    if (error) {
      console.warn(`[db-helpers] Table ${tableName} exists but query failed:`, error.message);
      return true; // Table exists, just can't query it
    }

    return true;
  } catch (err) {
    console.error(`[db-helpers] Unexpected error checking table ${tableName}:`, err);
    return false;
  }
}
