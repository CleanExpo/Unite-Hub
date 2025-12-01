/**
 * POST /api/coalition/form
 * Initiate coalition formation for a task
 * Rate limit: 10 req/min (write operation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { coalitionFormationEngine } from '@/lib/coalition';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit('coalition-form', {
      requests: 10,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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

    // Parse request body
    const {
      workspaceId,
      taskId,
      taskComplexity,
      requiredCapabilities,
      candidateAgents,
    } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    if (!taskId || taskComplexity === undefined) {
      return NextResponse.json(
        { error: 'Missing taskId or taskComplexity' },
        { status: 400 }
      );
    }

    if (!candidateAgents || candidateAgents.length === 0) {
      return NextResponse.json(
        { error: 'At least one candidate agent required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Evaluate coalition
    const coalitionProposal = await coalitionFormationEngine.evaluateCoalition(
      taskId,
      taskComplexity,
      requiredCapabilities || [],
      candidateAgents
    );

    // Store in database
    const { data: stored, error: storeError } = await supabase
      .from('coalition_proposals')
      .insert({
        workspace_id: workspaceId,
        task_id: taskId,
        task_complexity: taskComplexity,
        agent_ids: coalitionProposal.agentIds,
        synergy_score: coalitionProposal.coalitionSynergyScore,
        recommended_leader: coalitionProposal.recommendedLeader,
        estimated_outcome: coalitionProposal.estimatedOutcome,
        safety_approved: coalitionProposal.safetyApproved,
        safety_vetoes: coalitionProposal.safetyVetoes,
        proposal_status: 'proposed',
      })
      .select();

    if (storeError) {
      console.error('Error storing coalition proposal:', storeError);
      return NextResponse.json(
        { error: 'Failed to store coalition proposal' },
        { status: 500 }
      );
    }

    // Archive the proposal
    await coalitionFormationEngine.archiveCoalitionProposal(coalitionProposal);

    return NextResponse.json({
      success: true,
      coalitionId: coalitionProposal.coalitionId,
      proposalId: stored?.[0]?.id,
      proposal: {
        taskId: coalitionProposal.taskId,
        agentIds: coalitionProposal.agentIds,
        synergyScore: coalitionProposal.coalitionSynergyScore,
        recommendedLeader: coalitionProposal.recommendedLeader,
        estimatedOutcome: coalitionProposal.estimatedOutcome,
        safetyApproved: coalitionProposal.safetyApproved,
        safetyVetoes: coalitionProposal.safetyVetoes,
        synergyCandidates: coalitionProposal.synergyCandidates,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Coalition formation error:', error);
    return NextResponse.json({ error: 'Failed to form coalition' }, { status: 500 });
  }
}
