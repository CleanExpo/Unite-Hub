/**
 * GET   /api/founder/agents/army/leads  — list leads
 * POST  /api/founder/agents/army/leads  — create lead
 * PATCH /api/founder/agents/army/leads  — update status / notes
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
    const industry    = searchParams.get('industry');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('leads')
      .select('id, source_agent, company, contact_name, contact_email, industry, score, status, notes, metadata, created_at')
      .eq('workspace_id', workspaceId)
      .order('score', { ascending: false })
      .limit(limit);

    if (status)   query = query.eq('status', status);
    if (industry) query = query.eq('industry', industry);

    const { data, error } = await query;

    if (error) {
      console.error('[army/leads GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/leads GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspaceId,
      sourceAgent,
      company,
      contactName,
      contactEmail,
      industry,
      score,
      notes,
      metadata,
    } = body;

    if (!sourceAgent) {
      return NextResponse.json({ error: 'sourceAgent is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        workspace_id:  workspaceId || null,
        source_agent:  sourceAgent,
        company:       company       || null,
        contact_name:  contactName   || null,
        contact_email: contactEmail  || null,
        industry:      industry      || null,
        score:         score         ?? 50,
        status:        'new',
        notes:         notes         || null,
        metadata:      metadata      || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[army/leads POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/leads POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const validStatuses = ['new', 'qualified', 'contacted', 'converted', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (notes  !== undefined) update.notes  = notes;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(update)
      .eq('id', id)
      .select('id, status, notes')
      .single();

    if (error) {
      console.error('[army/leads PATCH]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/leads PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
