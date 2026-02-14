/**
 * AIDO Intent Cluster AI Service
 * Generates question-based intent clusters using Perplexity + Claude Opus 4
 *
 * CRITICAL: All H2 headings must be direct questions for algorithmic immunity
 */

import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import { PerplexitySonar } from '@/lib/ai/perplexity-sonar';
import { createIntentCluster, IntentClusterInput } from './database/intent-clusters';

interface IntentClusterGenerationInput {
  clientId: string;
  workspaceId: string;
  topicId: string;
  seedKeywords: string[];
  industry: string;
  location?: string;
  targetAudience?: string;
  businessGoals?: string[];
}

interface GeneratedIntentCluster {
  primaryIntent: string;
  secondaryIntents: string[];
  searcherMindset: string;
  painPoints: string[];
  desiredOutcomes: string[];
  riskConcerns: string[];
  purchaseStage: string;
  exampleQueries: string[]; // These become H2 headings
  followUpQuestions: string[]; // These become H3 subheadings
  localModifiers: string[];
  businessImpactScore: number;
  difficultyScore: number;
  alignmentScore: number;
}

/**
 * Generate intent cluster with question-based structure
 * Uses Perplexity for research, Claude Opus 4 Extended Thinking for extraction
 */
export async function generateIntentCluster(
  input: IntentClusterGenerationInput
): Promise<IntentClusterInput> {
  try {
    console.log('[AIDO] Starting intent cluster generation for topic:', input.topicId);

    // Step 1: Perplexity research for current trends
    const sonar = new PerplexitySonar();
    const researchQueries = [
      `"${input.seedKeywords.join('" OR "')} common questions ${input.industry}`,
      `"${input.seedKeywords.join('" OR "')} FAQs customer concerns ${input.location || ''}`,
      `"${input.seedKeywords.join('" OR "')} problems solutions ${new Date().getFullYear()}`
    ];

    const researchResults = await Promise.all(
      researchQueries.map(query =>
        sonar.search(query, {
          model: 'sonar-pro',
          recencyFilter: 'month',
          maxTokens: 2000
        })
      )
    );

    const combinedResearch = researchResults.map(r => r.answer).join('\n\n');
    const allCitations = researchResults.flatMap(r => r.citations);

    // Step 2: Claude Opus 4 Extended Thinking to extract intent clusters
    const { anthropic } = await import('@/lib/anthropic/client');

    const systemPrompt = `You are an expert SEO strategist specializing in algorithmic immunity for AI-first search (Google AI Overviews, ChatGPT Search, Perplexity).

CRITICAL RULES FOR INTENT CLUSTERS:
1. ALL example_queries MUST be natural language questions users actually ask
2. Questions should be specific, including numbers/locations where relevant
3. NO generic phrases - each question must be answerable with specific facts
4. Frame questions from the searcher's perspective, not the business perspective
5. Include commercial intent questions (cost, time, process, comparison)

Your task: Extract 10-15 high-value question intents from the research.`;

    const userPrompt = `Based on this research about ${input.seedKeywords.join(', ')} in the ${input.industry} industry:

${combinedResearch}

Extract a comprehensive intent cluster with:
1. 10-15 example_queries that are DIRECT QUESTIONS (will become H2 headings)
2. 5-8 follow_up_questions for each main question (will become H3 subheadings)
3. Pain points and desired outcomes expressed as questions where possible
4. Business impact scoring (0-1) based on commercial value
5. Local modifiers if location was mentioned: ${input.location || 'not specified'}

Target audience: ${input.targetAudience || 'general consumers'}
Business goals: ${input.businessGoals?.join(', ') || 'increase visibility and conversions'}

Return a JSON object with this structure:
{
  "primaryIntent": "Main search intent",
  "secondaryIntents": ["Related intents"],
  "searcherMindset": "What the searcher is thinking/feeling",
  "painPoints": ["Problems as questions"],
  "desiredOutcomes": ["Goals as questions"],
  "riskConcerns": ["Worries as questions"],
  "purchaseStage": "awareness|consideration|decision|retention",
  "exampleQueries": ["How much does X cost?", "What is the best Y for Z?", ...],
  "followUpQuestions": ["More specific sub-questions"],
  "localModifiers": ["near me", "in Brisbane", ...],
  "businessImpactScore": 0.0-1.0,
  "difficultyScore": 0.0-1.0,
  "alignmentScore": 0.0-1.0
}`;

    const response = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        thinking: {
          type: 'enabled',
          budget_tokens: 10000, // Extended thinking for quality extraction
        },
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(response.data, 'claude-opus-4-5-20251101');
    logCacheStats('IntentCluster:generateCluster', cacheStats);

    // Extract JSON from response
    const responseText = response.data.content[0].type === 'text'
      ? response.data.content[0].text
      : '';

    let generatedCluster: GeneratedIntentCluster;
    try {
      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedCluster = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[AIDO] Failed to parse JSON response:', parseError);
      throw new Error('Failed to parse intent cluster from AI response');
    }

    // Step 3: Validate and enhance the cluster
    validateIntentCluster(generatedCluster);

    // Step 4: Save to database
    const intentClusterData: IntentClusterInput = {
      topicId: input.topicId,
      clientId: input.clientId,
      workspaceId: input.workspaceId,
      primaryIntent: generatedCluster.primaryIntent,
      secondaryIntents: generatedCluster.secondaryIntents,
      searcherMindset: generatedCluster.searcherMindset,
      painPoints: generatedCluster.painPoints,
      desiredOutcomes: generatedCluster.desiredOutcomes,
      riskConcerns: generatedCluster.riskConcerns,
      purchaseStage: generatedCluster.purchaseStage,
      exampleQueries: generatedCluster.exampleQueries,
      followUpQuestions: generatedCluster.followUpQuestions,
      localModifiers: generatedCluster.localModifiers || [],
      businessImpactScore: generatedCluster.businessImpactScore,
      difficultyScore: generatedCluster.difficultyScore,
      alignmentScore: generatedCluster.alignmentScore,
    };

    const savedCluster = await createIntentCluster(intentClusterData);

    console.log('[AIDO] Intent cluster generated successfully:', {
      id: savedCluster.id,
      questionsGenerated: generatedCluster.exampleQueries.length,
      businessImpact: generatedCluster.businessImpactScore,
    });

    return intentClusterData;

  } catch (error) {
    console.error('[AIDO] Intent cluster generation failed:', error);
    throw error;
  }
}

/**
 * Validate that intent cluster meets AIDO structure rules
 */
function validateIntentCluster(cluster: GeneratedIntentCluster): void {
  const errors: string[] = [];

  // Check that example queries are questions
  const nonQuestions = cluster.exampleQueries.filter(q => !isQuestion(q));
  if (nonQuestions.length > 0) {
    errors.push(`Non-question queries found: ${nonQuestions.join(', ')}`);
  }

  // Ensure minimum number of questions
  if (cluster.exampleQueries.length < 10) {
    errors.push(`Only ${cluster.exampleQueries.length} questions generated (minimum 10 required)`);
  }

  // Check for generic/fluff questions
  const fluffPatterns = [
    'what should i know',
    'things to consider',
    'factors to think about',
    'what are the benefits',
  ];

  const fluffyQuestions = cluster.exampleQueries.filter(q =>
    fluffPatterns.some(pattern => q.toLowerCase().includes(pattern))
  );

  if (fluffyQuestions.length > 0) {
    errors.push(`Generic questions detected: ${fluffyQuestions.join(', ')}`);
  }

  // Validate scores
  if (cluster.businessImpactScore < 0 || cluster.businessImpactScore > 1) {
    errors.push('Business impact score must be between 0 and 1');
  }

  if (errors.length > 0) {
    console.warn('[AIDO] Intent cluster validation warnings:', errors);
  }
}

/**
 * Check if a string is a question
 */
function isQuestion(text: string): boolean {
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'which', 'can', 'do', 'does', 'is', 'are', 'will', 'would', 'should'];
  const lowerText = text.toLowerCase().trim();

  return text.includes('?') || questionWords.some(word => lowerText.startsWith(word));
}

/**
 * Score question quality for H2 heading use
 */
export function scoreQuestionQuality(question: string): number {
  let score = 0.5;

  // Has question mark (+0.1)
  if (question.includes('?')) score += 0.1;

  // Contains numbers/specifics (+0.2)
  if (/\d+/.test(question)) score += 0.2;

  // Contains location/place (+0.1)
  const locationWords = ['in', 'at', 'near', 'around', 'within'];
  if (locationWords.some(word => question.toLowerCase().includes(word))) score += 0.1;

  // Not too long (+0.1)
  if (question.length < 100 && question.length > 20) score += 0.1;

  return Math.min(score, 1.0);
}

/**
 * Refresh an existing intent cluster with new data
 */
export async function refreshIntentCluster(
  clusterId: string,
  input: IntentClusterGenerationInput
): Promise<IntentClusterInput> {
  console.log('[AIDO] Refreshing intent cluster:', clusterId);

  // Generate fresh cluster
  const newCluster = await generateIntentCluster(input);

  // Merge with existing data (keep high-quality questions)
  // This allows accumulation of good questions over time

  return newCluster;
}