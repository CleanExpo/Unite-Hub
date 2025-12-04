// src/lib/aura/index.ts
// Aura Visionary Architecture - Psycho-Aesthetic Design System

import type { TaskType } from '../llm/types';

// ============================================
// TYPES
// ============================================

export type AestheticStyle =
  | 'minimalist_luxury'
  | 'dark_mode_luxe'
  | 'organic_warmth'
  | 'neo_brutalism'
  | 'advanced_glassmorphism'
  | 'kinetic_impact';

export type EmotionalTrigger =
  | 'trust'
  | 'exclusivity'
  | 'urgency'
  | 'empowerment'
  | 'serenity'
  | 'innovation';

export type GridSystem = 'bento' | 'split_screen' | 'z_pattern' | 'fluid_12_column' | 'asymmetric';
export type ScrollMechanic =
  | 'smooth_parallax'
  | 'scroll_snap'
  | 'horizontal_scroll'
  | 'sticky_sections'
  | 'reveal_on_scroll';
export type HeroVisual =
  | '3d_interactive'
  | 'cinematic_video'
  | 'bespoke_illustration'
  | 'typography_hero'
  | 'product_showcase'
  | 'abstract_motion';
export type CTAStyle =
  | 'ghost_button'
  | 'liquid_fill'
  | 'magnetic'
  | 'high_gloss'
  | 'gradient_shift'
  | 'expand_reveal';

export interface LayerArchitecture {
  layer_0_atmosphere: {
    background: string;
    ambient_effect: string;
    cursor_reactivity: string;
  };
  layer_1_structure: {
    grid: GridSystem;
    scroll: ScrollMechanic;
    navigation: string;
  };
  layer_2_narrative: {
    hero_visual: HeroVisual;
    headline_treatment: string;
    story_flow: string;
  };
  layer_3_engagement: {
    feature_presentation: string;
    social_proof: string;
    cta_design: CTAStyle;
  };
  layer_4_delight: {
    hover_states: string;
    transitions: string;
    custom_cursor: string;
  };
}

export interface BrandAnalysis {
  brand_essence: [string, string, string];
  icp_aspiration: string;
  emotional_trigger: EmotionalTrigger;
  aesthetic_opportunity: string;
}

export interface AuraConcept {
  concept_name: string;
  analogy: string;
  aesthetic_style: AestheticStyle;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    header: string;
    body: string;
    accent: string;
    style: string;
  };
  layer_architecture: LayerArchitecture;
  wow_factor: {
    name: string;
    description: string;
  };
  implementation_notes: {
    css_techniques: string[];
    js_libraries: string[];
    key_animations: string[];
  };
}

export interface EnhancedSection {
  section_type: string;
  layer_config: Partial<LayerArchitecture>;
  visual_direction: string;
  animation_suggestions: string[];
  interaction_patterns: string[];
  implementation_hints: string[];
}

// ============================================
// AESTHETIC STYLE CONFIGURATIONS
// ============================================

export const AESTHETIC_STYLES: Record<
  AestheticStyle,
  {
    description: string;
    best_for: string[];
    emotional_triggers: EmotionalTrigger[];
    default_palette: { primary: string; background: string; text: string };
  }
> = {
  minimalist_luxury: {
    description: 'Clean, spacious layouts with premium typography and subtle animations',
    best_for: ['professional_services', 'luxury_brands', 'saas'],
    emotional_triggers: ['trust', 'exclusivity'],
    default_palette: { primary: '#1a1a1a', background: '#ffffff', text: '#1a1a1a' },
  },
  dark_mode_luxe: {
    description: 'Deep blacks with vibrant accents, creating dramatic contrast',
    best_for: ['tech', 'gaming', 'creative_agencies'],
    emotional_triggers: ['innovation', 'exclusivity'],
    default_palette: { primary: '#ea580c', background: '#0a0a0b', text: '#fafafa' },
  },
  organic_warmth: {
    description: 'Natural textures, earthy tones, flowing shapes',
    best_for: ['health_wellness', 'eco_brands', 'hospitality'],
    emotional_triggers: ['trust', 'serenity'],
    default_palette: { primary: '#059669', background: '#fafaf9', text: '#1c1917' },
  },
  neo_brutalism: {
    description: 'Bold shapes, raw aesthetics, unapologetic typography',
    best_for: ['startups', 'creative', 'disruptors'],
    emotional_triggers: ['empowerment', 'innovation'],
    default_palette: { primary: '#000000', background: '#ffffff', text: '#000000' },
  },
  advanced_glassmorphism: {
    description: 'Frosted glass effects, layered transparency, soft shadows',
    best_for: ['fintech', 'saas', 'modern_apps'],
    emotional_triggers: ['trust', 'innovation'],
    default_palette: { primary: '#6366f1', background: '#f8fafc', text: '#1e293b' },
  },
  kinetic_impact: {
    description: 'Motion-first design with purposeful animations throughout',
    best_for: ['marketing', 'entertainment', 'tech_products'],
    emotional_triggers: ['urgency', 'innovation'],
    default_palette: { primary: '#f43f5e', background: '#0f172a', text: '#f8fafc' },
  },
};

// ============================================
// EMOTIONAL TRIGGER CONFIGURATIONS
// ============================================

export const EMOTIONAL_TRIGGERS: Record<
  EmotionalTrigger,
  {
    description: string;
    design_signals: string[];
    color_associations: string[];
  }
> = {
  trust: {
    description: 'Building confidence and credibility',
    design_signals: [
      'clean_layout',
      'consistent_spacing',
      'professional_imagery',
      'social_proof',
      'security_badges',
    ],
    color_associations: ['blue', 'green', 'white', 'navy'],
  },
  exclusivity: {
    description: 'Creating sense of premium access',
    design_signals: [
      'dark_themes',
      'gold_accents',
      'minimal_elements',
      'luxury_typography',
      'white_space',
    ],
    color_associations: ['black', 'gold', 'deep_purple', 'cream'],
  },
  urgency: {
    description: 'Driving immediate action',
    design_signals: [
      'countdown_timers',
      'limited_availability',
      'bold_ctas',
      'high_contrast',
      'animated_elements',
    ],
    color_associations: ['red', 'orange', 'yellow', 'black'],
  },
  empowerment: {
    description: 'Making user feel capable',
    design_signals: [
      'action_oriented_copy',
      'progress_indicators',
      'success_stories',
      'clear_paths',
      'bold_typography',
    ],
    color_associations: ['orange', 'teal', 'purple', 'warm_grays'],
  },
  serenity: {
    description: 'Creating calm, stress-free experience',
    design_signals: [
      'soft_gradients',
      'rounded_shapes',
      'gentle_animations',
      'pastel_colors',
      'natural_imagery',
    ],
    color_associations: ['light_blue', 'sage_green', 'lavender', 'soft_pink'],
  },
  innovation: {
    description: 'Conveying cutting-edge advancement',
    design_signals: [
      '3d_elements',
      'dark_mode',
      'neon_accents',
      'geometric_shapes',
      'tech_aesthetics',
    ],
    color_associations: ['electric_blue', 'neon_green', 'purple', 'black'],
  },
};

// ============================================
// INDUSTRY PRESETS
// ============================================

export const INDUSTRY_PRESETS: Record<
  string,
  {
    aesthetic_style: AestheticStyle;
    emotional_trigger: EmotionalTrigger;
    layer_0: { background: string; ambient_effect: string };
    layer_1: { grid: GridSystem; scroll: ScrollMechanic };
    color_override?: { primary: string; background: string };
  }
> = {
  trades: {
    aesthetic_style: 'organic_warmth',
    emotional_trigger: 'trust',
    layer_0: { background: 'warm_gradient', ambient_effect: 'none' },
    layer_1: { grid: 'split_screen', scroll: 'reveal_on_scroll' },
    color_override: { primary: '#0d9488', background: '#fafaf9' },
  },
  professional_services: {
    aesthetic_style: 'minimalist_luxury',
    emotional_trigger: 'trust',
    layer_0: { background: 'clean_solid', ambient_effect: 'subtle_noise' },
    layer_1: { grid: 'fluid_12_column', scroll: 'smooth_parallax' },
    color_override: { primary: '#2563eb', background: '#ffffff' },
  },
  health_wellness: {
    aesthetic_style: 'organic_warmth',
    emotional_trigger: 'serenity',
    layer_0: { background: 'soft_gradient', ambient_effect: 'flowing_shapes' },
    layer_1: { grid: 'z_pattern', scroll: 'reveal_on_scroll' },
    color_override: { primary: '#059669', background: '#f0fdf4' },
  },
  hospitality: {
    aesthetic_style: 'minimalist_luxury',
    emotional_trigger: 'exclusivity',
    layer_0: { background: 'rich_texture', ambient_effect: 'none' },
    layer_1: { grid: 'bento', scroll: 'scroll_snap' },
    color_override: { primary: '#78350f', background: '#fffbeb' },
  },
  tech_saas: {
    aesthetic_style: 'dark_mode_luxe',
    emotional_trigger: 'innovation',
    layer_0: { background: 'gradient_mesh', ambient_effect: 'particle_field' },
    layer_1: { grid: 'asymmetric', scroll: 'smooth_parallax' },
    color_override: { primary: '#8b5cf6', background: '#0f0f0f' },
  },
  automotive: {
    aesthetic_style: 'neo_brutalism',
    emotional_trigger: 'empowerment',
    layer_0: { background: 'high_contrast', ambient_effect: 'geometric_shapes' },
    layer_1: { grid: 'split_screen', scroll: 'scroll_snap' },
    color_override: { primary: '#dc2626', background: '#fafafa' },
  },
  property: {
    aesthetic_style: 'minimalist_luxury',
    emotional_trigger: 'trust',
    layer_0: { background: 'elegant_gradient', ambient_effect: 'none' },
    layer_1: { grid: 'bento', scroll: 'smooth_parallax' },
    color_override: { primary: '#0369a1', background: '#ffffff' },
  },
  home_services: {
    aesthetic_style: 'organic_warmth',
    emotional_trigger: 'trust',
    layer_0: { background: 'warm_solid', ambient_effect: 'none' },
    layer_1: { grid: 'z_pattern', scroll: 'reveal_on_scroll' },
    color_override: { primary: '#16a34a', background: '#fafaf9' },
  },
};

// ============================================
// SYNTHEX DEFAULT CONCEPT
// ============================================

export const SYNTHEX_DEFAULT_CONCEPT: AuraConcept = {
  concept_name: 'Autonomous Sophistication',
  analogy:
    'This landing page experience should feel like interacting with a calm, intelligent system that already knows what you need',
  aesthetic_style: 'dark_mode_luxe',
  color_palette: {
    primary: '#ea580c',
    secondary: '#18181b',
    accent: '#f97316',
    background: '#0a0a0b',
    text: '#fafafa',
    muted: '#71717a',
  },
  typography: {
    header: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    accent: 'Source Serif 4, serif',
    style: 'Clean sans-serif with italic serif emphasis',
  },
  layer_architecture: {
    layer_0_atmosphere: {
      background: 'Subtle grid overlay at 80% opacity on deep black',
      ambient_effect: 'Faint gradient orbs (orange top-right, grey bottom-left)',
      cursor_reactivity: 'none',
    },
    layer_1_structure: {
      grid: 'fluid_12_column',
      scroll: 'smooth_parallax',
      navigation: 'sticky_top',
    },
    layer_2_narrative: {
      hero_visual: 'typography_hero',
      headline_treatment: 'static_bold',
      story_flow: 'problem_solution',
    },
    layer_3_engagement: {
      feature_presentation: 'floating_cards',
      social_proof: 'testimonial_carousel',
      cta_design: 'high_gloss',
    },
    layer_4_delight: {
      hover_states: 'scale_lift',
      transitions: 'ease_out_expo',
      custom_cursor: 'none',
    },
  },
  wow_factor: {
    name: 'Living Metrics Dashboard',
    description:
      'A small, elegant dashboard widget showing real-time marketing metrics updating - demonstrating the always-on nature of the autonomous system',
  },
  implementation_notes: {
    css_techniques: ['backdrop-filter', 'mix-blend-mode', 'scroll-snap-type', 'position: sticky'],
    js_libraries: ['framer-motion', 'lenis', 'gsap'],
    key_animations: ['stagger-fade-in', 'parallax-scroll', 'hover-lift', 'number-counter'],
  },
};

// ============================================
// AURA ENGINE CLASS
// ============================================

type ExecuteTaskFn = (
  taskType: TaskType,
  prompt: string,
  options?: { systemPrompt?: string }
) => Promise<{ content: string }>;

export class AuraEngine {
  private executeTask: ExecuteTaskFn;

  constructor(executeTaskFn: ExecuteTaskFn) {
    this.executeTask = executeTaskFn;
  }

  /**
   * Analyze a brand and extract psycho-aesthetic insights
   */
  async analyzeBrand(input: {
    brand_name: string;
    industry: string;
    target_audience: string;
    usp: string;
    conversion_goal: string;
    current_url?: string;
  }): Promise<BrandAnalysis> {
    const prompt = `You are Aura, an elite Digital Visionary Architect and Psycho-Aesthetic Strategist.

Analyze this brand and provide a psycho-aesthetic analysis:

Brand: ${input.brand_name}
Industry: ${input.industry}
Target Audience: ${input.target_audience}
USP: ${input.usp}
Conversion Goal: ${input.conversion_goal}
${input.current_url ? `Current Website: ${input.current_url}` : ''}

Provide your analysis as JSON with this exact structure:
{
  "brand_essence": ["keyword1", "keyword2", "keyword3"],
  "icp_aspiration": "What the ideal customer wants to become or feel by using this service",
  "emotional_trigger": "One of: trust, exclusivity, urgency, empowerment, serenity, innovation",
  "aesthetic_opportunity": "The visual direction that would differentiate this brand and captivate the target audience"
}

Focus on:
- The emotional outcome the customer seeks, not just functional benefits
- The gap between current industry norms and untapped visual opportunities
- The primary emotion that will drive the conversion goal`;

    const response = await this.executeTask('deep_strategy', prompt, {
      systemPrompt: 'You are Aura, an elite psycho-aesthetic strategist. Output only valid JSON.',
    });

    try {
      const analysis = JSON.parse(response.content);
      return analysis as BrandAnalysis;
    } catch {
      // Fallback to defaults based on industry
      const preset = INDUSTRY_PRESETS[input.industry] || INDUSTRY_PRESETS['tech_saas'];
      return {
        brand_essence: ['Innovation', 'Trust', 'Simplicity'],
        icp_aspiration:
          'To feel confident that their marketing is handled professionally without constant oversight',
        emotional_trigger: preset.emotional_trigger,
        aesthetic_opportunity: `Leverage ${preset.aesthetic_style} aesthetics to stand out in the ${input.industry} space`,
      };
    }
  }

  /**
   * Generate a full Aura concept for a landing page
   */
  async generateConcept(brandAnalysis: BrandAnalysis, industry: string): Promise<AuraConcept> {
    const preset = INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS['tech_saas'];
    const styleConfig = AESTHETIC_STYLES[preset.aesthetic_style];
    const triggerConfig = EMOTIONAL_TRIGGERS[brandAnalysis.emotional_trigger];

    const prompt = `You are Aura, an elite Digital Visionary Architect.

Based on this brand analysis, generate a landing page concept blueprint:

Brand Essence: ${brandAnalysis.brand_essence.join(', ')}
ICP Aspiration: ${brandAnalysis.icp_aspiration}
Emotional Trigger: ${brandAnalysis.emotional_trigger} - ${triggerConfig.description}
Aesthetic Style: ${preset.aesthetic_style} - ${styleConfig.description}

Generate a detailed concept as JSON:
{
  "concept_name": "An evocative 2-3 word name",
  "analogy": "This landing page experience should feel like...",
  "wow_factor": {
    "name": "Signature element name",
    "description": "One unique interactive element that elevates this design"
  },
  "implementation_notes": {
    "css_techniques": ["key CSS features to use"],
    "js_libraries": ["recommended libraries"],
    "key_animations": ["main animation patterns"]
  }
}

The analogy should be vivid and specific, like:
- "...walking into a silent, high-end art gallery"
- "...interacting with a sentient AI assistant"
- "...opening a precision-engineered device"`;

    const response = await this.executeTask('marketing_copy', prompt, {
      systemPrompt: 'You are Aura. Output only valid JSON.',
    });

    try {
      const generated = JSON.parse(response.content);

      // Merge with preset configuration
      return {
        concept_name: generated.concept_name || 'Modern Experience',
        analogy:
          generated.analogy || 'This experience should feel like interacting with a trusted expert',
        aesthetic_style: preset.aesthetic_style,
        color_palette: {
          primary: preset.color_override?.primary || styleConfig.default_palette.primary,
          secondary: '#18181b',
          accent: preset.color_override?.primary || styleConfig.default_palette.primary,
          background: preset.color_override?.background || styleConfig.default_palette.background,
          text: styleConfig.default_palette.text,
          muted: '#71717a',
        },
        typography: {
          header: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
          accent: 'Source Serif 4, serif',
          style: 'Clean sans-serif with italic serif emphasis',
        },
        layer_architecture: {
          layer_0_atmosphere: {
            background: preset.layer_0.background,
            ambient_effect: preset.layer_0.ambient_effect,
            cursor_reactivity: 'none',
          },
          layer_1_structure: {
            grid: preset.layer_1.grid,
            scroll: preset.layer_1.scroll,
            navigation: 'sticky_top',
          },
          layer_2_narrative: {
            hero_visual: 'typography_hero',
            headline_treatment: 'static_bold',
            story_flow: 'problem_solution',
          },
          layer_3_engagement: {
            feature_presentation: 'floating_cards',
            social_proof: 'testimonial_carousel',
            cta_design: 'high_gloss',
          },
          layer_4_delight: {
            hover_states: 'scale_lift',
            transitions: 'ease_out_expo',
            custom_cursor: 'none',
          },
        },
        wow_factor: generated.wow_factor || {
          name: 'Dynamic Proof Widget',
          description: 'Real-time display of recent results or activity',
        },
        implementation_notes: generated.implementation_notes || {
          css_techniques: ['backdrop-filter', 'scroll-snap-type'],
          js_libraries: ['framer-motion', 'gsap'],
          key_animations: ['stagger-fade-in', 'parallax-scroll'],
        },
      };
    } catch {
      // Return preset-based default
      return {
        ...SYNTHEX_DEFAULT_CONCEPT,
        aesthetic_style: preset.aesthetic_style,
        color_palette: {
          ...SYNTHEX_DEFAULT_CONCEPT.color_palette,
          primary:
            preset.color_override?.primary || SYNTHEX_DEFAULT_CONCEPT.color_palette.primary,
          background:
            preset.color_override?.background || SYNTHEX_DEFAULT_CONCEPT.color_palette.background,
        },
        layer_architecture: {
          ...SYNTHEX_DEFAULT_CONCEPT.layer_architecture,
          layer_0_atmosphere: {
            ...SYNTHEX_DEFAULT_CONCEPT.layer_architecture.layer_0_atmosphere,
            background: preset.layer_0.background,
            ambient_effect: preset.layer_0.ambient_effect,
          },
          layer_1_structure: {
            ...SYNTHEX_DEFAULT_CONCEPT.layer_architecture.layer_1_structure,
            grid: preset.layer_1.grid,
            scroll: preset.layer_1.scroll,
          },
        },
      };
    }
  }

  /**
   * Enhance a section with Aura layer architecture
   */
  async enhanceSection(
    sectionType: string,
    content: string,
    concept: AuraConcept
  ): Promise<EnhancedSection> {
    const layerConfig = this.getLayerConfigForSection(sectionType, concept.layer_architecture);

    const prompt = `You are Aura. Enhance this section with psycho-aesthetic direction:

Section Type: ${sectionType}
Aesthetic Style: ${concept.aesthetic_style}
Emotional Trigger: ${EMOTIONAL_TRIGGERS[concept.color_palette.primary as EmotionalTrigger]?.description || 'trust'}

Current Content:
${content}

Layer Configuration:
${JSON.stringify(layerConfig, null, 2)}

Provide enhancement as JSON:
{
  "visual_direction": "Specific visual approach for this section",
  "animation_suggestions": ["animation1", "animation2"],
  "interaction_patterns": ["interaction1", "interaction2"],
  "implementation_hints": ["hint1", "hint2"]
}`;

    const response = await this.executeTask('marketing_copy', prompt, {
      systemPrompt: 'You are Aura. Output only valid JSON.',
    });

    try {
      const enhanced = JSON.parse(response.content);
      return {
        section_type: sectionType,
        layer_config: layerConfig,
        visual_direction: enhanced.visual_direction || 'Follow established design system',
        animation_suggestions: enhanced.animation_suggestions || ['fade-in', 'stagger-reveal'],
        interaction_patterns: enhanced.interaction_patterns || ['hover-lift', 'click-feedback'],
        implementation_hints: enhanced.implementation_hints || [
          'Use framer-motion',
          'Keep animations subtle',
        ],
      };
    } catch {
      return {
        section_type: sectionType,
        layer_config: layerConfig,
        visual_direction: 'Follow established design system',
        animation_suggestions: ['fade-in', 'stagger-reveal'],
        interaction_patterns: ['hover-lift', 'click-feedback'],
        implementation_hints: ['Use framer-motion for animations', 'Keep transitions under 300ms'],
      };
    }
  }

  /**
   * Get layer configuration for a specific section
   */
  private getLayerConfigForSection(
    sectionType: string,
    architecture: LayerArchitecture
  ): Partial<LayerArchitecture> {
    const sectionLayers: Record<string, (keyof LayerArchitecture)[]> = {
      hero: ['layer_0_atmosphere', 'layer_2_narrative', 'layer_4_delight'],
      problem: ['layer_1_structure', 'layer_3_engagement'],
      features: ['layer_1_structure', 'layer_3_engagement', 'layer_4_delight'],
      process: ['layer_1_structure', 'layer_3_engagement'],
      testimonials: ['layer_3_engagement', 'layer_4_delight'],
      results: ['layer_3_engagement', 'layer_4_delight'],
      cta: ['layer_3_engagement', 'layer_4_delight'],
      faq: ['layer_1_structure', 'layer_3_engagement'],
    };

    const relevantLayers = sectionLayers[sectionType] || ['layer_1_structure', 'layer_3_engagement'];
    const config: Partial<LayerArchitecture> = {};

    for (const layer of relevantLayers) {
      config[layer] = architecture[layer];
    }

    return config;
  }

  /**
   * Get concept for industry (quick preset)
   */
  getPresetConcept(industry: string): AuraConcept {
    const preset = INDUSTRY_PRESETS[industry];
    if (!preset) {
      return SYNTHEX_DEFAULT_CONCEPT;
    }

    const styleConfig = AESTHETIC_STYLES[preset.aesthetic_style];

    return {
      ...SYNTHEX_DEFAULT_CONCEPT,
      aesthetic_style: preset.aesthetic_style,
      color_palette: {
        primary: preset.color_override?.primary || styleConfig.default_palette.primary,
        secondary: '#18181b',
        accent: preset.color_override?.primary || styleConfig.default_palette.primary,
        background: preset.color_override?.background || styleConfig.default_palette.background,
        text: styleConfig.default_palette.text,
        muted: '#71717a',
      },
      layer_architecture: {
        layer_0_atmosphere: {
          background: preset.layer_0.background,
          ambient_effect: preset.layer_0.ambient_effect,
          cursor_reactivity: 'none',
        },
        layer_1_structure: {
          grid: preset.layer_1.grid,
          scroll: preset.layer_1.scroll,
          navigation: 'sticky_top',
        },
        layer_2_narrative: {
          hero_visual: 'typography_hero',
          headline_treatment: 'static_bold',
          story_flow: 'problem_solution',
        },
        layer_3_engagement: {
          feature_presentation: 'floating_cards',
          social_proof: 'testimonial_carousel',
          cta_design: 'high_gloss',
        },
        layer_4_delight: {
          hover_states: 'scale_lift',
          transitions: 'ease_out_expo',
          custom_cursor: 'none',
        },
      },
    };
  }
}
