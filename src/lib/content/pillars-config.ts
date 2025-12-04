/**
 * Pillars Configuration
 * Phase 33: Honest Visual Playground & Real Deliverables
 *
 * Content pillars for visual concept generation
 * All outputs are AI-generated concepts, not final products
 */

export interface SubPillar {
  id: string;
  title: string;
  description: string;
  disclaimer: string;
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  subPillars: SubPillar[];
}

export const DISCLAIMERS = {
  visual: "AI-generated concept only, not a final product.",
  video: "AI video concept, requires human review.",
  copy: "AI-generated draft, client should review for accuracy.",
  voice: "AI-generated demo voice only.",
  general: "All outputs are concept previews for exploration purposes.",
};

export const PILLARS: Pillar[] = [
  {
    id: "seo_geo",
    title: "SEO & GEO Concept Previews",
    description: "Search and local presence concepts generated using current AI tools.",
    icon: "Search",
    subPillars: [
      {
        id: "seo_content_outlines",
        title: "SEO Content Outlines",
        description: "AI-generated content structure ideas for search optimization",
        disclaimer: DISCLAIMERS.copy,
      },
      {
        id: "local_page_variations",
        title: "Local Page Variations",
        description: "Location-based page concept variations",
        disclaimer: DISCLAIMERS.copy,
      },
      {
        id: "map_pack_concepts",
        title: "Map Pack Creative Concepts",
        description: "Visual ideas for local search presence",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "search_snippet_previews",
        title: "Search Snippet Preview Ideas",
        description: "Concept previews for search result appearances",
        disclaimer: DISCLAIMERS.visual,
      },
    ],
  },
  {
    id: "social_creative",
    title: "Social Content Concepts",
    description: "AI-generated social ideas, not final designs.",
    icon: "Share2",
    subPillars: [
      {
        id: "carousel_layouts",
        title: "Carousel Layouts",
        description: "Multi-slide concept layouts for social platforms",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "shortform_scripts",
        title: "Short-form Script Ideas",
        description: "Script concepts for video content",
        disclaimer: DISCLAIMERS.copy,
      },
      {
        id: "pattern_concepts",
        title: "Brand-safe Pattern Concepts",
        description: "Visual pattern ideas for brand consistency",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "caption_directions",
        title: "Caption Direction (Draft Format)",
        description: "AI-generated caption ideas for social posts",
        disclaimer: DISCLAIMERS.copy,
      },
    ],
  },
  {
    id: "web_experience",
    title: "Website Layout Concepts",
    description: "Wireframe-level visuals and layout ideas ONLY.",
    icon: "Layout",
    subPillars: [
      {
        id: "homepage_wireframes",
        title: "Homepage Wireframes",
        description: "Structural layout concepts for homepages",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "service_page_layouts",
        title: "Service Page Concept Layouts",
        description: "Page structure ideas for service offerings",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "funnel_flow_diagrams",
        title: "Funnel Flow Diagrams",
        description: "User journey and conversion flow concepts",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "value_proposition_blocks",
        title: "Value Proposition Blocks",
        description: "Layout ideas for communicating value",
        disclaimer: DISCLAIMERS.visual,
      },
    ],
  },
  {
    id: "brand_systems",
    title: "Brand Identity Concepts",
    description: "Exploratory branding ideas using allowed AI tools.",
    icon: "Palette",
    subPillars: [
      {
        id: "colour_palette_ideas",
        title: "Colour Palette Ideas",
        description: "Color combination concepts for brand identity",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "styling_patterns",
        title: "Styling Patterns",
        description: "Visual styling direction concepts",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "typography_concepts",
        title: "Typography Concepts",
        description: "Font pairing and hierarchy ideas",
        disclaimer: DISCLAIMERS.visual,
      },
      {
        id: "brand_voice_directions",
        title: "Brand Voice Directions",
        description: "Tone and messaging concept guides",
        disclaimer: DISCLAIMERS.copy,
      },
    ],
  },
];

/**
 * Get pillar by ID
 */
export function getPillar(pillarId: string): Pillar | undefined {
  return PILLARS.find(p => p.id === pillarId);
}

/**
 * Get sub-pillar by IDs
 */
export function getSubPillar(
  pillarId: string,
  subPillarId: string
): SubPillar | undefined {
  const pillar = getPillar(pillarId);
  if (!pillar) {
    return undefined;
  }
  return pillar.subPillars.find(sp => sp.id === subPillarId);
}

/**
 * Get all pillars
 */
export function getAllPillars(): Pillar[] {
  return PILLARS;
}

/**
 * Get disclaimer for output type
 */
export function getDisclaimer(
  type: "visual" | "video" | "copy" | "voice" | "general"
): string {
  return DISCLAIMERS[type];
}
