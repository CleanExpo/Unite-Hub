/**
 * Supabase Middleware Client - PKCE Flow
 *
 * This client is used in Next.js middleware.
 * It can read and write cookies during request/response cycle.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseConfig } from './server';
import { getSupabaseAnonConfig } from './env-guard';

/**
 * Create a Supabase client for middleware
 * Handles cookie read/write during request processing
 */
export function createMiddlewareClient(request: NextRequest, extraRequestHeaders?: Record<string, string>) {
  // Merge any extra headers (e.g. nonce) into the forwarded request headers
  // so Server Components can read them via headers() from next/headers.
  const requestHeaders = new Headers(request.headers);
  if (extraRequestHeaders) {
    for (const [key, value] of Object.entries(extraRequestHeaders)) {
      requestHeaders.set(key, value);
    }
  }

  // Create response that we'll modify with cookies
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Graceful no-op when Supabase isn't configured at all (e.g. preview/build
  // environments with no env) so a missing config never crashes the whole app —
  // requests proceed as unauthenticated. Mirrors server.ts's hasSupabaseConfig guard.
  if (!hasSupabaseConfig()) {
    const supabase = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as ReturnType<typeof createServerClient>;

    return { supabase, response };
  }

  // Config IS present → fetch the validated url + anon key. This throws a clear,
  // named error if the key is truncated/corrupted, instead of the cryptic
  // "No API key found in request" surfacing app-wide on every request.
  const { url, anonKey } = getSupabaseAnonConfig();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on request (for subsequent middleware/handlers)
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie on response (for browser), preserving extra headers
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}

/**
 * Update session in middleware
 * Call this to refresh tokens and maintain session
 */
export async function updateSession(request: NextRequest, extraRequestHeaders?: Record<string, string>) {
  const { supabase, response } = createMiddlewareClient(request, extraRequestHeaders);

  // getUser() verifies the JWT server-side on every request.
  // getSession() trusts the client cookie without server verification — revoked
  // tokens would still pass. See Supabase security advisory (Nov 2023).
  const { data: { user } } = await supabase.auth.getUser();

  return { supabase, response, user };
}
