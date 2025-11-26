/**
 * Synthex Video Orchestrator
 *
 * Orchestrates AI-powered video creation for Synthex.social
 * Coordinates VEO3 (primary), Gemini 3 Pro (script generation), + DALLE-3 (fallback)
 * for Synthex-specific video use cases.
 *
 * Supports:
 * - Short-form video creation (15-60 seconds)
 * - Auto-generated scripts from descriptions
 * - Video editing with effects and transitions
 * - Social media video optimization
 * - Video templates with brand customization
 */

import { supabaseAdmin } from '@/lib/supabase';
import {
  getVideoQuota,
  hasAIDesignerAccess,
} from './synthexOfferEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VideoGenerationJob {
  id: string;
  tenant_id: string;
  job_type: 'short_form' | 'promotional' | 'educational' | 'testimonial';
  status: 'pending' | 'script_generation' | 'video_creation' | 'editing' | 'completed' | 'failed';
  prompt: string;
  script?: string;
  context: {
    brand_name?: string;
    brand_colors?: string[];
    tone_voice?: string;
    duration_seconds?: number;
    platform?: string;
    background_music?: boolean;
    auto_captions?: boolean;
    effects?: string[];
  };
  preferred_model: 'veo3' | 'gemini_3_pro';
  fallback_models?: string[];
  result?: {
    model_used: string;
    output_url: string;
    thumbnail_url?: string;
    duration_ms: number;
    cost: number;
    generation_time_ms: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  error_message?: string;
}

export interface VideoTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  template_type: 'promotional' | 'educational' | 'testimonial' | 'showcase';
  script_template: string; // Template with {placeholders}
  visual_style: string; // Description of visual style
  recommended_duration: number; // seconds
  created_at: string;
  updated_at: string;
}

export interface VideoEditingOptions {
  add_music: boolean;
  music_track?: string;
  auto_captions: boolean;
  caption_style?: string;
  add_transitions: boolean;
  transition_style?: string;
  add_effects: boolean;
  effect_type?: string[];
  color_grading?: string;
  zoom_and_pan?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VIDEO_DURATION_OPTIONS = {
  short_form: { min: 15, max: 60, default: 30 }, // TikTok, Reels, Shorts
  promotional: { min: 30, max: 120, default: 60 },
  educational: { min: 120, max: 600, default: 300 },
  testimonial: { min: 30, max: 90, default: 60 },
};

const PLATFORM_RECOMMENDATIONS = {
  tiktok: { duration: 30, resolution: '1080x1920', fps: 30 },
  instagram_reels: { duration: 30, resolution: '1080x1920', fps: 30 },
  youtube_shorts: { duration: 60, resolution: '1080x1920', fps: 30 },
  youtube: { duration: 300, resolution: '1920x1080', fps: 30 },
  linkedin: { duration: 60, resolution: '1280x720', fps: 30 },
  facebook: { duration: 120, resolution: '1280x720', fps: 30 },
};

const SCRIPT_TEMPLATES = {
  promotional: `
SCENE 1 (0-5s): Hook
- Visual: {brand_name} logo with dynamic background
- Narration: "Tired of {pain_point}?"

SCENE 2 (5-15s): Problem
- Visual: Problem visualization
- Narration: "{problem_description}"

SCENE 3 (15-25s): Solution
- Visual: Product/service showcase
- Narration: "Introducing {solution_name}. {key_benefit}."

SCENE 4 (25-30s): CTA
- Visual: Logo with CTA overlay
- Narration: "Try it free today at {website}"
  `,

  educational: `
SCENE 1 (0-10s): Introduction
- Visual: Title card
- Narration: "In this video, you'll learn {topic}."

SCENE 2 (10-40s): Main Content
- Visual: Step-by-step demonstration
- Narration: "{main_content}"

SCENE 3 (40-50s): Key Takeaway
- Visual: Highlight key points
- Narration: "The main takeaway: {key_takeaway}"

SCENE 4 (50-60s): Call to Action
- Visual: Subscribe/Follow overlay
- Narration: "Subscribe for more {topic} tips!"
  `,

  testimonial: `
SCENE 1 (0-5s): Introduction
- Visual: Interviewee on camera
- Narration: "Hi, I'm {person_name} from {company}."

SCENE 2 (5-30s): Their Story
- Visual: Before/after or relevant imagery
- Narration: "{testimonial_content}"

SCENE 3 (30-45s): Results
- Visual: Results showcase (charts, metrics)
- Narration: "Here's what we achieved: {results}"

SCENE 4 (45-60s): Recommendation
- Visual: Direct to camera
- Narration: "I highly recommend {brand_name}."
  `,
};

// ============================================================================
// CORE ORCHESTRATION
// ============================================================================

/**
 * Generate video script from description
 */
export async function generateVideoScript(
  description: string,
  templateType: 'promotional' | 'educational' | 'testimonial' = 'promotional',
  duration: number = 60
): Promise<string> {
  // In production, this would call Gemini 3 Pro to generate scripts
  // For now, return a template-based approach
  const template = SCRIPT_TEMPLATES[templateType];

  // Extract key info from description and fill template
  const script = template
    .replace('{topic}', description.split('.')[0])
    .replace('{pain_point}', 'inefficient processes')
    .replace('{problem_description}', description)
    .replace('{solution_name}', 'our solution')
    .replace('{key_benefit}', 'saves you time and money')
    .replace('{website}', 'synthex.social')
    .replace('{main_content}', description)
    .replace('{key_takeaway}', 'optimization matters')
    .replace('{person_name}', 'Featured Customer')
    .replace('{company}', 'Your Company')
    .replace('{testimonial_content}', description)
    .replace('{results}', '300% increase in efficiency')
    .replace('{brand_name}', 'Synthex');

  return script;
}

/**
 * Create video generation job
 */
export async function createVideoJob(
  tenantId: string,
  planCode: string,
  jobType: VideoGenerationJob['job_type'],
  description: string,
  brandName: string,
  options?: Partial<VideoEditingOptions>
): Promise<VideoGenerationJob | null> {
  // Check quota
  const quota = getVideoQuota(planCode);
  if (quota === -1) {
    // Unlimited
  } else {
    const { data: queue } = await supabaseAdmin
      .from('synthex_visual_generation_queues')
      .select('videos_used_month')
      .eq('tenant_id', tenantId)
      .eq('plan_code', planCode)
      .single();

    if (queue && queue.videos_used_month >= quota) {
      console.error(`Video quota exceeded (${quota} per month)`);
      return null;
    }
  }

  // Check AI Designer access
  if (!hasAIDesignerAccess(planCode)) {
    console.error('Video creation requires AI Designer access (Growth+ plan)');
    return null;
  }

  // Generate script
  const script = await generateVideoScript(description, jobType);

  // Create job
  const { data: job, error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .insert({
      tenant_id: tenantId,
      job_type: jobType,
      status: 'pending',
      prompt: description,
      script,
      context: {
        brand_name: brandName,
        duration_seconds: VIDEO_DURATION_OPTIONS[jobType].default,
        background_music: options?.add_music ?? true,
        auto_captions: options?.auto_captions ?? true,
        effects: options?.effect_type ?? ['fade', 'zoom'],
      },
      preferred_model: 'veo3',
      fallback_models: ['gemini_3_pro'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create video job:', error);
    return null;
  }

  return job as VideoGenerationJob;
}

/**
 * Update video job status
 */
export async function updateVideoJobStatus(
  jobId: string,
  status: VideoGenerationJob['status'],
  progress?: {
    percentage: number;
    message: string;
  }
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update video job:', error);
    return false;
  }

  return true;
}

/**
 * Complete video job with result
 */
export async function completeVideoJob(
  jobId: string,
  result: {
    output_url: string;
    thumbnail_url?: string;
    duration_ms: number;
    cost: number;
    generation_time_ms: number;
    model_used: string;
  }
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .update({
      status: 'completed',
      result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to complete video job:', error);
    return false;
  }

  // Increment video quota usage
  const { data: job } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .select('tenant_id')
    .eq('id', jobId)
    .single();

  if (job) {
    await supabaseAdmin
      .from('synthex_visual_generation_queues')
      .update({
        videos_used_month: supabaseAdmin.rpc('increment', {
          x: 1,
          table: 'synthex_visual_generation_queues',
          column: 'videos_used_month',
        }),
      })
      .eq('tenant_id', job.tenant_id);
  }

  return true;
}

/**
 * Fail video job with error
 */
export async function failVideoJob(jobId: string, errorMessage: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to fail video job:', error);
    return false;
  }

  return true;
}

/**
 * Get video jobs for tenant
 */
export async function getVideoJobs(
  tenantId: string,
  limit: number = 20,
  status?: VideoGenerationJob['status']
): Promise<VideoGenerationJob[]> {
  let query = supabaseAdmin
    .from('synthex_video_generation_jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch video jobs:', error);
    return [];
  }

  return (data || []) as VideoGenerationJob[];
}

/**
 * Get video job by ID
 */
export async function getVideoJob(jobId: string): Promise<VideoGenerationJob | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Failed to fetch video job:', error);
    return null;
  }

  return data as VideoGenerationJob;
}

/**
 * Create or update video template
 */
export async function saveVideoTemplate(
  tenantId: string,
  name: string,
  template: Omit<VideoTemplate, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<VideoTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_video_templates')
    .insert({
      tenant_id: tenantId,
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save video template:', error);
    return null;
  }

  return data as VideoTemplate;
}

/**
 * Get video templates for tenant
 */
export async function getVideoTemplates(tenantId: string): Promise<VideoTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_video_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch video templates:', error);
    return [];
  }

  return (data || []) as VideoTemplate[];
}

/**
 * Get video generation statistics
 */
export async function getVideoGenerationStats(
  tenantId: string
): Promise<{
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  pendingVideos: number;
  averageGenerationTime: number;
  totalCost: number;
  videosByType: Record<string, number>;
}> {
  const { data: jobs, error } = await supabaseAdmin
    .from('synthex_video_generation_jobs')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error || !jobs) {
    return {
      totalVideos: 0,
      completedVideos: 0,
      failedVideos: 0,
      pendingVideos: 0,
      averageGenerationTime: 0,
      totalCost: 0,
      videosByType: {},
    };
  }

  const stats = {
    totalVideos: jobs.length,
    completedVideos: jobs.filter((j) => j.status === 'completed').length,
    failedVideos: jobs.filter((j) => j.status === 'failed').length,
    pendingVideos: jobs.filter((j) => j.status === 'pending' || j.status === 'script_generation' || j.status === 'video_creation').length,
    averageGenerationTime: 0,
    totalCost: 0,
    videosByType: {} as Record<string, number>,
  };

  let totalTime = 0;
  let completedCount = 0;

  for (const job of jobs) {
    // Count by type
    stats.videosByType[job.job_type] = (stats.videosByType[job.job_type] || 0) + 1;

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

/**
 * Get recommended platform settings for video type
 */
export function getVideoRecommendations(platform: string): {
  duration: number;
  resolution: string;
  fps: number;
  aspectRatio: string;
} {
  const settings = PLATFORM_RECOMMENDATIONS[platform as keyof typeof PLATFORM_RECOMMENDATIONS];

  return settings || PLATFORM_RECOMMENDATIONS.youtube;
}

/**
 * Validate video editing options
 */
export function validateVideoOptions(options: Partial<VideoEditingOptions>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.music_track && !options.add_music) {
    errors.push('Cannot specify music track if add_music is false');
  }

  if (options.caption_style && !options.auto_captions) {
    errors.push('Cannot specify caption style if auto_captions is false');
  }

  if (options.effect_type && options.effect_type.length > 5) {
    errors.push('Maximum 5 effects allowed per video');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
