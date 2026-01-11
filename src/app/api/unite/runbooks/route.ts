/**
 * Runbooks API
 * Phase: D60
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRunbook, listRunbooks, createStep } from '@/lib/unite/runbookService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const category = request.nextUrl.searchParams.get('category') || undefined;
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const runbooks = await listRunbooks(tenantId, { category, status, limit });
    return NextResponse.json({ runbooks });
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

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    if (action === 'create_step') {
      const step = await createStep(body);
      return NextResponse.json({ step }, { status: 201 });
    }

    const runbook = await createRunbook(tenantId, body);
    return NextResponse.json({ runbook }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
