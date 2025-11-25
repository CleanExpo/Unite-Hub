/**
 * GET /api/marketplace/history
 * Returns auction history and marketplace analytics
 * Rate limit: 30 req/min (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'marketplace-history',
      limit: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = req.nextUrl.searchParams.get('limit') || '50';

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get completed auctions
    const { data: completedAuctions, error: auctionsError } = await supabase
      .from('task_marketplace_auctions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(parseInt(limit));

    if (auctionsError) {
      console.error('Error fetching auctions:', auctionsError);
      return NextResponse.json(
        { error: 'Failed to fetch auction history' },
        { status: 500 }
      );
    }

    // Calculate analytics
    let totalAuctions = 0;
    let successCount = 0;
    let totalBids = 0;
    let totalAuctionValue = 0;
    let agentWins: Record<string, number> = {};
    let safetyFiltersCount = 0;
    let bundlesCount = 0;

    (completedAuctions || []).forEach((auction: any) => {
      totalAuctions++;
      if (auction.outcome === 'success') successCount++;
      totalBids += auction.total_bids_received || 0;
      totalAuctionValue += auction.winning_bid || 0;

      if (auction.winning_agent_id) {
        agentWins[auction.winning_agent_id] =
          (agentWins[auction.winning_agent_id] || 0) + 1;
      }

      if (auction.safety_filter_triggered) safetyFiltersCount++;
      if (auction.bundle_used) bundlesCount++;
    });

    // Get bid details for recent auctions
    const recentAuctionIds = (completedAuctions || [])
      .slice(0, 10)
      .map((a: any) => a.id);

    const { data: recentBids } = await supabase
      .from('task_marketplace_bids')
      .select('auction_id, agent_id, final_bid, disqualified, risk_score')
      .in('auction_id', recentAuctionIds);

    // Group bids by auction
    const bidsByAuction: Record<string, any[]> = {};
    (recentBids || []).forEach((bid: any) => {
      if (!bidsByAuction[bid.auction_id]) {
        bidsByAuction[bid.auction_id] = [];
      }
      bidsByAuction[bid.auction_id].push(bid);
    });

    return NextResponse.json({
      success: true,
      analytics: {
        totalAuctions,
        successRate: totalAuctions > 0 ? (successCount / totalAuctions) * 100 : 0,
        totalBids,
        avgBidsPerAuction: totalAuctions > 0 ? totalBids / totalAuctions : 0,
        avgAuctionValue: totalAuctions > 0 ? totalAuctionValue / totalAuctions : 0,
        safetyFiltersTriggered: safetyFiltersCount,
        bundlesUsed: bundlesCount,
        agentWinStats: Object.entries(agentWins).map(([agentId, wins]) => ({
          agentId,
          wins,
          winRate: totalAuctions > 0 ? (wins / totalAuctions) * 100 : 0,
        })),
      },
      recentAuctions: (completedAuctions || []).map((auction: any) => ({
        auctionId: auction.id,
        taskTitle: auction.task_title,
        taskComplexity: auction.task_complexity,
        winningAgent: auction.winning_agent_id,
        winningBid: auction.winning_bid,
        pricePaid: auction.price_paid,
        outcome: auction.outcome,
        totalBids: auction.total_bids_received,
        disqualifiedCount: auction.disqualified_count,
        safetyFilterTriggered: auction.safety_filter_triggered,
        bundleUsed: auction.bundle_used,
        completedAt: auction.completed_at,
        bidDetails: bidsByAuction[auction.id] || [],
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketplace history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
