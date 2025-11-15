# Correct OAuth Implementation for Supabase + Next.js

## Current Problem

The OAuth flow is using **implicit flow** (`#access_token=...` in URL hash), but Supabase's recommended approach for Next.js App Router is **PKCE flow** (`?code=...` in query params).

Additionally, the middleware is using `getSession()` which is **unreliable and insecure** according to Supabase documentation. It should use `getClaims()` instead.

## Official Supabase Approach (Per 2025 Documentation)

### 1. OAuth Setup in AuthContext

**Change the `redirectTo` URL:**
```typescript
const signInWithGoogle = async () => {
  const { data, error} = await supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,  // CHANGED FROM /login
    },
  });
  // ...
};
```

### 2. OAuth Callback Route (`src/app/auth/callback/route.ts`)

This is the official pattern from Supabase docs:

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Allow user to specify redirect destination
  let next = searchParams.get('next') ?? '/dashboard/overview'

  // Ensure redirect is safe (prevent open redirects)
  if (!next.startsWith('/')) {
    next = '/dashboard/overview'
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully exchanged code for session
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
```

### 3. Middleware Using getClaims() (CRITICAL FIX)

**From Supabase docs:** "Always use `supabase.auth.getClaims()` to protect pages. Never trust `supabase.auth.getSession()` inside server code."

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // USE getClaims() INSTEAD OF getSession()
  // This validates the JWT locally and is secure for server-side auth
  const { data: claims } = await supabase.auth.getClaims();

  const isAuthenticated = !!claims?.sub; // sub is the user ID from JWT

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuthPath = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthPath && isAuthenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/overview";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
```

### 4. Remove Client-Side Redirect Logic from AuthContext

Since the middleware now properly handles redirects, we can remove the client-side redirect logic from AuthContext that was causing the flicker.

## Why This Fixes The Issues

1. **PKCE Flow**: Using `/auth/callback` with `exchangeCodeForSession()` ensures sessions are established server-side with HTTP-only cookies
2. **getClaims() in Middleware**: Securely validates JWT tokens server-side without making API calls
3. **Proper Cookie Management**: The callback route sets cookies correctly before redirecting
4. **No Client-Side Redirect Race**: Middleware handles redirects server-side, eliminating flicker

## Implementation Steps

1. Update `signInWithGoogle()` to redirect to `/auth/callback`
2. Ensure `/auth/callback/route.ts` exists and uses the pattern above
3. Update middleware to use `getClaims()` instead of `getSession()`
4. Remove client-side redirect logic from AuthContext
5. Test OAuth flow end-to-end
