/**
 * Early Warning Events API
 * Phase 82: GET list warnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { listWarningEvents, WarningStatus } from '@/lib/signalMatrix';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse query params
    const statusParam = req.nextUrl.searchParams.get('status');
    const severity = req.nextUrl.searchParams.get('severity') || undefined;
    const warningType = req.nextUrl.searchParams.get('warning_type') || undefined;
    const clientId = req.nextUrl.searchParams.get('client_id') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    // Parse status (can be comma-separated)
    let status: WarningStatus | WarningStatus[] | undefined;
    if (statusParam) {
      if (statusParam.includes(',')) {
        status = statusParam.split(',') as WarningStatus[];
      } else {
        status = statusParam as WarningStatus;
      }
    }

    const { events, total } = await listWarningEvents({
      status,
      severity,
      warningType,
      clientId,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/early-warning/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
