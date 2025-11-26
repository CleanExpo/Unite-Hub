/**
 * Synthex Visual Orchestrator
 *
 * Orchestrates AI-powered visual generation for Synthex.social
 * Coordinates Gemini 3 Pro (images) + VEO3 (videos) + DALLE-3 (fallback)
 * for Synthex-specific use cases.
 *
 * Supports:
 * - Website banner generation (with branding context)
 * - Social media graphics (platform-optimized)
 * - Video creation (short-form, auto-generated from scripts)
 * - Brand kit generation (colors, typography, guidelines)
 */

import { supabaseAdmin } from '@/lib/supabase';
import {
  getVisualCapabilities,
  supportsVisualModel,
  getGraphicsQuota,
  getVideoQuota,
  hasAIDesignerAccess,
} from './synthexOfferEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VisualGenerationJob {
  id: string;
  tenant_id: string;
  job_type: 'website_banner' | 'social_graphics' | 'video' | 'brand_kit';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  context: {
    brand_colors?: string[];
    tone_voice?: string;
    target_platform?: string;
    industry?: string;
    dimensions?: { width: number; height: number };
  };
  preferred_model: 'gemini_3_pro' | 'veo3' | 'dalle_3' | 'nano_banana_2';
  fallback_models?: string[];
  result?: {
    model_used: string;
    output_url: string;
    cost: number;
    generation_time_ms: number;
  };
  created_at: string;
  updated_at: string;
}

export interface VisualGenerationQueue {
  tenant_id: string;
  plan_code: string;
  graphics_used_month: number;
  videos_used_month: number;
  brand_kits_used_month: number;
  pending_jobs: number;
  last_reset_at: string;
}

export interface BrandKit {
  id: string;
  tenant_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  logo_url: string;
  guidelines: string; // Brand guidelines text
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Recommended models per visual task type
const MODEL_RECOMMENDATIONS = {
  website_banner: {
    primary: 'gemini_3_pro',
    fallback: ['dalle_3', 'nano_banana_2'],
  },
  social_graphics: {
    primary: 'nano_banana_2', // Fast, cost-effective
    fallback: ['gemini_3_pro', 'dalle_3'],
  },
  video: {
    primary: 'veo3',
    fallback: ['gemini_3_pro'], // Can generate video scripts
  },
  brand_kit: {
    primary: 'gemini_3_pro', // Best for multi-modal brand generation
    fallback: ['dalle_3'],
  },
};

// Platform-specific dimensions for social graphics
const SOCIAL_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram_feed: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_post: { width: 1200, height: 628 },
  twitter_post: { width: 1200, height: 675 },
  linkedin_post: { width: 1200, height: 627 },
  tiktok: { width: 1080, height: 1920 },
  pinterest: { width: 1000, height: 1500 },
  youtube_thumbnail: { width: 1280, height: 720 },
};

// ============================================================================
// CORE ORCHESTRATION
// ============================================================================

/**
 * Select best visual model based on job requirements and tenant plan
 */
export function selectOptimalModel(
  jobType: VisualGenerationJob['job_type'],
  tenantPlanCode: string,
  preferredModel?: string
): { primary: string; fallback: string[] } {
  const capabilities = getVisualCapabilities(tenantPlanCode);
  if (!capabilities) {
    throw new Error(`Plan not found: ${tenantPlanCode}`);
  }

  const recommendations = MODEL_RECOMMENDATIONS[jobType];
  const supportedModels = capabilities.supportedModels;

  // If preferred model is supported, use it
  if (preferredModel && supportsVisualModel(tenantPlanCode, preferredModel)) {
    return {
      primary: preferredModel,
      fallback: recommendations.fallback.filter((m) =>
        supportsVisualModel(tenantPlanCode, m)
      ),
    };
  }

  // Filter recommendations by supported models
  const primary = recommendations.primary;
  const fallback = recommendations.fallback.filter((m) =>
    supportsVisualModel(tenantPlanCode, m)
  );

  if (!supportsVisualModel(tenantPlanCode, primary)) {
    // Primary not available, find best available alternative
    const available = supportedModels[0];
    return {
      primary: available,
      fallback: supportedModels.slice(1),
    };
  }

  return { primary, fallback };
}

/**
 * Check if tenant can generate a visual asset
 */
export async function canGenerateVisual(
  tenantId: string,
  jobType: VisualGenerationJob['job_type'],
  planCode: string
): Promise<{
  allowed: boolean;
  reason?: string;
  quotaRemaining?: number;
}> {
  const capabilities = getVisualCapabilities(planCode);
  if (!capabilities) {
    return { allowed: false, reason: 'Invalid plan code' };
  }

  // Get monthly usage from database
  const { data: queue, error } = await supabaseAdmin
    .from('synthex_visual_generation_queues')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('plan_code', planCode)
    .single();

  if (error || !queue) {
    return { allowed: true, quotaRemaining: getGraphicsQuota(planCode) }; // First time
  }

  // Check quota based on job type
  let quota = 0;
  let used = 0;

  if (jobType === 'video') {
    quota = getVideoQuota(planCode);
    used = queue.videos_used_month;
  } else if (jobType === 'brand_kit') {
    quota = capabilities.brandKitsPerMonth;
    used = queue.brand_kits_used_month;
  } else {
    // website_banner, social_graphics
    quota = getGraphicsQuota(planCode);
    used = queue.graphics_used_month;
  }

  if (quota === -1) return { allowed: true, quotaRemaining: -1 }; // Unlimited

  if (used >= quota) {
    return {
      allowed: false,
      reason: `Monthly ${jobType} quota exceeded (${used}/${quota})`,
      quotaRemaining: 0,
    };
  }

  return { allowed: true, quotaRemaining: quota - used };
}

/**
 * Record visual generation job
 */
export async function recordVisualJob(
  job: Omit<VisualGenerationJob, 'id' | 'created_at' | 'updated_at'>
): Promise<VisualGenerationJob | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_visual_generation_jobs')
    .insert({
      ...job,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to record visual job:', error);
    return null;
  }

  return data as VisualGenerationJob;
}

/**
 * Update visual job with results
 */
export async function updateVisualJobResult(
  jobId: string,
  result: VisualGenerationJob['result'],
  status: 'completed' | 'failed' = 'completed'
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('synthex_visual_generation_jobs')
    .update({
      status,
      result: result || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update visual job:', error);
    return false;
  }

  return true;
}

/**
 * Increment usage quota after successful generation
 */
export async function incrementQuotaUsage(
  tenantId: string,
  jobType: VisualGenerationJob['job_type'],
  planCode: string
): Promise<boolean> {
  // Determine which quota to increment
  let increment: Record<string, number> = {
    updated_at: new Date().toISOString(),
  };

  if (jobType === 'video') {
    increment.videos_used_month = 1;
  } else if (jobType === 'brand_kit') {
    increment.brand_kits_used_month = 1;
  } else {
    increment.graphics_used_month = 1;
  }

  const { error } = await supabaseAdmin
    .from('synthex_visual_generation_queues')
    .update(increment)
    .eq('tenant_id', tenantId)
    .eq('plan_code', planCode);

  if (error) {
    console.error('Failed to increment quota:', error);
    return false;
  }

  return true;
}

// ============================================================================
// GENERATION HELPERS
// ============================================================================

/**
 * Generate website banner with brand context
 */
export async function generateWebsiteBanner(
  tenantId: string,
  planCode: string,
  brandKit: BrandKit,
  prompt: string,
  dimensions?: { width: number; height: number }
): Promise<VisualGenerationJob | null> {
  // Check quota
  const quota = await canGenerateVisual(tenantId, 'website_banner', planCode);
  if (!quota.allowed) {
    console.warn(`Cannot generate website banner: ${quota.reason}`);
    return null;
  }

  // Select optimal model
  const models = selectOptimalModel('website_banner', planCode);

  // Create job record
  const job = await recordVisualJob({
    tenant_id: tenantId,
    job_type: 'website_banner',
    status: 'pending',
    prompt: `Create a professional website banner for a ${brandKit.name} business. ${prompt}`,
    context: {
      brand_colors: [brandKit.primary_color, brandKit.secondary_color],
      tone_voice: brandKit.guidelines,
      dimensions: dimensions || { width: 1920, height: 600 },
    },
    preferred_model: models.primary as VisualGenerationJob['preferred_model'],
    fallback_models: models.fallback,
  });

  return job;
}

/**
 * Generate platform-optimized social graphics
 */
export async function generateSocialGraphic(
  tenantId: string,
  planCode: string,
  brandKit: BrandKit,
  platform: keyof typeof SOCIAL_DIMENSIONS,
  prompt: string
): Promise<VisualGenerationJob | null> {
  // Check quota
  const quota = await canGenerateVisual(tenantId, 'social_graphics', planCode);
  if (!quota.allowed) {
    console.warn(`Cannot generate social graphic: ${quota.reason}`);
    return null;
  }

  // Select optimal model
  const models = selectOptimalModel('social_graphics', planCode);

  // Create job record
  const job = await recordVisualJob({
    tenant_id: tenantId,
    job_type: 'social_graphics',
    status: 'pending',
    prompt: `Create a ${platform} social media graphic for ${brandKit.name}. Use their brand colors (${brandKit.primary_color}, ${brandKit.secondary_color}). ${prompt}`,
    context: {
      brand_colors: [brandKit.primary_color, brandKit.secondary_color],
      target_platform: platform,
      dimensions: SOCIAL_DIMENSIONS[platform],
    },
    preferred_model: models.primary as VisualGenerationJob['preferred_model'],
    fallback_models: models.fallback,
  });

  return job;
}

/**
 * Generate video from script
 */
export async function generateVideo(
  tenantId: string,
  planCode: string,
  brandKit: BrandKit,
  videoScript: string,
  videoLength: number = 30 // seconds
): Promise<VisualGenerationJob | null> {
  // Check quota & AI Designer access
  const quota = await canGenerateVisual(tenantId, 'video', planCode);
  if (!quota.allowed) {
    console.warn(`Cannot generate video: ${quota.reason}`);
    return null;
  }

  if (!hasAIDesignerAccess(planCode)) {
    console.warn('Video generation requires AI Designer access (Growth+ plan)');
    return null;
  }

  // Select optimal model
  const models = selectOptimalModel('video', planCode);

  // Create job record
  const job = await recordVisualJob({
    tenant_id: tenantId,
    job_type: 'video',
    status: 'pending',
    prompt: `Create a ${videoLength}-second video for ${brandKit.name} using brand colors (${brandKit.primary_color}, ${brandKit.secondary_color}). Script: ${videoScript}`,
    context: {
      brand_colors: [brandKit.primary_color, brandKit.secondary_color],
      tone_voice: brandKit.guidelines,
    },
    preferred_model: models.primary as VisualGenerationJob['preferred_model'],
    fallback_models: models.fallback,
  });

  return job;
}

/**
 * Generate brand kit from description
 */
export async function generateBrandKit(
  tenantId: string,
  planCode: string,
  brandName: string,
  industry: string,
  description: string
): Promise<BrandKit | null> {
  // Check quota & AI Designer access
  const quota = await canGenerateVisual(tenantId, 'brand_kit', planCode);
  if (!quota.allowed) {
    console.warn(`Cannot generate brand kit: ${quota.reason}`);
    return null;
  }

  if (!hasAIDesignerAccess(planCode)) {
    console.warn('Brand kit generation requires AI Designer access (Growth+ plan)');
    return null;
  }

  // In real implementation, this would call Gemini 3 Pro to generate brand colors
  // For now, return a template that could be customized
  const brandKit: BrandKit = {
    id: `bk_${tenantId}_${Date.now()}`,
    tenant_id: tenantId,
    name: brandName,
    primary_color: '#0d2a5c', // Synthex default
    secondary_color: '#347bf7', // Synthex default
    accent_color: '#ff5722', // Synthex default
    font_primary: 'Inter, sans-serif',
    font_secondary: 'Inter, sans-serif',
    logo_url: '',
    guidelines: `Brand guidelines for ${brandName} (${industry}): ${description}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to database
  const { data, error } = await supabaseAdmin
    .from('synthex_brand_kits')
    .insert(brandKit)
    .select()
    .single();

  if (error) {
    console.error('Failed to save brand kit:', error);
    return null;
  }

  return data as BrandKit;
}

/**
 * Get brand kit for tenant
 */
export async function getBrandKit(
  tenantId: string,
  brandKitId?: string
): Promise<BrandKit | null> {
  let query = supabaseAdmin
    .from('synthex_brand_kits')
    .select('*')
    .eq('tenant_id', tenantId);

  if (brandKitId) {
    query = query.eq('id', brandKitId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('Failed to fetch brand kit:', error);
    return null;
  }

  return data as BrandKit;
}

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

/**
 * Get visual generation stats for tenant
 */
export async function getVisualGenerationStats(tenantId: string): Promise<{
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  averageGenerationTime: number;
  totalCost: number;
  jobsByType: Record<string, number>;
}> {
  const { data: jobs, error } = await supabaseAdmin
    .from('synthex_visual_generation_jobs')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error || !jobs) {
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      pendingJobs: 0,
      averageGenerationTime: 0,
      totalCost: 0,
      jobsByType: {},
    };
  }

  const stats = {
    totalJobs: jobs.length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    failedJobs: jobs.filter((j) => j.status === 'failed').length,
    pendingJobs: jobs.filter((j) => j.status === 'pending').length,
    averageGenerationTime: 0,
    totalCost: 0,
    jobsByType: {} as Record<string, number>,
  };

  // Calculate aggregates
  let totalTime = 0;
  let completedCount = 0;

  for (const job of jobs) {
    // Count by type
    stats.jobsByType[job.job_type] = (stats.jobsByType[job.job_type] || 0) + 1;

    // Calculate average time
    if (job.result?.generation_time_ms) {
      totalTime += job.result.generation_time_ms;
      completedCount++;
    }

    // Sum costs
    if (job.result?.cost) {
      stats.totalCost += job.result.cost;
    }
  }

  if (completedCount > 0) {
    stats.averageGenerationTime = Math.round(totalTime / completedCount);
  }

  return stats;
}
