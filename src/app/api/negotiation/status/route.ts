/**
 * GET /api/negotiation/status
 * Returns active negotiation state and metadata
 * Rate limit: 30 req/min (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { agentNegotiationEngine } from '@/lib/negotiation';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'negotiation-status',
      limit: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get active negotiation
    const session = await agentNegotiationEngine.getActiveNegotiation({ workspaceId });

    if (!session) {
      return NextResponse.json({
        success: true,
        hasActiveNegotiation: false,
        message: 'No active negotiation sessions',
      });
    }

    // Get decision history
    const { data: decisions } = await supabase
      .from('agent_arbitration_decisions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    const overallConsensus = agentNegotiationEngine.calculateOverallConsensus(session.consensusScores);

    return NextResponse.json({
      success: true,
      hasActiveNegotiation: true,
      session: {
        sessionId: session.sessionId,
        objective: session.objective,
        status: session.status,
        participatingAgents: session.participatingAgents,
        proposalsCount: session.proposals.length,
        conflictsCount: session.conflicts.length,
        overallConsensus,
        consensusAchieved: overallConsensus >= 65,
        createdAt: session.createdAt,
      },
      consensusBreakdown: session.consensusScores.map(cs => ({
        agentId: cs.agentId,
        score: cs.overallConsensus,
      })),
      recentDecisions: (decisions || []).map(d => ({
        decisionId: d.decision_id,
        selectedAgent: d.selected_agent_id,
        consensusPercentage: d.consensus_percentage,
        outcome: d.predicted_outcome,
        createdAt: d.created_at,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Negotiation status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
