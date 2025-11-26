/**
 * Synthex Offer Engine
 *
 * Manages pricing, discount tiers, and offer availability for the Synthex SaaS platform.
 * Implements:
 * - Early Founders 50% Off (limited to 50 slots)
 * - Growth Wave 25% Off (limited to 200 slots)
 * - Standard Full Price (unlimited)
 *
 * Integrates with synthex_offer_counters table to track usage and enforce limits.
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export interface Plan {
  code: string;
  name: string;
  description: string;
  basePrice: number; // Monthly price in AUD
  features: string[];
  idealFor: string;
  jobsPerMonth: number;
  agentAccess: string[];
}

export const PLANS: Record<string, Plan> = {
  launch: {
    code: 'launch',
    name: 'Launch',
    description: 'Perfect for getting started with AI automation',
    basePrice: 49,
    features: [
      '2 brands/domains',
      '8 AI jobs per month',
      'Content generation',
      'Basic SEO research',
      'Email sequences',
      'Community support',
    ],
    idealFor: 'Small businesses, startups',
    jobsPerMonth: 8,
    agentAccess: ['content_agent', 'research_agent'],
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    description: 'Scale your content and marketing',
    basePrice: 129,
    features: [
      '5 brands/domains',
      '25 AI jobs per month',
      'Content generation (priority)',
      'Advanced SEO research',
      'Email campaigns',
      'Social media management',
      'Basic analytics',
      'Priority support',
    ],
    idealFor: 'Growing agencies, established businesses',
    jobsPerMonth: 25,
    agentAccess: ['content_agent', 'research_agent', 'analysis_agent', 'coordination_agent'],
  },
  scale: {
    code: 'scale',
    name: 'Scale',
    description: 'Enterprise-grade AI marketing automation',
    basePrice: 299,
    features: [
      'Unlimited brands/domains',
      'Unlimited AI jobs per month',
      'All content generation types',
      'Advanced analytics & reporting',
      'Custom integrations',
      'Team management (up to 5)',
      'Dedicated account manager',
      '24/7 priority support',
      'Advanced AGI optimization',
    ],
    idealFor: 'Agencies, enterprises, high-volume users',
    jobsPerMonth: -1, // Unlimited
    agentAccess: [
      'content_agent',
      'research_agent',
      'analysis_agent',
      'coordination_agent',
      'business_brain',
      'parallel_phill',
    ],
  },
};

// ============================================================================
// OFFER TIER DEFINITIONS
// ============================================================================

export interface OfferTier {
  code: string;
  label: string;
  discountPercentage: number;
  limit: number; // -1 = unlimited
  counterKey: string;
  description: string;
  available: boolean; // Set by getCurrentOfferTier()
}

export const OFFER_TIERS: Record<string, OfferTier> = {
  early_founders: {
    code: 'early_founders',
    label: 'Early Founders 50% Off',
    discountPercentage: 50,
    limit: 50,
    counterKey: 'early_founders_50',
    description: 'Limited to first 50 signups - 50% lifetime discount',
    available: false,
  },
  growth_wave: {
    code: 'growth_wave',
    label: 'Growth Wave 25% Off',
    discountPercentage: 25,
    limit: 200,
    counterKey: 'growth_wave_25',
    description: 'Limited to first 200 signups - 25% first year discount',
    available: false,
  },
  standard: {
    code: 'standard',
    label: 'Standard Pricing',
    discountPercentage: 0,
    limit: -1,
    counterKey: 'standard_full',
    description: 'Full price, no discount',
    available: true,
  },
};

// ============================================================================
// INDUSTRY PRESETS
// ============================================================================

export interface IndustryPreset {
  industry: string;
  label: string;
  description: string;
  suggestedPlan: string; // Default plan for this industry
  contentFocus: string[]; // Types of content this industry benefits from
  seoKeywords: string[]; // Sample keywords
  socialPlatforms: string[]; // Recommended platforms
}

export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  trades: {
    industry: 'trades',
    label: 'Trades & Contracting',
    description: 'Plumbing, electrical, construction, HVAC',
    suggestedPlan: 'launch',
    contentFocus: ['service_pages', 'before_after', 'testimonials', 'how_to_guides'],
    seoKeywords: ['[service] near me', '[service] [suburb]', '[service] emergency'],
    socialPlatforms: ['instagram', 'facebook', 'youtube'],
  },
  restoration: {
    industry: 'restoration',
    label: 'Restoration & Cleaning',
    description: 'Water damage, fire restoration, carpet cleaning, upholstery',
    suggestedPlan: 'launch',
    contentFocus: ['emergency_response', 'process_explanation', 'case_studies', 'before_after'],
    seoKeywords: ['[service] [suburb]', 'emergency [service]', '[service] specialist'],
    socialPlatforms: ['facebook', 'instagram', 'google_business'],
  },
  non_profit: {
    industry: 'non_profit',
    label: 'Non-Profits & Charities',
    description: 'Community organizations, charities, social enterprises',
    suggestedPlan: 'launch',
    contentFocus: ['impact_stories', 'volunteer_recruitment', 'donation_campaigns', 'education'],
    seoKeywords: ['[cause] [location]', 'volunteer [cause]', 'donate to [nonprofit]'],
    socialPlatforms: ['facebook', 'instagram', 'linkedin', 'youtube'],
  },
  retail: {
    industry: 'retail',
    label: 'Retail & E-Commerce',
    description: 'Shops, boutiques, online stores',
    suggestedPlan: 'growth',
    contentFocus: ['product_showcases', 'seasonal_campaigns', 'style_guides', 'customer_features'],
    seoKeywords: ['[product] online', '[product] [location]', 'buy [product]'],
    socialPlatforms: ['instagram', 'facebook', 'tiktok', 'pinterest'],
  },
  services: {
    industry: 'services',
    label: 'Professional Services',
    description: 'Consulting, accounting, law, marketing, design',
    suggestedPlan: 'growth',
    contentFocus: ['thought_leadership', 'case_studies', 'industry_insights', 'guides'],
    seoKeywords: ['[service] consultant', '[expertise] advice', '[industry] trends'],
    socialPlatforms: ['linkedin', 'facebook', 'youtube'],
  },
  education: {
    industry: 'education',
    label: 'Education & Training',
    description: 'Schools, tutoring, online courses, coaching',
    suggestedPlan: 'growth',
    contentFocus: ['course_overviews', 'student_success_stories', 'educational_content', 'faq'],
    seoKeywords: ['[course] online', 'learn [skill]', '[subject] tutor [location]'],
    socialPlatforms: ['youtube', 'facebook', 'instagram', 'tiktok'],
  },
  health: {
    industry: 'health',
    label: 'Health & Wellness',
    description: 'Medical practices, fitness, wellness, alternative therapy',
    suggestedPlan: 'growth',
    contentFocus: ['health_education', 'patient_testimonials', 'service_education', 'wellness_tips'],
    seoKeywords: ['[service] [location]', '[condition] treatment', '[treatment] specialist'],
    socialPlatforms: ['facebook', 'instagram', 'youtube'],
  },
  other: {
    industry: 'other',
    label: 'Other',
    description: 'Custom industry',
    suggestedPlan: 'launch',
    contentFocus: ['general_marketing', 'brand_awareness', 'customer_education'],
    seoKeywords: ['[business] [location]', '[service] [location]'],
    socialPlatforms: ['facebook', 'instagram', 'linkedin'],
  },
};

// ============================================================================
// PRICING CALCULATION
// ============================================================================

/**
 * Calculate effective monthly price for a tenant
 * Returns price in AUD after discount applied
 */
export async function calculateEffectivePrice(
  planCode: string,
  offerTier: string = 'standard'
): Promise<{
  basePrice: number;
  discountPercentage: number;
  effectivePrice: number;
  offerLabel: string;
}> {
  const plan = PLANS[planCode];
  const offer = OFFER_TIERS[offerTier];

  if (!plan) {
    throw new Error(`Plan not found: ${planCode}`);
  }

  if (!offer) {
    throw new Error(`Offer tier not found: ${offerTier}`);
  }

  const discountAmount = plan.basePrice * (offer.discountPercentage / 100);
  const effectivePrice = plan.basePrice - discountAmount;

  return {
    basePrice: plan.basePrice,
    discountPercentage: offer.discountPercentage,
    effectivePrice: Math.round(effectivePrice * 100) / 100, // Round to 2 decimals
    offerLabel: offer.label,
  };
}

// ============================================================================
// OFFER TIER AVAILABILITY
// ============================================================================

/**
 * Get current available offer tier based on usage
 * Returns the best available tier (early_founders > growth_wave > standard)
 */
export async function getCurrentOfferTier(): Promise<{
  tier: string;
  label: string;
  available: boolean;
  remaining: number; // Slots remaining (-1 if unlimited)
}> {
  const { data: counters, error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('counter_key, label, tier, limit_count, consumed')
    .order('tier', { ascending: false }); // Order: early_founders, growth_wave, standard

  if (error || !counters) {
    console.error('Error fetching offer counters:', error);
    return {
      tier: 'standard',
      label: 'Standard Pricing',
      available: true,
      remaining: -1,
    };
  }

  // Find best available tier
  for (const counter of counters) {
    const available = counter.limit_count === -1 || counter.consumed < counter.limit_count;
    if (available) {
      return {
        tier: counter.tier,
        label: counter.label,
        available: true,
        remaining: counter.limit_count === -1 ? -1 : counter.limit_count - counter.consumed,
      };
    }
  }

  // Fallback to standard
  return {
    tier: 'standard',
    label: 'Standard Pricing',
    available: true,
    remaining: -1,
  };
}

/**
 * Check if a specific offer tier is still available
 */
export async function isOfferAvailable(offerTier: string): Promise<boolean> {
  const offer = OFFER_TIERS[offerTier];
  if (!offer) return false;

  if (offer.limit === -1) return true; // Unlimited

  const { data: counter, error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('limit_count, consumed')
    .eq('counter_key', offer.counterKey)
    .single();

  if (error || !counter) return false;

  return counter.consumed < counter.limit_count;
}

/**
 * Consume an offer slot (increment counter)
 */
export async function consumeOfferSlot(offerTier: string): Promise<boolean> {
  const offer = OFFER_TIERS[offerTier];
  if (!offer) return false;

  if (offer.limit === -1) return true; // Unlimited, no need to increment

  const { data: currentCounter } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('consumed, limit_count')
    .eq('counter_key', offer.counterKey)
    .single();

  if (!currentCounter || currentCounter.consumed >= currentCounter.limit_count) {
    return false; // No slots remaining
  }

  const { error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .update({
      consumed: currentCounter.consumed + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('counter_key', offer.counterKey);

  return !error;
}

// ============================================================================
// PLAN INFORMATION
// ============================================================================

/**
 * Get plan details
 */
export function getPlan(planCode: string): Plan | null {
  return PLANS[planCode] || null;
}

/**
 * Get all plans
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Get industry preset
 */
export function getIndustryPreset(industry: string): IndustryPreset | null {
  return INDUSTRY_PRESETS[industry] || null;
}

/**
 * Get all industries
 */
export function getAllIndustries(): IndustryPreset[] {
  return Object.values(INDUSTRY_PRESETS);
}

/**
 * Get recommended plan for industry
 */
export function getRecommendedPlanForIndustry(industry: string): Plan | null {
  const preset = INDUSTRY_PRESETS[industry];
  if (!preset) return null;
  return PLANS[preset.suggestedPlan] || null;
}

// ============================================================================
// PRICING DISPLAY
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'AUD'): string {
  return `$${price.toFixed(2)} ${currency}/month`;
}

/**
 * Get pricing summary for all plans with current best offer
 */
export async function getPricingSummary(): Promise<
  Array<{
    planCode: string;
    planName: string;
    basePrice: number;
    bestOfferPrice: number;
    bestOfferDiscount: number;
    bestOfferLabel: string;
  }>
> {
  const { tier: bestOfferTier } = await getCurrentOfferTier();

  const summary = [];
  for (const [code, plan] of Object.entries(PLANS)) {
    const pricing = await calculateEffectivePrice(code, bestOfferTier);
    summary.push({
      planCode: code,
      planName: plan.name,
      basePrice: pricing.basePrice,
      bestOfferPrice: pricing.effectivePrice,
      bestOfferDiscount: pricing.discountPercentage,
      bestOfferLabel: pricing.offerLabel,
    });
  }

  return summary;
}

// ============================================================================
// OFFER DISPLAY FOR UI
// ============================================================================

/**
 * Get offer banner data for UI display
 */
export async function getOfferBanner(): Promise<{
  show: boolean;
  tier: string;
  label: string;
  discountPercentage: number;
  remaining: number;
  message: string;
} | null> {
  const current = await getCurrentOfferTier();

  if (current.tier === 'standard') {
    return null; // No special offer to show
  }

  const offer = OFFER_TIERS[current.tier];
  let message = '';

  if (current.tier === 'early_founders') {
    message = `Limited to first 50 founders - Only ${current.remaining} slots remaining!`;
  } else if (current.tier === 'growth_wave') {
    message = `Early growth wave offer - ${current.remaining} slots available`;
  }

  return {
    show: true,
    tier: current.tier,
    label: offer.label,
    discountPercentage: offer.discountPercentage,
    remaining: current.remaining,
    message,
  };
}

// ============================================================================
// VALIDATION & HELPERS
// ============================================================================

/**
 * Validate plan and offer combination
 */
export function isValidPlanOfferCombination(planCode: string, offerTier: string): boolean {
  return !!PLANS[planCode] && !!OFFER_TIERS[offerTier];
}

/**
 * Calculate annual savings with discount
 */
export async function calculateAnnualSavings(
  planCode: string,
  offerTier: string = 'standard'
): Promise<{
  monthlyBase: number;
  monthlyWithOffer: number;
  yearlySavings: number;
}> {
  const pricing = await calculateEffectivePrice(planCode, offerTier);

  const monthlyBase = pricing.basePrice;
  const monthlyWithOffer = pricing.effectivePrice;
  const yearlySavings = (monthlyBase - monthlyWithOffer) * 12;

  return {
    monthlyBase,
    monthlyWithOffer,
    yearlySavings: Math.round(yearlySavings * 100) / 100,
  };
}

/**
 * Get offer stats for analytics
 */
export async function getOfferStats(): Promise<{
  earlyFoundersConsumed: number;
  earlyFoundersRemaining: number;
  growthWaveConsumed: number;
  growthWaveRemaining: number;
  standardConsumed: number;
}> {
  const { data: counters } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('tier, consumed, limit_count');

  const stats = {
    earlyFoundersConsumed: 0,
    earlyFoundersRemaining: 0,
    growthWaveConsumed: 0,
    growthWaveRemaining: 0,
    standardConsumed: 0,
  };

  if (counters) {
    for (const counter of counters) {
      if (counter.tier === 'early_founders') {
        stats.earlyFoundersConsumed = counter.consumed;
        stats.earlyFoundersRemaining = counter.limit_count - counter.consumed;
      } else if (counter.tier === 'growth_wave') {
        stats.growthWaveConsumed = counter.consumed;
        stats.growthWaveRemaining = counter.limit_count - counter.consumed;
      } else if (counter.tier === 'standard') {
        stats.standardConsumed = counter.consumed;
      }
    }
  }

  return stats;
}
