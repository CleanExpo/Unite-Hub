/**
 * GET /api/synthex/analytics/summary
 *
 * Get combined analytics summary for a tenant.
 *
 * Query params:
 * - tenantId: string (required)
 * - days?: number (default 30)
 *
 * Response:
 * {
 *   status: 'ok'
 *   analytics: CombinedAnalytics
 *   topCampaigns?: Array
 *   channelComparison?: Record
 * }
 *
 * Phase: B7 - Synthex Advanced Analytics + Attribution Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getCombinedAnalytics,
  getTopCampaigns,
  getChannelComparison,
} from '@/lib/synthex/analyticsEngine';
import { getEngagementScores } from '@/lib/synthex/attributionService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '30');
    const includeTopCampaigns = searchParams.get('topCampaigns') !== 'false';
    const includeChannels = searchParams.get('channels') !== 'false';
    const includeEngagement = searchParams.get('engagement') !== 'false';

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

    // Get combined analytics
    const analyticsResult = await getCombinedAnalytics(tenantId, { days });
    if (analyticsResult.error) {
      throw analyticsResult.error;
    }

    const response: Record<string, unknown> = {
      status: 'ok',
      analytics: analyticsResult.data,
    };

    // Optionally include top campaigns
    if (includeTopCampaigns) {
      const topResult = await getTopCampaigns(tenantId, { limit: 5 });
      if (!topResult.error) {
        response.topCampaigns = topResult.data;
      }
    }

    // Optionally include channel comparison
    if (includeChannels) {
      const channelResult = await getChannelComparison(tenantId, { days });
      if (!channelResult.error) {
        response.channelComparison = channelResult.data;
      }
    }

    // Optionally include top engaged contacts
    if (includeEngagement) {
      const engagementResult = await getEngagementScores(tenantId, {
        limit: 10,
        orderBy: 'score',
      });
      if (!engagementResult.error) {
        response.topEngaged = engagementResult.data;
      }
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[analytics/summary GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
