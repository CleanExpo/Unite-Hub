/**
 * AI Policies API
 * Phase: D63
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPolicy, listPolicies, updatePolicy } from '@/lib/unite/aiGovernanceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const category = request.nextUrl.searchParams.get('category') || undefined;
    const is_active = request.nextUrl.searchParams.get('is_active') === 'true' ? true : undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const policies = await listPolicies(tenantId, { category, is_active, limit });
    return NextResponse.json({ policies });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Update policy
    if (action === 'update') {
      const { policy_id, ...updates } = body;
      if (!policy_id) return NextResponse.json({ error: 'policy_id required' }, { status: 400 });

      const policy = await updatePolicy(policy_id, updates);
      return NextResponse.json({ policy });
    }

    // Create policy (default)
    const policy = await createPolicy(tenantId, { ...body, created_by: user.id });
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
