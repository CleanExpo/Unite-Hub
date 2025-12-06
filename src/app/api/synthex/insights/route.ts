/**
 * GET/PATCH /api/synthex/insights
 *
 * List insights or update insight status.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - status?: 'new' | 'viewed' | 'actioned' | 'dismissed'
 * - category?: 'seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general'
 * - limit?: number
 *
 * PATCH body:
 * {
 *   insightId: string (required)
 *   status: 'viewed' | 'actioned' | 'dismissed'
 * }
 *
 * Phase: B5 - Synthex Analytics + Insights Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getInsights, updateInsightStatus, getInsightCounts } from '@/lib/synthex/insightService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') as 'new' | 'viewed' | 'actioned' | 'dismissed' | null;
    const category = searchParams.get('category') as 'seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general' | null;
    const limit = searchParams.get('limit');
    const includeCounts = searchParams.get('includeCounts') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await getInsights(tenantId, user.id, {
      status: status || undefined,
      category: category || undefined,
      limit: limit ? parseInt(limit) : 20,
    });

    if (result.error) {
      throw result.error;
    }

    const response: Record<string, unknown> = {
      status: 'ok',
      insights: result.data || [],
    };

    if (includeCounts) {
      const counts = await getInsightCounts(tenantId, user.id);
      response.counts = counts.data;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[insights GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { insightId, status } = body;

    if (!insightId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: insightId, status' },
        { status: 400 }
      );
    }

    if (!['viewed', 'actioned', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: viewed, actioned, or dismissed' },
        { status: 400 }
      );
    }

    // Verify user owns the insight
    const { data: insight } = await supabaseAdmin
      .from('synthex_insights')
      .select('user_id')
      .eq('id', insightId)
      .single();

    if (!insight || insight.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await updateInsightStatus(insightId, status);

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[insights PATCH] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
