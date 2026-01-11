/**
 * Recovery Run API
 * Phase: D75 - Unite Adaptive Recovery Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runRecovery,
  approveRecoveryRun,
  cancelRecoveryRun,
  listRecoveryRuns,
  getRecoveryStats,
  type RecoveryStatus,
} from '@/lib/unite/recoveryEngineService';

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

    // Get recovery statistics
    if (action === 'stats') {
      const filters = {
        tenant_id: tenantId,
        policy_key: request.nextUrl.searchParams.get('policy_key') || undefined,
        start_date: request.nextUrl.searchParams.get('start_date') || undefined,
        end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      };

      const stats = await getRecoveryStats(filters);
      return NextResponse.json({ stats });
    }

    // List recovery runs
    const filters = {
      tenant_id: tenantId,
      policy_key: request.nextUrl.searchParams.get('policy_key') || undefined,
      status: (request.nextUrl.searchParams.get('status') as RecoveryStatus) || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const runs = await listRecoveryRuns(filters);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recovery runs' },
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
    const { action, policy_key, trigger_event, run_id, skip_simulation, auto_execute } = body;

    // Run recovery
    if (action === 'run' || !action) {
      if (!policy_key) {
        return NextResponse.json({ error: 'policy_key is required' }, { status: 400 });
      }

      if (!trigger_event) {
        return NextResponse.json({ error: 'trigger_event is required' }, { status: 400 });
      }

      const run = await runRecovery(policy_key, trigger_event, {
        skip_simulation,
        auto_execute,
        tenant_id: tenantId,
      });

      return NextResponse.json({ run }, { status: 201 });
    }

    // Approve recovery run
    if (action === 'approve') {
      if (!run_id) {
        return NextResponse.json({ error: 'run_id is required' }, { status: 400 });
      }

      const run = await approveRecoveryRun(run_id, tenantId);
      return NextResponse.json({ run });
    }

    // Cancel recovery run
    if (action === 'cancel') {
      if (!run_id) {
        return NextResponse.json({ error: 'run_id is required' }, { status: 400 });
      }

      const success = await cancelRecoveryRun(run_id, tenantId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute recovery operation' },
      { status: 500 }
    );
  }
}
