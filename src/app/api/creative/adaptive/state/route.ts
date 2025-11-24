/**
 * Creative Adaptive State API
 * Phase 98: Get adaptive creative state
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getAdaptiveState } from '@/lib/adaptiveCreative';

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
    const regionId = req.nextUrl.searchParams.get('regionId') || undefined;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const state = await getAdaptiveState(tenantId, regionId);

    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    console.error('Failed to get state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
