import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getLearningRuns, getTenantInsightPackets, startLearningRun } from '@/lib/crossTenant/learningLoop';

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

    if (tenantId) {
      const packets = await getTenantInsightPackets(tenantId);
      return NextResponse.json({
        packets,
        confidence: 0.8,
        uncertaintyNotes: 'Insight packets derived from cross-tenant learning'
      });
    }

    const runs = await getLearningRuns();
    return NextResponse.json({
      runs,
      confidence: 0.85,
      uncertaintyNotes: 'Learning loop results depend on cross-tenant data availability'
    });
  } catch (error) {
    console.error('Learning loop API error:', error);
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

    const { runType } = await req.json();

    const runId = await startLearningRun(runType);

    return NextResponse.json({
      runId,
      confidence: 0.7,
      uncertaintyNotes: 'Learning run started. Results depend on cross-tenant data availability.'
    });
  } catch (error) {
    console.error('Start learning run error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
