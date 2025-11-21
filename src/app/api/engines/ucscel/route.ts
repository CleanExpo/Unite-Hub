// UCSCEL API - Compliance & Contract Enforcement
import { NextRequest, NextResponse } from 'next/server';
import { ucscelEngine } from '@/lib/services/engines';
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
      case 'checkCompliance':
        const compliance = await ucscelEngine.checkContractCompliance(tenantId, params.action);
        return NextResponse.json(compliance);

      case 'checkSLA':
        const sla = await ucscelEngine.checkSLAAdherence(tenantId, params.metric, params.value);
        return NextResponse.json(sla);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('UCSCEL API error:', error);
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

    const type = req.nextUrl.searchParams.get('type') || 'contract';

    if (type === 'history') {
      const history = await ucscelEngine.getEnforcementHistory(tenantId);
      return NextResponse.json({ history });
    }

    const contract = await ucscelEngine.getActiveContract(tenantId);
    return NextResponse.json({ contract });
  } catch (error) {
    console.error('UCSCEL API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
