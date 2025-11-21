import { NextRequest, NextResponse } from 'next/server';
import { maosOrchestrator, ENGINE_MANIFEST, ROUTING_TABLE, REGION_PROFILES } from '@/lib/services/engines/MAOSOrchestrator';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, engine, category, region, params } = await req.json();

    switch (action) {
      case 'execute':
        const result = await maosOrchestrator.execute({
          tenantId,
          action: params?.action || 'default',
          engine,
          category,
          region,
          params: params || {}
        });
        return NextResponse.json({ success: true, result });

      case 'health':
        const health = await maosOrchestrator.getSystemHealth(tenantId);
        return NextResponse.json({ success: true, health });

      case 'forecasts':
        const forecasts = await maosOrchestrator.getProactiveForecasts(tenantId);
        return NextResponse.json({ success: true, forecasts });

      case 'alignment':
        const alignment = await maosOrchestrator.applyStrategicAlignment(tenantId);
        return NextResponse.json({ success: true, alignment });

      case 'manifest':
        return NextResponse.json({
          success: true,
          manifest: ENGINE_MANIFEST,
          routing: ROUTING_TABLE,
          regions: REGION_PROFILES
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[MAOS Orchestrator API] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Orchestrator failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    manifest: ENGINE_MANIFEST,
    routing: ROUTING_TABLE,
    regions: REGION_PROFILES,
    engineCount: Object.keys(ENGINE_MANIFEST).length
  });
}
