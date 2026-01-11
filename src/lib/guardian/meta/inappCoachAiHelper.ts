import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

export interface GuardianNudgeAiContext {
  nudgeKey: string;
  baseTitle: string;
  baseBody: string;
  dimension: string;
  subDimension: string;
  adoptionStatus: string;
  readinessStatus?: string;
  editionStatus?: string;
}

export interface GuardianNudgeAiEnhancement {
  title?: string;
  body?: string;
  microTips?: string[];
}

/**
 * Generate AI-refined nudge copy using Claude Haiku
 * Returns null if disabled or fails (graceful degradation)
 */
export async function generateAiNudgeCopy(
  context: GuardianNudgeAiContext,
  enableAiCoach: boolean = false
): Promise<GuardianNudgeAiEnhancement | null> {
  // Gate 1: Feature flag
  if (!enableAiCoach) return null;

  // Gate 2: API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured, AI nudges disabled');
    return null;
  }

  try {
    const client = getAnthropicClient();

    const prompt = `You are a friendly Guardian in-app coach helping admins adopt Guardian platform features.

Nudge Context:
- Current nudge: ${context.baseTitle}
- Dimension: ${context.dimension} / ${context.subDimension}
- Admin's adoption status: ${context.adoptionStatus}
- Guardian readiness: ${context.readinessStatus || 'unknown'}
- Edition alignment: ${context.editionStatus || 'unknown'}

Base nudge text:
Title: ${context.baseTitle}
Body: ${context.baseBody}

Generate a friendly, encouraging refinement of this nudge. Output JSON:
{
  "title": "Refined title (5-10 words, attention-grabbing)",
  "body": "Refined body (2-3 sentences, warm and actionable)",
  "microTips": ["tip 1 (one sentence, actionable)", "tip 2", "tip 3"]
}

Requirements:
- Tone: friendly, encouraging, supportive (like a helpful colleague)
- Avoid: marketing language, technical jargon, commands ("must", "should")
- Use: "you", specific benefits, concrete next steps
- Length: Total under 200 characters (for mobile)
- PII: Zero PII, use aggregated language ("many teams", "several features")
- Scope: Single focused action per nudge
- Advisory: Never imply enforcement or automation

Return ONLY valid JSON.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract and parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Failed to extract JSON from AI nudge response');
      return null;
    }

    const enhancement = JSON.parse(jsonMatch[0]) as GuardianNudgeAiEnhancement;

    // Validate structure
    if (!enhancement.title || !enhancement.body) {
      console.warn('Invalid AI nudge structure (missing title or body)');
      return null;
    }

    return enhancement;
  } catch (error) {
    console.error('Failed to generate AI nudge copy:', error);
    return null; // Graceful degradation
  }
}

/**
 * Enrich multiple nudges with AI copy (batch operation)
 */
export async function enrichNudgesWithAi(
  nudges: Array<{
    nudgeKey: string;
    title: string;
    body: string;
    dimension: string;
    subDimension: string;
    adoptionStatus: string;
  }>,
  enableAiCoach: boolean = false
): Promise<
  Array<{
    nudgeKey: string;
    enhancement: GuardianNudgeAiEnhancement | null;
  }>
> {
  const results: Array<{ nudgeKey: string; enhancement: GuardianNudgeAiEnhancement | null }> = [];

  for (const nudge of nudges) {
    try {
      const enhancement = await generateAiNudgeCopy(
        {
          nudgeKey: nudge.nudgeKey,
          baseTitle: nudge.title,
          baseBody: nudge.body,
          dimension: nudge.dimension,
          subDimension: nudge.subDimension,
          adoptionStatus: nudge.adoptionStatus,
        },
        enableAiCoach
      );

      results.push({ nudgeKey: nudge.nudgeKey, enhancement });

      // Rate limiting: 500ms between calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to enrich nudge "${nudge.nudgeKey}":`, error);
      results.push({ nudgeKey: nudge.nudgeKey, enhancement: null });
    }
  }

  return results;
}
