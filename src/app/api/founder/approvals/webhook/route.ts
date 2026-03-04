/**
 * GET /api/founder/approvals/webhook?id={id} — Bron polls this for approval status
 *
 * Returns current status and execution_result for a given approval item.
 * No auth required — Bron uses this as a callback endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('approval_queue')
      .select('id, status, execution_result, resolved_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      execution_result: data.execution_result,
      resolved_at: data.resolved_at,
      updated_at: data.updated_at,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/approvals/webhook]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
