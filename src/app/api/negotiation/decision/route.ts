/**
 * POST /api/negotiation/decision
 * Publishes arbitration decision and triggers coordinated agent action
 * Rate limit: 10 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { arbitrationModel, negotiationArchiveBridge } from '@/lib/negotiation';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'negotiation-decision',
      limit: 10,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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

    const body = await req.json();
    const { sessionId, proposals } = body;

    if (!sessionId || !Array.isArray(proposals) || proposals.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, proposals' },
        { status: 400 }
      );
    }

    // Run arbitration
    const decision = await arbitrationModel.arbitrate({
      workspaceId,
      sessionId,
      proposals,
    });

    // Archive negotiation
    const startTime = Date.now();
    await negotiationArchiveBridge.archiveNegotiationSession({
      workspaceId,
      sessionId,
      agentParticipants: proposals.map(p => p.agentId),
      objective: body.objective || 'Multi-agent coordination',
      proposalsCount: proposals.length,
      conflictsDetected: 0,
      consensusAchieved: decision.consensusAchieved,
      consensusPercentage: decision.consensusPercentage,
      selectedAgent: decision.selectedAgentId,
      selectedAction: decision.selectedAction,
      decisionOutcome: decision.predictedOutcome === 'high_confidence' ? 'success' : 'partial_success',
      negotiationTranscript: decision.arbitrationRationale,
      startTime,
    });

    return NextResponse.json({
      success: true,
      decision: {
        decisionId: decision.decisionId,
        selectedAgent: decision.selectedAgentId,
        selectedAction: decision.selectedAction,
        confidenceScore: decision.confidenceScore,
        riskScore: decision.riskScore,
        consensusPercentage: decision.consensusPercentage,
        predictedOutcome: decision.predictedOutcome,
        safetyCheckPassed: decision.safetyCheckPassed,
      },
      rationale: decision.arbitrationRationale,
      alternatives: decision.alternativeActions,
      timestamp: decision.timestamp,
    });
  } catch (error) {
    console.error('Negotiation decision error:', error);
    return NextResponse.json({ error: 'Failed to arbitrate' }, { status: 500 });
  }
}
