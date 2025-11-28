/**
 * Ads Campaigns API
 *
 * Fetch campaigns and sync campaign data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { adsIngestionService, CampaignStatus } from '@/lib/ads';

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
    const accountId = req.nextUrl.searchParams.get('accountId');
    const status = req.nextUrl.searchParams.get('status') as CampaignStatus | null;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ad_campaigns')
      .select('*, ad_accounts(provider, name)', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: campaigns, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      campaigns,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Ads] Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { action, accountId, campaignId, startDate, endDate } = body;

    if (action === 'sync') {
      if (!accountId) {
        return NextResponse.json({ error: 'accountId required for sync' }, { status: 400 });
      }

      const result = await adsIngestionService.syncCampaigns(accountId, {
        fullSync: body.fullSync,
      });

      return NextResponse.json(result);
    }

    if (action === 'syncMetrics') {
      if (!accountId) {
        return NextResponse.json({ error: 'accountId required for metrics sync' }, { status: 400 });
      }

      const result = await adsIngestionService.syncMetrics(accountId, {
        campaignId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return NextResponse.json(result);
    }

    if (action === 'getStats') {
      const workspaceId = body.workspaceId;
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required for stats' }, { status: 400 });
      }

      const stats = await adsIngestionService.getPerformanceStats(workspaceId, {
        accountId,
        campaignId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return NextResponse.json({ stats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Ads] Error processing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
