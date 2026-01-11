/**
 * Telemetry Snapshot API
 * Phase: D74 - Unite Stability Telemetry Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  captureSnapshotAsync,
  listSnapshots,
  getLatestSnapshot,
  getCurrentSystemMetrics,
} from '@/lib/unite/telemetryService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const action = request.nextUrl.searchParams.get('action') || 'list';

    // Get latest snapshot
    if (action === 'latest') {
      const snapshot = await getLatestSnapshot(tenantId);
      return NextResponse.json({ snapshot });
    }

    // Get current metrics (without saving)
    if (action === 'current') {
      const metrics = getCurrentSystemMetrics();
      return NextResponse.json({ metrics });
    }

    // List snapshots
    const filters = {
      tenant_id: tenantId,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const snapshots = await listSnapshots(filters);
    return NextResponse.json({ snapshots });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch telemetry snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const { action, state, metadata } = body;

    // Capture snapshot
    if (action === 'capture' || !action) {
      const snapshotState = state || getCurrentSystemMetrics();

      const snapshot = await captureSnapshotAsync(snapshotState, metadata, tenantId);
      return NextResponse.json({ snapshot }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture telemetry snapshot' },
      { status: 500 }
    );
  }
}
