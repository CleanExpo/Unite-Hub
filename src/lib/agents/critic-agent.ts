/**
 * Critic Agent — Self-Reflection Loop for Content Quality
 *
 * Independent quality reviewer that evaluates AI-generated content across
 * 6 dimensions. Uses Haiku 4.5 for fast reviews, escalates to Sonnet 4.5
 * for borderline scores (40-60). Ensures brand consistency, factual accuracy,
 * and engagement quality before content reaches end users.
 *
 * @module agents/critic-agent
 */

import { getAnthropicClient } from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CriticVerdict = 'approve' | 'revise' | 'flag' | 'reject';

export interface CriticDimension {
  name: string;
  score: number; // 0-100
  feedback: string;
}

export interface CriticReview {
  verdict: CriticVerdict;
  overallScore: number; // 0-100
  dimensions: {
    brandConsistency: CriticDimension;
    toneAccuracy: CriticDimension;
    factualConfidence: CriticDimension;
    clarity: CriticDimension;
    engagement: CriticDimension;
    callToAction: CriticDimension;
  };
  suggestions: string[];
  escalated: boolean;
  model: string;
  reviewTimeMs: number;
}

export interface BrandGuidelines {
  voiceDescriptors: string[]; // e.g. ["professional", "approachable"]
  avoidWords: string[];
  requiredElements?: string[]; // e.g. ["CTA", "value proposition"]
  positioningKeywords?: string[];
  toneScale?: {
    formality: number; // 1-10
    warmth: number;
    authority: number;
    playfulness: number;
  };
}

export interface CriticRequest {
  content: string;
  contentType: 'email' | 'social_post' | 'landing_page' | 'proposal' | 'blog' | 'ad_copy' | 'general';
  targetAudience?: string;
  brandGuidelines?: BrandGuidelines;
  originalPrompt?: string;
  context?: string;
}

export interface BatchCriticResult {
  reviews: Array<{ index: number; review: CriticReview }>;
  summary: {
    totalReviewed: number;
    approved: number;
    revise: number;
    flagged: number;
    rejected: number;
    averageScore: number;
  };
}

// ---------------------------------------------------------------------------
// Score Thresholds
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  approve: 75,
  revise: 50,
  flag: 30,
  // Below 30 → reject
  escalationRange: { min: 40, max: 60 },
} as const;

// ---------------------------------------------------------------------------
// Critic Agent
// ---------------------------------------------------------------------------

export class CriticAgent {
  private reviewCount = 0;
  private escalationCount = 0;

  /**
   * Review a single piece of content.
   */
  async review(request: CriticRequest): Promise<CriticReview> {
    const start = Date.now();

    // Step 1: Fast review with Haiku
    const fastReview = await this.runReview(request, ANTHROPIC_MODELS.HAIKU_4_5);
    this.reviewCount++;

    // Step 2: Check if escalation needed (borderline score)
    const needsEscalation =
      fastReview.overallScore >= THRESHOLDS.escalationRange.min &&
      fastReview.overallScore <= THRESHOLDS.escalationRange.max;

    if (needsEscalation) {
      this.escalationCount++;
      const deepReview = await this.runReview(request, ANTHROPIC_MODELS.SONNET_4_5);
      // Average the two scores, weighted toward the deeper review
      const blendedScore = Math.round(
        fastReview.overallScore * 0.3 + deepReview.overallScore * 0.7
      );
      deepReview.overallScore = blendedScore;
      deepReview.verdict = this.getVerdict(blendedScore);
      deepReview.escalated = true;
      deepReview.reviewTimeMs = Date.now() - start;
      return deepReview;
    }

    fastReview.reviewTimeMs = Date.now() - start;
    return fastReview;
  }

  /**
   * Review multiple pieces of content in batch.
   */
  async batchReview(
    requests: CriticRequest[]
  ): Promise<BatchCriticResult> {
    const reviews = await Promise.all(
      requests.map(async (req, index) => {
        const review = await this.review(req);
        return { index, review };
      })
    );

    const scores = reviews.map((r) => r.review.overallScore);
    const verdicts = reviews.map((r) => r.review.verdict);

    return {
      reviews,
      summary: {
        totalReviewed: reviews.length,
        approved: verdicts.filter((v) => v === 'approve').length,
        revise: verdicts.filter((v) => v === 'revise').length,
        flagged: verdicts.filter((v) => v === 'flag').length,
        rejected: verdicts.filter((v) => v === 'reject').length,
        averageScore:
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0,
      },
    };
  }

  /**
   * Quick brand-voice check (no AI call, pattern-based).
   */
  checkBrandVoice(
    content: string,
    guidelines: BrandGuidelines
  ): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    const lower = content.toLowerCase();

    // Check avoid words
    for (const word of guidelines.avoidWords) {
      if (lower.includes(word.toLowerCase())) {
        issues.push(`Contains avoided word: "${word}"`);
      }
    }

    // Check required elements
    if (guidelines.requiredElements) {
      for (const element of guidelines.requiredElements) {
        const elementLower = element.toLowerCase();
        if (!lower.includes(elementLower)) {
          issues.push(`Missing required element: "${element}"`);
        }
      }
    }

    // Check positioning keywords
    if (guidelines.positioningKeywords && guidelines.positioningKeywords.length > 0) {
      const found = guidelines.positioningKeywords.some((kw) =>
        lower.includes(kw.toLowerCase())
      );
      if (!found) {
        issues.push(
          `No positioning keywords found. Expected at least one of: ${guidelines.positioningKeywords.join(', ')}`
        );
      }
    }

    return { passed: issues.length === 0, issues };
  }

  /**
   * Get review/escalation stats.
   */
  getStats() {
    return {
      totalReviews: this.reviewCount,
      escalations: this.escalationCount,
      escalationRate:
        this.reviewCount > 0
          ? Math.round((this.escalationCount / this.reviewCount) * 100)
          : 0,
    };
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private async runReview(
    request: CriticRequest,
    model: string
  ): Promise<CriticReview> {
    const client = getAnthropicClient();

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return this.parseReviewResponse(text, model);
    } catch (error) {
      console.error('[CriticAgent] Review failed:', error);
      // Return a conservative fallback review
      return this.fallbackReview(model);
    }
  }

  private buildSystemPrompt(request: CriticRequest): string {
    const brandSection = request.brandGuidelines
      ? `\n\nBrand Guidelines:
- Voice: ${request.brandGuidelines.voiceDescriptors.join(', ')}
- Avoid: ${request.brandGuidelines.avoidWords.join(', ')}
${request.brandGuidelines.requiredElements ? `- Required: ${request.brandGuidelines.requiredElements.join(', ')}` : ''}
${request.brandGuidelines.positioningKeywords ? `- Keywords: ${request.brandGuidelines.positioningKeywords.join(', ')}` : ''}
${request.brandGuidelines.toneScale ? `- Tone: formality=${request.brandGuidelines.toneScale.formality}/10, warmth=${request.brandGuidelines.toneScale.warmth}/10, authority=${request.brandGuidelines.toneScale.authority}/10` : ''}`
      : '';

    return `You are a content quality critic. Review the ${request.contentType} content and score it across 6 dimensions (0-100 each).${brandSection}

${request.targetAudience ? `Target audience: ${request.targetAudience}` : ''}

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "overallScore": <number 0-100>,
  "dimensions": {
    "brandConsistency": { "score": <0-100>, "feedback": "<1 sentence>" },
    "toneAccuracy": { "score": <0-100>, "feedback": "<1 sentence>" },
    "factualConfidence": { "score": <0-100>, "feedback": "<1 sentence>" },
    "clarity": { "score": <0-100>, "feedback": "<1 sentence>" },
    "engagement": { "score": <0-100>, "feedback": "<1 sentence>" },
    "callToAction": { "score": <0-100>, "feedback": "<1 sentence>" }
  },
  "suggestions": ["<actionable suggestion 1>", "<suggestion 2>"]
}`;
  }

  private buildUserPrompt(request: CriticRequest): string {
    let prompt = `Review this ${request.contentType}:\n\n${request.content}`;

    if (request.originalPrompt) {
      prompt += `\n\nOriginal prompt that generated this: ${request.originalPrompt}`;
    }
    if (request.context) {
      prompt += `\n\nAdditional context: ${request.context}`;
    }

    return prompt;
  }

  private parseReviewResponse(text: string, model: string): CriticReview {
    try {
      // Strip code fences if present
      const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const overallScore = Math.min(100, Math.max(0, parsed.overallScore ?? 50));

      const parseDimension = (
        dim: { score?: number; feedback?: string } | undefined,
        name: string
      ): CriticDimension => ({
        name,
        score: Math.min(100, Math.max(0, dim?.score ?? 50)),
        feedback: dim?.feedback ?? 'No feedback provided',
      });

      return {
        verdict: this.getVerdict(overallScore),
        overallScore,
        dimensions: {
          brandConsistency: parseDimension(
            parsed.dimensions?.brandConsistency,
            'Brand Consistency'
          ),
          toneAccuracy: parseDimension(
            parsed.dimensions?.toneAccuracy,
            'Tone Accuracy'
          ),
          factualConfidence: parseDimension(
            parsed.dimensions?.factualConfidence,
            'Factual Confidence'
          ),
          clarity: parseDimension(parsed.dimensions?.clarity, 'Clarity'),
          engagement: parseDimension(
            parsed.dimensions?.engagement,
            'Engagement'
          ),
          callToAction: parseDimension(
            parsed.dimensions?.callToAction,
            'Call to Action'
          ),
        },
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        escalated: false,
        model,
        reviewTimeMs: 0,
      };
    } catch {
      return this.fallbackReview(model);
    }
  }

  private getVerdict(score: number): CriticVerdict {
    if (score >= THRESHOLDS.approve) return 'approve';
    if (score >= THRESHOLDS.revise) return 'revise';
    if (score >= THRESHOLDS.flag) return 'flag';
    return 'reject';
  }

  private fallbackReview(model: string): CriticReview {
    const defaultDimension = (name: string): CriticDimension => ({
      name,
      score: 50,
      feedback: 'Unable to evaluate — review manually',
    });

    return {
      verdict: 'flag',
      overallScore: 50,
      dimensions: {
        brandConsistency: defaultDimension('Brand Consistency'),
        toneAccuracy: defaultDimension('Tone Accuracy'),
        factualConfidence: defaultDimension('Factual Confidence'),
        clarity: defaultDimension('Clarity'),
        engagement: defaultDimension('Engagement'),
        callToAction: defaultDimension('Call to Action'),
      },
      suggestions: ['Manual review recommended — automated review could not complete'],
      escalated: false,
      model,
      reviewTimeMs: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const criticAgent = new CriticAgent();
