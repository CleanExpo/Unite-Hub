/**
 * Performance Reality Snapshots API
 * Phase 81: GET list, POST create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  createPerformanceRealitySnapshot,
  listPerformanceRealitySnapshots,
  RealityScope,
} from '@/lib/performanceReality';

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
    const scope = req.nextUrl.searchParams.get('scope') as RealityScope | null;
    const clientId = req.nextUrl.searchParams.get('client_id') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const { snapshots, total } = await listPerformanceRealitySnapshots({
      scope: scope || undefined,
      clientId,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: snapshots,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/performance-reality/snapshots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { scope, client_id, timeframe_days } = body;

    if (!scope) {
      return NextResponse.json(
        { error: 'scope is required' },
        { status: 400 }
      );
    }

    const snapshot = await createPerformanceRealitySnapshot(
      scope as RealityScope,
      client_id,
      timeframe_days || 30
    );

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Failed to create snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error in POST /api/performance-reality/snapshots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
