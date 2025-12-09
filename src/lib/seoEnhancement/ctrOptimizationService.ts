/**
 * CTR Optimization Service
 * Legitimate CTR improvement through title/meta testing, benchmarking, and recommendations
 * Uses real GSC data and DataForSEO for analysis
 */

import { getSupabaseServer } from '@/lib/supabase';
import { DataForSEOClient } from '@/server/dataforseoClient';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize DataForSEO client
function getDataForSEOClient(): DataForSEOClient | null {
  const login = process.env.DATAFORSEO_LOGIN || process.env.DATAFORSEO_API_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD || process.env.DATAFORSEO_API_PASSWORD;

  if (!login || !password) {
    return null;
  }

  return new DataForSEOClient(login, password);
}

// Types
export interface TitleMetaTest {
  id: string;
  workspace_id: string;
  url: string;
  keyword: string;
  variant_a_title: string;
  variant_a_meta: string;
  variant_b_title: string;
  variant_b_meta: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  winner?: 'a' | 'b' | 'no_winner';
  variant_a_impressions: number;
  variant_a_clicks: number;
  variant_a_ctr: number;
  variant_a_avg_position?: number;
  variant_b_impressions: number;
  variant_b_clicks: number;
  variant_b_ctr: number;
  variant_b_avg_position?: number;
  statistical_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface CTRBenchmark {
  id: string;
  workspace_id: string;
  url: string;
  keyword: string;
  current_position: number;
  current_ctr: number;
  current_impressions: number;
  current_clicks: number;
  expected_ctr: number;
  ctr_difference: number;
  opportunity_level: 'high' | 'medium' | 'low';
  estimated_click_gain: number;
  title_quality_score: number;
  meta_quality_score: number;
  recommendations: CTRRecommendation[];
  analyzed_at: string;
  created_at: string;
}

export interface CTRRecommendation {
  type: 'title' | 'meta' | 'url' | 'rich_snippet';
  priority: 'high' | 'medium' | 'low';
  current: string;
  suggested: string;
  expected_ctr_lift: number;
  reason: string;
}

export interface CreateTestParams {
  workspaceId: string;
  url: string;
  keyword: string;
  variantATitle: string;
  variantAMeta: string;
  variantBTitle: string;
  variantBMeta: string;
}

// Expected CTR by position (industry benchmarks)
const EXPECTED_CTR_BY_POSITION: Record<number, number> = {
  1: 28.5,
  2: 15.7,
  3: 11.0,
  4: 8.0,
  5: 7.2,
  6: 5.1,
  7: 4.0,
  8: 3.2,
  9: 2.8,
  10: 2.5,
};

/**
 * Get expected CTR for a position
 */
function getExpectedCTR(position: number): number {
  if (position <= 0) {
return 0;
}
  if (position <= 10) {
return EXPECTED_CTR_BY_POSITION[Math.round(position)] || 2.5;
}
  if (position <= 20) {
return 1.0;
}
  return 0.5;
}

/**
 * Calculate title quality score
 */
function calculateTitleQuality(title: string, keyword: string): number {
  let score = 50;

  // Length check (50-60 chars is optimal)
  const length = title.length;
  if (length >= 50 && length <= 60) {
score += 15;
} else if (length >= 40 && length <= 70) {
score += 10;
} else if (length > 70) {
score -= 10;
} else if (length < 30) {
score -= 5;
}

  // Keyword presence
  if (title.toLowerCase().includes(keyword.toLowerCase())) {
    score += 15;
    // Keyword at beginning is better
    if (title.toLowerCase().startsWith(keyword.toLowerCase())) {
      score += 5;
    }
  }

  // Power words (action-oriented)
  const powerWords = ['best', 'guide', 'how to', 'top', 'review', 'ultimate', 'complete', 'free', 'new', 'proven'];
  for (const word of powerWords) {
    if (title.toLowerCase().includes(word)) {
      score += 3;
      break;
    }
  }

  // Numbers
  if (/\d+/.test(title)) {
score += 5;
}

  // Brackets/parentheses for CTR
  if (/[\[\(].*[\]\)]/.test(title)) {
score += 3;
}

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate meta description quality score
 */
function calculateMetaQuality(meta: string, keyword: string): number {
  let score = 50;

  // Length check (150-160 chars is optimal)
  const length = meta.length;
  if (length >= 150 && length <= 160) {
score += 15;
} else if (length >= 120 && length <= 170) {
score += 10;
} else if (length > 170) {
score -= 10;
} else if (length < 100) {
score -= 5;
}

  // Keyword presence
  if (meta.toLowerCase().includes(keyword.toLowerCase())) {
    score += 15;
  }

  // Call to action
  const ctas = ['learn more', 'discover', 'get started', 'find out', 'see how', 'click', 'explore', 'check out'];
  for (const cta of ctas) {
    if (meta.toLowerCase().includes(cta)) {
      score += 5;
      break;
    }
  }

  // Unique selling points
  const usps = ['free', 'exclusive', 'guaranteed', 'expert', 'professional', 'trusted', 'award', 'certified'];
  for (const usp of usps) {
    if (meta.toLowerCase().includes(usp)) {
      score += 3;
      break;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate title/meta recommendations using AI
 */
async function generateCTRRecommendations(
  url: string,
  keyword: string,
  currentTitle: string,
  currentMeta: string,
  currentPosition: number,
  currentCTR: number
): Promise<CTRRecommendation[]> {
  try {
    const expectedCTR = getExpectedCTR(currentPosition);
    const ctrGap = expectedCTR - currentCTR;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Generate CTR optimization recommendations for this page:

URL: ${url}
Target Keyword: "${keyword}"
Current Position: ${currentPosition}
Current CTR: ${currentCTR.toFixed(2)}%
Expected CTR for Position: ${expectedCTR.toFixed(2)}%
CTR Gap: ${ctrGap.toFixed(2)}%

Current Title (${currentTitle.length} chars): "${currentTitle}"
Current Meta (${currentMeta.length} chars): "${currentMeta}"

Generate recommendations to improve CTR. Focus on:
1. Making the title more compelling and click-worthy
2. Improving the meta description with a clear value proposition
3. Any URL or rich snippet opportunities

Return JSON array:
[{
  "type": "title|meta|url|rich_snippet",
  "priority": "high|medium|low",
  "current": "current value",
  "suggested": "suggested improvement",
  "expected_ctr_lift": 0.5, // percentage points
  "reason": "why this change will improve CTR"
}]

Keep titles under 60 chars and meta descriptions under 160 chars.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[CTROptimization] Recommendation generation failed:', error);
  }

  return [];
}

/**
 * Create a title/meta A/B test
 */
export async function createTest(params: CreateTestParams): Promise<TitleMetaTest> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('title_meta_tests')
    .insert({
      workspace_id: params.workspaceId,
      url: params.url,
      keyword: params.keyword,
      variant_a_title: params.variantATitle,
      variant_a_meta: params.variantAMeta,
      variant_b_title: params.variantBTitle,
      variant_b_meta: params.variantBMeta,
      status: 'draft',
      variant_a_impressions: 0,
      variant_a_clicks: 0,
      variant_a_ctr: 0,
      variant_b_impressions: 0,
      variant_b_clicks: 0,
      variant_b_ctr: 0,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create test: ${error.message}`);
}
  return data;
}

/**
 * Start a test
 */
export async function startTest(testId: string): Promise<TitleMetaTest> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('title_meta_tests')
    .update({
      status: 'running',
      start_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to start test: ${error.message}`);
}
  return data;
}

/**
 * Update test results (called periodically with GSC data)
 */
export async function updateTestResults(
  testId: string,
  variantAData: { impressions: number; clicks: number; avgPosition?: number },
  variantBData: { impressions: number; clicks: number; avgPosition?: number }
): Promise<TitleMetaTest> {
  const supabase = await getSupabaseServer();

  const variantACTR = variantAData.impressions > 0
    ? (variantAData.clicks / variantAData.impressions) * 100
    : 0;
  const variantBCTR = variantBData.impressions > 0
    ? (variantBData.clicks / variantBData.impressions) * 100
    : 0;

  // Calculate statistical confidence (simplified z-test)
  const totalImpressions = variantAData.impressions + variantBData.impressions;
  let confidence = 0;
  if (totalImpressions > 1000) {
    const pooledCTR = (variantAData.clicks + variantBData.clicks) / totalImpressions;
    const se = Math.sqrt(pooledCTR * (1 - pooledCTR) * (1/variantAData.impressions + 1/variantBData.impressions));
    if (se > 0) {
      const z = Math.abs(variantACTR - variantBCTR) / (se * 100);
      // Convert z-score to confidence (approximation)
      confidence = Math.min(99, Math.max(0, (1 - Math.exp(-0.5 * z * z)) * 100));
    }
  }

  const { data, error } = await supabase
    .from('title_meta_tests')
    .update({
      variant_a_impressions: variantAData.impressions,
      variant_a_clicks: variantAData.clicks,
      variant_a_ctr: Math.round(variantACTR * 100) / 100,
      variant_a_avg_position: variantAData.avgPosition,
      variant_b_impressions: variantBData.impressions,
      variant_b_clicks: variantBData.clicks,
      variant_b_ctr: Math.round(variantBCTR * 100) / 100,
      variant_b_avg_position: variantBData.avgPosition,
      statistical_confidence: Math.round(confidence * 100) / 100,
    })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update test: ${error.message}`);
}
  return data;
}

/**
 * Complete a test and declare winner
 */
export async function completeTest(testId: string): Promise<TitleMetaTest> {
  const supabase = await getSupabaseServer();

  // Get current test data
  const { data: test, error: fetchError } = await supabase
    .from('title_meta_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (fetchError) {
throw new Error(`Test not found: ${fetchError.message}`);
}

  // Determine winner
  let winner: 'a' | 'b' | 'no_winner' = 'no_winner';
  if ((test.statistical_confidence || 0) >= 95) {
    winner = test.variant_a_ctr > test.variant_b_ctr ? 'a' : 'b';
  }

  const { data, error } = await supabase
    .from('title_meta_tests')
    .update({
      status: 'completed',
      end_date: new Date().toISOString().split('T')[0],
      winner,
    })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to complete test: ${error.message}`);
}
  return data;
}

/**
 * Get tests for a workspace
 */
export async function getTests(
  workspaceId: string,
  options: { status?: string; url?: string; limit?: number } = {}
): Promise<TitleMetaTest[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('title_meta_tests')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.url) {
    query = query.eq('url', options.url);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to fetch tests: ${error.message}`);
}
  return data || [];
}

/**
 * Analyze CTR benchmark for a URL/keyword
 */
export async function analyzeCTRBenchmark(
  workspaceId: string,
  url: string,
  keyword: string,
  currentData: {
    title: string;
    meta: string;
    position: number;
    impressions: number;
    clicks: number;
  }
): Promise<CTRBenchmark> {
  const supabase = await getSupabaseServer();

  const currentCTR = currentData.impressions > 0
    ? (currentData.clicks / currentData.impressions) * 100
    : 0;
  const expectedCTR = getExpectedCTR(currentData.position);
  const ctrDifference = currentCTR - expectedCTR;

  // Determine opportunity level
  let opportunityLevel: 'high' | 'medium' | 'low' = 'low';
  if (ctrDifference < -5) {
opportunityLevel = 'high';
} else if (ctrDifference < -2) {
opportunityLevel = 'medium';
}

  // Calculate estimated click gain if CTR improved to expected
  const estimatedClickGain = ctrDifference < 0
    ? Math.round(currentData.impressions * (Math.abs(ctrDifference) / 100))
    : 0;

  // Quality scores
  const titleQuality = calculateTitleQuality(currentData.title, keyword);
  const metaQuality = calculateMetaQuality(currentData.meta, keyword);

  // Generate recommendations
  const recommendations = await generateCTRRecommendations(
    url,
    keyword,
    currentData.title,
    currentData.meta,
    currentData.position,
    currentCTR
  );

  const { data, error } = await supabase
    .from('ctr_benchmarks')
    .insert({
      workspace_id: workspaceId,
      url,
      keyword,
      current_position: currentData.position,
      current_ctr: Math.round(currentCTR * 100) / 100,
      current_impressions: currentData.impressions,
      current_clicks: currentData.clicks,
      expected_ctr: Math.round(expectedCTR * 100) / 100,
      ctr_difference: Math.round(ctrDifference * 100) / 100,
      opportunity_level: opportunityLevel,
      estimated_click_gain: estimatedClickGain,
      title_quality_score: titleQuality,
      meta_quality_score: metaQuality,
      recommendations,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save benchmark: ${error.message}`);
}
  return data;
}

/**
 * Get CTR benchmarks for a workspace
 */
export async function getCTRBenchmarks(
  workspaceId: string,
  options: { opportunityLevel?: string; limit?: number } = {}
): Promise<CTRBenchmark[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('ctr_benchmarks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('estimated_click_gain', { ascending: false });

  if (options.opportunityLevel) {
    query = query.eq('opportunity_level', options.opportunityLevel);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to fetch benchmarks: ${error.message}`);
}
  return data || [];
}

/**
 * Generate title variants for testing
 */
export async function generateTitleVariants(
  keyword: string,
  currentTitle: string,
  context?: string
): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Generate 3 alternative title tag variants for A/B testing:

Keyword: "${keyword}"
Current Title: "${currentTitle}"
${context ? `Context: ${context}` : ''}

Requirements:
- Each title must be under 60 characters
- Include the keyword naturally
- Make each variant distinctly different (different angles)
- Focus on CTR optimization (power words, numbers, brackets, etc.)

Return JSON array of 3 strings.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[CTROptimization] Title generation failed:', error);
  }

  return [];
}

/**
 * Generate meta description variants for testing
 */
export async function generateMetaVariants(
  keyword: string,
  currentMeta: string,
  context?: string
): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Generate 3 alternative meta description variants for A/B testing:

Keyword: "${keyword}"
Current Meta: "${currentMeta}"
${context ? `Context: ${context}` : ''}

Requirements:
- Each must be 150-160 characters
- Include the keyword naturally
- Include a clear call-to-action
- Make each variant distinctly different
- Focus on compelling value propositions

Return JSON array of 3 strings.`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[CTROptimization] Meta generation failed:', error);
  }

  return [];
}

// Singleton export
export const ctrOptimizationService = {
  createTest,
  startTest,
  updateTestResults,
  completeTest,
  getTests,
  analyzeCTRBenchmark,
  getCTRBenchmarks,
  generateTitleVariants,
  generateMetaVariants,
  getExpectedCTR,
  calculateTitleQuality,
  calculateMetaQuality,
};
