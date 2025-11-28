/**
 * OAuth Callback Handler
 *
 * GET - Handle OAuth callback from providers (Google, Microsoft)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConnectedAppsService,
  getProviderRegistry,
  type OAuthProvider,
} from '@/lib/connectedApps';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    // Validate provider
    const registry = getProviderRegistry();
    if (!registry.isProviderSupported(provider)) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connected-apps?error=invalid_provider', req.url)
      );
    }

    // Get OAuth parameters from query
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');
    const errorDescription = req.nextUrl.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error(`[OAuth Callback] Error from provider: ${error} - ${errorDescription}`);
      const errorUrl = new URL('/dashboard/settings/connected-apps', req.url);
      errorUrl.searchParams.set('error', error);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      return NextResponse.redirect(errorUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connected-apps?error=missing_parameters', req.url)
      );
    }

    // Complete OAuth flow
    const service = getConnectedAppsService();
    const { app, returnUrl } = await service.handleOAuthCallback(code, state);

    // Redirect to return URL with success
    const successUrl = new URL(returnUrl, req.url);
    successUrl.searchParams.set('connected', 'true');
    successUrl.searchParams.set('provider', provider);
    successUrl.searchParams.set('appId', app.id);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);

    const errorUrl = new URL('/dashboard/settings/connected-apps', req.url);
    errorUrl.searchParams.set('error', 'connection_failed');
    errorUrl.searchParams.set(
      'error_description',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.redirect(errorUrl);
  }
}
