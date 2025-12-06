/**
 * POST /api/synthex/predict/send-time
 * GET /api/synthex/predict/send-time
 *
 * Generate or retrieve send-time predictions.
 *
 * POST: Generate new prediction
 * {
 *   tenantId: string (required)
 *   audienceId?: string (optional)
 *   days?: number (default 90)
 * }
 *
 * GET: Get latest prediction
 * Query params:
 * - tenantId: string (required)
 * - audienceId?: string (optional)
 * - history?: boolean (get history instead of latest)
 *
 * Phase: B9 - Synthex Predictive Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  generateSendTimePrediction,
  getLatestSendTimePrediction,
  getSendTimePredictionHistory,
  buildHeatmapData,
} from '@/lib/synthex/predictiveService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, audienceId, days } = body;

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

    // Generate prediction
    const result = await generateSendTimePrediction(tenantId, {
      audienceId,
      days: days || 90,
    });

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Could not generate prediction - insufficient data' },
        { status: 400 }
      );
    }

    // Build heatmap data
    const heatmapData = buildHeatmapData(result.data.hourlyScores);

    return NextResponse.json({
      status: 'ok',
      prediction: result.data,
      heatmapData,
    }, { status: 201 });
  } catch (error) {
    console.error('[predict/send-time POST] Error:', error);
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
    const audienceId = searchParams.get('audienceId');
    const history = searchParams.get('history') === 'true';

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

    if (history) {
      // Get prediction history
      const result = await getSendTimePredictionHistory(tenantId);
      if (result.error) {
        throw result.error;
      }

      return NextResponse.json({
        status: 'ok',
        predictions: result.data || [],
      }, { status: 200 });
    }

    // Get latest prediction
    const result = await getLatestSendTimePrediction(tenantId, audienceId || undefined);

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return NextResponse.json({
        status: 'ok',
        prediction: null,
        message: 'No prediction available. Generate one using POST.',
      }, { status: 200 });
    }

    // Build heatmap data
    const heatmapData = buildHeatmapData(result.data.hourlyScores);

    return NextResponse.json({
      status: 'ok',
      prediction: result.data,
      heatmapData,
    }, { status: 200 });
  } catch (error) {
    console.error('[predict/send-time GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
