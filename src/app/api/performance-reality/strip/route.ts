/**
 * Performance Reality Strip API
 * Phase 81: Get Reality Strip data for Founder Intel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getRealityStripData,
  RealityScope,
} from '@/lib/performanceReality';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse query params
    const scope = (req.nextUrl.searchParams.get('scope') || 'global') as RealityScope;
    const clientId = req.nextUrl.searchParams.get('client_id') || undefined;

    const stripData = await getRealityStripData(scope, clientId);

    return NextResponse.json({
      success: true,
      data: stripData,
    });
  } catch (error) {
    console.error('Error in GET /api/performance-reality/strip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
