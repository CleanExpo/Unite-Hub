/**
 * Google Analytics 4 Integration
 *
 * Provides methods to:
 * 1. Initiate OAuth flow
 * 2. Fetch demographics data
 * 3. Extract top pages
 * 4. Get user behavior metrics
 */

import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

// ============================================================================
// OAuth 2.0 Setup
// ============================================================================

export function getGA4AuthUrl(workspaceId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/aido/auth/ga4/callback`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: workspaceId,
    prompt: 'consent',
  });

  return authUrl;
}

// ============================================================================
// Demographics Data
// ============================================================================

export interface GA4Demographics {
  ageRange: string;
  percentage: number;
  users: number;
}

export async function getDemographics(
  accessToken: string,
  propertyId: string,
  startDate: string = '90daysAgo',
  endDate: string = 'today'
): Promise<GA4Demographics[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const analytics = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  try {
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'userAgeBracket' }],
        metrics: [{ name: 'activeUsers' }],
      },
    });

    if (!response.data.rows) {
      return [];
    }

    const totalUsers = response.data.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    );

    const demographics: GA4Demographics[] = response.data.rows.map((row: any) => ({
      ageRange: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value),
      percentage: (parseInt(row.metricValues[0].value) / totalUsers) * 100,
    }));

    return demographics;
  } catch (error) {
    console.error('Error fetching GA4 demographics:', error);
    throw new Error('Failed to fetch Google Analytics 4 demographics');
  }
}

// ============================================================================
// Top Pages
// ============================================================================

export interface GA4Page {
  path: string;
  views: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export async function getTopPages(
  accessToken: string,
  propertyId: string,
  startDate: string = '90daysAgo',
  endDate: string = 'today',
  limit: number = 20
): Promise<GA4Page[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const analytics = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  try {
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      },
    });

    if (!response.data.rows) {
      return [];
    }

    const pages: GA4Page[] = response.data.rows.map((row: any) => ({
      path: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value),
      avgSessionDuration: parseFloat(row.metricValues[1].value),
      bounceRate: parseFloat(row.metricValues[2].value),
    }));

    return pages;
  } catch (error) {
    console.error('Error fetching GA4 top pages:', error);
    throw new Error('Failed to fetch Google Analytics 4 top pages');
  }
}

// ============================================================================
// Location Data
// ============================================================================

export interface GA4Location {
  city: string;
  country: string;
  users: number;
}

export async function getLocationData(
  accessToken: string,
  propertyId: string,
  startDate: string = '90daysAgo',
  endDate: string = 'today'
): Promise<GA4Location[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const analytics = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  try {
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'city' }, { name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 20,
      },
    });

    if (!response.data.rows) {
      return [];
    }

    const locations: GA4Location[] = response.data.rows.map((row: any) => ({
      city: row.dimensionValues[0].value,
      country: row.dimensionValues[1].value,
      users: parseInt(row.metricValues[0].value),
    }));

    return locations;
  } catch (error) {
    console.error('Error fetching GA4 location data:', error);
    throw new Error('Failed to fetch Google Analytics 4 location data');
  }
}

// ============================================================================
// Device Category
// ============================================================================

export interface GA4Device {
  category: string; // mobile, desktop, tablet
  users: number;
  percentage: number;
}

export async function getDeviceCategories(
  accessToken: string,
  propertyId: string,
  startDate: string = '90daysAgo',
  endDate: string = 'today'
): Promise<GA4Device[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const analytics = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  try {
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
      },
    });

    if (!response.data.rows) {
      return [];
    }

    const totalUsers = response.data.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    );

    const devices: GA4Device[] = response.data.rows.map((row: any) => ({
      category: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value),
      percentage: (parseInt(row.metricValues[0].value) / totalUsers) * 100,
    }));

    return devices;
  } catch (error) {
    console.error('Error fetching GA4 device categories:', error);
    throw new Error('Failed to fetch Google Analytics 4 device categories');
  }
}

// ============================================================================
// Properties List
// ============================================================================

export async function listProperties(accessToken: string): Promise<Array<{
  id: string;
  name: string;
}>> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const analytics = google.analytics({ version: 'v3', auth: oauth2Client });

  try {
    const response = await analytics.management.webproperties.list({
      accountId: '~all',
    });

    if (!response.data.items) {
      return [];
    }

    const properties = response.data.items.map((prop: any) => ({
      id: prop.id,
      name: prop.name,
    }));

    return properties;
  } catch (error) {
    console.error('Error fetching GA4 properties:', error);
    throw new Error('Failed to fetch Google Analytics 4 properties');
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
    console.error('Error refreshing GA4 token:', error);
    throw new Error('Failed to refresh access token');
  }
}
