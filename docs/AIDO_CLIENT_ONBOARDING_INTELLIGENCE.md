# AIDO Client Onboarding Intelligence System

**AI-Powered Discovery for Algorithmic Immunity**

**Date**: 2025-11-25
**Priority**: P0 - REQUIRED BEFORE CONTENT GENERATION

---

## Overview

Before generating any AIDO content, we must intelligently discover:
1. **Business Profile** - What the business actually does, expertise areas, unique value
2. **Authority Figure** - Who is the face/expert (for About page and author bylines)
3. **Target Audience Persona** - Who searches for them, what questions they ask

**Data Sources**:
- Google Search Console (GSC) - Historical queries, click patterns
- Google Business Profile (GBP) - Customer interactions, questions, reviews
- Existing website analytics - Conversion paths, engagement data
- Competitor analysis - Gap identification
- AI-powered intent extraction

---

## Phase 1: Business Profile Discovery

### Data Collection (Automated)

**1. Google Search Console Integration**

```typescript
// src/lib/aido/onboarding/gsc-analyzer.ts
import { google } from 'googleapis';

export interface GSCInsights {
  topKeywords: Array<{
    query: string;
    impressions: number;
    clicks: number;
    position: number;
    ctr: number;
  }>;
  topPages: Array<{
    page: string;
    impressions: number;
    clicks: number;
  }>;
  searchIntentCategories: {
    informational: number; // %
    transactional: number;  // %
    navigational: number;   // %
    commercial: number;     // %
  };
  seasonalTrends: Array<{
    month: string;
    queryVolume: number;
    topQueries: string[];
  }>;
}

export async function analyzeGSCData(
  clientDomain: string,
  startDate: string,
  endDate: string
): Promise<GSCInsights> {
  const searchconsole = google.searchconsole('v1');

  // Fetch query performance data
  const queryData = await searchconsole.searchanalytics.query({
    siteUrl: `sc-domain:${clientDomain}`,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 1000,
      dimensionFilterGroups: []
    }
  });

  // Process and categorize queries
  const insights = processQueryData(queryData.data);

  return insights;
}

function processQueryData(data: any): GSCInsights {
  // Categorize by intent
  const queries = data.rows || [];

  const intentKeywords = {
    informational: ['how', 'what', 'why', 'when', 'guide', 'tips'],
    transactional: ['buy', 'order', 'purchase', 'quote', 'price'],
    navigational: ['login', 'contact', 'near me', 'location'],
    commercial: ['best', 'top', 'review', 'compare', 'vs']
  };

  const categorized = {
    informational: 0,
    transactional: 0,
    navigational: 0,
    commercial: 0
  };

  queries.forEach((row: any) => {
    const query = row.keys[0].toLowerCase();

    if (intentKeywords.informational.some(kw => query.includes(kw))) {
      categorized.informational += row.impressions;
    } else if (intentKeywords.transactional.some(kw => query.includes(kw))) {
      categorized.transactional += row.impressions;
    } else if (intentKeywords.navigational.some(kw => query.includes(kw))) {
      categorized.navigational += row.impressions;
    } else if (intentKeywords.commercial.some(kw => query.includes(kw))) {
      categorized.commercial += row.impressions;
    }
  });

  const total = Object.values(categorized).reduce((a, b) => a + b, 0);

  return {
    topKeywords: queries.slice(0, 50).map((row: any) => ({
      query: row.keys[0],
      impressions: row.impressions,
      clicks: row.clicks,
      position: row.position,
      ctr: row.ctr
    })),
    topPages: extractTopPages(queries),
    searchIntentCategories: {
      informational: (categorized.informational / total) * 100,
      transactional: (categorized.transactional / total) * 100,
      navigational: (categorized.navigational / total) * 100,
      commercial: (categorized.commercial / total) * 100
    },
    seasonalTrends: analyzeSeasonality(queries)
  };
}
```

**2. Google Business Profile Integration**

```typescript
// src/lib/aido/onboarding/gbp-analyzer.ts
export interface GBPInsights {
  customerQuestions: Array<{
    question: string;
    frequency: number;
    answered: boolean;
  }>;
  reviewThemes: Array<{
    theme: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    count: number;
    keywords: string[];
  }>;
  searchQueries: Array<{
    query: string;
    volume: number;
  }>;
  photoCategories: Array<{
    category: string;
    viewCount: number;
  }>;
  peakInteractionTimes: Array<{
    dayOfWeek: string;
    hour: number;
    interactions: number;
  }>;
}

export async function analyzeGBPData(
  gbpAccountId: string,
  locationIds: string[]
): Promise<GBPInsights> {
  // Fetch GBP Insights API data
  const mybusiness = google.mybusinessaccountmanagement('v1');

  const insights = await Promise.all(
    locationIds.map(locationId =>
      fetchLocationInsights(gbpAccountId, locationId)
    )
  );

  return aggregateInsights(insights);
}

async function fetchLocationInsights(accountId: string, locationId: string) {
  // Customer questions (Q&A section)
  const questions = await fetchCustomerQuestions(accountId, locationId);

  // Reviews analysis
  const reviews = await fetchReviews(accountId, locationId);
  const themes = await analyzeReviewThemes(reviews);

  // Search queries that found the business
  const searchQueries = await fetchSearchQueries(accountId, locationId);

  // Photo performance
  const photoInsights = await fetchPhotoInsights(accountId, locationId);

  return {
    customerQuestions: questions,
    reviewThemes: themes,
    searchQueries,
    photoCategories: photoInsights,
    peakInteractionTimes: analyzeInteractionPatterns(insights)
  };
}
```

**3. Website Analytics Integration**

```typescript
// src/lib/aido/onboarding/analytics-analyzer.ts
export interface AnalyticsInsights {
  topConversionPaths: Array<{
    path: string[];
    conversions: number;
    avgTimeToConvert: number; // days
  }>;
  highEngagementPages: Array<{
    page: string;
    avgTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
  }>;
  audienceDemographics: {
    ageRanges: Record<string, number>;
    genders: Record<string, number>;
    locations: Array<{ location: string; percentage: number }>;
  };
  deviceUsage: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export async function analyzeWebsiteAnalytics(
  clientId: string,
  propertyId: string
): Promise<AnalyticsInsights> {
  const analytics = google.analyticsdata('v1beta');

  // Fetch conversion path data
  const conversionPaths = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'conversions' },
        { name: 'averageSessionDuration' }
      ]
    }
  });

  return processAnalyticsData(conversionPaths);
}
```

---

## Phase 2: AI-Powered Business Profile Generation

### Using Claude Opus 4 Extended Thinking

```typescript
// src/lib/aido/onboarding/business-profile-generator.ts
import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

export interface BusinessProfile {
  coreBusiness: {
    primaryServices: string[];
    industryVerticals: string[];
    uniqueValuePropositions: string[];
    yearsFounded: number;
    companySize: string;
  };
  expertiseAreas: Array<{
    area: string;
    depth: 'beginner' | 'intermediate' | 'expert' | 'thought-leader';
    evidence: string[]; // GSC/GBP data points
  }>;
  competitiveAdvantages: string[];
  brandTone: string;
  targetMarkets: Array<{
    segment: string;
    percentage: number;
    characteristics: string[];
  }>;
  seasonalFactors: Array<{
    season: string;
    demandLevel: 'low' | 'medium' | 'high';
    keyServices: string[];
  }>;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31,thinking-2025-11-15',
  },
});

export async function generateBusinessProfile(
  gscInsights: GSCInsights,
  gbpInsights: GBPInsights,
  analyticsInsights: AnalyticsInsights,
  websiteContent: string,
  clientInput: any
): Promise<BusinessProfile> {

  const systemPrompt = `You are an expert business strategist specializing in AIDO (AI Discovery Optimization).

Your mission: Analyze data sources to create a comprehensive business profile optimized for AI citation and algorithmic immunity.

Data Sources Available:
1. Google Search Console (what people search to find them)
2. Google Business Profile (customer questions, reviews)
3. Website Analytics (conversion paths, engagement)
4. Website Content (services, about page)
5. Client Initial Input (business description)

Extract:
- Core business activities (WHAT they do)
- Expertise areas with depth assessment (HOW WELL they do it)
- Unique value propositions (WHY customers choose them)
- Target market segments (WHO they serve)
- Seasonal demand patterns (WHEN services peak)
- Competitive advantages (evidence-based)`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate business profile from these data sources:

## Google Search Console Data (Last 90 Days)
Top Keywords:
${gscInsights.topKeywords.slice(0, 20).map(k =>
  `- "${k.query}" (${k.impressions} impressions, position ${k.position.toFixed(1)})`
).join('\n')}

Search Intent Breakdown:
- Informational: ${gscInsights.searchIntentCategories.informational.toFixed(1)}%
- Transactional: ${gscInsights.searchIntentCategories.transactional.toFixed(1)}%
- Commercial: ${gscInsights.searchIntentCategories.commercial.toFixed(1)}%
- Navigational: ${gscInsights.searchIntentCategories.navigational.toFixed(1)}%

Top Pages:
${gscInsights.topPages.slice(0, 10).map(p =>
  `- ${p.page} (${p.impressions} impressions, ${p.clicks} clicks)`
).join('\n')}

## Google Business Profile Data
Customer Questions:
${gbpInsights.customerQuestions.slice(0, 15).map(q =>
  `- "${q.question}" (asked ${q.frequency} times)`
).join('\n')}

Review Themes:
${gbpInsights.reviewThemes.map(t =>
  `- ${t.theme} (${t.sentiment}, ${t.count} mentions): ${t.keywords.join(', ')}`
).join('\n')}

## Website Analytics
Top Conversion Paths:
${analyticsInsights.topConversionPaths.slice(0, 5).map(p =>
  `- ${p.path.join(' → ')} (${p.conversions} conversions, ${p.avgTimeToConvert} days)`
).join('\n')}

High Engagement Pages:
${analyticsInsights.highEngagementPages.slice(0, 10).map(p =>
  `- ${p.page} (${p.avgTimeOnPage}s avg time, ${p.bounceRate.toFixed(1)}% bounce)`
).join('\n')}

## Client Initial Input
${JSON.stringify(clientInput, null, 2)}

## Website Content Sample
${websiteContent.slice(0, 2000)}...

Generate comprehensive BusinessProfile as JSON with evidence-based insights.`,
        },
      ],
    });
  });

  const message = result.data;
  const textBlock = message.content.find((block: any) => block.type === 'text');
  const profile = JSON.parse(textBlock!.text);

  return profile;
}
```

---

## Phase 3: Authority Figure Discovery

### Identify the "Face" of the Business

```typescript
// src/lib/aido/onboarding/authority-figure-generator.ts
export interface AuthorityFigure {
  name: string;
  jobTitle: string;
  credentials: string[];
  yearsExperience: number;
  expertiseAreas: string[];
  achievements: string[];
  socialProfiles: {
    linkedIn?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  bioShort: string; // 100-150 words
  bioLong: string;  // 300-500 words
  photoUrl?: string;
  authorityScore: number; // 0.0-1.0 (calculated based on credentials)
}

export async function discoverAuthorityFigure(
  businessProfile: BusinessProfile,
  websiteAboutPage: string,
  teamPageContent: string,
  reviewMentions: Array<{ text: string; authorName?: string }>,
  clientInput: {
    ownerName?: string;
    ownerLinkedIn?: string;
    teamMembers?: Array<{ name: string; role: string }>;
  }
): Promise<AuthorityFigure> {

  const systemPrompt = `You are an E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) specialist.

Your mission: Identify the primary authority figure for this business who will be the "face" of AIDO content.

Requirements:
1. Must be real person (verifiable via LinkedIn, social profiles)
2. Must have demonstrable expertise in business's core services
3. Must have credentials to establish authority
4. Will become primary author byline for all content

Prioritize:
- Owner/Founder (strongest personal stake)
- Director/Manager with industry credentials
- Senior specialist with years of experience

Extract from data:
- Full name and job title
- Professional credentials (licenses, certifications, memberships)
- Years of experience (calculate from career history)
- Specific expertise areas matching business services
- Notable achievements (awards, publications, large projects)
- Social profile URLs (LinkedIn priority, then Facebook, Twitter)

Generate authoritative bio optimized for E-E-A-T signals.`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Identify authority figure from these sources:

## Business Profile
Core Services: ${businessProfile.coreBusiness.primaryServices.join(', ')}
Expertise Areas: ${businessProfile.expertiseAreas.map(e => e.area).join(', ')}

## About Page Content
${websiteAboutPage}

## Team Page Content
${teamPageContent}

## Review Mentions (Customer Quotes)
${reviewMentions.slice(0, 20).map(r =>
  `- "${r.text}" ${r.authorName ? `(mentions ${r.authorName})` : ''}`
).join('\n')}

## Client Input
${JSON.stringify(clientInput, null, 2)}

Return JSON AuthorityFigure with:
- name, jobTitle, credentials (array)
- yearsExperience (number)
- expertiseAreas (array matching business services)
- achievements (array of specific accomplishments)
- socialProfiles (LinkedIn URL priority)
- bioShort (100-150 words, E-E-A-T optimized)
- bioLong (300-500 words, include career journey)

CRITICAL: Bio must include:
- Specific credentials (licensed, certified by X)
- Years of experience (e.g., "15 years")
- Notable projects/clients (numbers: "200+ installations")
- Industry memberships (e.g., "Member of Australian Institute of Building")`,
        },
      ],
    });
  });

  const message = result.data;
  const textBlock = message.content.find((block: any) => block.type === 'text');
  const authorityFigure = JSON.parse(textBlock!.text);

  // Calculate authority score
  authorityFigure.authorityScore = calculateAuthorityScore(authorityFigure);

  return authorityFigure;
}

function calculateAuthorityScore(figure: AuthorityFigure): number {
  let score = 0.4; // Base score

  // Credentials (+0.3)
  if (figure.credentials.length >= 3) score += 0.3;
  else if (figure.credentials.length >= 2) score += 0.2;
  else if (figure.credentials.length >= 1) score += 0.1;

  // Experience (+0.2)
  if (figure.yearsExperience >= 15) score += 0.2;
  else if (figure.yearsExperience >= 10) score += 0.15;
  else if (figure.yearsExperience >= 5) score += 0.1;

  // LinkedIn presence (+0.1)
  if (figure.socialProfiles.linkedIn) score += 0.1;

  return Math.min(score, 1.0);
}
```

---

## Phase 4: Target Audience Persona Discovery

### AI-Powered Persona Generation from Search Data

```typescript
// src/lib/aido/onboarding/persona-generator.ts
export interface AudiencePersona {
  personaName: string; // e.g., "Commercial Architect Andrew"
  demographics: {
    ageRange: string;
    location: string;
    jobTitles: string[];
    incomeLevel: string;
  };
  psychographics: {
    goals: string[];
    painPoints: string[];
    motivations: string[];
    fears: string[];
  };
  searchBehavior: {
    topQuestions: string[]; // 15-20 questions they ask
    searchIntent: 'informational' | 'transactional' | 'commercial';
    keywordPatterns: string[];
    devicePreference: 'mobile' | 'desktop';
  };
  buyingJourney: {
    awareness: string[]; // Questions at awareness stage
    consideration: string[]; // Questions at consideration stage
    decision: string[]; // Questions at decision stage
  };
  contentPreferences: {
    formats: string[]; // 'guide', 'video', 'checklist', 'case-study'
    tonePreference: string; // 'professional', 'casual', 'technical'
    detailLevel: string; // 'high-level', 'detailed', 'technical'
  };
}

export async function generateAudiencePersonas(
  gscInsights: GSCInsights,
  gbpInsights: GBPInsights,
  analyticsInsights: AnalyticsInsights,
  businessProfile: BusinessProfile
): Promise<AudiencePersona[]> {

  const systemPrompt = `You are an audience research specialist for AIDO (AI Discovery Optimization).

Your mission: Create detailed audience personas based on actual search behavior, not assumptions.

Data Sources:
1. Search queries (what they search)
2. Customer questions (what they ask business directly)
3. Review themes (what they value/complain about)
4. Conversion paths (how they research before buying)

Create 2-4 distinct personas representing major audience segments.

For each persona:
1. Name it descriptively (job role + name, e.g., "Homeowner Hannah")
2. Extract demographics from search patterns and analytics
3. Infer psychographics from question themes and review sentiment
4. Map search behavior to buying journey stages
5. Identify content preferences from engagement data

CRITICAL: Extract 15-20 actual questions this persona asks (for H2 headings).`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8192,
      thinking: {
        type: 'enabled',
        budget_tokens: 12000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate audience personas from this data:

## Search Console Queries (What They Search)
${gscInsights.topKeywords.slice(0, 50).map(k =>
  `- "${k.query}" (${k.impressions} impressions, ${k.clicks} clicks, position ${k.position.toFixed(1)})`
).join('\n')}

Intent Breakdown:
- Informational: ${gscInsights.searchIntentCategories.informational.toFixed(1)}%
- Transactional: ${gscInsights.searchIntentCategories.transactional.toFixed(1)}%
- Commercial: ${gscInsights.searchIntentCategories.commercial.toFixed(1)}%

## Google Business Profile Questions (What They Ask)
${gbpInsights.customerQuestions.map(q =>
  `- "${q.question}" (${q.frequency}x)`
).join('\n')}

## Review Themes (What They Value/Complain About)
${gbpInsights.reviewThemes.map(t =>
  `- ${t.theme} (${t.sentiment}): ${t.keywords.join(', ')}`
).join('\n')}

## Conversion Paths (How They Research)
${analyticsInsights.topConversionPaths.map(p =>
  `- ${p.path.join(' → ')} (${p.conversions} conversions, ${p.avgTimeToConvert} days to convert)`
).join('\n')}

## Demographics
Age Ranges: ${JSON.stringify(analyticsInsights.audienceDemographics.ageRanges)}
Locations: ${analyticsInsights.audienceDemographics.locations.map(l => l.location).join(', ')}
Device Usage: ${analyticsInsights.deviceUsage.mobile}% mobile, ${analyticsInsights.deviceUsage.desktop}% desktop

## Business Context
Services: ${businessProfile.coreBusiness.primaryServices.join(', ')}
Target Markets: ${businessProfile.targetMarkets.map(m => m.segment).join(', ')}

Generate 2-4 distinct AudiencePersona objects as JSON array.

Each persona MUST include:
- searchBehavior.topQuestions (15-20 actual questions extracted from GSC queries and GBP questions)
- buyingJourney (map questions to awareness/consideration/decision stages)

These questions will become H2 headings in content.`,
        },
      ],
    });
  });

  const message = result.data;
  const textBlock = message.content.find((block: any) => block.type === 'text');
  const personas = JSON.parse(textBlock!.text);

  return personas;
}
```

---

## Phase 5: Competitor Gap Analysis

### Identify Content Opportunities

```typescript
// src/lib/aido/onboarding/competitor-analyzer.ts
export interface CompetitorGapAnalysis {
  competitorDomains: string[];
  theirStrengths: Array<{
    domain: string;
    strength: string;
    keywords: string[];
    estimatedTraffic: number;
  }>;
  ourOpportunities: Array<{
    topic: string;
    currentGap: string; // What competitors do well that we don't
    recommendedAction: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    targetQuestions: string[]; // Questions to answer
  }>;
  uniqueAdvantages: string[]; // What we do better
}

export async function analyzeCompetitors(
  clientDomain: string,
  competitorDomains: string[],
  gscInsights: GSCInsights,
  businessProfile: BusinessProfile
): Promise<CompetitorGapAnalysis> {

  // Fetch competitor data via Perplexity or SEMrush API
  const competitorData = await Promise.all(
    competitorDomains.map(domain => fetchCompetitorInsights(domain))
  );

  // Use Claude to analyze gaps
  const systemPrompt = `You are a competitive intelligence analyst for AIDO.

Your mission: Identify content gaps where competitors outrank us, and opportunities where we can dominate.

Focus on:
1. Questions competitors answer well (that we don't)
2. Topics with high traffic potential but low competition
3. Our unique advantages competitors can't match

Recommend specific questions to target (for H2 headings).`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze competitive gaps:

## Our Domain: ${clientDomain}
Our Top Keywords:
${gscInsights.topKeywords.slice(0, 20).map(k =>
  `- "${k.query}" (position ${k.position.toFixed(1)})`
).join('\n')}

Our Strengths:
${businessProfile.competitiveAdvantages.join('\n')}

## Competitors
${competitorData.map((comp: any, i: number) => `
### ${competitorDomains[i]}
Top Keywords:
${comp.topKeywords.slice(0, 10).map((k: any) =>
  `- "${k.keyword}" (position ${k.position}, traffic: ${k.traffic})`
).join('\n')}

Content Gaps They Fill:
${comp.topPages.slice(0, 5).map((p: any) => `- ${p.url} (${p.traffic} traffic)`).join('\n')}
`).join('\n')}

Generate CompetitorGapAnalysis JSON with:
- ourOpportunities (array of content gaps we should fill)
  - Each opportunity includes targetQuestions (5-10 questions to answer)
- uniqueAdvantages (what we do better, evidence-based)`,
        },
      ],
    });
  });

  const message = result.data;
  const textBlock = message.content.find((block: any) => block.type === 'text');
  const analysis = JSON.parse(textBlock!.text);

  return analysis;
}
```

---

## Onboarding Workflow Implementation

### Database Schema Addition (Migration 205)

```sql
-- Add to migration 205
CREATE TABLE IF NOT EXISTS client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Data Source Connections
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_property_url TEXT,
  gbp_connected BOOLEAN DEFAULT FALSE,
  gbp_location_ids TEXT[] DEFAULT '{}',
  analytics_connected BOOLEAN DEFAULT FALSE,
  analytics_property_id TEXT,

  -- Discovered Insights (JSONB for flexibility)
  business_profile JSONB,
  authority_figure JSONB,
  audience_personas JSONB,
  competitor_analysis JSONB,

  -- Onboarding Status
  status TEXT DEFAULT 'pending', -- 'pending', 'data_collection', 'analysis', 'complete'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_onboarding_client ON client_onboarding(client_id);
CREATE INDEX idx_client_onboarding_status ON client_onboarding(status);
```

### API Endpoint: Start Onboarding

```typescript
// src/app/api/aido/onboarding/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createClientOnboarding } from '@/lib/aido/database/client-onboarding';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const {
      clientId,
      gscPropertyUrl,
      gbpLocationIds,
      analyticsPropertyId,
      websiteUrl,
      clientInput
    } = body;

    // Create onboarding record
    const onboarding = await createClientOnboarding({
      clientId,
      workspaceId,
      gscPropertyUrl,
      gbpLocationIds,
      analyticsPropertyId,
      status: 'data_collection'
    });

    // Trigger background job to collect and analyze data
    await triggerOnboardingAnalysis(onboarding.id, websiteUrl, clientInput);

    return NextResponse.json({
      success: true,
      onboardingId: onboarding.id,
      message: 'Onboarding started. Analysis will complete in 5-10 minutes.'
    });

  } catch (error) {
    console.error('Onboarding start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Background Job: Complete Onboarding Analysis

```typescript
// src/lib/aido/onboarding/orchestrator.ts
export async function completeOnboardingAnalysis(
  onboardingId: string,
  websiteUrl: string,
  clientInput: any
) {
  try {
    // Step 1: Fetch onboarding record
    const onboarding = await getClientOnboarding(onboardingId);

    // Step 2: Collect data from connected sources
    const [gscInsights, gbpInsights, analyticsInsights, websiteContent] = await Promise.all([
      onboarding.gscConnected
        ? analyzeGSCData(onboarding.gscPropertyUrl!, '90daysAgo', 'today')
        : null,
      onboarding.gbpConnected
        ? analyzeGBPData(onboarding.gbpAccountId!, onboarding.gbpLocationIds)
        : null,
      onboarding.analyticsConnected
        ? analyzeWebsiteAnalytics(onboarding.clientId, onboarding.analyticsPropertyId!)
        : null,
      scrapeWebsiteContent(websiteUrl)
    ]);

    // Step 3: Generate business profile
    const businessProfile = await generateBusinessProfile(
      gscInsights!,
      gbpInsights!,
      analyticsInsights!,
      websiteContent,
      clientInput
    );

    // Step 4: Discover authority figure
    const authorityFigure = await discoverAuthorityFigure(
      businessProfile,
      websiteContent.aboutPage,
      websiteContent.teamPage,
      gbpInsights!.reviewThemes,
      clientInput
    );

    // Step 5: Generate audience personas
    const audiencePersonas = await generateAudiencePersonas(
      gscInsights!,
      gbpInsights!,
      analyticsInsights!,
      businessProfile
    );

    // Step 6: Analyze competitors
    const competitorAnalysis = await analyzeCompetitors(
      websiteUrl,
      clientInput.competitorDomains || [],
      gscInsights!,
      businessProfile
    );

    // Step 7: Save insights to database
    await updateClientOnboarding(onboardingId, {
      businessProfile,
      authorityFigure,
      audiencePersonas,
      competitorAnalysis,
      status: 'complete',
      completedAt: new Date()
    });

    // Step 8: Auto-generate initial topics and intent clusters
    await autoGenerateInitialContent(
      onboarding.clientId,
      onboarding.workspaceId,
      businessProfile,
      audiencePersonas,
      competitorAnalysis
    );

    console.log(`Onboarding complete for client ${onboarding.clientId}`);

  } catch (error) {
    console.error('Onboarding analysis error:', error);
    await updateClientOnboarding(onboardingId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

---

## Dashboard UI: Onboarding Flow

### Step 1: Connect Data Sources

```typescript
// src/app/dashboard/aido/onboarding/[clientId]/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AIDOOnboardingPage({ params }: { params: { clientId: string } }) {
  const [step, setStep] = useState(1);
  const [connections, setConnections] = useState({
    gscPropertyUrl: '',
    gbpLocationIds: [],
    analyticsPropertyId: '',
    websiteUrl: '',
    competitorDomains: []
  });

  const handleGSCConnect = async () => {
    // OAuth flow to connect Google Search Console
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/api/integrations/gsc/callback&scope=https://www.googleapis.com/auth/webmasters.readonly&response_type=code`;
    window.location.href = authUrl;
  };

  const handleStartAnalysis = async () => {
    const response = await fetch(`/api/aido/onboarding/start?workspaceId=${workspaceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        clientId: params.clientId,
        ...connections
      })
    });

    const result = await response.json();
    if (result.success) {
      setStep(3); // Show "Analysis in progress" screen
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AIDO Client Onboarding</h1>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 1: Connect Data Sources</h2>

          <div className="space-y-4">
            <div>
              <Label>Google Search Console</Label>
              <Button onClick={handleGSCConnect}>
                Connect GSC
              </Button>
              <p className="text-sm text-gray-500">
                Analyze search queries, click patterns, and ranking positions
              </p>
            </div>

            <div>
              <Label>Google Business Profile</Label>
              <Button onClick={handleGBPConnect}>
                Connect GBP
              </Button>
              <p className="text-sm text-gray-500">
                Extract customer questions, reviews, and search queries
              </p>
            </div>

            <div>
              <Label>Google Analytics</Label>
              <Button onClick={handleAnalyticsConnect}>
                Connect Analytics
              </Button>
              <p className="text-sm text-gray-500">
                Understand conversion paths and audience demographics
              </p>
            </div>

            <div>
              <Label>Website URL</Label>
              <Input
                placeholder="https://example.com"
                value={connections.websiteUrl}
                onChange={(e) => setConnections({ ...connections, websiteUrl: e.target.value })}
              />
            </div>

            <div>
              <Label>Competitor Domains (comma-separated)</Label>
              <Input
                placeholder="competitor1.com, competitor2.com"
                onChange={(e) => setConnections({
                  ...connections,
                  competitorDomains: e.target.value.split(',').map(d => d.trim())
                })}
              />
            </div>

            <Button onClick={() => setStep(2)}>
              Continue to Initial Input
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 2: Initial Business Input</h2>

          <div className="space-y-4">
            <div>
              <Label>Business Description</Label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded"
                placeholder="Describe your business, services, and what makes you unique..."
              />
            </div>

            <div>
              <Label>Owner/Primary Expert Name</Label>
              <Input placeholder="John Smith" />
            </div>

            <div>
              <Label>Owner LinkedIn Profile</Label>
              <Input placeholder="https://linkedin.com/in/johnsmith" />
            </div>

            <Button onClick={handleStartAnalysis}>
              Start AI Analysis
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Analysis in Progress...</h2>
          <p className="text-gray-600 mb-6">
            Our AI is analyzing your data sources to discover:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-2 mb-6">
            <li>Business profile and expertise areas</li>
            <li>Authority figure for content authorship</li>
            <li>Target audience personas with actual questions</li>
            <li>Competitive gaps and opportunities</li>
          </ul>
          <p className="text-sm text-gray-500">
            This typically takes 5-10 minutes. You'll be notified when complete.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Success Metrics

**Onboarding Completion**: 90%+ clients complete full analysis within 24 hours

**Data Quality**:
- Business profile accuracy: 95%+ (verified by client review)
- Authority figure identification: 100% (must have LinkedIn profile)
- Persona questions: 15-20 per persona (used for H2 headings)

**Time to First Content**:
- Target: Within 48 hours of onboarding completion
- Auto-generate 3-5 initial content briefs based on personas

---

**Document Status**: Complete
**Last Updated**: 2025-11-25
**Priority**: P0 - REQUIRED BEFORE CONTENT GENERATION
**Dependencies**: Backend Agent API infrastructure, Content Agent AI services
**Next Action**: Implement onboarding workflow in Phase 2.5 (after core pipelines)
