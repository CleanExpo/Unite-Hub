/**
 * CONVEX SEO Agent
 *
 * Enhances SEO analysis with CONVEX frameworks:
 * - Semantic cluster mapping
 * - Topical authority scoring (technical + topical + authority)
 * - Search intent mapping
 * - SERP gap identification
 * - Geo-signal consolidation
 * - Power content recommendations
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

interface SemanticCluster {
  primaryKeyword: string;
  intent: "awareness" | "consideration" | "decision";
  searchVolume: number;
  difficulty: number; // 0-100
  relatedKeywords: {
    awareness: string[];
    consideration: string[];
    decision: string[];
  };
  contentStrategy: string;
}

interface TopicalAuthorityScore {
  pillarTopic: string;
  technicalScore: number; // 0-100: Core Web Vitals, mobile, site structure
  topicalScore: number; // 0-100: Depth, breadth, expertise signals
  authorityScore: number; // 0-100: Backlinks, domain authority, expert signals
  overallScore: number; // 0-100: Weighted average
  gaps: string[];
  recommendations: string[];
}

interface SearchIntentAnalysis {
  keyword: string;
  intent: "informational" | "navigational" | "commercial" | "transactional";
  customerJourney: "awareness" | "consideration" | "decision";
  contentType: string;
  contentFormat: string;
  expectedOutcome: string;
}

interface SerpGap {
  keyword: string;
  topRankers: string[]; // Domain names
  contentTypes: string[];
  gaps: string[]; // What's missing
  opportunity: string; // How to exploit gap
  difficulty: "easy" | "medium" | "hard";
}

interface GeoSignalScore {
  location: string;
  googleBusinessProfileScore: number; // 0-100
  citationConsistencyScore: number; // 0-100
  reviewScore: number; // 0-100
  geoContentScore: number; // 0-100
  overallScore: number; // 0-100
  recommendations: string[];
}

interface PowerContentBlueprint {
  topic: string;
  targetKeyword: string;
  searchVolume: number;
  sections: {
    name: string;
    wordCount: number;
    purpose: string;
    seoOptimization: string[];
  }[];
  internalLinkOpportunities: string[];
  externalAuthoritySources: string[];
  conversionOpportunities: string[];
}

interface ConvexSeoAnalysis {
  semanticClusters: SemanticCluster[];
  topicalAuthorityScores: TopicalAuthorityScore[];
  searchIntentMapping: SearchIntentAnalysis[];
  serpGaps: SerpGap[];
  geoSignals: GeoSignalScore[];
  powerContentBlueprints: PowerContentBlueprint[];
}

// ============================================================================
// ANTHROPIC CLIENT
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// SEMANTIC CLUSTER MAPPING
// ============================================================================

export async function mapSemanticClusters(
  primaryKeyword: string,
  industry: string
): Promise<SemanticCluster[]> {
  logger.info(
    `[CONVEX-SEO] Mapping semantic clusters for "${primaryKeyword}"`
  );

  const systemPrompt = `You are a CONVEX SEO expert specializing in semantic cluster mapping.

Apply CONVEX SEO Pattern Library principles:
1. Group keywords by search intent (awareness, consideration, decision)
2. Identify emotional, functional, and transactional dimensions
3. Map customer journey stages
4. Estimate search volume and competition

For each cluster, provide:
- Primary keyword
- Search intent level
- Related keywords organized by journey stage
- Estimated search volume
- Keyword difficulty (0-100)
- Content strategy

Return analysis as JSON.`;

  const userPrompt = `Create semantic clusters for:

Primary Keyword: "${primaryKeyword}"
Industry: ${industry}

For this keyword, identify:
1. Search intent (awareness/consideration/decision)
2. Related awareness keywords (educational, how-to)
3. Related consideration keywords (comparison, features)
4. Related decision keywords (pricing, reviews, buying intent)
5. Estimated monthly search volume (total across cluster)
6. Keyword difficulty 0-100

Return JSON structure:
{
  "clusters": [
    {
      "primaryKeyword": "keyword",
      "intent": "awareness|consideration|decision",
      "searchVolume": 5000,
      "difficulty": 35,
      "relatedKeywords": {
        "awareness": ["keyword1", "keyword2"],
        "consideration": ["keyword3", "keyword4"],
        "decision": ["keyword5", "keyword6"]
      },
      "contentStrategy": "description of recommended content approach"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      thinking: {
        type: "enabled",
        budget_tokens: 5000,
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(`[CONVEX-SEO] Created ${parsed.clusters.length} semantic clusters`);

    return parsed.clusters;
  } catch (error) {
    logger.error("[CONVEX-SEO] Semantic cluster mapping error:", error);
    throw error;
  }
}

// ============================================================================
// TOPICAL AUTHORITY SCORING
// ============================================================================

export async function scoreTopicalAuthority(
  pillarTopic: string,
  subtopics: string[],
  yourDomain: string
): Promise<TopicalAuthorityScore> {
  logger.info(`[CONVEX-SEO] Scoring topical authority for "${pillarTopic}"`);

  const systemPrompt = `You are a CONVEX SEO expert specializing in topical authority assessment.

Apply CONVEX SEO 3-Pillar Scoring Model:
1. Technical Score (0-100): Site speed, mobile optimization, crawlability
2. Topical Score (0-100): Content depth, breadth, internal linking
3. Authority Score (0-100): Backlinks, domain authority, expert signals

For each pillar, identify:
- Current strength (0-100)
- Key gaps
- Specific recommendations to improve

Return analysis as JSON with scores and actionable recommendations.`;

  const userPrompt = `Assess topical authority for:

Pillar Topic: "${pillarTopic}"
Subtopics: ${subtopics.join(", ")}
Domain: ${yourDomain}

Evaluate:
1. Technical SEO Score (0-100)
   - Core Web Vitals
   - Mobile optimization
   - Site structure and crawlability

2. Topical SEO Score (0-100)
   - Content depth on pillar topic
   - Breadth of subtopic coverage
   - Internal linking structure
   - Expertise signals

3. Authority Score (0-100)
   - Domain authority
   - Referring domains
   - Topically-relevant backlinks
   - Author expertise signals

Return JSON structure:
{
  "score": {
    "pillarTopic": "topic",
    "technicalScore": 75,
    "topicalScore": 60,
    "authorityScore": 45,
    "overallScore": 60,
    "gaps": ["gap1", "gap2"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1536,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(
      `[CONVEX-SEO] Topical authority score: ${parsed.score.overallScore}/100`
    );

    return parsed.score;
  } catch (error) {
    logger.error("[CONVEX-SEO] Topical authority scoring error:", error);
    throw error;
  }
}

// ============================================================================
// SEARCH INTENT MAPPING
// ============================================================================

export async function mapSearchIntent(
  keywords: string[]
): Promise<SearchIntentAnalysis[]> {
  logger.info(`[CONVEX-SEO] Mapping search intent for ${keywords.length} keywords`);

  const systemPrompt = `You are a CONVEX SEO expert specializing in search intent analysis.

For each keyword, determine:
1. Search Intent Type: informational, navigational, commercial, or transactional
2. Customer Journey Stage: awareness, consideration, or decision
3. Content Type: Blog post, how-to, comparison, product page, etc.
4. Content Format: Text, video, interactive tool, etc.
5. Expected Outcome: What customer expects to find

Return analysis as JSON.`;

  const userPrompt = `Analyze search intent for these keywords:

Keywords: ${keywords.join(", ")}

For each keyword, determine:
1. Intent type (informational/navigational/commercial/transactional)
2. Customer journey stage (awareness/consideration/decision)
3. Recommended content type
4. Recommended content format
5. Expected customer outcome

Return JSON structure:
{
  "intents": [
    {
      "keyword": "keyword",
      "intent": "informational|navigational|commercial|transactional",
      "customerJourney": "awareness|consideration|decision",
      "contentType": "blog post, how-to guide, comparison, etc.",
      "contentFormat": "text, video, interactive, tool",
      "expectedOutcome": "what customer expects to find"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      thinking: {
        type: "enabled",
        budget_tokens: 5000,
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(`[CONVEX-SEO] Mapped intent for ${parsed.intents.length} keywords`);

    return parsed.intents;
  } catch (error) {
    logger.error("[CONVEX-SEO] Search intent mapping error:", error);
    throw error;
  }
}

// ============================================================================
// SERP GAP IDENTIFICATION
// ============================================================================

export async function identifySerpGaps(
  keyword: string,
  yourDomain: string
): Promise<SerpGap> {
  logger.info(`[CONVEX-SEO] Identifying SERP gaps for "${keyword}"`);

  const systemPrompt = `You are a CONVEX SEO expert specializing in SERP gap analysis.

Analyze the top 10 results for a keyword and identify:
1. What content types are ranking
2. What topics are covered
3. What gaps exist (what's not covered)
4. How to exploit the gap

Return analysis as JSON.`;

  const userPrompt = `Analyze SERP gaps for:

Keyword: "${keyword}"
Your Domain: ${yourDomain}

Based on typical SERP results for this keyword:
1. Identify top-ranking domains
2. Identify content types (blog, product page, comparison, etc.)
3. Identify topics covered in top 10 results
4. Identify gaps (topics not covered or poorly covered)
5. Recommend how to exploit the gap
6. Rate difficulty of ranking (easy/medium/hard)

Return JSON structure:
{
  "gap": {
    "keyword": "keyword",
    "topRankers": ["domain1.com", "domain2.com"],
    "contentTypes": ["blog", "product page"],
    "gaps": ["gap1 - what's not covered", "gap2"],
    "opportunity": "how to exploit the gap",
    "difficulty": "easy|medium|hard"
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(`[CONVEX-SEO] Identified ${parsed.gap.gaps.length} SERP gaps`);

    return parsed.gap;
  } catch (error) {
    logger.error("[CONVEX-SEO] SERP gap identification error:", error);
    throw error;
  }
}

// ============================================================================
// GEO-SIGNAL CONSOLIDATION
// ============================================================================

export async function analyzeGeoSignals(
  businessLocation: string,
  targetMarkets: string[]
): Promise<GeoSignalScore> {
  logger.info(`[CONVEX-SEO] Analyzing geo-signals for ${businessLocation}`);

  const systemPrompt = `You are a CONVEX SEO expert specializing in local SEO and geo-signal optimization.

Assess geo-signal strength across:
1. Google Business Profile optimization
2. Local citation consistency
3. Review signals
4. Geo-specific content

Return analysis as JSON with scores and recommendations.`;

  const userPrompt = `Analyze geo-signals for:

Business Location: ${businessLocation}
Target Markets: ${targetMarkets.join(", ")}

Evaluate:
1. Google Business Profile Score (0-100)
   - Completeness of profile
   - Accuracy of NAP (name, address, phone)
   - Review volume and rating
   - Post frequency

2. Citation Consistency Score (0-100)
   - Presence in major directories
   - Consistency of NAP
   - Quality of citations

3. Review Score (0-100)
   - Number of reviews
   - Average rating
   - Recency of reviews

4. Geo-Content Score (0-100)
   - Location-specific pages
   - Local case studies
   - Community involvement signals

Return JSON structure:
{
  "score": {
    "location": "location",
    "googleBusinessProfileScore": 85,
    "citationConsistencyScore": 75,
    "reviewScore": 80,
    "geoContentScore": 60,
    "overallScore": 75,
    "recommendations": ["recommendation1", "recommendation2"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(
      `[CONVEX-SEO] Geo-signal score: ${parsed.score.overallScore}/100`
    );

    return parsed.score;
  } catch (error) {
    logger.error("[CONVEX-SEO] Geo-signal analysis error:", error);
    throw error;
  }
}

// ============================================================================
// POWER CONTENT BLUEPRINT
// ============================================================================

export async function createPowerContentBlueprint(
  topic: string,
  targetKeyword: string,
  industry: string
): Promise<PowerContentBlueprint> {
  logger.info(`[CONVEX-SEO] Creating power content blueprint for "${topic}"`);

  const systemPrompt = `You are a CONVEX SEO expert specializing in power content creation.

CONVEX Power Content Framework:
1. Comprehensive depth (1500-3000 words)
2. Clear structure with H2/H3 hierarchy
3. Original insights and examples
4. Strategic internal linking
5. Authority external citations
6. Conversion-focused CTA

Return blueprint as JSON.`;

  const userPrompt = `Create power content blueprint:

Topic: "${topic}"
Target Keyword: "${targetKeyword}"
Industry: ${industry}

Design a comprehensive content piece that:
1. Targets primary keyword + 5+ related keywords
2. Covers all customer journey stages
3. Includes 6-8 main sections with subsections
4. Integrates internal linking opportunities
5. References authoritative external sources
6. Includes conversion opportunities

Return JSON structure:
{
  "blueprint": {
    "topic": "topic",
    "targetKeyword": "keyword",
    "searchVolume": 5000,
    "sections": [
      {
        "name": "section name",
        "wordCount": 500,
        "purpose": "why this section",
        "seoOptimization": ["optimization1", "optimization2"]
      }
    ],
    "internalLinkOpportunities": ["link1 with anchor text", "link2"],
    "externalAuthoritySources": ["source1", "source2"],
    "conversionOpportunities": ["cta1", "cta2"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      thinking: {
        type: "enabled",
        budget_tokens: 5000,
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content.find((block) => block.type === "text");
    if (!content || content.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info(
      `[CONVEX-SEO] Blueprint created with ${parsed.blueprint.sections.length} sections`
    );

    return parsed.blueprint;
  } catch (error) {
    logger.error("[CONVEX-SEO] Power content blueprint error:", error);
    throw error;
  }
}

// ============================================================================
// COMPLETE CONVEX SEO ANALYSIS
// ============================================================================

export async function generateCompleteConvexSeoAnalysis(
  domain: string,
  industry: string,
  primaryKeyword: string,
  subtopics: string[],
  targetLocation: string
): Promise<ConvexSeoAnalysis> {
  logger.info(
    `[CONVEX-SEO] Generating complete SEO analysis for ${domain}`
  );

  try {
    // Step 1: Semantic clustering
    const semanticClusters = await mapSemanticClusters(
      primaryKeyword,
      industry
    );

    // Step 2: Topical authority scoring
    const topicalAuthorityScores = [
      await scoreTopicalAuthority(primaryKeyword, subtopics, domain),
    ];

    // Step 3: Search intent mapping
    const allKeywords = [
      primaryKeyword,
      ...subtopics,
      ...semanticClusters
        .flatMap((c) => [
          ...c.relatedKeywords.awareness,
          ...c.relatedKeywords.consideration,
          ...c.relatedKeywords.decision,
        ])
        .slice(0, 10),
    ];
    const searchIntentMapping = await mapSearchIntent(allKeywords);

    // Step 4: SERP gap analysis
    const serpGaps = [await identifySerpGaps(primaryKeyword, domain)];

    // Step 5: Geo-signals
    const geoSignals = [
      await analyzeGeoSignals(targetLocation, [targetLocation]),
    ];

    // Step 6: Power content blueprints
    const powerContentBlueprints = [
      await createPowerContentBlueprint(primaryKeyword, primaryKeyword, industry),
    ];

    logger.info(`[CONVEX-SEO] Analysis complete for ${domain}`);

    return {
      semanticClusters,
      topicalAuthorityScores,
      searchIntentMapping,
      serpGaps,
      geoSignals,
      powerContentBlueprints,
    };
  } catch (error) {
    logger.error(`[CONVEX-SEO] Analysis generation failed for ${domain}:`, error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SemanticCluster,
  TopicalAuthorityScore,
  SearchIntentAnalysis,
  SerpGap,
  GeoSignalScore,
  PowerContentBlueprint,
  ConvexSeoAnalysis,
};
