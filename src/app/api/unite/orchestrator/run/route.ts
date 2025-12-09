/**
 * Orchestrator Execution API
 * Phase: D72 - Unite Runtime Adaptive Orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRuntimeSignal,
  listRuntimeSignals,
  resolveRuntimeSignal,
  runOrchestrator,
  listOrchestratorRuns,
} from '@/lib/unite/runtimeOrchestratorService';

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

    const action = request.nextUrl.searchParams.get('action') || 'runs';

    // List runtime signals
    if (action === 'signals') {
      const filters = {
        tenant_id: tenantId,
        signal_type: request.nextUrl.searchParams.get('signal_type') || undefined,
        severity: request.nextUrl.searchParams.get('severity') || undefined,
        unresolved_only: request.nextUrl.searchParams.get('unresolved_only') === 'true',
        limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
      };

      const signals = await listRuntimeSignals(filters);
      return NextResponse.json({ signals });
    }

    // List orchestrator runs
    const filters = {
      tenant_id: tenantId,
      strategy_id: request.nextUrl.searchParams.get('strategy_id') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const runs = await listOrchestratorRuns(filters);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orchestrator data' },
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
    const { action } = body;

    // Create runtime signal
    if (action === 'create_signal') {
      const {
        signal_type,
        source_system,
        severity,
        metric_name,
        metric_value,
        threshold_value,
        metadata,
      } = body;

      if (!signal_type || !source_system || !severity || !metric_name || metric_value === undefined) {
        return NextResponse.json(
          {
            error:
              'signal_type, source_system, severity, metric_name, and metric_value are required',
          },
          { status: 400 }
        );
      }

      const signal = await createRuntimeSignal({
        signal_type,
        source_system,
        severity,
        metric_name,
        metric_value,
        threshold_value,
        metadata,
        tenant_id: tenantId,
      });

      return NextResponse.json({ signal }, { status: 201 });
    }

    // Resolve runtime signal
    if (action === 'resolve_signal') {
      const { signal_id } = body;

      if (!signal_id) {
        return NextResponse.json(
          { error: 'signal_id is required to resolve signal' },
          { status: 400 }
        );
      }

      await resolveRuntimeSignal(signal_id);
      return NextResponse.json({ success: true });
    }

    // Run orchestrator
    if (action === 'run') {
      const { signal_id } = body;

      if (!signal_id) {
        return NextResponse.json(
          { error: 'signal_id is required to run orchestrator' },
          { status: 400 }
        );
      }

      const runs = await runOrchestrator(signal_id, tenantId);
      return NextResponse.json({ runs }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process orchestrator operation' },
      { status: 500 }
    );
  }
}
