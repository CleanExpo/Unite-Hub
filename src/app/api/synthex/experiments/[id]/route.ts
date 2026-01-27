/**
 * GET   /api/synthex/experiments/[id]?tenantId=...
 * PATCH /api/synthex/experiments/[id]
 *
 * Get or update a single Synthex experiment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('experiment_sandboxes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    return NextResponse.json({ experiment: data }, { status: 200 });
  } catch (error) {
    console.error('Experiment GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { tenantId, status, results, name, description } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('experiment_sandboxes')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (results) updates.results = results;
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (status === 'running') {
      updates.is_active = true;
    } else if (status === 'completed' || status === 'archived') {
      updates.is_active = false;
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabaseAdmin
      .from('experiment_sandboxes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Experiment update error:', error);
      return NextResponse.json({ error: 'Failed to update experiment' }, { status: 500 });
    }

    return NextResponse.json({ experiment: data }, { status: 200 });
  } catch (error) {
    console.error('Experiment PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
