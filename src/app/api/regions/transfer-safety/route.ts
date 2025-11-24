/**
 * Region Transfer Safety API
 * Phase 112: Get and create transfer assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getAssessments, assessTransfer } from '@/lib/regionTransferSafety';

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

    const sourceRegionId = req.nextUrl.searchParams.get('sourceRegionId') || undefined;
    const targetRegionId = req.nextUrl.searchParams.get('targetRegionId') || undefined;

    const assessments = await getAssessments(sourceRegionId, targetRegionId);

    return NextResponse.json({ success: true, assessments });
  } catch (error) {
    console.error('Failed:', error);
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

    const body = await req.json();
    const { sourceRegionId, targetRegionId, patternRef } = body;

    if (!sourceRegionId || !targetRegionId || !patternRef) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessment = await assessTransfer(sourceRegionId, targetRegionId, patternRef);

    if (!assessment) {
      return NextResponse.json({ error: 'Failed to assess transfer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
