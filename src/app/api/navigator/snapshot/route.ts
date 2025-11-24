/**
 * Navigator Snapshot API
 * Phase 96: Get/generate navigator snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  generateSnapshot,
  getLatestSnapshot,
  getInsightsForSnapshot,
} from '@/lib/navigator';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const snapshot = await getLatestSnapshot(tenantId);
    if (!snapshot) {
      return NextResponse.json({ success: true, snapshot: null, insights: [] });
    }

    const insights = await getInsightsForSnapshot(snapshot.id);

    return NextResponse.json({
      success: true,
      snapshot,
      insights,
    });
  } catch (error) {
    console.error('Failed to get snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, regionId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const snapshot = await generateSnapshot({ tenantId, regionId });
    const insights = await getInsightsForSnapshot(snapshot.id);

    return NextResponse.json({
      success: true,
      snapshot,
      insights,
    });
  } catch (error) {
    console.error('Failed to generate snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
