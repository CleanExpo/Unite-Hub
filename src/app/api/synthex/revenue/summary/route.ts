/**
 * GET /api/synthex/revenue/summary
 *
 * Get revenue summary with stage breakdown and channel attribution.
 *
 * Query params:
 * - tenantId: string (required)
 * - from?: string (YYYY-MM-DD)
 * - to?: string (YYYY-MM-DD)
 * - cohortId?: string
 * - includeChannels?: boolean
 *
 * Phase: B15 - Revenue Attribution by Journey Stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getStageSummary,
  getChannelAttribution,
  getRevenueStats,
} from '@/lib/synthex/revenueService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const cohortId = searchParams.get('cohortId');
    const includeChannels = searchParams.get('includeChannels') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const dateRange = {
      from: from || undefined,
      to: to || undefined,
    };

    // Fetch stage summary and overall stats in parallel
    const [stageSummaryResult, statsResult] = await Promise.all([
      getStageSummary(tenantId, { ...dateRange, cohortId: cohortId || undefined }),
      getRevenueStats(tenantId, dateRange),
    ]);

    if (stageSummaryResult.error) throw stageSummaryResult.error;
    if (statsResult.error) throw statsResult.error;

    const response: {
      status: string;
      stages: typeof stageSummaryResult.data;
      stats: typeof statsResult.data;
      channels?: Awaited<ReturnType<typeof getChannelAttribution>>['data'];
    } = {
      status: 'ok',
      stages: stageSummaryResult.data || [],
      stats: statsResult.data,
    };

    // Optionally include channel attribution
    if (includeChannels) {
      const channelsResult = await getChannelAttribution(tenantId, dateRange);
      if (channelsResult.error) throw channelsResult.error;
      response.channels = channelsResult.data || [];
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[revenue/summary GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
