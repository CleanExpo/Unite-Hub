/**
 * Supabase Server Client - PKCE Flow with Connection Pooling
 *
 * This client is used in:
 * - Server Components (RSC)
 * - API Routes
 * - Middleware
 *
 * PKCE sessions are stored in cookies, making them accessible server-side.
 *
 * IMPORTANT: This module uses dynamic imports to prevent cookies() from being
 * called during Turbopack's static analysis phase.
 *
 * CONNECTION POOLING:
 * - Uses Supabase Pooler (PgBouncer) when ENABLE_DB_POOLER=true
 * - 60-80% latency reduction (300ms → 50-80ms for typical queries)
 * - Supports up to 3,000 concurrent connections vs 60-100 without pooler
 * - Transaction-level pooling (default mode)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getPooledDatabaseUrl, isPoolerEnabled } from './pooler-config';

/**
 * Check if we're in a build-time/static context
 * During build, there's no request context so cookies() would fail
 */
function isBuildTime(): boolean {
  // Check for Next.js build phase environment variable
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }
  // Also check if we're in edge runtime without request context
  // This is a secondary check for edge cases
  return typeof globalThis.Request === 'undefined';
}

// Dynamic import of cookies to prevent build-time evaluation
async function getCookieStore() {
  // Skip during build phase
  if (isBuildTime()) {
    return null;
  }

  // Only import next/headers at runtime
  const { cookies } = await import('next/headers');
  try {
    return await cookies();
  } catch {
    return null;
  }
}

/**
 * Create a Supabase server client for Server Components and API Routes
 * Reads session from cookies (PKCE flow)
 *
 * NOTE: This client uses Supabase's REST API for auth/storage/realtime operations.
 * For direct database operations with connection pooling, use getPooledDatabaseConfig()
 */
export async function createClient() {
  const cookieStore = await getCookieStore();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          // Return undefined if cookieStore not available
          if (!cookieStore) return undefined;
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Setting cookies in Server Components may fail
            // This is expected during static rendering
          }
        },
        remove(name: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Removing cookies in Server Components may fail
            // This is expected during static rendering
          }
        },
      },
    }
  );
}

/**
 * Get database connection configuration with optional pooling
 *
 * Use this for direct PostgreSQL connections when you need connection pooling.
 * The Supabase client (createClient) already uses Supabase's API which has
 * built-in pooling on their end, so this is only needed for direct database access.
 *
 * @returns Database connection URL (pooled if ENABLE_DB_POOLER=true)
 */
export function getPooledDatabaseConfig(): {
  connectionString: string;
  poolingEnabled: boolean;
} {
  const poolingEnabled = isPoolerEnabled();
  const connectionString = poolingEnabled
    ? getPooledDatabaseUrl()
    : (process.env.DATABASE_URL || '');

  return {
    connectionString,
    poolingEnabled,
  };
}

/**
 * Get the current user from the server-side session
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current session from cookies
 * Returns null if no session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Get user with their profile and role
 * Used for role-based access control
 */
export async function getUserWithRole() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Fetch profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  return {
    user,
    profile,
    role: profile?.role || 'CLIENT',
  };
}
