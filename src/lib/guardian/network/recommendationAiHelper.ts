/**
 * Guardian X06: Recommendation AI Helper
 *
 * Generates human-friendly AI summaries for recommendations.
 * Uses Claude Sonnet for natural language generation.
 * Gated behind feature flags for privacy.
 */

import Anthropic from '@anthropic-ai/sdk';
import { GuardianNetworkRecommendation } from './recommendationModel';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

/**
 * Lazy Anthropic client with TTL
 */
function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * AI helper options
 */
export interface RecommendationAiHelperOptions {
  enableAiHints: boolean;
  tenantId: string;
}

/**
 * Generated AI summary
 */
export interface RecommendationAiSummary {
  summary: string;
  actionItems: string[];
  nextSteps: string;
}

/**
 * Generate AI-powered explanation for a recommendation
 */
export async function generateRecommendationSummary(
  recommendation: GuardianNetworkRecommendation,
  options: RecommendationAiHelperOptions
): Promise<RecommendationAiSummary | null> {
  // Gate behind feature flag
  if (!options.enableAiHints) {
    return null;
  }

  try {
    const anthropic = getAnthropicClient();

    const prompt = `You are a network intelligence assistant. Generate a concise, actionable summary for the following recommendation.

Title: ${recommendation.title}
Type: ${recommendation.recommendationType}
Theme: ${recommendation.suggestionTheme}
Severity: ${recommendation.severity}
Summary: ${recommendation.summary}
${recommendation.rationale ? `Rationale: ${recommendation.rationale}` : ''}

Provide a response in JSON format with:
- "summary": 1-2 sentence human-friendly explanation of what this recommendation means
- "actionItems": array of 2-3 specific actions the user could take
- "nextSteps": single sentence describing the immediate next step

Keep language simple and actionable. Focus on practical guidance, not theory.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Unexpected response type from Claude');
      return null;
    }

    // Parse JSON response
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Claude response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!parsed.summary || !Array.isArray(parsed.actionItems) || !parsed.nextSteps) {
        console.error('Invalid response structure from Claude');
        return null;
      }

      return {
        summary: parsed.summary,
        actionItems: parsed.actionItems.slice(0, 3), // Limit to 3 items
        nextSteps: parsed.nextSteps,
      };
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', parseErr);
      return null;
    }
  } catch (err) {
    console.error('Failed to generate AI summary:', err);
    return null;
  }
}

/**
 * Batch generate AI summaries for multiple recommendations
 */
export async function generateRecommendationSummaries(
  recommendations: GuardianNetworkRecommendation[],
  options: RecommendationAiHelperOptions
): Promise<Map<string, RecommendationAiSummary>> {
  const summaries = new Map<string, RecommendationAiSummary>();

  // Process sequentially to avoid rate limiting
  for (const rec of recommendations.slice(0, 10)) {
    // Limit to 10 to avoid excessive API calls
    const summary = await generateRecommendationSummary(rec, options);
    if (summary) {
      summaries.set(rec.id, summary);
    }
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return summaries;
}
