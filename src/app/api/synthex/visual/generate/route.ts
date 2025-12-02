/**
 * POST /api/synthex/visual/generate
 *
 * Generate visual content (banners, social graphics, videos) for Synthex tenants
 *
 * Request body:
 * {
 *   tenantId: string
 *   brandKitId: string
 *   jobType: 'website_banner' | 'social_graphics' | 'video'
 *   prompt: string
 *   socialPlatform?: string (for social_graphics)
 * }
 *
 * Response:
 * {
 *   job: {
 *     id: string
 *     status: 'pending'
 *     job_type: string
 *     created_at: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  canGenerateVisual,
  recordVisualJob,
  generateWebsiteBanner,
  generateSocialGraphic,
  generateVideo,
  getBrandKit,
} from '@/lib/synthex/synthex-visual-orchestrator';

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandKitId, jobType, prompt, socialPlatform } = body;

    // Validate required fields
    if (!tenantId || !brandKitId || !jobType || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, brandKitId, jobType, prompt' },
        { status: 400 }
      );
    }

    // Validate job type
    const validJobTypes = ['website_banner', 'social_graphics', 'video', 'brand_kit'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get tenant subscription for plan code
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('subscription_plan_code')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const planCode = tenant.subscription_plan_code || 'launch';

    // Check if tenant can generate this type of visual
    const quota = await canGenerateVisual(tenantId, jobType, planCode);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason || 'Quota exceeded' },
        { status: 429 }
      );
    }

    // Get brand kit
    const brandKit = await getBrandKit(tenantId, brandKitId);
    if (!brandKit) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    let job;

    // Generate appropriate type of visual
    switch (jobType) {
      case 'website_banner':
        job = await generateWebsiteBanner(tenantId, planCode, brandKit, prompt);
        break;

      case 'social_graphics':
        if (!socialPlatform) {
          return NextResponse.json(
            { error: 'socialPlatform is required for social_graphics' },
            { status: 400 }
          );
        }

        const validPlatforms = [
          'instagram_feed',
          'instagram_story',
          'facebook_post',
          'twitter_post',
          'linkedin_post',
          'tiktok',
          'pinterest',
          'youtube_thumbnail',
        ];

        if (!validPlatforms.includes(socialPlatform)) {
          return NextResponse.json(
            { error: `Invalid socialPlatform. Must be one of: ${validPlatforms.join(', ')}` },
            { status: 400 }
          );
        }

        job = await generateSocialGraphic(
          tenantId,
          planCode,
          brandKit,
          socialPlatform as any,
          prompt
        );
        break;

      case 'video':
        job = await generateVideo(tenantId, planCode, brandKit, prompt);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported job type: ${jobType}` },
          { status: 400 }
        );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create visual generation job' },
        { status: 500 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error('Visual generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
