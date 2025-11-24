/**
 * Google Search Console Integration
 *
 * Provides methods to:
 * 1. Initiate OAuth flow
 * 2. Fetch top search queries (last 90 days)
 * 3. Extract search analytics data
 */

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// ============================================================================
// OAuth 2.0 Setup
// ============================================================================

export function getGSCAuthUrl(workspaceId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/aido/auth/gsc/callback`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: SCOPES,
    state: workspaceId, // Pass workspace ID through OAuth flow
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

// ============================================================================
// Search Analytics API
// ============================================================================

export interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function getTopQueries(
  accessToken: string,
  siteUrl: string,
  startDate: string = '2024-09-01',
  endDate: string = '2024-11-25',
  rowLimit: number = 100
): Promise<GSCQuery[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set access token
  oauth2Client.setCredentials({ access_token: accessToken });

  const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

  try {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit,
        dataState: 'final', // Use final data (not fresh)
      },
    });

    if (!response.data.rows) {
      return [];
    }

    const queries: GSCQuery[] = response.data.rows.map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    return queries;
  } catch (error) {
    console.error('Error fetching GSC queries:', error);
    throw new Error('Failed to fetch Google Search Console data');
  }
}

// ============================================================================
// Token Refresh
// ============================================================================

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date!,
    };
  } catch (error) {
    console.error('Error refreshing GSC token:', error);
    throw new Error('Failed to refresh access token');
  }
}

// ============================================================================
// Site List
// ============================================================================

export async function listSites(accessToken: string): Promise<string[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

  try {
    const response = await webmasters.sites.list();

    if (!response.data.siteEntry) {
      return [];
    }

    const sites = response.data.siteEntry.map((site: any) => site.siteUrl);
    return sites;
  } catch (error) {
    console.error('Error fetching GSC sites:', error);
    throw new Error('Failed to fetch Google Search Console sites');
  }
}
