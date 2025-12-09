/**
 * Self-Healing Run API
 * Phase: D68
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listSelfHealingRuns,
  createSelfHealingRun,
  executeSelfHealingRun,
  rollbackSelfHealingRun,
} from '@/lib/unite/selfHealingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const filters = {
      tenant_id: tenantId || undefined,
      signature_id: request.nextUrl.searchParams.get('signature_id') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      triggered_by: request.nextUrl.searchParams.get('triggered_by') || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const runs = await listSelfHealingRuns(filters);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Execute existing run
    if (action === 'execute') {
      const { run_id } = body;
      if (!run_id) return NextResponse.json({ error: 'run_id required' }, { status: 400 });

      const result = await executeSelfHealingRun(run_id);
      return NextResponse.json(result);
    }

    // Rollback run
    if (action === 'rollback') {
      const { run_id } = body;
      if (!run_id) return NextResponse.json({ error: 'run_id required' }, { status: 400 });

      const result = await rollbackSelfHealingRun(run_id);
      return NextResponse.json(result);
    }

    // Create new run
    const run = await createSelfHealingRun({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({ run }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
