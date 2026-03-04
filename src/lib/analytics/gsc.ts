/**
 * GSC Analytics Wrapper
 * Thin wrapper around the existing /api/seo/gsc/query route,
 * formatted for use in the analytics dashboard.
 *
 * UNI-1455
 */

export interface GscTopQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GscDashboardData {
  topQueries: GscTopQuery[];
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  averagePosition: number;
  dateStart: string;
  dateEnd: string;
  source: 'live' | 'mock';
}

/**
 * Fetch top GSC queries for a given site via the existing GSC API route.
 * Falls back to mock data when credentials are not configured.
 *
 * @param seoProfleId   - The SEO profile ID stored in Supabase
 * @param organisationId - The organisation ID for access control
 * @param domain        - Human-readable domain label (for display)
 * @param rowLimit      - Max rows to return (default 10)
 */
export async function fetchGscDashboardData(
  seoProfileId: string,
  organisationId: string,
  domain: string,
  rowLimit = 10
): Promise<GscDashboardData> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  try {
    const res = await fetch('/api/seo/gsc/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seo_profile_id: seoProfileId,
        organization_id: organisationId,
        start_date: startDate,
        end_date: endDate,
        dimensions: ['query'],
        row_limit: rowLimit,
      }),
    });

    if (!res.ok) {
      throw new Error(`GSC API ${res.status}`);
    }

    const json = await res.json();
    const rows: Array<{ keys: string[]; impressions: number; clicks: number; ctr: number; position: number }> =
      json.data?.rows ?? [];

    const topQueries: GscTopQuery[] = rows.map((r) => ({
      query: r.keys[0] ?? '',
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
    }));

    const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);
    const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);
    const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const averagePosition =
      topQueries.length > 0
        ? topQueries.reduce((s, q) => s + q.position, 0) / topQueries.length
        : 0;

    return {
      topQueries,
      totalImpressions,
      totalClicks,
      averageCtr,
      averagePosition,
      dateStart: startDate,
      dateEnd: endDate,
      source: 'live',
    };
  } catch {
    // Return mock data so the dashboard always renders
    return buildMockGscData(domain, startDate, endDate);
  }
}

// ---------------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------------

function buildMockGscData(
  domain: string,
  dateStart: string,
  dateEnd: string
): GscDashboardData {
  const mockQueries: GscTopQuery[] = [
    { query: `${domain} CRM`, impressions: 2_840, clicks: 187, ctr: 0.066, position: 4.2 },
    { query: 'AI CRM Australia', impressions: 1_920, clicks: 94, ctr: 0.049, position: 7.1 },
    { query: 'business management software', impressions: 3_100, clicks: 142, ctr: 0.046, position: 5.8 },
    { query: 'contact management Australia', impressions: 1_450, clicks: 88, ctr: 0.061, position: 6.3 },
    { query: 'CRM for small business', impressions: 4_200, clicks: 203, ctr: 0.048, position: 9.4 },
    { query: 'email campaign automation', impressions: 2_600, clicks: 118, ctr: 0.045, position: 8.1 },
    { query: 'sales pipeline management', impressions: 1_780, clicks: 76, ctr: 0.043, position: 11.2 },
    { query: 'AI business intelligence', impressions: 1_120, clicks: 54, ctr: 0.048, position: 13.6 },
    { query: 'deal tracking software', impressions: 890, clicks: 41, ctr: 0.046, position: 14.9 },
    { query: 'multi-business dashboard', impressions: 740, clicks: 31, ctr: 0.042, position: 16.3 },
  ];

  const totalImpressions = mockQueries.reduce((s, q) => s + q.impressions, 0);
  const totalClicks = mockQueries.reduce((s, q) => s + q.clicks, 0);
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const averagePosition =
    mockQueries.reduce((s, q) => s + q.position, 0) / mockQueries.length;

  return {
    topQueries: mockQueries,
    totalImpressions,
    totalClicks,
    averageCtr,
    averagePosition,
    dateStart,
    dateEnd,
    source: 'mock',
  };
}
