/**
 * Supabase Middleware Client - PKCE Flow
 *
 * This client is used in Next.js middleware.
 * It can read and write cookies during request/response cycle.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Create a Supabase client for middleware
 * Handles cookie read/write during request processing
 */
export function createMiddlewareClient(request: NextRequest) {
  // Create response that we'll modify with cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          // Set cookie on response (for browser)
          response = NextResponse.next({
            request: {
              headers: request.headers,
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
              headers: request.headers,
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
export async function updateSession(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  return { supabase, response, session };
}
