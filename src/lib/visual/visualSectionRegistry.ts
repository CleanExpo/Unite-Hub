/**
 * Visual Section Registry
 * Phase 10: UX-02 Visual System Integration
 *
 * Registry of section configurations mapping section IDs to visual prompts,
 * persona overrides, and fallback assets.
 */

import { VisualSectionFrameProps } from "@/components/marketing/VisualSectionFrame";

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
 */
export const LANDING_SECTIONS: Record<string, SectionConfig> = {
  // Hero Section
  hero_main: {
    id: "hero_main",
    label: "Main Hero",
    description: "Primary landing hero with headline and CTA",
    imagePrompt:
      "Professional business dashboard interface, modern UI design, clean data visualization, blue accent lighting, tech aesthetic, high resolution",
    videoPrompt:
      "Smooth camera movement revealing dashboard interface, professional lighting, minimal motion graphics",
    fallbackImage: "/images/hero/default-hero.jpg",
    componentDefaults: {
      variant: "hero",
      backgroundType: "gradient",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Small business owner using tablet on worksite, construction tools, practical technology, Australian setting, natural lighting",
        fallbackImage: "/images/hero/trades-hero.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Marketing agency team reviewing analytics dashboard, modern office, multiple screens, professional lighting, collaborative atmosphere",
        fallbackImage: "/images/hero/agency-hero.jpg",
      },
      nonprofit: {
        imagePrompt:
          "Community volunteers using technology, diverse group, warm lighting, collaborative workspace, positive atmosphere",
        fallbackImage: "/images/hero/nonprofit-hero.jpg",
      },
      consultant: {
        imagePrompt:
          "Professional consultant with laptop in modern setting, confident posture, clean background, business casual, natural lighting",
        fallbackImage: "/images/hero/consultant-hero.jpg",
      },
      marketing_manager: {
        imagePrompt:
          "Marketing professional analyzing campaign metrics on large display, modern office, data visualization, focused atmosphere",
        fallbackImage: "/images/hero/marketing-hero.jpg",
      },
    },
  },

  // Features Section
  features_grid: {
    id: "features_grid",
    label: "Features Grid",
    description: "Feature showcase with icons and descriptions",
    imagePrompt:
      "Abstract technology pattern, interconnected nodes, clean geometric design, subtle blue glow, modern aesthetic",
    fallbackImage: "/images/features/features-bg.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "pattern",
      padding: "large",
      textAlign: "left",
    },
  },

  // AI Automation Section
  ai_automation: {
    id: "ai_automation",
    label: "AI Automation",
    description: "AI-powered automation showcase",
    imagePrompt:
      "Futuristic AI interface, neural network visualization, flowing data streams, blue and purple gradient, high-tech aesthetic",
    fallbackImage: "/images/features/ai-automation.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "gradient",
      padding: "large",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "AI assistant helping schedule jobs on mobile device, calendar interface, practical UI, worksite context",
      },
      agency_owner: {
        imagePrompt:
          "AI-powered marketing automation dashboard, campaign flows, analytics charts, professional UI",
      },
    },
  },

  // Testimonials Section
  testimonials: {
    id: "testimonials",
    label: "Testimonials",
    description: "Customer success stories and quotes",
    imagePrompt:
      "Professional headshot placeholder, neutral background, soft lighting, business portrait style",
    fallbackImage: "/images/testimonials/testimonial-bg.jpg",
    componentDefaults: {
      variant: "testimonial",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Tradesperson in work uniform, friendly expression, job site background, authentic portrait",
      },
      agency_owner: {
        imagePrompt:
          "Marketing professional in modern office, confident expression, clean background, corporate portrait",
      },
    },
  },

  // Stats/Metrics Section
  stats_metrics: {
    id: "stats_metrics",
    label: "Stats & Metrics",
    description: "Key performance metrics display",
    imagePrompt:
      "Data visualization graphics, ascending charts, success indicators, green and blue color scheme, professional infographic style",
    fallbackImage: "/images/stats/stats-bg.jpg",
    componentDefaults: {
      variant: "stats",
      backgroundType: "gradient",
      padding: "medium",
      textAlign: "center",
    },
  },

  // Pricing Section
  pricing_plans: {
    id: "pricing_plans",
    label: "Pricing Plans",
    description: "Pricing tiers and comparison",
    imagePrompt:
      "Clean pricing card design, tier comparison visual, checkmark icons, professional layout, trust signals",
    fallbackImage: "/images/pricing/pricing-bg.jpg",
    componentDefaults: {
      variant: "pricing",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
  },

  // CTA Section
  cta_final: {
    id: "cta_final",
    label: "Final CTA",
    description: "Bottom-of-page call to action",
    imagePrompt:
      "Inspirational business success visual, team celebration, achievement moment, warm lighting, positive atmosphere",
    fallbackImage: "/images/cta/cta-bg.jpg",
    componentDefaults: {
      variant: "cta",
      backgroundType: "gradient",
      padding: "large",
      textAlign: "center",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Happy tradesperson completing job successfully, satisfied customer handshake, professional completion",
      },
      agency_owner: {
        imagePrompt:
          "Marketing team celebrating campaign success, analytics showing growth, modern office celebration",
      },
      nonprofit: {
        imagePrompt:
          "Community impact moment, volunteers and beneficiaries together, meaningful connection, warm atmosphere",
      },
    },
  },

  // How It Works Section
  how_it_works: {
    id: "how_it_works",
    label: "How It Works",
    description: "Step-by-step process explanation",
    imagePrompt:
      "Process flow diagram, numbered steps, clean arrows, professional infographic, blue accent colors",
    fallbackImage: "/images/features/how-it-works.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "solid",
      padding: "large",
      textAlign: "center",
    },
  },

  // Integrations Section
  integrations: {
    id: "integrations",
    label: "Integrations",
    description: "Third-party integration showcase",
    imagePrompt:
      "Connected app icons, API integration visual, data flow between platforms, modern tech aesthetic",
    fallbackImage: "/images/features/integrations.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "pattern",
      padding: "medium",
      textAlign: "center",
    },
  },

  // Use Cases Section
  use_cases: {
    id: "use_cases",
    label: "Use Cases",
    description: "Industry-specific use cases",
    imagePrompt:
      "Multi-industry collage, diverse business scenarios, professional settings, real-world applications",
    fallbackImage: "/images/features/use-cases.jpg",
    componentDefaults: {
      variant: "feature",
      backgroundType: "solid",
      padding: "large",
    },
    personaOverrides: {
      trades_owner: {
        imagePrompt:
          "Trades business scenarios: plumber, electrician, builder at work, practical technology use",
        fallbackImage: "/images/use-cases/trades.jpg",
      },
      agency_owner: {
        imagePrompt:
          "Marketing agency workflow, client presentations, campaign management, creative collaboration",
        fallbackImage: "/images/use-cases/agency.jpg",
      },
      nonprofit: {
        imagePrompt:
          "Nonprofit operations, donor management, volunteer coordination, community outreach",
        fallbackImage: "/images/use-cases/nonprofit.jpg",
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
  if (!baseConfig) return null;

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
  if (!config) return "";

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
  return config?.fallbackImage || "/images/placeholder.jpg";
}

export default LANDING_SECTIONS;
