import { NextRequest, NextResponse } from 'next/server';
import { raaoeEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, region, operation, priority } = await req.json();

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
    console.error('[RAAOE API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
