/**
 * Email Sync API
 *
 * POST - Trigger email sync for a connected app
 * GET - Get sync status/logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { getEmailIngestionService, type SyncOptions } from '@/lib/emailIngestion';

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
    const { workspaceId, connectedAppId, syncType, sinceDate } = body as {
      workspaceId: string;
      connectedAppId: string;
      syncType?: 'initial' | 'incremental' | 'full' | 'manual';
      sinceDate?: string;
    };

    if (!workspaceId || !connectedAppId) {
      return NextResponse.json(
        { error: 'workspaceId and connectedAppId are required' },
        { status: 400 }
      );
    }

    const service = getEmailIngestionService();

    const options: SyncOptions = {
      syncType: syncType || 'incremental',
      sinceDate: sinceDate ? new Date(sinceDate) : undefined,
    };

    // Start sync (this may take a while)
    const progress = await service.syncEmails(workspaceId, connectedAppId, options);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('[API] POST /api/email-intel/sync error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

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
    const connectedAppId = req.nextUrl.searchParams.get('connectedAppId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('email_sync_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (connectedAppId) {
      query = query.eq('connected_app_id', connectedAppId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sync logs: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
    });
  } catch (error) {
    console.error('[API] GET /api/email-intel/sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
