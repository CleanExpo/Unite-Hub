import { NextRequest, NextResponse } from 'next/server';
import { maosOrchestrator, ENGINE_MANIFEST, ROUTING_TABLE, REGION_PROFILES } from '@/lib/services/engines/MAOSOrchestrator';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tenantId, engine, category, region, params } = body;

    // Validate authentication and workspace access
    // tenantId in MAOS maps to workspaceId
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
      await validateUserAndWorkspace(req, tenantId);
    } catch (authError) {
      if (authError instanceof Error) {
        if (authError.message.includes('Unauthorized')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (authError.message.includes('Forbidden')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

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

export async function GET(req: NextRequest) {
  try {
    // Require authentication to view system manifest
    const { validateUserAuth } = await import('@/lib/workspace-validation');
    await validateUserAuth(req);

    return NextResponse.json({
      success: true,
      manifest: ENGINE_MANIFEST,
      routing: ROUTING_TABLE,
      regions: REGION_PROFILES,
      engineCount: Object.keys(ENGINE_MANIFEST).length
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
