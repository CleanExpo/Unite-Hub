import Anthropic from '@anthropic-ai/sdk';

/**
 * GuardianSuccessNarrativeContext — Context for generating CS-friendly success narratives.
 * Entirely meta-only: no PII, no raw logs, only scores and aggregates.
 */
export interface GuardianSuccessNarrativeContext {
  readinessScore: number;
  readinessTrend: 'up' | 'down' | 'flat';
  editionStories: Array<{
    key: string;
    label: string;
    fitScore: number;
    status: string;
  }>;
  upliftSummary: {
    activePlans: number;
    tasksDone: number;
    tasksTotal: number;
  };
  adoptionSnapshot: Array<{
    dimension: string;
    status: string;
  }>;
  executiveSummary: {
    reportsLast90d: number;
    lastReportDelta?: number;
  };
  timeframeLabel: string;
}

/**
 * generateSuccessNarrative — Use AI to generate a CS-friendly success narrative.
 *
 * Produces short, positive-but-honest summaries suitable for CS calls.
 * Uses Claude Sonnet 4.5 for speed and cost efficiency.
 *
 * Prompt guardrails:
 * 1. No PII: Uses only scores, statuses, counts, dimension names (no tenant info, no logs)
 * 2. Advisory tone: "Consider...", "You're in a good position to...", never "You must..."
 * 3. Single action focus: One top recommendation, not a list
 * 4. Honest assessment: Acknowledges gaps but frames positively
 * 5. Under 200 words total
 *
 * Returns { headline, bullets, commentary } or throws on AI error.
 */
export async function generateSuccessNarrative(
  ctx: GuardianSuccessNarrativeContext
): Promise<{
  headline: string;
  bullets: string[];
  commentary?: string;
}> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const client = new Anthropic({
    apiKey: anthropicKey,
  });

  // Build meta-only context for the prompt
  const adoptionContext = ctx.adoptionSnapshot
    .map((a) => `${a.dimension}: ${a.status}`)
    .join(', ');

  const editionContext = ctx.editionStories
    .map((e) => `${e.label} (fit: ${e.fitScore})`)
    .join(', ');

  const upliftContext =
    ctx.upliftSummary.tasksTotal > 0
      ? `${ctx.upliftSummary.tasksDone}/${ctx.upliftSummary.tasksTotal} uplift tasks completed`
      : 'No active uplift plans';

  const prompt = `
You are a Customer Success advisor for Guardian, a security intelligence platform.
Generate a brief, honest, and positive success narrative based on the following meta metrics:

**Readiness**: ${ctx.readinessScore} (trend: ${ctx.readinessTrend})
**Adoption Status**: ${adoptionContext}
**Edition Fit**: ${editionContext}
**Uplift Progress**: ${upliftContext}
**Executive Reports**: ${ctx.executiveSummary.reportsLast90d} generated in last 90 days
**Timeframe**: ${ctx.timeframeLabel}

Guidelines:
1. Use ONLY the metrics provided (no PII, no raw logs, no made-up data)
2. Tone: Positive but realistic. "You're in a great position to..." not "You must..."
3. Format: One headline, 3 bullet points, one brief commentary (100 words max total)
4. Focus: Highlight ONE key opportunity or win, not a laundry list
5. NO business outcome promises (e.g., don't say "This will reduce incidents by 50%")
6. NO configuration advice (e.g., "Enable X feature")
7. Only speak to what the metrics show

Output JSON:
{
  "headline": "string (one sentence)",
  "bullets": ["string", "string", "string"],
  "commentary": "string (optional, under 50 words)"
}
`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      headline: parsed.headline || 'Guardian Success Snapshot',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      commentary: parsed.commentary,
    };
  } catch (error) {
    console.error('[successNarrativeAiHelper] AI generation failed:', error);
    // Return a deterministic fallback
    return generateFallbackNarrative(ctx);
  }
}

/**
 * generateFallbackNarrative — Deterministic fallback when AI is unavailable or fails.
 */
function generateFallbackNarrative(
  ctx: GuardianSuccessNarrativeContext
): {
  headline: string;
  bullets: string[];
  commentary?: string;
} {
  const adoptionStatus = ctx.adoptionSnapshot[0]?.status || 'unknown';
  const upliftProgress =
    ctx.upliftSummary.tasksTotal > 0
      ? `${Math.round((ctx.upliftSummary.tasksDone / ctx.upliftSummary.tasksTotal) * 100)}% complete`
      : 'no active plans';

  return {
    headline: `Guardian adoption is moving ${ctx.readinessTrend} with ${adoptionStatus} adoption status`,
    bullets: [
      `Readiness score: ${ctx.readinessScore} (${ctx.readinessTrend} trend)`,
      `Uplift progress: ${upliftProgress}`,
      `Executive visibility: ${ctx.executiveSummary.reportsLast90d} reports in last 90 days`,
    ],
    commentary: `Review adoption gaps in the overview above and consider focusing on the dimension(s) with light or inactive status.`,
  };
}

/**
 * enrichSuccessNarrativeWithAi — Load success narrative with AI enrichment (if enabled).
 *
 * This is a helper function that can be called from API routes or UI to conditionally
 * use the AI-generated narrative when enabled, with graceful fallback.
 */
export async function enrichSuccessNarrativeWithAi(
  ctx: GuardianSuccessNarrativeContext,
  enableAiHints: boolean = false
): Promise<{
  headline: string;
  bullets: string[];
  commentary?: string;
  isAiGenerated: boolean;
}> {
  if (!enableAiHints) {
    const fallback = generateFallbackNarrative(ctx);
    return { ...fallback, isAiGenerated: false };
  }

  try {
    const narrative = await generateSuccessNarrative(ctx);
    return { ...narrative, isAiGenerated: true };
  } catch (error) {
    console.error('[enrichSuccessNarrativeWithAi] Error, falling back to deterministic narrative:', error);
    const fallback = generateFallbackNarrative(ctx);
    return { ...fallback, isAiGenerated: false };
  }
}
