/**
 * Synthex Offer Engine
 *
 * Plan definitions, visual capabilities, model support, quotas,
 * pricing, industry presets, and offer tier management.
 */

// =============================================================
// Types
// =============================================================

export interface Plan {
  code: string;
  name: string;
  basePrice: number;
  jobsPerMonth: number;
  agentAccess: string[];
  visualCapabilities: VisualCapabilities;
}

export interface VisualCapabilities {
  graphicsPerMonth: number;
  videosPerMonth: number;
  brandKitsPerMonth: number;
  aiDesignerAccess: boolean;
  supportedModels: string[];
  videoFeatures: string[];
}

export interface OfferTier {
  code: string;
  discountPercentage: number;
  limit: number;
  description: string;
}

export interface IndustryPreset {
  industry: string;
  recommendedPlan: string;
  description: string;
}

// =============================================================
// Plan Definitions
// =============================================================

export const PLANS: Record<string, Plan> = {
  launch: {
    code: 'launch',
    name: 'Launch',
    basePrice: 49,
    jobsPerMonth: 8,
    agentAccess: ['content_agent', 'email_agent'],
    visualCapabilities: {
      graphicsPerMonth: 10,
      videosPerMonth: 2,
      brandKitsPerMonth: 1,
      aiDesignerAccess: false,
      supportedModels: ['gemini_3_pro', 'nano_banana_2'],
      videoFeatures: ['basic_editing', 'auto_captions'],
    },
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    basePrice: 129,
    jobsPerMonth: 25,
    agentAccess: ['content_agent', 'email_agent', 'seo_agent', 'social_agent'],
    visualCapabilities: {
      graphicsPerMonth: 50,
      videosPerMonth: 10,
      brandKitsPerMonth: 3,
      aiDesignerAccess: true,
      supportedModels: ['gemini_3_pro', 'nano_banana_2', 'dalle_3', 'veo3'],
      videoFeatures: ['basic_editing', 'auto_captions', 'transitions', 'effects', 'music_library'],
    },
  },
  scale: {
    code: 'scale',
    name: 'Scale',
    basePrice: 299,
    jobsPerMonth: -1, // Unlimited
    agentAccess: ['content_agent', 'email_agent', 'seo_agent', 'social_agent', 'business_brain'],
    visualCapabilities: {
      graphicsPerMonth: -1, // Unlimited
      videosPerMonth: -1,
      brandKitsPerMonth: -1,
      aiDesignerAccess: true,
      supportedModels: ['gemini_3_pro', 'nano_banana_2', 'dalle_3', 'veo3', 'imagen2'],
      videoFeatures: [
        'basic_editing', 'auto_captions', 'transitions', 'effects',
        'music_library', 'advanced_color_grading', 'custom_animations',
        'stock_footage_integration',
      ],
    },
  },
};

// =============================================================
// Offer Tiers
// =============================================================

export const OFFER_TIERS: Record<string, OfferTier> = {
  early_founders: {
    code: 'early_founders',
    discountPercentage: 50,
    limit: 50,
    description: 'Early Founders - 50% off for first 50 users',
  },
  growth_wave: {
    code: 'growth_wave',
    discountPercentage: 25,
    limit: 200,
    description: 'Growth Wave - 25% off for first 200 users',
  },
  standard: {
    code: 'standard',
    discountPercentage: 0,
    limit: -1, // Unlimited
    description: 'Standard pricing',
  },
};

// =============================================================
// Industry Presets
// =============================================================

const INDUSTRY_PRESETS: IndustryPreset[] = [
  { industry: 'trades', recommendedPlan: 'launch', description: 'Trades & Home Services' },
  { industry: 'professional_services', recommendedPlan: 'growth', description: 'Professional Services' },
  { industry: 'ecommerce', recommendedPlan: 'growth', description: 'E-Commerce' },
  { industry: 'saas', recommendedPlan: 'scale', description: 'SaaS & Technology' },
  { industry: 'agency', recommendedPlan: 'scale', description: 'Agencies & Consultancies' },
  { industry: 'healthcare', recommendedPlan: 'growth', description: 'Healthcare & Wellness' },
  { industry: 'hospitality', recommendedPlan: 'growth', description: 'Hospitality & Tourism' },
  { industry: 'education', recommendedPlan: 'launch', description: 'Education & Training' },
];

// =============================================================
// Plan Lookup Functions
// =============================================================

export function getPlan(code: string): Plan | null {
  return PLANS[code] || null;
}

export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

// =============================================================
// Visual Capability Functions
// =============================================================

export function getVisualCapabilities(planCode: string): VisualCapabilities | null {
  const plan = getPlan(planCode);
  if (!plan) return null;
  return plan.visualCapabilities;
}

export function supportsVisualModel(planCode: string, modelId: string): boolean {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return false;
  return caps.supportedModels.includes(modelId);
}

// =============================================================
// Quota Functions
// =============================================================

export function getGraphicsQuota(planCode: string): number {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return 0;
  return caps.graphicsPerMonth;
}

export function getVideoQuota(planCode: string): number {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return 0;
  return caps.videosPerMonth;
}

export function getBrandKitQuota(planCode: string): number {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return 0;
  return caps.brandKitsPerMonth;
}

export function hasAIDesignerAccess(planCode: string): boolean {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return false;
  return caps.aiDesignerAccess;
}

export function getVideoFeatures(planCode: string): string[] {
  const caps = getVisualCapabilities(planCode);
  if (!caps) return [];
  return caps.videoFeatures;
}

// =============================================================
// Price Formatting
// =============================================================

export function formatPrice(amount: number, currency: string = 'AUD'): string {
  return `$${amount.toFixed(2)} ${currency}/month`;
}

// =============================================================
// Validation
// =============================================================

export function isValidPlanOfferCombination(planCode: string, offerCode: string): boolean {
  const plan = getPlan(planCode);
  if (!plan) return false;
  const offer = OFFER_TIERS[offerCode];
  if (!offer) return false;
  return true;
}

// =============================================================
// Industry Presets
// =============================================================

export function getIndustryPreset(industry: string): IndustryPreset | null {
  return INDUSTRY_PRESETS.find(p => p.industry === industry) || null;
}

export function getAllIndustries(): IndustryPreset[] {
  return [...INDUSTRY_PRESETS];
}

export function getRecommendedPlanForIndustry(industry: string): Plan | null {
  const preset = getIndustryPreset(industry);
  if (!preset) return null;
  return getPlan(preset.recommendedPlan);
}

// =============================================================
// Visual Generation Summary
// =============================================================

export function getVisualGenerationSummary(): Array<{
  planCode: string;
  graphicsPerMonth: number;
  videosPerMonth: number;
  brandKitsPerMonth: number;
  aiDesignerAccess: boolean;
  supportedModels: string[];
}> {
  return getAllPlans().map(plan => ({
    planCode: plan.code,
    graphicsPerMonth: plan.visualCapabilities.graphicsPerMonth,
    videosPerMonth: plan.visualCapabilities.videosPerMonth,
    brandKitsPerMonth: plan.visualCapabilities.brandKitsPerMonth,
    aiDesignerAccess: plan.visualCapabilities.aiDesignerAccess,
    supportedModels: plan.visualCapabilities.supportedModels,
  }));
}
