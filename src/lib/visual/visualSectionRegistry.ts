/**
 * Visual Section Registry
 * Phase 10: UX-02 Visual System Integration
 *
 * Registry of section configurations mapping section IDs to visual prompts,
 * persona overrides, and fallback assets.
 */

import { VisualSectionFrameProps } from "@/components/marketing/VisualSectionFrame";

// Fallback placeholder as SVG data URL - teal gradient with Unite-Hub branding
const DEFAULT_FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2314b8a6'/%3E%3Cstop offset='100%25' style='stop-color:%230d9488'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='800' height='450'/%3E%3Ctext x='400' y='225' text-anchor='middle' fill='white' font-family='system-ui' font-size='24' font-weight='500'%3EImage Loading...%3C/text%3E%3C/svg%3E";

/**
 * Section configuration for visual generation
 */
export interface SectionConfig {
  id: string;
  label: string;
  description: string;

  // Visual generation settings
  imagePrompt: string;
  videoPrompt?: string;
  styleOverrides?: Partial<{
    industrial_metallic: number;
    saas_minimal: number;
    creator_energy: number;
    trades_hybrid: number;
  }>;

  // Fallback assets
  fallbackImage: string;
  fallbackVideo?: string;

  // Component defaults
  componentDefaults: Partial<VisualSectionFrameProps>;

  // Persona-specific overrides
  personaOverrides?: Record<string, {
    imagePrompt?: string;
    fallbackImage?: string;
    componentDefaults?: Partial<VisualSectionFrameProps>;
  }>;
}

/**
 * Landing page section configurations
 * 5 WHYS Marketing Theory: Human-centered imagery focused on emotional outcomes
 */
export const LANDING_SECTIONS: Record<string, SectionConfig> = {
  // Hero Section - 5 WHYS: Show real business owners who escaped overwhelm
  hero_main: {
    id: "hero_main",
    label: "Main Hero",
    description: "Primary landing hero with headline and CTA",
    imagePrompt:
      "Australian tradesperson on job site, phone in hand, confident smile, golden hour lighting, real human success story, NO TEXT NO LABELS",
    videoPrompt:
      "Smooth camera movement revealing dashboard interface, professional lighting, minimal motion graphics",
    fallbackImage: "/images/generated/hero-trades-owner.jpg",
    componentDefaults: {
      variant: "hero",
      backgroundType: "gradient",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Australian tradie on construction site, phone in hand, confident and in control, hi-vis vest, golden hour, relief and control feeling, NO TEXT",
        fallbackImage: "/images/generated/hero-trades-owner.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Creative agency owner in modern office, relaxed but productive, time for creativity again, warm natural lighting, NO TEXT",
        fallbackImage: "/images/generated/hero-agency-owner.jpg",
      },
      nonprofit: {
        imagePrompt:
          "Nonprofit leader in community they serve, genuine warmth, purpose fulfilled, documentary style, NO TEXT",
        fallbackImage: "/images/generated/hero-nonprofit-leader.jpg",
      },
      consultant: {
        imagePrompt:
          "Professional consultant closing deal with client, confident handshake, expertise recognized, professional success feeling, NO TEXT",
        fallbackImage: "/images/generated/hero-consultant.jpg",
      },
      marketing_manager: {
        imagePrompt:
          "Marketing manager leaving office on time, work-life balance achieved, weekend plans happening, relief and balance, NO TEXT",
        fallbackImage: "/images/generated/hero-marketing-manager.jpg",
      },
    },
  },

  // Features Section - 5 WHYS: Show humans benefiting from features
  features_grid: {
    id: "features_grid",
    label: "Features Grid",
    description: "Feature showcase with icons and descriptions",
    imagePrompt:
      "Business owner with clarity, seeing clearly what works, fog has lifted feeling, warm illustration style, NO TEXT",
    fallbackImage: "/images/generated/feature-analytics-dashboard.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "pattern",
      padding: "large",
      textAlign: "left",
    },
  },

  // AI Automation Section - 5 WHYS: AI as helpful assistant not cold tech
  ai_automation: {
    id: "ai_automation",
    label: "AI Automation",
    description: "AI-powered automation showcase",
    imagePrompt:
      "Business owner with helpful assistant sorting tasks, supported feeling, warm illustration, NO TEXT NO ROBOTS",
    fallbackImage: "/images/generated/feature-workflow-automation.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "gradient",
      padding: "large",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Tradie with helpful scheduling assistant, jobs organized, supported feeling, warm style, NO TEXT",
        fallbackImage: "/images/generated/feature-workflow-automation.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Agency owner with AI helping content creation, creative collaboration not replacement, NO TEXT",
        fallbackImage: "/images/generated/feature-ai-content-generation.jpg",
      },
    },
  },

  // Testimonials Section - 5 WHYS: Real success stories with case study images
  testimonials: {
    id: "testimonials",
    label: "Testimonials",
    description: "Customer success stories and quotes",
    imagePrompt:
      "Construction business owner proudly standing with fleet and crew, documentary photography, pride and growth feeling, NO TEXT",
    fallbackImage: "/images/generated/case-study-construction.jpg",
    componentDefaults: {
      variant: "testimonial",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Builder owner with expanded business, new trucks, happy crew, documentary style, pride feeling, NO TEXT",
        fallbackImage: "/images/generated/case-study-construction.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Agency team celebrating big client win, candid office moment, team triumph feeling, NO TEXT",
        fallbackImage: "/images/generated/case-study-agency.jpg",
      },
    },
  },

  // Stats/Metrics Section - 5 WHYS: Growth that you can feel
  stats_metrics: {
    id: "stats_metrics",
    label: "Stats & Metrics",
    description: "Key performance metrics display",
    imagePrompt:
      "Business owner looking at visibly grown business, pride feeling, tangible success, lifestyle photography, NO TEXT",
    fallbackImage: "/images/generated/integration-analytics.jpg",
    componentDefaults: {
      variant: "stats",
      backgroundType: "gradient",
      padding: "medium",
      textAlign: "center",
    },
  },

  // Pricing Section - 5 WHYS: Show achievable success at each tier
  pricing_plans: {
    id: "pricing_plans",
    label: "Pricing Plans",
    description: "Pricing tiers and comparison",
    imagePrompt:
      "Small business owner taking first confident step, possibility feeling, warm lifestyle photography, NO TEXT",
    fallbackImage: "/images/generated/feature-lead-scoring.jpg",
    componentDefaults: {
      variant: "pricing",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
  },

  // CTA Section - 5 WHYS: Adventure awaits, take the first step
  cta_final: {
    id: "cta_final",
    label: "Final CTA",
    description: "Bottom-of-page call to action",
    imagePrompt:
      "Person taking first step on Australian mountain trail at golden hour, adventure and possibility feeling, NO TEXT",
    fallbackImage: "/images/generated/feature-contact-intelligence.jpg",
    componentDefaults: {
      variant: "cta",
      backgroundType: "gradient",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Tradie confidently starting new chapter, tools ready, opportunity ahead, warm lighting, NO TEXT",
        fallbackImage: "/images/generated/hero-trades-owner.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Creative professional ready for the next level, confident smile, modern setting, NO TEXT",
        fallbackImage: "/images/generated/hero-agency-owner.jpg",
      },
      nonprofit: {
        imagePrompt:
          "Community leader ready to amplify their cause, purpose and hope feeling, warm atmosphere, NO TEXT",
        fallbackImage: "/images/generated/hero-nonprofit-leader.jpg",
      },
    },
  },

  // How It Works Section - 5 WHYS: Simple steps to success
  how_it_works: {
    id: "how_it_works",
    label: "How It Works",
    description: "Step-by-step process explanation",
    imagePrompt:
      "Person opening door to new possibilities, excitement feeling, hopeful illustration style, NO TEXT",
    fallbackImage: "/images/generated/feature-drip-sequences.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
  },

  // Integrations Section - 5 WHYS: Everything working together smoothly
  integrations: {
    id: "integrations",
    label: "Integrations",
    description: "Third-party integration showcase",
    imagePrompt:
      "Business owner as conductor with orchestra of tools in harmony, no more juggling feeling, playful illustration, NO TEXT",
    fallbackImage: "/images/generated/feature-integrations-hub.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "pattern",
      padding: "medium",
      textAlign: "center",
    },
  },

  // Use Cases Section - 5 WHYS: Real industry success stories
  use_cases: {
    id: "use_cases",
    label: "Use Cases",
    description: "Industry-specific use cases",
    imagePrompt:
      "Business owner in their element, thriving and successful, documentary style, pride feeling, NO TEXT",
    fallbackImage: "/images/generated/case-study-construction.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "solid",
      padding: "large",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Construction business owner with thriving crew and fleet, scaled up successfully, documentary style, NO TEXT",
        fallbackImage: "/images/generated/case-study-construction.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Marketing agency team celebrating big win, creative collaboration, team triumph feeling, NO TEXT",
        fallbackImage: "/images/generated/case-study-agency.jpg",
      },
      nonprofit: {
        imagePrompt:
          "Fitness coach with thriving community, full class, impact and community feeling, NO TEXT",
        fallbackImage: "/images/generated/case-study-fitness.jpg",
      },
    },
  },
};

/**
 * Get section configuration by ID
 */
export function getSectionConfig(sectionId: string): SectionConfig | null {
  return LANDING_SECTIONS[sectionId] || null;
}

/**
 * Get section configuration with persona overrides applied
 */
export function getSectionConfigForPersona(
  sectionId: string,
  personaId: string | null
): SectionConfig | null {
  const baseConfig = LANDING_SECTIONS[sectionId];
  if (!baseConfig) {
return null;
}

  if (!personaId || !baseConfig.personaOverrides?.[personaId]) {
    return baseConfig;
  }

  const personaOverride = baseConfig.personaOverrides[personaId];

  return {
    ...baseConfig,
    imagePrompt: personaOverride.imagePrompt || baseConfig.imagePrompt,
    fallbackImage: personaOverride.fallbackImage || baseConfig.fallbackImage,
    componentDefaults: {
      ...baseConfig.componentDefaults,
      ...personaOverride.componentDefaults,
    },
  };
}

/**
 * Get all section IDs
 */
export function getAllSectionIds(): string[] {
  return Object.keys(LANDING_SECTIONS);
}

/**
 * Get sections by variant type
 */
export function getSectionsByVariant(
  variant: VisualSectionFrameProps["variant"]
): SectionConfig[] {
  return Object.values(LANDING_SECTIONS).filter(
    (section) => section.componentDefaults.variant === variant
  );
}

/**
 * Generate image prompt for a section with persona context
 */
export function generateSectionImagePrompt(
  sectionId: string,
  personaId: string | null,
  additionalModifiers?: string[]
): string {
  const config = getSectionConfigForPersona(sectionId, personaId);
  if (!config) {
return "";
}

  let prompt = config.imagePrompt;

  if (additionalModifiers && additionalModifiers.length > 0) {
    prompt += `, ${additionalModifiers.join(", ")}`;
  }

  return `${prompt}. Professional quality, high resolution.`;
}

/**
 * Get fallback image path for a section
 */
export function getSectionFallbackImage(
  sectionId: string,
  personaId: string | null
): string {
  const config = getSectionConfigForPersona(sectionId, personaId);
  return config?.fallbackImage || DEFAULT_FALLBACK_IMAGE;
}

export default LANDING_SECTIONS;
