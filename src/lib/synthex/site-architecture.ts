/**
 * Synthex Site Architecture
 *
 * TypeScript interface and loader for the site architecture configuration
 * Provides type-safe access to SEO/GEO metrics, page definitions, and content requirements
 */

// Note: JSON is embedded directly to avoid module resolution issues
// The source JSON is maintained in site-architecture.json for reference

// ============================================================================
// Type Definitions
// ============================================================================

export interface Brand {
  name: string;
  tagline: string;
  domain: string;
  primary_colour: string;
  secondary_colour?: string;
  accent_colour?: string;
  grey_base?: string;
  target_audience: string;
  age_range: string;
  positioning: string;
}

export interface CoreWebVitals {
  lcp_target_ms: number;
  fid_target_ms: number;
  cls_target: number;
}

export interface ContentMetrics {
  min_word_count_landing: number;
  min_word_count_pillar: number;
  min_word_count_subpillar: number;
  target_readability_score: number;
  target_keyword_density_percent: number;
  max_keyword_density_percent: number;
}

export interface GlobalSEOMetrics {
  target_domain_authority: number;
  target_page_authority: number;
  target_trust_flow: number;
  target_citation_flow: number;
  core_web_vitals: CoreWebVitals;
  content_metrics: ContentMetrics;
}

export interface TargetRegion {
  name: string;
  state: string;
  priority: number;
}

export interface LocalSEORequirements {
  google_business_profile: boolean;
  nap_consistency: boolean;
  local_schema_markup: boolean;
  location_pages: boolean;
  local_backlinks_target: number;
}

export interface GEOMetrics {
  primary_market: string;
  target_regions: TargetRegion[];
  local_seo_requirements: LocalSEORequirements;
}

export interface ProofPoint {
  value: string;
  label: string;
  context: string;
}

export interface LandingPage {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  word_count_target: number;
  cta_primary: string;
  cta_secondary: string;
  sections: string[];
  schema_types?: string[];
  proof_points?: ProofPoint[];
}

export interface PillarPage {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  subpillar_pages: string[];
  schema_types: string[];
  internal_links_required: number;
  external_authority_links: number;
}

export interface SubpillarPage {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  word_count_target: number;
  parent_pillar: string;
  schema_types: string[];
  faq_questions: string[];
  location_variants: string[];
}

export interface ServicePage {
  id: string;
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  primary_keyword: string;
  word_count_target: number;
  schema_types: string[];
}

export interface LocationTemplate {
  url_pattern: string;
  title_pattern: string;
  h1_pattern: string;
  meta_description_pattern: string;
  word_count_target: number;
  schema_types: string[];
  unique_content_requirements: string[];
}

export interface PriorityLocation {
  city: string;
  suburbs: string[];
}

export interface Testimonial {
  quote: string;
  name: string;
  business: string;
  location: string;
  industry: string;
  metric: string;
  verified: boolean;
}

export interface SiteArchitecture {
  schema_version: string;
  last_updated: string;
  description: string;
  brands: {
    unite_hub: Brand;
    synthex: Brand;
  };
  global_seo_metrics: GlobalSEOMetrics;
  geo_metrics: GEOMetrics;
  testimonials: {
    synthex: Testimonial[];
  };
}

// ============================================================================
// Loaded Configuration
// ============================================================================

export const SITE_ARCHITECTURE: SiteArchitecture = {
  schema_version: '1.0.0',
  last_updated: '2024-12-04',
  description: 'Complete site architecture for Unite-Hub and Synthex with SEO/GEO metrics, Mysia Strategy Engine, and content optimization',
  brands: {
    unite_hub: {
      name: 'Unite-Hub',
      tagline: 'Marketing for Australian Trade Businesses',
      domain: 'unite-hub.com.au',
      primary_colour: '#3b9ba8',
      secondary_colour: '#2563ab',
      accent_colour: '#f39c12',
      target_audience: 'Australian trade businesses (plumbers, electricians, builders, HVAC)',
      age_range: '35-55',
      positioning: 'Full-service marketing agency for trades',
    },
    synthex: {
      name: 'Synthex',
      tagline: 'Marketing that works while you work',
      domain: 'synthex.com.au',
      primary_colour: '#ea580c',
      grey_base: '#0a0a0b',
      target_audience: 'Australian SMB owners across all industries',
      age_range: '35-55',
      positioning: 'Autonomous marketing agent - no meetings, no calls, just results',
    },
  },
  global_seo_metrics: {
    target_domain_authority: 40,
    target_page_authority: 35,
    target_trust_flow: 25,
    target_citation_flow: 30,
    core_web_vitals: {
      lcp_target_ms: 2500,
      fid_target_ms: 100,
      cls_target: 0.1,
    },
    content_metrics: {
      min_word_count_landing: 800,
      min_word_count_pillar: 2500,
      min_word_count_subpillar: 1500,
      target_readability_score: 65,
      target_keyword_density_percent: 1.5,
      max_keyword_density_percent: 2.5,
    },
  },
  geo_metrics: {
    primary_market: 'Australia',
    target_regions: [
      { name: 'Brisbane', state: 'QLD', priority: 1 },
      { name: 'Sydney', state: 'NSW', priority: 2 },
      { name: 'Melbourne', state: 'VIC', priority: 3 },
      { name: 'Perth', state: 'WA', priority: 4 },
      { name: 'Adelaide', state: 'SA', priority: 5 },
      { name: 'Gold Coast', state: 'QLD', priority: 6 },
      { name: 'Canberra', state: 'ACT', priority: 7 },
      { name: 'Hobart', state: 'TAS', priority: 8 },
    ],
    local_seo_requirements: {
      google_business_profile: true,
      nap_consistency: true,
      local_schema_markup: true,
      location_pages: true,
      local_backlinks_target: 20,
    },
  },
  testimonials: {
    synthex: [
      {
        quote: 'Set it up, forgot about it, and started getting more calls within weeks. No meetings, no back-and-forth—it just works.',
        name: 'John Mitchell',
        business: 'Mitchell Plumbing',
        location: 'Brisbane',
        industry: 'Trades',
        metric: '67% more enquiries',
        verified: true,
      },
      {
        quote: 'This runs completely on autopilot. Our enquiries doubled and I never had to sit through a single marketing meeting.',
        name: 'Sarah Parker',
        business: 'Parker & Co Accounting',
        location: 'Melbourne',
        industry: 'Professional Services',
        metric: 'Page 1 rankings in 3 months',
        verified: true,
      },
      {
        quote: "As a dentist, I have zero time for marketing. Now it's all handled automatically—I never have to think about it.",
        name: 'Dr. Lisa Chen',
        business: 'Serenity Dental',
        location: 'Sydney',
        industry: 'Health & Wellness',
        metric: '45 new patients per month',
        verified: true,
      },
      {
        quote: "We used to stress about social media and Google reviews. Now it's all handled automatically and our bookings are up 35%.",
        name: 'Marco Rossi',
        business: 'Brew & Co Cafe',
        location: 'Perth',
        industry: 'Hospitality',
        metric: '35% increase in bookings',
        verified: true,
      },
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get brand configuration by key
 */
export function getBrand(brandKey: 'unite_hub' | 'synthex'): Brand {
  return SITE_ARCHITECTURE.brands[brandKey];
}

/**
 * Get all target regions sorted by priority
 */
export function getTargetRegions(): TargetRegion[] {
  return [...SITE_ARCHITECTURE.geo_metrics.target_regions].sort(
    (a, b) => a.priority - b.priority
  );
}

/**
 * Get SEO content requirements for a page type
 */
export function getContentRequirements(
  pageType: 'landing' | 'pillar' | 'subpillar'
): { minWordCount: number; readabilityScore: number; keywordDensity: { min: number; max: number } } {
  const metrics = SITE_ARCHITECTURE.global_seo_metrics.content_metrics;

  const wordCountKey = `min_word_count_${pageType}` as keyof ContentMetrics;

  return {
    minWordCount: metrics[wordCountKey] as number,
    readabilityScore: metrics.target_readability_score,
    keywordDensity: {
      min: metrics.target_keyword_density_percent,
      max: metrics.max_keyword_density_percent,
    },
  };
}

/**
 * Get Core Web Vitals targets
 */
export function getCoreWebVitalsTargets(): CoreWebVitals {
  return SITE_ARCHITECTURE.global_seo_metrics.core_web_vitals;
}

/**
 * Get testimonials for a specific industry
 */
export function getTestimonialsByIndustry(industry: string): Testimonial[] {
  return SITE_ARCHITECTURE.testimonials.synthex.filter(
    (t) => t.industry.toLowerCase() === industry.toLowerCase()
  );
}

/**
 * Get all verified testimonials
 */
export function getVerifiedTestimonials(): Testimonial[] {
  return SITE_ARCHITECTURE.testimonials.synthex.filter((t) => t.verified);
}

/**
 * Check if a page meets SEO requirements
 */
export function validatePageSEO(page: {
  wordCount: number;
  keywordDensity: number;
  hasSchema: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const metrics = SITE_ARCHITECTURE.global_seo_metrics.content_metrics;

  if (page.wordCount < metrics.min_word_count_landing) {
    issues.push(`Word count ${page.wordCount} below minimum ${metrics.min_word_count_landing}`);
  }

  if (page.keywordDensity < metrics.target_keyword_density_percent) {
    issues.push(`Keyword density ${page.keywordDensity}% below target ${metrics.target_keyword_density_percent}%`);
  }

  if (page.keywordDensity > metrics.max_keyword_density_percent) {
    issues.push(`Keyword density ${page.keywordDensity}% exceeds max ${metrics.max_keyword_density_percent}%`);
  }

  if (!page.hasSchema) {
    issues.push('Missing schema markup');
  }

  if (!page.hasMetaDescription) {
    issues.push('Missing meta description');
  }

  if (page.metaDescriptionLength > 160) {
    issues.push(`Meta description ${page.metaDescriptionLength} chars exceeds 160 limit`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get local SEO requirements checklist
 */
export function getLocalSEOChecklist(): { item: string; required: boolean }[] {
  const reqs = SITE_ARCHITECTURE.geo_metrics.local_seo_requirements;

  return [
    { item: 'Google Business Profile claimed and optimized', required: reqs.google_business_profile },
    { item: 'NAP (Name, Address, Phone) consistency across web', required: reqs.nap_consistency },
    { item: 'Local schema markup (LocalBusiness, etc.)', required: reqs.local_schema_markup },
    { item: 'Location-specific landing pages', required: reqs.location_pages },
    { item: `At least ${reqs.local_backlinks_target} local backlinks`, required: true },
  ];
}

// ============================================================================
// Exports
// ============================================================================

export default SITE_ARCHITECTURE;
