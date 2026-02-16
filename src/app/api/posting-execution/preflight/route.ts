/**
 * Preflight API Route
 * Phase 87: Run preflight checks before execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { runPreflight, listPreflights, getPreflightById } from '@/lib/postingExecution';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const preflightId = req.nextUrl.searchParams.get('id');
    const scheduleId = req.nextUrl.searchParams.get('scheduleId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const passed = req.nextUrl.searchParams.get('passed');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    // Get single preflight
    if (preflightId) {
      const preflight = await getPreflightById(preflightId);
      if (!preflight) {
        return NextResponse.json({ error: 'Preflight not found' }, { status: 404 });
      }
      return NextResponse.json({ data: preflight });
    }

    // List preflights
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const preflights = await listPreflights(workspaceId, {
      scheduleId: scheduleId || undefined,
      clientId: clientId || undefined,
      passed: passed ? passed === 'true' : undefined,
      limit,
    });

    return NextResponse.json({ data: preflights });
  } catch (error: unknown) {
    console.error('Preflight GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { scheduleId, clientId, workspaceId, channel, content } = body;

    if (!scheduleId || !clientId || !workspaceId || !channel || !content) {
      return NextResponse.json(
        { error: 'scheduleId, clientId, workspaceId, channel, and content required' },
        { status: 400 }
      );
    }

    const result = await runPreflight({
      scheduleId,
      clientId,
      workspaceId,
      channel,
      content,
    });

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error('Preflight POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
