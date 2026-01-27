/**
 * GET  /api/synthex/experiments?tenantId=...
 * POST /api/synthex/experiments
 *
 * Manage A/B test experiments for Synthex tenants.
 * Wraps the core experiment sandbox and A/B testing infrastructure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const status = req.nextUrl.searchParams.get('status');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');

    let query = supabaseAdmin
      .from('experiment_sandboxes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Experiments GET error:', error);
      return NextResponse.json({ experiments: [] }, { status: 200 });
    }

    // Also fetch campaign-based A/B tests for this tenant
    let abTests: unknown[] = [];
    try {
      const { data: campaigns } = await supabaseAdmin
        .from('drip_campaigns')
        .select('id, name, campaign_type, ab_test_config, ab_test_winner_id, ab_test_completed_at, status, created_at, updated_at')
        .eq('tenant_id', tenantId)
        .eq('campaign_type', 'ab_test')
        .order('created_at', { ascending: false })
        .limit(limit);

      abTests = campaigns || [];
    } catch {
      // drip_campaigns table may not have tenant_id column; graceful fallback
    }

    return NextResponse.json({
      experiments: data || [],
      abTests,
    }, { status: 200 });
  } catch (error) {
    console.error('Experiments GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, name, description, config, experimentType } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Missing experiment name' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('experiment_sandboxes')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        sandbox_config: {
          ...(config || {}),
          experiment_type: experimentType || 'ab_test',
          source: 'synthex',
        },
        results: {},
        status: 'setup',
        uncertainty_notes: 'Results require minimum sample size before conclusions can be drawn',
      })
      .select()
      .single();

    if (error) {
      console.error('Experiment create error:', error);
      return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 });
    }

    return NextResponse.json({ experiment: data }, { status: 201 });
  } catch (error) {
    console.error('Experiments POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
