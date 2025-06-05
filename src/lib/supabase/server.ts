import 'server-only';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for server-side usage
 * This is build-safe and handles cookie access gracefully
 */
export async function createClient() {
  // Check if we're in a build environment
  const isBuildTime = process.env.NODE_ENV === 'production' && 
                      !global.process?.send && 
                      typeof window === 'undefined';
  
  // During build time, return a mock client that won't break the build
  if (isBuildTime || process.env.BUILDING === 'true') {
    console.log('Skipping Supabase server client creation during build');
    return createSupabaseServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get() { return undefined; },
          set() { /* no-op */ },
          remove() { /* no-op */ },
        },
      }
    );
  }
  
  // Runtime cookie handling
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  
  try {
    // Only access cookies in runtime context
    cookieStore = await cookies();
  } catch (error) {
    console.warn('Cookie access failed, using fallback:', error);
    // Return a client with no cookie support if cookies are not available
    return createSupabaseServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() { /* no-op */ },
          remove() { /* no-op */ },
        },
      }
    );
  }
  
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore?.set({ name, value, ...options });
          } catch {
            // The set method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore?.set({ name, value: '', ...options });
          } catch {
            // The delete method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with custom cookie store
 * Useful for API routes where you have direct access to request/response
 */
export function createClientWithCookies(cookieStore: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  remove: (name: string, options?: Record<string, unknown>) => void;
}) {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  );
}

// Export alias for compatibility
export const createServerClient = createClient;

// Build-safe wrapper for components that might be called during build
export async function safeCreateClient() {
  try {
    return await createClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Return a minimal client that won't break the build
    return createSupabaseServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get() { return undefined; },
          set() { /* no-op */ },
          remove() { /* no-op */ },
        },
      }
    );
  }
}
