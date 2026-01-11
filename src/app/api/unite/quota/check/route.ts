/**
 * Quota Check API
 * Phase: D65
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkQuota, computeMonthlyQuota, listQuotaSnapshots } from '@/lib/unite/quotaService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const action = request.nextUrl.searchParams.get('action');

    // List quota snapshots
    if (action === 'list') {
      const filters = {
        feature_key: request.nextUrl.searchParams.get('feature_key') || undefined,
        status: request.nextUrl.searchParams.get('status') || undefined,
        limit: parseInt(request.nextUrl.searchParams.get('limit') || '30', 10),
      };
      const snapshots = await listQuotaSnapshots(tenantId, filters);
      return NextResponse.json({ snapshots });
    }

    // Check quota for feature
    const featureKey = request.nextUrl.searchParams.get('feature_key');
    const increment = parseInt(request.nextUrl.searchParams.get('increment') || '0', 10);

    if (!featureKey) return NextResponse.json({ error: 'feature_key required' }, { status: 400 });

    const quota = await checkQuota(tenantId, featureKey, increment);
    return NextResponse.json({ quota });
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
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    // Compute monthly quota snapshots
    const count = await computeMonthlyQuota(tenantId);
    return NextResponse.json({ count }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
