/**
 * Behavioural Search Service
 * CTR benchmarking and behavioural signal analysis aligned with Google NavBoost
 *
 * Features:
 * - CTR benchmark analysis (actual vs expected)
 * - Title/meta description A/B testing
 * - NavBoost potential estimation
 * - Opportunity level classification
 * - Human governance mode enforced
 *
 * Key Concepts (from Google leak):
 * - NavBoost: User engagement signals that influence rankings
 * - CTR is a key NavBoost signal
 * - Pogo-sticking (quick returns to SERP) is negative
 * - Dwell time (time on page) is positive
 *
 * @module behaviouralSearchService
 * @version 1.0.0
 */

import { getSupabaseServer } from '@/lib/supabase';
import { SEO_LEAK_ENGINE_CONFIG } from '@/config/seoLeakEngine.config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export type OpportunityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type TestStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type TestWinner = 'a' | 'b' | 'no_winner' | 'inconclusive' | null;

export interface CTRBenchmark {
  id: string;
  founder_business_id: string;
  url: string | null;
  keyword: string;
  serp_position: number;
  actual_ctr: number | null;
  expected_ctr: number | null;
  opportunity_level: OpportunityLevel | null;
  navboost_inference: NavBoostInference;
  created_at: string;
}

export interface NavBoostInference {
  click_satisfaction_estimate?: number; // 0-100
  dwell_time_signal?: 'strong' | 'moderate' | 'weak' | 'unknown';
  pogo_sticking_risk?: 'high' | 'medium' | 'low' | 'unknown';
  competitor_ctr_comparison?: 'above' | 'below' | 'average' | 'unknown';
  overall_navboost_score?: number; // 0-100
  recommendations?: string[];
}

export interface TitleMetaVariant {
  title: string;
  meta_description: string;
  ctr?: number;
  impressions?: number;
  clicks?: number;
}

export interface TitleMetaTest {
  id: string;
  founder_business_id: string;
  url: string;
  keyword: string | null;
  variant_a: TitleMetaVariant;
  variant_b: TitleMetaVariant;
  winner: TestWinner;
  statistical_significance: number | null;
  status: TestStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface TestResults {
  variant_a_ctr: number;
  variant_a_impressions: number;
  variant_a_clicks: number;
  variant_b_ctr: number;
  variant_b_impressions: number;
  variant_b_clicks: number;
}

export interface NavBoostPotential {
  url: string;
  overall_score: number; // 0-100
  ctr_optimization_potential: number; // 0-100
  dwell_time_potential: number; // 0-100
  pogo_sticking_reduction_potential: number; // 0-100
  recommendations: NavBoostRecommendation[];
}

export interface NavBoostRecommendation {
  factor: string;
  current_state: string;
  target_state: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  description: string;
}

// =============================================================================
// CTR Benchmark Data (Industry Average)
// =============================================================================

/**
 * Expected CTR by SERP position (industry average)
 * Based on aggregated CTR studies
 */
const EXPECTED_CTR_BY_POSITION: Record<number, number> = {
  1: 27.6,
  2: 15.8,
  3: 11.0,
  4: 8.4,
  5: 6.3,
  6: 4.9,
  7: 4.0,
  8: 3.3,
  9: 2.7,
  10: 2.4,
  // Beyond page 1
  11: 1.5,
  12: 1.3,
  13: 1.1,
  14: 0.9,
  15: 0.8,
  16: 0.7,
  17: 0.6,
  18: 0.5,
  19: 0.4,
  20: 0.3,
};

/**
 * Get expected CTR for a position
 */
function getExpectedCTR(position: number): number {
  if (position <= 0) {
return 0;
}
  if (position <= 20) {
return EXPECTED_CTR_BY_POSITION[position] || 0.3;
}
  if (position <= 30) {
return 0.2;
}
  if (position <= 50) {
return 0.1;
}
  return 0.05;
}

/**
 * Determine opportunity level based on CTR gap
 */
function determineOpportunityLevel(
  actualCTR: number,
  expectedCTR: number,
  position: number
): OpportunityLevel {
  const ctrGap = expectedCTR - actualCTR;
  const ctrRatio = actualCTR / expectedCTR;

  // Position 1-3 opportunities are more critical
  if (position <= 3) {
    if (ctrRatio < 0.5) {
return 'critical';
}
    if (ctrRatio < 0.7) {
return 'high';
}
    if (ctrRatio < 0.9) {
return 'medium';
}
    if (ctrRatio < 1.1) {
return 'low';
}
    return 'none';
  }

  // Position 4-10 opportunities
  if (position <= 10) {
    if (ctrRatio < 0.4) {
return 'critical';
}
    if (ctrRatio < 0.6) {
return 'high';
}
    if (ctrRatio < 0.8) {
return 'medium';
}
    if (ctrRatio < 1.0) {
return 'low';
}
    return 'none';
  }

  // Beyond page 1
  if (ctrRatio < 0.3) {
return 'high';
}
  if (ctrRatio < 0.6) {
return 'medium';
}
  if (ctrRatio < 0.9) {
return 'low';
}
  return 'none';
}

/**
 * Generate NavBoost inference from CTR data
 */
function inferNavBoostSignals(
  actualCTR: number,
  expectedCTR: number,
  position: number
): NavBoostInference {
  const ctrRatio = actualCTR / expectedCTR;
  const recommendations: string[] = [];

  // Click satisfaction estimate
  let clickSatisfaction = 50;
  if (ctrRatio >= 1.2) {
    clickSatisfaction = 80;
  } else if (ctrRatio >= 1.0) {
    clickSatisfaction = 70;
  } else if (ctrRatio >= 0.7) {
    clickSatisfaction = 50;
  } else {
    clickSatisfaction = 30;
    recommendations.push('Improve title tag to be more compelling and relevant to search intent');
  }

  // Dwell time signal inference
  let dwellTimeSignal: 'strong' | 'moderate' | 'weak' | 'unknown' = 'unknown';
  if (ctrRatio >= 1.0) {
    dwellTimeSignal = 'strong';
  } else if (ctrRatio >= 0.7) {
    dwellTimeSignal = 'moderate';
  } else {
    dwellTimeSignal = 'weak';
    recommendations.push('Improve content quality and depth to increase time on page');
  }

  // Pogo-sticking risk
  let pogoStickingRisk: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
  if (ctrRatio < 0.5) {
    pogoStickingRisk = 'high';
    recommendations.push('Ensure page content matches title and meta description promises');
  } else if (ctrRatio < 0.8) {
    pogoStickingRisk = 'medium';
    recommendations.push('Review page load speed and above-the-fold content');
  } else {
    pogoStickingRisk = 'low';
  }

  // Competitor CTR comparison
  let competitorComparison: 'above' | 'below' | 'average' | 'unknown' = 'unknown';
  if (ctrRatio >= 1.1) {
    competitorComparison = 'above';
  } else if (ctrRatio >= 0.9) {
    competitorComparison = 'average';
  } else {
    competitorComparison = 'below';
    recommendations.push('Analyze competitor titles and snippets for improvement ideas');
  }

  // Overall NavBoost score
  const navboostScore = Math.min(100, Math.max(0, Math.round(
    clickSatisfaction * 0.4 +
    (dwellTimeSignal === 'strong' ? 90 : dwellTimeSignal === 'moderate' ? 60 : 30) * 0.3 +
    (pogoStickingRisk === 'low' ? 90 : pogoStickingRisk === 'medium' ? 50 : 20) * 0.3
  )));

  if (recommendations.length === 0 && ctrRatio < 1.2) {
    recommendations.push('Consider A/B testing different title variations to optimize CTR');
  }

  return {
    click_satisfaction_estimate: clickSatisfaction,
    dwell_time_signal: dwellTimeSignal,
    pogo_sticking_risk: pogoStickingRisk,
    competitor_ctr_comparison: competitorComparison,
    overall_navboost_score: navboostScore,
    recommendations,
  };
}

// =============================================================================
// Main Service Functions
// =============================================================================

/**
 * Analyze CTR benchmarks for a keyword/position
 *
 * @param businessId - Founder business ID
 * @param keyword - Target keyword
 * @param position - Current SERP position
 * @param actualCTR - Actual CTR percentage
 * @param url - Optional URL
 * @returns CTR benchmark analysis result
 */
export async function analyzeCTRBenchmarks(
  businessId: string,
  keyword: string,
  position: number,
  actualCTR: number,
  url?: string
): Promise<{ success: boolean; benchmark?: CTRBenchmark; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    if (position < 1 || position > 100) {
      return { success: false, error: 'Position must be between 1 and 100' };
    }

    const expectedCTR = getExpectedCTR(position);
    const opportunityLevel = determineOpportunityLevel(actualCTR, expectedCTR, position);
    const navboostInference = inferNavBoostSignals(actualCTR, expectedCTR, position);

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ctr_benchmarks')
      .insert({
        founder_business_id: businessId,
        url: url || null,
        keyword,
        serp_position: position,
        actual_ctr: actualCTR,
        expected_ctr: expectedCTR,
        opportunity_level: opportunityLevel,
        navboost_inference: navboostInference,
      })
      .select()
      .single();

    if (error) {
      console.error('[Behavioural Search] Save CTR benchmark error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, benchmark: data as CTRBenchmark };
  } catch (err) {
    console.error('[Behavioural Search] CTR benchmark error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Create a title/meta description A/B test
 *
 * @param businessId - Founder business ID
 * @param url - Page URL to test
 * @param variantA - First variant
 * @param variantB - Second variant
 * @param keyword - Optional target keyword
 * @returns Created test result
 */
export async function createTitleMetaTest(
  businessId: string,
  url: string,
  variantA: TitleMetaVariant,
  variantB: TitleMetaVariant,
  keyword?: string
): Promise<{ success: boolean; test?: TitleMetaTest; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    // Validate variants
    if (!variantA.title || !variantA.meta_description) {
      return { success: false, error: 'Variant A must have title and meta_description' };
    }
    if (!variantB.title || !variantB.meta_description) {
      return { success: false, error: 'Variant B must have title and meta_description' };
    }

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('title_meta_tests')
      .insert({
        founder_business_id: businessId,
        url,
        keyword: keyword || null,
        variant_a: {
          title: variantA.title,
          meta_description: variantA.meta_description,
          ctr: 0,
          impressions: 0,
          clicks: 0,
        },
        variant_b: {
          title: variantB.title,
          meta_description: variantB.meta_description,
          ctr: 0,
          impressions: 0,
          clicks: 0,
        },
        winner: null,
        statistical_significance: null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[Behavioural Search] Create test error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, test: data as TitleMetaTest };
  } catch (err) {
    console.error('[Behavioural Search] Create test error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Record test results and determine winner
 *
 * @param testId - ID of the test
 * @param results - Test results data
 * @returns Updated test result
 */
export async function recordTestResults(
  testId: string,
  results: TestResults
): Promise<{ success: boolean; test?: TitleMetaTest; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get existing test
    const { data: existingTest, error: fetchError } = await supabase
      .from('title_meta_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchError || !existingTest) {
      return { success: false, error: 'Test not found' };
    }

    // Calculate winner
    const { winner, significance } = calculateWinner(results);

    // Update variants with results
    const updatedVariantA: TitleMetaVariant = {
      ...(existingTest.variant_a as TitleMetaVariant),
      ctr: results.variant_a_ctr,
      impressions: results.variant_a_impressions,
      clicks: results.variant_a_clicks,
    };

    const updatedVariantB: TitleMetaVariant = {
      ...(existingTest.variant_b as TitleMetaVariant),
      ctr: results.variant_b_ctr,
      impressions: results.variant_b_impressions,
      clicks: results.variant_b_clicks,
    };

    const { data, error } = await supabase
      .from('title_meta_tests')
      .update({
        variant_a: updatedVariantA,
        variant_b: updatedVariantB,
        winner,
        statistical_significance: significance,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) {
      console.error('[Behavioural Search] Record results error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, test: data as TitleMetaTest };
  } catch (err) {
    console.error('[Behavioural Search] Record results error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Calculate test winner using statistical significance
 */
function calculateWinner(results: TestResults): { winner: TestWinner; significance: number } {
  const { variant_a_ctr, variant_a_impressions, variant_b_ctr, variant_b_impressions } = results;

  // Need minimum impressions for statistical validity
  const minImpressions = 100;
  if (variant_a_impressions < minImpressions || variant_b_impressions < minImpressions) {
    return { winner: 'inconclusive', significance: 0 };
  }

  // Calculate CTR difference
  const ctrDiff = Math.abs(variant_a_ctr - variant_b_ctr);
  const avgCTR = (variant_a_ctr + variant_b_ctr) / 2;

  // Simple significance calculation (would use proper statistical test in production)
  // Using pooled standard error approximation
  const pooledImpressions = variant_a_impressions + variant_b_impressions;
  const standardError = Math.sqrt(
    (avgCTR / 100) * (1 - avgCTR / 100) * (1 / variant_a_impressions + 1 / variant_b_impressions)
  );

  // Z-score calculation
  const zScore = (ctrDiff / 100) / standardError;

  // Convert to approximate significance (simplified)
  let significance = 0;
  if (zScore >= 2.576) {
significance = 99;
} else if (zScore >= 1.960) {
significance = 95;
} else if (zScore >= 1.645) {
significance = 90;
} else if (zScore >= 1.282) {
significance = 80;
} else {
significance = Math.min(79, Math.round(zScore * 30));
}

  // Determine winner
  let winner: TestWinner = 'no_winner';
  if (significance >= 95) {
    winner = variant_a_ctr > variant_b_ctr ? 'a' : 'b';
  } else if (significance >= 80) {
    winner = variant_a_ctr > variant_b_ctr ? 'a' : 'b';
  } else if (significance < 50) {
    winner = 'inconclusive';
  }

  return { winner, significance };
}

/**
 * Compute NavBoost potential for a URL
 *
 * @param businessId - Founder business ID
 * @param url - URL to analyze
 * @param currentMetrics - Current performance metrics
 * @returns NavBoost potential analysis
 */
export async function computeNavBoostPotential(
  businessId: string,
  url: string,
  currentMetrics?: {
    avgCTR?: number;
    avgPosition?: number;
    avgDwellTime?: number;
    bounceRate?: number;
  }
): Promise<{ success: boolean; potential?: NavBoostPotential; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    const recommendations: NavBoostRecommendation[] = [];

    // CTR optimization potential
    let ctrPotential = 50;
    const avgPosition = currentMetrics?.avgPosition || 10;
    const actualCTR = currentMetrics?.avgCTR || 2;
    const expectedCTR = getExpectedCTR(avgPosition);

    if (actualCTR < expectedCTR * 0.7) {
      ctrPotential = 90;
      recommendations.push({
        factor: 'CTR',
        current_state: `${actualCTR.toFixed(1)}% CTR at position ${avgPosition}`,
        target_state: `${expectedCTR.toFixed(1)}% CTR (industry average)`,
        impact: 'high',
        effort: 'medium',
        description: 'Title tag and meta description optimization can significantly improve CTR',
      });
    } else if (actualCTR < expectedCTR) {
      ctrPotential = 60;
      recommendations.push({
        factor: 'CTR',
        current_state: `${actualCTR.toFixed(1)}% CTR`,
        target_state: `${(expectedCTR * 1.1).toFixed(1)}% CTR`,
        impact: 'medium',
        effort: 'low',
        description: 'Minor title/description tweaks can push CTR above average',
      });
    } else {
      ctrPotential = 30;
    }

    // Dwell time potential
    let dwellTimePotential = 50;
    const avgDwellTime = currentMetrics?.avgDwellTime || 60;

    if (avgDwellTime < 30) {
      dwellTimePotential = 90;
      recommendations.push({
        factor: 'Dwell Time',
        current_state: `${avgDwellTime}s average`,
        target_state: '60s+ average',
        impact: 'high',
        effort: 'high',
        description: 'Content depth and engagement elements needed to increase time on page',
      });
    } else if (avgDwellTime < 60) {
      dwellTimePotential = 70;
      recommendations.push({
        factor: 'Dwell Time',
        current_state: `${avgDwellTime}s average`,
        target_state: '90s+ average',
        impact: 'medium',
        effort: 'medium',
        description: 'Add interactive elements, videos, or longer-form content',
      });
    } else {
      dwellTimePotential = 40;
    }

    // Pogo-sticking reduction potential
    let pogoStickingPotential = 50;
    const bounceRate = currentMetrics?.bounceRate || 50;

    if (bounceRate > 70) {
      pogoStickingPotential = 90;
      recommendations.push({
        factor: 'Pogo-Sticking',
        current_state: `${bounceRate}% bounce rate`,
        target_state: '<50% bounce rate',
        impact: 'high',
        effort: 'high',
        description: 'High bounce suggests content mismatch with search intent',
      });
    } else if (bounceRate > 50) {
      pogoStickingPotential = 60;
      recommendations.push({
        factor: 'Pogo-Sticking',
        current_state: `${bounceRate}% bounce rate`,
        target_state: '<40% bounce rate',
        impact: 'medium',
        effort: 'medium',
        description: 'Improve above-the-fold content and page load speed',
      });
    } else {
      pogoStickingPotential = 30;
    }

    // Overall score
    const overallScore = Math.round(
      (ctrPotential * 0.4 + dwellTimePotential * 0.35 + pogoStickingPotential * 0.25)
    );

    // Sort recommendations by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    const potential: NavBoostPotential = {
      url,
      overall_score: overallScore,
      ctr_optimization_potential: ctrPotential,
      dwell_time_potential: dwellTimePotential,
      pogo_sticking_reduction_potential: pogoStickingPotential,
      recommendations,
    };

    return { success: true, potential };
  } catch (err) {
    console.error('[Behavioural Search] NavBoost potential error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get CTR benchmarks for a business
 */
export async function getCTRBenchmarks(
  businessId: string,
  filters?: {
    opportunityLevel?: OpportunityLevel;
    keyword?: string;
    limit?: number;
  }
): Promise<CTRBenchmark[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ctr_benchmarks')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false });

    if (filters?.opportunityLevel) {
      query = query.eq('opportunity_level', filters.opportunityLevel);
    }

    if (filters?.keyword) {
      query = query.ilike('keyword', `%${filters.keyword}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Behavioural Search] Get CTR benchmarks error:', error);
      return [];
    }

    return (data ?? []) as CTRBenchmark[];
  } catch (err) {
    console.error('[Behavioural Search] Get CTR benchmarks error:', err);
    return [];
  }
}

/**
 * Get title/meta tests for a business
 */
export async function getTitleMetaTests(
  businessId: string,
  status?: TestStatus,
  limit = 50
): Promise<TitleMetaTest[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('title_meta_tests')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Behavioural Search] Get tests error:', error);
      return [];
    }

    return (data ?? []) as TitleMetaTest[];
  } catch (err) {
    console.error('[Behavioural Search] Get tests error:', err);
    return [];
  }
}

/**
 * Get a specific test
 */
export async function getTest(testId: string): Promise<TitleMetaTest | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('title_meta_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
}
      console.error('[Behavioural Search] Get test error:', error);
      return null;
    }

    return data as TitleMetaTest;
  } catch (err) {
    console.error('[Behavioural Search] Get test error:', err);
    return null;
  }
}

/**
 * Start a test (change status to running)
 */
export async function startTest(testId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('title_meta_tests')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', testId)
      .in('status', ['draft', 'scheduled', 'paused']);

    if (error) {
      console.error('[Behavioural Search] Start test error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Behavioural Search] Start test error:', err);
    return false;
  }
}

/**
 * Pause a running test
 */
export async function pauseTest(testId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('title_meta_tests')
      .update({ status: 'paused' })
      .eq('id', testId)
      .eq('status', 'running');

    if (error) {
      console.error('[Behavioural Search] Pause test error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Behavioural Search] Pause test error:', err);
    return false;
  }
}

/**
 * Cancel a test
 */
export async function cancelTest(testId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('title_meta_tests')
      .update({ status: 'cancelled' })
      .eq('id', testId);

    if (error) {
      console.error('[Behavioural Search] Cancel test error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Behavioural Search] Cancel test error:', err);
    return false;
  }
}

/**
 * Delete a CTR benchmark
 */
export async function deleteCTRBenchmark(benchmarkId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('ctr_benchmarks')
      .delete()
      .eq('id', benchmarkId);

    if (error) {
      console.error('[Behavioural Search] Delete benchmark error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Behavioural Search] Delete benchmark error:', err);
    return false;
  }
}

/**
 * Delete a test
 */
export async function deleteTest(testId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('title_meta_tests')
      .delete()
      .eq('id', testId);

    if (error) {
      console.error('[Behavioural Search] Delete test error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Behavioural Search] Delete test error:', err);
    return false;
  }
}

/**
 * Get CTR optimization summary for a business
 */
export async function getCTROptimizationSummary(businessId: string): Promise<{
  totalBenchmarks: number;
  criticalOpportunities: number;
  highOpportunities: number;
  averageNavBoostScore: number;
  topRecommendations: string[];
}> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ctr_benchmarks')
      .select('opportunity_level, navboost_inference')
      .eq('founder_business_id', businessId);

    if (error) {
      console.error('[Behavioural Search] Get summary error:', error);
      return {
        totalBenchmarks: 0,
        criticalOpportunities: 0,
        highOpportunities: 0,
        averageNavBoostScore: 0,
        topRecommendations: [],
      };
    }

    const benchmarks = data ?? [];
    const criticalCount = benchmarks.filter(b => b.opportunity_level === 'critical').length;
    const highCount = benchmarks.filter(b => b.opportunity_level === 'high').length;

    const navBoostScores = benchmarks
      .map(b => (b.navboost_inference as NavBoostInference)?.overall_navboost_score)
      .filter((s): s is number => s !== undefined);

    const avgScore = navBoostScores.length > 0
      ? navBoostScores.reduce((a, b) => a + b, 0) / navBoostScores.length
      : 0;

    // Collect unique recommendations
    const allRecommendations = benchmarks
      .flatMap(b => (b.navboost_inference as NavBoostInference)?.recommendations || []);
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);

    return {
      totalBenchmarks: benchmarks.length,
      criticalOpportunities: criticalCount,
      highOpportunities: highCount,
      averageNavBoostScore: Math.round(avgScore),
      topRecommendations: uniqueRecommendations,
    };
  } catch (err) {
    console.error('[Behavioural Search] Get summary error:', err);
    return {
      totalBenchmarks: 0,
      criticalOpportunities: 0,
      highOpportunities: 0,
      averageNavBoostScore: 0,
      topRecommendations: [],
    };
  }
}
