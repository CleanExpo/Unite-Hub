/**
 * Xero OAuth Callback Endpoint
 *
 * GET /api/integrations/xero/callback?code=...&state=...
 *
 * Handles OAuth callback from Xero
 * Exchanges code for tokens and saves to database
 *
 * Following CLAUDE.md patterns:
 * - Uses getSupabaseServer() for server-side auth
 * - Uses supabaseAdmin for token storage (bypasses RLS)
 * - Returns clear error messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import XeroService from '@/lib/accounting/xero-client';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('❌ Xero OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=missing_parameters', req.url)
      );
    }

    // Decode state parameter
    let stateData: { org_id: string; user_id: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (err) {
      console.error('❌ Invalid state parameter:', err);
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=invalid_state', req.url)
      );
    }

    // Verify state timestamp (prevent replay attacks - max 10 minutes old)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=state_expired', req.url)
      );
    }

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=unauthorized', req.url)
      );
    }

    // Verify user matches state
    if (user.id !== stateData.user_id) {
      console.error('❌ User mismatch - state:', stateData.user_id, 'user:', user.id);
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=user_mismatch', req.url)
      );
    }

    // Initialize Xero service
    const xeroService = new XeroService();

    // Exchange code for tokens
    const tokenSet = await xeroService.exchangeCodeForToken(code);

    // Save tokens to database
    await xeroService.saveTokenSet(stateData.org_id, tokenSet);

    // Test connection to get organization name
    const connectionTest = await xeroService.testConnection(stateData.org_id);

    if (!connectionTest.success) {
      console.error('❌ Xero connection test failed:', connectionTest.error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(connectionTest.error || 'connection_failed')}`, req.url)
      );
    }

    // Success - redirect to settings page
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations?success=true&org=${encodeURIComponent(connectionTest.orgName || 'Xero')}`,
        req.url
      )
    );

  } catch (error) {
    console.error('❌ Xero callback error:', error);

    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations?error=${encodeURIComponent(error instanceof Error ? error.message : 'callback_failed')}`,
        req.url
      )
    );
  }
}
