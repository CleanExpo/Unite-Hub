// GSLPIE API - Performance & SLA Intelligence
import { NextRequest, NextResponse } from 'next/server';
import { gslpieEngine } from '@/lib/services/engines';
import { validateUserAuth } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    await validateUserAuth(req);

    const { action, ...params } = await req.json();

    switch (action) {
      case 'capture':
        await gslpieEngine.captureMetrics(
          params.region,
          params.latencyMs,
          params.errorRate,
          params.throughput,
          params.source
        );
        return NextResponse.json({ success: true });

      case 'analyse':
        const perf = await gslpieEngine.analysePerformance(params.region, params.windowMinutes);
        return NextResponse.json(perf);

      case 'forecast':
        const forecast = await gslpieEngine.forecastSLA(params.tenantId, params.region);
        return NextResponse.json(forecast);

      case 'route':
        const region = await gslpieEngine.routeToOptimalRegion(params.preferredRegions);
        return NextResponse.json({ region });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('GSLPIE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await validateUserAuth(req);

    const region = req.nextUrl.searchParams.get('region');
    if (!region) {
      return NextResponse.json({ error: 'Missing region' }, { status: 400 });
    }

    const performance = await gslpieEngine.analysePerformance(region);

    return NextResponse.json(performance);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('GSLPIE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
