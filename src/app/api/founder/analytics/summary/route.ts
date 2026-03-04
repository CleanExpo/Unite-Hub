/**
 * GET /api/founder/analytics/summary
 *
 * Returns the unified analytics summary for all Unite-Group sites.
 * Currently returns realistic mock data — swap `buildMockSummary()` for
 * real Plausible / GA4 API calls once keys are configured.
 *
 * UNI-1454
 */

import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiteSummary {
  id: string;
  name: string;
  domain: string;
  colour: string;
  visitors: {
    today: number;
    week: number;
    month: number;
  };
  sparkline: number[]; // last 7 days relative values (0–100)
  bounceRate: number; // percentage e.g. 42.5
  avgSessionSeconds: number;
  topPage: { path: string; views: number };
  sources: {
    organic: number;
    direct: number;
    referral: number;
    social: number;
  };
  plausibleUrl?: string;
  ga4Url?: string;
}

export interface RankingRow {
  keyword: string;
  site: string;
  position: number;
  impressions: number;
  clicks: number;
  change: number; // positive = improved (lower position number)
}

export interface AnalyticsSummary {
  generatedAt: string; // ISO
  aggregate: {
    visitorsToday: number;
    visitorsWeek: number;
    visitorsMonth: number;
    revenueAttributedAud: number;
    visitorsWeekChange: number; // % vs prior week
    visitorsMonthChange: number; // % vs prior month
    revenueChange: number;
  };
  sites: SiteSummary[];
  rankings: RankingRow[];
}

// ---------------------------------------------------------------------------
// Mock data builder
// ---------------------------------------------------------------------------

function buildMockSummary(): AnalyticsSummary {
  const now = new Date();

  const sites: SiteSummary[] = [
    {
      id: 'unite-group',
      name: 'Unite-Group Nexus',
      domain: 'unite-group.in',
      colour: '#00F5FF',
      visitors: { today: 312, week: 1_847, month: 7_203 },
      sparkline: [48, 55, 62, 58, 71, 80, 100],
      bounceRate: 38.4,
      avgSessionSeconds: 187,
      topPage: { path: '/founder/dashboard', views: 423 },
      sources: { organic: 42, direct: 31, referral: 18, social: 9 },
      plausibleUrl: 'https://plausible.io/unite-group.in',
    },
    {
      id: 'disaster-recovery',
      name: 'Disaster Recovery',
      domain: 'disasterrecovery.com.au',
      colour: '#00FF88',
      visitors: { today: 184, week: 1_102, month: 4_815 },
      sparkline: [60, 55, 70, 65, 72, 68, 85],
      bounceRate: 44.1,
      avgSessionSeconds: 142,
      topPage: { path: '/services/water-damage', views: 298 },
      sources: { organic: 58, direct: 22, referral: 12, social: 8 },
      plausibleUrl: 'https://plausible.io/disasterrecovery.com.au',
    },
    {
      id: 'carsi',
      name: 'CARSI',
      domain: 'carsi.com.au',
      colour: '#FFB800',
      visitors: { today: 97, week: 641, month: 2_590 },
      sparkline: [30, 38, 42, 50, 45, 60, 72],
      bounceRate: 51.7,
      avgSessionSeconds: 118,
      topPage: { path: '/car-storage', views: 187 },
      sources: { organic: 35, direct: 40, referral: 14, social: 11 },
      plausibleUrl: 'https://plausible.io/carsi.com.au',
    },
    {
      id: 'ato-ai',
      name: 'ATO Tax Optimiser',
      domain: 'ato-ai.app',
      colour: '#FF00FF',
      visitors: { today: 53, week: 389, month: 1_620 },
      sparkline: [20, 25, 30, 28, 42, 55, 65],
      bounceRate: 62.3,
      avgSessionSeconds: 95,
      topPage: { path: '/calculator', views: 142 },
      sources: { organic: 28, direct: 35, referral: 22, social: 15 },
      plausibleUrl: 'https://plausible.io/ato-ai.app',
    },
    {
      id: 'restore-assist',
      name: 'RestoreAssist',
      domain: 'restoreassist.com.au',
      colour: '#FF4444',
      visitors: { today: 78, week: 521, month: 2_108 },
      sparkline: [40, 44, 48, 52, 49, 61, 78],
      bounceRate: 47.9,
      avgSessionSeconds: 131,
      topPage: { path: '/emergency-response', views: 211 },
      sources: { organic: 50, direct: 28, referral: 15, social: 7 },
      plausibleUrl: 'https://plausible.io/restoreassist.com.au',
    },
  ];

  const totalToday = sites.reduce((s, x) => s + x.visitors.today, 0);
  const totalWeek = sites.reduce((s, x) => s + x.visitors.week, 0);
  const totalMonth = sites.reduce((s, x) => s + x.visitors.month, 0);

  const rankings: RankingRow[] = [
    { keyword: 'AI CRM Australia', site: 'unite-group.in', position: 4, impressions: 2_840, clicks: 187, change: 2 },
    { keyword: 'CRM for small business Australia', site: 'unite-group.in', position: 7, impressions: 1_920, clicks: 94, change: 1 },
    { keyword: 'water damage restoration Brisbane', site: 'disasterrecovery.com.au', position: 2, impressions: 3_100, clicks: 412, change: 3 },
    { keyword: 'car storage Gold Coast', site: 'carsi.com.au', position: 5, impressions: 1_450, clicks: 88, change: -1 },
    { keyword: 'ATO tax deductions calculator', site: 'ato-ai.app', position: 9, impressions: 4_200, clicks: 203, change: 4 },
    { keyword: 'flood restoration company Brisbane', site: 'restoreassist.com.au', position: 3, impressions: 2_600, clicks: 318, change: 1 },
    { keyword: 'Australian SME business software', site: 'unite-group.in', position: 12, impressions: 890, clicks: 41, change: 5 },
    { keyword: 'disaster recovery services QLD', site: 'disasterrecovery.com.au', position: 6, impressions: 1_780, clicks: 126, change: 0 },
    { keyword: 'vehicle storage Brisbane', site: 'carsi.com.au', position: 8, impressions: 1_120, clicks: 67, change: 2 },
    { keyword: 'CRM contact management', site: 'unite-group.in', position: 15, impressions: 3_400, clicks: 98, change: -2 },
  ];

  return {
    generatedAt: now.toISOString(),
    aggregate: {
      visitorsToday: totalToday,
      visitorsWeek: totalWeek,
      visitorsMonth: totalMonth,
      revenueAttributedAud: 18_420,
      visitorsWeekChange: 12.4,
      visitorsMonthChange: 8.7,
      revenueChange: 22.1,
    },
    sites,
    rankings,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // TODO: Replace buildMockSummary() with real API calls once env keys are set:
    //   NEXT_PUBLIC_PLAUSIBLE_DOMAIN + Plausible Stats API
    //   NEXT_PUBLIC_GA4_ID + GA4 Data API
    const summary = buildMockSummary();

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[analytics/summary] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate analytics summary' },
      { status: 500 }
    );
  }
}
