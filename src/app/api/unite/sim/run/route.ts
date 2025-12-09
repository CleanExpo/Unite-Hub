/**
 * Simulation Run API
 * Phase: D78 - Unite Simulation Twin Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSimulation, listRuns, getRunStats } from '@/lib/unite/simulationTwinService';

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

    // Get stats
    if (action === 'stats') {
      const filters = {
        tenant_id: tenantId,
        twin_id: request.nextUrl.searchParams.get('twin_id') || undefined,
      };
      const stats = await getRunStats(filters);
      return NextResponse.json({ stats });
    }

    // List runs
    const filters = {
      tenant_id: tenantId,
      twin_id: request.nextUrl.searchParams.get('twin_id') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const runs = await listRuns(filters);
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch runs' },
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
    const { twin_id, input } = body;

    if (!twin_id || !input) {
      return NextResponse.json({ error: 'twin_id and input required' }, { status: 400 });
    }

    const run = await runSimulation(twin_id, input, tenantId);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run simulation' },
      { status: 500 }
    );
  }
}
