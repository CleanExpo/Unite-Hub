/**
 * Generate Convergence Packet API
 * Phase 99: Generate learning packet
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { generatePacket } from '@/lib/regionConvergence';

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
    const { sourceRegionId, targetRegionId, patternSummary } = body;

    if (!sourceRegionId || !targetRegionId || !patternSummary) {
      return NextResponse.json(
        { error: 'sourceRegionId, targetRegionId, and patternSummary required' },
        { status: 400 }
      );
    }

    const packet = await generatePacket(sourceRegionId, targetRegionId, patternSummary);

    if (!packet) {
      return NextResponse.json({ error: 'Failed to generate packet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      packet,
    });
  } catch (error) {
    console.error('Failed to generate packet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
