/**
 * POST /api/synthex/analytics/insights
 *
 * Generate AI-powered analytics insights.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   analyticsData?: object (optional, will fetch if not provided)
 * }
 *
 * Response:
 * {
 *   status: 'ok'
 *   insights: AnalyticsInsight[]
 * }
 *
 * Phase: B7 - Synthex Advanced Analytics + Attribution Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateAnalyticsInsights, getCombinedAnalytics } from '@/lib/synthex/analyticsEngine';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, analyticsData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
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

    // Generate insights
    const result = await generateAnalyticsInsights(tenantId, analyticsData);

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      insights: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[analytics/insights POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '30');

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

    // Get combined analytics for context
    const analyticsResult = await getCombinedAnalytics(tenantId, { days });

    if (analyticsResult.error) {
      throw analyticsResult.error;
    }

    // Generate insights on demand
    const insightsResult = await generateAnalyticsInsights(tenantId, analyticsResult.data || undefined);

    if (insightsResult.error) {
      throw insightsResult.error;
    }

    return NextResponse.json({
      status: 'ok',
      analytics: analyticsResult.data,
      insights: insightsResult.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[analytics/insights GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
