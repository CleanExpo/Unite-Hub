/**
 * Futurecasting Run API
 * Phase: D80 - Futurecasting Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  runForecast,
  listModels,
  getModelStats,
  type ForecastTimeframe,
} from '@/lib/orchestration/futurecastingEngine';

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
      const stats = await getModelStats({ tenant_id: tenantId });
      return NextResponse.json({ stats });
    }

    // List models
    const filters = {
      tenant_id: tenantId,
      domain: request.nextUrl.searchParams.get('domain') || undefined,
      timeframe: (request.nextUrl.searchParams.get('timeframe') as ForecastTimeframe) || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
    };

    const models = await listModels(filters);
    return NextResponse.json({ models });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
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
    const { title, domain, timeframe, inputs } = body;

    if (!title || !domain || !timeframe) {
      return NextResponse.json(
        { error: 'title, domain, timeframe required' },
        { status: 400 }
      );
    }

    const model = await runForecast(title, domain, timeframe, inputs, tenantId);
    return NextResponse.json({ model }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run forecast' },
      { status: 500 }
    );
  }
}
