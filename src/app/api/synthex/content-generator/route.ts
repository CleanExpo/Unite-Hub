/**
 * Synthex Content Generator API
 * Generates social posts for all tiers (Starter: 10/week, Pro: 25/week, Elite: unlimited)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { socialPostGenerator, SocialPostRequest } from '@/lib/services/social-post-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, tier, industry, platform, brandVoice, contentType, scheduledFor } = body;

    // Validate required fields
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!tier || !['starter', 'professional', 'elite'].includes(tier)) {
      return NextResponse.json({ error: 'Valid tier is required (starter, professional, elite)' }, { status: 400 });
    }

    if (!industry) {
      return NextResponse.json({ error: 'industry is required' }, { status: 400 });
    }

    if (!platform || !['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'].includes(platform)) {
      return NextResponse.json({ error: 'Valid platform is required' }, { status: 400 });
    }

    // Validate user has access to workspace
    await validateUserAndWorkspace(req, workspaceId);

    // Generate post
    const request: SocialPostRequest = {
      workspaceId,
      tier,
      industry,
      platform,
      brandVoice,
      contentType,
      scheduledFor
    };

    const post = await socialPostGenerator.generatePost(request);

    return NextResponse.json({
      success: true,
      post
    }, { status: 200 });

  } catch (error: any) {
    console.error('Content generation error:', error);

    if (error.message?.includes('Weekly limit reached')) {
      return NextResponse.json({
        error: error.message,
        code: 'WEEKLY_LIMIT_REACHED'
      }, { status: 429 });
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate content',
      code: 'GENERATION_FAILED'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Validate user has access to workspace
    await validateUserAndWorkspace(req, workspaceId);

    // Get scheduled posts
    const posts = await socialPostGenerator.getScheduledPosts(workspaceId);

    return NextResponse.json({
      success: true,
      posts
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch scheduled posts:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch scheduled posts'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');
    const postId = searchParams.get('postId');

    if (!workspaceId || !postId) {
      return NextResponse.json({ error: 'workspaceId and postId are required' }, { status: 400 });
    }

    // Validate user has access to workspace
    await validateUserAndWorkspace(req, workspaceId);

    // Cancel post
    await socialPostGenerator.cancelPost(postId, workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Post cancelled successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to cancel post:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel post'
    }, { status: 500 });
  }
}
