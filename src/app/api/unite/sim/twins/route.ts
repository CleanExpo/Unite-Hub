/**
 * Simulation Twins API
 * Phase: D78 - Unite Simulation Twin Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createTwin,
  listTwins,
  getTwin,
  updateTwin,
  deleteTwin,
} from '@/lib/unite/simulationTwinService';

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

    // Get specific twin
    if (action === 'get') {
      const twinId = request.nextUrl.searchParams.get('twin_id');
      if (!twinId) {
        return NextResponse.json({ error: 'twin_id required' }, { status: 400 });
      }
      const twin = await getTwin(twinId, tenantId);
      return NextResponse.json({ twin });
    }

    // List twins
    const filters = {
      tenant_id: tenantId,
      name: request.nextUrl.searchParams.get('name') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const twins = await listTwins(filters);
    return NextResponse.json({ twins });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch twins' },
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
    const { action, name, state, metadata, twin_id } = body;

    // Create twin
    if (action === 'create' || !action) {
      if (!name || !state) {
        return NextResponse.json({ error: 'name and state required' }, { status: 400 });
      }
      const twin = await createTwin(name, state, metadata, tenantId);
      return NextResponse.json({ twin }, { status: 201 });
    }

    // Update twin
    if (action === 'update') {
      if (!twin_id) {
        return NextResponse.json({ error: 'twin_id required' }, { status: 400 });
      }
      const updates: { state?: unknown; metadata?: unknown } = {};
      if (state) updates.state = state;
      if (metadata) updates.metadata = metadata;
      const twin = await updateTwin(twin_id, updates, tenantId);
      return NextResponse.json({ twin });
    }

    // Delete twin
    if (action === 'delete') {
      if (!twin_id) {
        return NextResponse.json({ error: 'twin_id required' }, { status: 400 });
      }
      const success = await deleteTwin(twin_id, tenantId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage twin' },
      { status: 500 }
    );
  }
}
