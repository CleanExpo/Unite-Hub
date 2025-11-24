import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getMandates, createMandate, validateAction } from '@/lib/agentMandates';

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

    const mandates = await getMandates(tenantId);

    return NextResponse.json({
      mandates,
      confidence: 0.95,
      uncertaintyNotes: 'Agent mandates define autonomy levels and risk caps'
    });
  } catch (error) {
    console.error('Mandates API error:', error);
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

    const { action, tenantId, agentName, mandate, autonomyLevel, riskCaps, mandateId, actionType, actionDetails, estimatedRisk } = await req.json();

    if (action === 'create') {
      const result = await createMandate(tenantId, agentName, mandate, autonomyLevel, riskCaps);
      return NextResponse.json({
        mandate: result,
        confidence: 0.9,
        uncertaintyNotes: 'Mandate created with specified autonomy level'
      });
    }

    if (action === 'validate') {
      const result = await validateAction(mandateId, actionType, actionDetails, estimatedRisk);
      return NextResponse.json({
        validation: result,
        confidence: 0.85,
        uncertaintyNotes: 'Validation based on mandate constraints and risk caps'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Mandate action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
