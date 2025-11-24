/**
 * Franchise Opportunities API
 * Phase 113: Get and create franchise opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getOpportunities, createOpportunity } from '@/lib/franchiseOpportunities';

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

    const parentAgencyId = req.nextUrl.searchParams.get('parentAgencyId');
    if (!parentAgencyId) {
      return NextResponse.json({ error: 'parentAgencyId required' }, { status: 400 });
    }

    const opportunities = await getOpportunities(parentAgencyId);

    return NextResponse.json({ success: true, opportunities });
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
    const { parentAgencyId, scope, payload, targetRegions, targetAgencies } = body;

    if (!parentAgencyId || !scope || !payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const opportunity = await createOpportunity(
      parentAgencyId,
      scope,
      payload,
      targetRegions || [],
      targetAgencies || []
    );

    if (!opportunity) {
      return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
