/**
 * CONVEX Campaign Generator Agent
 *
 * Generates complete CONVEX-based marketing campaigns:
 * - Campaign strategy generation
 * - Funnel design with micro-commitment sequences
 * - Offer architecture optimization
 * - Campaign timeline and roadmap
 * - Success metrics and KPIs
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

interface CampaignStrategy {
  campaignName: string;
  objective: string;
  targetAudience: string;
  duration: string;
  budget: number;
  expectedROI: number;
  successMetrics: string[];
  riskFactors: string[];
}

interface FunnelStep {
  name: string;
  objective: string;
  tactics: string[];
  copyTheme: string;
  expectedConversion: number; // 0-1
  duration: string;
  successMetric: string;
}

interface CampaignFunnel {
  awareness: FunnelStep;
  consideration: FunnelStep;
  decision: FunnelStep;
  retention: FunnelStep;
  microCommitments: string[]; // Micro-commitment progression
}

interface OfferDesign {
  offerType: string;
  coreValue: string;
  pricePoint: string;
  riskReversal: string;
  valueStack: {
    component: string;
    value: string;
  }[];
  targetScore: number; // 0-10
}

interface CampaignTimeline {
  week: number;
  milestone: string;
  activities: string[];
  expectedResults: string;
  successMetrics: string[];
}

interface CampaignContent {
  type: string; // email, landing page, ad, social post
  topic: string;
  cta: string;
  convexPrinciple: string; // Which CONVEX principle applied
}

interface CompleteConvexCampaign {
  strategy: CampaignStrategy;
  funnel: CampaignFunnel;
  offer: OfferDesign;
  contentPlan: CampaignContent[];
  timeline: CampaignTimeline[];
  budget Allocation: {
    category: string;
    percentage: number;
    amount: number;
  }[];
  successCheckpoint: {
    week: number;
    metric: string;
    target: number;
    action: string; // What to do if target missed
  }[];
}

// ============================================================================
// ANTHROPIC CLIENT
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// CAMPAIGN STRATEGY GENERATION
// ============================================================================

export async function generateCampaignStrategy(
  businessGoal: string,
  targetAudience: string,
  industry: string,
  budget: number,
  timeline: string
): Promise<CampaignStrategy> {
  logger.info(`[CONVEX-CAMPAIGN] Generating campaign strategy`);

  const systemPrompt = `You are a CONVEX Campaign Strategy expert specializing in marketing campaign planning.

Design campaigns using CONVEX frameworks:
1. Brand Positioning: Unique market positioning
2. Funnel Design: High-conversion sequences
3. Offer Architecture: Compelling offers
4. SEO Patterns: Long-term visibility
5. Competitor Analysis: Unique differentiation

For each campaign, provide:
- Clear objective aligned to business goal
- Specific target audience segment
- Realistic timeline and budget
- Expected ROI based on industry benchmarks
- Key success metrics
- Risk factors and mitigation

Return analysis as JSON.`;

  const userPrompt = `Generate campaign strategy:

Business Goal: "${businessGoal}"
Target Audience: ${targetAudience}
Industry: ${industry}
Budget: $${budget}
Timeline: ${timeline}

Design a campaign that:
1. Aligns with business goal
2. Targets specific audience segment
3. Uses CONVEX frameworks
4. Fits within budget and timeline
5. Has realistic ROI projection

Provide:
- Campaign name
- Primary objective
- Target audience specifics
- Campaign duration
- Budget allocation
- Expected ROI (%)
- Key success metrics (3-5)
- Risk factors and how to mitigate

Return JSON structure:
{
  "strategy": {
    "campaignName": "name",
    "objective": "primary objective",
    "targetAudience": "specific segment",
    "duration": "timeline",
    "budget": 50000,
    "expectedROI": 300,
    "successMetrics": ["metric1", "metric2"],
    "riskFactors": ["risk1", "risk2"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1536,
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
      `[CONVEX-CAMPAIGN] Campaign strategy: ${parsed.strategy.campaignName}`
    );

    return parsed.strategy;
  } catch (error) {
    logger.error("[CONVEX-CAMPAIGN] Campaign strategy generation error:", error);
    throw error;
  }
}

// ============================================================================
// FUNNEL DESIGN WITH MICRO-COMMITMENTS
// ============================================================================

export async function designCampaignFunnel(
  audience: string,
  businessObjective: string,
  conversionGoal: string
): Promise<CampaignFunnel> {
  logger.info(`[CONVEX-CAMPAIGN] Designing campaign funnel with CONVEX structure`);

  const systemPrompt = `You are a CONVEX Funnel Design expert specializing in high-conversion funnels.

Apply CONVEX Funnel Framework:
1. Awareness Activation: Compelling hook
2. Consideration: Build credibility
3. Decision: Remove objections
4. Retention: Sustain customer value

For each stage:
- Define specific objective
- Outline tactics (ads, emails, landing pages, etc.)
- Design copy theme
- Estimate conversion rate
- Define timeline
- Specify success metric

Apply Micro-Commitment Sequencing:
- Small asks before big asks
- Build obligation progressively
- Each step enables next

Return analysis as JSON.`;

  const userPrompt = `Design CONVEX funnel for:

Audience: ${audience}
Business Objective: "${businessObjective}"
Conversion Goal: "${conversionGoal}"

Design funnel stages:
1. Awareness: How to grab attention
   - Tactics: What channels/content
   - Copy theme: What message
   - Expected conversion: % to next stage
   - Timeline: How long this stage
   - Success metric: How we measure

2. Consideration: How to build credibility
   - Tactics: Proof, social proof, comparisons
   - Copy theme: Why we're different
   - Expected conversion: % to decision
   - Timeline: How long to decide
   - Success metric: Engagement level

3. Decision: How to close
   - Tactics: Offer, guarantee, scarcity
   - Copy theme: Final persuasion
   - Expected conversion: % to customer
   - Timeline: How fast decision
   - Success metric: Conversion rate

4. Retention: How to sustain value
   - Tactics: Onboarding, support, upsell
   - Copy theme: Implementation success
   - Expected conversion: % to lifetime customer
   - Timeline: Duration of relationship
   - Success metric: NPS, retention rate

Also identify micro-commitment progression:
- Step 1: [minimal friction ask]
- Step 2: [low friction ask]
- Step 3: [medium friction ask]
- Step 4: [high friction ask]

Return JSON structure:
{
  "funnel": {
    "awareness": { step details },
    "consideration": { step details },
    "decision": { step details },
    "retention": { step details },
    "microCommitments": ["step1", "step2", "step3", "step4"]
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
    logger.info(`[CONVEX-CAMPAIGN] Funnel designed with micro-commitment sequence`);

    return parsed.funnel;
  } catch (error) {
    logger.error("[CONVEX-CAMPAIGN] Funnel design error:", error);
    throw error;
  }
}

// ============================================================================
// OFFER ARCHITECTURE OPTIMIZATION
// ============================================================================

export async function optimizeOfferArchitecture(
  product: string,
  targetAudience: string,
  pricePoint: number,
  value: string
): Promise<OfferDesign> {
  logger.info(`[CONVEX-CAMPAIGN] Optimizing offer architecture`);

  const systemPrompt = `You are a CONVEX Offer Architecture expert specializing in compelling offers.

Apply CONVEX Offer Architecture Framework:
1. 10-Point Strength Test: Assess offer viability
2. Feature → Outcome Translation: Connect features to benefits
3. Risk Reversal: Remove purchase risk
4. Value Expansion: Increase perceived value

For each offer:
- Define core value proposition
- Justify price point
- Design risk reversal guarantee
- Create value stack
- Calculate offer strength score (0-10)

Return analysis as JSON.`;

  const userPrompt = `Optimize offer for:

Product: ${product}
Target Audience: ${targetAudience}
Price Point: $${pricePoint}/month
Core Value: "${value}"

Design offer that:
1. Justifies price point with ROI
2. Includes powerful risk reversal
3. Stacks value to 3-5x price point perception
4. Scores 8+ on 10-point strength test

Provide:
- Offer type (trial, freemium, premium, enterprise)
- Core value statement
- Price point strategy
- Risk reversal guarantee
- Value stack (5+ components with stated values)
- Overall strength score (0-10)

Return JSON structure:
{
  "offer": {
    "offerType": "trial|freemium|premium|enterprise",
    "coreValue": "what customer gets",
    "pricePoint": "$99/mo",
    "riskReversal": "guarantee structure",
    "valueStack": [
      { "component": "component name", "value": "$300 value" }
    ],
    "targetScore": 8
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1536,
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
    logger.info(`[CONVEX-CAMPAIGN] Offer optimized, strength score: ${parsed.offer.targetScore}/10`);

    return parsed.offer;
  } catch (error) {
    logger.error("[CONVEX-CAMPAIGN] Offer optimization error:", error);
    throw error;
  }
}

// ============================================================================
// CAMPAIGN CONTENT PLANNING
// ============================================================================

export async function planCampaignContent(
  strategy: CampaignStrategy,
  funnel: CampaignFunnel
): Promise<CampaignContent[]> {
  logger.info(`[CONVEX-CAMPAIGN] Planning campaign content`);

  const systemPrompt = `You are a CONVEX Content Strategy expert specializing in campaign content planning.

Plan content across funnel stages using CONVEX principles:
1. Compression Rules: Simplify, outcome-focus, remove friction
2. High-Conversion Logic: Customer outcome, work backward, design proof
3. Safety Rules: Factual, fair, real proof, include limitations

For each content piece:
- Type (email, landing page, ad, social post)
- Topic (what it covers)
- CTA (specific call to action)
- CONVEX principle applied

Return analysis as JSON.`;

  const userPrompt = `Plan content for campaign:

Strategy: ${strategy.campaignName}
Objective: ${strategy.objective}
Funnel Stages:
- Awareness: ${funnel.awareness.objective}
- Consideration: ${funnel.consideration.objective}
- Decision: ${funnel.decision.objective}

Plan 12-15 content pieces covering:
1. Awareness stage (3-4 pieces): Grab attention, educate
2. Consideration stage (4-5 pieces): Build credibility, overcome objections
3. Decision stage (3-4 pieces): Final persuasion, close offer
4. Retention stage (2 pieces): Onboarding, upsell

For each piece specify:
- Content type (email, landing page, ad, social)
- Topic (what it covers)
- CTA (specific action)
- CONVEX principle (compression/conversion/safety)

Return JSON structure:
{
  "content": [
    {
      "type": "email|landing_page|ad|social",
      "topic": "topic name",
      "cta": "specific call to action",
      "convexPrinciple": "principle applied"
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
    logger.info(
      `[CONVEX-CAMPAIGN] Planned ${parsed.content.length} content pieces`
    );

    return parsed.content;
  } catch (error) {
    logger.error("[CONVEX-CAMPAIGN] Content planning error:", error);
    throw error;
  }
}

// ============================================================================
// COMPLETE CONVEX CAMPAIGN GENERATION
// ============================================================================

export async function generateCompleteConvexCampaign(
  businessGoal: string,
  targetAudience: string,
  industry: string,
  productFeatures: string[],
  budget: number,
  timeline: string
): Promise<CompleteConvexCampaign> {
  logger.info(`[CONVEX-CAMPAIGN] Generating complete CONVEX campaign`);

  try {
    // Step 1: Generate campaign strategy
    const strategy = await generateCampaignStrategy(
      businessGoal,
      targetAudience,
      industry,
      budget,
      timeline
    );

    // Step 2: Design funnel
    const funnel = await designCampaignFunnel(
      targetAudience,
      businessGoal,
      "Achieve business objective"
    );

    // Step 3: Optimize offer
    const offer = await optimizeOfferArchitecture(
      `${industry} Solution`,
      targetAudience,
      budget / 12,
      "Transform target outcome"
    );

    // Step 4: Plan content
    const contentPlan = await planCampaignContent(strategy, funnel);

    // Step 5: Create timeline
    const timelineWeeks = parseInt(timeline) || 12;
    const timeline_array: CampaignTimeline[] = [];
    const milestonesPerStage = timelineWeeks / 4;

    for (let i = 1; i <= 4; i++) {
      timeline_array.push({
        week: Math.round(i * milestonesPerStage),
        milestone: `${["Awareness", "Consideration", "Decision", "Retention"][i - 1]} Stage Complete`,
        activities: [
          `Launch ${["awareness", "consideration", "decision", "retention"][i - 1]} content`,
          `Measure engagement metrics`,
        ],
        expectedResults: `${20 + i * 10}% progression to next stage`,
        successMetrics: [
          `Conversion to next stage: ${20 + i * 10}%`,
          `Engagement: ${3 + i}% CTR`,
        ],
      });
    }

    // Step 6: Allocate budget
    const budgetAllocation = [
      { category: "Paid Ads", percentage: 40, amount: budget * 0.4 },
      { category: "Content Creation", percentage: 25, amount: budget * 0.25 },
      { category: "Email Marketing", percentage: 20, amount: budget * 0.2 },
      { category: "Landing Pages", percentage: 10, amount: budget * 0.1 },
      { category: "Analytics & Tools", percentage: 5, amount: budget * 0.05 },
    ];

    // Step 7: Define success checkpoints
    const successCheckpoint = [
      {
        week: 2,
        metric: "Awareness Stage Conversion",
        target: 20,
        action: "Adjust targeting if below 15%",
      },
      {
        week: 6,
        metric: "Consideration Stage Conversion",
        target: 35,
        action: "Revise objection handling if below 25%",
      },
      {
        week: 10,
        metric: "Decision Stage Conversion",
        target: 5,
        action: "Optimize offer if below 3%",
      },
      {
        week: 12,
        metric: "Overall Campaign ROI",
        target: 300,
        action: "Scale winning elements",
      },
    ];

    logger.info(
      `[CONVEX-CAMPAIGN] Campaign generated: ${strategy.campaignName}`
    );

    return {
      strategy,
      funnel,
      offer,
      contentPlan,
      timeline: timeline_array,
      budgetAllocation,
      successCheckpoint,
    };
  } catch (error) {
    logger.error("[CONVEX-CAMPAIGN] Campaign generation failed:", error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CampaignStrategy,
  FunnelStep,
  CampaignFunnel,
  OfferDesign,
  CampaignTimeline,
  CampaignContent,
  CompleteConvexCampaign,
};
