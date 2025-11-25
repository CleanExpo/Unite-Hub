/**
 * GET /api/coalition/status
 * Retrieve coalition state, role assignment, synergy, safety status
 * Rate limit: 30 req/min (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'coalition-status',
      limit: 30,
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

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get active coalition proposals
    const { data: proposals, error: proposalsError } = await supabase
      .from('coalition_proposals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('proposal_status', ['proposed', 'accepted', 'executing'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (proposalsError) {
      console.error('Error fetching coalition proposals:', proposalsError);
      return NextResponse.json(
        { error: 'Failed to fetch coalition status' },
        { status: 500 }
      );
    }

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveCoalition: false,
        message: 'No active coalitions',
      });
    }

    const activeProposal = proposals[0];

    // Get coalition members and roles for the active coalition
    const { data: members, error: membersError } = await supabase
      .from('coalition_members')
      .select('*')
      .eq('proposal_id', activeProposal.id);

    const { data: roles, error: rolesError } = await supabase
      .from('coalition_roles')
      .select('*')
      .eq('proposal_id', activeProposal.id);

    if (membersError || rolesError) {
      console.error('Error fetching coalition members/roles:', membersError || rolesError);
    }

    // Get recent coalition history for context
    const { data: history } = await supabase
      .from('coalition_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      hasActiveCoalition: true,
      coalition: {
        proposalId: activeProposal.id,
        taskId: activeProposal.task_id,
        taskComplexity: activeProposal.task_complexity,
        agentIds: activeProposal.agent_ids,
        synergySc ore: activeProposal.synergy_score,
        recommendedLeader: activeProposal.recommended_leader,
        estimatedOutcome: activeProposal.estimated_outcome,
        safetyApproved: activeProposal.safety_approved,
        safetyVetoes: activeProposal.safety_vetoes,
        status: activeProposal.proposal_status,
        createdAt: activeProposal.created_at,
      },
      memberDetails: (members || []).map((m: any) => ({
        agentId: m.agent_id,
        primaryRole: m.primary_role,
        secondaryRoles: m.secondary_roles,
        capabilityMatch: m.capability_match,
        successRate: m.success_rate,
        status: m.member_status,
      })),
      roleAssignments: (roles || []).map((r: any) => ({
        agentId: r.agent_id,
        role: r.role,
        conflictDetected: r.conflict_detected,
        arbitrationUsed: r.arbitration_used,
        allocationScore: r.role_assignment_score,
      })),
      recentCoalitions: (history || [])
        .slice(0, 3)
        .map((h: any) => ({
          taskId: h.task_id,
          agentCount: (h.agent_ids || []).length,
          synergySc ore: h.synergy_score,
          outcome: h.outcome,
          completedAt: h.completed_at,
        })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Coalition status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
