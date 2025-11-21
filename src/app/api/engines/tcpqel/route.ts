// TCPQEL API - Plans, Quotas & Licensing
import { NextRequest, NextResponse } from 'next/server';
import { tcpqelEngine } from '@/lib/services/engines';
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
      case 'checkQuota':
        const quota = await tcpqelEngine.checkQuota(tenantId, params.engine, params.amount);
        return NextResponse.json(quota);

      case 'allocatePlan':
        await tcpqelEngine.allocatePlan(tenantId, params.planId);
        return NextResponse.json({ success: true });

      case 'chargeUsage':
        await tcpqelEngine.chargeUsage(tenantId, params.engine, params.amount);
        return NextResponse.json({ success: true });

      case 'checkLicense':
        const licensed = await tcpqelEngine.isEngineLicensed(tenantId, params.engineName);
        return NextResponse.json({ licensed });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('TCPQEL API error:', error);
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

    const stats = await tcpqelEngine.getUsageStats(tenantId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('TCPQEL API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
