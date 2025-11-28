/**
 * Connected Apps API
 *
 * GET - List all connected apps for workspace
 * POST - Initiate OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getConnectedAppsService,
  getOAuthService,
  getProviderRegistry,
  type OAuthProvider,
} from '@/lib/connectedApps';

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const service = getConnectedAppsService();
    const apps = await service.getConnectedApps(workspaceId);

    // Also return available providers
    const registry = getProviderRegistry();
    const availableProviders = registry.getAllProviders();

    return NextResponse.json({
      success: true,
      apps,
      availableProviders,
    });
  } catch (error) {
    console.error('[API] GET /api/connected-apps error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, workspaceId, returnUrl } = body as {
      provider: string;
      workspaceId: string;
      returnUrl?: string;
    };

    if (!provider || !workspaceId) {
      return NextResponse.json(
        { error: 'provider and workspaceId are required' },
        { status: 400 }
      );
    }

    // Validate provider
    const registry = getProviderRegistry();
    if (!registry.isProviderSupported(provider)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const oauthService = getOAuthService();
    const { authUrl, state } = await oauthService.generateAuthUrl(
      provider as OAuthProvider,
      workspaceId,
      authData.user.id,
      returnUrl || '/dashboard/settings/connected-apps'
    );

    return NextResponse.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error('[API] POST /api/connected-apps error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
