import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getSessions, createSession, castVote, resolveSession } from '@/lib/council';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const sessions = await getSessions(tenantId);

    return NextResponse.json({
      sessions,
      confidence: 0.9,
      uncertaintyNotes: 'Council sessions with all agent votes logged'
    });
  } catch (error) {
    console.error('Council API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tenantId, topic, context, participatingAgents, sessionId, agentName, vote, confidence, reasoning } = await req.json();

    if (action === 'create') {
      const session = await createSession(tenantId, topic, context, participatingAgents);
      return NextResponse.json({
        session,
        confidence: 0.9,
        uncertaintyNotes: 'New council session created'
      });
    }

    if (action === 'vote') {
      const voteResult = await castVote(sessionId, agentName, vote, confidence, reasoning);
      return NextResponse.json({
        vote: voteResult,
        confidence: 0.85,
        uncertaintyNotes: 'Vote recorded with confidence band'
      });
    }

    if (action === 'resolve') {
      const recommendation = await resolveSession(sessionId);
      return NextResponse.json({
        recommendation,
        confidence: 0.8,
        uncertaintyNotes: 'Resolution includes dissent summary. No silent override of dissenting opinions.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Council action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
