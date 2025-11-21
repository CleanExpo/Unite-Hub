// AGLBASE API - Load Balancing & Scaling
import { NextRequest, NextResponse } from 'next/server';
import { aglbasEngine } from '@/lib/services/engines';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tenantId, ...params } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

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
    console.error('AGLBASE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const capacity = await aglbasEngine.assessCapacity(tenantId);

    return NextResponse.json(capacity);
  } catch (error) {
    console.error('AGLBASE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
