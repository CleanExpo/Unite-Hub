/**
 * Email Threads API
 *
 * GET - List email threads with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getEmailIngestionService } from '@/lib/emailIngestion';

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
    const clientId = req.nextUrl.searchParams.get('clientId') || undefined;
    const connectedAppId = req.nextUrl.searchParams.get('connectedAppId') || undefined;
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const service = getEmailIngestionService();
    const { threads, total } = await service.getEmailThreads(workspaceId, {
      clientId,
      connectedAppId,
      search,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      threads,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + threads.length < total,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/email-intel/threads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
