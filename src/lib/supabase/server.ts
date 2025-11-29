/**
 * Supabase Server Client - PKCE Flow
 *
 * This client is used in:
 * - Server Components (RSC)
 * - API Routes
 * - Middleware
 *
 * PKCE sessions are stored in cookies, making them accessible server-side.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Dynamic import of cookies to prevent build-time evaluation
async function getCookieStore() {
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
