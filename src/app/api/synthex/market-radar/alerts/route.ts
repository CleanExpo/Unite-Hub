/**
 * GET   /api/synthex/market-radar/alerts?tenantId=...
 * PATCH /api/synthex/market-radar/alerts (mark read)
 *
 * Retrieve and manage competitor monitoring alerts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('synthex_market_radar_alerts')
      .select('*, synthex_market_radar_watches(domain, display_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Alerts GET error:', error);
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }

    return NextResponse.json({ alerts: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, alertIds, markAllRead } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    if (markAllRead) {
      const { error } = await supabaseAdmin
        .from('synthex_market_radar_alerts')
        .update({ is_read: true })
        .eq('tenant_id', tenantId)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ error: 'Failed to mark alerts read' }, { status: 500 });
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json({ error: 'Missing alertIds' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('synthex_market_radar_alerts')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .in('id', alertIds);

    if (error) {
      return NextResponse.json({ error: 'Failed to mark alerts read' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Alerts PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
