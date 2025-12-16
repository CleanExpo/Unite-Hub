import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/synthex/library/visual/quota
 * Retrieve tier-specific visual library quotas and current usage
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const supabase = getSupabaseServer();

  // Get workspace tier
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('current_tier')
    .eq('id', workspaceId)
    .single();

  if (workspaceError) {
    return errorResponse(`Workspace not found: ${workspaceError.message}`, 404);
  }

  // Get tier limits including visual quotas
  const { data: tierLimits, error: tierError } = await supabase
    .from('synthex_tier_limits')
    .select(
      'tier, visual_images_monthly, visual_videos_monthly, visual_video_max_duration_seconds'
    )
    .eq('tier', workspace.current_tier)
    .single();

  if (tierError) {
    return errorResponse(`Failed to fetch tier limits: ${tierError.message}`, 500);
  }

  // Get current usage for this workspace
  const { data: usage, error: usageError } = await supabase
    .from('synthex_visual_library_usage')
    .select('images_generated, videos_generated, total_video_duration_seconds')
    .eq('workspace_id', workspaceId)
    .eq('period_date', new Date().toISOString().split('T')[0])
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    // PGRST116 = no rows found (expected for first use)
    return errorResponse(`Failed to fetch usage: ${usageError.message}`, 500);
  }

  const quotas = {
    tier: tierLimits.tier,
    images: {
      limit: tierLimits.visual_images_monthly || null,
      used: usage?.images_generated || 0,
      remaining: (tierLimits.visual_images_monthly || 0) - (usage?.images_generated || 0),
      period: 'monthly',
    },
    videos: {
      limit: tierLimits.visual_videos_monthly || null,
      used: usage?.videos_generated || 0,
      remaining: (tierLimits.visual_videos_monthly || 0) - (usage?.videos_generated || 0),
      period: 'monthly',
    },
    videoDuration: {
      limit: tierLimits.visual_video_max_duration_seconds || null,
      used: usage?.total_video_duration_seconds || 0,
      remaining: (tierLimits.visual_video_max_duration_seconds || 0) - (usage?.total_video_duration_seconds || 0),
      unit: 'seconds',
      period: 'per_video',
    },
  };

  return successResponse(quotas);
});
