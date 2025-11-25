import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAvailableRewards, submitRedemptionRequest, getPendingRedemptionRequests } from '@/lib/loyalty/rewardCatalog';
import { getBalance } from '@/lib/loyalty/loyaltyEngine';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/rewards
 * Get available rewards for a workspace
 *
 * Query params:
 *   - workspaceId (required): Workspace ID
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await import('@/lib/supabase').then((m) => m.getSupabaseServer());
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = await getSupabaseAdmin();

    // Get user's current balance
    const balance = await getBalance(supabase, workspaceId, userId);

    // Get available rewards
    const rewards = await getAvailableRewards(
      supabase,
      workspaceId,
      balance?.balance
    );

    return NextResponse.json({
      rewards: rewards.map((reward) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        category: reward.category,
        creditCost: reward.creditCost.toString(),
        isActive: reward.isActive,
        dailyLimit: reward.dailyLimit?.toString() || null,
        metadata: reward.metadata,
      })),
      userBalance: balance?.balance.toString() || '0',
    });
  } catch (error) {
    console.error('[/api/loyalty/rewards] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/loyalty/rewards
 * Submit a redemption request
 *
 * Body:
 *   - workspaceId (required): Workspace ID
 *   - rewardId (required): Reward ID to redeem
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await import('@/lib/supabase').then((m) => m.getSupabaseServer());
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const { workspaceId, rewardId } = await request.json();

    if (!workspaceId || !rewardId) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, rewardId' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = await getSupabaseAdmin();

    // Submit redemption request
    const result = await submitRedemptionRequest(
      supabase,
      workspaceId,
      userId,
      rewardId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error('[/api/loyalty/rewards] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
