/**
 * E-E-A-T Analyzer
 * Expertise, Experience, Authoritativeness, Trustworthiness assessment
 *
 * Reuses 70% from seoLeakAgent.assessEEAT() with health check optimizations
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import type { EEATAnalysis } from '@/lib/health-check/orchestrator';

/**
 * Analyzes E-E-A-T signals for a URL
 * Returns scores 0-100 for each dimension plus signal arrays
 */
export async function analyzeEEAT(url: string): Promise<EEATAnalysis> {
  try {
    const domain = new URL(url).hostname;

    // Generate E-E-A-T assessment with Claude
    const eeatAnalysis = await assessEEATWithClaude(url);

    // Convert Claude analysis to orchestrator format
    const analysis: EEATAnalysis = {
      expertiseScore: eeatAnalysis.scores.expertise,
      authorityScore: eeatAnalysis.scores.authoritativeness,
      trustworthinessScore: eeatAnalysis.scores.trustworthiness,
      signals: {
        expertise: eeatAnalysis.signals.expertise || extractSignals(eeatAnalysis.signals.positive, 'expertise'),
        authority: eeatAnalysis.signals.authority || extractSignals(eeatAnalysis.signals.positive, 'authority'),
        trustworthiness: eeatAnalysis.signals.trustworthiness || extractSignals(eeatAnalysis.signals.positive, 'trust'),
      },
    };

    return analysis;
  } catch (error) {
    console.error(`[EEAT Analyzer] Failed to analyze ${url}:`, error);

    // Return conservative default scores on error
    return {
      expertiseScore: 50,
      authorityScore: 50,
      trustworthinessScore: 50,
      signals: {
        expertise: ['Unable to assess expertise signals'],
        authority: ['Unable to assess authority signals'],
        trustworthiness: ['Unable to assess trustworthiness signals'],
      },
    };
  }
}

/**
 * Claude-powered E-E-A-T assessment
 * Reused from seoLeakAgent.analyzeEEATWithClaude
 */
async function assessEEATWithClaude(
  url: string
): Promise<{
  scores: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
    overall: number;
  };
  signals: {
    positive: string[];
    negative: string[];
    expertise?: string[];
    authority?: string[];
    trustworthiness?: string[];
  };
  recommendations: string[];
}> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Perform a detailed E-E-A-T assessment for ${url}. Analyze:

1. **Expertise** (0-100): Does the content demonstrate specialized knowledge?
   - Author credentials and qualifications
   - Content depth and technical accuracy
   - Use of proper terminology
   - Evidence of subject matter expertise

2. **Authoritativeness/Authority** (0-100): Is the content from a recognized authority?
   - Author credentials and reputation
   - Site authority and domain trust
   - Mentions of author in reputable publications
   - Industry recognition and citations
   - Backlink profile quality

3. **Trustworthiness** (0-100): Can readers trust the content and site?
   - SSL/HTTPS presence and security
   - Clear contact information and about page
   - Privacy policy and data handling transparency
   - User reviews and testimonials
   - Editorial standards and fact-checking
   - Transparency about author and funding

4. **Experience** (0-100): Does the content show real-world experience?
   - Case studies and examples
   - Direct personal experience
   - First-hand knowledge demonstration
   - Practical application examples

Return a detailed JSON response:
{
  "scores": {
    "experience": <0-100>,
    "expertise": <0-100>,
    "authoritativeness": <0-100>,
    "trustworthiness": <0-100>,
    "overall": <0-100>
  },
  "signals": {
    "positive": [
      "specific positive signal found",
      "another positive signal"
    ],
    "negative": [
      "specific negative signal found",
      "another negative signal"
    ],
    "expertise": ["expertise signal 1", "expertise signal 2", "expertise signal 3"],
    "authority": ["authority signal 1", "authority signal 2", "authority signal 3"],
    "trustworthiness": ["trust signal 1", "trust signal 2", "trust signal 3"]
  },
  "recommendations": [
    "specific recommendation to improve expertise",
    "specific recommendation to improve authority",
    "specific recommendation to improve trustworthiness"
  ]
}`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: `You are an expert SEO analyst specializing in E-E-A-T assessment based on Google's quality rater guidelines.

You evaluate content, websites, and authors across four dimensions:
- Expertise: Specialized knowledge and technical accuracy
- Authoritativeness: Recognition and authority in the field
- Trustworthiness: Reliability, transparency, and credibility
- Experience: Real-world knowledge and practical experience

Return structured JSON with detailed scores (0-100) and specific signals found.`,
        messages: [{ role: 'user', content: prompt }],
      });
    });

    const message = result.data;
    let jsonText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        jsonText = block.text;
        break;
      }
    }

    // Extract JSON from response
    const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;
    const analysis = JSON.parse(cleanJson);

    // Validate and clamp scores to 0-100
    return {
      scores: {
        experience: Math.max(0, Math.min(100, analysis.scores.experience || 50)),
        expertise: Math.max(0, Math.min(100, analysis.scores.expertise || 50)),
        authoritativeness: Math.max(0, Math.min(100, analysis.scores.authoritativeness || 50)),
        trustworthiness: Math.max(0, Math.min(100, analysis.scores.trustworthiness || 50)),
        overall: Math.max(
          0,
          Math.min(
            100,
            analysis.scores.overall ||
              Math.round(
                (analysis.scores.expertise +
                  analysis.scores.authoritativeness +
                  analysis.scores.trustworthiness) /
                  3
              )
          )
        ),
      },
      signals: {
        positive: Array.isArray(analysis.signals.positive) ? analysis.signals.positive.slice(0, 5) : [],
        negative: Array.isArray(analysis.signals.negative) ? analysis.signals.negative.slice(0, 5) : [],
        expertise: Array.isArray(analysis.signals.expertise) ? analysis.signals.expertise.slice(0, 3) : [],
        authority: Array.isArray(analysis.signals.authority) ? analysis.signals.authority.slice(0, 3) : [],
        trustworthiness: Array.isArray(analysis.signals.trustworthiness)
          ? analysis.signals.trustworthiness.slice(0, 3)
          : [],
      },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('[EEAT Analyzer] Claude assessment error:', error);

    // Return conservative defaults on error
    return {
      scores: {
        experience: 50,
        expertise: 50,
        authoritativeness: 50,
        trustworthiness: 50,
        overall: 50,
      },
      signals: {
        positive: ['Unable to complete detailed assessment'],
        negative: ['Analysis failed - check accessibility and format'],
      },
      recommendations: ['Try accessing the URL directly', 'Verify SSL certificate is valid', 'Check for robots.txt restrictions'],
    };
  }
}

/**
 * Extract domain-specific signals from positive signal list
 * Helper to categorize general signals into expertise/authority/trust dimensions
 */
function extractSignals(signals: string[], dimension: 'expertise' | 'authority' | 'trust'): string[] {
  if (!Array.isArray(signals)) return [];

  const dimensionKeywords: Record<string, string[]> = {
    expertise: ['expert', 'credential', 'qualification', 'knowledge', 'experience', 'accuracy', 'technical', 'specialist'],
    authority: ['authority', 'recognition', 'reputable', 'publication', 'citation', 'backlink', 'industry', 'award'],
    trust: ['trust', 'secure', 'https', 'privacy', 'transparent', 'contact', 'review', 'testimony', 'reliable'],
  };

  const keywords = dimensionKeywords[dimension] || [];
  const filtered = signals
    .filter((signal) => keywords.some((keyword) => signal.toLowerCase().includes(keyword)))
    .slice(0, 3);

  // If no filtered signals, return first few original signals
  return filtered.length > 0 ? filtered : signals.slice(0, 3);
}

/**
 * Calculate weighted E-E-A-T score
 * Used for overall health check scoring
 */
export function calculateEEATScore(analysis: EEATAnalysis): number {
  const weights = {
    expertise: 0.3,
    authority: 0.35,
    trustworthiness: 0.35,
  };

  return Math.round(
    analysis.expertiseScore * weights.expertise +
      analysis.authorityScore * weights.authority +
      analysis.trustworthinessScore * weights.trustworthiness
  );
}
