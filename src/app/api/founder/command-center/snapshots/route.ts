/**
 * Founder Command Center - KPI Snapshots API
 *
 * Phase: D52 - Founder Command Center & Cross-Business Insights
 *
 * Routes:
 * - GET /api/founder/command-center/snapshots - List snapshots with filters
 * - POST /api/founder/command-center/snapshots - Record a new snapshot
 *
 * Query Params:
 * - action=latest&scope=<scope>&source=<source> - Get latest snapshot
 * - action=trend&scope=<scope>&source=<source>&metric=<key>&days=<n> - Get trend
 * - action=cross_business - Get cross-business summary
 * - scope=<scope> - Filter by scope
 * - source=<source> - Filter by source
 * - start_date=<date> - Filter by start date
 * - end_date=<date> - Filter by end date
 * - limit=<n> - Limit results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  recordKPISnapshot,
  getLatestKPISnapshot,
  getKPITrend,
  getCrossBusinessSummary,
  listKPISnapshots,
  RecordKPIInput,
  KPIScope,
} from '@/lib/founder/commandCenterService';

// =============================================================================
// GET - List snapshots, get latest, get trend, get summary
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const founderUserId = user.id;
    const action = request.nextUrl.searchParams.get('action');
    const scope = request.nextUrl.searchParams.get('scope') as KPIScope | null;
    const source = request.nextUrl.searchParams.get('source');
    const metricKey = request.nextUrl.searchParams.get('metric');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);

    // Get latest snapshot
    if (action === 'latest' && scope && source) {
      const snapshot = await getLatestKPISnapshot(founderUserId, scope, source);
      if (!snapshot) {
        return NextResponse.json({ error: 'No snapshot found' }, { status: 404 });
      }
      return NextResponse.json({ snapshot });
    }

    // Get KPI trend
    if (action === 'trend' && scope && source && metricKey) {
      const trend = await getKPITrend(founderUserId, scope, source, metricKey, days);
      return NextResponse.json({ trend });
    }

    // Get cross-business summary
    if (action === 'cross_business') {
      const summary = await getCrossBusinessSummary(founderUserId);
      return NextResponse.json({ summary });
    }

    // List snapshots with filters
    const startDate = request.nextUrl.searchParams.get('start_date') || undefined;
    const endDate = request.nextUrl.searchParams.get('end_date') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const snapshots = await listKPISnapshots(founderUserId, {
      scope: scope || undefined,
      source: source || undefined,
      startDate,
      endDate,
      limit,
    });

    return NextResponse.json({ snapshots });
  } catch (error: unknown) {
    console.error('GET /api/founder/command-center/snapshots error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Record KPI snapshot
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const founderUserId = user.id;
    const body = await request.json();

    const input: RecordKPIInput = {
      scope: body.scope,
      source: body.source,
      metrics: body.metrics,
      metadata: body.metadata,
    };

    if (!input.scope || !input.source || !input.metrics) {
      return NextResponse.json(
        { error: 'scope, source, and metrics are required' },
        { status: 400 }
      );
    }

    const snapshot = await recordKPISnapshot(founderUserId, input);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/founder/command-center/snapshots error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record snapshot' },
      { status: 500 }
    );
  }
}
