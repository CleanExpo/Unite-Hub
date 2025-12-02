/**
 * Scaling Mode Health API
 * Phase 86: Generate and list health snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listSnapshots,
  generateSnapshot,
  getLatestSnapshot,
} from '@/lib/scalingMode';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const environment = req.nextUrl.searchParams.get('environment') || 'production';
    const type = req.nextUrl.searchParams.get('type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');

    // Get latest snapshot only
    if (type === 'latest') {
      const snapshot = await getLatestSnapshot(environment);
      return NextResponse.json({ data: snapshot });
    }

    // Get overview (derived from latest snapshot)
    if (type === 'overview') {
      const { getConfig } = await import('@/lib/scalingMode');
      const config = await getConfig(environment);
      const snapshot = await getLatestSnapshot(environment);

      if (!config) {
        return NextResponse.json(
          { error: 'Config not found' },
          { status: 404 }
        );
      }

      const overview = {
        environment,
        current_mode: config.current_mode,
        active_clients: snapshot?.active_clients || 0,
        safe_capacity: snapshot?.safe_capacity || 0,
        utilisation_percent: snapshot
          ? Math.round(snapshot.utilisation_ratio * 100)
          : 0,
        health_score: snapshot?.overall_scaling_health_score || 0,
        recommendation: snapshot?.recommendation || 'hold',
        last_snapshot_at: snapshot?.created_at,
        auto_mode_enabled: config.auto_mode_enabled,
      };

      return NextResponse.json({ data: overview });
    }

    // List snapshots
    const snapshots = await listSnapshots(environment, limit);
    return NextResponse.json({ data: snapshots });
  } catch (error) {
    console.error('Scaling health API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { environment = 'production' } = body;

    // Generate new snapshot
    const snapshot = await generateSnapshot(environment);

    return NextResponse.json({
      data: snapshot,
      message: 'Health snapshot generated',
    });
  } catch (error) {
    console.error('Scaling health API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate snapshot' },
      { status: 500 }
    );
  }
}
