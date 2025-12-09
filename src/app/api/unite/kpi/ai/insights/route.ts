/**
 * KPI AI Insights API
 * Phase: D61
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiGenerateInsights, listSnapshots } from '@/lib/unite/kpiService';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const { kpi_id } = body;

    if (!kpi_id) return NextResponse.json({ error: 'kpi_id required' }, { status: 400 });

    const { data: kpi } = await supabaseAdmin.from('unite_kpi_definitions').select('*').eq('id', kpi_id).single();
    if (!kpi) return NextResponse.json({ error: 'KPI not found' }, { status: 404 });

    const snapshots = await listSnapshots(tenantId, kpi_id, 30);
    const insights = await aiGenerateInsights(kpi, snapshots);
    return NextResponse.json({ insights });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
