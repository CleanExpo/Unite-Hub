/**
 * GET /api/founder/analytics/clarity?siteId=xxx
 *
 * Returns Microsoft Clarity insights for a given site.
 * Currently returns realistic mock data — swap `buildMockInsights()` for
 * real Clarity API calls once project IDs and tokens are configured.
 *
 * Clarity API reference: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
 *
 * UNI-1456: Microsoft Clarity — heatmaps + session recordings
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RageClick {
  page: string;
  clicks: number;
  element: string;
}

export interface DeadClick {
  page: string;
  clicks: number;
  element: string;
}

export interface TopPage {
  path: string;
  sessions: number;
}

export interface ScrollDepth {
  p25: number;
  p50: number;
  p75: number;
}

export interface ClarityInsights {
  siteId: string;
  rageClicks: RageClick[];
  deadClicks: DeadClick[];
  sessionRecordings: number;
  scrollDepth: ScrollDepth;
  topPages: TopPage[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Per-site mock data (realistic baseline — swap for live API)
// ---------------------------------------------------------------------------

const SITE_MOCK: Record<string, Partial<ClarityInsights>> = {
  'unite-group': {
    rageClicks: [
      { page: '/pricing', clicks: 47, element: '.cta-button' },
      { page: '/contact', clicks: 31, element: '#submit-btn' },
    ],
    deadClicks: [
      { page: '/features', clicks: 23, element: '.tab-inactive' },
      { page: '/about', clicks: 14, element: '.hero-image' },
    ],
    sessionRecordings: 142,
    scrollDepth: { p25: 45, p50: 62, p75: 78 },
    topPages: [
      { path: '/', sessions: 89 },
      { path: '/pricing', sessions: 34 },
      { path: '/features', sessions: 27 },
    ],
  },
  'nrpg': {
    rageClicks: [
      { page: '/services', clicks: 19, element: '.read-more' },
    ],
    deadClicks: [
      { page: '/home', clicks: 8, element: '.slider-arrow' },
    ],
    sessionRecordings: 78,
    scrollDepth: { p25: 38, p50: 55, p75: 70 },
    topPages: [
      { path: '/', sessions: 56 },
      { path: '/services', sessions: 22 },
    ],
  },
  'dr': {
    rageClicks: [
      { page: '/get-started', clicks: 34, element: '.book-now' },
    ],
    deadClicks: [
      { page: '/faq', clicks: 11, element: '.accordion-icon' },
    ],
    sessionRecordings: 95,
    scrollDepth: { p25: 42, p50: 59, p75: 74 },
    topPages: [
      { path: '/', sessions: 63 },
      { path: '/get-started', sessions: 41 },
    ],
  },
};

function buildMockInsights(siteId: string): ClarityInsights {
  const base = SITE_MOCK[siteId] ?? SITE_MOCK['unite-group'];

  return {
    siteId,
    rageClicks:        base.rageClicks         ?? [],
    deadClicks:        base.deadClicks          ?? [],
    sessionRecordings: base.sessionRecordings   ?? 0,
    scrollDepth:       base.scrollDepth         ?? { p25: 0, p50: 0, p75: 0 },
    topPages:          base.topPages            ?? [],
    generatedAt:       new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 },
      );
    }

    // TODO: Replace with real Clarity API call when tokens are available:
    //
    //   const clarityProjectId = process.env[`CLARITY_PROJECT_${siteId.toUpperCase()}`];
    //   const clarityToken     = process.env.CLARITY_API_TOKEN;
    //   const res = await fetch(
    //     `https://www.clarity.ms/api/v1/projects/${clarityProjectId}/heatmaps`,
    //     { headers: { Authorization: `Bearer ${clarityToken}` } },
    //   );
    //   const data = await res.json();

    const insights = buildMockInsights(siteId);

    return NextResponse.json(insights);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[analytics/clarity GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
