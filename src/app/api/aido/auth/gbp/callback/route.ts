/**
 * Google Business Profile OAuth Callback
 *
 * Handles OAuth 2.0 callback from Google Business Profile API
 * Exchanges authorization code for access/refresh tokens
 * Stores tokens in database for future API calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/aido/auth/gbp/callback`
);

export async function GET(req: NextRequest) {
  try {
    // Get authorization code from URL
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains workspaceId

    if (!code) {
      return NextResponse.redirect(
        `/dashboard/aido/onboarding?error=no_code`
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `/dashboard/aido/onboarding?error=no_tokens`
      );
    }

    // Get workspace ID from state
    const workspaceId = state || undefined;

    if (!workspaceId) {
      return NextResponse.redirect(
        `/dashboard/aido/onboarding?error=no_workspace`
      );
    }

    // Get current user
    const { data: { session }, error: authError } = await supabaseBrowser.auth.getSession();

    if (authError || !session) {
      return NextResponse.redirect(`/login?error=unauthorized`);
    }

    // Store tokens in database
    console.log('GBP OAuth tokens received:', {
      workspaceId,
      userId: session.user.id,
      expiresAt: tokens.expiry_date,
    });

    const { data: tokenData, error: tokenError } = await (supabaseBrowser
      .from('oauth_tokens') as any)
      .upsert({
        workspace_id: workspaceId,
        user_id: session.user.id,
        provider: 'google_business_profile',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date!).toISOString(),
        scopes: tokens.scope?.split(' ') || [],
        metadata: {},
      });

    if (tokenError) {
      console.error('Failed to store GBP tokens:', tokenError);
      return NextResponse.redirect(
        `/dashboard/aido/onboarding?error=token_storage_failed`
      );
    }

    // Redirect back to onboarding with success
    return NextResponse.redirect(
      `/dashboard/aido/onboarding?gbp_connected=true&step=3`
    );

  } catch (error) {
    console.error('GBP OAuth callback error:', error);
    return NextResponse.redirect(
      `/dashboard/aido/onboarding?error=oauth_failed`
    );
  }
}
