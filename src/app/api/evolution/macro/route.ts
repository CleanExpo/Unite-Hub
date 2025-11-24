import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getProposals, createProposal, reviewProposal } from '@/lib/evolution/macro';

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
    const status = req.nextUrl.searchParams.get('status') || undefined;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const proposals = await getProposals(tenantId, status);

    return NextResponse.json({
      proposals,
      confidence: 0.85,
      uncertaintyNotes: 'Macro proposals require human review before execution'
    });
  } catch (error) {
    console.error('Macro evolution API error:', error);
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

    const { action, tenantId, title, description, scope, affectedEngines, proposalId, decision } = await req.json();

    if (action === 'create') {
      const proposal = await createProposal(tenantId, title, description, scope, affectedEngines);
      return NextResponse.json({
        proposal,
        confidence: 0.7,
        uncertaintyNotes: 'Proposal created. Requires thorough human review before execution.'
      });
    }

    if (action === 'review') {
      const success = await reviewProposal(proposalId, userData.user.id, decision);
      return NextResponse.json({
        success,
        confidence: 0.95,
        uncertaintyNotes: 'Review decision recorded'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Macro evolution action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
