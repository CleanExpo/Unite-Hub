/**
 * Convergence Packets API
 * Phase 99: Get learning packets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getPackets } from '@/lib/regionConvergence';

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
    const status = req.nextUrl.searchParams.get('status') || undefined;

    const packets = await getPackets({ sourceRegionId, targetRegionId, status });

    return NextResponse.json({
      success: true,
      packets,
      count: packets.length,
    });
  } catch (error) {
    console.error('Failed to get packets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
