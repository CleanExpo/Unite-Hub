/**
 * Method Categories
 * Phase 69: Define method groupings for visual intelligence
 */

export type MethodCategoryId =
  | 'hero'
  | 'brand_panel'
  | 'social_set'
  | 'thumbnail'
  | 'carousel'
  | 'storyboard'
  | 'motion_study'
  | 'icon_system'
  | 'data_viz'
  | 'infographic'
  | 'photography'
  | 'illustration'
  | 'typography'
  | 'layout'
  | 'pattern'
  | 'mockup'
  | 'animation'
  | 'video'
  | 'audio_visual'
  | 'interactive';

export interface MethodCategory {
  id: MethodCategoryId;
  name: string;
  description: string;
  icon: string;
  color: string;
  typical_outputs: string[];
  complexity_range: [number, number];
}

export const METHOD_CATEGORIES: Record<MethodCategoryId, MethodCategory> = {
  hero: {
    id: 'hero',
    name: 'Hero Visuals',
    description: 'Primary campaign visuals and key art',
    icon: 'Star',
    color: '#FF6B6B',
    typical_outputs: ['hero_image', 'key_art', 'banner'],
    complexity_range: [2, 4],
  },
  brand_panel: {
    id: 'brand_panel',
    name: 'Brand Panels',
    description: 'Brand identity and guideline assets',
    icon: 'Palette',
    color: '#4ECDC4',
    typical_outputs: ['brand_board', 'style_tile', 'moodboard'],
    complexity_range: [3, 5],
  },
  social_set: {
    id: 'social_set',
    name: 'Social Sets',
    description: 'Platform-optimized social media assets',
    icon: 'Share2',
    color: '#45B7D1',
    typical_outputs: ['feed_post', 'story', 'cover'],
    complexity_range: [1, 3],
  },
  thumbnail: {
    id: 'thumbnail',
    name: 'Thumbnails',
    description: 'Video and content thumbnails',
    icon: 'Image',
    color: '#96CEB4',
    typical_outputs: ['video_thumb', 'article_thumb', 'preview'],
    complexity_range: [1, 2],
  },
  carousel: {
    id: 'carousel',
    name: 'Carousels',
    description: 'Multi-slide carousel content',
    icon: 'Layers',
    color: '#FFEAA7',
    typical_outputs: ['carousel_set', 'slide_deck', 'swipe_series'],
    complexity_range: [2, 4],
  },
  storyboard: {
    id: 'storyboard',
    name: 'Storyboards',
    description: 'Video and animation planning',
    icon: 'Film',
    color: '#DDA0DD',
    typical_outputs: ['storyboard', 'shot_list', 'scene_breakdown'],
    complexity_range: [3, 5],
  },
  motion_study: {
    id: 'motion_study',
    name: 'Motion Studies',
    description: 'Animation and motion concepts',
    icon: 'Zap',
    color: '#FF9FF3',
    typical_outputs: ['motion_concept', 'timing_study', 'easing_preview'],
    complexity_range: [3, 5],
  },
  icon_system: {
    id: 'icon_system',
    name: 'Icon Systems',
    description: 'Consistent icon and symbol sets',
    icon: 'Grid',
    color: '#54A0FF',
    typical_outputs: ['icon_set', 'symbol_library', 'glyph_system'],
    complexity_range: [2, 4],
  },
  data_viz: {
    id: 'data_viz',
    name: 'Data Visualization',
    description: 'Charts, graphs, and data displays',
    icon: 'BarChart2',
    color: '#5F27CD',
    typical_outputs: ['chart', 'graph', 'dashboard_widget'],
    complexity_range: [2, 4],
  },
  infographic: {
    id: 'infographic',
    name: 'Infographics',
    description: 'Information-rich visual content',
    icon: 'FileText',
    color: '#00D2D3',
    typical_outputs: ['infographic', 'fact_sheet', 'comparison'],
    complexity_range: [3, 5],
  },
  photography: {
    id: 'photography',
    name: 'Photography',
    description: 'Photo editing and enhancement',
    icon: 'Camera',
    color: '#FF6B6B',
    typical_outputs: ['edited_photo', 'composite', 'retouched'],
    complexity_range: [2, 4],
  },
  illustration: {
    id: 'illustration',
    name: 'Illustration',
    description: 'Custom illustrations and artwork',
    icon: 'PenTool',
    color: '#A29BFE',
    typical_outputs: ['illustration', 'spot_art', 'scene'],
    complexity_range: [3, 5],
  },
  typography: {
    id: 'typography',
    name: 'Typography',
    description: 'Type treatments and lettering',
    icon: 'Type',
    color: '#FD79A8',
    typical_outputs: ['type_lockup', 'lettering', 'text_treatment'],
    complexity_range: [2, 4],
  },
  layout: {
    id: 'layout',
    name: 'Layouts',
    description: 'Page and screen layouts',
    icon: 'Layout',
    color: '#FDCB6E',
    typical_outputs: ['page_layout', 'wireframe', 'composition'],
    complexity_range: [2, 4],
  },
  pattern: {
    id: 'pattern',
    name: 'Patterns',
    description: 'Seamless patterns and textures',
    icon: 'Hexagon',
    color: '#6C5CE7',
    typical_outputs: ['pattern_tile', 'texture', 'background'],
    complexity_range: [1, 3],
  },
  mockup: {
    id: 'mockup',
    name: 'Mockups',
    description: 'Product and context mockups',
    icon: 'Box',
    color: '#E17055',
    typical_outputs: ['device_mockup', 'packaging', 'environment'],
    complexity_range: [2, 4],
  },
  animation: {
    id: 'animation',
    name: 'Animation',
    description: 'Animated content and motion',
    icon: 'Play',
    color: '#00B894',
    typical_outputs: ['animation', 'gif', 'lottie'],
    complexity_range: [3, 5],
  },
  video: {
    id: 'video',
    name: 'Video',
    description: 'Video content and editing',
    icon: 'Video',
    color: '#E84393',
    typical_outputs: ['video_clip', 'montage', 'trailer'],
    complexity_range: [4, 5],
  },
  audio_visual: {
    id: 'audio_visual',
    name: 'Audio Visual',
    description: 'Combined audio and visual',
    icon: 'Music',
    color: '#0984E3',
    typical_outputs: ['podcast_visual', 'audio_wave', 'lyric_video'],
    complexity_range: [3, 5],
  },
  interactive: {
    id: 'interactive',
    name: 'Interactive',
    description: 'Interactive and UI elements',
    icon: 'MousePointer',
    color: '#74B9FF',
    typical_outputs: ['microinteraction', 'prototype', 'hover_state'],
    complexity_range: [3, 5],
  },
};

export function getCategoryById(id: MethodCategoryId): MethodCategory {
  return METHOD_CATEGORIES[id];
}

export function getAllCategories(): MethodCategory[] {
  return Object.values(METHOD_CATEGORIES);
}

export default METHOD_CATEGORIES;
