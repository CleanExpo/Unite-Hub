/**
 * Market Baselines API
 * Phase 97: Get anonymized market baselines
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getBaselines } from '@/lib/marketComparator';

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

    const regionId = req.nextUrl.searchParams.get('regionId') || undefined;
    const baselines = await getBaselines(regionId);

    return NextResponse.json({
      success: true,
      baselines,
      count: baselines.length,
      disclaimer: 'All baselines are anonymized aggregates. Individual tenant data is never exposed.',
    });
  } catch (error) {
    console.error('Failed to get baselines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
