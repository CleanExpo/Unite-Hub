// AGLBASE API - Load Balancing & Scaling
import { NextRequest, NextResponse } from 'next/server';
import { aglbasEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, ...params } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    switch (action) {
      case 'scale':
        await aglbasEngine.applyScaling(
          tenantId,
          params.poolId,
          params.newCapacity,
          params.reason,
          params.triggerSource || 'manual'
        );
        return NextResponse.json({ success: true });

      case 'route':
        const decision = await aglbasEngine.selectRegionForWorkload(
          tenantId,
          params.workloadType,
          params.agentType,
          params.preferredRegions
        );
        return NextResponse.json(decision);

      case 'rebalance':
        const result = await aglbasEngine.rebalanceLoad(tenantId);
        return NextResponse.json(result);

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
    console.error('AGLBASE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    const capacity = await aglbasEngine.assessCapacity(tenantId);

    return NextResponse.json(capacity);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('AGLBASE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
