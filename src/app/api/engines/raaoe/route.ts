import { NextRequest, NextResponse } from 'next/server';
import { raaoeEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, region, operation, priority } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    switch (action) {
      case 'submit':
        const result = await raaoeEngine.submitOperation(tenantId, region, operation, priority);
        return NextResponse.json({ success: true, result });

      case 'status':
        const status = await raaoeEngine.getRegionStatus(region);
        return NextResponse.json({ success: true, status });

      case 'optimize':
        const optimization = await raaoeEngine.optimizeRegionalRouting(tenantId);
        return NextResponse.json({ success: true, optimization });

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
    console.error('[RAAOE API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
