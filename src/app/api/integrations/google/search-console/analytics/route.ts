/**
 * Google Search Console Analytics API Route
 *
 * POST /api/integrations/google/search-console/analytics - Query search analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSearchConsoleClient } from '@/lib/integrations/google/searchConsoleClient';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const body = await request.json();
    const { siteUrl, startDate, endDate, dimensions, rowLimit, type } = body;

    if (!siteUrl || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'siteUrl, startDate, and endDate are required',
        },
        { status: 400 }
      );
    }

    const searchConsole = getSearchConsoleClient();

    // Handle different query types
    let data;

    switch (type) {
      case 'top-queries':
        data = await searchConsole.getTopQueries(siteUrl, startDate, endDate, rowLimit);
        break;

      case 'top-pages':
        data = await searchConsole.getTopPages(siteUrl, startDate, endDate, rowLimit);
        break;

      case 'by-country':
        data = await searchConsole.getPerformanceByCountry(siteUrl, startDate, endDate);
        break;

      case 'by-device':
        data = await searchConsole.getPerformanceByDevice(siteUrl, startDate, endDate);
        break;

      default:
        // Custom query
        data = await searchConsole.querySearchAnalytics({
          siteUrl,
          startDate,
          endDate,
          dimensions,
          rowLimit,
        });
    }

    return NextResponse.json({
      success: true,
      data,
      total: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('[Search Console API] Failed to query analytics:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to query Search Console analytics',
      },
      { status: 500 }
    );
  }
}
