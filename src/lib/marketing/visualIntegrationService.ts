/**
 * Visual Integration Service
 *
 * Links Visual Experience Engine to Marketing Workflows:
 * - Animation style recommendations based on persona + platform
 * - Visual preview attachments to social assets
 * - Export to PDF/shareable link for pitch decks
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getPersonaConfig } from './marketingOverviewService';
import type { VisualDemoEntry } from './visualDemoService';

// ============================================================================
// TYPES
// ============================================================================

export interface AnimationRecommendation {
  animation: string;
  intensity: 'subtle' | 'normal' | 'dramatic';
  useCase: string;
  confidence: number;
  demoSlug?: string;
}

export interface PlatformVisualConfig {
  platform: string;
  aspectRatio: string;
  duration: string;
  animationSpeed: 'slow' | 'medium' | 'fast';
  recommendedAnimations: string[];
  colorTemperature: 'warm' | 'neutral' | 'cool';
}

export interface VisualPreview {
  id: string;
  assetId: string;
  demoId: string;
  previewUrl: string | null;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface PitchDeckExport {
  title: string;
  slides: PitchSlide[];
  brandConfig: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoUrl?: string;
  };
  exportFormat: 'pdf' | 'pptx' | 'html';
  shareableLink?: string;
}

export interface PitchSlide {
  type: 'title' | 'content' | 'visual' | 'stats' | 'cta';
  title?: string;
  content?: string;
  visualDemo?: string;
  stats?: { label: string; value: string }[];
  ctaText?: string;
  ctaUrl?: string;
}

// ============================================================================
// PLATFORM VISUAL CONFIGS
// ============================================================================

export const PLATFORM_VISUAL_CONFIGS: Record<string, PlatformVisualConfig> = {
  youtube: {
    platform: 'youtube',
    aspectRatio: '16:9',
    duration: '8-12min',
    animationSpeed: 'medium',
    recommendedAnimations: ['beam-sweep', 'card-morph', 'parallax-scroll'],
    colorTemperature: 'neutral',
  },
  shorts: {
    platform: 'shorts',
    aspectRatio: '9:16',
    duration: '15-60sec',
    animationSpeed: 'fast',
    recommendedAnimations: ['quick-zoom', 'snap-transition', 'pulse-pop'],
    colorTemperature: 'warm',
  },
  instagram: {
    platform: 'instagram',
    aspectRatio: '1:1',
    duration: '15-30sec',
    animationSpeed: 'fast',
    recommendedAnimations: ['grid-reveal', 'soft-morph', 'color-shift'],
    colorTemperature: 'warm',
  },
  reels: {
    platform: 'reels',
    aspectRatio: '9:16',
    duration: '15-90sec',
    animationSpeed: 'fast',
    recommendedAnimations: ['kinetic-text', 'split-transition', 'bounce-pop'],
    colorTemperature: 'warm',
  },
  tiktok: {
    platform: 'tiktok',
    aspectRatio: '9:16',
    duration: '15-60sec',
    animationSpeed: 'fast',
    recommendedAnimations: ['trend-sync', 'beat-drop', 'zoom-pan'],
    colorTemperature: 'cool',
  },
  linkedin: {
    platform: 'linkedin',
    aspectRatio: '1:1',
    duration: '30-120sec',
    animationSpeed: 'slow',
    recommendedAnimations: ['fade-in', 'subtle-slide', 'professional-morph'],
    colorTemperature: 'neutral',
  },
  facebook: {
    platform: 'facebook',
    aspectRatio: '16:9',
    duration: '60-180sec',
    animationSpeed: 'medium',
    recommendedAnimations: ['carousel-flow', 'story-reveal', 'engagement-pulse'],
    colorTemperature: 'warm',
  },
};

// ============================================================================
// ANIMATION RECOMMENDATIONS
// ============================================================================

const PERSONA_ANIMATION_MAP: Record<string, Record<string, AnimationRecommendation[]>> = {
  saas: {
    hero: [
      { animation: 'beam-sweep-alpha', intensity: 'normal', useCase: 'Tech product hero', confidence: 0.9 },
      { animation: 'quantum-glow-pulse', intensity: 'dramatic', useCase: 'AI feature highlight', confidence: 0.85 },
    ],
    section: [
      { animation: 'data-flow', intensity: 'subtle', useCase: 'Feature sections', confidence: 0.85 },
      { animation: 'grid-morph', intensity: 'normal', useCase: 'Pricing tables', confidence: 0.8 },
    ],
    card: [
      { animation: 'hover-lift', intensity: 'subtle', useCase: 'Feature cards', confidence: 0.9 },
      { animation: 'switching-card-morph', intensity: 'normal', useCase: 'Testimonial cards', confidence: 0.85 },
    ],
  },
  trade: {
    hero: [
      { animation: 'clip-fade-radiance', intensity: 'subtle', useCase: 'Service showcase', confidence: 0.9 },
      { animation: 'parallax-depth', intensity: 'normal', useCase: 'Portfolio hero', confidence: 0.85 },
    ],
    section: [
      { animation: 'before-after-slide', intensity: 'normal', useCase: 'Work samples', confidence: 0.9 },
      { animation: 'process-reveal', intensity: 'subtle', useCase: 'How we work', confidence: 0.85 },
    ],
    card: [
      { animation: 'project-hover', intensity: 'normal', useCase: 'Project gallery', confidence: 0.9 },
      { animation: 'trust-badge-pulse', intensity: 'subtle', useCase: 'Certifications', confidence: 0.8 },
    ],
  },
  agency: {
    hero: [
      { animation: 'creative-burst', intensity: 'dramatic', useCase: 'Bold intro', confidence: 0.9 },
      { animation: 'text-reveal', intensity: 'normal', useCase: 'Minimalist hero', confidence: 0.85 },
    ],
    section: [
      { animation: 'case-study-flow', intensity: 'normal', useCase: 'Portfolio sections', confidence: 0.9 },
      { animation: 'team-spotlight', intensity: 'subtle', useCase: 'Team page', confidence: 0.85 },
    ],
    card: [
      { animation: 'portfolio-expand', intensity: 'normal', useCase: 'Work showcase', confidence: 0.9 },
      { animation: 'client-logo-fade', intensity: 'subtle', useCase: 'Client logos', confidence: 0.8 },
    ],
  },
  nonprofit: {
    hero: [
      { animation: 'soft-material-morph', intensity: 'subtle', useCase: 'Mission statement', confidence: 0.9 },
      { animation: 'community-gather', intensity: 'normal', useCase: 'Impact hero', confidence: 0.85 },
    ],
    section: [
      { animation: 'impact-counter', intensity: 'normal', useCase: 'Stats section', confidence: 0.9 },
      { animation: 'story-unfold', intensity: 'subtle', useCase: 'Stories', confidence: 0.85 },
    ],
    card: [
      { animation: 'donation-highlight', intensity: 'normal', useCase: 'Donation tiers', confidence: 0.9 },
      { animation: 'volunteer-wave', intensity: 'subtle', useCase: 'Team cards', confidence: 0.8 },
    ],
  },
  ecommerce: {
    hero: [
      { animation: 'product-spotlight', intensity: 'dramatic', useCase: 'Product launch', confidence: 0.9 },
      { animation: 'sale-flash', intensity: 'dramatic', useCase: 'Sale hero', confidence: 0.85 },
    ],
    section: [
      { animation: 'carousel-smooth', intensity: 'normal', useCase: 'Featured products', confidence: 0.9 },
      { animation: 'category-grid', intensity: 'subtle', useCase: 'Category browse', confidence: 0.85 },
    ],
    card: [
      { animation: 'quick-view-pop', intensity: 'normal', useCase: 'Product cards', confidence: 0.9 },
      { animation: 'add-to-cart-bounce', intensity: 'subtle', useCase: 'Cart actions', confidence: 0.85 },
    ],
  },
  professional: {
    hero: [
      { animation: 'elegant-fade', intensity: 'subtle', useCase: 'Professional intro', confidence: 0.9 },
      { animation: 'credential-reveal', intensity: 'normal', useCase: 'Expertise showcase', confidence: 0.85 },
    ],
    section: [
      { animation: 'service-unfold', intensity: 'subtle', useCase: 'Services list', confidence: 0.9 },
      { animation: 'testimonial-slide', intensity: 'normal', useCase: 'Client reviews', confidence: 0.85 },
    ],
    card: [
      { animation: 'profile-highlight', intensity: 'subtle', useCase: 'Team profiles', confidence: 0.9 },
      { animation: 'package-compare', intensity: 'normal', useCase: 'Pricing cards', confidence: 0.85 },
    ],
  },
};

export function getAnimationRecommendations(
  persona: string,
  category: 'hero' | 'section' | 'card' | 'gallery' | 'social'
): AnimationRecommendation[] {
  const personaMap = PERSONA_ANIMATION_MAP[persona] || PERSONA_ANIMATION_MAP.professional;
  const categoryKey = category === 'gallery' || category === 'social' ? 'card' : category;
  return personaMap[categoryKey] || [];
}

export function getRecommendationsForPlatform(
  platform: string,
  persona: string
): AnimationRecommendation[] {
  const platformConfig = PLATFORM_VISUAL_CONFIGS[platform];
  if (!platformConfig) return [];

  const recommendations: AnimationRecommendation[] = [];

  for (const animation of platformConfig.recommendedAnimations) {
    const intensity = platformConfig.animationSpeed === 'fast' ? 'dramatic' :
      platformConfig.animationSpeed === 'slow' ? 'subtle' : 'normal';

    recommendations.push({
      animation,
      intensity,
      useCase: `${platform} ${platformConfig.aspectRatio} content`,
      confidence: 0.8,
    });
  }

  return recommendations;
}

// ============================================================================
// VISUAL PREVIEW MANAGEMENT
// ============================================================================

export async function attachVisualPreview(
  assetId: string,
  demoId: string,
  config: Record<string, unknown>
): Promise<{ data: VisualPreview | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Update the social asset with visual demo reference
    const { error } = await supabase
      .from('social_assets')
      .update({
        metadata: {
          linked_demo_id: demoId,
          visual_config: config,
        },
      })
      .eq('id', assetId);

    if (error) throw error;

    return {
      data: {
        id: `preview-${assetId}-${demoId}`,
        assetId,
        demoId,
        previewUrl: null,
        config,
        createdAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function getVisualDemosForAsset(
  assetPlatform: string,
  assetPersona: string
): Promise<{ data: VisualDemoEntry[]; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    let query = supabase.from('visual_demo_entries').select('*');

    // Filter by persona if available
    if (assetPersona) {
      query = query.eq('persona', assetPersona);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

// ============================================================================
// PITCH DECK EXPORT
// ============================================================================

export async function generatePitchDeck(
  workspaceId: string,
  playbookId: string,
  options: {
    title: string;
    includeStats?: boolean;
    includeVisuals?: boolean;
    exportFormat: 'pdf' | 'pptx' | 'html';
  }
): Promise<{ data: PitchDeckExport | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Get playbook data
    const { data: playbook, error: playbookError } = await supabase
      .from('social_playbooks')
      .select('*')
      .eq('id', playbookId)
      .eq('workspace_id', workspaceId)
      .single();

    if (playbookError || !playbook) {
      throw new Error('Playbook not found');
    }

    // Get associated assets
    const { data: assets } = await supabase
      .from('social_assets')
      .select('*')
      .eq('playbook_id', playbookId)
      .limit(10);

    // Build slides
    const slides: PitchSlide[] = [];

    // Title slide
    slides.push({
      type: 'title',
      title: options.title || playbook.name,
      content: playbook.description,
    });

    // Strategy overview
    slides.push({
      type: 'content',
      title: 'Strategy Overview',
      content: `Goal: ${playbook.primary_goal}\nPersona: ${playbook.primary_persona}\nPlatforms: ${playbook.platforms?.join(', ')}`,
    });

    // Stats slide (if requested)
    if (options.includeStats) {
      slides.push({
        type: 'stats',
        title: 'Campaign Metrics',
        stats: [
          { label: 'Total Assets', value: String(assets?.length || 0) },
          { label: 'Platforms', value: String(playbook.platforms?.length || 0) },
          { label: 'Status', value: playbook.status },
        ],
      });
    }

    // Visual slides (if requested)
    if (options.includeVisuals && assets) {
      for (const asset of assets.slice(0, 5)) {
        slides.push({
          type: 'visual',
          title: asset.title || 'Content Preview',
          content: asset.hook,
          visualDemo: asset.metadata?.linked_demo_id as string,
        });
      }
    }

    // CTA slide
    slides.push({
      type: 'cta',
      title: 'Next Steps',
      ctaText: 'Get Started',
      ctaUrl: '/contact',
    });

    const pitchDeck: PitchDeckExport = {
      title: options.title || playbook.name,
      slides,
      brandConfig: {
        primaryColor: '#0d9488',
        secondaryColor: '#1e293b',
        fontFamily: 'Inter, sans-serif',
      },
      exportFormat: options.exportFormat,
    };

    return { data: pitchDeck, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function createShareableLink(
  pitchDeckId: string,
  expiresInDays: number = 7
): Promise<{ data: { url: string; expiresAt: string } | null; error: Error | null }> {
  // Generate a shareable link (would integrate with actual hosting in production)
  const token = Buffer.from(`${pitchDeckId}-${Date.now()}`).toString('base64');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    data: {
      url: `/share/pitch/${token}`,
      expiresAt,
    },
    error: null,
  };
}

// ============================================================================
// ANIMATION WIZARD INTEGRATION
// ============================================================================

export interface WizardAnswers {
  industry: string;
  targetAudience: string;
  brandPersonality: string[];
  preferredIntensity: 'subtle' | 'normal' | 'dramatic';
  primaryPlatforms: string[];
}

export function processWizardAnswers(answers: WizardAnswers): {
  persona: string;
  recommendations: AnimationRecommendation[];
  platformConfigs: PlatformVisualConfig[];
} {
  // Map industry/personality to persona
  const personaMapping: Record<string, string> = {
    technology: 'saas',
    construction: 'trade',
    marketing: 'agency',
    nonprofit: 'nonprofit',
    retail: 'ecommerce',
    services: 'professional',
  };

  const persona = personaMapping[answers.industry.toLowerCase()] || 'professional';

  // Get recommendations for each category
  const allRecommendations: AnimationRecommendation[] = [];
  for (const category of ['hero', 'section', 'card'] as const) {
    const recs = getAnimationRecommendations(persona, category);
    // Filter by intensity preference
    const filtered = recs.filter(
      (r) => r.intensity === answers.preferredIntensity || r.intensity === 'normal'
    );
    allRecommendations.push(...filtered);
  }

  // Get platform configs
  const platformConfigs = answers.primaryPlatforms
    .map((p) => PLATFORM_VISUAL_CONFIGS[p])
    .filter(Boolean);

  return {
    persona,
    recommendations: allRecommendations,
    platformConfigs,
  };
}
