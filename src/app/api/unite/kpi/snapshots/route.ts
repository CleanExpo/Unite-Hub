/**
 * KPI Snapshots API
 * Phase: D61
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSnapshot, listSnapshots } from '@/lib/unite/kpiService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const kpiId = request.nextUrl.searchParams.get('kpi_id');
    if (!kpiId) return NextResponse.json({ error: 'kpi_id required' }, { status: 400 });

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30', 10);
    const snapshots = await listSnapshots(tenantId, kpiId, limit);
    return NextResponse.json({ snapshots });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const snapshot = await createSnapshot(tenantId, body);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
