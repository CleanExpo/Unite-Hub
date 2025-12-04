// src/lib/aura/pipeline-integration.ts
// Aura Integration with Content Pipeline

import type { PageSpec, GeneratedPage, PipelineResult } from '../content/pipeline';
import type { TaskType } from '../llm/types';
import {
  AuraEngine,
  AuraConcept,
  BrandAnalysis,
  INDUSTRY_PRESETS,
  SYNTHEX_DEFAULT_CONCEPT,
  EMOTIONAL_TRIGGERS,
  LayerArchitecture,
} from './index';

// ============================================
// TYPES
// ============================================

export interface AuraEnhancedPageSpec extends PageSpec {
  aura?: {
    concept: AuraConcept;
    brand_analysis?: BrandAnalysis;
    enhanced: boolean;
  };
}

export interface AuraEnhancedPage extends GeneratedPage {
  aura?: {
    concept_name: string;
    analogy: string;
    aesthetic_style: string;
    layer_architecture: LayerArchitecture;
    wow_factor: { name: string; description: string };
    implementation_notes: {
      css_techniques: string[];
      js_libraries: string[];
      key_animations: string[];
    };
    css_variables: Record<string, string>;
  };
}

export interface AuraPipelineConfig {
  enable_aura: boolean;
  generate_brand_analysis: boolean;
  generate_concept: boolean;
  enhance_sections: boolean;
  apply_css_variables: boolean;
  default_industry?: string;
}

// ============================================
// AURA PIPELINE HOOK
// ============================================

type ExecuteTaskFn = (
  taskType: TaskType,
  prompt: string,
  options?: { systemPrompt?: string }
) => Promise<{ content: string }>;

export class AuraPipelineHook {
  private engine: AuraEngine;
  private config: AuraPipelineConfig;

  constructor(executeTaskFn: ExecuteTaskFn, config: Partial<AuraPipelineConfig> = {}) {
    this.engine = new AuraEngine(executeTaskFn);
    this.config = {
      enable_aura: config.enable_aura !== false,
      generate_brand_analysis: config.generate_brand_analysis || false,
      generate_concept: config.generate_concept !== false,
      enhance_sections: config.enhance_sections || false,
      apply_css_variables: config.apply_css_variables !== false,
      default_industry: config.default_industry || 'tech_saas',
    };
  }

  /**
   * Pre-generation hook - enhance page spec with Aura concept
   */
  async preGenerate(spec: PageSpec): Promise<AuraEnhancedPageSpec> {
    if (!this.config.enable_aura) {
      return spec;
    }

    // Only apply to landing and pillar pages
    if (!['landing', 'pillar'].includes(spec.type)) {
      return spec;
    }

    // Get industry from spec or default
    const industry = this.extractIndustry(spec);

    // Get or generate concept
    let concept: AuraConcept;
    let brandAnalysis: BrandAnalysis | undefined;

    if (this.config.generate_brand_analysis && this.config.generate_concept) {
      // Full AI generation
      brandAnalysis = await this.engine.analyzeBrand({
        brand_name: 'Synthex',
        industry,
        target_audience: 'Australian SMB owners aged 35-55',
        usp: spec.primary_keyword,
        conversion_goal: 'Start Free Trial',
      });
      concept = await this.engine.generateConcept(brandAnalysis, industry);
    } else {
      // Use preset
      concept = this.engine.getPresetConcept(industry);
    }

    return {
      ...spec,
      aura: {
        concept,
        brand_analysis: brandAnalysis,
        enhanced: true,
      },
    };
  }

  /**
   * Post-generation hook - add Aura metadata to generated page
   */
  async postGenerate(
    result: PipelineResult,
    enhancedSpec: AuraEnhancedPageSpec
  ): Promise<PipelineResult> {
    if (!result.success || !result.page || !enhancedSpec.aura) {
      return result;
    }

    const { concept } = enhancedSpec.aura;

    // Generate CSS variables from concept
    const cssVariables = this.generateCSSVariables(concept);

    // Enhance the result
    const enhancedPage: AuraEnhancedPage = {
      ...result.page,
      aura: {
        concept_name: concept.concept_name,
        analogy: concept.analogy,
        aesthetic_style: concept.aesthetic_style,
        layer_architecture: concept.layer_architecture,
        wow_factor: concept.wow_factor,
        implementation_notes: concept.implementation_notes,
        css_variables: cssVariables,
      },
    };

    // Inject CSS variables into full_html if enabled
    if (this.config.apply_css_variables) {
      enhancedPage.content.full_html = this.injectCSSVariables(
        enhancedPage.content.full_html,
        cssVariables
      );
    }

    return {
      ...result,
      page: enhancedPage,
    };
  }

  /**
   * Generate CSS variables from Aura concept
   */
  private generateCSSVariables(concept: AuraConcept): Record<string, string> {
    return {
      '--aura-primary': concept.color_palette.primary,
      '--aura-secondary': concept.color_palette.secondary,
      '--aura-accent': concept.color_palette.accent,
      '--aura-background': concept.color_palette.background,
      '--aura-text': concept.color_palette.text,
      '--aura-muted': concept.color_palette.muted,
      '--aura-font-header': concept.typography.header,
      '--aura-font-body': concept.typography.body,
      '--aura-font-accent': concept.typography.accent,
      '--aura-grid': concept.layer_architecture.layer_1_structure.grid,
      '--aura-scroll': concept.layer_architecture.layer_1_structure.scroll,
      '--aura-hero-visual': concept.layer_architecture.layer_2_narrative.hero_visual,
      '--aura-cta-style': concept.layer_architecture.layer_3_engagement.cta_design,
      '--aura-hover': concept.layer_architecture.layer_4_delight.hover_states,
      '--aura-transition': concept.layer_architecture.layer_4_delight.transitions,
    };
  }

  /**
   * Inject CSS variables into HTML
   */
  private injectCSSVariables(html: string, variables: Record<string, string>): string {
    const cssBlock = `:root {\n${Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;

    const styleTag = `<style data-aura="true">\n${cssBlock}\n</style>`;

    // Inject at the start of the HTML
    if (html.includes('<head>')) {
      return html.replace('<head>', `<head>\n${styleTag}`);
    } else {
      return `${styleTag}\n${html}`;
    }
  }

  /**
   * Extract industry from page spec
   */
  private extractIndustry(spec: PageSpec): string {
    // Check explicit industry
    if (spec.industry) {
      return this.normalizeIndustry(spec.industry);
    }

    // Extract from URL
    const url = spec.url.toLowerCase();
    if (url.includes('trade') || url.includes('plumber') || url.includes('electrician')) {
      return 'trades';
    }
    if (url.includes('health') || url.includes('wellness') || url.includes('dentist')) {
      return 'health_wellness';
    }
    if (url.includes('professional') || url.includes('accountant') || url.includes('lawyer')) {
      return 'professional_services';
    }
    if (url.includes('hospitality') || url.includes('restaurant') || url.includes('cafe')) {
      return 'hospitality';
    }
    if (url.includes('property') || url.includes('real-estate')) {
      return 'property';
    }
    if (url.includes('automotive') || url.includes('mechanic')) {
      return 'automotive';
    }
    if (url.includes('home-service') || url.includes('cleaner')) {
      return 'home_services';
    }

    return this.config.default_industry || 'tech_saas';
  }

  /**
   * Normalize industry string to preset key
   */
  private normalizeIndustry(industry: string): string {
    const normalized = industry.toLowerCase().replace(/[^a-z]/g, '_');

    const mappings: Record<string, string> = {
      trades: 'trades',
      trade: 'trades',
      plumber: 'trades',
      electrician: 'trades',
      builder: 'trades',
      hvac: 'trades',
      professional_services: 'professional_services',
      professional: 'professional_services',
      accountant: 'professional_services',
      lawyer: 'professional_services',
      health_wellness: 'health_wellness',
      health: 'health_wellness',
      wellness: 'health_wellness',
      dentist: 'health_wellness',
      hospitality: 'hospitality',
      restaurant: 'hospitality',
      cafe: 'hospitality',
      property: 'property',
      real_estate: 'property',
      automotive: 'automotive',
      mechanic: 'automotive',
      home_services: 'home_services',
      cleaner: 'home_services',
      tech: 'tech_saas',
      saas: 'tech_saas',
    };

    return mappings[normalized] || 'tech_saas';
  }
}

// ============================================
// ENHANCED SECTION PROMPTS
// ============================================

export function getAuraEnhancedPrompt(
  basePrompt: string,
  concept: AuraConcept,
  sectionType: string
): string {
  const layerGuidance = getLayerGuidanceForSection(sectionType, concept);

  return `${basePrompt}

---
AURA DESIGN DIRECTION:

Concept: "${concept.concept_name}"
Analogy: "${concept.analogy}"
Aesthetic Style: ${concept.aesthetic_style}

${layerGuidance}

Emotional Tone: Design signals should convey ${concept.wow_factor.name.toLowerCase()} through visual hierarchy and interaction patterns.

Color Application:
- Primary actions: ${concept.color_palette.primary}
- Background: ${concept.color_palette.background}
- Text: ${concept.color_palette.text}
- Accents: ${concept.color_palette.accent}

Typography Style: ${concept.typography.style}
---`;
}

function getLayerGuidanceForSection(sectionType: string, concept: AuraConcept): string {
  const layerArch = concept.layer_architecture;

  switch (sectionType) {
    case 'hero':
      return `
Layer 2 (Narrative) Guidance:
- Hero Visual: ${layerArch.layer_2_narrative.hero_visual}
- Headline Treatment: ${layerArch.layer_2_narrative.headline_treatment}
- Story Flow: ${layerArch.layer_2_narrative.story_flow}

Layer 4 (Delight) Guidance:
- Hover States: ${layerArch.layer_4_delight.hover_states}
- Transitions: ${layerArch.layer_4_delight.transitions}`;

    case 'features':
    case 'problem':
      return `
Layer 1 (Structure) Guidance:
- Grid System: ${layerArch.layer_1_structure.grid}
- Scroll Behavior: ${layerArch.layer_1_structure.scroll}

Layer 3 (Engagement) Guidance:
- Feature Presentation: ${layerArch.layer_3_engagement.feature_presentation}
- CTA Design: ${layerArch.layer_3_engagement.cta_design}`;

    case 'testimonials':
    case 'results':
      return `
Layer 3 (Engagement) Guidance:
- Social Proof Style: ${layerArch.layer_3_engagement.social_proof}
- Feature Presentation: ${layerArch.layer_3_engagement.feature_presentation}

Layer 4 (Delight) Guidance:
- Hover States: ${layerArch.layer_4_delight.hover_states}
- Transitions: ${layerArch.layer_4_delight.transitions}`;

    case 'cta':
      return `
Layer 3 (Engagement) Guidance:
- CTA Design: ${layerArch.layer_3_engagement.cta_design}

Layer 4 (Delight) Guidance:
- Hover States: ${layerArch.layer_4_delight.hover_states}
- Transitions: ${layerArch.layer_4_delight.transitions}

Wow Factor to consider: "${concept.wow_factor.name}" - ${concept.wow_factor.description}`;

    default:
      return `
Layer 1 (Structure) Guidance:
- Grid System: ${layerArch.layer_1_structure.grid}

Layer 3 (Engagement) Guidance:
- Feature Presentation: ${layerArch.layer_3_engagement.feature_presentation}`;
  }
}

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

export { AuraEngine, INDUSTRY_PRESETS, SYNTHEX_DEFAULT_CONCEPT, EMOTIONAL_TRIGGERS };
export type { AuraConcept, BrandAnalysis, LayerArchitecture };
