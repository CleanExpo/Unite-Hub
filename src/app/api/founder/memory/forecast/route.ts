/**
 * Founder Forecast API
 *
 * POST: Generate new forecast
 * GET: Fetch existing forecasts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { forecastEngineService, type ForecastHorizon } from '@/lib/founderMemory';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, horizon = '12_week', includeScenarios = true } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const forecast = await forecastEngineService.generateForecast({
      founderId: userId,
      workspaceId,
      horizon: horizon as ForecastHorizon,
      includeScenarios,
    });

    return NextResponse.json({
      success: true,
      forecast: {
        id: forecast.id,
        horizon: forecast.horizon,
        generatedAt: forecast.generatedAt.toISOString(),
        baselineScenario: forecast.baselineScenario,
        optimisticScenario: forecast.optimisticScenario,
        pessimisticScenario: forecast.pessimisticScenario,
        keyAssumptions: forecast.keyAssumptions,
        confidenceScore: forecast.confidenceScore,
        aiInsights: forecast.aiInsightsJson,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const horizon = req.nextUrl.searchParams.get('horizon') as ForecastHorizon | null;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const forecasts = await forecastEngineService.getForecasts(userId, workspaceId, {
      horizon: horizon || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      forecasts: forecasts.map((f) => ({
        id: f.id,
        horizon: f.horizon,
        generatedAt: f.generatedAt.toISOString(),
        baselineScenario: f.baselineScenario,
        optimisticScenario: f.optimisticScenario,
        pessimisticScenario: f.pessimisticScenario,
        keyAssumptions: f.keyAssumptions,
        confidenceScore: f.confidenceScore,
        aiInsights: f.aiInsightsJson,
      })),
      count: forecasts.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
