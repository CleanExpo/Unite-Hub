/**
 * Synthex Studio Pod - Multi-Stage Content Synthesis
 * Week 4 - v2.0 Enhancement
 *
 * Orchestrates: Research → Script → Visual → Voice → Final Composite
 * Single API call synthesizes complete social media content
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { routeIntent } from '@/lib/ai/router/dynamic-router';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { getAnthropicClient } from '@/lib/anthropic/client';

export interface StudioJob {
  id: string;
  workspace_id: string;
  topic: string;
  platforms: string[];
  current_stage: 'research' | 'script' | 'visual' | 'voice' | 'completed' | 'failed';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage_results: Record<string, any>;
  final_output?: {
    video_urls: Record<string, string>;
    script: string;
    metadata: Record<string, any>;
  };
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  completed_at?: string;
}

interface StageResult {
  stage: string;
  success: boolean;
  duration_ms: number;
  data: any;
  error?: string;
}

/**
 * Execute complete studio pod pipeline
 */
export async function executeStudioPipeline(jobId: string): Promise<StudioJob | null> {
  const startTime = Date.now();

  try {
    // Load job
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('synthex_studio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('Failed to load studio job:', fetchError);
      return null;
    }

    console.log(`🎬 Starting studio pipeline for job ${jobId}: "${job.topic}"`);

    // Update status
    await updateJobStatus(jobId, 'processing');

    // Stage 1: Research
    const research = await executeStage(jobId, 'research', async () => {
      return await performResearch(job.topic);
    });

    if (!research.success) {
      await failJob(jobId, research.error || 'Research stage failed');
      return null;
    }

    // Stage 2: Script Generation
    const script = await executeStage(jobId, 'script', async () => {
      return await generateScript(job.topic, research.data, job.platforms);
    });

    if (!script.success) {
      await failJob(jobId, script.error || 'Script generation failed');
      return null;
    }

    // Stage 3: Visual Generation
    const visual = await executeStage(jobId, 'visual', async () => {
      return await generateVisuals(script.data, job.platforms);
    });

    if (!visual.success) {
      await failJob(jobId, visual.error || 'Visual generation failed');
      return null;
    }

    // Stage 4: Voice Generation
    const voice = await executeStage(jobId, 'voice', async () => {
      return await generateVoiceover(script.data.narration);
    });

    if (!voice.success) {
      await failJob(jobId, voice.error || 'Voice generation failed');
      return null;
    }

    // Final: Composite all stages
    const final = await executeStage(jobId, 'composite', async () => {
      return await compositeOutput(jobId, visual.data, voice.data, script.data);
    });

    if (!final.success) {
      await failJob(jobId, final.error || 'Composite failed');
      return null;
    }

    // Finalize job
    const duration = Date.now() - startTime;
    await completeJob(jobId, final.data, duration);

    console.log(`✨ Studio pipeline completed for job ${jobId} in ${duration}ms`);

    return (await supabaseAdmin
      .from('synthex_studio_jobs')
      .select('*')
      .eq('id', jobId)
      .single()).data as StudioJob;
  } catch (error) {
    console.error('Studio pipeline error:', error);
    await failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Stage 1: Research phase
 */
async function performResearch(topic: string): Promise<any> {
  console.log(`📚 Stage 1: Researching "${topic}"`);

  try {
    // Use seo_analysis intent for research
    const result = await routeIntent('seo_analysis', {
      messages: [
        {
          role: 'user' as const,
          content: `Research trending content hooks and insights for: ${topic}

Provide:
- Top 5 trending angles/hooks
- Audience pain points
- Recommended visual style
- Key talking points
- Target demographics`,
        },
      ],
      max_tokens: 2048,
    });

    return {
      insights: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Research failed:', error);
    throw error;
  }
}

/**
 * Stage 2: Script generation with Extended Thinking
 */
async function generateScript(
  topic: string,
  research: any,
  platforms: string[]
): Promise<any> {
  console.log(`📝 Stage 2: Generating script for platforms: ${platforms.join(', ')}`);

  try {
    const result = await routeIntent('extended_thinking', {
      messages: [
        {
          role: 'user' as const,
          content: `Generate a viral social video script based on this research:

Topic: ${topic}
Research: ${JSON.stringify(research, null, 2)}
Target Platforms: ${platforms.join(', ')}

Script must:
1. Start with compelling hook (first 3 seconds)
2. Address main pain point
3. Present solution/insight
4. Include CTA
5. Be optimized for each platform's ideal length

Provide JSON with:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "narration": "...",
  "visual_descriptions": ["..."],
  "timing": {...},
  "platform_variants": {...}
}`,
        },
      ],
      max_tokens: 4096,
    });

    // Extract JSON from result
    let scriptText = '';
    if (typeof result === 'object' && 'content' in result) {
      for (const block of (result as any).content) {
        if (block.type === 'text') {
          scriptText += block.text;
        }
      }
    } else {
      scriptText = String(result);
    }

    const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: scriptText };

    return {
      ...parsed,
      original_research: research,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Script generation failed:', error);
    throw error;
  }
}

/**
 * Stage 3: Visual generation (image and video)
 */
async function generateVisuals(script: any, platforms: string[]): Promise<any> {
  console.log(`🎨 Stage 3: Generating visuals for ${platforms.length} platforms`);

  try {
    const visuals: Record<string, any> = {};

    for (const platform of platforms) {
      // Use video_generation intent for multimodal synthesis
      const result = await routeIntent('video_generation', {
        prompt: script.visual_descriptions?.[0] || script.hook,
        duration: getPlatformDuration(platform),
        platforms: [platform],
      });

      visuals[platform] = {
        video_url: (result as any).video_url || (result as any).url,
        thumbnail_url: (result as any).thumbnail_url,
        duration_seconds: (result as any).duration_seconds,
        platform,
      };

      console.log(`  ✓ Generated visual for ${platform}`);
    }

    return {
      videos: visuals,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Visual generation failed:', error);
    throw error;
  }
}

/**
 * Stage 4: Voice generation (narration)
 */
async function generateVoiceover(narration: string): Promise<any> {
  console.log(`🎙️ Stage 4: Generating voiceover`);

  try {
    // For MVP, use text narration directly
    // TODO: Integrate ElevenLabs for actual voice synthesis
    // const elevenlabs = getElevenLabsClient();
    // const audio = await elevenlabs.textToSpeech({
    //   text: narration,
    //   voice_id: 'professional_female'
    // });

    return {
      narration_text: narration,
      audio_url: null, // TODO: ElevenLabs integration
      voice_id: 'professional_female',
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Voice generation failed:', error);
    throw error;
  }
}

/**
 * Final: Composite all stages into finished output
 */
async function compositeOutput(
  jobId: string,
  visuals: any,
  voice: any,
  script: any
): Promise<any> {
  console.log(`🎬 Finalizing: Compositing all stages`);

  try {
    // For MVP, return video URLs directly
    // TODO: Integrate FFmpeg for audio/video compositing

    return {
      job_id: jobId,
      final_videos: visuals.videos,
      narration: voice.narration_text,
      script,
      ready_to_post: true,
      quality_score: 0.85,
    };
  } catch (error) {
    console.error('Composite failed:', error);
    throw error;
  }
}

/**
 * Execute a pipeline stage with error handling and logging
 */
async function executeStage(
  jobId: string,
  stageName: string,
  stageFn: () => Promise<any>
): Promise<StageResult> {
  const stageStart = Date.now();

  try {
    console.log(`→ Executing stage: ${stageName}`);
    await updateJobStage(jobId, stageName);

    const data = await stageFn();
    const duration = Date.now() - stageStart;

    // Log stage completion
    await supabaseAdmin.from('synthex_studio_stage_logs').insert({
      studio_job_id: jobId,
      stage: stageName,
      status: 'completed',
      duration_ms: duration,
      output_data: data,
    });

    console.log(`  ✅ ${stageName} completed in ${duration}ms`);

    return {
      stage: stageName,
      success: true,
      duration_ms: duration,
      data,
    };
  } catch (error) {
    const duration = Date.now() - stageStart;

    // Log stage failure
    await supabaseAdmin.from('synthex_studio_stage_logs').insert({
      studio_job_id: jobId,
      stage: stageName,
      status: 'failed',
      duration_ms: duration,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    });

    console.error(`  ❌ ${stageName} failed:`, error);

    return {
      stage: stageName,
      success: false,
      duration_ms: duration,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update job status
 */
async function updateJobStatus(
  jobId: string,
  status: string
): Promise<void> {
  await supabaseAdmin
    .from('synthex_studio_jobs')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Update current stage
 */
async function updateJobStage(jobId: string, stage: string): Promise<void> {
  await supabaseAdmin
    .from('synthex_studio_jobs')
    .update({
      current_stage: stage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Mark job as completed
 */
async function completeJob(jobId: string, output: any, duration: number): Promise<void> {
  await supabaseAdmin
    .from('synthex_studio_jobs')
    .update({
      status: 'completed',
      current_stage: 'completed',
      final_output: output,
      stage_results: output,
      processing_time_ms: duration,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Mark job as failed
 */
async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await supabaseAdmin
    .from('synthex_studio_jobs')
    .update({
      status: 'failed',
      current_stage: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Get optimal video duration for platform
 */
function getPlatformDuration(platform: string): number {
  const durations: Record<string, number> = {
    tiktok: 15,
    instagram_reels: 30,
    youtube_shorts: 60,
    youtube: 300,
    linkedin: 60,
    facebook: 120,
  };

  return durations[platform] || 30;
}

/**
 * Create new studio job
 */
export async function createStudioJob(
  workspaceId: string,
  topic: string,
  platforms: string[]
): Promise<StudioJob | null> {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('synthex_studio_jobs')
      .insert({
        workspace_id: workspaceId,
        topic,
        platforms,
        status: 'pending',
        current_stage: 'research',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create studio job:', error);
      return null;
    }

    return job as StudioJob;
  } catch (error) {
    console.error('Error creating studio job:', error);
    return null;
  }
}

/**
 * Get studio job status
 */
export async function getStudioJob(jobId: string): Promise<StudioJob | null> {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('synthex_studio_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Failed to fetch studio job:', error);
      return null;
    }

    return job as StudioJob;
  } catch (error) {
    console.error('Error fetching studio job:', error);
    return null;
  }
}
