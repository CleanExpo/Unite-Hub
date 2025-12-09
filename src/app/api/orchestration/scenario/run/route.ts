/**
 * Scenario Run API
 * Phase: D79 - Scenario Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runScenario, listRuns, getRunStats } from '@/lib/orchestration/scenarioEngine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
        template_id: request.nextUrl.searchParams.get('template_id') || undefined,
      };
      const stats = await getRunStats(filters);
      return NextResponse.json({ stats });
    }

    // List runs
    const filters = {
      tenant_id: tenantId,
      template_id: request.nextUrl.searchParams.get('template_id') || undefined,
      status: (request.nextUrl.searchParams.get('status') as any) || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { template_id, inputs } = body;

    if (!template_id || !inputs) {
      return NextResponse.json({ error: 'template_id and inputs required' }, { status: 400 });
    }

    const run = await runScenario(template_id, inputs, tenantId);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run scenario' },
      { status: 500 }
    );
  }
}
