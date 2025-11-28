/**
 * Marketing Overview Service
 *
 * Unified service that connects all marketing systems:
 * - Social Playbooks
 * - Social Assets
 * - Decision Moment Maps
 * - Decision Assets
 * - Visual Demos
 * - Marketing Funnel Blueprints
 *
 * Provides joined queries, cross-sync logic, and persona/brand propagation.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { SocialPlaybook } from './socialPlaybookService';
import type { SocialAsset } from './socialAssetService';
import type { DecisionMomentMap } from './decisionMomentService';
import type { DecisionAsset } from './decisionAssetService';
import type { VisualDemoEntry } from './visualDemoService';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketingFunnelBlueprint {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  stages: FunnelStage[];
  persona: string | null;
  brand_tone: string | null;
  linked_playbook_id: string | null;
  linked_decision_map_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  name: 'awareness' | 'interest' | 'desire' | 'action';
  content_types: string[];
  channels: string[];
  assets: string[];
}

export interface UnifiedDashboardData {
  playbooks: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    recent: SocialPlaybook[];
  };
  assets: {
    total: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    scheduled: SocialAsset[];
  };
  decisionMaps: {
    total: number;
    byStage: Record<string, number>;
    recent: DecisionMomentMap[];
  };
  decisionAssets: {
    total: number;
    byChannel: Record<string, number>;
  };
  visualDemos: {
    total: number;
    byCategory: Record<string, number>;
    byPersona: Record<string, number>;
  };
  funnels: {
    total: number;
    recent: MarketingFunnelBlueprint[];
  };
  crossLinks: {
    playbooksWithMaps: number;
    playbooksWithFunnels: number;
    assetsWithDemos: number;
  };
}

export interface BrandConfig {
  persona: string;
  tone: string;
  voice: string;
  keywords: string[];
  colorPalette?: string[];
  visualStyle?: string;
}

export interface CrossSyncResult {
  updated: {
    playbooks: number;
    assets: number;
    decisionMaps: number;
    decisionAssets: number;
    funnels: number;
  };
  errors: string[];
}

// ============================================================================
// UNIFIED DASHBOARD QUERY
// ============================================================================

export async function getUnifiedDashboard(workspaceId: string): Promise<{ data: UnifiedDashboardData | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Parallel fetch all data
    const [
      playbooksRes,
      assetsRes,
      decisionMapsRes,
      decisionAssetsRes,
      visualDemosRes,
      funnelsRes,
    ] = await Promise.all([
      supabase.from('social_playbooks').select('*').eq('workspace_id', workspaceId),
      supabase.from('social_assets').select('*').eq('workspace_id', workspaceId),
      supabase.from('decision_moment_maps').select('*').eq('workspace_id', workspaceId),
      supabase.from('decision_assets').select('*').eq('workspace_id', workspaceId),
      supabase.from('visual_demo_entries').select('*'),
      supabase.from('marketing_funnel_blueprints').select('*').eq('workspace_id', workspaceId),
    ]);

    const playbooks = playbooksRes.data || [];
    const assets = assetsRes.data || [];
    const decisionMaps = decisionMapsRes.data || [];
    const decisionAssets = decisionAssetsRes.data || [];
    const visualDemos = visualDemosRes.data || [];
    const funnels = funnelsRes.data || [];

    // Calculate playbook stats
    const playbookStats = {
      total: playbooks.length,
      active: playbooks.filter((p) => p.status === 'active').length,
      draft: playbooks.filter((p) => p.status === 'draft').length,
      archived: playbooks.filter((p) => p.status === 'archived').length,
      recent: playbooks.slice(0, 5),
    };

    // Calculate asset stats
    const assetsByStatus: Record<string, number> = {};
    const assetsByPlatform: Record<string, number> = {};
    assets.forEach((a) => {
      assetsByStatus[a.status] = (assetsByStatus[a.status] || 0) + 1;
      assetsByPlatform[a.platform] = (assetsByPlatform[a.platform] || 0) + 1;
    });
    const scheduledAssets = assets.filter((a) => a.status === 'scheduled' && a.scheduled_at);

    // Calculate decision map stats
    const mapsByStage: Record<string, number> = {};
    decisionMaps.forEach((m) => {
      mapsByStage[m.funnel_stage] = (mapsByStage[m.funnel_stage] || 0) + 1;
    });

    // Calculate decision asset stats
    const assetsByChannel: Record<string, number> = {};
    decisionAssets.forEach((a) => {
      if (a.channel) {
        assetsByChannel[a.channel] = (assetsByChannel[a.channel] || 0) + 1;
      }
    });

    // Calculate visual demo stats
    const demosByCategory: Record<string, number> = {};
    const demosByPersona: Record<string, number> = {};
    visualDemos.forEach((d) => {
      demosByCategory[d.category] = (demosByCategory[d.category] || 0) + 1;
      if (d.persona) {
        demosByPersona[d.persona] = (demosByPersona[d.persona] || 0) + 1;
      }
    });

    // Calculate cross-links
    const playbooksWithMaps = funnels.filter((f) => f.linked_playbook_id && f.linked_decision_map_id).length;
    const playbooksWithFunnels = funnels.filter((f) => f.linked_playbook_id).length;
    const assetsWithDemos = 0; // Would need linked_demo_id on assets

    const dashboardData: UnifiedDashboardData = {
      playbooks: playbookStats,
      assets: {
        total: assets.length,
        byStatus: assetsByStatus,
        byPlatform: assetsByPlatform,
        scheduled: scheduledAssets.slice(0, 10),
      },
      decisionMaps: {
        total: decisionMaps.length,
        byStage: mapsByStage,
        recent: decisionMaps.slice(0, 5),
      },
      decisionAssets: {
        total: decisionAssets.length,
        byChannel: assetsByChannel,
      },
      visualDemos: {
        total: visualDemos.length,
        byCategory: demosByCategory,
        byPersona: demosByPersona,
      },
      funnels: {
        total: funnels.length,
        recent: funnels.slice(0, 5),
      },
      crossLinks: {
        playbooksWithMaps,
        playbooksWithFunnels,
        assetsWithDemos,
      },
    };

    return { data: dashboardData, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// CROSS-SYNC LOGIC
// ============================================================================

/**
 * Propagate brand config from playbook to all associated assets
 */
export async function propagateBrandConfig(
  workspaceId: string,
  playbookId: string,
  config: BrandConfig
): Promise<CrossSyncResult> {
  const supabase = await getSupabaseServer();
  const result: CrossSyncResult = {
    updated: { playbooks: 0, assets: 0, decisionMaps: 0, decisionAssets: 0, funnels: 0 },
    errors: [],
  };

  try {
    // Update playbook with persona
    const { error: playbookError } = await supabase
      .from('social_playbooks')
      .update({ primary_persona: config.persona })
      .eq('id', playbookId)
      .eq('workspace_id', workspaceId);

    if (playbookError) {
      result.errors.push(`Playbook update failed: ${playbookError.message}`);
    } else {
      result.updated.playbooks = 1;
    }

    // Update all assets in this playbook with brand metadata
    const { data: updatedAssets, error: assetsError } = await supabase
      .from('social_assets')
      .update({
        metadata: {
          persona: config.persona,
          tone: config.tone,
          voice: config.voice,
          keywords: config.keywords,
        },
      })
      .eq('playbook_id', playbookId)
      .eq('workspace_id', workspaceId)
      .select();

    if (assetsError) {
      result.errors.push(`Assets update failed: ${assetsError.message}`);
    } else {
      result.updated.assets = updatedAssets?.length || 0;
    }

    // Update linked funnels
    const { data: updatedFunnels, error: funnelsError } = await supabase
      .from('marketing_funnel_blueprints')
      .update({
        persona: config.persona,
        brand_tone: config.tone,
      })
      .eq('linked_playbook_id', playbookId)
      .eq('workspace_id', workspaceId)
      .select();

    if (funnelsError) {
      result.errors.push(`Funnels update failed: ${funnelsError.message}`);
    } else {
      result.updated.funnels = updatedFunnels?.length || 0;
    }

    return result;
  } catch (err) {
    result.errors.push(`Unexpected error: ${(err as Error).message}`);
    return result;
  }
}

/**
 * Sync decision map changes to associated assets
 */
export async function syncDecisionMapToAssets(
  workspaceId: string,
  mapId: string
): Promise<CrossSyncResult> {
  const supabase = await getSupabaseServer();
  const result: CrossSyncResult = {
    updated: { playbooks: 0, assets: 0, decisionMaps: 0, decisionAssets: 0, funnels: 0 },
    errors: [],
  };

  try {
    // Get the decision map
    const { data: map, error: mapError } = await supabase
      .from('decision_moment_maps')
      .select('*')
      .eq('id', mapId)
      .eq('workspace_id', workspaceId)
      .single();

    if (mapError || !map) {
      result.errors.push('Decision map not found');
      return result;
    }

    // Get all decision assets for this map
    const { data: decisionAssets, error: assetsError } = await supabase
      .from('decision_assets')
      .select('*')
      .eq('map_id', mapId);

    if (assetsError) {
      result.errors.push(`Failed to fetch decision assets: ${assetsError.message}`);
      return result;
    }

    result.updated.decisionAssets = decisionAssets?.length || 0;

    // Update linked funnels with map changes
    const { data: updatedFunnels, error: funnelsError } = await supabase
      .from('marketing_funnel_blueprints')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('linked_decision_map_id', mapId)
      .eq('workspace_id', workspaceId)
      .select();

    if (!funnelsError) {
      result.updated.funnels = updatedFunnels?.length || 0;
    }

    return result;
  } catch (err) {
    result.errors.push(`Unexpected error: ${(err as Error).message}`);
    return result;
  }
}

// ============================================================================
// LINKED ENTITY QUERIES
// ============================================================================

export interface PlaybookWithRelations extends SocialPlaybook {
  assets: SocialAsset[];
  funnels: MarketingFunnelBlueprint[];
  decisionMaps: DecisionMomentMap[];
}

export async function getPlaybookWithRelations(
  playbookId: string,
  workspaceId: string
): Promise<{ data: PlaybookWithRelations | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const [playbookRes, assetsRes, funnelsRes] = await Promise.all([
      supabase
        .from('social_playbooks')
        .select('*')
        .eq('id', playbookId)
        .eq('workspace_id', workspaceId)
        .single(),
      supabase
        .from('social_assets')
        .select('*')
        .eq('playbook_id', playbookId)
        .order('created_at', { ascending: false }),
      supabase
        .from('marketing_funnel_blueprints')
        .select('*')
        .eq('linked_playbook_id', playbookId)
        .eq('workspace_id', workspaceId),
    ]);

    if (playbookRes.error || !playbookRes.data) {
      return { data: null, error: new Error('Playbook not found') };
    }

    // Get decision maps linked through funnels
    const funnelMapIds = (funnelsRes.data || [])
      .map((f) => f.linked_decision_map_id)
      .filter(Boolean);

    let decisionMaps: DecisionMomentMap[] = [];
    if (funnelMapIds.length > 0) {
      const { data: maps } = await supabase
        .from('decision_moment_maps')
        .select('*')
        .in('id', funnelMapIds);
      decisionMaps = maps || [];
    }

    return {
      data: {
        ...playbookRes.data,
        assets: assetsRes.data || [],
        funnels: funnelsRes.data || [],
        decisionMaps,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export interface DecisionMapWithRelations extends DecisionMomentMap {
  assets: DecisionAsset[];
  linkedFunnels: MarketingFunnelBlueprint[];
  recommendedDemos: VisualDemoEntry[];
}

export async function getDecisionMapWithRelations(
  mapId: string,
  workspaceId: string
): Promise<{ data: DecisionMapWithRelations | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const [mapRes, assetsRes, funnelsRes] = await Promise.all([
      supabase
        .from('decision_moment_maps')
        .select('*')
        .eq('id', mapId)
        .eq('workspace_id', workspaceId)
        .single(),
      supabase.from('decision_assets').select('*').eq('map_id', mapId).order('moment_key'),
      supabase
        .from('marketing_funnel_blueprints')
        .select('*')
        .eq('linked_decision_map_id', mapId)
        .eq('workspace_id', workspaceId),
    ]);

    if (mapRes.error || !mapRes.data) {
      return { data: null, error: new Error('Decision map not found') };
    }

    // Get recommended visual demos based on funnel stage
    const { data: demos } = await supabase
      .from('visual_demo_entries')
      .select('*')
      .limit(6);

    return {
      data: {
        ...mapRes.data,
        assets: assetsRes.data || [],
        linkedFunnels: funnelsRes.data || [],
        recommendedDemos: demos || [],
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// FUNNEL BLUEPRINT OPERATIONS
// ============================================================================

export interface CreateFunnelInput {
  workspace_id: string;
  name: string;
  description?: string;
  persona?: string;
  brand_tone?: string;
  linked_playbook_id?: string;
  linked_decision_map_id?: string;
}

export async function createFunnelBlueprint(data: CreateFunnelInput) {
  const supabase = await getSupabaseServer();

  const defaultStages: FunnelStage[] = [
    { name: 'awareness', content_types: ['blog', 'social', 'video'], channels: ['organic', 'paid'], assets: [] },
    { name: 'interest', content_types: ['webinar', 'case-study', 'email'], channels: ['email', 'retargeting'], assets: [] },
    { name: 'desire', content_types: ['demo', 'testimonial', 'comparison'], channels: ['sales', 'email'], assets: [] },
    { name: 'action', content_types: ['landing-page', 'cta', 'offer'], channels: ['direct', 'referral'], assets: [] },
  ];

  return supabase
    .from('marketing_funnel_blueprints')
    .insert({
      ...data,
      stages: defaultStages,
    })
    .select()
    .single();
}

export async function listFunnelBlueprints(workspaceId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('marketing_funnel_blueprints')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
}

export async function linkPlaybookToFunnel(funnelId: string, playbookId: string, workspaceId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('marketing_funnel_blueprints')
    .update({ linked_playbook_id: playbookId })
    .eq('id', funnelId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();
}

export async function linkDecisionMapToFunnel(funnelId: string, mapId: string, workspaceId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('marketing_funnel_blueprints')
    .update({ linked_decision_map_id: mapId })
    .eq('id', funnelId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();
}

// ============================================================================
// PERSONA-AWARE CONTENT GENERATION HELPERS
// ============================================================================

export const PERSONA_DEFAULTS: Record<string, BrandConfig> = {
  saas: {
    persona: 'saas',
    tone: 'professional',
    voice: 'authoritative yet approachable',
    keywords: ['efficiency', 'automation', 'scale', 'ROI', 'integration'],
  },
  trade: {
    persona: 'trade',
    tone: 'direct',
    voice: 'practical and trustworthy',
    keywords: ['quality', 'reliability', 'local', 'experience', 'warranty'],
  },
  agency: {
    persona: 'agency',
    tone: 'creative',
    voice: 'innovative and confident',
    keywords: ['creative', 'results', 'strategy', 'growth', 'brand'],
  },
  nonprofit: {
    persona: 'nonprofit',
    tone: 'compassionate',
    voice: 'inspiring and community-focused',
    keywords: ['impact', 'community', 'change', 'together', 'mission'],
  },
  ecommerce: {
    persona: 'ecommerce',
    tone: 'exciting',
    voice: 'energetic and persuasive',
    keywords: ['exclusive', 'limited', 'deal', 'trending', 'must-have'],
  },
  professional: {
    persona: 'professional',
    tone: 'formal',
    voice: 'expert and refined',
    keywords: ['expertise', 'consultation', 'premium', 'bespoke', 'excellence'],
  },
};

export function getPersonaConfig(persona: string): BrandConfig {
  return PERSONA_DEFAULTS[persona] || PERSONA_DEFAULTS.professional;
}

/**
 * Generate recommended content types based on funnel stage and persona
 */
export function getRecommendedContentTypes(
  stage: FunnelStage['name'],
  persona: string
): string[] {
  const stageContent: Record<FunnelStage['name'], Record<string, string[]>> = {
    awareness: {
      saas: ['blog', 'linkedin-post', 'youtube-explainer', 'infographic'],
      trade: ['before-after', 'project-showcase', 'local-seo', 'google-post'],
      agency: ['case-study-teaser', 'thought-leadership', 'portfolio-reel'],
      nonprofit: ['impact-story', 'mission-video', 'community-spotlight'],
      ecommerce: ['product-launch', 'influencer-collab', 'tiktok-trend'],
      professional: ['whitepaper-excerpt', 'industry-analysis', 'webinar-promo'],
    },
    interest: {
      saas: ['demo-video', 'feature-comparison', 'customer-testimonial'],
      trade: ['process-walkthrough', 'material-guide', 'faq-video'],
      agency: ['results-showcase', 'process-deep-dive', 'team-intro'],
      nonprofit: ['volunteer-stories', 'program-details', 'donor-impact'],
      ecommerce: ['product-review', 'unboxing', 'comparison-guide'],
      professional: ['consultation-offer', 'expertise-demo', 'credentials-highlight'],
    },
    desire: {
      saas: ['roi-calculator', 'success-story', 'feature-spotlight'],
      trade: ['quote-builder', 'warranty-details', 'certification-proof'],
      agency: ['proposal-preview', 'pricing-guide', 'portfolio-deep-dive'],
      nonprofit: ['donation-impact', 'matching-campaign', 'legacy-giving'],
      ecommerce: ['limited-offer', 'bundle-deal', 'loyalty-perks'],
      professional: ['package-options', 'guarantee-details', 'exclusive-access'],
    },
    action: {
      saas: ['free-trial-cta', 'onboarding-guide', 'quick-start'],
      trade: ['book-now', 'get-quote', 'schedule-inspection'],
      agency: ['start-project', 'book-discovery', 'request-proposal'],
      nonprofit: ['donate-now', 'join-movement', 'become-volunteer'],
      ecommerce: ['buy-now', 'add-to-cart', 'checkout-incentive'],
      professional: ['book-consultation', 'schedule-call', 'get-started'],
    },
  };

  return stageContent[stage]?.[persona] || stageContent[stage]?.professional || [];
}
