/**
 * Arbitration Events API
 * Phase 102: Get decision arbitration events
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getArbitrationEvents } from '@/lib/arbitration';

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
    const status = req.nextUrl.searchParams.get('status') || undefined;

    const events = await getArbitrationEvents(tenantId, status);

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('Failed to get arbitration events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
