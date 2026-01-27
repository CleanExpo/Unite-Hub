/**
 * GET  /api/synthex/market-radar/watches?tenantId=...
 * POST /api/synthex/market-radar/watches
 *
 * Manage competitor watch list for Market Radar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeDomain, isValidDomain } from '@/lib/synthex/marketRadarEngine';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const status = req.nextUrl.searchParams.get('status') || 'active';

    let query = supabaseAdmin
      .from('synthex_market_radar_watches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Watches GET error:', error);
      return NextResponse.json({ watches: [] }, { status: 200 });
    }

    return NextResponse.json({ watches: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Watches GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, domain, displayName, industry, monitorSeo, monitorContent, monitorSocial, monitorPricing, checkFrequency, notes } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }
    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
    }

    const normalized = normalizeDomain(domain);
    if (!isValidDomain(normalized)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('synthex_market_radar_watches')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('domain', normalized)
      .neq('status', 'removed')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Domain already being watched' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_market_radar_watches')
      .insert({
        tenant_id: tenantId,
        domain: normalized,
        display_name: displayName || normalized,
        industry: industry || null,
        monitor_seo: monitorSeo ?? true,
        monitor_content: monitorContent ?? true,
        monitor_social: monitorSocial ?? false,
        monitor_pricing: monitorPricing ?? false,
        check_frequency: checkFrequency || 'weekly',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Watch create error:', error);
      return NextResponse.json({ error: 'Failed to create watch' }, { status: 500 });
    }

    return NextResponse.json({ watch: data }, { status: 201 });
  } catch (error) {
    console.error('Watches POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
