/**
 * Stress Test Execution API
 * Phase: D71 - Unite System Stress-Test Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runStressTest,
  getStressRun,
  listStressRuns,
  cancelStressRun,
} from '@/lib/unite/stressTestService';

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

    const runId = request.nextUrl.searchParams.get('run_id');

    // Get single run
    if (runId) {
      const run = await getStressRun(runId);
      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      // Verify tenant access
      if (run.tenant_id && run.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ run });
    }

    // List runs with filters
    const filters = {
      tenant_id: tenantId,
      profile_id: request.nextUrl.searchParams.get('profile_id') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const runs = await listStressRuns(filters);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stress runs' },
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
    const { action, profile_id, run_id } = body;

    // Run stress test
    if (action === 'run') {
      if (!profile_id) {
        return NextResponse.json(
          { error: 'profile_id is required to run stress test' },
          { status: 400 }
        );
      }

      const run = await runStressTest(profile_id, tenantId);
      return NextResponse.json({ run }, { status: 201 });
    }

    // Cancel stress test
    if (action === 'cancel') {
      if (!run_id) {
        return NextResponse.json(
          { error: 'run_id is required to cancel stress test' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getStressRun(run_id);
      if (!existing) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await cancelStressRun(run_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process stress test operation' },
      { status: 500 }
    );
  }
}
