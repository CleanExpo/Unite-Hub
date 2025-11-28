/**
 * SEO Leak Engine Service
 * Core SEO leak signal estimation based on Google/DOJ/Yandex leak insights
 *
 * Computes leak-aligned ranking signals:
 * - Q* (Quality): Content quality, depth, freshness
 * - P* (Popularity): Traffic, engagement metrics
 * - T* (Trust): Domain age, backlink quality
 * - Site Authority: Overall domain strength
 * - NavBoost: User engagement signals (CTR, dwell time)
 * - Sandbox Risk: New site penalty risk
 * - Spam Risk: Link/content spam signals
 * - E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness
 * - Topical Focus: Topic authority concentration
 *
 * @module seoLeakEngineService
 * @version 1.0.0
 */

import { getSupabaseServer } from '@/lib/supabase';
import { SEO_LEAK_ENGINE_CONFIG, getSeoFactorWeights } from '@/config/seoLeakEngine.config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface LeakSignalProfile {
  id: string;
  founder_business_id: string;
  domain: string;
  q_star_estimate: number;
  p_star_estimate: number;
  t_star_estimate: number;
  site_authority_estimate: number;
  navboost_strength_estimate: number;
  sandbox_risk_estimate: number;
  spam_risk_estimate: number;
  eeat_strength_estimate: number;
  topical_focus_score: number;
  last_refreshed_at: string;
}

export interface LeakSignalInput {
  // Content signals (for Q*)
  contentDepth?: number; // 0-100: word count, headings, media
  contentFreshness?: number; // 0-100: recency of content
  contentUniqueness?: number; // 0-100: original vs duplicate

  // Traffic signals (for P*)
  monthlyTraffic?: number;
  trafficGrowth?: number; // percentage
  bounceRate?: number; // percentage
  avgSessionDuration?: number; // seconds

  // Trust signals (for T*)
  domainAgeYears?: number;
  backlinksCount?: number;
  referringDomainsCount?: number;
  highQualityBacklinksRatio?: number; // 0-1

  // Authority signals
  organicKeywordsCount?: number;
  topKeywordPositions?: number[]; // array of positions
  brandSearchVolume?: number;

  // User engagement signals (for NavBoost)
  ctrAverage?: number; // percentage
  dwellTimeAverage?: number; // seconds
  pogoStickingRate?: number; // percentage
  returnVisitRate?: number; // percentage

  // Spam signals
  toxicBacklinksRatio?: number; // 0-1
  keywordStuffingScore?: number; // 0-100
  thinContentRatio?: number; // 0-1

  // E-E-A-T signals
  authorExpertiseSignals?: number; // 0-100
  citationsCount?: number;
  socialProofCount?: number;
  professionalCredentials?: boolean;

  // Topical signals
  topicConsistencyScore?: number; // 0-100
  topicalDepthScore?: number; // 0-100
  semanticCoverageScore?: number; // 0-100
}

export interface ComputeProfileResult {
  success: boolean;
  profile?: LeakSignalProfile;
  error?: string;
}

export interface ProfileInsight {
  factor: string;
  score: number;
  level: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
  recommendation: string;
}

// =============================================================================
// Score Computation Functions
// =============================================================================

/**
 * Compute Q* (Quality) estimate
 * Based on Yandex leak quality factors
 */
function computeQStarEstimate(input: LeakSignalInput): number {
  const contentDepth = input.contentDepth ?? 50;
  const contentFreshness = input.contentFreshness ?? 50;
  const contentUniqueness = input.contentUniqueness ?? 70;

  // Weighted combination
  const score =
    contentDepth * 0.4 +
    contentFreshness * 0.25 +
    contentUniqueness * 0.35;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute P* (Popularity) estimate
 * Based on Yandex leak popularity factors
 */
function computePStarEstimate(input: LeakSignalInput): number {
  // Traffic score (logarithmic scale)
  let trafficScore = 0;
  if (input.monthlyTraffic) {
    trafficScore = Math.min(100, Math.log10(input.monthlyTraffic + 1) * 20);
  }

  // Growth score
  const growthScore = input.trafficGrowth
    ? Math.min(100, Math.max(0, 50 + input.trafficGrowth))
    : 50;

  // Engagement score (inverse bounce rate)
  const bounceScore = input.bounceRate
    ? Math.max(0, 100 - input.bounceRate)
    : 50;

  // Session duration score (capped at 5 min = 300s for max score)
  const sessionScore = input.avgSessionDuration
    ? Math.min(100, (input.avgSessionDuration / 300) * 100)
    : 50;

  const score =
    trafficScore * 0.35 +
    growthScore * 0.15 +
    bounceScore * 0.25 +
    sessionScore * 0.25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute T* (Trust) estimate
 * Based on Yandex leak trust factors
 */
function computeTStarEstimate(input: LeakSignalInput): number {
  // Domain age score (5+ years = max)
  const ageScore = input.domainAgeYears
    ? Math.min(100, (input.domainAgeYears / 5) * 100)
    : 30;

  // Backlinks score (logarithmic)
  let backlinkScore = 0;
  if (input.backlinksCount) {
    backlinkScore = Math.min(100, Math.log10(input.backlinksCount + 1) * 25);
  }

  // Referring domains score (logarithmic)
  let refDomainsScore = 0;
  if (input.referringDomainsCount) {
    refDomainsScore = Math.min(100, Math.log10(input.referringDomainsCount + 1) * 30);
  }

  // Quality ratio score
  const qualityScore = input.highQualityBacklinksRatio
    ? input.highQualityBacklinksRatio * 100
    : 50;

  const score =
    ageScore * 0.25 +
    backlinkScore * 0.2 +
    refDomainsScore * 0.3 +
    qualityScore * 0.25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute Site Authority estimate
 * Similar to PageRank descendant signals
 */
function computeSiteAuthorityEstimate(input: LeakSignalInput): number {
  // Keyword count score (logarithmic)
  let keywordScore = 0;
  if (input.organicKeywordsCount) {
    keywordScore = Math.min(100, Math.log10(input.organicKeywordsCount + 1) * 25);
  }

  // Position score (average of top positions, inverse)
  let positionScore = 50;
  if (input.topKeywordPositions && input.topKeywordPositions.length > 0) {
    const avgPosition =
      input.topKeywordPositions.reduce((a, b) => a + b, 0) /
      input.topKeywordPositions.length;
    positionScore = Math.max(0, 100 - avgPosition * 2);
  }

  // Brand search score (logarithmic)
  let brandScore = 0;
  if (input.brandSearchVolume) {
    brandScore = Math.min(100, Math.log10(input.brandSearchVolume + 1) * 20);
  }

  // Combine with referring domains
  const refDomainsScore = input.referringDomainsCount
    ? Math.min(100, Math.log10(input.referringDomainsCount + 1) * 30)
    : 30;

  const score =
    keywordScore * 0.25 +
    positionScore * 0.3 +
    brandScore * 0.2 +
    refDomainsScore * 0.25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute NavBoost strength estimate
 * Based on Google leak user engagement signals
 */
function computeNavBoostStrengthEstimate(input: LeakSignalInput): number {
  // CTR score (10% CTR = excellent)
  const ctrScore = input.ctrAverage
    ? Math.min(100, (input.ctrAverage / 10) * 100)
    : 40;

  // Dwell time score (3 min = 180s for max)
  const dwellScore = input.dwellTimeAverage
    ? Math.min(100, (input.dwellTimeAverage / 180) * 100)
    : 40;

  // Pogo-sticking score (lower is better)
  const pogoScore = input.pogoStickingRate
    ? Math.max(0, 100 - input.pogoStickingRate * 2)
    : 60;

  // Return visit score
  const returnScore = input.returnVisitRate
    ? Math.min(100, input.returnVisitRate * 2)
    : 40;

  const score =
    ctrScore * 0.35 +
    dwellScore * 0.25 +
    pogoScore * 0.2 +
    returnScore * 0.2;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute Sandbox risk estimate
 * New site penalty likelihood
 */
function computeSandboxRiskEstimate(input: LeakSignalInput): number {
  // Domain age factor (< 6 months = high risk)
  const ageYears = input.domainAgeYears ?? 0;
  let ageRisk = 100;
  if (ageYears >= 2) {
    ageRisk = 10;
  } else if (ageYears >= 1) {
    ageRisk = 30;
  } else if (ageYears >= 0.5) {
    ageRisk = 60;
  }

  // Backlink velocity (too fast = suspicious)
  const backlinkScore = input.backlinksCount ?? 0;
  let velocityRisk = 30;
  if (ageYears < 1 && backlinkScore > 1000) {
    velocityRisk = 80;
  }

  // Trust signals reduce sandbox risk
  const trustReduction = Math.min(50, (input.highQualityBacklinksRatio ?? 0) * 50);

  const score = Math.max(0, (ageRisk * 0.5 + velocityRisk * 0.3) - trustReduction);

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute Spam risk estimate
 * Link/content spam signals
 */
function computeSpamRiskEstimate(input: LeakSignalInput): number {
  // Toxic backlinks ratio
  const toxicScore = input.toxicBacklinksRatio
    ? input.toxicBacklinksRatio * 100
    : 20;

  // Keyword stuffing
  const stuffingScore = input.keywordStuffingScore ?? 10;

  // Thin content ratio
  const thinScore = input.thinContentRatio
    ? input.thinContentRatio * 100
    : 15;

  const score =
    toxicScore * 0.4 +
    stuffingScore * 0.3 +
    thinScore * 0.3;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute E-E-A-T strength estimate
 * Experience, Expertise, Authoritativeness, Trustworthiness
 */
function computeEEATStrengthEstimate(input: LeakSignalInput): number {
  // Author expertise signals
  const expertiseScore = input.authorExpertiseSignals ?? 40;

  // Citations/references
  let citationScore = 30;
  if (input.citationsCount) {
    citationScore = Math.min(100, input.citationsCount * 5);
  }

  // Social proof
  let socialScore = 30;
  if (input.socialProofCount) {
    socialScore = Math.min(100, Math.log10(input.socialProofCount + 1) * 30);
  }

  // Professional credentials bonus
  const credentialBonus = input.professionalCredentials ? 20 : 0;

  const score =
    expertiseScore * 0.35 +
    citationScore * 0.25 +
    socialScore * 0.2 +
    credentialBonus;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute Topical Focus score
 * Topic authority concentration
 */
function computeTopicalFocusScore(input: LeakSignalInput): number {
  const topicConsistency = input.topicConsistencyScore ?? 50;
  const topicalDepth = input.topicalDepthScore ?? 50;
  const semanticCoverage = input.semanticCoverageScore ?? 50;

  const score =
    topicConsistency * 0.4 +
    topicalDepth * 0.35 +
    semanticCoverage * 0.25;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// =============================================================================
// Main Service Functions
// =============================================================================

/**
 * Compute leak-aligned signal profile for a domain
 *
 * @param businessId - Founder business ID
 * @param domain - Domain to profile
 * @param input - Optional input signals (if not provided, uses defaults/estimates)
 * @returns Computed profile result
 */
export async function computeLeakProfile(
  businessId: string,
  domain: string,
  input: LeakSignalInput = {}
): Promise<ComputeProfileResult> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return {
        success: false,
        error: 'SEO Leak Engine is disabled',
      };
    }

    const supabase = await getSupabaseServer();

    // Compute all leak-aligned scores
    const qStar = computeQStarEstimate(input);
    const pStar = computePStarEstimate(input);
    const tStar = computeTStarEstimate(input);
    const siteAuthority = computeSiteAuthorityEstimate(input);
    const navBoost = computeNavBoostStrengthEstimate(input);
    const sandboxRisk = computeSandboxRiskEstimate(input);
    const spamRisk = computeSpamRiskEstimate(input);
    const eeatStrength = computeEEATStrengthEstimate(input);
    const topicalFocus = computeTopicalFocusScore(input);

    // Upsert profile into database
    const { data, error } = await supabase
      .from('seo_leak_signal_profiles')
      .upsert(
        {
          founder_business_id: businessId,
          domain,
          q_star_estimate: qStar,
          p_star_estimate: pStar,
          t_star_estimate: tStar,
          site_authority_estimate: siteAuthority,
          navboost_strength_estimate: navBoost,
          sandbox_risk_estimate: sandboxRisk,
          spam_risk_estimate: spamRisk,
          eeat_strength_estimate: eeatStrength,
          topical_focus_score: topicalFocus,
          last_refreshed_at: new Date().toISOString(),
        },
        {
          onConflict: 'founder_business_id,domain',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[SEO Leak Engine] Failed to save profile:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return {
      success: true,
      profile: data as LeakSignalProfile,
    };
  } catch (err) {
    console.error('[SEO Leak Engine] Compute profile error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Refresh an existing profile with new data
 *
 * @param businessId - Founder business ID
 * @param domain - Domain to refresh
 * @param input - New input signals
 * @returns Updated profile result
 */
export async function refreshProfile(
  businessId: string,
  domain: string,
  input: LeakSignalInput = {}
): Promise<ComputeProfileResult> {
  return computeLeakProfile(businessId, domain, input);
}

/**
 * Get stored profile for a domain
 *
 * @param businessId - Founder business ID
 * @param domain - Domain to get profile for
 * @returns Profile or null if not found
 */
export async function getProfile(
  businessId: string,
  domain: string
): Promise<LeakSignalProfile | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('seo_leak_signal_profiles')
      .select('*')
      .eq('founder_business_id', businessId)
      .eq('domain', domain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('[SEO Leak Engine] Get profile error:', error);
      return null;
    }

    return data as LeakSignalProfile;
  } catch (err) {
    console.error('[SEO Leak Engine] Get profile error:', err);
    return null;
  }
}

/**
 * Get all profiles for a business
 *
 * @param businessId - Founder business ID
 * @returns Array of profiles
 */
export async function getBusinessProfiles(
  businessId: string
): Promise<LeakSignalProfile[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('seo_leak_signal_profiles')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('last_refreshed_at', { ascending: false });

    if (error) {
      console.error('[SEO Leak Engine] Get business profiles error:', error);
      return [];
    }

    return (data ?? []) as LeakSignalProfile[];
  } catch (err) {
    console.error('[SEO Leak Engine] Get business profiles error:', err);
    return [];
  }
}

/**
 * Delete a profile
 *
 * @param businessId - Founder business ID
 * @param domain - Domain to delete profile for
 * @returns Success status
 */
export async function deleteProfile(
  businessId: string,
  domain: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('seo_leak_signal_profiles')
      .delete()
      .eq('founder_business_id', businessId)
      .eq('domain', domain);

    if (error) {
      console.error('[SEO Leak Engine] Delete profile error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SEO Leak Engine] Delete profile error:', err);
    return false;
  }
}

/**
 * Analyze profile and generate insights
 *
 * @param profile - Profile to analyze
 * @returns Array of insights with recommendations
 */
export function analyzeProfile(profile: LeakSignalProfile): ProfileInsight[] {
  const insights: ProfileInsight[] = [];

  const getLevel = (score: number, invertForRisk = false): ProfileInsight['level'] => {
    const effective = invertForRisk ? 100 - score : score;
    if (effective < 20) return 'critical';
    if (effective < 40) return 'low';
    if (effective < 60) return 'medium';
    if (effective < 80) return 'high';
    return 'excellent';
  };

  // Q* Analysis
  insights.push({
    factor: 'Content Quality (Q*)',
    score: profile.q_star_estimate,
    level: getLevel(profile.q_star_estimate),
    recommendation:
      profile.q_star_estimate < 50
        ? 'Improve content depth, freshness, and uniqueness. Add comprehensive coverage of topics.'
        : profile.q_star_estimate < 75
        ? 'Content quality is moderate. Consider updating older content and adding more detail.'
        : 'Strong content quality. Maintain freshness with regular updates.',
  });

  // P* Analysis
  insights.push({
    factor: 'Popularity (P*)',
    score: profile.p_star_estimate,
    level: getLevel(profile.p_star_estimate),
    recommendation:
      profile.p_star_estimate < 50
        ? 'Focus on traffic growth through content marketing, social sharing, and link building.'
        : profile.p_star_estimate < 75
        ? 'Traffic is growing. Optimize engagement metrics like bounce rate and session duration.'
        : 'Strong popularity signals. Continue momentum with consistent publishing.',
  });

  // T* Analysis
  insights.push({
    factor: 'Trust (T*)',
    score: profile.t_star_estimate,
    level: getLevel(profile.t_star_estimate),
    recommendation:
      profile.t_star_estimate < 50
        ? 'Build trust through quality backlinks from authoritative domains. Focus on digital PR.'
        : profile.t_star_estimate < 75
        ? 'Trust signals are moderate. Diversify referring domains and improve backlink quality.'
        : 'Strong trust profile. Maintain and grow authoritative relationships.',
  });

  // Site Authority
  insights.push({
    factor: 'Site Authority',
    score: profile.site_authority_estimate,
    level: getLevel(profile.site_authority_estimate),
    recommendation:
      profile.site_authority_estimate < 50
        ? 'Build authority through consistent content, link building, and brand mentions.'
        : profile.site_authority_estimate < 75
        ? 'Authority is developing. Target more competitive keywords and build brand searches.'
        : 'Strong site authority. Leverage for competitive keyword targeting.',
  });

  // NavBoost
  insights.push({
    factor: 'User Engagement (NavBoost)',
    score: profile.navboost_strength_estimate,
    level: getLevel(profile.navboost_strength_estimate),
    recommendation:
      profile.navboost_strength_estimate < 50
        ? 'Improve CTR with compelling titles/descriptions. Reduce pogo-sticking with better content.'
        : profile.navboost_strength_estimate < 75
        ? 'Engagement is moderate. A/B test titles and improve on-page experience.'
        : 'Strong engagement signals. Users are satisfied with your content.',
  });

  // Sandbox Risk
  insights.push({
    factor: 'Sandbox Risk',
    score: profile.sandbox_risk_estimate,
    level: getLevel(profile.sandbox_risk_estimate, true),
    recommendation:
      profile.sandbox_risk_estimate > 60
        ? 'New domain penalty likely. Build natural links slowly and focus on quality content.'
        : profile.sandbox_risk_estimate > 30
        ? 'Moderate sandbox risk. Continue building trust signals naturally.'
        : 'Low sandbox risk. Domain has established trust.',
  });

  // Spam Risk
  insights.push({
    factor: 'Spam Risk',
    score: profile.spam_risk_estimate,
    level: getLevel(profile.spam_risk_estimate, true),
    recommendation:
      profile.spam_risk_estimate > 60
        ? 'High spam signals detected. Audit and disavow toxic backlinks. Review content quality.'
        : profile.spam_risk_estimate > 30
        ? 'Some spam signals present. Monitor backlink profile regularly.'
        : 'Clean profile with minimal spam signals.',
  });

  // E-E-A-T
  insights.push({
    factor: 'E-E-A-T Strength',
    score: profile.eeat_strength_estimate,
    level: getLevel(profile.eeat_strength_estimate),
    recommendation:
      profile.eeat_strength_estimate < 50
        ? 'Build E-E-A-T through author bios, credentials, citations, and social proof.'
        : profile.eeat_strength_estimate < 75
        ? 'E-E-A-T signals are developing. Add more expertise indicators and reviews.'
        : 'Strong E-E-A-T profile. Continue demonstrating expertise.',
  });

  // Topical Focus
  insights.push({
    factor: 'Topical Focus',
    score: profile.topical_focus_score,
    level: getLevel(profile.topical_focus_score),
    recommendation:
      profile.topical_focus_score < 50
        ? 'Improve topical authority by focusing content on core themes. Build topic clusters.'
        : profile.topical_focus_score < 75
        ? 'Topical coverage is moderate. Deepen coverage of primary topics.'
        : 'Strong topical authority. Well-positioned for topic-related queries.',
  });

  return insights;
}

/**
 * Calculate overall SEO health score from profile
 *
 * @param profile - Profile to score
 * @returns Weighted overall score 0-100
 */
export function calculateOverallScore(profile: LeakSignalProfile): number {
  const weights = getSeoFactorWeights();

  // Calculate weighted score
  const weightedScore =
    (profile.q_star_estimate * weights.q_star) / 100 +
    (profile.p_star_estimate * weights.p_star) / 100 +
    (profile.t_star_estimate * weights.t_star) / 100 +
    (profile.navboost_strength_estimate * weights.navboost) / 100 +
    (profile.eeat_strength_estimate * weights.eeat) / 100 +
    // Risk scores are inverted (lower is better)
    ((100 - profile.sandbox_risk_estimate) * weights.sandbox) / 100 +
    ((100 - profile.spam_risk_estimate) * weights.spam) / 100 +
    (profile.topical_focus_score * weights.topicality) / 100;

  return Math.round(weightedScore);
}

/**
 * Check if profile needs refresh based on configuration
 *
 * @param profile - Profile to check
 * @returns True if refresh is needed
 */
export function needsRefresh(profile: LeakSignalProfile): boolean {
  const lastRefreshed = new Date(profile.last_refreshed_at);
  const now = new Date();
  const hoursSinceRefresh = (now.getTime() - lastRefreshed.getTime()) / (1000 * 60 * 60);

  return hoursSinceRefresh >= SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_REFRESH_INTERVAL_HOURS;
}
