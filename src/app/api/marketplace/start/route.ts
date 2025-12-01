/**
 * POST /api/marketplace/start
 * Starts a new marketplace auction for a task
 * Rate limit: 10 req/min (auction analysis is resource-intensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { taskMarketplaceEngine } from '@/lib/marketplace';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit('marketplace-start', {
      requests: 10,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
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
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { taskId, title, description, complexity, domains, agentBids } = body;

    if (!taskId || !title || complexity === undefined || !Array.isArray(domains)) {
      return NextResponse.json(
        { error: 'Missing required: taskId, title, complexity, domains' },
        { status: 400 }
      );
    }

    if (!Array.isArray(agentBids) || agentBids.length === 0) {
      return NextResponse.json(
        { error: 'agentBids must be non-empty array' },
        { status: 400 }
      );
    }

    // Validate bid structure
    for (const bid of agentBids) {
      if (
        !bid.agentId ||
        bid.capabilityMatch === undefined ||
        bid.confidence === undefined ||
        bid.pastSuccessRate === undefined ||
        bid.contextRelevance === undefined ||
        bid.risk === undefined ||
        bid.activeTasks === undefined
      ) {
        return NextResponse.json(
          {
            error: 'Each bid must have: agentId, capabilityMatch, confidence, pastSuccessRate, contextRelevance, risk, activeTasks',
          },
          { status: 400 }
        );
      }
    }

    // Create and run auction
    const task = {
      taskId,
      workspaceId,
      title,
      description: description || '',
      complexity,
      domains,
      timeoutMs: 5000,
      createdAt: new Date().toISOString(),
    };

    const auctionSession = await taskMarketplaceEngine.runAuction(task, agentBids);

    // Store auction in database
    const supabase = await getSupabaseServer();
    const { error: storeError } = await supabase.from('task_marketplace_auctions').insert({
      workspace_id: workspaceId,
      task_id: taskId,
      task_title: title,
      task_complexity: complexity,
      status: auctionSession.status,
      winning_agent_id: auctionSession.winningAgentId,
      winning_bid: auctionSession.winningBid || 0,
      price_paid: auctionSession.pricePaid || 0,
      bundle_used: auctionSession.bundleUsed,
      safety_filter_triggered: auctionSession.safetyFilterTriggered,
      total_bids_received: auctionSession.bids.length,
      disqualified_count: auctionSession.bids.filter((b) => b.disqualified).length,
      explainability_report: auctionSession.explainabilityReport,
      created_at: new Date().toISOString(),
    });

    if (storeError) {
      console.error('Database store error:', storeError);
      return NextResponse.json(
        { error: 'Failed to store auction result' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      auction: {
        auctionId: auctionSession.auctionId,
        taskId: auctionSession.taskId,
        status: auctionSession.status,
        winningAgent: auctionSession.winningAgentId,
        winningBid: auctionSession.winningBid,
        pricePaid: auctionSession.pricePaid,
        totalBidsReceived: auctionSession.bids.length,
        disqualifiedCount: auctionSession.bids.filter((b) => b.disqualified).length,
        bundleUsed: auctionSession.bundleUsed,
        safetyFilterTriggered: auctionSession.safetyFilterTriggered,
      },
      bids: auctionSession.bids.map((bid) => ({
        agentId: bid.agentId,
        rawScore: bid.rawScore.toFixed(2),
        finalBid: bid.finalBid.toFixed(2),
        risk: bid.risk,
        confidence: bid.confidence,
        disqualified: bid.disqualified,
        disqualificationReason: bid.disqualificationReason,
      })),
      rationale: auctionSession.explainabilityReport?.rationale,
      alternatives: auctionSession.explainabilityReport?.alternatives,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketplace start error:', error);
    return NextResponse.json(
      { error: 'Failed to start auction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
