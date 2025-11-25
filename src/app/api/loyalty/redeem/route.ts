import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { redeemCredits } from '@/lib/loyalty/loyaltyEngine';
import { logLoyaltyEvent } from '@/lib/loyalty/loyaltyArchiveBridge';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/loyalty/redeem
 * Redeem credits for a reward (manual redemption by admin)
 *
 * Body:
 *   - workspaceId (required): Workspace ID
 *   - userId (required): User ID to redeem credits for
 *   - amount (required): Number of credits to redeem
 *   - rewardId (optional): Associated reward ID
 *
 * NOTE: This endpoint should only be callable by founders/admins
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

    const { workspaceId, userId, amount, rewardId } = await request.json();

    if (!workspaceId || !userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, userId, amount' },
        { status: 400 }
      );
    }

    // Verify founder access
    const supabase = await getSupabaseAdmin();
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', founderId)
      .eq('org_id', (
        await supabase
          .from('workspaces')
          .select('org_id')
          .eq('id', workspaceId)
          .single()
      ).data?.org_id)
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions to perform this action' },
        { status: 403 }
      );
    }

    // Redeem credits
    const result = await redeemCredits(
      supabase,
      workspaceId,
      userId,
      BigInt(amount),
      rewardId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Log event to archive
    await logLoyaltyEvent(supabase, {
      eventType: 'credit_redeemed',
      workspaceId,
      userId,
      details: {
        amount: amount,
        rewardId: rewardId || null,
        founderId,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      amountRedeemed: result.amountRedeemed?.toString(),
      newBalance: result.newBalance?.toString(),
      lifetimeRedeemed: result.lifetimeRedeemed?.toString(),
      message: result.message,
    });
  } catch (error) {
    console.error('[/api/loyalty/redeem] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
