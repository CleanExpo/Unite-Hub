/**
 * GET /api/marketplace/status
 * Returns current marketplace auction status and bid results
 * Rate limit: 30 req/min (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'marketplace-status',
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
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get active auction
    const { data: activeAuctionData, error: auctionError } = await supabase
      .from('task_marketplace_auctions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['PENDING', 'BIDDING', 'EVALUATING'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (auctionError) {
      console.error('Error fetching auction:', auctionError);
      return NextResponse.json(
        { error: 'Failed to fetch auction status' },
        { status: 500 }
      );
    }

    if (!activeAuctionData || activeAuctionData.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveAuction: false,
        message: 'No active marketplace auctions',
      });
    }

    const auction = activeAuctionData[0];

    // Get bids for this auction
    const { data: bids, error: bidsError } = await supabase
      .from('task_marketplace_bids')
      .select('*')
      .eq('auction_id', auction.id)
      .order('final_bid', { ascending: false });

    if (bidsError) {
      console.error('Error fetching bids:', bidsError);
    }

    // Get recent completed auctions for analytics
    const { data: recentAuctions } = await supabase
      .from('task_marketplace_auctions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      hasActiveAuction: true,
      auction: {
        auctionId: auction.id,
        taskId: auction.task_id,
        taskTitle: auction.task_title,
        taskComplexity: auction.task_complexity,
        status: auction.status,
        winningAgent: auction.winning_agent_id,
        winningBid: auction.winning_bid,
        pricePaid: auction.price_paid,
        totalBidsReceived: auction.total_bids_received,
        disqualifiedCount: auction.disqualified_count,
        bundleUsed: auction.bundle_used,
        safetyFilterTriggered: auction.safety_filter_triggered,
        createdAt: auction.created_at,
      },
      bidDetails: (bids || []).map((bid: any) => ({
        agentId: bid.agent_id,
        rawScore: bid.raw_score,
        finalBid: bid.final_bid,
        risk: bid.risk_score,
        confidence: bid.confidence,
        disqualified: bid.disqualified,
        disqualificationReason: bid.disqualification_reason,
      })),
      recentAuctions: (recentAuctions || []).map((a: any) => ({
        auctionId: a.id,
        taskTitle: a.task_title,
        winningAgent: a.winning_agent_id,
        winningBid: a.winning_bid,
        outcome: a.outcome,
        completedAt: a.completed_at,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketplace status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
