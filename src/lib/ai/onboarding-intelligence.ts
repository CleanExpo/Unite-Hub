/**
 * AIDO 2026 - Client Onboarding Intelligence
 *
 * AI-powered discovery system that generates:
 * 1. Business Profile (what they do, expertise, USP)
 * 2. Authority Figure (E-E-A-T verification)
 * 3. Target Audience Personas (from GSC, GBP, GA4 data)
 *
 * Uses Claude Opus 4 for high-quality, context-aware generation
 */

import Anthropic from '@anthropic-ai/sdk';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

// ============================================================================
// Types
// ============================================================================

export interface BusinessProfileInput {
  businessName: string;
  industry: string;
  services: string[];
  yearsInBusiness: number;
  location: string;
  website?: string;
  gscTopQueries?: Array<{ query: string; clicks: number; impressions: number }>;
  gbpInsights?: {
    totalViews: number;
    searchQueries: Array<{ query: string; count: number }>;
    customerQuestions: Array<{ question: string; votes: number }>;
    reviews: Array<{ text: string; rating: number }>;
  };
}

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  whatWeDo: string;
  expertiseAreas: string[];
  uniqueValueProposition: string;
  yearsInBusiness: number;
  geographicCoverage: string[];
  competitiveDifferentiators: string[];
  targetMarkets: string[];
  coreServices: Array<{
    name: string;
    description: string;
    keyBenefits: string[];
  }>;
}

export interface AuthorityFigureInput {
  fullName: string;
  role: string;
  yearsExperience: number;
  linkedinUrl?: string;
  facebookUrl?: string;
  credentials?: string[];
  previousWork?: string[];
  education?: string[];
}

export interface AuthorityFigure {
  fullName: string;
  role: string;
  yearsExperience: number;
  linkedinUrl: string;
  facebookUrl: string;
  professionalBio: string; // 150-200 words
  expertise: string[];
  credentials: string[];
  notableAchievements: string[];
  aboutMeShort: string; // 50-75 words for bylines
  aboutMeLong: string; // 300-400 words for About page
}

export interface AudiencePersona {
  personaName: string;
  description: string;
  demographics: {
    ageRange: string;
    location: string;
    jobTitle: string;
    incomeLevel: string;
  };
  psychographics: {
    goals: string[];
    painPoints: string[];
    motivations: string[];
    objections: string[];
  };
  searchBehavior: {
    topQueries: string[];
    searchIntent: string; // informational, navigational, transactional
    devicePreference: string; // mobile, desktop, tablet
  };
  contentPreferences: {
    formatPreference: string[]; // articles, videos, infographics
    topicInterests: string[];
    trustFactors: string[];
  };
  buyingJourney: {
    stage: string; // awareness, consideration, decision
    keyQuestions: string[];
    decisionFactors: string[];
  };
}

export interface OnboardingIntelligence {
  businessProfile: BusinessProfile;
  authorityFigure: AuthorityFigure;
  audiencePersonas: AudiencePersona[];
  contentStrategy: {
    primaryTopics: string[];
    secondaryTopics: string[];
    contentPillars: Array<{
      pillarName: string;
      description: string;
      targetPersona: string;
      keyQuestions: string[];
    }>;
  };
}

// ============================================================================
// Business Profile Generation
// ============================================================================

export async function generateBusinessProfile(
  input: BusinessProfileInput
): Promise<BusinessProfile> {
  const prompt = `You are an expert business analyst specializing in competitive positioning and value proposition development.

Given the following business information:
- Business Name: ${input.businessName}
- Industry: ${input.industry}
- Services: ${input.services.join(', ')}
- Years in Business: ${input.yearsInBusiness}
- Location: ${input.location}
${input.website ? `- Website: ${input.website}` : ''}

${input.gscTopQueries ? `
Google Search Console Top Queries (what customers search for):
${input.gscTopQueries.slice(0, 20).map(q => `- "${q.query}" (${q.clicks} clicks, ${q.impressions} impressions)`).join('\n')}
` : ''}

${input.gbpInsights ? `
Google Business Profile Insights:
- Total Views: ${input.gbpInsights.totalViews}

Top Customer Search Queries:
${input.gbpInsights.searchQueries.slice(0, 10).map(q => `- "${q.query}" (${q.count} searches)`).join('\n')}

Customer Questions:
${input.gbpInsights.customerQuestions.slice(0, 10).map(q => `- "${q.question}" (${q.votes} votes)`).join('\n')}

Recent Reviews (sample):
${input.gbpInsights.reviews.slice(0, 5).map(r => `- ${r.rating}⭐: "${r.text.slice(0, 100)}..."`).join('\n')}
` : ''}

Generate a comprehensive business profile in JSON format with the following structure:

{
  "businessName": "${input.businessName}",
  "tagline": "A compelling 8-12 word tagline that captures the unique value proposition",
  "whatWeDo": "2-3 sentence description of what the business does and who they serve",
  "expertiseAreas": ["Area 1", "Area 2", "Area 3"],
  "uniqueValueProposition": "1-2 sentences explaining what makes this business different from competitors",
  "yearsInBusiness": ${input.yearsInBusiness},
  "geographicCoverage": ["Location 1", "Location 2"],
  "competitiveDifferentiators": ["Differentiator 1", "Differentiator 2", "Differentiator 3"],
  "targetMarkets": ["Market segment 1", "Market segment 2"],
  "coreServices": [
    {
      "name": "Service Name",
      "description": "2-3 sentence description",
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"]
    }
  ]
}

IMPORTANT:
1. Base the profile on ACTUAL customer search behavior from GSC and GBP data
2. Use customer language (from searches and questions), not marketing jargon
3. Identify 3-5 expertise areas that align with top customer queries
4. Make the UVP specific and evidence-based (e.g., "15% faster turnaround" not "quality service")
5. Extract competitive differentiators from review patterns (what customers praise most)
6. Return ONLY valid JSON, no explanation text`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: 'You are an expert business analyst specializing in competitive positioning and value proposition development.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Log cache performance
  const cacheStats = extractCacheStats(message, 'claude-opus-4-5-20251101');
  logCacheStats('Onboarding:generateBusinessProfile', cacheStats);

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const businessProfile = JSON.parse(jsonMatch[0]) as BusinessProfile;
  return businessProfile;
}

// ============================================================================
// Authority Figure Generation
// ============================================================================

export async function generateAuthorityFigure(
  input: AuthorityFigureInput,
  businessProfile: BusinessProfile
): Promise<AuthorityFigure> {
  const prompt = `You are an expert content strategist specializing in E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) optimization for Google.

Given the following authority figure information:
- Full Name: ${input.fullName}
- Role: ${input.role}
- Years of Experience: ${input.yearsExperience}
${input.linkedinUrl ? `- LinkedIn: ${input.linkedinUrl}` : ''}
${input.facebookUrl ? `- Facebook: ${input.facebookUrl}` : ''}
${input.credentials ? `- Credentials: ${input.credentials.join(', ')}` : ''}
${input.previousWork ? `- Previous Work: ${input.previousWork.join(', ')}` : ''}
${input.education ? `- Education: ${input.education.join(', ')}` : ''}

Business Context:
- Business: ${businessProfile.businessName}
- Industry: ${businessProfile.expertiseAreas.join(', ')}
- What We Do: ${businessProfile.whatWeDo}

Generate a comprehensive authority figure profile in JSON format:

{
  "fullName": "${input.fullName}",
  "role": "${input.role}",
  "yearsExperience": ${input.yearsExperience},
  "linkedinUrl": "${input.linkedinUrl || 'https://linkedin.com/in/profile'}",
  "facebookUrl": "${input.facebookUrl || 'https://facebook.com/profile'}",
  "professionalBio": "150-200 word bio that establishes expertise and credibility. Include: years of experience, key achievements, industry recognition, specific outcomes delivered. Written in third person.",
  "expertise": ["Expertise area 1", "Expertise area 2", "Expertise area 3"],
  "credentials": ["Credential 1", "Credential 2"],
  "notableAchievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "aboutMeShort": "50-75 word bio for article bylines. Third person. Format: '[Name] is a [role] with [X] years of experience in [industry]. They specialize in [expertise areas]. [Notable achievement].'",
  "aboutMeLong": "300-400 word comprehensive bio for About page. Third person. Include: background story, career progression, philosophy, approach, why they do what they do, personal touch (hobbies/values that relate to work)."
}

CRITICAL E-E-A-T REQUIREMENTS:
1. **Experience**: Mention specific projects, outcomes, years of hands-on work
2. **Expertise**: Cite credentials, certifications, specialized knowledge
3. **Authoritativeness**: Reference industry recognition, publications, speaking engagements
4. **Trustworthiness**: Include social proof (LinkedIn, Facebook), verifiable credentials

TONE:
- Confident but not arrogant
- Specific with numbers and outcomes
- Human and relatable (not corporate robot)
- Third person professional

Return ONLY valid JSON, no explanation text`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: 'You are an expert content strategist specializing in E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) optimization for Google.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Log cache performance
  const cacheStats = extractCacheStats(message, 'claude-opus-4-5-20251101');
  logCacheStats('Onboarding:generateAuthorityFigure', cacheStats);

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const authorityFigure = JSON.parse(jsonMatch[0]) as AuthorityFigure;
  return authorityFigure;
}

// ============================================================================
// Audience Persona Generation
// ============================================================================

export async function generateAudiencePersonas(
  businessProfile: BusinessProfile,
  gscData?: Array<{ query: string; clicks: number; impressions: number }>,
  gbpData?: {
    searchQueries: Array<{ query: string; count: number }>;
    customerQuestions: Array<{ question: string; votes: number }>;
  },
  ga4Data?: {
    demographics: Array<{ ageRange: string; percentage: number }>;
    topPages: Array<{ path: string; views: number }>;
    avgSessionDuration: number;
  }
): Promise<AudiencePersona[]> {
  const prompt = `You are an expert marketing strategist specializing in audience segmentation and persona development.

Business Context:
- Business: ${businessProfile.businessName}
- Industry: ${businessProfile.expertiseAreas.join(', ')}
- What We Do: ${businessProfile.whatWeDo}
- Target Markets: ${businessProfile.targetMarkets.join(', ')}

${gscData ? `
Google Search Console Data (what they're searching for):
${gscData.slice(0, 30).map(q => `- "${q.query}" (${q.clicks} clicks, ${q.impressions} impressions)`).join('\n')}
` : ''}

${gbpData ? `
Google Business Profile Data (local search behavior):
Top Search Queries:
${gbpData.searchQueries.slice(0, 15).map(q => `- "${q.query}" (${q.count} searches)`).join('\n')}

Customer Questions:
${gbpData.customerQuestions.slice(0, 10).map(q => `- "${q.question}" (${q.votes} votes)`).join('\n')}
` : ''}

${ga4Data ? `
Google Analytics 4 Data (who they are):
Demographics:
${ga4Data.demographics.map(d => `- ${d.ageRange}: ${d.percentage}%`).join('\n')}

Top Pages:
${ga4Data.topPages.slice(0, 10).map(p => `- ${p.path} (${p.views} views)`).join('\n')}

Avg Session Duration: ${ga4Data.avgSessionDuration} seconds
` : ''}

Generate 3-5 distinct audience personas based on the search behavior patterns and business context.

Return as JSON array:

[
  {
    "personaName": "Descriptive name (e.g., 'Budget-Conscious Homeowner', 'Commercial Project Manager')",
    "description": "1-2 sentence overview of this persona",
    "demographics": {
      "ageRange": "25-34",
      "location": "Brisbane, Australia",
      "jobTitle": "Project Manager",
      "incomeLevel": "$80k-$120k"
    },
    "psychographics": {
      "goals": ["Goal 1", "Goal 2", "Goal 3"],
      "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
      "motivations": ["Motivation 1", "Motivation 2"],
      "objections": ["Objection 1", "Objection 2"]
    },
    "searchBehavior": {
      "topQueries": ["Actual query from GSC data 1", "Query 2", "Query 3"],
      "searchIntent": "informational",
      "devicePreference": "mobile"
    },
    "contentPreferences": {
      "formatPreference": ["how-to guides", "case studies", "video tutorials"],
      "topicInterests": ["Topic 1", "Topic 2", "Topic 3"],
      "trustFactors": ["Factor 1", "Factor 2"]
    },
    "buyingJourney": {
      "stage": "consideration",
      "keyQuestions": ["Question 1", "Question 2", "Question 3"],
      "decisionFactors": ["Factor 1", "Factor 2"]
    }
  }
]

CRITICAL REQUIREMENTS:
1. Base personas on ACTUAL search query patterns (cluster similar queries)
2. Use real customer language from GSC and GBP data
3. Identify distinct search intents (informational vs transactional vs navigational)
4. Map personas to buying journey stages (awareness, consideration, decision)
5. Make demographics realistic for the industry and location
6. Extract pain points from customer questions in GBP data

PERSONA DIFFERENTIATION:
- Each persona should have distinct search behavior patterns
- Avoid overlap (e.g., don't create 5 similar personas)
- Cover the full buying journey (at least one persona per stage)

Return ONLY valid JSON array, no explanation text`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 8192,
    system: [
      {
        type: 'text',
        text: 'You are an expert marketing strategist specializing in audience segmentation and persona development.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Log cache performance
  const cacheStats = extractCacheStats(message, 'claude-opus-4-5-20251101');
  logCacheStats('Onboarding:generateAudiencePersonas', cacheStats);

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const personas = JSON.parse(jsonMatch[0]) as AudiencePersona[];
  return personas;
}

// ============================================================================
// Complete Onboarding Intelligence
// ============================================================================

export async function generateOnboardingIntelligence(
  businessInput: BusinessProfileInput,
  authorityInput: AuthorityFigureInput,
  gscData?: Array<{ query: string; clicks: number; impressions: number }>,
  gbpData?: {
    totalViews: number;
    searchQueries: Array<{ query: string; count: number }>;
    customerQuestions: Array<{ question: string; votes: number }>;
    reviews: Array<{ text: string; rating: number }>;
  },
  ga4Data?: {
    demographics: Array<{ ageRange: string; percentage: number }>;
    topPages: Array<{ path: string; views: number }>;
    avgSessionDuration: number;
  }
): Promise<OnboardingIntelligence> {
  // Step 1: Generate Business Profile
  const businessProfile = await generateBusinessProfile({
    ...businessInput,
    gscTopQueries: gscData,
    gbpInsights: gbpData,
  });

  // Step 2: Generate Authority Figure
  const authorityFigure = await generateAuthorityFigure(authorityInput, businessProfile);

  // Step 3: Generate Audience Personas
  const audiencePersonas = await generateAudiencePersonas(
    businessProfile,
    gscData,
    gbpData,
    ga4Data
  );

  // Step 4: Generate Content Strategy (based on personas)
  const contentStrategy = await generateContentStrategy(businessProfile, audiencePersonas);

  return {
    businessProfile,
    authorityFigure,
    audiencePersonas,
    contentStrategy,
  };
}

// ============================================================================
// Content Strategy Generation
// ============================================================================

async function generateContentStrategy(
  businessProfile: BusinessProfile,
  personas: AudiencePersona[]
): Promise<OnboardingIntelligence['contentStrategy']> {
  const prompt = `You are an expert content strategist specializing in SEO and audience-driven content planning.

Business Profile:
- Business: ${businessProfile.businessName}
- Expertise: ${businessProfile.expertiseAreas.join(', ')}
- Services: ${businessProfile.coreServices.map(s => s.name).join(', ')}

Audience Personas:
${personas.map((p, idx) => `
${idx + 1}. ${p.personaName} (${p.buyingJourney.stage} stage)
   - Search Intent: ${p.searchBehavior.searchIntent}
   - Top Queries: ${p.searchBehavior.topQueries.join(', ')}
   - Key Questions: ${p.buyingJourney.keyQuestions.join(', ')}
`).join('\n')}

Generate a content strategy that maps content pillars to audience personas.

Return as JSON:

{
  "primaryTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "secondaryTopics": ["Topic 4", "Topic 5", "Topic 6"],
  "contentPillars": [
    {
      "pillarName": "Descriptive pillar name",
      "description": "2-3 sentence explanation of what this pillar covers",
      "targetPersona": "Persona name this pillar serves",
      "keyQuestions": ["H2-ready question 1", "Question 2", "Question 3"]
    }
  ]
}

REQUIREMENTS:
1. Create 3-5 content pillars (one per core expertise area)
2. Each pillar should target a specific persona
3. Extract key questions from persona search behavior
4. Ensure questions are H2-ready (direct questions users ask)
5. Cover all buying journey stages (awareness, consideration, decision)

Return ONLY valid JSON, no explanation text`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: 'You are an expert content strategist specializing in SEO and audience-driven content planning.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Log cache performance
  const cacheStats = extractCacheStats(message, 'claude-opus-4-5-20251101');
  logCacheStats('Onboarding:generateContentStrategy', cacheStats);

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const contentStrategy = JSON.parse(jsonMatch[0]) as OnboardingIntelligence['contentStrategy'];
  return contentStrategy;
}
