/**
 * POST /api/negotiation/start
 *
 * Initiates a multi-agent negotiation session:
 * - Validates agent proposals
 * - Starts negotiation session
 * - Evaluates proposals and calculates consensus scores
 * - Detects conflicts
 * - Returns session state for arbitration
 *
 * Rate limit: 10 req/min (negotiation analysis is resource-intensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { agentNegotiationEngine } from '@/lib/negotiation';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 req/min
    const rateLimitResult = checkRateLimit({
      identifier: 'negotiation-start',
      limit: 10,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
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
    const { objective, participatingAgents, proposals } = body;

    if (!objective || typeof objective !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid objective parameter' },
        { status: 400 }
      );
    }

    if (!Array.isArray(participatingAgents) || participatingAgents.length === 0) {
      return NextResponse.json(
        { error: 'participatingAgents must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(proposals) || proposals.length === 0) {
      return NextResponse.json(
        { error: 'proposals must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate proposal structure
    for (const proposal of proposals) {
      if (!proposal.agentId || !proposal.action || proposal.confidence === undefined || proposal.riskScore === undefined) {
        return NextResponse.json(
          { error: 'Each proposal must have agentId, action, confidence, and riskScore' },
          { status: 400 }
        );
      }
    }

    // Start negotiation session
    const session = await agentNegotiationEngine.startNegotiationSession({
      workspaceId,
      objective,
      participatingAgents,
      proposals: proposals.map(p => ({
        agentId: p.agentId,
        proposalId: crypto.randomUUID(),
        action: p.action,
        actionType: p.actionType || 'execute',
        confidence: p.confidence,
        riskScore: p.riskScore,
        estimatedCost: p.estimatedCost || 0,
        estimatedBenefit: p.estimatedBenefit || 0,
        rationale: p.rationale || '',
        supportingEvidence: p.supportingEvidence || [],
        timestamp: new Date().toISOString(),
      })),
    });

    // Calculate overall consensus
    const overallConsensus = agentNegotiationEngine.calculateOverallConsensus(session.consensusScores);

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        objective: session.objective,
        participatingAgents: session.participatingAgents,
        proposalsCount: session.proposals.length,
        conflictsDetected: session.conflicts.length,
        overallConsensus,
        consensusAchieved: overallConsensus >= 65,
      },
      consensusScores: session.consensusScores.map(cs => ({
        agentId: cs.agentId,
        confidenceScore: cs.confidenceScore,
        riskAdjustedScore: cs.riskAdjustedScore,
        weightedScore: cs.weightedScore,
        overallConsensus: cs.overallConsensus,
      })),
      conflicts: session.conflicts.map(c => ({
        agentIds: c.agentIds,
        conflictType: c.conflictType,
        severity: c.severity,
      })),
      readyForArbitration: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Negotiation start error:', error);
    return NextResponse.json(
      { error: 'Failed to start negotiation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
