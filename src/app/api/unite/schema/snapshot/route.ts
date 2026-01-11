/**
 * Schema Snapshot API
 * Phase: D77 - Unite Schema Drift & Auto-Migration Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  captureSchemaSnapshot,
  listSnapshots,
  getLatestSnapshot,
} from '@/lib/unite/schemaDriftService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // List snapshots
    const filters = {
      tenant_id: tenantId,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
    };

    const snapshots = await listSnapshots(filters);
    return NextResponse.json({ snapshots });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch snapshots' },
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

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const snapshot = await captureSchemaSnapshot(tenantId);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture snapshot' },
      { status: 500 }
    );
  }
}
