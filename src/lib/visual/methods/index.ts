/**
 * Visual Intelligence Methods Index
 * Phase 68: 30 design methods across UI/UX, ads, brand, motion, and conceptual visuals
 */

export type MethodCategory =
  | 'ui_ux'
  | 'advertising'
  | 'brand'
  | 'motion'
  | 'conceptual'
  | 'photography'
  | 'illustration';

export type MethodComplexity = 'simple' | 'moderate' | 'complex' | 'advanced';

export interface VisualMethod {
  id: string;
  name: string;
  category: MethodCategory;
  description: string;
  complexity: MethodComplexity;
  providers: string[];
  params: MethodParameter[];
  outputs: string[];
  estimated_time_seconds: number;
  cost_tier: 'low' | 'medium' | 'high' | 'premium';
  requires_approval: boolean;
}

export interface MethodParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file';
  required: boolean;
  default?: string | number | boolean;
  options?: string[];
  description: string;
}

// 30 Visual Intelligence Methods
export const VISUAL_METHODS: VisualMethod[] = [
  // UI/UX Methods (6)
  {
    id: 'hero_section_generator',
    name: 'Hero Section Generator',
    category: 'ui_ux',
    description: 'Generate hero section visuals with headline integration',
    complexity: 'moderate',
    providers: ['nano_banana', 'dalle', 'gemini'],
    params: [
      { name: 'headline', type: 'string', required: true, description: 'Main headline text' },
      { name: 'style', type: 'select', required: true, options: ['modern', 'minimal', 'bold', 'organic'], description: 'Visual style' },
      { name: 'color_scheme', type: 'color', required: false, description: 'Primary color' },
    ],
    outputs: ['hero_image', 'mobile_variant', 'tablet_variant'],
    estimated_time_seconds: 45,
    cost_tier: 'medium',
    requires_approval: true,
  },
  {
    id: 'icon_set_creator',
    name: 'Icon Set Creator',
    category: 'ui_ux',
    description: 'Generate consistent icon sets for UI',
    complexity: 'simple',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'icon_names', type: 'string', required: true, description: 'Comma-separated icon names' },
      { name: 'style', type: 'select', required: true, options: ['line', 'filled', 'duotone', 'gradient'], description: 'Icon style' },
      { name: 'size', type: 'number', required: false, default: 24, description: 'Icon size in pixels' },
    ],
    outputs: ['icon_set_svg', 'icon_set_png'],
    estimated_time_seconds: 30,
    cost_tier: 'low',
    requires_approval: false,
  },
  {
    id: 'dashboard_mockup',
    name: 'Dashboard Mockup Generator',
    category: 'ui_ux',
    description: 'Generate dashboard layout mockups with data visualization',
    complexity: 'complex',
    providers: ['gemini', 'dalle'],
    params: [
      { name: 'dashboard_type', type: 'select', required: true, options: ['analytics', 'crm', 'ecommerce', 'saas'], description: 'Dashboard type' },
      { name: 'widgets', type: 'string', required: true, description: 'Widget types to include' },
      { name: 'theme', type: 'select', required: true, options: ['light', 'dark', 'system'], description: 'Color theme' },
    ],
    outputs: ['desktop_mockup', 'component_library'],
    estimated_time_seconds: 60,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'button_style_generator',
    name: 'Button Style Generator',
    category: 'ui_ux',
    description: 'Generate button variants with hover states',
    complexity: 'simple',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'button_text', type: 'string', required: true, description: 'Button label' },
      { name: 'variant', type: 'select', required: true, options: ['primary', 'secondary', 'outline', 'ghost'], description: 'Button variant' },
    ],
    outputs: ['button_states', 'css_snippet'],
    estimated_time_seconds: 15,
    cost_tier: 'low',
    requires_approval: false,
  },
  {
    id: 'form_layout_designer',
    name: 'Form Layout Designer',
    category: 'ui_ux',
    description: 'Design form layouts with validation states',
    complexity: 'moderate',
    providers: ['gemini', 'dalle'],
    params: [
      { name: 'form_fields', type: 'string', required: true, description: 'Field names and types' },
      { name: 'layout', type: 'select', required: true, options: ['single_column', 'two_column', 'stepped'], description: 'Form layout' },
    ],
    outputs: ['form_mockup', 'validation_states'],
    estimated_time_seconds: 40,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'empty_state_illustrator',
    name: 'Empty State Illustrator',
    category: 'ui_ux',
    description: 'Create empty state illustrations for UI',
    complexity: 'simple',
    providers: ['dalle', 'nano_banana'],
    params: [
      { name: 'context', type: 'string', required: true, description: 'What is empty (inbox, search, etc.)' },
      { name: 'mood', type: 'select', required: true, options: ['friendly', 'professional', 'playful', 'minimal'], description: 'Illustration mood' },
    ],
    outputs: ['illustration_svg', 'illustration_png'],
    estimated_time_seconds: 25,
    cost_tier: 'low',
    requires_approval: false,
  },

  // Advertising Methods (6)
  {
    id: 'social_ad_creator',
    name: 'Social Ad Creator',
    category: 'advertising',
    description: 'Create platform-optimized social media ads',
    complexity: 'moderate',
    providers: ['nano_banana', 'dalle', 'gemini'],
    params: [
      { name: 'platform', type: 'select', required: true, options: ['facebook', 'instagram', 'linkedin', 'tiktok'], description: 'Target platform' },
      { name: 'headline', type: 'string', required: true, description: 'Ad headline' },
      { name: 'cta', type: 'string', required: true, description: 'Call to action' },
      { name: 'product_image', type: 'file', required: false, description: 'Product image to include' },
    ],
    outputs: ['ad_creative', 'platform_variants'],
    estimated_time_seconds: 50,
    cost_tier: 'medium',
    requires_approval: true,
  },
  {
    id: 'banner_ad_generator',
    name: 'Banner Ad Generator',
    category: 'advertising',
    description: 'Generate responsive banner ads in multiple sizes',
    complexity: 'moderate',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'sizes', type: 'string', required: true, description: 'Banner sizes (e.g., 300x250, 728x90)' },
      { name: 'message', type: 'string', required: true, description: 'Ad message' },
      { name: 'brand_colors', type: 'color', required: true, description: 'Brand color' },
    ],
    outputs: ['banner_set', 'animated_variants'],
    estimated_time_seconds: 45,
    cost_tier: 'medium',
    requires_approval: true,
  },
  {
    id: 'retargeting_creative',
    name: 'Retargeting Creative',
    category: 'advertising',
    description: 'Create personalized retargeting ad creatives',
    complexity: 'complex',
    providers: ['gemini', 'dalle', 'nano_banana'],
    params: [
      { name: 'product_feed', type: 'file', required: true, description: 'Product catalog' },
      { name: 'audience_segment', type: 'select', required: true, options: ['cart_abandoners', 'browsers', 'past_purchasers'], description: 'Target segment' },
    ],
    outputs: ['dynamic_creatives', 'template_set'],
    estimated_time_seconds: 90,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'video_ad_storyboard',
    name: 'Video Ad Storyboard',
    category: 'advertising',
    description: 'Generate video ad storyboards with scene breakdowns',
    complexity: 'complex',
    providers: ['gemini', 'veo3'],
    params: [
      { name: 'duration', type: 'select', required: true, options: ['6s', '15s', '30s', '60s'], description: 'Video duration' },
      { name: 'script', type: 'string', required: true, description: 'Video script' },
      { name: 'style', type: 'select', required: true, options: ['cinematic', 'animated', 'ugc', 'product_demo'], description: 'Video style' },
    ],
    outputs: ['storyboard', 'scene_descriptions', 'shot_list'],
    estimated_time_seconds: 120,
    cost_tier: 'premium',
    requires_approval: true,
  },
  {
    id: 'carousel_ad_builder',
    name: 'Carousel Ad Builder',
    category: 'advertising',
    description: 'Build multi-card carousel ads',
    complexity: 'moderate',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'card_count', type: 'number', required: true, default: 5, description: 'Number of cards' },
      { name: 'narrative', type: 'string', required: true, description: 'Story across cards' },
    ],
    outputs: ['carousel_cards', 'unified_theme'],
    estimated_time_seconds: 60,
    cost_tier: 'medium',
    requires_approval: true,
  },
  {
    id: 'email_header_designer',
    name: 'Email Header Designer',
    category: 'advertising',
    description: 'Design email headers and hero images',
    complexity: 'simple',
    providers: ['dalle', 'nano_banana'],
    params: [
      { name: 'campaign_type', type: 'select', required: true, options: ['promotional', 'newsletter', 'transactional', 'welcome'], description: 'Email type' },
      { name: 'headline', type: 'string', required: true, description: 'Email headline' },
    ],
    outputs: ['header_image', 'mobile_header'],
    estimated_time_seconds: 30,
    cost_tier: 'low',
    requires_approval: false,
  },

  // Brand Methods (6)
  {
    id: 'logo_concept_generator',
    name: 'Logo Concept Generator',
    category: 'brand',
    description: 'Generate logo concepts from brand brief',
    complexity: 'complex',
    providers: ['gemini', 'dalle', 'nano_banana'],
    params: [
      { name: 'brand_name', type: 'string', required: true, description: 'Brand name' },
      { name: 'industry', type: 'string', required: true, description: 'Industry/sector' },
      { name: 'style', type: 'select', required: true, options: ['wordmark', 'lettermark', 'pictorial', 'abstract', 'mascot'], description: 'Logo type' },
      { name: 'values', type: 'string', required: true, description: 'Brand values' },
    ],
    outputs: ['logo_concepts', 'color_variations', 'usage_guide'],
    estimated_time_seconds: 90,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'brand_pattern_creator',
    name: 'Brand Pattern Creator',
    category: 'brand',
    description: 'Create seamless brand patterns',
    complexity: 'moderate',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'pattern_type', type: 'select', required: true, options: ['geometric', 'organic', 'abstract', 'illustrative'], description: 'Pattern style' },
      { name: 'brand_elements', type: 'string', required: true, description: 'Elements to incorporate' },
    ],
    outputs: ['pattern_tile', 'usage_examples'],
    estimated_time_seconds: 40,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'color_palette_extractor',
    name: 'Color Palette Extractor',
    category: 'brand',
    description: 'Extract and expand color palettes from images',
    complexity: 'simple',
    providers: ['gemini', 'perplexity'],
    params: [
      { name: 'source_image', type: 'file', required: true, description: 'Source image' },
      { name: 'palette_size', type: 'number', required: false, default: 5, description: 'Number of colors' },
    ],
    outputs: ['color_palette', 'accessibility_report', 'tints_shades'],
    estimated_time_seconds: 20,
    cost_tier: 'low',
    requires_approval: false,
  },
  {
    id: 'brand_mockup_generator',
    name: 'Brand Mockup Generator',
    category: 'brand',
    description: 'Generate brand application mockups',
    complexity: 'moderate',
    providers: ['dalle', 'nano_banana'],
    params: [
      { name: 'mockup_type', type: 'select', required: true, options: ['stationery', 'signage', 'packaging', 'merchandise', 'digital'], description: 'Mockup category' },
      { name: 'brand_assets', type: 'file', required: true, description: 'Brand assets to apply' },
    ],
    outputs: ['mockup_set', 'presentation_deck'],
    estimated_time_seconds: 50,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'typography_pairing',
    name: 'Typography Pairing Suggester',
    category: 'brand',
    description: 'Suggest typography pairings for brand',
    complexity: 'simple',
    providers: ['gemini', 'perplexity'],
    params: [
      { name: 'brand_personality', type: 'select', required: true, options: ['professional', 'playful', 'elegant', 'bold', 'minimal'], description: 'Brand personality' },
      { name: 'use_case', type: 'select', required: true, options: ['web', 'print', 'both'], description: 'Primary use case' },
    ],
    outputs: ['font_pairings', 'sample_layouts', 'css_imports'],
    estimated_time_seconds: 15,
    cost_tier: 'low',
    requires_approval: false,
  },
  {
    id: 'brand_guideline_generator',
    name: 'Brand Guideline Generator',
    category: 'brand',
    description: 'Generate comprehensive brand guidelines',
    complexity: 'advanced',
    providers: ['gemini', 'dalle', 'nano_banana'],
    params: [
      { name: 'brand_assets', type: 'file', required: true, description: 'All brand assets' },
      { name: 'brand_voice', type: 'string', required: true, description: 'Brand voice description' },
    ],
    outputs: ['guideline_pdf', 'asset_library', 'do_dont_examples'],
    estimated_time_seconds: 180,
    cost_tier: 'premium',
    requires_approval: true,
  },

  // Motion Methods (6)
  {
    id: 'logo_animation',
    name: 'Logo Animation Creator',
    category: 'motion',
    description: 'Create animated logo reveals',
    complexity: 'moderate',
    providers: ['veo3', 'gemini'],
    params: [
      { name: 'logo', type: 'file', required: true, description: 'Logo file' },
      { name: 'duration', type: 'number', required: false, default: 3, description: 'Animation duration (seconds)' },
      { name: 'style', type: 'select', required: true, options: ['elegant', 'dynamic', 'playful', 'minimal'], description: 'Animation style' },
    ],
    outputs: ['animation_mp4', 'animation_gif', 'lottie_json'],
    estimated_time_seconds: 60,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'social_motion_graphics',
    name: 'Social Motion Graphics',
    category: 'motion',
    description: 'Create motion graphics for social media',
    complexity: 'moderate',
    providers: ['veo3', 'dalle'],
    params: [
      { name: 'platform', type: 'select', required: true, options: ['instagram_stories', 'tiktok', 'youtube_shorts', 'facebook_reels'], description: 'Target platform' },
      { name: 'content', type: 'string', required: true, description: 'Content to animate' },
    ],
    outputs: ['motion_video', 'template_file'],
    estimated_time_seconds: 75,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'kinetic_typography',
    name: 'Kinetic Typography',
    category: 'motion',
    description: 'Create animated text sequences',
    complexity: 'complex',
    providers: ['veo3', 'gemini'],
    params: [
      { name: 'text', type: 'string', required: true, description: 'Text to animate' },
      { name: 'timing', type: 'string', required: false, description: 'Timing cues' },
      { name: 'audio', type: 'file', required: false, description: 'Audio to sync with' },
    ],
    outputs: ['kinetic_video', 'timing_markers'],
    estimated_time_seconds: 90,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'ui_microinteraction',
    name: 'UI Microinteraction Designer',
    category: 'motion',
    description: 'Design UI microinteractions and transitions',
    complexity: 'moderate',
    providers: ['gemini', 'veo3'],
    params: [
      { name: 'interaction_type', type: 'select', required: true, options: ['button', 'loading', 'success', 'error', 'navigation'], description: 'Interaction type' },
      { name: 'duration', type: 'number', required: false, default: 300, description: 'Duration in ms' },
    ],
    outputs: ['animation_spec', 'lottie_file', 'css_animation'],
    estimated_time_seconds: 35,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'product_showcase_video',
    name: 'Product Showcase Video',
    category: 'motion',
    description: 'Create product showcase animations',
    complexity: 'advanced',
    providers: ['veo3', 'dalle', 'gemini'],
    params: [
      { name: 'product_images', type: 'file', required: true, description: 'Product images' },
      { name: 'features', type: 'string', required: true, description: 'Features to highlight' },
      { name: 'style', type: 'select', required: true, options: ['3d_rotate', 'flat_motion', 'explainer', 'lifestyle'], description: 'Video style' },
    ],
    outputs: ['showcase_video', 'scene_breakdowns'],
    estimated_time_seconds: 150,
    cost_tier: 'premium',
    requires_approval: true,
  },
  {
    id: 'transition_pack_creator',
    name: 'Transition Pack Creator',
    category: 'motion',
    description: 'Create branded transition packs',
    complexity: 'moderate',
    providers: ['veo3', 'gemini'],
    params: [
      { name: 'brand_elements', type: 'file', required: true, description: 'Brand elements' },
      { name: 'count', type: 'number', required: false, default: 10, description: 'Number of transitions' },
    ],
    outputs: ['transition_pack', 'usage_examples'],
    estimated_time_seconds: 80,
    cost_tier: 'high',
    requires_approval: false,
  },

  // Conceptual Methods (6)
  {
    id: 'mood_board_generator',
    name: 'Mood Board Generator',
    category: 'conceptual',
    description: 'Generate comprehensive mood boards',
    complexity: 'moderate',
    providers: ['gemini', 'dalle', 'perplexity', 'jina'],
    params: [
      { name: 'concept', type: 'string', required: true, description: 'Creative concept' },
      { name: 'mood', type: 'string', required: true, description: 'Desired mood/feeling' },
      { name: 'references', type: 'file', required: false, description: 'Reference images' },
    ],
    outputs: ['mood_board', 'color_story', 'texture_samples'],
    estimated_time_seconds: 60,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'concept_art_generator',
    name: 'Concept Art Generator',
    category: 'conceptual',
    description: 'Generate concept art from descriptions',
    complexity: 'complex',
    providers: ['nano_banana', 'dalle', 'gemini'],
    params: [
      { name: 'description', type: 'string', required: true, description: 'Detailed description' },
      { name: 'art_style', type: 'select', required: true, options: ['realistic', 'stylized', 'painterly', 'digital_art'], description: 'Art style' },
      { name: 'perspective', type: 'select', required: false, options: ['front', 'side', '3/4', 'birds_eye'], description: 'View angle' },
    ],
    outputs: ['concept_art', 'variations', 'detail_callouts'],
    estimated_time_seconds: 75,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'style_transfer',
    name: 'Style Transfer Engine',
    category: 'conceptual',
    description: 'Apply artistic styles to images',
    complexity: 'moderate',
    providers: ['dalle', 'gemini'],
    params: [
      { name: 'source_image', type: 'file', required: true, description: 'Image to transform' },
      { name: 'style_reference', type: 'file', required: true, description: 'Style reference image' },
      { name: 'strength', type: 'number', required: false, default: 75, description: 'Style strength (0-100)' },
    ],
    outputs: ['styled_image', 'comparison'],
    estimated_time_seconds: 45,
    cost_tier: 'medium',
    requires_approval: false,
  },
  {
    id: 'scene_compositor',
    name: 'Scene Compositor',
    category: 'conceptual',
    description: 'Composite multiple elements into scenes',
    complexity: 'complex',
    providers: ['gemini', 'dalle', 'nano_banana'],
    params: [
      { name: 'elements', type: 'file', required: true, description: 'Elements to composite' },
      { name: 'scene_description', type: 'string', required: true, description: 'Scene description' },
      { name: 'lighting', type: 'select', required: false, options: ['natural', 'studio', 'dramatic', 'soft'], description: 'Lighting style' },
    ],
    outputs: ['composed_scene', 'layer_breakdown'],
    estimated_time_seconds: 90,
    cost_tier: 'high',
    requires_approval: true,
  },
  {
    id: 'inspiration_pack_builder',
    name: 'Inspiration Pack Builder',
    category: 'conceptual',
    description: 'Build curated inspiration packs',
    complexity: 'moderate',
    providers: ['perplexity', 'jina', 'gemini'],
    params: [
      { name: 'topic', type: 'string', required: true, description: 'Topic to research' },
      { name: 'sources', type: 'select', required: true, options: ['dribbble', 'behance', 'pinterest', 'unsplash', 'all'], description: 'Inspiration sources' },
    ],
    outputs: ['inspiration_pack', 'trend_analysis', 'curated_links'],
    estimated_time_seconds: 40,
    cost_tier: 'low',
    requires_approval: false,
  },
  {
    id: 'visual_metaphor_creator',
    name: 'Visual Metaphor Creator',
    category: 'conceptual',
    description: 'Create visual metaphors for abstract concepts',
    complexity: 'advanced',
    providers: ['gemini', 'dalle', 'nano_banana'],
    params: [
      { name: 'concept', type: 'string', required: true, description: 'Abstract concept' },
      { name: 'context', type: 'string', required: true, description: 'Usage context' },
      { name: 'style', type: 'select', required: true, options: ['photographic', 'illustrative', 'iconic', 'surreal'], description: 'Visual style' },
    ],
    outputs: ['metaphor_visuals', 'concept_explanation'],
    estimated_time_seconds: 70,
    cost_tier: 'high',
    requires_approval: true,
  },
];

// Helper functions
export function getMethodsByCategory(category: MethodCategory): VisualMethod[] {
  return VISUAL_METHODS.filter(m => m.category === category);
}

export function getMethodById(id: string): VisualMethod | undefined {
  return VISUAL_METHODS.find(m => m.id === id);
}

export function getMethodsByComplexity(complexity: MethodComplexity): VisualMethod[] {
  return VISUAL_METHODS.filter(m => m.complexity === complexity);
}

export function getMethodsByProvider(provider: string): VisualMethod[] {
  return VISUAL_METHODS.filter(m => m.providers.includes(provider));
}

export function getApprovalRequiredMethods(): VisualMethod[] {
  return VISUAL_METHODS.filter(m => m.requires_approval);
}

export function estimateTotalCost(methodIds: string[]): { tier: string; estimated_range: string } {
  const methods = methodIds.map(id => getMethodById(id)).filter(Boolean) as VisualMethod[];
  const tiers = methods.map(m => m.cost_tier);

  if (tiers.includes('premium')) {
return { tier: 'premium', estimated_range: '$5-15' };
}
  if (tiers.filter(t => t === 'high').length > 2) {
return { tier: 'high', estimated_range: '$2-8' };
}
  if (tiers.includes('high')) {
return { tier: 'medium-high', estimated_range: '$1-5' };
}
  if (tiers.includes('medium')) {
return { tier: 'medium', estimated_range: '$0.50-2' };
}
  return { tier: 'low', estimated_range: '$0.10-0.50' };
}

export default VISUAL_METHODS;
