import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getPendingRedemptionRequests } from '@/lib/loyalty/rewardCatalog';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/founder/redemption-queue
 * Get pending redemption requests for founder approval
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

    let founderId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      founderId = data.user.id;
    } else {
      const supabase = await import('@/lib/supabase').then((m) => m.getSupabaseServer());
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      founderId = data.user.id;
    }

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Verify founder access
    const supabase = await getSupabaseAdmin();
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', founderId)
      .eq(
        'org_id',
        (
          await supabase
            .from('workspaces')
            .select('org_id')
            .eq('id', workspaceId)
            .single()
        ).data?.org_id
      )
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions to view redemption queue' },
        { status: 403 }
      );
    }

    // Get pending redemption requests
    const pendingRequests = await getPendingRedemptionRequests(supabase, workspaceId);

    // Enrich with user and reward information
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (req) => {
        // Get user name
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', req.userId)
          .maybeSingle();

        // Get reward name
        const { data: reward } = await supabase
          .from('reward_catalog')
          .select('name')
          .eq('id', req.rewardId)
          .maybeSingle();

        return {
          id: req.id,
          userId: req.userId,
          userName: userProfile?.full_name || userProfile?.email || 'Unknown',
          rewardName: reward?.name || 'Unknown Reward',
          creditAmount: req.creditAmount.toString(),
          status: req.status,
          createdAt: req.createdAt,
          founderNotes: undefined,
        };
      })
    );

    return NextResponse.json({
      requests: enrichedRequests,
      total: enrichedRequests.length,
    });
  } catch (error) {
    console.error('[/api/loyalty/founder/redemption-queue] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
