/**
 * Executive Briefing API
 * Phase 62: Get executive briefings and system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExecutiveBrain } from '@/lib/executive/executiveBrain';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const brain = new ExecutiveBrain();

    switch (type) {
      case 'briefing':
        const briefing = await brain.generateBriefing();
        return NextResponse.json({ data: briefing });

      case 'agents':
        const agents = brain.getRegistry().getAllAgents();
        return NextResponse.json({ data: agents });

      case 'health':
        const health = brain.getRegistry().getSystemHealth();
        return NextResponse.json({ data: health });

      case 'decisions':
        const pending = brain.getPendingDecisions();
        return NextResponse.json({ data: pending });

      default:
        const defaultBriefing = await brain.generateBriefing();
        const defaultAgents = brain.getRegistry().getAllAgents();
        return NextResponse.json({
          data: {
            briefing: defaultBriefing,
            agents: defaultAgents,
          },
          available_types: ['briefing', 'agents', 'health', 'decisions'],
        });
    }
  } catch (error) {
    console.error('Executive briefing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, decision_id } = body;

    const brain = new ExecutiveBrain();

    switch (action) {
      case 'approve':
        if (!decision_id) {
          return NextResponse.json(
            { error: 'decision_id required' },
            { status: 400 }
          );
        }
        const approved = brain.approveDecision(decision_id);
        return NextResponse.json({
          success: approved,
          message: approved ? 'Decision approved' : 'Decision not found or already processed',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Executive briefing POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
