/**
 * Industry Funnel Templates
 * Phase 59: Honest, industry-specific marketing funnels
 */

export type Industry = 'restoration' | 'trades' | 'local_services' | 'consulting';

export interface IndustryFunnel {
  industry: Industry;
  name: string;
  headline: string;
  subheadline: string;
  value_props: string[];
  realistic_expectations: string[];
  timeline_messaging: string;
  cta_text: string;
  testimonial_guidelines: string;
  forbidden_claims: string[];
}

// Industry-specific funnel templates with honest messaging
export const INDUSTRY_FUNNELS: Record<Industry, IndustryFunnel> = {
  restoration: {
    industry: 'restoration',
    name: 'Restoration & Emergency Services',
    headline: 'Build Lasting Adjuster Relationships',
    subheadline: 'A systematic approach to becoming the trusted restoration partner',
    value_props: [
      'Consistent follow-up system for adjuster relationships',
      'Professional content that reinforces credibility',
      'Visibility when adjusters search for restoration partners',
      'Track record documentation for referral conversations',
    ],
    realistic_expectations: [
      'Adjuster relationships take months to develop',
      'Consistency over 90+ days builds recognition',
      'Results depend on your follow-through effort',
      'No shortcuts to becoming the go-to contractor',
    ],
    timeline_messaging: 'Building adjuster trust takes time. Our 90-day activation program helps you show up consistently—but the relationships are yours to nurture.',
    cta_text: 'Start Your 14-Day Guided Trial',
    testimonial_guidelines: 'Only use verified case studies from actual clients. Show time invested, not just results.',
    forbidden_claims: [
      'Guaranteed adjuster referrals',
      'Instant insurance leads',
      'Dominate your market in 30 days',
      'Get more jobs while you sleep',
    ],
  },

  trades: {
    industry: 'trades',
    name: 'Trades & Construction',
    headline: 'Build Your Trade Business Online Presence',
    subheadline: 'Consistent visibility for quality tradies who do great work',
    value_props: [
      'Google Business Profile optimization system',
      'Review generation reminders (you still ask)',
      'Professional portfolio content creation',
      'Local search visibility improvement',
    ],
    realistic_expectations: [
      'Local SEO improvements take 60-90 days',
      'Reviews come from asking satisfied customers',
      'Quality work is still your best marketing',
      'Consistency beats sporadic big efforts',
    ],
    timeline_messaging: 'Local visibility builds gradually. Expect 60-90 days before meaningful search improvements. We help you stay consistent—your quality work does the rest.',
    cta_text: 'Start Your 14-Day Guided Trial',
    testimonial_guidelines: 'Show the time investment required. Highlight consistency, not overnight success.',
    forbidden_claims: [
      'Rank #1 on Google guaranteed',
      '10x your leads instantly',
      'Automated success without effort',
      'Crush your competition',
    ],
  },

  local_services: {
    industry: 'local_services',
    name: 'Local Service Businesses',
    headline: 'Get Found by Local Customers',
    subheadline: 'Systematic local marketing for service businesses',
    value_props: [
      'Local search optimization guidance',
      'Content calendar for consistent posting',
      'Review management system',
      'Social media presence building',
    ],
    realistic_expectations: [
      'Local SEO takes 90+ days for results',
      'Social growth requires consistent posting',
      'Your service quality drives word of mouth',
      'No magic button for instant customers',
    ],
    timeline_messaging: 'Building local visibility is a marathon, not a sprint. Our 90-day program keeps you consistent. Expect gradual improvement, not overnight success.',
    cta_text: 'Start Your 14-Day Guided Trial',
    testimonial_guidelines: 'Emphasize the work involved. Show timeline from start to meaningful results.',
    forbidden_claims: [
      'Instant local dominance',
      'Guaranteed page one rankings',
      'Customers while you sleep',
      'No effort required',
    ],
  },

  consulting: {
    industry: 'consulting',
    name: 'Professional Consulting',
    headline: 'Establish Your Consulting Authority',
    subheadline: 'Systematic content building for thought leadership',
    value_props: [
      'LinkedIn content strategy',
      'Thought leadership article generation',
      'Professional profile optimization',
      'Consistent expert positioning',
    ],
    realistic_expectations: [
      'Thought leadership builds over 6+ months',
      'Content quality requires your expertise input',
      'Network growth comes from genuine engagement',
      'Authority is earned through consistent value',
    ],
    timeline_messaging: 'Establishing consulting authority takes consistent effort over months. We help you stay visible—your expertise and engagement build your reputation.',
    cta_text: 'Start Your 14-Day Guided Trial',
    testimonial_guidelines: 'Show the long-term commitment. Highlight consistency and genuine expertise.',
    forbidden_claims: [
      'Instant thought leader status',
      'Viral content guaranteed',
      '6-figure clients in 30 days',
      'Automated authority building',
    ],
  },
};

/**
 * Get funnel template for industry
 */
export function getIndustryFunnel(industry: Industry): IndustryFunnel {
  return INDUSTRY_FUNNELS[industry];
}

/**
 * Generate landing page content for industry
 */
export function generateLandingContent(industry: Industry): {
  hero: { headline: string; subheadline: string; cta: string };
  value_props: string[];
  timeline: string;
  expectations: string[];
} {
  const funnel = INDUSTRY_FUNNELS[industry];

  return {
    hero: {
      headline: funnel.headline,
      subheadline: funnel.subheadline,
      cta: funnel.cta_text,
    },
    value_props: funnel.value_props,
    timeline: funnel.timeline_messaging,
    expectations: funnel.realistic_expectations,
  };
}

/**
 * Validate content against forbidden claims
 */
export function validateContent(
  industry: Industry,
  content: string
): { valid: boolean; violations: string[] } {
  const funnel = INDUSTRY_FUNNELS[industry];
  const violations: string[] = [];

  const lowerContent = content.toLowerCase();

  for (const claim of funnel.forbidden_claims) {
    if (lowerContent.includes(claim.toLowerCase())) {
      violations.push(`Forbidden claim detected: "${claim}"`);
    }
  }

  // Check for common hype patterns
  const hypePatterns = [
    /\bguaranteed?\b/i,
    /\binstant(ly)?\b/i,
    /\bovernight\b/i,
    /\b\d+x\s+(growth|return|leads)/i,
    /\bno effort\b/i,
    /\bwhile you sleep\b/i,
    /\bdominate\b/i,
    /\bexplode\b/i,
    /\bskyrocket\b/i,
  ];

  for (const pattern of hypePatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      violations.push(`Hype language detected: "${match?.[0]}"`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Get recommended content cadence for industry
 */
export function getContentCadence(industry: Industry): {
  weekly_posts: number;
  monthly_articles: number;
  platform_focus: string[];
} {
  switch (industry) {
    case 'restoration':
      return {
        weekly_posts: 2,
        monthly_articles: 1,
        platform_focus: ['LinkedIn', 'Google Business', 'Instagram'],
      };
    case 'trades':
      return {
        weekly_posts: 3,
        monthly_articles: 1,
        platform_focus: ['Google Business', 'Facebook', 'Instagram'],
      };
    case 'local_services':
      return {
        weekly_posts: 3,
        monthly_articles: 2,
        platform_focus: ['Google Business', 'Facebook', 'Nextdoor'],
      };
    case 'consulting':
      return {
        weekly_posts: 3,
        monthly_articles: 2,
        platform_focus: ['LinkedIn', 'Twitter', 'Blog'],
      };
  }
}

export default {
  INDUSTRY_FUNNELS,
  getIndustryFunnel,
  generateLandingContent,
  validateContent,
  getContentCadence,
};
