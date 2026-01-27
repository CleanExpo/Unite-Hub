/**
 * Google Search Console Sites API Route
 *
 * GET /api/integrations/google/search-console/sites - List all sites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSearchConsoleClient } from '@/lib/integrations/google/searchConsoleClient';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const searchConsole = getSearchConsoleClient();
    const sites = await searchConsole.listSites();

    return NextResponse.json({
      success: true,
      sites,
      total: sites.length,
    });
  } catch (error) {
    console.error('[Search Console API] Failed to fetch sites:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch sites from Search Console',
      },
      { status: 500 }
    );
  }
}
