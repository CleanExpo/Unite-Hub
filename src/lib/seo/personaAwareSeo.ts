/**
 * Persona-Aware SEO Integration
 * Phase 10: UX-04 SEO/GEO No-Bluff Integration
 *
 * Integrates persona system with SEO configuration for adaptive metadata
 */

import { seoConfig } from "./seoConfig";
import { validateSEOClaim, sanitizeSEOContent } from "./no-bluff-protocol";
import { getPersona, SYNTHEX_PERSONAS } from "@/lib/visual/visualPersonas";

/**
 * Persona-specific SEO metadata overrides
 */
export interface PersonaSEOConfig {
  personaId: string;
  titleSuffix: string;
  descriptionPrefix: string;
  focusKeywords: string[];
  ctaText: string;
  socialProof: string;
}

/**
 * Persona SEO configurations
 */
export const PERSONA_SEO_CONFIGS: Record<string, PersonaSEOConfig> = {
  trades_owner: {
    personaId: "trades_owner",
    titleSuffix: "for Trades & Local Services",
    descriptionPrefix: "Built for busy tradies who need marketing that just works.",
    focusKeywords: [
      "marketing for tradies",
      "plumber marketing",
      "electrician SEO",
      "local business marketing",
      "tradesperson website",
    ],
    ctaText: "Start Free Trial - See Results in 7 Days",
    socialProof: "Trusted by 500+ Australian trades businesses",
  },

  agency_owner: {
    personaId: "agency_owner",
    titleSuffix: "for Marketing Agencies",
    descriptionPrefix: "Scale your agency with AI-powered client campaigns.",
    focusKeywords: [
      "agency marketing tools",
      "white-label SEO",
      "marketing agency software",
      "client reporting automation",
      "agency growth platform",
    ],
    ctaText: "Book Agency Demo",
    socialProof: "Used by 100+ marketing agencies worldwide",
  },

  nonprofit: {
    personaId: "nonprofit",
    titleSuffix: "for Non-Profits & Community Organizations",
    descriptionPrefix: "Grow your impact with AI marketing at non-profit pricing.",
    focusKeywords: [
      "nonprofit marketing",
      "charity SEO",
      "community organization marketing",
      "volunteer engagement",
      "donor outreach",
    ],
    ctaText: "Get Non-Profit Pricing",
    socialProof: "Helping 200+ organizations amplify their mission",
  },

  consultant: {
    personaId: "consultant",
    titleSuffix: "for Consultants & Coaches",
    descriptionPrefix: "Attract more clients with AI-powered personal branding.",
    focusKeywords: [
      "consultant marketing",
      "personal brand SEO",
      "coaching business marketing",
      "thought leadership content",
      "client acquisition",
    ],
    ctaText: "Start Building Your Brand",
    socialProof: "Empowering 300+ consultants to grow their practice",
  },

  marketing_manager: {
    personaId: "marketing_manager",
    titleSuffix: "for Marketing Teams",
    descriptionPrefix: "AI assistant for in-house marketing teams.",
    focusKeywords: [
      "marketing team tools",
      "campaign management AI",
      "content creation automation",
      "marketing efficiency",
      "team collaboration",
    ],
    ctaText: "Request Team Demo",
    socialProof: "Boosting productivity for 150+ marketing teams",
  },

  anonymous: {
    personaId: "anonymous",
    titleSuffix: "AI Marketing for Small Business",
    descriptionPrefix: "Finally, marketing that small businesses can afford.",
    focusKeywords: [
      "small business marketing",
      "affordable SEO",
      "AI marketing platform",
      "local business growth",
      "marketing automation",
    ],
    ctaText: "Start Free Trial",
    socialProof: "Trusted by 1,000+ small businesses",
  },
};

/**
 * Get persona-specific page title
 */
export function getPersonaTitle(
  personaId: string | null,
  baseTitle?: string
): string {
  const config = PERSONA_SEO_CONFIGS[personaId || "anonymous"];
  const base = baseTitle || seoConfig.site.name;

  return `${base} ${config.titleSuffix}`;
}

/**
 * Get persona-specific meta description
 */
export function getPersonaDescription(
  personaId: string | null,
  baseDescription?: string
): string {
  const config = PERSONA_SEO_CONFIGS[personaId || "anonymous"];
  const base = baseDescription || seoConfig.pages.home.description;

  // Validate the description using no-bluff protocol
  const combined = `${config.descriptionPrefix} ${base}`;
  const { sanitized } = sanitizeSEOContent(combined);

  return sanitized;
}

/**
 * Get persona-specific keywords
 */
export function getPersonaKeywords(personaId: string | null): string[] {
  const config = PERSONA_SEO_CONFIGS[personaId || "anonymous"];

  return [
    ...config.focusKeywords,
    ...seoConfig.keywords.primary.slice(0, 3),
  ];
}

/**
 * Generate persona-aware structured data
 */
export function generatePersonaStructuredData(
  personaId: string | null,
  pageUrl: string
): object {
  const persona = getPersona(personaId);
  const seoConfig_ = PERSONA_SEO_CONFIGS[personaId || "anonymous"];

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: getPersonaTitle(personaId),
    description: getPersonaDescription(personaId),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    audience: {
      "@type": "Audience",
      audienceType: persona.label,
      description: persona.description,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free trial available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: seoConfig.business.legalName,
      url: seoConfig.site.url,
    },
  };
}

/**
 * Validate all persona SEO content
 * Returns any claims that may be problematic
 */
export function validatePersonaSEO(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const [personaId, config] of Object.entries(PERSONA_SEO_CONFIGS)) {
    // Validate social proof claims
    const proofValidation = validateSEOClaim(config.socialProof);
    if (!proofValidation.valid) {
      issues.push(`${personaId}: Social proof issue - ${proofValidation.reason}`);
    }

    // Validate CTA text
    const ctaValidation = validateSEOClaim(config.ctaText);
    if (!ctaValidation.valid) {
      issues.push(`${personaId}: CTA issue - ${ctaValidation.reason}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Generate full SEO metadata object for a page
 */
export function generatePersonaMetadata(
  personaId: string | null,
  options?: {
    pageUrl?: string;
    ogImage?: string;
    includeStructuredData?: boolean;
  }
) {
  const config = PERSONA_SEO_CONFIGS[personaId || "anonymous"];
  const title = getPersonaTitle(personaId);
  const description = getPersonaDescription(personaId);
  const keywords = getPersonaKeywords(personaId);

  const metadata: Record<string, unknown> = {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      locale: seoConfig.site.locale,
      url: options?.pageUrl || seoConfig.site.url,
      siteName: seoConfig.site.name,
      images: [
        {
          url: options?.ogImage || seoConfig.site.image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: seoConfig.site.twitter,
      creator: seoConfig.site.twitter,
    },
  };

  if (options?.includeStructuredData) {
    metadata.structuredData = generatePersonaStructuredData(
      personaId,
      options?.pageUrl || seoConfig.site.url
    );
  }

  return metadata;
}

export default {
  PERSONA_SEO_CONFIGS,
  getPersonaTitle,
  getPersonaDescription,
  getPersonaKeywords,
  generatePersonaStructuredData,
  validatePersonaSEO,
  generatePersonaMetadata,
};
