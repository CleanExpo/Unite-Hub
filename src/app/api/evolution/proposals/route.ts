/**
 * Evolution Proposals API
 * Phase 64: Manage system improvement proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EvolutionEngine } from '@/lib/evolution/evolutionEngine';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const engine = new EvolutionEngine();

    switch (type) {
      case 'pending':
        const pending = engine.getPendingProposals();
        return NextResponse.json({
          data: pending,
          total: pending.length,
        });

      case 'briefing':
        const briefing = engine.generateBriefing();
        return NextResponse.json({ data: briefing });

      case 'report':
        const report = engine.generateWeeklyReport();
        return NextResponse.json({ data: report });

      case 'scan':
        const scanResult = await engine.scanForImprovements();
        return NextResponse.json({ data: scanResult });

      default:
        const defaultBriefing = engine.generateBriefing();
        const defaultPending = engine.getPendingProposals();
        return NextResponse.json({
          data: {
            briefing: defaultBriefing,
            pending_proposals: defaultPending,
          },
          available_types: ['pending', 'briefing', 'report', 'scan'],
        });
    }
  } catch (error) {
    console.error('Evolution proposals API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, proposal_id, rationale } = body;

    const engine = new EvolutionEngine();

    switch (action) {
      case 'approve':
        if (!proposal_id) {
          return NextResponse.json(
            { error: 'proposal_id required' },
            { status: 400 }
          );
        }
        const approved = engine.approveProposal(proposal_id, rationale);
        return NextResponse.json({
          success: approved,
          message: approved ? 'Proposal approved' : 'Proposal not found',
        });

      case 'decline':
        if (!proposal_id || !rationale) {
          return NextResponse.json(
            { error: 'proposal_id and rationale required' },
            { status: 400 }
          );
        }
        const declined = engine.declineProposal(proposal_id, rationale);
        return NextResponse.json({
          success: declined,
          message: declined ? 'Proposal declined' : 'Proposal not found',
        });

      case 'implement':
        if (!proposal_id) {
          return NextResponse.json(
            { error: 'proposal_id required' },
            { status: 400 }
          );
        }
        const implemented = engine.markImplemented(proposal_id);
        return NextResponse.json({
          success: implemented,
          message: implemented ? 'Marked as implemented' : 'Proposal not found',
        });

      case 'weekly_tasks':
        const taskResult = await engine.runWeeklyTasks();
        return NextResponse.json({
          success: true,
          data: taskResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, decline, implement, weekly_tasks' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Evolution proposals POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
