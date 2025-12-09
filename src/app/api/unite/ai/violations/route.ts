/**
 * AI Violations API
 * Phase: D63
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createViolation, listViolations, resolveViolation } from '@/lib/unite/aiGovernanceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const filters = {
      policy_id: request.nextUrl.searchParams.get('policy_id') || undefined,
      severity: request.nextUrl.searchParams.get('severity') || undefined,
      resolution_status: request.nextUrl.searchParams.get('resolution_status') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
    };

    const violations = await listViolations(tenantId, filters);
    return NextResponse.json({ violations });
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

    // Resolve violation
    if (action === 'resolve') {
      const { violation_id } = body;
      if (!violation_id) return NextResponse.json({ error: 'violation_id required' }, { status: 400 });

      const violation = await resolveViolation(violation_id, user.id);
      return NextResponse.json({ violation });
    }

    // Create violation (default)
    const violation = await createViolation(tenantId, body);
    return NextResponse.json({ violation }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
