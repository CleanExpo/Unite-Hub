/**
 * GET   /api/founder/agents/army/opportunities  — list opportunities
 * POST  /api/founder/agents/army/opportunities  — create opportunity
 * PATCH /api/founder/agents/army/opportunities  — update status
 *
 * UNI-1444: Task runner framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const status      = searchParams.get('status');
    const type        = searchParams.get('type');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('opportunities')
      .select('id, source_agent, type, title, description, priority, status, revenue_potential, metadata, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (type)   query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      console.error('[army/opportunities GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunities: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/opportunities GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspaceId,
      sourceAgent,
      type,
      title,
      description,
      priority,
      revenuePotential,
      metadata,
    } = body;

    if (!sourceAgent || !type || !title) {
      return NextResponse.json(
        { error: 'sourceAgent, type, and title are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .insert({
        workspace_id:      workspaceId || null,
        source_agent:      sourceAgent,
        type,
        title,
        description:       description || null,
        priority:          priority || 'medium',
        status:            'new',
        revenue_potential: revenuePotential || null,
        metadata:          metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[army/opportunities POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/opportunities POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses = ['new', 'reviewing', 'actioned', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      console.error('[army/opportunities PATCH]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunity: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/opportunities PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
