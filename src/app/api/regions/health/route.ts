/**
 * Region Health API
 * Phase 92: Get health status of all regions
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  listRegionHealth,
  computeGlobalRisk,
  getRegionsByMetric,
} from '@/lib/globalScaling';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const sortBy = req.nextUrl.searchParams.get('sortBy') as 'capacity' | 'pressure' | 'budget' | 'warning' | null;
    const order = req.nextUrl.searchParams.get('order') as 'asc' | 'desc' | null;
    const includeRisk = req.nextUrl.searchParams.get('includeRisk') === 'true';

    // Get region health
    let health;
    if (sortBy) {
      health = await getRegionsByMetric(sortBy, order || 'desc');
    } else {
      health = await listRegionHealth();
    }

    // Optionally include global risk assessment
    let risk = null;
    if (includeRisk) {
      risk = await computeGlobalRisk();
    }

    return NextResponse.json({
      success: true,
      regions: health,
      globalRisk: risk,
    });
  } catch (error) {
    console.error('Failed to get region health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
