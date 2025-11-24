/**
 * Google Business Profile Integration
 *
 * Provides methods to:
 * 1. Initiate OAuth flow
 * 2. Fetch customer questions
 * 3. Extract review insights
 * 4. Get search query data
 */

import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
];

// ============================================================================
// OAuth 2.0 Setup
// ============================================================================

export function getGBPAuthUrl(workspaceId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/aido/auth/gbp/callback`
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
// Customer Questions
// ============================================================================

export interface GBPQuestion {
  question: string;
  votes: number;
  answer?: string;
  createdAt: string;
}

export async function getCustomerQuestions(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<GBPQuestion[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusinessqanda({ version: 'v1', auth: oauth2Client });

  try {
    const response = await mybusiness.locations.questions.list({
      parent: `accounts/${accountId}/locations/${locationId}`,
      pageSize: 50,
    });

    if (!response.data.questions) {
      return [];
    }

    const questions: GBPQuestion[] = response.data.questions.map((q: any) => ({
      question: q.text,
      votes: q.upvoteCount || 0,
      answer: q.topAnswers?.[0]?.text,
      createdAt: q.createTime,
    }));

    return questions;
  } catch (error) {
    console.error('Error fetching GBP questions:', error);
    throw new Error('Failed to fetch Google Business Profile questions');
  }
}

// ============================================================================
// Reviews
// ============================================================================

export interface GBPReview {
  text: string;
  rating: number;
  reviewerName: string;
  createdAt: string;
  reply?: string;
}

export async function getReviews(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<GBPReview[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusiness({ version: 'v4', auth: oauth2Client });

  try {
    const response = await mybusiness.accounts.locations.reviews.list({
      parent: `accounts/${accountId}/locations/${locationId}`,
      pageSize: 50,
    });

    if (!response.data.reviews) {
      return [];
    }

    const reviews: GBPReview[] = response.data.reviews.map((r: any) => ({
      text: r.comment || '',
      rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
      reviewerName: r.reviewer?.displayName || 'Anonymous',
      createdAt: r.createTime,
      reply: r.reviewReply?.comment,
    }));

    return reviews;
  } catch (error) {
    console.error('Error fetching GBP reviews:', error);
    throw new Error('Failed to fetch Google Business Profile reviews');
  }
}

// ============================================================================
// Search Queries (via Insights API)
// ============================================================================

export interface GBPSearchQuery {
  query: string;
  count: number;
}

export async function getSearchQueries(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<GBPSearchQuery[]> {
  // Note: The actual GBP Insights API endpoint may differ
  // This is a placeholder based on documentation
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  // TODO: Use actual GBP Insights API
  // For now, return empty array
  console.warn('GBP Search Queries API not yet implemented');
  return [];
}

// ============================================================================
// Location List
// ============================================================================

export async function listLocations(
  accessToken: string,
  accountId: string
): Promise<Array<{ id: string; name: string }>> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusiness({ version: 'v4', auth: oauth2Client });

  try {
    const response = await mybusiness.accounts.locations.list({
      parent: `accounts/${accountId}`,
      pageSize: 100,
    });

    if (!response.data.locations) {
      return [];
    }

    const locations = response.data.locations.map((loc: any) => ({
      id: loc.name.split('/').pop(),
      name: loc.locationName || loc.name,
    }));

    return locations;
  } catch (error) {
    console.error('Error fetching GBP locations:', error);
    throw new Error('Failed to fetch Google Business Profile locations');
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
    console.error('Error refreshing GBP token:', error);
    throw new Error('Failed to refresh access token');
  }
}
