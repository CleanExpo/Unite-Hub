/**
 * CONVEX Marketing Intelligence Agent
 *
 * Enhances marketing intelligence with CONVEX frameworks:
 * - CONVEX keyword clustering (emotional, functional, transactional)
 * - Audience segmentation by CONVEX buyer psychology
 * - Micro-commitment sequence generation
 * - Copy generation with CONVEX compression rules
 * - High-conversion testing framework
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

interface KeywordCluster {
  intent: "awareness" | "consideration" | "decision";
  emotional: string[];
  functional: string[];
  transactional: string[];
  searchVolume?: number;
  competitionLevel?: "low" | "medium" | "high";
}

interface AudienceSegment {
  name: string;
  psychographicProfile: {
    decisionStyle: "conservative" | "progressive";
    painPriority: "urgent" | "development";
    budgetAuthority: "self-funded" | "enterprise";
  };
  painPoints: string[];
  desiredOutcomes: string[];
  objectionFactors: string[];
  conversionTriggers: string[];
}

interface MicroCommitmentSequence {
  step: number;
  ask: string;
  friction: "minimal" | "low" | "medium" | "high";
  expectedConversionRate: number;
  psychologicalTrigger: string;
}

interface ConvexCopyElement {
  element: string;
  convexPrinciple: string;
  weak: string;
  strong: string;
  psychologicalBasis: string;
}

interface ConvexMarketingAnalysis {
  keywordClusters: KeywordCluster[];
  audienceSegments: AudienceSegment[];
  microCommitmentSequence: MicroCommitmentSequence[];
  copyGuidelines: ConvexCopyElement[];
  testingFramework: {
    primaryVariable: string;
    variants: string[];
    metric: string;
    successThreshold: number;
  };
}

// ============================================================================
// ANTHROPIC CLIENT
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// CONVEX KEYWORD CLUSTERING
// ============================================================================

export async function analyzeKeywordsWithConvexClustering(
  seedKeywords: string[],
  industry: string,
  targetAudience: string,
  businessOutcome: string
): Promise<KeywordCluster[]> {
  logger.info(
    `[CONVEX] Analyzing keywords with CONVEX clustering for ${industry}`
  );

  const systemPrompt = `You are a CONVEX Marketing Intelligence expert specializing in semantic keyword clustering.

Your task is to cluster keywords by search intent and map them to CONVEX dimensions:
- Emotional Keywords: Appeal to desired emotional outcomes
- Functional Keywords: Describe what the solution does
- Transactional Keywords: Indicate purchase intent

For each cluster, identify:
1. Search intent (awareness, consideration, decision)
2. Emotional language that resonates
3. Functional features implied
4. Transaction readiness signals

Return analysis as JSON with keyword clusters organized by intent.`;

  const userPrompt = `Analyze these keywords for ${industry} targeting ${targetAudience}:

Keywords: ${seedKeywords.join(", ")}
Business Outcome: "${businessOutcome}"

For each keyword, determine:
1. Primary search intent (awareness/consideration/decision)
2. Related emotional keywords (appeal to desired outcomes)
3. Related functional keywords (describe solution)
4. Related transactional keywords (purchase signals)
5. Estimated search volume level (low/medium/high)
6. Competition level (low/medium/high)

Return JSON structure:
{
  "clusters": [
    {
      "intent": "awareness|consideration|decision",
      "emotional": ["keyword1", "keyword2"],
      "functional": ["keyword3", "keyword4"],
      "transactional": ["keyword5", "keyword6"],
      "competitionLevel": "low|medium|high"
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
      `[CONVEX] Generated ${parsed.clusters.length} keyword clusters`
    );

    return parsed.clusters;
  } catch (error) {
    logger.error("[CONVEX] Keyword clustering error:", error);
    throw error;
  }
}

// ============================================================================
// CONVEX AUDIENCE SEGMENTATION
// ============================================================================

export async function segmentAudienceByConvexPsychology(
  targetAudience: string,
  industry: string,
  painPoints: string[],
  businessSolution: string
): Promise<AudienceSegment[]> {
  logger.info(`[CONVEX] Segmenting audience with CONVEX buyer psychology`);

  const systemPrompt = `You are a CONVEX Marketing Intelligence expert specializing in buyer psychology segmentation.

Apply CONVEX psychographic dimensions to create audience segments:
1. Decision-Making Style: Conservative (risk-averse) vs Progressive (innovative)
2. Pain Priority: Urgent (solve now) vs Development (long-term)
3. Budget Authority: Self-funded (ROI-focused) vs Enterprise (capability-focused)

For each segment, identify:
- Specific pain points
- Desired outcomes
- Key objections they face
- Psychological triggers that motivate them
- How to address their specific psychology

Return analysis as JSON with audience segments.`;

  const userPrompt = `Create CONVEX buyer psychology segments for:

Audience: ${targetAudience}
Industry: ${industry}
Pain Points: ${painPoints.join(", ")}
Solution: ${businessSolution}

For each major psychographic segment, analyze:
1. Decision-making style (conservative/progressive)
2. Pain priority (urgent/development)
3. Budget authority (self-funded/enterprise)
4. Specific pain points they experience
5. Desired outcomes they seek
6. Primary objections they face
7. Psychological triggers that motivate them

Return JSON structure:
{
  "segments": [
    {
      "name": "segment name",
      "psychographicProfile": {
        "decisionStyle": "conservative|progressive",
        "painPriority": "urgent|development",
        "budgetAuthority": "self-funded|enterprise"
      },
      "painPoints": ["pain1", "pain2"],
      "desiredOutcomes": ["outcome1", "outcome2"],
      "objectionFactors": ["objection1", "objection2"],
      "conversionTriggers": ["trigger1", "trigger2"]
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
    logger.info(`[CONVEX] Created ${parsed.segments.length} audience segments`);

    return parsed.segments;
  } catch (error) {
    logger.error("[CONVEX] Audience segmentation error:", error);
    throw error;
  }
}

// ============================================================================
// MICRO-COMMITMENT SEQUENCE GENERATION
// ============================================================================

export async function generateMicroCommitmentSequence(
  targetOutcome: string,
  desiredAction: string,
  audienceSegment: AudienceSegment
): Promise<MicroCommitmentSequence[]> {
  logger.info(`[CONVEX] Generating micro-commitment sequence`);

  const systemPrompt = `You are a CONVEX Marketing Intelligence expert specializing in funnel design.

Apply the Micro-Commitment Sequencing framework:
1. Start with minimal friction (see/read/watch)
2. Progress to low friction (engage/react/comment)
3. Increase to medium friction (share/refer/provide info)
4. Peak at high friction (trial/purchase/commitment)

Each step must:
- Build obligation for next step
- Include psychological trigger aligned to audience
- Estimate realistic conversion rate
- Progress naturally from ask to ask

Return analysis as JSON with commitment sequence.`;

  const userPrompt = `Create a micro-commitment sequence for:

Target Outcome: "${targetOutcome}"
Desired Action: "${desiredAction}"
Audience: ${audienceSegment.name}
Decision Style: ${audienceSegment.psychographicProfile.decisionStyle}
Pain Points: ${audienceSegment.painPoints.join(", ")}
Conversion Triggers: ${audienceSegment.conversionTriggers.join(", ")}

Design a 4-5 step sequence that:
1. Starts with minimal friction (70-90% conversion)
2. Progressively increases friction
3. Ends with desired action
4. Uses psychological triggers appropriate for audience
5. Each step builds obligation for next

Return JSON structure:
{
  "sequence": [
    {
      "step": 1,
      "ask": "what customer is asked to do",
      "friction": "minimal|low|medium|high",
      "expectedConversionRate": 0.80,
      "psychologicalTrigger": "curiosity|social_proof|fear_of_missing_out|control"
    }
  ]
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
      `[CONVEX] Generated ${parsed.sequence.length} commitment steps`
    );

    return parsed.sequence;
  } catch (error) {
    logger.error("[CONVEX] Sequence generation error:", error);
    throw error;
  }
}

// ============================================================================
// CONVEX COPY GENERATION
// ============================================================================

export async function generateConvexCopyGuidelines(
  productFeatures: string[],
  audienceOutcomes: string[],
  audienceSegment: AudienceSegment
): Promise<ConvexCopyElement[]> {
  logger.info(`[CONVEX] Generating CONVEX copy guidelines`);

  const systemPrompt = `You are a CONVEX Marketing Intelligence expert specializing in copy generation with compression rules.

Apply CONVEX compression rules:
1. Simplify first, expand only if needed
2. Bias toward high-conversion action over complexity
3. Focus on outcome, not product description
4. Remove friction, amplify clarity
5. Anchor recommendations in measurable value

For each element, show:
- Weak copy (violates compression rules)
- Strong copy (applies CONVEX principles)
- Psychological basis for why strong version converts better

Return analysis as JSON with copy guidelines.`;

  const userPrompt = `Create CONVEX copy guidelines for:

Product Features: ${productFeatures.join(", ")}
Customer Outcomes: ${audienceOutcomes.join(", ")}
Audience Segment: ${audienceSegment.name}
Desired Outcomes: ${audienceSegment.desiredOutcomes.join(", ")}
Objections: ${audienceSegment.objectionFactors.join(", ")}

For each key copy element (headline, subheadline, benefits, CTA), create:
1. WEAK version (violates CONVEX compression rules)
2. STRONG version (applies all 5 CONVEX principles)
3. Psychological explanation of why strong version converts better

Return JSON structure:
{
  "elements": [
    {
      "element": "element name (headline, subheadline, benefit, cta)",
      "convexPrinciple": "which compression rule applies",
      "weak": "weak copy example",
      "strong": "strong copy example applying CONVEX",
      "psychologicalBasis": "why CONVEX version converts better"
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
    logger.info(`[CONVEX] Generated ${parsed.elements.length} copy guidelines`);

    return parsed.elements;
  } catch (error) {
    logger.error("[CONVEX] Copy generation error:", error);
    throw error;
  }
}

// ============================================================================
// COMPLETE CONVEX MARKETING ANALYSIS
// ============================================================================

export async function generateCompleteConvexMarketingAnalysis(
  businessName: string,
  industry: string,
  targetAudience: string,
  painPoints: string[],
  desiredOutcome: string,
  productFeatures: string[]
): Promise<ConvexMarketingAnalysis> {
  logger.info(
    `[CONVEX] Generating complete marketing analysis for ${businessName}`
  );

  try {
    // Step 1: Keyword clustering
    const keywordClusters = await analyzeKeywordsWithConvexClustering(
      [desiredOutcome, targetAudience, industry],
      industry,
      targetAudience,
      desiredOutcome
    );

    // Step 2: Audience segmentation
    const audienceSegments = await segmentAudienceByConvexPsychology(
      targetAudience,
      industry,
      painPoints,
      desiredOutcome
    );

    // Step 3: Micro-commitment sequences
    const microCommitmentSequence = audienceSegments.length > 0
      ? await generateMicroCommitmentSequence(
          desiredOutcome,
          `Acquire ${targetAudience}`,
          audienceSegments[0]
        )
      : [];

    // Step 4: Copy guidelines
    const copyGuidelines = audienceSegments.length > 0
      ? await generateConvexCopyGuidelines(
          productFeatures,
          [desiredOutcome],
          audienceSegments[0]
        )
      : [];

    logger.info(`[CONVEX] Analysis complete for ${businessName}`);

    return {
      keywordClusters,
      audienceSegments,
      microCommitmentSequence,
      copyGuidelines,
      testingFramework: {
        primaryVariable: "messaging approach",
        variants: [
          "benefit-focused",
          "problem-focused",
          "exclusivity-focused",
        ],
        metric: "click-through rate",
        successThreshold: 2.0,
      },
    };
  } catch (error) {
    logger.error(
      `[CONVEX] Analysis generation failed for ${businessName}:`,
      error
    );
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  KeywordCluster,
  AudienceSegment,
  MicroCommitmentSequence,
  ConvexCopyElement,
  ConvexMarketingAnalysis,
};
