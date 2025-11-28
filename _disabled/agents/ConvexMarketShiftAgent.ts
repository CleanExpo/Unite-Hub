/**
 * CONVEX Market Shift Prediction Agent
 *
 * Detects market changes and competitive disruption using CONVEX frameworks:
 * - Market velocity signal detection
 * - Competitor disruption modeling
 * - Early warning system (2+ weeks ahead)
 * - Pivot recommendation generation
 * - Weakness opportunity detection
 * - Counterplay architecture
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logging";

// ============================================================================
// TYPES
// ============================================================================

interface MarketSignal {
  signalType:
    | "pricing_change"
    | "messaging_shift"
    | "feature_release"
    | "leadership_change"
    | "communication_drop"
    | "partnership"
    | "funding";
  severity: "low" | "medium" | "high" | "critical";
  competitor: string;
  description: string;
  detectedDate: Date;
  estimatedImpact: string;
}

interface CompetitorDisruptionModel {
  competitor: string;
  currentStrengths: string[];
  vulnerablePositions: string[];
  disruptionSignals: MarketSignal[];
  disruptionProbability: number; // 0-100
  timeToDisruption: string; // "2 weeks", "1 month", etc.
  disruptionMechanism: string; // How they'll be disrupted
}

interface PivotRecommendation {
  recommendationType: string;
  rationale: string;
  actionItems: string[];
  timeline: string;
  expectedOutcome: string;
  riskLevel: "low" | "medium" | "high";
}

interface WeaknessOpportunity {
  competitorWeakness: string;
  market Position: string;
  opportunity: string;
  yourCountermove: string;
  expectedImpact: string;
  executionDifficulty: "easy" | "medium" | "hard";
}

interface CounterplayArchitecture {
  competitorAdvantage: string;
  theirPosition: string;
  yourCounterplay: string[];
  keyMessageChanges: string;
  newPositioning: string;
  executionPlan: string[];
}

interface ConvexMarketAnalysis {
  marketSignals: MarketSignal[];
  competitorDisruption: CompetitorDisruptionModel[];
  pivotRecommendations: PivotRecommendation[];
  weaknessOpportunities: WeaknessOpportunity[];
  counterplayArchitecture: CounterplayArchitecture[];
  warningLevel: "normal" | "elevated" | "critical";
  actionRecommendations: string[];
}

// ============================================================================
// ANTHROPIC CLIENT
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// MARKET VELOCITY SIGNAL DETECTION
// ============================================================================

export async function detectMarketVelocitySignals(
  industry: string,
  competitors: string[],
  recentMarketEvents: string[]
): Promise<MarketSignal[]> {
  logger.info(`[CONVEX-MARKET] Detecting market velocity signals in ${industry}`);

  const systemPrompt = `You are a CONVEX Market Intelligence expert specializing in early disruption detection.

Identify market velocity signals that indicate disruption risk:
1. Pricing Changes: Price wars, new pricing models
2. Messaging Shifts: Changed positioning or value propositions
3. Feature Releases: Major new features or products
4. Leadership Changes: CMO/CEO changes often precede shifts
5. Communication Cadence: Fewer updates suggests resource constraints
6. Partnerships: New alliances signal strategic changes
7. Funding: Raises often precede major pivots

For each signal, estimate:
- Severity (low/medium/high/critical)
- Likely mechanism of disruption
- Impact on market
- Timeframe

Return analysis as JSON.`;

  const userPrompt = `Analyze market velocity signals:

Industry: ${industry}
Key Competitors: ${competitors.join(", ")}
Recent Market Events: ${recentMarketEvents.join("; ")}

For this industry and these competitors:
1. Identify any visible market velocity signals
2. Assess signal severity (low/medium/high/critical)
3. Interpret what signal means for market dynamics
4. Estimate impact on competitive landscape
5. Identify any emerging threats or opportunities

Return JSON structure:
{
  "signals": [
    {
      "signalType": "pricing_change|messaging_shift|feature_release|leadership_change|communication_drop|partnership|funding",
      "severity": "low|medium|high|critical",
      "competitor": "competitor name or market",
      "description": "what the signal is",
      "estimatedImpact": "how this affects market"
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
      `[CONVEX-MARKET] Detected ${parsed.signals.length} market velocity signals`
    );

    return parsed.signals.map((s: any) => ({
      ...s,
      detectedDate: new Date(),
    }));
  } catch (error) {
    logger.error(
      "[CONVEX-MARKET] Market velocity signal detection error:",
      error
    );
    throw error;
  }
}

// ============================================================================
// COMPETITOR DISRUPTION MODELING
// ============================================================================

export async function modelCompetitorDisruption(
  competitorName: string,
  competitorStrengths: string[],
  competitorWeaknesses: string[],
  marketSignals: MarketSignal[]
): Promise<CompetitorDisruptionModel> {
  logger.info(
    `[CONVEX-MARKET] Modeling disruption risk for ${competitorName}`
  );

  const systemPrompt = `You are a CONVEX Market Intelligence expert specializing in competitive disruption modeling.

Assess disruption risk using:
1. Strength-Weakness Analysis: Identify vulnerable strengths
2. Signal Interpretation: What do market signals predict?
3. Probability Assessment: How likely is disruption?
4. Timeline Estimation: When will it happen?
5. Mechanism Identification: How will disruption occur?

Return analysis as JSON.`;

  const userPrompt = `Model disruption risk for:

Competitor: ${competitorName}
Strengths: ${competitorStrengths.join(", ")}
Weaknesses: ${competitorWeaknesses.join(", ")}
Recent Signals: ${marketSignals.map((s) => `${s.signalType} (${s.severity})`).join(", ")}

Assess:
1. Which strengths are actually vulnerable?
2. What do recent signals indicate about their strategy?
3. What's the probability they'll be disrupted? (0-100)
4. When will disruption occur? (timeline)
5. What mechanism will cause disruption?

Return JSON structure:
{
  "model": {
    "competitor": "name",
    "currentStrengths": ["strength1", "strength2"],
    "vulnerablePositions": ["vulnerable1", "vulnerable2"],
    "disruptionProbability": 65,
    "timeToDisruption": "2-3 months",
    "disruptionMechanism": "explanation of how they'll be disrupted"
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
      `[CONVEX-MARKET] Disruption probability for ${competitorName}: ${parsed.model.disruptionProbability}%`
    );

    return {
      ...parsed.model,
      disruptionSignals: marketSignals,
    };
  } catch (error) {
    logger.error(
      "[CONVEX-MARKET] Competitor disruption modeling error:",
      error
    );
    throw error;
  }
}

// ============================================================================
// PIVOT RECOMMENDATION GENERATION
// ============================================================================

export async function generatePivotRecommendations(
  currentPosition: string,
  marketTrends: string[],
  competitorThreat: string,
  resources: string
): Promise<PivotRecommendation[]> {
  logger.info(`[CONVEX-MARKET] Generating pivot recommendations`);

  const systemPrompt = `You are a CONVEX Market Intelligence expert specializing in strategic pivots.

Create pivot recommendations that are:
1. Realistic: Achievable with available resources
2. Timely: Can be executed before competitive threat
3. Distinctive: Avoid head-to-head competition
4. Valuable: Address real market opportunity
5. Measurable: Clear success metrics

For each pivot, provide:
- Type of pivot (repositioning, feature pivot, market shift, etc.)
- Rationale (why this pivot makes sense)
- Action items (specific steps)
- Timeline (when to execute)
- Expected outcome
- Risk level

Return analysis as JSON.`;

  const userPrompt = `Recommend pivots for:

Current Position: ${currentPosition}
Market Trends: ${marketTrends.join(", ")}
Competitive Threat: ${competitorThreat}
Available Resources: ${resources}

Suggest 2-3 strategic pivots that:
1. Take advantage of current market trends
2. Neutralize or avoid competitive threat
3. Are realistic with available resources
4. Can be executed quickly (1-3 months)
5. Create sustainable competitive advantage

For each pivot:
- Name and type
- Why this makes sense
- Specific action items
- Timeline to implement
- Expected business outcome
- Risk level (low/medium/high)

Return JSON structure:
{
  "pivots": [
    {
      "recommendationType": "type of pivot",
      "rationale": "why this makes sense",
      "actionItems": ["action1", "action2"],
      "timeline": "timeline for execution",
      "expectedOutcome": "what success looks like",
      "riskLevel": "low|medium|high"
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
      `[CONVEX-MARKET] Generated ${parsed.pivots.length} pivot recommendations`
    );

    return parsed.pivots;
  } catch (error) {
    logger.error("[CONVEX-MARKET] Pivot generation error:", error);
    throw error;
  }
}

// ============================================================================
// WEAKNESS OPPORTUNITY DETECTION
// ============================================================================

export async function detectWeaknessOpportunities(
  competitorWeaknesses: string[],
  yourStrengths: string[],
  marketPosition: string
): Promise<WeaknessOpportunity[]> {
  logger.info(`[CONVEX-MARKET] Detecting weakness opportunities`);

  const systemPrompt = `You are a CONVEX Market Intelligence expert specializing in opportunity identification.

Match competitor weaknesses with your strengths:
1. Identify specific competitor weakness
2. Identify corresponding market pain
3. Map to your relevant strength
4. Design specific counter-move
5. Estimate expected impact

Return analysis as JSON.`;

  const userPrompt = `Identify weakness opportunities:

Competitor Weaknesses: ${competitorWeaknesses.join(", ")}
Your Strengths: ${yourStrengths.join(", ")}
Your Market Position: ${marketPosition}

For each competitor weakness:
1. Identify the specific pain it creates
2. Map to your corresponding strength
3. Design your counter-move
4. Estimate competitive impact
5. Assess execution difficulty

Return JSON structure:
{
  "opportunities": [
    {
      "competitorWeakness": "weakness",
      "marketPosition": "market pain created",
      "opportunity": "how to exploit",
      "yourCountermove": "your specific action",
      "expectedImpact": "expected market impact",
      "executionDifficulty": "easy|medium|hard"
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
      `[CONVEX-MARKET] Detected ${parsed.opportunities.length} weakness opportunities`
    );

    return parsed.opportunities;
  } catch (error) {
    logger.error("[CONVEX-MARKET] Weakness detection error:", error);
    throw error;
  }
}

// ============================================================================
// COUNTERPLAY ARCHITECTURE
// ============================================================================

export async function designCounterplayArchitecture(
  competitorAdvantage: string,
  currentPosition: string,
  yourCapabilities: string[]
): Promise<CounterplayArchitecture> {
  logger.info(
    `[CONVEX-MARKET] Designing counterplay for competitor advantage`
  );

  const systemPrompt = `You are a CONVEX Market Intelligence expert specializing in competitive countermoves.

Design counterplay architecture that:
1. Doesn't compete directly on competitor's advantage
2. Leverages your distinctive capabilities
3. Reframes market narrative
4. Makes their advantage irrelevant
5. Owns new positioning

Return analysis as JSON.`;

  const userPrompt = `Design counterplay for:

Competitor Advantage: ${competitorAdvantage}
Your Current Position: ${currentPosition}
Your Capabilities: ${yourCapabilities.join(", ")}

Design a counterplay that:
1. Doesn't compete directly on their advantage
2. Uses your distinctive capabilities
3. Reframes what matters in the market
4. Makes their advantage less important
5. Creates new competitive moat

Provide:
- The counterplay strategy
- Key messaging changes
- New positioning
- Specific execution steps

Return JSON structure:
{
  "counterplay": {
    "competitorAdvantage": "advantage",
    "theirPosition": "their market position",
    "yourCounterplay": ["counterplay1", "counterplay2"],
    "keyMessageChanges": "how to change narrative",
    "newPositioning": "your new market position",
    "executionPlan": ["step1", "step2"]
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
    logger.info(`[CONVEX-MARKET] Counterplay architecture designed`);

    return parsed.counterplay;
  } catch (error) {
    logger.error(
      "[CONVEX-MARKET] Counterplay architecture design error:",
      error
    );
    throw error;
  }
}

// ============================================================================
// COMPLETE MARKET SHIFT ANALYSIS
// ============================================================================

export async function generateCompleteMarketShiftAnalysis(
  yourCompany: string,
  industry: string,
  competitors: string[],
  recentEvents: string[],
  yourStrengths: string[],
  yourWeaknesses: string[]
): Promise<ConvexMarketAnalysis> {
  logger.info(
    `[CONVEX-MARKET] Generating complete market shift analysis for ${yourCompany}`
  );

  try {
    // Step 1: Detect market velocity signals
    const marketSignals = await detectMarketVelocitySignals(
      industry,
      competitors,
      recentEvents
    );

    // Step 2: Model competitor disruption
    const competitorDisruption = [];
    for (const competitor of competitors) {
      const model = await modelCompetitorDisruption(
        competitor,
        yourStrengths,
        yourWeaknesses,
        marketSignals.filter((s) => s.competitor === competitor)
      );
      competitorDisruption.push(model);
    }

    // Step 3: Generate pivot recommendations
    const pivotRecommendations = await generatePivotRecommendations(
      `Market leader in ${industry}`,
      recentEvents,
      `Competition from ${competitors.join(", ")}`,
      "Team of 10+ people, $1M+ budget"
    );

    // Step 4: Detect weakness opportunities
    const weaknessOpportunities = await detectWeaknessOpportunities(
      yourWeaknesses.slice(0, 3),
      yourStrengths.slice(0, 3),
      `Strong position in ${industry}`
    );

    // Step 5: Design counterplay architecture
    const counterplayArchitecture = [];
    if (competitorDisruption.length > 0) {
      const counterplay = await designCounterplayArchitecture(
        competitorDisruption[0].currentStrengths[0] ||
          "Established brand recognition",
        `Growing challenger in ${industry}`,
        yourStrengths
      );
      counterplayArchitecture.push(counterplay);
    }

    // Determine warning level
    const highSeveritySignals = marketSignals.filter(
      (s) => s.severity === "high" || s.severity === "critical"
    ).length;
    const highDisruptionRisk = competitorDisruption.filter(
      (c) => c.disruptionProbability > 60
    ).length;

    let warningLevel: "normal" | "elevated" | "critical" = "normal";
    if (highSeveritySignals > 0 || highDisruptionRisk > 0) {
      warningLevel = "elevated";
    }
    if (highSeveritySignals > 2 && highDisruptionRisk > 1) {
      warningLevel = "critical";
    }

    logger.info(
      `[CONVEX-MARKET] Analysis complete for ${yourCompany}, warning level: ${warningLevel}`
    );

    return {
      marketSignals,
      competitorDisruption,
      pivotRecommendations,
      weaknessOpportunities,
      counterplayArchitecture,
      warningLevel,
      actionRecommendations:
        warningLevel === "critical"
          ? [
              "Implement top pivot immediately",
              "Activate counterplay strategy",
              "Accelerate product roadmap changes",
              "Prepare board communications",
            ]
          : warningLevel === "elevated"
            ? [
                "Begin pivot evaluation",
                "Monitor competitor movements weekly",
                "Start counterplay planning",
              ]
            : ["Continue monitoring market trends", "Stay alert for signals"],
    };
  } catch (error) {
    logger.error(
      `[CONVEX-MARKET] Analysis generation failed for ${yourCompany}:`,
      error
    );
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MarketSignal,
  CompetitorDisruptionModel,
  PivotRecommendation,
  WeaknessOpportunity,
  CounterplayArchitecture,
  ConvexMarketAnalysis,
};
