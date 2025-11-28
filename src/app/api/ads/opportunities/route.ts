/**
 * Ads Optimization Opportunities API
 *
 * Analyze campaigns and manage optimization suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { adsOptimizationService, OptimizationType, OpportunitySeverity } from '@/lib/ads';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const type = req.nextUrl.searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    if (type === 'stats') {
      const stats = await adsOptimizationService.getOpportunityStats(workspaceId);
      return NextResponse.json({ stats });
    }

    // Get open opportunities
    const campaignId = req.nextUrl.searchParams.get('campaignId') || undefined;
    const types = req.nextUrl.searchParams.get('types')?.split(',') as OptimizationType[] | undefined;
    const severities = req.nextUrl.searchParams.get('severities')?.split(',') as OpportunitySeverity[] | undefined;
    const minImpactScore = req.nextUrl.searchParams.get('minImpactScore');

    const opportunities = await adsOptimizationService.getOpenOpportunities(workspaceId, {
      campaignId,
      types,
      severities,
      minImpactScore: minImpactScore ? parseInt(minImpactScore) : undefined,
    });

    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (error) {
    console.error('[Ads] Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action, workspaceId, accountId, opportunityId, notes } = body;

    if (action === 'analyze') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required for analysis' }, { status: 400 });
      }

      const result = await adsOptimizationService.analyzeCampaigns(workspaceId, accountId, {
        lookbackDays: body.lookbackDays,
        comparisonPeriod: body.comparisonPeriod,
        enabledTypes: body.enabledTypes,
      });

      return NextResponse.json(result);
    }

    if (action === 'getRecommendation') {
      if (!opportunityId) {
        return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });
      }

      const recommendation = await adsOptimizationService.getAIRecommendation(opportunityId);

      return NextResponse.json({ recommendation });
    }

    if (action === 'review') {
      if (!opportunityId || !body.reviewAction) {
        return NextResponse.json({ error: 'opportunityId and reviewAction required' }, { status: 400 });
      }

      await adsOptimizationService.reviewOpportunity(
        opportunityId,
        body.reviewAction,
        userId!,
        notes
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'markApplied') {
      if (!opportunityId) {
        return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });
      }

      const result = await adsOptimizationService.markAsApplied(opportunityId, userId!, notes);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Ads] Error processing opportunity action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
