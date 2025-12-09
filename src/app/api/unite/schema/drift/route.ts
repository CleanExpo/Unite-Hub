/**
 * Schema Drift API
 * Phase: D77 - Unite Schema Drift & Auto-Migration Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectAndReportDrift, listDriftReports } from '@/lib/unite/schemaDriftService';

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

    const filters = {
      tenant_id: tenantId,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
    };

    const reports = await listDriftReports(filters);
    return NextResponse.json({ reports });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch drift reports' },
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
    const body = await request.json();
    const { base_snapshot_id, compare_snapshot_id } = body;

    if (!base_snapshot_id || !compare_snapshot_id) {
      return NextResponse.json(
        { error: 'base_snapshot_id and compare_snapshot_id required' },
        { status: 400 }
      );
    }

    const report = await detectAndReportDrift(base_snapshot_id, compare_snapshot_id, tenantId);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to detect drift' },
      { status: 500 }
    );
  }
}
