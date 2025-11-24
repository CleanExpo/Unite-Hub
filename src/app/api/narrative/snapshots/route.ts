/**
 * Narrative Snapshots API
 * Phase 110: Get and generate narratives
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getNarratives, generateNarrative } from '@/lib/narrativeIntelligence';

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

    const tenantId = req.nextUrl.searchParams.get('tenantId') || undefined;
    const scope = req.nextUrl.searchParams.get('scope') || undefined;

    const narratives = await getNarratives(tenantId, scope);

    return NextResponse.json({ success: true, narratives });
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
    const { scope, tenantId, regionId } = body;

    if (!scope) {
      return NextResponse.json({ error: 'scope required' }, { status: 400 });
    }

    const narrative = await generateNarrative(scope, tenantId, regionId);

    if (!narrative) {
      return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 });
    }

    return NextResponse.json({ success: true, narrative });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
