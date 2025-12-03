/**
 * Supabase Admin Client - SERVER ONLY
 *
 * This module provides the service role client that bypasses RLS.
 * It is restricted to server-side code only to prevent the service
 * role key from being exposed in client bundles.
 *
 * SECURITY: This file uses 'server-only' to prevent accidental
 * import in client components, which would expose the service role key.
 *
 * @module supabase/admin
 */

import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

// Lazy initialization to ensure environment variables are available
let _supabaseAdmin: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase admin client with service role key
 *
 * SECURITY WARNING: This client bypasses ALL Row Level Security policies.
 * Only use this when:
 * 1. User is already authenticated (verified via JWT)
 * 2. Operation requires cross-tenant access (admin functions)
 * 3. Webhook handlers (after signature verification)
 * 4. Cron jobs (after CRON_SECRET validation)
 *
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 * @returns Supabase client with service role (bypasses RLS)
 *
 * @example
 * // In API route (after auth check):
 * import { getSupabaseAdmin } from '@/lib/supabase/admin';
 *
 * export async function POST(req: NextRequest) {
 *   // Verify user first
 *   const user = await validateUserAuth(req);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *
 *   // Now safe to use admin client
 *   const supabase = getSupabaseAdmin();
 *   const { data } = await supabase.from('organizations').select('*');
 * }
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY not configured. ' +
        'This should only be used in server-side code.'
      );
    }

    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured.');
    }

    _supabaseAdmin = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}

/**
 * Proxy for direct method access on admin client
 *
 * @example
 * import { supabaseAdmin } from '@/lib/supabase/admin';
 *
 * // Direct access pattern
 * const { data } = await supabaseAdmin.from('organizations').select('*');
 * const { data: rpcResult } = await supabaseAdmin.rpc('my_function');
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient<Database>];
  },
});

/**
 * Type export for consumers that need the admin client type
 */
export type SupabaseAdminClient = SupabaseClient<Database>;
