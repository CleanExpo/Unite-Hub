import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getPolicies, createPolicy } from '@/lib/aiWorkloadGovernor';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
}

    const policies = await getPolicies(tenantId);
    return NextResponse.json({ success: true, policies });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const body = await req.json();
    const { tenantId, monthlyBudgetUnits, priorityRules, regionId } = body;

    if (!tenantId || !monthlyBudgetUnits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const policy = await createPolicy(tenantId, monthlyBudgetUnits, priorityRules || [], regionId);
    if (!policy) {
return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
}

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
