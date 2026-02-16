/**
 * Auth Callback Route - PKCE Flow
 *
 * This route handles the OAuth callback for PKCE authentication.
 * It exchanges the authorization code for a session and stores it in cookies.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error from provider:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // PKCE flow requires a code parameter
  if (!code) {
    console.error('No code parameter in callback - PKCE flow requires code');
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  console.log('[Auth Callback] PKCE code received, exchanging for session...');

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Cookie setting can fail in edge cases
            console.warn('[Auth Callback] Cookie set warning:', error);
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.delete(name);
          } catch (error) {
            console.warn('[Auth Callback] Cookie remove warning:', error);
          }
        },
      },
    }
  );

  // Exchange the code for a session
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange error:', exchangeError);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  if (!data.session) {
    console.error('[Auth Callback] No session created after code exchange');
    return NextResponse.redirect(`${origin}/login?error=no_session`);
  }

  console.log('[Auth Callback] Session created for:', data.user?.email);

  // Initialize user profile and organization if needed
  try {
    const initResponse = await fetch(`${origin}/api/auth/initialize-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.session.access_token}`,
      },
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.warn('[Auth Callback] User initialization warning:', errorText);
      // Continue anyway - user might already be initialized
    } else {
      const initResult = await initResponse.json();
      console.log('[Auth Callback] User initialized:', initResult);
    }
  } catch (initError) {
    console.warn('[Auth Callback] User initialization error:', initError);
    // Continue anyway - we have a valid session
  }

  // Get the user's role to determine redirect destination
  let redirectPath = '/dashboard/overview';

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user!.id)
      .maybeSingle();

    if (profile?.role) {
      const role = profile.role.toUpperCase();
      if (role === 'FOUNDER' || role === 'ADMIN') {
        redirectPath = '/founder';
      } else if (role === 'STAFF') {
        redirectPath = '/staff/dashboard';
      } else if (role === 'CLIENT') {
        // Check if user is a managed client (has client_users record)
        // Managed clients go to /client portal; Google OAuth users go to main dashboard
        const { data: clientUser } = await supabase
          .from('client_users')
          .select('id')
          .eq('id', data.user!.id)
          .maybeSingle();

        redirectPath = clientUser ? '/client' : '/dashboard/overview';
      }
    }
  } catch (roleError) {
    console.warn('[Auth Callback] Role lookup warning:', roleError);
    // Use default redirect path
  }

  console.log('[Auth Callback] Redirecting to:', redirectPath);

  // Create response with redirect
  const response = NextResponse.redirect(`${origin}${redirectPath}`);

  return response;
}
