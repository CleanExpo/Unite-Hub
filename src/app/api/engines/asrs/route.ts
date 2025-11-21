// ASRS API - Safety & Risk Evaluation
import { NextRequest, NextResponse } from 'next/server';
import { asrsEngine } from '@/lib/services/engines';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, context, tenantId } = await req.json();

    if (!action || !tenantId) {
      return NextResponse.json({ error: 'Missing action or tenantId' }, { status: 400 });
    }

    const result = await asrsEngine.evaluateRisk(tenantId, action, context || {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('ASRS API error:', error);
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

    const blockLog = await asrsEngine.getBlockLog(tenantId);

    return NextResponse.json({ blockLog });
  } catch (error) {
    console.error('ASRS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
