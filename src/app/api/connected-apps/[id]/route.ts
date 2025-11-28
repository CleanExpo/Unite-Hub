/**
 * Connected Apps [id] API
 *
 * GET - Get a specific connected app
 * DELETE - Disconnect/remove a connected app
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getConnectedAppsService } from '@/lib/connectedApps';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const app = await service.getConnectedApp(workspaceId, id);

    if (!app) {
      return NextResponse.json(
        { error: 'Connected app not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      app,
    });
  } catch (error) {
    console.error('[API] GET /api/connected-apps/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    await service.disconnectApp(workspaceId, id);

    return NextResponse.json({
      success: true,
      message: 'App disconnected successfully',
    });
  } catch (error) {
    console.error('[API] DELETE /api/connected-apps/[id] error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
