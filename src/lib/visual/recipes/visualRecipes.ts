/**
 * Visual Recipes
 * Phase 68: Pre-built visual generation recipes and inspiration packs
 */

export interface VisualRecipe {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  estimated_cost: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  outputs: RecipeOutput[];
  tags: string[];
  preview_url?: string;
}

export type RecipeCategory =
  | 'social_media'
  | 'advertising'
  | 'brand_identity'
  | 'motion_graphics'
  | 'presentations'
  | 'email_marketing'
  | 'product_visuals'
  | 'seasonal_campaigns';

export interface RecipeIngredient {
  id: string;
  name: string;
  type: 'asset' | 'text' | 'color' | 'font' | 'style_reference';
  required: boolean;
  description: string;
  example?: string;
}

export interface RecipeStep {
  step_number: number;
  method_id: string;
  name: string;
  description: string;
  inputs: Record<string, string>;
  outputs: string[];
  tips?: string[];
}

export interface RecipeOutput {
  name: string;
  format: string;
  dimensions?: { width: number; height: number };
  platforms?: string[];
}

export interface InspirationPack {
  id: string;
  name: string;
  theme: string;
  description: string;
  mood_keywords: string[];
  color_palette: string[];
  typography_suggestions: string[];
  reference_images: ReferenceImage[];
  style_notes: string[];
  use_cases: string[];
}

export interface ReferenceImage {
  url: string;
  description: string;
  source: string;
  style_elements: string[];
}

// Pre-built visual recipes
export const VISUAL_RECIPES: VisualRecipe[] = [
  {
    id: 'social_campaign_starter',
    name: 'Social Campaign Starter',
    description: 'Complete social media campaign assets for all major platforms',
    category: 'social_media',
    difficulty: 'intermediate',
    estimated_time_minutes: 30,
    estimated_cost: 0.50,
    ingredients: [
      { id: 'campaign_headline', name: 'Campaign Headline', type: 'text', required: true, description: 'Main campaign message', example: 'Summer Sale - Up to 50% Off' },
      { id: 'brand_colors', name: 'Brand Colors', type: 'color', required: true, description: 'Primary and secondary brand colors' },
      { id: 'product_image', name: 'Product Image', type: 'asset', required: false, description: 'Hero product or service image' },
      { id: 'logo', name: 'Logo', type: 'asset', required: true, description: 'Brand logo file' },
    ],
    steps: [
      {
        step_number: 1,
        method_id: 'hero_section_generator',
        name: 'Generate Hero Visual',
        description: 'Create the main campaign visual',
        inputs: { headline: 'campaign_headline', color_scheme: 'brand_colors' },
        outputs: ['hero_image'],
        tips: ['Keep text minimal', 'Use high contrast for readability'],
      },
      {
        step_number: 2,
        method_id: 'social_ad_creator',
        name: 'Create Platform Variants',
        description: 'Generate platform-specific versions',
        inputs: { platform: 'all', headline: 'campaign_headline' },
        outputs: ['facebook_ad', 'instagram_ad', 'linkedin_ad'],
      },
      {
        step_number: 3,
        method_id: 'social_motion_graphics',
        name: 'Create Story Animation',
        description: 'Generate animated story content',
        inputs: { platform: 'instagram_stories', content: 'campaign_headline' },
        outputs: ['story_video'],
      },
    ],
    outputs: [
      { name: 'Hero Image', format: 'png', dimensions: { width: 1200, height: 628 } },
      { name: 'Facebook Post', format: 'png', dimensions: { width: 1080, height: 1080 }, platforms: ['facebook'] },
      { name: 'Instagram Post', format: 'png', dimensions: { width: 1080, height: 1350 }, platforms: ['instagram'] },
      { name: 'LinkedIn Post', format: 'png', dimensions: { width: 1200, height: 627 }, platforms: ['linkedin'] },
      { name: 'Story Video', format: 'mp4', dimensions: { width: 1080, height: 1920 }, platforms: ['instagram', 'facebook'] },
    ],
    tags: ['social', 'campaign', 'multi-platform', 'advertising'],
  },
  {
    id: 'brand_launch_kit',
    name: 'Brand Launch Kit',
    description: 'Complete brand identity assets for launch',
    category: 'brand_identity',
    difficulty: 'advanced',
    estimated_time_minutes: 60,
    estimated_cost: 2.00,
    ingredients: [
      { id: 'brand_name', name: 'Brand Name', type: 'text', required: true, description: 'Company or product name' },
      { id: 'industry', name: 'Industry', type: 'text', required: true, description: 'Business sector', example: 'Technology, Healthcare, Retail' },
      { id: 'brand_values', name: 'Brand Values', type: 'text', required: true, description: '3-5 core values', example: 'Innovation, Trust, Simplicity' },
      { id: 'target_audience', name: 'Target Audience', type: 'text', required: true, description: 'Primary customer profile' },
    ],
    steps: [
      {
        step_number: 1,
        method_id: 'logo_concept_generator',
        name: 'Generate Logo Concepts',
        description: 'Create multiple logo options',
        inputs: { brand_name: 'brand_name', industry: 'industry', values: 'brand_values' },
        outputs: ['logo_concepts'],
      },
      {
        step_number: 2,
        method_id: 'color_palette_extractor',
        name: 'Define Color Palette',
        description: 'Create brand color system',
        inputs: { source_image: 'logo_concepts' },
        outputs: ['color_palette'],
      },
      {
        step_number: 3,
        method_id: 'typography_pairing',
        name: 'Select Typography',
        description: 'Choose complementary fonts',
        inputs: { brand_personality: 'brand_values' },
        outputs: ['font_pairings'],
      },
      {
        step_number: 4,
        method_id: 'brand_pattern_creator',
        name: 'Create Brand Pattern',
        description: 'Design supporting pattern',
        inputs: { pattern_type: 'abstract', brand_elements: 'logo_concepts' },
        outputs: ['brand_pattern'],
      },
      {
        step_number: 5,
        method_id: 'brand_mockup_generator',
        name: 'Generate Mockups',
        description: 'Show brand in context',
        inputs: { mockup_type: 'stationery', brand_assets: 'all' },
        outputs: ['mockup_set'],
      },
    ],
    outputs: [
      { name: 'Logo Package', format: 'svg' },
      { name: 'Color Palette', format: 'pdf' },
      { name: 'Typography Guide', format: 'pdf' },
      { name: 'Brand Pattern', format: 'png' },
      { name: 'Stationery Mockups', format: 'png' },
    ],
    tags: ['brand', 'identity', 'launch', 'complete-kit'],
  },
  {
    id: 'product_showcase_pack',
    name: 'Product Showcase Pack',
    description: 'Complete product visuals for e-commerce and marketing',
    category: 'product_visuals',
    difficulty: 'intermediate',
    estimated_time_minutes: 45,
    estimated_cost: 1.50,
    ingredients: [
      { id: 'product_images', name: 'Product Images', type: 'asset', required: true, description: 'Raw product photos' },
      { id: 'product_name', name: 'Product Name', type: 'text', required: true, description: 'Product title' },
      { id: 'key_features', name: 'Key Features', type: 'text', required: true, description: '3-5 main features', example: 'Wireless, 24h Battery, Noise Canceling' },
      { id: 'brand_style', name: 'Brand Style', type: 'style_reference', required: false, description: 'Style guide reference' },
    ],
    steps: [
      {
        step_number: 1,
        method_id: 'scene_compositor',
        name: 'Create Hero Scene',
        description: 'Composite product into lifestyle scene',
        inputs: { elements: 'product_images', scene_description: 'lifestyle context' },
        outputs: ['hero_scene'],
      },
      {
        step_number: 2,
        method_id: 'carousel_ad_builder',
        name: 'Build Feature Carousel',
        description: 'Create carousel highlighting features',
        inputs: { card_count: '5', narrative: 'key_features' },
        outputs: ['carousel_cards'],
      },
      {
        step_number: 3,
        method_id: 'product_showcase_video',
        name: 'Generate Showcase Video',
        description: 'Create animated product video',
        inputs: { product_images: 'product_images', features: 'key_features' },
        outputs: ['showcase_video'],
      },
    ],
    outputs: [
      { name: 'Hero Scene', format: 'png', dimensions: { width: 1200, height: 900 } },
      { name: 'Feature Carousel', format: 'png', platforms: ['instagram', 'facebook'] },
      { name: 'Showcase Video', format: 'mp4', dimensions: { width: 1080, height: 1080 } },
    ],
    tags: ['product', 'ecommerce', 'showcase', 'marketing'],
  },
  {
    id: 'email_campaign_suite',
    name: 'Email Campaign Suite',
    description: 'Complete email marketing visual assets',
    category: 'email_marketing',
    difficulty: 'beginner',
    estimated_time_minutes: 20,
    estimated_cost: 0.30,
    ingredients: [
      { id: 'campaign_message', name: 'Campaign Message', type: 'text', required: true, description: 'Main email message' },
      { id: 'cta_text', name: 'CTA Text', type: 'text', required: true, description: 'Call to action', example: 'Shop Now, Learn More' },
      { id: 'brand_colors', name: 'Brand Colors', type: 'color', required: true, description: 'Email color scheme' },
      { id: 'logo', name: 'Logo', type: 'asset', required: true, description: 'Brand logo' },
    ],
    steps: [
      {
        step_number: 1,
        method_id: 'email_header_designer',
        name: 'Design Email Header',
        description: 'Create email header/hero image',
        inputs: { campaign_type: 'promotional', headline: 'campaign_message' },
        outputs: ['header_image'],
      },
      {
        step_number: 2,
        method_id: 'button_style_generator',
        name: 'Create CTA Button',
        description: 'Design email CTA button',
        inputs: { button_text: 'cta_text', variant: 'primary' },
        outputs: ['cta_button'],
      },
    ],
    outputs: [
      { name: 'Email Header', format: 'png', dimensions: { width: 600, height: 200 } },
      { name: 'Mobile Header', format: 'png', dimensions: { width: 320, height: 150 } },
      { name: 'CTA Button', format: 'png' },
    ],
    tags: ['email', 'marketing', 'newsletter', 'promotional'],
  },
  {
    id: 'holiday_campaign_bundle',
    name: 'Holiday Campaign Bundle',
    description: 'Seasonal campaign assets with festive themes',
    category: 'seasonal_campaigns',
    difficulty: 'intermediate',
    estimated_time_minutes: 40,
    estimated_cost: 0.80,
    ingredients: [
      { id: 'holiday', name: 'Holiday/Season', type: 'text', required: true, description: 'Holiday name', example: 'Christmas, Black Friday, Summer' },
      { id: 'promotion', name: 'Promotion Details', type: 'text', required: true, description: 'Offer details', example: '25% Off, Free Shipping' },
      { id: 'brand_assets', name: 'Brand Assets', type: 'asset', required: true, description: 'Logo and brand elements' },
    ],
    steps: [
      {
        step_number: 1,
        method_id: 'mood_board_generator',
        name: 'Generate Mood Board',
        description: 'Create seasonal mood board for reference',
        inputs: { concept: 'holiday', mood: 'festive' },
        outputs: ['mood_board'],
      },
      {
        step_number: 2,
        method_id: 'social_ad_creator',
        name: 'Create Social Ads',
        description: 'Generate platform-specific holiday ads',
        inputs: { platform: 'all', headline: 'promotion' },
        outputs: ['social_ads'],
      },
      {
        step_number: 3,
        method_id: 'banner_ad_generator',
        name: 'Create Banner Set',
        description: 'Generate web banners in multiple sizes',
        inputs: { sizes: '300x250,728x90,160x600', message: 'promotion' },
        outputs: ['banner_set'],
      },
    ],
    outputs: [
      { name: 'Mood Board', format: 'pdf' },
      { name: 'Social Ads', format: 'png', platforms: ['facebook', 'instagram', 'linkedin'] },
      { name: 'Banner Set', format: 'png' },
    ],
    tags: ['holiday', 'seasonal', 'campaign', 'festive'],
  },
];

// Inspiration packs
export const INSPIRATION_PACKS: InspirationPack[] = [
  {
    id: 'minimalist_tech',
    name: 'Minimalist Tech',
    theme: 'Clean, modern technology aesthetic',
    description: 'Sleek, minimal designs perfect for tech products and SaaS',
    mood_keywords: ['clean', 'modern', 'professional', 'innovative', 'precise'],
    color_palette: ['#000000', '#FFFFFF', '#0066FF', '#F5F5F5', '#333333'],
    typography_suggestions: ['Inter', 'SF Pro Display', 'Helvetica Neue'],
    reference_images: [
      { url: '', description: 'Floating device mockup', source: 'Apple', style_elements: ['floating', 'shadow', 'gradient-bg'] },
      { url: '', description: 'Clean dashboard UI', source: 'Stripe', style_elements: ['cards', 'whitespace', 'data-viz'] },
    ],
    style_notes: [
      'Generous whitespace',
      'Subtle shadows and depth',
      'Monochromatic with accent colors',
      'Grid-based layouts',
    ],
    use_cases: ['SaaS products', 'Tech startups', 'Developer tools', 'Fintech'],
  },
  {
    id: 'vibrant_lifestyle',
    name: 'Vibrant Lifestyle',
    theme: 'Energetic, colorful lifestyle brands',
    description: 'Bold colors and dynamic compositions for lifestyle and wellness brands',
    mood_keywords: ['energetic', 'playful', 'youthful', 'dynamic', 'optimistic'],
    color_palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
    typography_suggestions: ['Poppins', 'Montserrat', 'Nunito'],
    reference_images: [
      { url: '', description: 'Colorful gradient background', source: 'Headspace', style_elements: ['gradients', 'organic-shapes'] },
      { url: '', description: 'Dynamic lifestyle photo', source: 'Nike', style_elements: ['action', 'emotion', 'cropping'] },
    ],
    style_notes: [
      'Bold color combinations',
      'Organic shapes and curves',
      'Dynamic photography',
      'Hand-drawn elements',
    ],
    use_cases: ['Fitness brands', 'Food & beverage', 'Lifestyle apps', 'Youth marketing'],
  },
  {
    id: 'luxury_elegance',
    name: 'Luxury Elegance',
    theme: 'Sophisticated, premium brand aesthetic',
    description: 'Refined designs for luxury and premium brands',
    mood_keywords: ['sophisticated', 'elegant', 'premium', 'refined', 'exclusive'],
    color_palette: ['#1A1A1A', '#D4AF37', '#F5F5DC', '#2C2C2C', '#FFFFFF'],
    typography_suggestions: ['Playfair Display', 'Didot', 'Cormorant Garamond'],
    reference_images: [
      { url: '', description: 'Minimalist luxury product shot', source: 'Chanel', style_elements: ['negative-space', 'symmetry'] },
      { url: '', description: 'Elegant editorial layout', source: 'Vogue', style_elements: ['typography', 'grid', 'contrast'] },
    ],
    style_notes: [
      'Serif typography',
      'Gold and black accents',
      'Generous negative space',
      'Subtle textures',
    ],
    use_cases: ['Luxury goods', 'High-end fashion', 'Premium services', 'Jewelry'],
  },
  {
    id: 'organic_natural',
    name: 'Organic Natural',
    theme: 'Earth-toned, natural brand aesthetic',
    description: 'Warm, natural designs for eco-friendly and wellness brands',
    mood_keywords: ['natural', 'organic', 'warm', 'sustainable', 'authentic'],
    color_palette: ['#8B7355', '#D4C5B9', '#5C4033', '#F5E6D3', '#A67C52'],
    typography_suggestions: ['Lora', 'Source Serif Pro', 'Merriweather'],
    reference_images: [
      { url: '', description: 'Natural textures and materials', source: 'Aesop', style_elements: ['textures', 'earth-tones'] },
      { url: '', description: 'Botanical illustrations', source: 'The Body Shop', style_elements: ['illustration', 'botanical'] },
    ],
    style_notes: [
      'Earth tone palette',
      'Natural textures (paper, wood, stone)',
      'Hand-crafted elements',
      'Botanical motifs',
    ],
    use_cases: ['Organic products', 'Wellness brands', 'Sustainable fashion', 'Natural beauty'],
  },
];

// Helper functions
export function getRecipeById(id: string): VisualRecipe | undefined {
  return VISUAL_RECIPES.find(r => r.id === id);
}

export function getRecipesByCategory(category: RecipeCategory): VisualRecipe[] {
  return VISUAL_RECIPES.filter(r => r.category === category);
}

export function getRecipesByDifficulty(difficulty: VisualRecipe['difficulty']): VisualRecipe[] {
  return VISUAL_RECIPES.filter(r => r.difficulty === difficulty);
}

export function getInspirationPackById(id: string): InspirationPack | undefined {
  return INSPIRATION_PACKS.find(p => p.id === id);
}

export function searchRecipes(query: string): VisualRecipe[] {
  const lower = query.toLowerCase();
  return VISUAL_RECIPES.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.description.toLowerCase().includes(lower) ||
    r.tags.some(t => t.includes(lower))
  );
}

export function estimateRecipeCost(recipeId: string): { time: number; cost: number } {
  const recipe = getRecipeById(recipeId);
  if (!recipe) {
return { time: 0, cost: 0 };
}

  return {
    time: recipe.estimated_time_minutes,
    cost: recipe.estimated_cost,
  };
}

export default { VISUAL_RECIPES, INSPIRATION_PACKS };
