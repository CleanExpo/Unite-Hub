/**
 * AI Compliance Review API
 * Phase: D63
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiReviewCompliance } from '@/lib/unite/aiGovernanceService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const { scope } = body;

    if (!scope) return NextResponse.json({ error: 'scope required' }, { status: 400 });

    const review = await aiReviewCompliance(tenantId, scope);
    return NextResponse.json({ review });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
