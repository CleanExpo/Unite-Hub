/**
 * AIDO 2026 - Client Onboarding Intelligence API
 *
 * POST /api/aido/onboarding/generate
 * Generates complete onboarding intelligence:
 * - Business Profile
 * - Authority Figure
 * - Audience Personas (3-5)
 * - Content Strategy
 *
 * Uses Claude Opus 4 with GSC, GBP, and GA4 data
 * Cost: ~$1.50-2.50 per onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  generateOnboardingIntelligence,
  BusinessProfileInput,
  AuthorityFigureInput,
} from '@/lib/ai/onboarding-intelligence';
import { checkTierRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // =========================================================================
    // 1. Authentication
    // =========================================================================
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const { data, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // 2. Rate Limiting (AI-powered, stricter limits)
    // =========================================================================
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'ai');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
          message:
            'You have reached your AI generation limit. Upgrade to Professional or Enterprise for higher limits.',
        },
        { status: 429 }
      );
    }

    // =========================================================================
    // 3. Input Validation
    // =========================================================================
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const body = await req.json();
    const {
      businessInput,
      authorityInput,
      gscData,
      gbpData,
      ga4Data,
    }: {
      businessInput: BusinessProfileInput;
      authorityInput: AuthorityFigureInput;
      gscData?: Array<{ query: string; clicks: number; impressions: number }>;
      gbpData?: {
        totalViews: number;
        searchQueries: Array<{ query: string; count: number }>;
        customerQuestions: Array<{ question: string; votes: number }>;
        reviews: Array<{ text: string; rating: number }>;
      };
      ga4Data?: {
        demographics: Array<{ ageRange: string; percentage: number }>;
        topPages: Array<{ path: string; views: number }>;
        avgSessionDuration: number;
      };
    } = body;

    if (!businessInput || !authorityInput) {
      return NextResponse.json(
        { error: 'businessInput and authorityInput are required' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 4. Fetch OAuth Data (Optional)
    // =========================================================================
    let fetchedGscData = gscData;
    let fetchedGbpData = gbpData;
    let fetchedGa4Data = ga4Data;

    // Fetch GSC data if token exists
    if (!fetchedGscData && businessInput.website) {
      try {
        const { data: gscToken } = await supabaseBrowser
          .from('oauth_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('workspace_id', workspaceId)
          .eq('provider', 'google_search_console')
          .single();

        if (gscToken) {
          const { getTopQueries, refreshAccessToken } = await import(
            '@/lib/integrations/google-search-console'
          );

          // Check if token is expired
          const isExpired = new Date(gscToken.expires_at) < new Date();
          let accessToken = gscToken.access_token;

          if (isExpired) {
            const refreshed = await refreshAccessToken(gscToken.refresh_token);
            accessToken = refreshed.accessToken;

            // Update token in database
            await supabaseBrowser
              .from('oauth_tokens')
              .update({
                access_token: refreshed.accessToken,
                expires_at: new Date(refreshed.expiresAt).toISOString(),
              })
              .eq('workspace_id', workspaceId)
              .eq('provider', 'google_search_console');
          }

          // Fetch top 100 queries from last 90 days
          const queries = await getTopQueries(accessToken, businessInput.website, '90daysAgo', 'today', 100);
          fetchedGscData = queries.map(q => ({
            query: q.query,
            clicks: q.clicks,
            impressions: q.impressions,
          }));

          console.log(`✅ Fetched ${fetchedGscData.length} GSC queries`);
        }
      } catch (error) {
        console.warn('Failed to fetch GSC data, continuing without it:', error);
      }
    }

    // Fetch GBP data if token exists
    if (!fetchedGbpData) {
      try {
        const { data: gbpToken } = await supabaseBrowser
          .from('oauth_tokens')
          .select('access_token, refresh_token, expires_at, metadata')
          .eq('workspace_id', workspaceId)
          .eq('provider', 'google_business_profile')
          .single();

        if (gbpToken) {
          const { getCustomerQuestions, getReviews, refreshAccessToken } = await import(
            '@/lib/integrations/google-business-profile'
          );

          const isExpired = new Date(gbpToken.expires_at) < new Date();
          let accessToken = gbpToken.access_token;

          if (isExpired) {
            const refreshed = await refreshAccessToken(gbpToken.refresh_token);
            accessToken = refreshed.accessToken;

            await supabaseBrowser
              .from('oauth_tokens')
              .update({
                access_token: refreshed.accessToken,
                expires_at: new Date(refreshed.expiresAt).toISOString(),
              })
              .eq('workspace_id', workspaceId)
              .eq('provider', 'google_business_profile');
          }

          // Fetch questions and reviews (requires accountId and locationId from metadata)
          const accountId = gbpToken.metadata?.accountId;
          const locationId = gbpToken.metadata?.locationId;

          if (accountId && locationId) {
            const questions = await getCustomerQuestions(accessToken, accountId, locationId);
            const reviews = await getReviews(accessToken, accountId, locationId);

            fetchedGbpData = {
              totalViews: 0, // GBP doesn't provide this easily
              searchQueries: [], // GBP Insights API not fully implemented
              customerQuestions: questions.map(q => ({ question: q.question, votes: q.votes })),
              reviews: reviews.map(r => ({ text: r.text, rating: r.rating })),
            };

            console.log(`✅ Fetched ${questions.length} GBP questions, ${reviews.length} reviews`);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch GBP data, continuing without it:', error);
      }
    }

    // Fetch GA4 data if token exists
    if (!fetchedGa4Data) {
      try {
        const { data: ga4Token } = await supabaseBrowser
          .from('oauth_tokens')
          .select('access_token, refresh_token, expires_at, metadata')
          .eq('workspace_id', workspaceId)
          .eq('provider', 'google_analytics_4')
          .single();

        if (ga4Token) {
          const { getDemographics, getTopPages, refreshAccessToken } = await import(
            '@/lib/integrations/google-analytics-4'
          );

          const isExpired = new Date(ga4Token.expires_at) < new Date();
          let accessToken = ga4Token.access_token;

          if (isExpired) {
            const refreshed = await refreshAccessToken(ga4Token.refresh_token);
            accessToken = refreshed.accessToken;

            await supabaseBrowser
              .from('oauth_tokens')
              .update({
                access_token: refreshed.accessToken,
                expires_at: new Date(refreshed.expiresAt).toISOString(),
              })
              .eq('workspace_id', workspaceId)
              .eq('provider', 'google_analytics_4');
          }

          // Fetch demographics and top pages (requires propertyId from metadata)
          const propertyId = ga4Token.metadata?.propertyId;

          if (propertyId) {
            const demographics = await getDemographics(accessToken, propertyId);
            const topPages = await getTopPages(accessToken, propertyId, '90daysAgo', 'today', 20);

            fetchedGa4Data = {
              demographics: demographics.map(d => ({ ageRange: d.ageRange, percentage: d.percentage })),
              topPages: topPages.map(p => ({ path: p.path, views: p.views })),
              avgSessionDuration: topPages.length > 0
                ? topPages.reduce((sum, p) => sum + p.avgSessionDuration, 0) / topPages.length
                : 0,
            };

            console.log(`✅ Fetched ${demographics.length} GA4 demographics, ${topPages.length} top pages`);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch GA4 data, continuing without it:', error);
      }
    }

    // =========================================================================
    // 5. Generate Onboarding Intelligence with AI
    // =========================================================================
    const startTime = Date.now();

    const intelligence = await generateOnboardingIntelligence(
      businessInput,
      authorityInput,
      fetchedGscData,
      fetchedGbpData,
      fetchedGa4Data
    );

    const duration = Date.now() - startTime;

    // =========================================================================
    // 6. Save to Database
    // =========================================================================
    // Note: For now, we return the intelligence directly
    // In production, you might want to save this to a dedicated table
    // or update the aido_client_profiles table with this data

    // Example: Save business profile
    // const { data: client, error: insertError } = await supabase
    //   .from('aido_client_profiles')
    //   .insert({
    //     workspace_id: workspaceId,
    //     business_name: intelligence.businessProfile.businessName,
    //     industry: businessInput.industry,
    //     business_profile: intelligence.businessProfile,
    //     authority_figure: intelligence.authorityFigure,
    //     audience_personas: intelligence.audiencePersonas,
    //     content_strategy: intelligence.contentStrategy,
    //   })
    //   .select()
    //   .single();

    // =========================================================================
    // 7. Return Results
    // =========================================================================
    return NextResponse.json({
      success: true,
      intelligence,
      generation: {
        duration: `${(duration / 1000).toFixed(1)}s`,
        estimatedCost: '$1.50-2.50',
        model: 'claude-opus-4-20250514',
      },
      summary: {
        businessProfile: {
          name: intelligence.businessProfile.businessName,
          tagline: intelligence.businessProfile.tagline,
          expertiseAreas: intelligence.businessProfile.expertiseAreas.length,
          services: intelligence.businessProfile.coreServices.length,
        },
        authorityFigure: {
          name: intelligence.authorityFigure.fullName,
          role: intelligence.authorityFigure.role,
          yearsExperience: intelligence.authorityFigure.yearsExperience,
          linkedinVerified: !!intelligence.authorityFigure.linkedinUrl,
          facebookVerified: !!intelligence.authorityFigure.facebookUrl,
        },
        personas: intelligence.audiencePersonas.length,
        contentPillars: intelligence.contentStrategy.contentPillars.length,
      },
      message: 'Onboarding intelligence generated successfully',
    });
  } catch (error) {
    console.error('Onboarding intelligence generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate onboarding intelligence',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
