/**
 * Market Trends API
 * Phase 97: Get regional market trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getTrends } from '@/lib/marketComparator';

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
    const trends = await getTrends(regionId);

    return NextResponse.json({
      success: true,
      trends,
      count: trends.length,
      disclaimer: 'Trends are derived from anonymized regional data and include uncertainty estimates.',
    });
  } catch (error) {
    console.error('Failed to get trends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
