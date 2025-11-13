/**
 * Claude AI Prompts for Competitor Analysis
 *
 * Comprehensive prompts for analyzing competitors and identifying
 * market opportunities, gaps, and differentiation strategies.
 */

export interface CompetitorData {
  competitorName: string;
  website: string;
  description: string;
  category: "direct" | "indirect" | "potential";
  strengths: string[];
  weaknesses: string[];
  pricing?: {
    model: string;
    range: string;
  };
  targetAudience: string[];
  marketingChannels: string[];
  contentStrategy?: string;
  socialPresence: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
  };
}

export interface ClientBusinessContext {
  businessName: string;
  businessDescription: string;
  targetAudience?: string[];
  currentOfferings?: string[];
  pricing?: {
    model: string;
    range: string;
  };
  marketingChannels?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

/**
 * Analyze multiple competitors and generate comprehensive insights
 */
export function generateCompetitorAnalysisPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  return `You are an expert market analyst and business strategist. Analyze the following competitors for ${clientContext.businessName} and provide actionable insights.

CLIENT BUSINESS CONTEXT:
Business: ${clientContext.businessName}
Description: ${clientContext.businessDescription}
Target Audience: ${clientContext.targetAudience?.join(", ") || "Not specified"}
Current Offerings: ${clientContext.currentOfferings?.join(", ") || "Not specified"}
Pricing: ${clientContext.pricing ? `${clientContext.pricing.model} - ${clientContext.pricing.range}` : "Not specified"}
Marketing Channels: ${clientContext.marketingChannels?.join(", ") || "Not specified"}

COMPETITORS TO ANALYZE:
${competitors
  .map(
    (comp, idx) => `
${idx + 1}. ${comp.competitorName} (${comp.category} competitor)
   Website: ${comp.website}
   Description: ${comp.description}
   Strengths: ${comp.strengths.join(", ") || "Not specified"}
   Weaknesses: ${comp.weaknesses.join(", ") || "Not specified"}
   Pricing: ${comp.pricing ? `${comp.pricing.model} - ${comp.pricing.range}` : "Not specified"}
   Target Audience: ${comp.targetAudience.join(", ") || "Not specified"}
   Marketing Channels: ${comp.marketingChannels.join(", ") || "Not specified"}
   Content Strategy: ${comp.contentStrategy || "Not specified"}
   Social Presence: ${Object.entries(comp.socialPresence)
     .filter(([_, v]) => v)
     .map(([k, v]) => `${k}: ${v}`)
     .join(", ") || "Not specified"}
`
  )
  .join("\n")}

ANALYSIS REQUIREMENTS:

Provide a comprehensive competitive analysis in the following JSON format:

{
  "marketGaps": [
    {
      "gap": "Description of market gap",
      "opportunity": "How the client can capitalize on this gap",
      "priority": "high" | "medium" | "low"
    }
  ],
  "differentiationOpportunities": [
    {
      "area": "Area of differentiation (e.g., pricing, features, service)",
      "recommendation": "Specific recommendation",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ],
  "pricingAnalysis": {
    "marketAverage": "Average pricing in the market",
    "yourPosition": "Where the client stands (above/below/at market)",
    "recommendation": "Pricing strategy recommendation"
  },
  "swotAnalysis": {
    "strengths": ["List client's competitive strengths"],
    "weaknesses": ["List areas where client is disadvantaged"],
    "opportunities": ["Market opportunities to pursue"],
    "threats": ["Competitive threats to be aware of"]
  },
  "contentGaps": [
    {
      "topic": "Content topic/theme",
      "competitorCoverage": "How competitors are covering this",
      "yourCoverage": "How client is currently covering this (if at all)",
      "recommendation": "Content strategy recommendation"
    }
  ],
  "actionableInsights": [
    {
      "insight": "Key insight from the analysis",
      "action": "Specific action to take",
      "priority": "high" | "medium" | "low"
    }
  ],
  "aiSummary": "A 2-3 paragraph executive summary of the competitive landscape and key recommendations"
}

Focus on:
1. Identifying underserved customer segments or needs
2. Finding pricing opportunities (gaps in pricing tiers, models, or positioning)
3. Discovering content and messaging gaps
4. Uncovering channel opportunities (platforms competitors aren't leveraging)
5. Highlighting quick wins (low effort, high impact opportunities)
6. Providing strategic recommendations for long-term differentiation

Be specific, actionable, and realistic. Consider the client's resources and capabilities.`;
}

/**
 * Generate suggestions for analyzing a competitor's website
 */
export function generateCompetitorWebsiteAnalysisPrompt(
  competitorName: string,
  websiteUrl: string,
  websiteContent?: string
): string {
  return `You are a competitive intelligence analyst. Analyze the competitor website and extract key insights.

COMPETITOR: ${competitorName}
WEBSITE: ${websiteUrl}
${websiteContent ? `\nWEBSITE CONTENT:\n${websiteContent}` : ""}

Provide analysis in the following JSON format:

{
  "strengths": ["List of key strengths observed"],
  "weaknesses": ["List of weaknesses or gaps identified"],
  "targetAudience": ["Inferred target audience segments"],
  "marketingChannels": ["Marketing channels they appear to use"],
  "contentStrategy": "Description of their content and messaging strategy",
  "pricing": {
    "model": "Pricing model (e.g., subscription, one-time, freemium)",
    "range": "Approximate price range"
  },
  "keyMessages": ["Main value propositions and messages"],
  "visualStyle": "Description of their visual branding and design style",
  "callsToAction": ["Primary CTAs and conversion goals"],
  "differentiators": ["How they position themselves as unique"]
}

Be thorough and objective. Focus on observable facts and reasonable inferences.`;
}

/**
 * Identify market gaps from competitor analysis
 */
export function generateMarketGapAnalysisPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  return `You are a market opportunity analyst. Identify gaps and opportunities in the competitive landscape.

CLIENT: ${clientContext.businessName}
Description: ${clientContext.businessDescription}

COMPETITIVE LANDSCAPE:
${competitors.map((c) => `- ${c.competitorName}: ${c.description}`).join("\n")}

TARGET AUDIENCES COVERED BY COMPETITORS:
${Array.from(new Set(competitors.flatMap((c) => c.targetAudience))).join(", ")}

CHANNELS USED BY COMPETITORS:
${Array.from(new Set(competitors.flatMap((c) => c.marketingChannels))).join(", ")}

PRICING MODELS IN MARKET:
${competitors
  .filter((c) => c.pricing)
  .map((c) => `${c.competitorName}: ${c.pricing?.model}`)
  .join(", ")}

Identify market gaps in JSON format:

{
  "customerSegmentGaps": [
    {
      "segment": "Underserved customer segment",
      "reason": "Why this segment is underserved",
      "opportunity": "How to target this segment",
      "estimatedSize": "small" | "medium" | "large"
    }
  ],
  "featureGaps": [
    {
      "feature": "Missing feature/capability",
      "demand": "Evidence of demand for this feature",
      "implementation": "How to implement this feature"
    }
  ],
  "channelGaps": [
    {
      "channel": "Underutilized marketing channel",
      "reason": "Why competitors aren't using this",
      "opportunity": "How to leverage this channel"
    }
  ],
  "pricingGaps": [
    {
      "gap": "Pricing tier or model gap",
      "opportunity": "How to fill this gap",
      "rationale": "Why this would work"
    }
  ],
  "contentGaps": [
    {
      "topic": "Content topic not well covered",
      "demand": "Evidence of audience interest",
      "format": "Recommended content format"
    }
  ]
}`;
}

/**
 * Generate SWOT analysis
 */
export function generateSWOTAnalysisPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  return `You are a strategic business analyst. Conduct a SWOT analysis for ${clientContext.businessName}.

CLIENT CONTEXT:
${JSON.stringify(clientContext, null, 2)}

COMPETITORS:
${competitors.map((c) => `${c.competitorName} (${c.category}): ${c.description}`).join("\n")}

COMPETITOR STRENGTHS:
${competitors.map((c) => `${c.competitorName}: ${c.strengths.join(", ")}`).join("\n")}

COMPETITOR WEAKNESSES:
${competitors.map((c) => `${c.competitorName}: ${c.weaknesses.join(", ")}`).join("\n")}

Provide a comprehensive SWOT analysis in JSON format:

{
  "strengths": [
    "List 4-6 key competitive strengths the client has or can develop"
  ],
  "weaknesses": [
    "List 4-6 areas where the client is at a disadvantage"
  ],
  "opportunities": [
    "List 4-6 market opportunities the client can pursue"
  ],
  "threats": [
    "List 4-6 competitive threats or market challenges"
  ]
}

Each item should be specific, actionable, and directly related to the competitive landscape.`;
}

/**
 * Generate differentiation strategy recommendations
 */
export function generateDifferentiationStrategyPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  return `You are a brand strategist specializing in competitive differentiation.

CLIENT: ${clientContext.businessName}
${clientContext.businessDescription}

COMPETITIVE LANDSCAPE:
${competitors
  .map(
    (c) => `
${c.competitorName}:
- Strengths: ${c.strengths.join(", ")}
- Target: ${c.targetAudience.join(", ")}
- Channels: ${c.marketingChannels.join(", ")}
`
  )
  .join("\n")}

Recommend differentiation strategies in JSON format:

{
  "positioningRecommendations": [
    {
      "position": "Recommended market position",
      "rationale": "Why this position is advantageous",
      "messaging": "Key messaging to support this position"
    }
  ],
  "serviceInnovations": [
    {
      "innovation": "Service or feature innovation",
      "differentiation": "How this differentiates from competitors",
      "feasibility": "low" | "medium" | "high"
    }
  ],
  "experienceImprovements": [
    {
      "area": "Customer experience area",
      "improvement": "How to improve beyond competitors",
      "impact": "Expected impact on customer satisfaction"
    }
  ],
  "brandingOpportunities": [
    {
      "element": "Branding element (voice, visual, personality)",
      "approach": "Recommended approach",
      "differentiation": "How this sets the client apart"
    }
  ],
  "nicheFocus": {
    "niche": "Recommended niche or specialization",
    "reason": "Why focusing here is strategic",
    "positioning": "How to position in this niche"
  }
}`;
}

/**
 * Generate content strategy based on competitor analysis
 */
export function generateContentStrategyPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[],
  contentGaps: Array<{
    topic: string;
    competitorCoverage: string;
  }>
): string {
  return `You are a content strategist. Develop a content strategy that outperforms competitors.

CLIENT: ${clientContext.businessName}

COMPETITOR CONTENT STRATEGIES:
${competitors
  .map((c) => `${c.competitorName}: ${c.contentStrategy || "Not specified"}`)
  .join("\n")}

IDENTIFIED CONTENT GAPS:
${contentGaps.map((g) => `- ${g.topic}: ${g.competitorCoverage}`).join("\n")}

Provide content strategy recommendations in JSON format:

{
  "contentPillars": [
    {
      "pillar": "Main content theme",
      "rationale": "Why this pillar is important",
      "topics": ["Specific topic ideas"]
    }
  ],
  "formatRecommendations": [
    {
      "format": "Content format (blog, video, infographic, etc.)",
      "platform": "Best platform for this format",
      "frequency": "Recommended posting frequency",
      "rationale": "Why this format and frequency"
    }
  ],
  "competitiveAngles": [
    {
      "angle": "Unique angle or perspective",
      "differentiation": "How this differs from competitors",
      "topics": ["Topic ideas for this angle"]
    }
  ],
  "quickWins": [
    {
      "content": "Quick win content idea",
      "effort": "low",
      "impact": "Expected impact",
      "timeline": "When to execute"
    }
  ]
}`;
}

/**
 * Generate pricing strategy recommendations
 */
export function generatePricingStrategyPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  const competitorPricing = competitors
    .filter((c) => c.pricing)
    .map((c) => `${c.competitorName}: ${c.pricing?.model} - ${c.pricing?.range}`)
    .join("\n");

  return `You are a pricing strategist. Analyze competitive pricing and recommend a strategy.

CLIENT: ${clientContext.businessName}
Current Pricing: ${clientContext.pricing ? `${clientContext.pricing.model} - ${clientContext.pricing.range}` : "Not set"}

COMPETITIVE PRICING:
${competitorPricing || "Limited pricing information available"}

Provide pricing strategy in JSON format:

{
  "marketAnalysis": {
    "averagePricing": "Average pricing in the market",
    "pricingModels": ["List of pricing models used by competitors"],
    "pricingRange": {
      "low": "Lowest price point in market",
      "mid": "Mid-range price point",
      "high": "Highest price point in market"
    }
  },
  "recommendations": [
    {
      "strategy": "Pricing strategy recommendation",
      "rationale": "Why this strategy is appropriate",
      "pricePoint": "Recommended price point or range",
      "positioning": "How to position this pricing"
    }
  ],
  "valueAdditions": [
    {
      "addition": "Value-add to justify pricing",
      "impact": "Expected impact on perceived value",
      "cost": "Estimated cost to implement"
    }
  ],
  "tiering": {
    "recommended": true | false,
    "tiers": [
      {
        "name": "Tier name",
        "pricePoint": "Price point",
        "features": ["Key features in this tier"],
        "targetSegment": "Target customer segment"
      }
    ]
  }
}`;
}

/**
 * Generate social media competitive analysis
 */
export function generateSocialMediaCompetitiveAnalysisPrompt(
  clientContext: ClientBusinessContext,
  competitors: CompetitorData[]
): string {
  return `You are a social media strategist. Analyze competitors' social media presence and recommend strategies.

CLIENT: ${clientContext.businessName}

COMPETITOR SOCIAL PRESENCE:
${competitors
  .map(
    (c) => `
${c.competitorName}:
${Object.entries(c.socialPresence)
  .filter(([_, v]) => v)
  .map(([platform, handle]) => `  ${platform}: ${handle}`)
  .join("\n")}
Channels: ${c.marketingChannels.join(", ")}
`
  )
  .join("\n")}

Provide social media strategy recommendations in JSON format:

{
  "platformRecommendations": [
    {
      "platform": "Social media platform",
      "priority": "high" | "medium" | "low",
      "rationale": "Why focus on this platform",
      "competitorActivity": "Summary of competitor activity here",
      "differentiationOpportunity": "How to stand out on this platform"
    }
  ],
  "contentTypes": [
    {
      "type": "Content type (video, carousel, stories, etc.)",
      "platform": "Best platform for this type",
      "frequency": "Recommended frequency",
      "angle": "Unique angle to differentiate"
    }
  ],
  "engagementTactics": [
    {
      "tactic": "Engagement tactic",
      "platforms": ["Platforms to use this on"],
      "expectedResult": "Expected outcome",
      "competitorGap": "Why competitors aren't doing this"
    }
  ],
  "influencerStrategy": {
    "recommended": true | false,
    "approach": "Influencer marketing approach",
    "rationale": "Why this approach makes sense"
  }
}`;
}
