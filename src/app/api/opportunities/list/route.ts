/**
 * Opportunities List API
 * Phase 95: List opportunities for tenant or region
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  listWindowsForTenant,
  listWindowsForRegion,
  generateFounderOpportunityReport,
} from '@/lib/predictive';

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

    // Parse query params
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const regionId = req.nextUrl.searchParams.get('regionId');
    const windowType = req.nextUrl.searchParams.get('windowType') as '7_day' | '14_day' | '30_day' | null;
    const category = req.nextUrl.searchParams.get('category');
    const status = req.nextUrl.searchParams.get('status');
    const includeReport = req.nextUrl.searchParams.get('includeReport') === 'true';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    let windows;
    let report = null;

    if (regionId) {
      windows = await listWindowsForRegion(regionId, { limit });
    } else if (tenantId) {
      windows = await listWindowsForTenant(tenantId, {
        windowType: windowType || undefined,
        category: category as 'creative' | 'posting' | 'campaign' | 'brand' | 'engagement' | 'audience' | 'timing' | undefined,
        status: status || undefined,
        limit,
        offset,
      });

      if (includeReport) {
        report = await generateFounderOpportunityReport(tenantId);
      }
    } else {
      return NextResponse.json(
        { error: 'tenantId or regionId required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      windows,
      report,
      count: windows.length,
    });
  } catch (error) {
    console.error('Failed to list opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
