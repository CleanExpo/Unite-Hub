/**
 * API Route: /api/campaigns/blueprints
 * GET: List blueprints with filters
 * POST: Create new blueprint from topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { blueprintEngine } from '@/lib/campaigns/multiChannelBlueprintEngine';
import { campaignEvaluator } from '@/lib/campaigns/campaignEvaluator';
import { getBrandChannels } from '@/lib/campaigns/channelPlaybooks';

const logger = createApiLogger({ route: '/api/campaigns/blueprints' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brandSlug = req.nextUrl.searchParams.get('brandSlug');
    const status = req.nextUrl.searchParams.get('status');
    const type = req.nextUrl.searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Get blueprints using helper function
    const { data: blueprints, error } = await supabase.rpc('get_campaign_blueprints', {
      p_workspace_id: workspaceId,
      p_brand_slug: brandSlug || null,
      p_status: status || null,
      p_type: type || null,
    });

    if (error) {
throw error;
}

    logger.info('Blueprints retrieved', { workspaceId, count: blueprints?.length || 0 });

    return NextResponse.json({ success: true, blueprints: blueprints || [] });
  } catch (error) {
    logger.error('Failed to list blueprints', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const {
      topicTitle,
      topicKeywords,
      brandSlug,
      blueprintType,
      primaryObjective,
      targetAudience,
      selectedChannels,
    } = body;

    // Validate required fields
    if (!topicTitle || !brandSlug || !blueprintType || !selectedChannels) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate channels for brand
    const allowedChannels = getBrandChannels(brandSlug);
    const invalidChannels = selectedChannels.filter((c: string) => !allowedChannels.includes(c));
    if (invalidChannels.length > 0) {
      return NextResponse.json({
        error: 'Invalid channels for brand',
        invalidChannels,
      }, { status: 400 });
    }

    // Generate blueprint using AI
    const blueprint = await blueprintEngine.generateBlueprint({
      topicTitle,
      topicKeywords: topicKeywords || [],
      brandSlug,
      workspaceId,
      blueprintType,
      primaryObjective: primaryObjective || 'engagement',
      targetAudience: targetAudience || {},
      selectedChannels,
    });

    // Evaluate campaign scores
    const evaluation = campaignEvaluator.evaluateCampaign({
      topicKeywords: topicKeywords || [],
      selectedChannels,
      brandSlug,
      analyticsInsights: blueprint.seo_recommendations,
    });

    // Insert blueprint into database
    const { data: insertedBlueprint, error: insertError } = await supabase
      .from('campaign_blueprints')
      .insert({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        topic_title: topicTitle,
        topic_keywords: topicKeywords || [],
        blueprint_title: blueprint.blueprint_title,
        blueprint_type: blueprintType,
        primary_objective: primaryObjective || 'engagement',
        target_audience: targetAudience || {},
        channels: blueprint.channels,
        website_content: blueprint.website_content,
        blog_content: blueprint.blog_content,
        social_content: blueprint.social_content,
        email_content: blueprint.email_content,
        video_content: blueprint.video_content,
        visual_concepts: blueprint.visual_concepts,
        vif_references: blueprint.vif_references,
        seo_recommendations: blueprint.seo_recommendations,
        difficulty_score: evaluation.difficulty_score,
        impact_score: evaluation.impact_score,
        effort_score: evaluation.effort_score,
        priority_score: evaluation.priority_score,
        uncertainty_notes: blueprint.uncertainty_notes,
        data_sources: blueprint.data_sources,
        ai_confidence_score: blueprint.ai_confidence_score,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
throw insertError;
}

    logger.info('Blueprint created', {
      blueprintId: insertedBlueprint.id,
      workspaceId,
      brandSlug,
      channels: selectedChannels.length,
    });

    return NextResponse.json({
      success: true,
      blueprint: insertedBlueprint,
      evaluation,
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create blueprint', { error });
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}
